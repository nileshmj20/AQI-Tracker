from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ApiError(BaseModel):
    code: str
    message: str
    provider: Optional[str] = None


class AqiBand(BaseModel):
    label: str
    slug: str
    min: int
    max: Optional[int]
    color: str
    advice: str


class PollutantReading(BaseModel):
    key: str
    label: str
    value: Optional[float] = None
    unit: str = ""
    safety_ceiling: Optional[float] = None
    ratio: Optional[float] = None
    ratio_percent: Optional[float] = None


class AqiResponse(BaseModel):
    latitude: float
    longitude: float
    source: str
    observed_at: datetime
    aqi: Optional[int] = None
    band: Optional[AqiBand] = None
    dominant_pollutant: Optional[PollutantReading] = None
    pollutants: List[PollutantReading] = Field(default_factory=list)
    error: Optional[ApiError] = None


class ForecastPoint(BaseModel):
    time: datetime
    aqi: Optional[float] = None
    pm2_5: Optional[float] = None
    pm10: Optional[float] = None


class ForecastResponse(BaseModel):
    latitude: float
    longitude: float
    source: str
    generated_at: datetime
    hourly: List[ForecastPoint] = Field(default_factory=list)
    error: Optional[ApiError] = None


class CurrentWeather(BaseModel):
    time: Optional[datetime] = None
    temperature_2m: Optional[float] = None
    apparent_temperature: Optional[float] = None
    relative_humidity_2m: Optional[float] = None
    dew_point_2m: Optional[float] = None
    precipitation: Optional[float] = None
    rain: Optional[float] = None
    cloud_cover: Optional[float] = None
    pressure_msl: Optional[float] = None
    visibility: Optional[float] = None
    wind_speed_10m: Optional[float] = None
    wind_direction_10m: Optional[float] = None
    wind_gusts_10m: Optional[float] = None
    uv_index: Optional[float] = None
    weather_code: Optional[int] = None
    weather_label: str = "Unknown"
    is_day: Optional[int] = None


class DailyWeatherPoint(BaseModel):
    date: str
    weather_code: Optional[int] = None
    weather_label: str = "Unknown"
    temperature_2m_max: Optional[float] = None
    temperature_2m_min: Optional[float] = None
    apparent_temperature_max: Optional[float] = None
    apparent_temperature_min: Optional[float] = None
    precipitation_probability_max: Optional[float] = None
    precipitation_sum: Optional[float] = None
    rain_sum: Optional[float] = None
    uv_index_max: Optional[float] = None
    wind_speed_10m_max: Optional[float] = None
    wind_gusts_10m_max: Optional[float] = None
    sunrise: Optional[str] = None
    sunset: Optional[str] = None


class HourlyWeatherPoint(BaseModel):
    time: datetime
    temperature_2m: Optional[float] = None
    apparent_temperature: Optional[float] = None
    precipitation_probability: Optional[float] = None
    rain: Optional[float] = None
    weather_code: Optional[int] = None
    weather_label: str = "Unknown"
    wind_speed_10m: Optional[float] = None
    wind_gusts_10m: Optional[float] = None
    uv_index: Optional[float] = None


class WeatherResponse(BaseModel):
    latitude: float
    longitude: float
    source: str
    observed_at: datetime
    current: Optional[CurrentWeather] = None
    daily: List[DailyWeatherPoint] = Field(default_factory=list)
    hourly: List[HourlyWeatherPoint] = Field(default_factory=list)
    error: Optional[ApiError] = None


class LocationResult(BaseModel):
    name: str
    latitude: float
    longitude: float
    country: Optional[str] = None
    admin1: Optional[str] = None
    timezone: Optional[str] = None
    population: Optional[int] = None
    display_name: str


class LocationSearchResponse(BaseModel):
    query: str
    results: List[LocationResult] = Field(default_factory=list)


class ReverseGeocodeResponse(BaseModel):
    latitude: float
    longitude: float
    display_name: str
    city: Optional[str] = None
    country: Optional[str] = None
    address: Dict[str, Any] = Field(default_factory=dict)
    error: Optional[ApiError] = None


class StructuredInsights(BaseModel):
    summary: str
    health_guidance: str
    activity_suggestion: str
    trend_explanation: str
    source: str = "rule-based"
    generated_at: datetime


class SnapshotResponse(BaseModel):
    latitude: float
    longitude: float
    location_name: Optional[str] = None
    observed_at: datetime
    aqi: AqiResponse
    weather: WeatherResponse
    forecast: ForecastResponse
    insights: StructuredInsights


class HealthServiceStatus(BaseModel):
    name: str
    status: str
    message: str
    masked_key: Optional[str] = None
    latency_ms: Optional[int] = None


class HealthResponse(BaseModel):
    ok: bool
    status: str
    checked_at: datetime
    version: str


class DeepHealthResponse(BaseModel):
    ok: bool
    checked_at: datetime
    services: List[HealthServiceStatus]


class GlobeHotspot(BaseModel):
    name: str
    country: str
    latitude: float
    longitude: float
    aqi: Optional[int] = None
    band: Optional[AqiBand] = None
    source: str


class GlobeHotspotsResponse(BaseModel):
    generated_at: datetime
    count: int
    hotspots: List[GlobeHotspot]


class HistoryPoint(BaseModel):
    date: str
    average_aqi: Optional[float] = None
    count: int = 0
    min_aqi: Optional[int] = None
    max_aqi: Optional[int] = None
    dominant_pollutant: Optional[str] = None
    weather_label: Optional[str] = None


class HistoryResponse(BaseModel):
    latitude: float
    longitude: float
    location_name: Optional[str] = None
    days: int
    generated_at: datetime
    points: List[HistoryPoint] = Field(default_factory=list)
    note: str = "History builds locally from successful dashboard refreshes."
