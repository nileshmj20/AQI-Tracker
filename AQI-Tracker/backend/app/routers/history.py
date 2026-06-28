from __future__ import annotations

from fastapi import APIRouter, Query

from app.models.schemas import HistoryResponse
from app.services.history_service import get_history

router = APIRouter(prefix="/api", tags=["history"])


@router.get("/history", response_model=HistoryResponse)
async def history(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    days: int = Query(7, ge=1, le=90),
    name: str | None = Query(None, max_length=180),
) -> HistoryResponse:
    return await get_history(lat, lon, days=days, name=name)
