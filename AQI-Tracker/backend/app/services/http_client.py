from __future__ import annotations

import asyncio
from typing import Any, Dict, Optional

import httpx

from app.core.config import get_settings


class ExternalServiceError(RuntimeError):
    def __init__(self, provider: str, message: str, status_code: int | None = None) -> None:
        super().__init__(message)
        self.provider = provider
        self.status_code = status_code


_client: httpx.AsyncClient | None = None


def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        settings = get_settings()
        timeout = httpx.Timeout(settings.api_timeout_seconds, connect=2.0)
        _client = httpx.AsyncClient(timeout=timeout, follow_redirects=True)
    return _client


async def close_client() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


async def get_json(
    url: str,
    *,
    provider: str,
    params: Optional[Dict[str, Any]] = None,
    headers: Optional[Dict[str, str]] = None,
    retries: int = 1,
) -> Dict[str, Any]:
    client = get_client()
    delays = [0.35, 0.9]
    last_error: Exception | None = None

    for attempt in range(retries + 1):
        try:
            response = await client.get(url, params=params, headers=headers)
            if response.status_code >= 500 and attempt < retries:
                await asyncio.sleep(delays[min(attempt, len(delays) - 1)])
                continue
            if response.status_code >= 400:
                raise ExternalServiceError(provider, f"{provider} returned HTTP {response.status_code}", response.status_code)
            return response.json()
        except (httpx.RequestError, httpx.DecodingError) as exc:
            last_error = exc
            if attempt < retries:
                await asyncio.sleep(delays[min(attempt, len(delays) - 1)])
                continue
            raise ExternalServiceError(provider, f"{provider} request failed: {str(exc) or exc.__class__.__name__}") from exc

    raise ExternalServiceError(provider, f"{provider} request failed: {last_error}")
