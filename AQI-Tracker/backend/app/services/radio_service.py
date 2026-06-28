from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.services.cache import cache
from app.services.http_client import ExternalServiceError, get_json

RADIO_SERVERS = [
    "https://de1.api.radio-browser.info",
    "https://nl1.api.radio-browser.info",
    "https://at1.api.radio-browser.info",
]

FALLBACK_STATIONS = [
    {
        "id": "bbc-world-service-backup",
        "name": "BBC World Service",
        "url": "https://stream.live.vc.bbcmedia.co.uk/bbc_world_service",
        "homepage": "https://www.bbc.co.uk/worldserviceradio",
        "favicon": "",
        "country": "United Kingdom",
        "countrycode": "GB",
        "language": "English",
        "tags": "news, world, talk",
        "bitrate": 56,
        "codec": "MP3",
        "votes": 0,
        "clickcount": 0,
    }
]


def _clean_text(value: Any, limit: int = 120) -> str:
    text = " ".join(str(value or "").split())
    return text[:limit]


def _station(item: dict[str, Any]) -> dict[str, Any] | None:
    url = _clean_text(item.get("url_resolved") or item.get("url"), 500)
    name = _clean_text(item.get("name"), 90)
    if not url or not name:
        return None
    return {
        "id": _clean_text(item.get("stationuuid") or item.get("changeuuid"), 80),
        "name": name,
        "url": url,
        "homepage": _clean_text(item.get("homepage"), 300),
        "favicon": _clean_text(item.get("favicon"), 300),
        "country": _clean_text(item.get("country"), 80),
        "countrycode": _clean_text(item.get("countrycode"), 8),
        "language": _clean_text(item.get("language"), 80),
        "tags": _clean_text(item.get("tags"), 100),
        "bitrate": int(item.get("bitrate") or 0),
        "codec": _clean_text(item.get("codec"), 30),
        "votes": int(item.get("votes") or 0),
        "clickcount": int(item.get("clickcount") or 0),
    }


async def get_radio_stations(q: str | None = None, countrycode: str = "IN", limit: int = 12) -> dict[str, Any]:
    clean_q = _clean_text(q, 80)
    clean_country = _clean_text(countrycode, 2).upper() or "IN"
    clean_limit = max(4, min(int(limit or 12), 24))
    key = ("radio", clean_q.lower(), clean_country, clean_limit)
    cached = cache.get(key)
    if cached is not None:
        return cached

    params = {
        "limit": clean_limit,
        "hidebroken": "true",
        "order": "clickcount",
        "reverse": "true",
        "countrycode": clean_country,
    }
    if clean_q:
        params["name"] = clean_q

    errors: list[str] = []
    for server in RADIO_SERVERS:
        try:
            data = await get_json(
                f"{server}/json/stations/search",
                provider="Radio Browser",
                params=params,
                retries=1,
            )
            stations = []
            seen = set()
            for item in data if isinstance(data, list) else []:
                station = _station(item)
                if not station or station["url"] in seen:
                    continue
                seen.add(station["url"])
                stations.append(station)
            result = {"generated_at": datetime.now(timezone.utc).isoformat(), "source": server, "stations": stations[:clean_limit]}
            cache.set(key, result, ttl_seconds=900)
            return result
        except ExternalServiceError as exc:
            errors.append(f"{exc.provider}: {exc}")

    result = {"generated_at": datetime.now(timezone.utc).isoformat(), "source": "fallback", "stations": FALLBACK_STATIONS, "error": "; ".join(errors) or "Radio station service unavailable"}
    cache.set(key, result, ttl_seconds=120)
    return result
