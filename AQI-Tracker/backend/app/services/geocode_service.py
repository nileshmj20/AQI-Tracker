from __future__ import annotations

import asyncio
import time
from datetime import datetime, timezone
from typing import Any

from app.core.config import get_settings
from app.models.schemas import ApiError, LocationResult, LocationSearchResponse, ReverseGeocodeResponse
from app.services.cache import cache
from app.services.http_client import ExternalServiceError, get_json

_reverse_lock = asyncio.Lock()
_last_reverse_at = 0.0


async def search_locations(query: str, count: int = 8) -> LocationSearchResponse:
    query = query.strip()
    if not query:
        return LocationSearchResponse(query=query, results=[])
    key = ("geocode-search", query.lower(), count)
    cached = cache.get(key)
    if cached is not None:
        return cached
    data = await get_json(
        "https://geocoding-api.open-meteo.com/v1/search",
        provider="Open-Meteo Geocoding",
        params={"name": query, "count": count, "language": "en", "format": "json"},
    )
    results = []
    for item in data.get("results") or []:
        parts = [item.get("name"), item.get("admin1"), item.get("country")]
        display = ", ".join(str(part) for part in parts if part)
        results.append(
            LocationResult(
                name=item.get("name") or "Unknown",
                latitude=float(item.get("latitude")),
                longitude=float(item.get("longitude")),
                country=item.get("country"),
                admin1=item.get("admin1"),
                timezone=item.get("timezone"),
                population=item.get("population"),
                display_name=display,
            )
        )
    response = LocationSearchResponse(query=query, results=results)
    cache.set(key, response, ttl_seconds=86400)
    return response


async def reverse_geocode(lat: float, lon: float) -> ReverseGeocodeResponse:
    key = ("reverse", round(lat, 3), round(lon, 3))
    cached = cache.get(key)
    if cached is not None:
        return cached

    global _last_reverse_at
    settings = get_settings()
    async with _reverse_lock:
        elapsed = time.monotonic() - _last_reverse_at
        if elapsed < 1.05:
            await asyncio.sleep(1.05 - elapsed)
        _last_reverse_at = time.monotonic()
        try:
            data = await get_json(
                "https://nominatim.openstreetmap.org/reverse",
                provider="Nominatim Reverse Geocoding",
                params={"lat": lat, "lon": lon, "format": "jsonv2", "zoom": 10, "addressdetails": 1},
                headers={"User-Agent": settings.nominatim_user_agent},
                retries=1,
            )
        except ExternalServiceError as exc:
            response = ReverseGeocodeResponse(
                latitude=lat,
                longitude=lon,
                display_name=f"{lat:.4f}, {lon:.4f}",
                error=ApiError(code="REVERSE_GEOCODE_UNAVAILABLE", message=str(exc), provider=exc.provider),
            )
            cache.set(key, response, ttl_seconds=60)
            return response

    address: dict[str, Any] = data.get("address") or {}
    city = address.get("city") or address.get("town") or address.get("village") or address.get("state")
    response = ReverseGeocodeResponse(
        latitude=lat,
        longitude=lon,
        display_name=data.get("display_name") or f"{lat:.4f}, {lon:.4f}",
        city=city,
        country=address.get("country"),
        address=address,
    )
    cache.set(key, response, ttl_seconds=86400)
    return response
