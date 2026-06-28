from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any

from app.services.cache import cache
from app.services.http_client import ExternalServiceError, get_json


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return default if value is None else float(value)
    except (TypeError, ValueError):
        return default


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        return default if value is None else int(float(value))
    except (TypeError, ValueError):
        return default


def distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return radius * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _risk_from_earthquake(magnitude: float, distance: float) -> str:
    if magnitude >= 6.5 and distance <= 800:
        return "Critical"
    if magnitude >= 5.5 and distance <= 500:
        return "High"
    if magnitude >= 4.5 and distance <= 300:
        return "Moderate"
    return "Low"


def _overall_label(score: int) -> str:
    if score >= 80:
        return "Critical"
    if score >= 55:
        return "High"
    if score >= 30:
        return "Moderate"
    return "Low"


async def get_disaster_watch(lat: float, lon: float, name: str | None = None) -> dict[str, Any]:
    key = ("disaster-watch", round(lat, 3), round(lon, 3), name or "")
    cached = cache.get(key)
    if cached is not None:
        return cached

    earthquakes: list[dict[str, Any]] = []
    natural_events: list[dict[str, Any]] = []
    errors: list[str] = []

    try:
        quakes = await get_json(
            "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson",
            provider="USGS Earthquake Feed",
            retries=1,
        )
        for feature in (quakes.get("features") or [])[:500]:
            props = feature.get("properties") or {}
            coords = (feature.get("geometry") or {}).get("coordinates") or []
            if len(coords) < 2:
                continue
            qlon, qlat = _safe_float(coords[0]), _safe_float(coords[1])
            mag = _safe_float(props.get("mag"), 0)
            dist = distance_km(lat, lon, qlat, qlon)
            if dist <= 1800 or mag >= 5.5:
                earthquakes.append({
                    "title": props.get("title") or props.get("place") or "Earthquake event",
                    "place": props.get("place") or "Location unavailable",
                    "magnitude": round(mag, 1),
                    "distance_km": round(dist),
                    "time": props.get("time"),
                    "url": props.get("url"),
                    "risk": _risk_from_earthquake(mag, dist),
                    "tsunami": bool(props.get("tsunami")),
                    "latitude": qlat,
                    "longitude": qlon,
                })
        earthquakes.sort(key=lambda item: (item["risk"] == "Low", item["distance_km"], -item["magnitude"]))
    except ExternalServiceError as exc:
        errors.append(f"{exc.provider}: {exc}")

    try:
        span = 12
        bbox = f"{lon-span},{lat-span},{lon+span},{lat+span}"
        events = await get_json(
            "https://eonet.gsfc.nasa.gov/api/v3/events",
            provider="NASA EONET",
            params={"status": "open", "limit": 20, "bbox": bbox},
            retries=1,
        )
        for item in events.get("events") or []:
            categories = ", ".join((cat.get("title") or cat.get("id") or "Event") for cat in item.get("categories") or []) or "Natural event"
            geometries = item.get("geometry") or []
            glon = lon
            glat = lat
            if geometries:
                coords = geometries[-1].get("coordinates") or []
                if isinstance(coords, list) and len(coords) >= 2 and isinstance(coords[0], (int, float)):
                    glon, glat = _safe_float(coords[0], lon), _safe_float(coords[1], lat)
            natural_events.append({
                "title": item.get("title") or "Natural event",
                "category": categories,
                "distance_km": round(distance_km(lat, lon, glat, glon)),
                "date": (geometries[-1].get("date") if geometries else None),
                "source": "NASA EONET",
                "url": item.get("link"),
                "latitude": glat,
                "longitude": glon,
            })
        natural_events.sort(key=lambda item: item["distance_km"])
    except ExternalServiceError as exc:
        errors.append(f"{exc.provider}: {exc}")

    quake_score = 0
    if earthquakes:
        top = earthquakes[0]
        quake_score = max(0, min(60, int(top["magnitude"] * 8) - int(top["distance_km"] / 200)))
        if top.get("tsunami"):
            quake_score += 20
    event_score = min(35, len(natural_events) * 9)
    score = max(0, min(100, quake_score + event_score))
    label = _overall_label(score)

    response = {
        "location_name": name or f"{lat:.3f}, {lon:.3f}",
        "generated_at": _now_iso(),
        "risk_score": score,
        "risk_label": label,
        "earthquakes": earthquakes[:6],
        "events": natural_events[:6],
        "summary": _summary(label, earthquakes, natural_events),
        "sources": ["USGS Earthquake Feed", "NASA EONET"],
        "errors": errors,
    }
    cache.set(key, response, ttl_seconds=300)
    return response


def _summary(label: str, earthquakes: list[dict[str, Any]], events: list[dict[str, Any]]) -> str:
    if label in {"Critical", "High"}:
        return "Active hazard signals found near or relevant to this region. Check official alerts before travel."
    if earthquakes or events:
        return "Some natural events are being monitored nearby, but the immediate risk signal is not severe."
    return "No major nearby earthquake or natural-event signal found in the live feeds right now."
