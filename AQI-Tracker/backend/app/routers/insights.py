from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from fastapi import APIRouter, Query

from app.models.schemas import ReverseGeocodeResponse, SnapshotResponse, StructuredInsights
from app.services.aqi_service import get_current_aqi, get_forecast
from app.services.cache import cache
from app.services.geocode_service import reverse_geocode
from app.services.history_service import record_snapshot
from app.services.insights_service import generate_insights, rule_based_insights
from app.services.weather_service import get_weather

router = APIRouter(prefix="/api", tags=["snapshot"])


@router.get("/snapshot", response_model=SnapshotResponse)
async def snapshot(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    name: str | None = Query(None, max_length=180),
) -> SnapshotResponse:
    clean_name = _clean_name(name, lat, lon)
    key = ("snapshot", round(lat, 4), round(lon, 4), clean_name)
    cached = cache.get(key)
    if cached is not None:
        return cached

    reverse_task = None if clean_name else asyncio.create_task(_safe_reverse(lat, lon))
    aqi_task = asyncio.create_task(get_current_aqi(lat, lon))
    weather_task = asyncio.create_task(get_weather(lat, lon))
    forecast_task = asyncio.create_task(get_forecast(lat, lon, 7))

    aqi, weather, forecast = await asyncio.gather(aqi_task, weather_task, forecast_task)
    place_name = clean_name
    if reverse_task is not None:
        place = await reverse_task
        place_name = place.display_name if place else f"{lat:.4f}, {lon:.4f}"

    insights = await generate_insights(aqi, weather, forecast)
    response = SnapshotResponse(
        latitude=lat,
        longitude=lon,
        location_name=place_name,
        observed_at=datetime.now(timezone.utc),
        aqi=aqi,
        weather=weather,
        forecast=forecast,
        insights=insights,
    )
    cache.set(key, response, ttl_seconds=45)
    asyncio.create_task(record_snapshot(response))
    return response


@router.get("/insights", response_model=StructuredInsights)
async def insights(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
) -> StructuredInsights:
    aqi, weather, forecast = await asyncio.gather(get_current_aqi(lat, lon), get_weather(lat, lon), get_forecast(lat, lon, 7))
    return await generate_insights(aqi, weather, forecast)


async def _safe_reverse(lat: float, lon: float) -> ReverseGeocodeResponse | None:
    try:
        return await asyncio.wait_for(reverse_geocode(lat, lon), timeout=0.9)
    except Exception:
        return None


def _clean_name(value: str | None, lat: float, lon: float) -> str | None:
    if not value:
        return None
    text = " ".join(value.strip().split())
    if not text:
        return None
    coordinate_text = f"{lat:.3f}, {lon:.3f}"
    return None if text == coordinate_text else text[:180]
