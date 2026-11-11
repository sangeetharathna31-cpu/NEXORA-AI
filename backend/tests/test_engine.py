import json, sys, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from engine import Engine


class EngineParity(unittest.TestCase):
    """Every case below was produced by running the ORIGINAL JavaScript from python_chatbot.html."""
    def test_matches_original_js(self):
        e = Engine()
        cases = json.loads((Path(__file__).parent / "js_parity.json").read_text())
        self.assertGreater(len(cases), 20)
        for q, expected in cases:
            hit = e.find(q)
            self.assertEqual(hit["topic"] if hit else None, expected, f"mismatch for {q!r}")

    def test_kb_complete(self):
        self.assertEqual(len(Engine().kb), 27)

    def test_greeting_topics_and_fallback(self):
        e = Engine()
        self.assertIn("Hello", e.reply("hi")["text"])
        self.assertEqual(e.reply("topics")["text"].count("•"), 27)
        r = e.reply("qwerty asdf")
        self.assertFalse(r["matched"])


if __name__ == "__main__":
    unittest.main()
