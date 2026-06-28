from __future__ import annotations

from fastapi import APIRouter, Query

from app.models.schemas import LocationSearchResponse, ReverseGeocodeResponse
from app.services.geocode_service import reverse_geocode, search_locations

router = APIRouter(prefix="/api/geocode", tags=["geocode"])


@router.get("/search", response_model=LocationSearchResponse)
async def search(q: str = Query(..., min_length=2, max_length=80), count: int = Query(8, ge=1, le=12)) -> LocationSearchResponse:
    return await search_locations(q, count)


@router.get("/reverse", response_model=ReverseGeocodeResponse)
async def reverse(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
) -> ReverseGeocodeResponse:
    return await reverse_geocode(lat, lon)
