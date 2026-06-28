from __future__ import annotations

import asyncio
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.core.config import get_settings
from app.models.schemas import HistoryPoint, HistoryResponse, SnapshotResponse


def _db_path() -> Path:
    path = get_settings().backend_root / "data" / "history.db"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(_db_path())
    conn.row_factory = sqlite3.Row
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            observed_at TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            location_name TEXT,
            aqi INTEGER,
            aqi_band TEXT,
            dominant_pollutant TEXT,
            temperature REAL,
            weather_label TEXT
        )
        """
    )
    conn.execute("CREATE INDEX IF NOT EXISTS idx_snapshots_location_time ON snapshots(latitude, longitude, observed_at)")
    return conn


def _snap_value(snapshot: SnapshotResponse) -> dict[str, Any]:
    current = snapshot.weather.current if snapshot.weather else None
    dominant = snapshot.aqi.dominant_pollutant if snapshot.aqi else None
    band = snapshot.aqi.band if snapshot.aqi else None
    return {
        "observed_at": snapshot.observed_at.isoformat(),
        "latitude": round(float(snapshot.latitude), 3),
        "longitude": round(float(snapshot.longitude), 3),
        "location_name": snapshot.location_name,
        "aqi": snapshot.aqi.aqi if snapshot.aqi else None,
        "aqi_band": band.label if band else None,
        "dominant_pollutant": dominant.label if dominant else None,
        "temperature": current.temperature_2m if current else None,
        "weather_label": current.weather_label if current else None,
    }


def _record_snapshot_sync(snapshot: SnapshotResponse) -> None:
    data = _snap_value(snapshot)
    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO snapshots (observed_at, latitude, longitude, location_name, aqi, aqi_band, dominant_pollutant, temperature, weather_label)
            VALUES (:observed_at, :latitude, :longitude, :location_name, :aqi, :aqi_band, :dominant_pollutant, :temperature, :weather_label)
            """,
            data,
        )


async def record_snapshot(snapshot: SnapshotResponse) -> None:
    try:
        await asyncio.to_thread(_record_snapshot_sync, snapshot)
    except Exception:
        return


def _get_history_sync(lat: float, lon: float, days: int, name: str | None) -> HistoryResponse:
    rounded_lat = round(float(lat), 3)
    rounded_lon = round(float(lon), 3)
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT
                substr(observed_at, 1, 10) AS date,
                AVG(aqi) AS average_aqi,
                COUNT(*) AS count,
                MIN(aqi) AS min_aqi,
                MAX(aqi) AS max_aqi,
                dominant_pollutant AS dominant_pollutant,
                weather_label AS weather_label
            FROM snapshots
            WHERE latitude = ? AND longitude = ? AND observed_at >= datetime('now', ?)
            GROUP BY substr(observed_at, 1, 10)
            ORDER BY date ASC
            """,
            (rounded_lat, rounded_lon, f"-{int(days)} days"),
        ).fetchall()
    points = [
        HistoryPoint(
            date=row["date"],
            average_aqi=round(float(row["average_aqi"]), 1) if row["average_aqi"] is not None else None,
            count=int(row["count"] or 0),
            min_aqi=int(row["min_aqi"]) if row["min_aqi"] is not None else None,
            max_aqi=int(row["max_aqi"]) if row["max_aqi"] is not None else None,
            dominant_pollutant=row["dominant_pollutant"],
            weather_label=row["weather_label"],
        )
        for row in rows
    ]
    return HistoryResponse(
        latitude=rounded_lat,
        longitude=rounded_lon,
        location_name=name,
        days=days,
        generated_at=datetime.now(timezone.utc),
        points=points,
    )


async def get_history(lat: float, lon: float, days: int = 7, name: str | None = None) -> HistoryResponse:
    days = max(1, min(int(days), 90))
    return await asyncio.to_thread(_get_history_sync, lat, lon, days, name)
