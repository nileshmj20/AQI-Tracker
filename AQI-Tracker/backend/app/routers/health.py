from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.config import get_settings
from app.core.startup_checks import get_last_report, run_startup_checks
from app.models.schemas import DeepHealthResponse, HealthResponse

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    settings = get_settings()
    report = get_last_report()
    status = "ok" if report is None or report.ok else "degraded"
    return HealthResponse(ok=status == "ok", status=status, checked_at=datetime.now(timezone.utc), version=settings.app_version)


@router.get("/health/deep", response_model=DeepHealthResponse)
async def deep_health() -> DeepHealthResponse:
    return await run_startup_checks()
