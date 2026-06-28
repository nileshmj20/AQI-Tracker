from __future__ import annotations

from fastapi import APIRouter, Query

from app.services.radio_service import get_radio_stations

router = APIRouter(prefix="/api/radio", tags=["radio"])


@router.get("/stations")
async def stations(
    q: str | None = Query(None, max_length=80),
    countrycode: str = Query("IN", min_length=2, max_length=2),
    limit: int = Query(12, ge=4, le=24),
) -> dict:
    return await get_radio_stations(q=q, countrycode=countrycode, limit=limit)
