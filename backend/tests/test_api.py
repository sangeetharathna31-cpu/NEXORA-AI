import sys, tempfile, unittest, os
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app import create_app


class Client:
    def __init__(self, app):
        self.c = app.test_client()
        self.csrf = self.c.get("/api/session").get_json()["csrf_token"]

    def req(self, method, url, json=None, csrf=True):
        h = {"X-CSRF-Token": self.csrf} if csrf else {}
        return getattr(self.c, method)(url, json=json, headers=h)


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = os.path.join(self.tmp.name, "t.db")
        self.app = create_app({"DATABASE": self.db, "TESTING": True, "RATE_LIMIT_PER_MIN": 1000})
        self.a = Client(self.app)

    def tearDown(self):
        self.tmp.cleanup()

    def test_health(self):
        self.assertEqual(self.a.req("get", "/api/health").get_json()["status"], "ok")

    def test_chat_returns_real_answer_and_persists(self):
        r = self.a.req("post", "/api/chat", {"message": "What is a list?"})
        self.assertEqual(r.status_code, 200)
        d = r.get_json()
        self.assertEqual(d["assistant_message"]["topic"], "Lists")
        self.assertIn("ordered, mutable", d["assistant_message"]["content"])
        cid = d["conversation"]["id"]
        r2 = self.a.req("post", "/api/chat", {"message": "Explain decorators", "conversation_id": cid})
        self.assertEqual(r2.get_json()["conversation"]["id"], cid)
        hist = self.a.req("get", f"/api/conversations/{cid}").get_json()
        self.assertEqual([m["role"] for m in hist["messages"]], ["user", "assistant"] * 2)
        import sqlite3  # data is really on disk, not just in memory
        con = sqlite3.connect(self.db)
        self.assertEqual(con.execute("SELECT COUNT(*) FROM messages WHERE conversation_id=?", (cid,)).fetchone()[0], 4)
        con.close()
        lst = self.a.req("get", "/api/conversations").get_json()["conversations"]
        self.assertEqual(len(lst), 1)
        self.assertEqual(lst[0]["message_count"], 4)

    def test_preview_is_single_line(self):
        self.a.req("post", "/api/chat", {"message": "How do I handle errors?"})
        prev = self.a.req("get", "/api/conversations").get_json()["conversations"][0]["preview"]
        self.assertNotIn("\n", prev)
        self.assertNotIn("  ", prev)

    def test_new_conversation(self):
        r = self.a.req("post", "/api/conversations", {})
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.get_json()["conversation"]["title"], "New conversation")

    def test_csrf_required(self):
        self.assertEqual(self.a.req("post", "/api/chat", {"message": "hi"}, csrf=False).status_code, 403)
        self.a.csrf = "wrong"
        self.assertEqual(self.a.req("delete", "/api/conversations").status_code, 403)

    def test_validation(self):
        for bad in [{}, {"message": ""}, {"message": "   "}, {"message": 5}, {"message": ["x"]}]:
            self.assertEqual(self.a.req("post", "/api/chat", bad).status_code, 400, bad)
        self.assertEqual(self.a.req("post", "/api/chat", {"message": "x" * 2001}).status_code, 413)
        self.assertEqual(self.a.req("post", "/api/chat", {"message": "hi", "conversation_id": "../etc"}).status_code, 404)

    def test_idor_isolated_between_visitors(self):
        cid = self.a.req("post", "/api/chat", {"message": "What is a tuple?"}).get_json()["conversation"]["id"]
        b = Client(self.app)
        self.assertEqual(b.req("get", f"/api/conversations/{cid}").status_code, 404)
        self.assertEqual(b.req("delete", f"/api/conversations/{cid}").status_code, 404)
        self.assertEqual(b.req("post", "/api/chat", {"message": "hi", "conversation_id": cid}).status_code, 404)
        self.assertEqual(b.req("get", "/api/conversations").get_json()["conversations"], [])
        self.assertEqual(b.req("get", "/api/search?q=tuple").get_json()["results"], [])
        b.req("delete", "/api/conversations")  # B clearing history must not touch A
        self.assertEqual(len(self.a.req("get", "/api/conversations").get_json()["conversations"]), 1)

    def test_search_and_delete(self):
        self.a.req("post", "/api/chat", {"message": "What is a dictionary?"})
        self.assertEqual(len(self.a.req("get", "/api/search?q=dictionar").get_json()["results"]), 1)
        self.assertEqual(self.a.req("get", "/api/search?q=%25").get_json()["results"], [])  # LIKE wildcard escaped
        cid = self.a.req("get", "/api/conversations").get_json()["conversations"][0]["id"]
        self.assertEqual(self.a.req("delete", f"/api/conversations/{cid}").status_code, 200)
        self.assertEqual(self.a.req("get", f"/api/conversations/{cid}").status_code, 404)

    def test_sql_injection_is_inert(self):
        r = self.a.req("post", "/api/chat", {"message": "'; DROP TABLE messages;--"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(self.a.req("post", "/api/chat", {"message": "loops"}).status_code, 200)

    def test_rate_limit(self):
        app = create_app({"DATABASE": os.path.join(self.tmp.name, "r.db"), "TESTING": True, "RATE_LIMIT_PER_MIN": 2})
        c = Client(app)
        codes = [c.req("post", "/api/chat", {"message": "loops"}).status_code for _ in range(3)]
        self.assertEqual(codes, [200, 200, 429])

    def test_profile(self):
        self.assertEqual(self.a.req("put", "/api/profile", {"display_name": "Asha"}).status_code, 200)
        self.assertEqual(self.a.req("get", "/api/session").get_json()["display_name"], "Asha")
        self.assertEqual(self.a.req("put", "/api/profile", {"display_name": ""}).status_code, 400)

    def test_security_headers_and_no_secret_leak(self):
        r = self.a.req("get", "/api/health")
        self.assertEqual(r.headers["X-Content-Type-Options"], "nosniff")
        self.assertNotIn(self.app.config["SECRET_KEY"], r.get_data(as_text=True))


if __name__ == "__main__":
    unittest.main()
