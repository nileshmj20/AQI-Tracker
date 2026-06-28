from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from app.models.schemas import ApiError, CurrentWeather, DailyWeatherPoint, HourlyWeatherPoint, WeatherResponse
from app.services.cache import cache
from app.services.http_client import ExternalServiceError, get_json

WEATHER_CODES = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing rime fog", 51: "Light drizzle", 53: "Moderate drizzle",
    55: "Dense drizzle", 56: "Light freezing drizzle", 57: "Dense freezing drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain", 66: "Light freezing rain",
    67: "Heavy freezing rain", 71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
    77: "Snow grains", 80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
    85: "Slight snow showers", 86: "Heavy snow showers", 95: "Thunderstorm", 96: "Thunderstorm with hail",
    99: "Thunderstorm with heavy hail",
}


def weather_label(code: int | None) -> str:
    return WEATHER_CODES.get(code, "Unknown")


async def get_weather(lat: float, lon: float) -> WeatherResponse:
    key = ("weather", round(lat, 4), round(lon, 4))
    cached = cache.get(key)
    if cached is not None:
        return cached
    try:
        data = await get_json(
            "https://api.open-meteo.com/v1/forecast",
            provider="Open-Meteo Weather",
            params={
                "latitude": lat,
                "longitude": lon,
                "current": "temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,is_day,precipitation,rain,weather_code,cloud_cover,pressure_msl,visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m",
                "hourly": "temperature_2m,apparent_temperature,precipitation_probability,rain,weather_code,wind_speed_10m,wind_gusts_10m,uv_index",
                "daily": "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_probability_max,precipitation_sum,rain_sum,uv_index_max,wind_speed_10m_max,wind_gusts_10m_max,sunrise,sunset",
                "forecast_days": 7,
                "timezone": "auto",
            },
        )
        current_raw = data.get("current") or {}
        code = _safe_int(current_raw.get("weather_code"))
        current = CurrentWeather(
            time=_parse_dt(current_raw.get("time")),
            temperature_2m=_safe_float(current_raw.get("temperature_2m")),
            apparent_temperature=_safe_float(current_raw.get("apparent_temperature")),
            relative_humidity_2m=_safe_float(current_raw.get("relative_humidity_2m")),
            dew_point_2m=_safe_float(current_raw.get("dew_point_2m")),
            precipitation=_safe_float(current_raw.get("precipitation")),
            rain=_safe_float(current_raw.get("rain")),
            cloud_cover=_safe_float(current_raw.get("cloud_cover")),
            pressure_msl=_safe_float(current_raw.get("pressure_msl")),
            visibility=_safe_float(current_raw.get("visibility")),
            wind_speed_10m=_safe_float(current_raw.get("wind_speed_10m")),
            wind_direction_10m=_safe_float(current_raw.get("wind_direction_10m")),
            wind_gusts_10m=_safe_float(current_raw.get("wind_gusts_10m")),
            uv_index=_safe_float(current_raw.get("uv_index")),
            weather_code=code,
            weather_label=weather_label(code),
            is_day=_safe_int(current_raw.get("is_day")),
        )
        daily_raw = data.get("daily") or {}
        dates = daily_raw.get("time") or []
        daily = []
        for i, date in enumerate(dates):
            day_code = _safe_int(_at(daily_raw.get("weather_code"), i))
            daily.append(
                DailyWeatherPoint(
                    date=str(date),
                    weather_code=day_code,
                    weather_label=weather_label(day_code),
                    temperature_2m_max=_safe_float(_at(daily_raw.get("temperature_2m_max"), i)),
                    temperature_2m_min=_safe_float(_at(daily_raw.get("temperature_2m_min"), i)),
                    apparent_temperature_max=_safe_float(_at(daily_raw.get("apparent_temperature_max"), i)),
                    apparent_temperature_min=_safe_float(_at(daily_raw.get("apparent_temperature_min"), i)),
                    precipitation_probability_max=_safe_float(_at(daily_raw.get("precipitation_probability_max"), i)),
                    precipitation_sum=_safe_float(_at(daily_raw.get("precipitation_sum"), i)),
                    rain_sum=_safe_float(_at(daily_raw.get("rain_sum"), i)),
                    uv_index_max=_safe_float(_at(daily_raw.get("uv_index_max"), i)),
                    wind_speed_10m_max=_safe_float(_at(daily_raw.get("wind_speed_10m_max"), i)),
                    wind_gusts_10m_max=_safe_float(_at(daily_raw.get("wind_gusts_10m_max"), i)),
                    sunrise=str(_at(daily_raw.get("sunrise"), i) or ""),
                    sunset=str(_at(daily_raw.get("sunset"), i) or ""),
                )
            )
        hourly_raw = data.get("hourly") or {}
        h_times = hourly_raw.get("time") or []
        hourly = []
        for i, when in enumerate(h_times[:24]):
            h_code = _safe_int(_at(hourly_raw.get("weather_code"), i))
            hourly.append(
                HourlyWeatherPoint(
                    time=_parse_dt(when) or datetime.now(timezone.utc),
                    temperature_2m=_safe_float(_at(hourly_raw.get("temperature_2m"), i)),
                    apparent_temperature=_safe_float(_at(hourly_raw.get("apparent_temperature"), i)),
                    precipitation_probability=_safe_float(_at(hourly_raw.get("precipitation_probability"), i)),
                    rain=_safe_float(_at(hourly_raw.get("rain"), i)),
                    weather_code=h_code,
                    weather_label=weather_label(h_code),
                    wind_speed_10m=_safe_float(_at(hourly_raw.get("wind_speed_10m"), i)),
                    wind_gusts_10m=_safe_float(_at(hourly_raw.get("wind_gusts_10m"), i)),
                    uv_index=_safe_float(_at(hourly_raw.get("uv_index"), i)),
                )
            )
        result = WeatherResponse(latitude=lat, longitude=lon, source="Open-Meteo", observed_at=datetime.now(timezone.utc), current=current, daily=daily, hourly=hourly)
    except ExternalServiceError as exc:
        result = WeatherResponse(
            latitude=lat,
            longitude=lon,
            source="unavailable",
            observed_at=datetime.now(timezone.utc),
            error=ApiError(code="WEATHER_UNAVAILABLE", message=str(exc), provider=exc.provider),
        )
    cache.set(key, result, ttl_seconds=300)
    return result


def _parse_dt(value: Any) -> Optional[datetime]:
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
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


def _safe_int(value: Any) -> Optional[int]:
    try:
        return None if value is None else int(float(value))
    except (TypeError, ValueError):
        return None


def _at(values: Any, index: int) -> Any:
    if not isinstance(values, list) or index >= len(values):
        return None
    return values[index]
