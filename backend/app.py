"""NEXORA AI backend: Flask API around the ported Python-chatbot engine."""
from __future__ import annotations

import hmac
import re
import secrets
import time
import uuid
from collections import defaultdict, deque
from pathlib import Path

from flask import Flask, abort, jsonify, request, send_from_directory, session

from config import Config
from db import get_db, init_db
from engine import Engine

UUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")


def create_app(overrides: dict | None = None) -> Flask:
    app = Flask(__name__, static_folder=None)
    app.config.from_object(Config)
    if overrides:
        app.config.update(overrides)
    init_db(app)
    engine = Engine()
    hits: dict[str, deque] = defaultdict(deque)

    # ---------- helpers ----------
    def error(msg: str, code: int):
        return jsonify({"error": msg}), code

    def visitor_id() -> str:
        """Anonymous, signed-cookie identity. FILE 1 had no accounts, so conversations are
        scoped to the browser session; every query below filters on this id (IDOR guard)."""
        vid = session.get("vid")
        if not vid:
            vid = str(uuid.uuid4())
            session["vid"] = vid
            session["csrf"] = secrets.token_urlsafe(32)
            session.permanent = True
        if "csrf" not in session:
            session["csrf"] = secrets.token_urlsafe(32)
        db = get_db()
        db.execute("INSERT OR IGNORE INTO visitors(id) VALUES (?)", (vid,))
        db.commit()
        return vid

    def owned_conversation(cid: str, vid: str):
        if not UUID_RE.match(cid or ""):
            abort(404)
        row = get_db().execute(
            "SELECT * FROM conversations WHERE id=? AND visitor_id=?", (cid, vid)
        ).fetchone()
        if row is None:
            abort(404)  # 404 (not 403) so ids of other users' chats are not confirmable
        return row

    def conv_json(r):
        out = {k: r[k] for k in ("id", "title", "created_at", "updated_at")}
        if "message_count" in r.keys():
            out["message_count"] = r["message_count"]
            out["preview"] = re.sub(r"\s+", " ", r["preview"]).strip()[:90]  # single line for list UIs
        return out

    def msg_json(r):
        return {k: r[k] for k in ("id", "role", "content", "topic", "created_at")}

    LIST_SQL = """
      SELECT c.*, (SELECT COUNT(*) FROM messages m WHERE m.conversation_id=c.id) AS message_count,
             COALESCE((SELECT substr(content,1,110) FROM messages m WHERE m.conversation_id=c.id
                       AND m.role='assistant' ORDER BY m.id LIMIT 1), '') AS preview
      FROM conversations c WHERE c.visitor_id=? """

    # ---------- guards ----------
    @app.before_request
    def guard():
        if not request.path.startswith("/api/"):
            return None
        if request.method in ("POST", "PUT", "PATCH", "DELETE"):
            if request.mimetype != "application/json" and request.content_length:
                return error("Content-Type must be application/json", 415)
            token = request.headers.get("X-CSRF-Token", "")
            expected = session.get("csrf", "")
            if not expected or not hmac.compare_digest(token, expected):
                return error("Missing or invalid CSRF token", 403)
        return None

    @app.after_request
    def headers(resp):
        resp.headers.setdefault("X-Content-Type-Options", "nosniff")
        resp.headers.setdefault("X-Frame-Options", "DENY")
        resp.headers.setdefault("Referrer-Policy", "same-origin")
        if request.path.startswith("/api/"):
            resp.headers["Cache-Control"] = "no-store"
        return resp

    @app.errorhandler(404)
    def nf(_e):
        if request.path.startswith("/api/"):
            return error("Not found", 404)
        return _e

    @app.errorhandler(500)
    def ise(_e):
        return error("Internal server error", 500)

    # ---------- API ----------
    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "topics": len(engine.kb)})

    @app.get("/api/session")
    def get_session():
        vid = visitor_id()
        row = get_db().execute("SELECT display_name FROM visitors WHERE id=?", (vid,)).fetchone()
        return jsonify({"csrf_token": session["csrf"], "display_name": row["display_name"],
                        "max_message_chars": app.config["MAX_MESSAGE_CHARS"]})

    @app.put("/api/profile")
    def put_profile():
        vid = visitor_id()
        name = ((request.get_json(silent=True) or {}).get("display_name") or "").strip()
        if not 1 <= len(name) <= 40:
            return error("Display name must be 1-40 characters", 400)
        get_db().execute("UPDATE visitors SET display_name=? WHERE id=?", (name, vid))
        get_db().commit()
        return jsonify({"display_name": name})

    @app.get("/api/topics")
    def topics():
        return jsonify({"topics": engine.topics()})

    @app.get("/api/conversations")
    def list_conversations():
        vid = visitor_id()
        rows = get_db().execute(LIST_SQL + "ORDER BY c.updated_at DESC, c.rowid DESC", (vid,)).fetchall()
        return jsonify({"conversations": [conv_json(r) for r in rows]})

    @app.post("/api/conversations")
    def create_conversation():
        vid = visitor_id()
        cid = str(uuid.uuid4())
        get_db().execute("INSERT INTO conversations(id,visitor_id,title) VALUES (?,?,?)",
                         (cid, vid, "New conversation"))
        get_db().commit()
        row = get_db().execute("SELECT * FROM conversations WHERE id=?", (cid,)).fetchone()
        return jsonify({"conversation": conv_json(row)}), 201

    @app.get("/api/conversations/<cid>")
    def get_conversation(cid):
        vid = visitor_id()
        conv = owned_conversation(cid, vid)
        msgs = get_db().execute("SELECT * FROM messages WHERE conversation_id=? ORDER BY id", (cid,)).fetchall()
        return jsonify({"conversation": conv_json(conv), "messages": [msg_json(m) for m in msgs]})

    @app.delete("/api/conversations/<cid>")
    def delete_conversation(cid):
        vid = visitor_id()
        owned_conversation(cid, vid)
        get_db().execute("DELETE FROM conversations WHERE id=? AND visitor_id=?", (cid, vid))
        get_db().commit()
        return jsonify({"deleted": cid})

    @app.delete("/api/conversations")
    def delete_all():
        """User-initiated 'Delete history' from the UI. Only ever touches the caller's own rows."""
        vid = visitor_id()
        cur = get_db().execute("DELETE FROM conversations WHERE visitor_id=?", (vid,))
        get_db().commit()
        return jsonify({"deleted": cur.rowcount})

    @app.post("/api/chat")
    def chat():
        vid = visitor_id()
        now = time.monotonic()
        q = hits[vid]
        while q and now - q[0] > 60:
            q.popleft()
        if len(q) >= app.config["RATE_LIMIT_PER_MIN"]:
            return error("Too many messages. Please wait a moment.", 429)
        q.append(now)

        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return error("Invalid JSON body", 400)
        text = data.get("message")
        if not isinstance(text, str) or not text.strip():
            return error("Message must be a non-empty string", 400)
        text = text.strip()
        if len(text) > app.config["MAX_MESSAGE_CHARS"]:
            return error(f"Message too long (max {app.config['MAX_MESSAGE_CHARS']} characters)", 413)

        db = get_db()
        cid = data.get("conversation_id")
        if cid:
            owned_conversation(cid, vid)
        else:
            cid = str(uuid.uuid4())
            title = re.sub(r"\s+", " ", text)[:48]
            db.execute("INSERT INTO conversations(id,visitor_id,title) VALUES (?,?,?)", (cid, vid, title))

        result = engine.reply(text)
        cur = db.execute("INSERT INTO messages(conversation_id,role,content) VALUES (?,?,?)", (cid, "user", text))
        user_id = cur.lastrowid
        cur = db.execute("INSERT INTO messages(conversation_id,role,content,topic) VALUES (?,?,?,?)",
                         (cid, "assistant", result["text"], result["topic"]))
        asst_id = cur.lastrowid
        db.execute("UPDATE conversations SET updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?", (cid,))
        db.commit()
        conv = db.execute(LIST_SQL + "AND c.id=?", (vid, cid)).fetchone()
        um = db.execute("SELECT * FROM messages WHERE id=?", (user_id,)).fetchone()
        am = db.execute("SELECT * FROM messages WHERE id=?", (asst_id,)).fetchone()
        return jsonify({"conversation": conv_json(conv), "user_message": msg_json(um),
                        "assistant_message": msg_json(am)})

    @app.get("/api/search")
    def search():
        vid = visitor_id()
        qtxt = (request.args.get("q") or "").strip()[:100]
        if not qtxt:
            return jsonify({"results": []})
        like = "%" + qtxt.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"
        rows = get_db().execute(
            LIST_SQL + """AND (c.title LIKE ? ESCAPE '\\' OR EXISTS (SELECT 1 FROM messages m
               WHERE m.conversation_id=c.id AND m.content LIKE ? ESCAPE '\\'))
               ORDER BY c.updated_at DESC LIMIT 50""", (vid, like, like)).fetchall()
        return jsonify({"results": [conv_json(r) for r in rows]})

    # ---------- built frontend (production) ----------
    @app.get("/", defaults={"path": ""})
    @app.get("/<path:path>")
    def spa(path):
        dist = Path(app.config["FRONTEND_DIST"])
        if path.startswith("api/"):
            abort(404)
        if not dist.is_dir():
            return error("Frontend not built. Run `npm run build` in frontend/ or use the Vite dev server.", 404)
        target = (dist / path).resolve()
        if path and target.is_file() and dist.resolve() in target.parents:
            return send_from_directory(dist, path)
        return send_from_directory(dist, "index.html")

    return app


if __name__ == "__main__":
    import os
    create_app().run(host=os.environ.get("NEXORA_HOST", "127.0.0.1"),
                     port=int(os.environ.get("NEXORA_PORT", "5000")), debug=False)
