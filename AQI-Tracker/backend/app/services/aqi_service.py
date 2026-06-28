from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional, Tuple

from app.models.schemas import ApiError, AqiBand, AqiResponse, ForecastPoint, ForecastResponse, GlobeHotspot, GlobeHotspotsResponse, PollutantReading
from app.core.config import get_settings
from app.services.cache import cache
from app.services.http_client import ExternalServiceError, get_json

AQI_BANDS = [
    (0, 50, "Good", "good", "#21d07a", "Air quality is healthy for most people."),
    (51, 100, "Moderate", "moderate", "#ffcf4a", "Acceptable air quality, but sensitive people should stay aware."),
    (101, 150, "Unhealthy for Sensitive Groups", "usg", "#ff9f1c", "Sensitive groups may feel effects and should reduce prolonged outdoor activity."),
    (151, 200, "Unhealthy", "unhealthy", "#ff4d2e", "Everyone may begin to feel health effects; limit outdoor exertion."),
    (201, 300, "Very Unhealthy", "very-unhealthy", "#b256ff", "Health alert: avoid extended outdoor activity."),
    (301, None, "Hazardous", "hazardous", "#ff2e63", "Emergency conditions: stay indoors and use clean-air precautions."),
]

POLLUTANT_META = {
    "pm2_5": ("PM2.5", 35.0, "µg/m³"),
    "pm10": ("PM10", 150.0, "µg/m³"),
    "carbon_monoxide": ("Carbon Monoxide", 10000.0, "µg/m³"),
    "nitrogen_dioxide": ("Nitrogen Dioxide", 200.0, "µg/m³"),
    "sulphur_dioxide": ("Sulphur Dioxide", 350.0, "µg/m³"),
    "ozone": ("Ozone", 100.0, "µg/m³"),
    "dust": ("Dust", 150.0, "µg/m³"),
}

WAQI_TO_OPEN_METEO = {
    "pm25": "pm2_5",
    "pm10": "pm10",
    "co": "carbon_monoxide",
    "no2": "nitrogen_dioxide",
    "so2": "sulphur_dioxide",
    "o3": "ozone",
}

MAJOR_CITIES = [
    ("Delhi", "India", 28.6139, 77.2090), ("Mumbai", "India", 19.0760, 72.8777),
    ("Kolkata", "India", 22.5726, 88.3639), ("Bengaluru", "India", 12.9716, 77.5946),
    ("Beijing", "China", 39.9042, 116.4074), ("Shanghai", "China", 31.2304, 121.4737),
    ("Tokyo", "Japan", 35.6762, 139.6503), ("Seoul", "South Korea", 37.5665, 126.9780),
    ("Bangkok", "Thailand", 13.7563, 100.5018), ("Jakarta", "Indonesia", -6.2088, 106.8456),
    ("Singapore", "Singapore", 1.3521, 103.8198), ("Dubai", "UAE", 25.2048, 55.2708),
    ("Riyadh", "Saudi Arabia", 24.7136, 46.6753), ("Istanbul", "Türkiye", 41.0082, 28.9784),
    ("London", "UK", 51.5072, -0.1276), ("Paris", "France", 48.8566, 2.3522),
    ("Berlin", "Germany", 52.5200, 13.4050), ("Madrid", "Spain", 40.4168, -3.7038),
    ("Rome", "Italy", 41.9028, 12.4964), ("Moscow", "Russia", 55.7558, 37.6173),
    ("Cairo", "Egypt", 30.0444, 31.2357), ("Lagos", "Nigeria", 6.5244, 3.3792),
    ("Nairobi", "Kenya", -1.2921, 36.8219), ("Johannesburg", "South Africa", -26.2041, 28.0473),
    ("New York", "USA", 40.7128, -74.0060), ("Los Angeles", "USA", 34.0522, -118.2437),
    ("Chicago", "USA", 41.8781, -87.6298), ("San Francisco", "USA", 37.7749, -122.4194),
    ("Mexico City", "Mexico", 19.4326, -99.1332), ("Toronto", "Canada", 43.6532, -79.3832),
    ("Vancouver", "Canada", 49.2827, -123.1207), ("São Paulo", "Brazil", -23.5558, -46.6396),
    ("Buenos Aires", "Argentina", -34.6037, -58.3816), ("Santiago", "Chile", -33.4489, -70.6693),
    ("Lima", "Peru", -12.0464, -77.0428), ("Bogotá", "Colombia", 4.7110, -74.0721),
    ("Sydney", "Australia", -33.8688, 151.2093), ("Melbourne", "Australia", -37.8136, 144.9631),
    ("Auckland", "New Zealand", -36.8509, 174.7645), ("Manila", "Philippines", 14.5995, 120.9842),
    ("Karachi", "Pakistan", 24.8607, 67.0011), ("Dhaka", "Bangladesh", 23.8103, 90.4125),
    ("Kathmandu", "Nepal", 27.7172, 85.3240), ("Tehran", "Iran", 35.6892, 51.3890),
    ("Doha", "Qatar", 25.2854, 51.5310), ("Vienna", "Austria", 48.2082, 16.3738),
    ("Amsterdam", "Netherlands", 52.3676, 4.9041), ("Stockholm", "Sweden", 59.3293, 18.0686),
    ("Helsinki", "Finland", 60.1699, 24.9384), ("Warsaw", "Poland", 52.2297, 21.0122),
]


