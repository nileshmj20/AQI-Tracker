from __future__ import annotations

import asyncio
import json
import re
from datetime import datetime, timezone

import httpx

from app.core.config import get_settings
from app.models.schemas import AqiResponse, ForecastResponse, StructuredInsights, WeatherResponse
from app.services.http_client import ExternalServiceError, get_client, get_json

REQUIRED_KEYS = ("summary", "health_guidance", "activity_suggestion", "trend_explanation")
FALLBACK_MODELS = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro"]
GEMINI_SECONDS = 0.65


def rule_based_insights(aqi: AqiResponse, weather: WeatherResponse, forecast: ForecastResponse) -> StructuredInsights:
    band = aqi.band.label if aqi.band else "Unknown"
    aqi_value = aqi.aqi if aqi.aqi is not None else "unavailable"
    dominant = aqi.dominant_pollutant
    pollutant_text = "dominant pollutant data is limited"
    ratio = 0.0
    if dominant and dominant.value is not None:
        ratio = dominant.ratio or 0.0
        pollutant_text = f"{dominant.label} is the main pollutant, at about {dominant.ratio_percent or 0:.0f}% of its reference ceiling"

    temp = weather.current.temperature_2m if weather.current else None
    weather_label = weather.current.weather_label if weather.current else "current weather is unavailable"
    temp_text = f" with {temp:.0f}°C and {weather_label.lower()}" if temp is not None else f" and {weather_label.lower()}"
    hourly = [p for p in forecast.hourly[:12] if p.aqi is not None]
    trend = "not enough forecast data is available yet"

    if len(hourly) >= 2:
        diff = (hourly[-1].aqi or 0) - (hourly[0].aqi or 0)
        if diff > 10:
            trend = "the near-term forecast is worsening, so outdoor plans should be checked again later"
        elif diff < -10:
            trend = "the near-term forecast is improving, which may create a better outdoor window later"
        else:
            trend = "the near-term forecast looks fairly stable"

    if aqi.aqi is None:
        health = "AQI data is temporarily unavailable. Use the weather panel and try another nearby location."
        activity = "Keep plans flexible until the next successful refresh brings verified AQI readings."
    elif aqi.aqi <= 50:
        health = "Air quality is good for most people. Sensitive users can continue normal activity while watching local symptoms."
        activity = "Outdoor exercise, commuting, and windows-open time are generally reasonable right now."
    elif aqi.aqi <= 100:
        health = "Most people are fine, but very sensitive users should reduce long, intense outdoor exposure."
        activity = "Light outdoor activity is fine; keep intense workouts shorter if you are sensitive to pollution."
    elif aqi.aqi <= 150:
        health = "Children, older adults, and people with asthma or heart conditions should limit prolonged outdoor exertion."
        activity = "Prefer indoor workouts or short outdoor trips, especially near traffic-heavy roads."
    elif aqi.aqi <= 200:
        health = "Everyone should reduce prolonged outdoor activity. Sensitive groups should stay indoors when possible."
        activity = "Shift exercise indoors, close windows during peaks, and consider a mask for unavoidable outdoor travel."
    else:
        health = "This is a serious air-quality situation. Avoid outdoor exertion and use clean-air precautions indoors."
        activity = "Postpone outdoor plans, use filtration where available, and check official local advisories."

    if dominant and ratio > 1.0:
        health += f" {dominant.label} is above the reference ceiling, so respiratory irritation risk can increase."

    return StructuredInsights(
        summary=f"AQI is {aqi_value} ({band}) near this point{temp_text}; {pollutant_text}.",
        health_guidance=health,
        activity_suggestion=activity,
        trend_explanation=f"Forecast signal: {trend}.",
        source="rule-based",
        generated_at=datetime.now(timezone.utc),
    )


