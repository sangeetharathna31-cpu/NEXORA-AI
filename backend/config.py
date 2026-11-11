import os
import secrets
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def _load_dotenv(path: Path) -> None:
    """Tiny .env loader (no extra dependency). Real environment variables win."""
    if not path.is_file():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


_load_dotenv(ROOT / ".env")


def _secret_key() -> str:
    env = os.environ.get("NEXORA_SECRET_KEY")
    if env:
        return env
    # No key configured: create one once and persist it so sessions survive restarts.
    f = ROOT / "instance" / "secret_key"
    f.parent.mkdir(exist_ok=True)
    if not f.exists():
        f.write_text(secrets.token_hex(32))
        try:
            f.chmod(0o600)
        except OSError:
            pass
    return f.read_text().strip()


class Config:
    SECRET_KEY = _secret_key()
    DATABASE = os.environ.get("NEXORA_DB", str(ROOT / "instance" / "nexora.db"))
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = os.environ.get("NEXORA_COOKIE_SECURE", "0") == "1"  # set 1 behind HTTPS
    PERMANENT_SESSION_LIFETIME = 60 * 60 * 24 * 90
    MAX_MESSAGE_CHARS = 2000
    RATE_LIMIT_PER_MIN = int(os.environ.get("NEXORA_RATE_LIMIT", "60"))
    FRONTEND_DIST = os.environ.get("NEXORA_FRONTEND_DIST", str(ROOT / "frontend" / "dist"))
