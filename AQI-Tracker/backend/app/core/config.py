from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import List

try:
    from dotenv import load_dotenv
except Exception:
    load_dotenv = None


def _project_root() -> Path:
    return Path(__file__).resolve().parents[3]


if load_dotenv is not None:
    load_dotenv(_project_root() / ".env")


class Settings:
    app_name: str = "AQI Tracker"
    app_version: str = os.environ.get("AQI_TRACKER_VERSION", "2.2.0")
    environment: str = os.environ.get("AQI_TRACKER_ENV", "local")
    api_timeout_seconds: float = float(os.environ.get("AQI_API_TIMEOUT_SECONDS", "4.0"))
    cache_default_ttl_seconds: int = int(os.environ.get("AQI_CACHE_TTL_SECONDS", "300"))
    rate_limit_requests: int = int(os.environ.get("AQI_RATE_LIMIT_REQUESTS", "90"))
    rate_limit_window_seconds: int = int(os.environ.get("AQI_RATE_LIMIT_WINDOW_SECONDS", "60"))

    def __init__(self) -> None:
        self.waqi_api_token = os.environ.get("WAQI_API_TOKEN", "").strip()
        self.gemini_api_key = os.environ.get("GEMINI_API_KEY", "").strip()
        self.gemini_model = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash").strip() or "gemini-1.5-flash"
        self.nominatim_user_agent = os.environ.get(
            "NOMINATIM_USER_AGENT",
            "AQI-Tracker/2.2 (local-dev@example.com)",
        ).strip() or "AQI-Tracker/2.2 (local-dev@example.com)"

    @property
    def project_root(self) -> Path:
        return _project_root()

    @property
    def backend_root(self) -> Path:
        return Path(__file__).resolve().parents[2]

    @property
    def frontend_root(self) -> Path:
        return self.project_root / "frontend"

    @property
    def cors_origins(self) -> List[str]:
        raw = os.environ.get("AQI_CORS_ORIGINS", "").strip()
        if raw:
            return [item.strip() for item in raw.split(",") if item.strip()]
        return [
            "http://127.0.0.1:8000",
            "http://localhost:8000",
            "http://127.0.0.1:5500",
            "http://localhost:5500",
            "http://127.0.0.1:5501",
            "http://localhost:5501",
            "http://127.0.0.1:3000",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://localhost:5173",
        ]


def mask_secret(value: str | None) -> str | None:
    if not value:
        return None
    if len(value) <= 8:
        return "****"
    return f"{value[:4]}…{value[-4:]}"


@lru_cache
def get_settings() -> Settings:
    return Settings()
