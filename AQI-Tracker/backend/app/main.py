from __future__ import annotations

import asyncio
import logging
import os
import sys
import threading
import time
import urllib.request
import webbrowser
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import get_settings
from app.core.startup_checks import get_last_report, print_terminal_report, run_startup_checks
from app.routers import aqi, disasters, geocode, globe, health, history, insights, radio, reports, weather
from app.services.http_client import close_client


class ApiRateLimiter:
    def __init__(self, requests: int, window_seconds: int) -> None:
        self.requests = requests
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def allow(self, key: str) -> tuple[bool, int]:
        now = time.monotonic()
        bucket = self._hits[key]
        while bucket and now - bucket[0] > self.window_seconds:
            bucket.popleft()
        if len(bucket) >= self.requests:
            retry = max(1, int(self.window_seconds - (now - bucket[0])))
            return False, retry
        bucket.append(now)
        return True, 0


settings = get_settings()
rate_limiter = ApiRateLimiter(settings.rate_limit_requests, settings.rate_limit_window_seconds)


def is_verbose_terminal() -> bool:
    return os.environ.get("AQI_TRACKER_VERBOSE") == "1"


@asynccontextmanager
async def lifespan(app: FastAPI):
    startup_check_task = None if get_last_report() is not None else asyncio.create_task(run_startup_checks())
    try:
        yield
    finally:
        if startup_check_task is not None:
            if not startup_check_task.done():
                startup_check_task.cancel()
            else:
                try:
                    startup_check_task.result()
                except Exception as exc:
                    if is_verbose_terminal():
                        print(f"Startup self-check failed: {exc}")
                    else:
                        print("Startup self-check could not complete. Dashboard will still open in hybrid mode.")
        await close_client()


app = FastAPI(title=settings.app_name, version=settings.app_version, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.middleware("http")
async def api_rate_limit(request: Request, call_next):
    if request.url.path.startswith("/api/"):
        client_ip = request.client.host if request.client else "unknown"
        allowed, retry_after = rate_limiter.allow(client_ip)
        if not allowed:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many API requests. Please slow down and try again shortly."},
                headers={"Retry-After": str(retry_after)},
            )
    return await call_next(request)


app.include_router(health.router)
app.include_router(aqi.router)
app.include_router(weather.router)
app.include_router(disasters.router)
app.include_router(geocode.router)
app.include_router(insights.router)
app.include_router(globe.router)
app.include_router(history.router)
app.include_router(reports.router)
app.include_router(radio.router)


def index_file_response() -> FileResponse:
    return FileResponse(settings.frontend_root / "index.html", media_type="text/html")


@app.get("/", include_in_schema=False)
async def index():
    return index_file_response()


@app.get("/index.html", include_in_schema=False)
async def index_html():
    return index_file_response()


@app.get("/frontend/index.html", include_in_schema=False)
async def frontend_index_html():
    return index_file_response()


app.mount("/frontend", StaticFiles(directory=settings.frontend_root, html=True), name="frontend_prefixed")
app.mount("/", StaticFiles(directory=settings.frontend_root, html=True), name="frontend")


def _open_browser_when_ready(url: str) -> None:
    if os.environ.get("AQI_TRACKER_NO_BROWSER") == "1":
        return

    health_url = f"{url.rstrip('/')}/api/health"

    def waiter() -> None:
        for _ in range(80):
            try:
                with urllib.request.urlopen(health_url, timeout=0.35) as response:
                    if response.status < 500:
                        webbrowser.open(url)
                        return
            except Exception:
                time.sleep(0.25)
        webbrowser.open(url)

    threading.Thread(target=waiter, daemon=True).start()


async def _run_terminal_preflight():
    report = await run_startup_checks()
    await close_client()
    return report


def run_dev_server(host: str = "127.0.0.1", port: int = 8000, *, open_browser: bool = True) -> None:
    url = f"http://{host}:{port}"
    verbose = is_verbose_terminal()

    logging.getLogger("uvicorn").setLevel(logging.INFO if verbose else logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO if verbose else logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO if verbose else logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)

    try:
        report = asyncio.run(_run_terminal_preflight())
    except Exception as exc:
        report = None
        print(f"\nAQI Tracker preflight could not complete: {exc}\n")
    if report is not None:
        print_terminal_report(report, url)
    else:
        print(f"\nAQI Tracker server is starting\nDashboard  {url}\nHealth API  {url.rstrip('/')}/api/health/deep\nPress CTRL+C to stop.\n")

    if open_browser:
        _open_browser_when_ready(url)

    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=False,
        access_log=verbose,
        log_level="info" if verbose else "warning",
    )

if __name__ == "__main__":
    run_dev_server()
