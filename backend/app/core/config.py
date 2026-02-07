import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env or .env.local from backend root
base_dir = Path(__file__).resolve().parent.parent.parent
local_env = base_dir / ".env.local"
default_env = base_dir / ".env"

# Always load .env first
if default_env.exists():
    load_dotenv(dotenv_path=default_env)

# Then override with .env.local if it exists
if local_env.exists():
    load_dotenv(dotenv_path=local_env, override=True)
else:
    # If no local env exists, ensure we have a fallback for DATABASE_URL if not set
    pass

class Settings:
    PROJECT_NAME: str = "Relivo Organization Portal"
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME", "").strip()
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD", "").strip()
    MAIL_SERVER: str = os.getenv("MAIL_SERVER", "").strip()
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", 2525))
    MAIL_FROM: str = os.getenv("MAIL_FROM", "").strip()

settings = Settings()
