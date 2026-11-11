"""Python port of the original python_chatbot.html answer engine.

The tokenizer, stemmer, stop-word list, IDF weighting, scoring, tie-breaking
and MIN_SCORE threshold are ported 1:1 from the JavaScript so that the same
question yields the same topic. Parity is enforced by tests/test_engine.py.
"""
from __future__ import annotations

import json
import math
import re
from pathlib import Path

KB_PATH = Path(__file__).with_name("knowledge_base.json")

STOP = set(
    "a an the is are was were be to of in on for and or how do does can i you me my it "
    "with tell explain about please give show us use using used this that when why which "
    "there any some python what whats define mean meaning".split()
)
MIN_SCORE = 0.15
_TOKEN_RE = re.compile(r"[a-z0-9_*=@\-]+")


def stem(w: str) -> str:
    if len(w) <= 3:
        return w
    if w.endswith("ies"):
        return w[:-3] + "y"
    if re.search(r"(sses|ches|shes|xes)$", w):
        return w[:-2]
    if w.endswith("ing") and len(w) > 5:
        return w[:-3]
    if w.endswith("s") and not w.endswith("ss"):
        return w[:-1]
    return w


def tokenize(text: str) -> list[str]:
    return [stem(w) for w in _TOKEN_RE.findall(text.lower()) if w not in STOP]


def _js_round(x: float) -> int:
    return math.floor(x + 0.5)  # JS Math.round semantics (half up)


class Engine:
    def __init__(self, kb: list[dict] | None = None):
        self.kb = kb if kb is not None else json.loads(KB_PATH.read_text(encoding="utf-8"))
        self.docs = [tokenize(e["keywords"] + " " + e["topic"]) for e in self.kb]
        self.topic_terms = [set(tokenize(e["topic"])) for e in self.kb]
        df: dict[str, int] = {}
        for d in self.docs:
            for t in set(d):
                df[t] = df.get(t, 0) + 1
        self.idf = {t: math.log((len(self.docs) + 1) / (n + 1)) + 1 for t, n in df.items()}

    def _score(self, q: list[str], d: list[str]) -> float:
        if not q:
            return 0.0
        ds = set(d)
        matched = total = 0.0
        for t in dict.fromkeys(q):  # unique, order preserved
            total += self.idf.get(t, 1.5)
            if t in ds:
                matched += self.idf.get(t, 0)
        return matched / total if total else 0.0

    def find(self, question: str) -> dict | None:
        q = tokenize(question)
        if not q and re.search("python", question, re.I):
            q = ["introduction"]
        qs = set(q)
        ranked = []
        for i, d in enumerate(self.docs):
            t = self.topic_terms[i]
            cover = len([x for x in t if x in qs]) / len(t) if t else 0
            s = _js_round(self._score(q, d) * 1e6) / 1e6
            ranked.append((-s, -cover, len(d), i))  # same order as the JS comparator; stable on ties
        ranked.sort()
        best = ranked[0]
        if -best[0] < MIN_SCORE:
            return None
        return self.kb[best[3]]

    def topics(self) -> list[str]:
        return [e["topic"] for e in self.kb]

    def reply(self, question: str) -> dict:
        """Return {'text': markdown-ish answer, 'topic': str|None, 'matched': bool}."""
        lower = question.strip().lower()
        if lower in ("hi", "hello", "hey"):
            return {"topic": None, "matched": True,
                    "text": "Hello! Ask me a Python question, e.g. What is a list?"}
        if lower in ("topics", "help"):
            return {"topic": None, "matched": True,
                    "text": "I can answer about:\n" + "\n".join("• " + t for t in self.topics())}
        hit = self.find(question)
        if hit:
            return {"topic": hit["topic"], "matched": True, "text": hit["answer"]}
        return {"topic": None, "matched": False,
                "text": "Sorry, I don't have an answer for that yet. Type topics to see what I know."}
