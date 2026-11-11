# NEXORA AI — integrated application

```
nexora-ai/
├── backend/                 Python (Flask) API + chatbot engine
│   ├── app.py               API, sessions, CSRF, ownership checks, serves built UI
│   ├── engine.py            1:1 Python port of python_chatbot.html's answer engine
│   ├── knowledge_base.json  the 27 Q&A entries, extracted verbatim from the original
│   ├── db.py / config.py    SQLite schema, environment config
│   ├── requirements.txt
│   └── tests/               15 unit/API tests (unittest) incl. parity with the original JS
├── frontend/                NEXORA AI UI (React 19 + Vite + Tailwind 4) – design untouched
│   └── src/App.tsx, api.ts  UI now driven by the real backend
├── .env.example
└── README.md
```

## What was integrated (and an important caveat)

`python_chatbot.html` turned out to be a **self-contained browser page**, not a Python server: a
27-entry knowledge base plus a TF-IDF-style keyword matcher written in JavaScript. It has no
backend, API, database, authentication, or LLM. So "FILE 1" was integrated as follows:

* **Its real logic is preserved**: the tokenizer, stemmer, stop-words, IDF scoring, tie-breaking and
  0.15 threshold were ported to Python (`engine.py`); answers come from the same knowledge base.
  A test replays 28 questions against outputs captured from the *original JavaScript* and requires
  identical topics.
* **A minimal backend was added** because the NEXORA UI needs one (conversations, history, search):
  Flask + SQLite. Nothing from FILE 1 was deleted or weakened, as it had none of these features.
* **No LLM/API key is involved**, so there is nothing secret in the frontend. If you actually have a
  separate Python project with AI/auth/DB, send it: `engine.reply()` is the single place to swap in.

## Setup

Requirements: Python 3.10+, Node 20+ (22 recommended), npm or pnpm.

```bash
# 1. Backend
cd backend
python3 -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example ../.env                              # optional; set NEXORA_SECRET_KEY
python app.py                                           # http://127.0.0.1:5000

# 2. Frontend (new terminal)
cd frontend
npm install            # or: pnpm install
npm run dev            # http://localhost:5173  (proxies /api -> :5000)
```
Open **http://localhost:5173**.

**Single-process production mode:** `cd frontend && npm run build`, then run `python backend/app.py`
and open http://127.0.0.1:5000 (Flask serves `frontend/dist`). Set `NEXORA_COOKIE_SECURE=1` behind HTTPS
and use a real WSGI server (e.g. `pip install waitress && waitress-serve --call app:create_app`
from `backend/`).

## Tests
```bash
cd backend && python -m unittest discover -s tests -v
```

## Security model
* Identity is an anonymous, signed, `HttpOnly`, `SameSite=Lax` session cookie. **FILE 1 had no accounts,
  so there is no login**; history is tied to the browser session.
* Every conversation query filters on the session's id (IDOR-safe; foreign ids return 404).
* CSRF: all state-changing calls require an `X-CSRF-Token` matching the session.
* Input validation (type, 1–2000 chars, UUID ids), parameterised SQL only, LIKE wildcards escaped,
  per-session rate limit, `nosniff`/`X-Frame-Options`/`no-store` headers.
* Schema uses `CREATE TABLE IF NOT EXISTS`; existing data is never altered. "Delete history" in the
  UI only deletes the caller's own rows, after confirmation.

## Known limitations
* No user accounts/login (none existed). Clearing cookies orphans a browser's history.
* Answers are limited to the 27 topics (it is a keyword matcher, not an LLM).
* Removed because they cannot work against this backend: **Regenerate** (deterministic engine would
  return the same answer), **attachments** (button shown disabled), and the fake email/about/photo
  profile fields. Settings toggles and 👍/👎 are UI-local (browser storage / session only).
* Sidebar per-chat "⋯" icon became a trash icon (delete with confirmation).