def _now() -> datetime:
    return datetime.now(timezone.utc)


def classify_aqi(value: int | float | None) -> Optional[AqiBand]:
    if value is None:
        return None
    aqi = int(round(value))
    for min_value, max_value, label, slug, color, advice in AQI_BANDS:
        if aqi >= min_value and (max_value is None or aqi <= max_value):
            return AqiBand(label=label, slug=slug, min=min_value, max=max_value, color=color, advice=advice)
    return None


def dominant_pollutant(values: Dict[str, Optional[float]], units: Optional[Dict[str, str]] = None) -> Tuple[Optional[PollutantReading], List[PollutantReading]]:
    readings: List[PollutantReading] = []
    for key, (label, ceiling, default_unit) in POLLUTANT_META.items():
        raw = values.get(key)
        value = float(raw) if raw is not None else None
        ratio = value / ceiling if value is not None and ceiling else None
        readings.append(
            PollutantReading(
                key=key,
                label=label,
                value=value,
                unit=(units or {}).get(key, default_unit),
                safety_ceiling=ceiling,
                ratio=ratio,
                ratio_percent=round(ratio * 100, 1) if ratio is not None else None,
            )
        )
    valid = [reading for reading in readings if reading.ratio is not None]
    winner = max(valid, key=lambda item: item.ratio) if valid else None
    return winner, readings


async def _from_open_meteo(lat: float, lon: float) -> AqiResponse:
    data = await get_json(
        "https://air-quality-api.open-meteo.com/v1/air-quality",
        provider="Open-Meteo Air Quality",
        params={
            "latitude": lat,
            "longitude": lon,
            "current": "us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust",
            "timezone": "auto",
        },
    )
    current = data.get("current") or {}
    units = data.get("current_units") or {}
    aqi = current.get("us_aqi")
    pollutant_values = {key: current.get(key) for key in POLLUTANT_META}
    dominant, pollutants = dominant_pollutant(pollutant_values, units)
    return AqiResponse(
        latitude=lat,
        longitude=lon,
        source="Open-Meteo",
        observed_at=_parse_dt(current.get("time")) or _now(),
        aqi=int(round(aqi)) if aqi is not None else None,
        band=classify_aqi(aqi),
        dominant_pollutant=dominant,
        pollutants=pollutants,
    )


async def _from_waqi(lat: float, lon: float) -> AqiResponse:
    settings = get_settings()
    if not settings.waqi_api_token:
        raise ExternalServiceError("WAQI", "WAQI token is not configured")
    data = await get_json(
        f"https://api.waqi.info/feed/geo:{lat};{lon}/",
        provider="WAQI",
        params={"token": settings.waqi_api_token},
    )
    if data.get("status") != "ok":
        raise ExternalServiceError("WAQI", f"WAQI returned status {data.get('status', 'unknown')}")
    payload = data.get("data") or {}
    iaqi = payload.get("iaqi") or {}
    aqi = payload.get("aqi")
    values: Dict[str, Optional[float]] = {}
    units: Dict[str, str] = {}
    for waqi_key, canonical in WAQI_TO_OPEN_METEO.items():
        item = iaqi.get(waqi_key) or {}
        if "v" in item:
            values[canonical] = item.get("v")
            units[canonical] = "IAQI"
    dominant, pollutants = dominant_pollutant(values, units)
    return AqiResponse(
        latitude=lat,
        longitude=lon,
        source="WAQI",
        observed_at=_now(),
        aqi=int(round(float(aqi))) if isinstance(aqi, (int, float, str)) and str(aqi).replace('.', '', 1).isdigit() else None,
        band=classify_aqi(float(aqi)) if isinstance(aqi, (int, float, str)) and str(aqi).replace('.', '', 1).isdigit() else None,
        dominant_pollutant=dominant,
        pollutants=pollutants,
    )


