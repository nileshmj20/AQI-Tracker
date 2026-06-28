from __future__ import annotations

from fastapi import APIRouter, Query

from app.models.schemas import WeatherResponse
from app.services.weather_service import get_weather

router = APIRouter(prefix="/api", tags=["weather"])


@router.get("/weather", response_model=WeatherResponse)
async def weather(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
) -> WeatherResponse:
    return await get_weather(lat, lon)