async def generate_insights(aqi: AqiResponse, weather: WeatherResponse, forecast: ForecastResponse) -> StructuredInsights:
    settings = get_settings()
    if not settings.gemini_api_key:
        return rule_based_insights(aqi, weather, forecast)

    try:
        return await asyncio.wait_for(_generate_with_gemini(settings.gemini_api_key, settings.gemini_model, aqi, weather, forecast), timeout=GEMINI_SECONDS)
    except Exception:
        return rule_based_insights(aqi, weather, forecast)


async def _generate_with_gemini(api_key: str, preferred_model: str, aqi: AqiResponse, weather: WeatherResponse, forecast: ForecastResponse) -> StructuredInsights:
    prompt = _build_prompt(aqi, weather, forecast)
    discovered_models = await _discover_models(api_key)
    ordered_models: list[str] = []
    for model in [preferred_model, *discovered_models, *FALLBACK_MODELS]:
        if model and model not in ordered_models:
            ordered_models.append(model)

    for model in ordered_models:
        try:
            parsed = await _call_gemini(api_key, model, prompt)
            return StructuredInsights(**parsed, source=f"Gemini/{model}", generated_at=datetime.now(timezone.utc))
        except (ExternalServiceError, ValueError, TypeError):
            continue
    return rule_based_insights(aqi, weather, forecast)


def _build_prompt(aqi: AqiResponse, weather: WeatherResponse, forecast: ForecastResponse) -> str:
    payload = {
        "aqi": aqi.model_dump(mode="json"),
        "weather": weather.model_dump(mode="json"),
        "forecast_first_12_hours": [p.model_dump(mode="json") for p in forecast.hourly[:12]],
    }
    return (
        "You are an air-quality explainer for a consumer dashboard. "
        "Return only valid JSON with exactly these keys: summary, health_guidance, activity_suggestion, trend_explanation. "
        "Use plain language and avoid medical diagnosis. Data: " + json.dumps(payload, ensure_ascii=False)
    )


_model_cache: dict[str, list[str]] = {}


async def _discover_models(api_key: str) -> list[str]:
    cached = _model_cache.get(api_key)
    if cached is not None:
        return cached
    data = await get_json(
        "https://generativelanguage.googleapis.com/v1beta/models",
        provider="Gemini model discovery",
        params={"key": api_key},
        retries=1,
    )
    models = []
    for item in data.get("models") or []:
        name = str(item.get("name", "")).replace("models/", "")
        methods = item.get("supportedGenerationMethods") or []
        if name and "generateContent" in methods:
            models.append(name)
    flash = [m for m in models if "flash" in m.lower()]
    ordered = flash + [m for m in models if m not in flash] + FALLBACK_MODELS
    unique = []
    for model in ordered:
        if model not in unique:
            unique.append(model)
    _model_cache[api_key] = unique
    return unique


async def _call_gemini(api_key: str, model: str, prompt: str) -> dict[str, str]:
    client = get_client()
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    try:
        response = await client.post(
            url,
            params={"key": api_key},
            json={"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"temperature": 0.35, "response_mime_type": "application/json"}},
        )
    except (httpx.RequestError, httpx.TimeoutException) as exc:
        raise ExternalServiceError("Gemini", f"Gemini request failed: {exc.__class__.__name__}") from exc

    if response.status_code >= 400:
        raise ExternalServiceError("Gemini", f"Gemini returned HTTP {response.status_code}", response.status_code)

    try:
        data = response.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]
    except (ValueError, KeyError, IndexError, TypeError) as exc:
        raise ValueError("Gemini response did not contain valid JSON text") from exc

    parsed = _parse_json(text)
    if set(parsed.keys()) != set(REQUIRED_KEYS):
        raise ValueError("Gemini JSON keys did not match required schema")
    if not all(isinstance(parsed[key], str) and parsed[key].strip() for key in REQUIRED_KEYS):
        raise ValueError("Gemini JSON values were missing")
    return parsed


def _parse_json(text: str) -> dict[str, str]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?", "", cleaned, flags=re.IGNORECASE).strip()
        cleaned = re.sub(r"```$", "", cleaned).strip()
    return json.loads(cleaned)
