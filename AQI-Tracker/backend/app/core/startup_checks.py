from __future__ import annotations

import asyncio
import time
from datetime import datetime, timezone
from typing import List

from app.core.config import get_settings, mask_secret
from app.models.schemas import DeepHealthResponse, HealthServiceStatus
from app.services.http_client import ExternalServiceError, get_json

_last_report: DeepHealthResponse | None = None


async def run_startup_checks() -> DeepHealthResponse:
    global _last_report
    services: List[HealthServiceStatus] = []
    settings = get_settings()
    checks = [
        _check_open_meteo_weather(),
        _check_open_meteo_aqi(),
        _check_waqi(settings.waqi_api_token),
        _check_gemini(settings.gemini_api_key, settings.gemini_model),
    ]
    results = await asyncio.gather(*checks, return_exceptions=True)
    for result in results:
        if isinstance(result, HealthServiceStatus):
            services.append(result)
        else:
            services.append(
                HealthServiceStatus(
                    name="Startup check",
                    status="FAIL",
                    message=str(result) or result.__class__.__name__,
                )
            )
    report = DeepHealthResponse(
        ok=all(service.status in {"OK", "WARN"} for service in services),
        checked_at=datetime.now(timezone.utc),
        services=services,
    )
    _last_report = report
    return report


def get_last_report() -> DeepHealthResponse | None:
    return _last_report


def print_terminal_report(report: DeepHealthResponse, url: str) -> None:
    settings = get_settings()
    env_path = settings.project_root / ".env"
    env_status = "Loaded" if env_path.exists() else "Missing"
    width = 78
    line = "═" * width
    thin = "─" * width
    print(f"\n╔{line}╗")
    print(_box_line("AQI Tracker server is starting", width))
    print(_box_line(f"Version {settings.app_version} · Environment {settings.environment}", width))
    print(f"╠{thin}╣")
    print(_box_line(f"Dashboard  {url}", width))
    print(_box_line(f"Health API  {url.rstrip('/')}/api/health/deep", width))
    print(_box_line(f"Env file   {env_status} · {env_path.name}", width))
    print(f"╠{thin}╣")
    print(_box_line("Live service checks", width))
    for service in report.services:
        icon = _status_icon(service.status)
        latency = f"{service.latency_ms}ms" if service.latency_ms is not None else "n/a"
        key = f" · key {service.masked_key}" if service.masked_key else ""
        text = f"{icon} {service.name:<24} {service.status:<4} · {latency:<7} · {service.message}{key}"
        print(_box_line(text, width))
    print(f"╠{thin}╣")
    overall = "All required checks passed" if report.ok else "Some checks need attention"
    print(_box_line(f"Status     {overall}", width))
    print(_box_line("Press CTRL+C to stop the server", width))
    print(f"╚{line}╝\n")


def _box_line(text: str, width: int) -> str:
    clean = text[: width - 2]
    return f"║ {clean:<{width - 2}} ║"


def _status_icon(status: str) -> str:
    return {"OK": "✅", "WARN": "⚠️ ", "FAIL": "❌"}.get(status, "• ")


async def _timed(name: str, coro, fail_status: str = "FAIL") -> HealthServiceStatus:
    started = time.perf_counter()
    try:
        message = await coro
        status = "OK"
    except ExternalServiceError as exc:
        message = str(exc)
        status = fail_status
    except Exception as exc:
        message = str(exc) or exc.__class__.__name__
        status = fail_status
    latency_ms = int((time.perf_counter() - started) * 1000)
    return HealthServiceStatus(name=name, status=status, message=message, latency_ms=latency_ms)


async def _check_open_meteo_weather() -> HealthServiceStatus:
    async def run() -> str:
        await get_json(
            "https://api.open-meteo.com/v1/forecast",
            provider="Open-Meteo Weather",
            params={"latitude": 28.6139, "longitude": 77.2090, "current": "temperature_2m"},
            retries=0,
        )
        return "Weather API connected"
    return await _timed("Open-Meteo Weather", run(), "WARN")


async def _check_open_meteo_aqi() -> HealthServiceStatus:
    async def run() -> str:
        await get_json(
            "https://air-quality-api.open-meteo.com/v1/air-quality",
            provider="Open-Meteo Air Quality",
            params={"latitude": 28.6139, "longitude": 77.2090, "current": "us_aqi"},
            retries=0,
        )
        return "Air quality API connected"
    return await _timed("Open-Meteo Air Quality", run(), "WARN")


async def _check_waqi(token: str) -> HealthServiceStatus:
    if not token:
        return HealthServiceStatus(name="WAQI", status="WARN", message="Token missing in .env", masked_key=None)
    started = time.perf_counter()
    try:
        data = await get_json(
            "https://api.waqi.info/feed/geo:28.6139;77.2090/",
            provider="WAQI",
            params={"token": token},
            retries=0,
        )
        if data.get("status") == "ok":
            status = "OK"
            message = "API key connected"
        else:
            status = "FAIL"
            message = f"API key returned {data.get('status', 'unknown')}"
    except ExternalServiceError as exc:
        status = "FAIL"
        message = str(exc)
    return HealthServiceStatus(
        name="WAQI",
        status=status,
        message=message,
        masked_key=mask_secret(token),
        latency_ms=int((time.perf_counter() - started) * 1000),
    )


async def _check_gemini(api_key: str, model: str = "gemini-1.5-flash") -> HealthServiceStatus:
    if not api_key:
        return HealthServiceStatus(name="Gemini", status="WARN", message="Key missing in .env", masked_key=None)
    started = time.perf_counter()
    try:
        data = await get_json(
            "https://generativelanguage.googleapis.com/v1beta/models",
            provider="Gemini",
            params={"key": api_key},
            retries=0,
        )
        model_names = {item.get("name", "").split("/")[-1] for item in data.get("models", [])}
        status = "OK" if not model_names or model in model_names else "WARN"
        message = f"API key connected · model {model}" if status == "OK" else f"Key connected · model {model} not listed"
    except ExternalServiceError as exc:
        status = "FAIL"
        message = str(exc)
    return HealthServiceStatus(
        name="Gemini",
        status=status,
        message=message,
        masked_key=mask_secret(api_key),
        latency_ms=int((time.perf_counter() - started) * 1000),
    )
