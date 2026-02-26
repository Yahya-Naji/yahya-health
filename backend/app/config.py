"""Application settings loaded from environment / .env file."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
    )

    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4o"

    DATA_DIR: Path = _BACKEND_DIR / "data"
    RESULTS_DIR: Path = _BACKEND_DIR / "results"
    LOG_DIR: Path = _BACKEND_DIR / "logs"


settings = Settings()
