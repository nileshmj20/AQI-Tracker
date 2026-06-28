from __future__ import annotations

from fastapi import APIRouter

from app.models.schemas import GlobeHotspotsResponse
from app.services.aqi_service import get_globe_hotspots

router = APIRouter(prefix="/api/globe", tags=["globe"])


@router.get("/hotspots", response_model=GlobeHotspotsResponse)
async def hotspots() -> GlobeHotspotsResponse:
    return await get_globe_hotspots()
