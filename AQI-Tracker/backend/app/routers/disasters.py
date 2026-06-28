from __future__ import annotations

from fastapi import APIRouter, Query

from app.services.disaster_service import get_disaster_watch

router = APIRouter(prefix="/api", tags=["disaster-watch"])


@router.get("/disasters")
async def disasters(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    name: str | None = Query(None, max_length=180),
) -> dict:
    return await get_disaster_watch(lat, lon, name)
