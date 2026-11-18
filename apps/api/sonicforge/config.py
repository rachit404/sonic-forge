"""Application configuration — all settings loaded from environment."""
from __future__ import annotations

import os
from pathlib import Path
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    log_level: str = "info"

    projects_root: Path = Field(default_factory=lambda: Path.home() / "sonicforge-projects")
    models_cache_dir: Path = Field(default_factory=lambda: Path.home() / ".sonicforge" / "models")

    database_url: str = "sqlite+aiosqlite:///./sonicforge.db"

    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/1"

    huggingface_api_key: str = ""
    cors_origins: list[str] = ["http://localhost:5173"]

    @field_validator("projects_root", "models_cache_dir", mode="before")
    @classmethod
    def expand_path(cls, v: str | Path | None) -> Path:
        if not v:
            return Path.home() / "sonicforge-projects"
        return Path(str(v)).expanduser().resolve()

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"


settings = Settings()

try:
    settings.projects_root.mkdir(parents=True, exist_ok=True)
    settings.models_cache_dir.mkdir(parents=True, exist_ok=True)
except Exception:
    pass