def _cache_key(prefix: str, lat: float, lon: float, *extra: object) -> tuple[object, ...]:
    return (prefix, round(lat, 4), round(lon, 4), *extra)


async def get_current_aqi(lat: float, lon: float) -> AqiResponse:
    key = _cache_key("aqi", lat, lon)
    cached = cache.get(key)
    if cached is not None:
        return cached

    errors: list[str] = []
    for provider in (_from_open_meteo, _from_waqi):
        try:
            result = await provider(lat, lon)
            cache.set(key, result, ttl_seconds=300)
            return result
        except ExternalServiceError as exc:
            errors.append(f"{exc.provider}: {exc}")

    result = AqiResponse(
        latitude=lat,
        longitude=lon,
        source="unavailable",
        observed_at=_now(),
        error=ApiError(code="AQI_UNAVAILABLE", message="; ".join(errors) or "No AQI provider returned data", provider="all"),
    )
    cache.set(key, result, ttl_seconds=60)
    return result


async def get_forecast(lat: float, lon: float, days: int = 4) -> ForecastResponse:
    days = max(1, min(days, 7))
    key = _cache_key("forecast", lat, lon, days)
    cached = cache.get(key)
    if cached is not None:
        return cached
    try:
        data = await get_json(
            "https://air-quality-api.open-meteo.com/v1/air-quality",
            provider="Open-Meteo Air Quality Forecast",
            params={
                "latitude": lat,
                "longitude": lon,
                "hourly": "us_aqi,pm2_5,pm10",
                "forecast_days": days,
                "timezone": "auto",
            },
        )
        hourly = data.get("hourly") or {}
        times = hourly.get("time") or []
        points = [
            ForecastPoint(
                time=_parse_dt(times[i]) or _now(),
                aqi=_safe_float((hourly.get("us_aqi") or [None] * len(times))[i]),
                pm2_5=_safe_float((hourly.get("pm2_5") or [None] * len(times))[i]),
                pm10=_safe_float((hourly.get("pm10") or [None] * len(times))[i]),
            )
            for i in range(len(times))
        ]
        result = ForecastResponse(latitude=lat, longitude=lon, source="Open-Meteo", generated_at=_now(), hourly=points)
    except ExternalServiceError as exc:
        result = ForecastResponse(
            latitude=lat,
            longitude=lon,
            source="unavailable",
            generated_at=_now(),
            error=ApiError(code="FORECAST_UNAVAILABLE", message=str(exc), provider=exc.provider),
        )
    cache.set(key, result, ttl_seconds=600)
    return result


async def get_globe_hotspots() -> GlobeHotspotsResponse:
    cached = cache.get("globe-hotspots")
    if cached is not None:
        return cached

    sem = asyncio.Semaphore(8)

    async def fetch(city: tuple[str, str, float, float]) -> GlobeHotspot | None:
        name, country, lat, lon = city
        async with sem:
            result = await get_current_aqi(lat, lon)
            if result.error and result.aqi is None:
                return None
            return GlobeHotspot(
                name=name,
                country=country,
                latitude=lat,
                longitude=lon,
                aqi=result.aqi,
                band=result.band,
                source=result.source,
            )

    results = await asyncio.gather(*(fetch(city) for city in MAJOR_CITIES), return_exceptions=True)
    hotspots = [item for item in results if isinstance(item, GlobeHotspot)]
    response = GlobeHotspotsResponse(generated_at=_now(), count=len(hotspots), hotspots=hotspots)
    cache.set("globe-hotspots", response, ttl_seconds=1800)
    return response


def _parse_dt(value: Any) -> Optional[datetime]:
    if not value:
        return None
    try:
        text = str(value).replace("Z", "+00:00")
        dt = datetime.fromisoformat(text)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except ValueError:
        return None


def _safe_float(value: Any) -> Optional[float]:
    try:
        return None if value is None else float(value)
    except (TypeError, ValueError):
        return None
