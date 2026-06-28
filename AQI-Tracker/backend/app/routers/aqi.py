from __future__ import annotations

from fastapi import APIRouter, Query

from app.models.schemas import AqiResponse, ForecastResponse
from app.services.aqi_service import get_current_aqi, get_forecast

router = APIRouter(prefix="/api", tags=["aqi"])


@router.get("/aqi", response_model=AqiResponse)
async def current_aqi(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
) -> AqiResponse:
    return await get_current_aqi(lat, lon)


@router.get("/forecast", response_model=ForecastResponse)
async def forecast(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    days: int = Query(4, ge=1, le=7),
) -> ForecastResponse:
    return await get_forecast(lat, lon, days)
