import { $, $$, clamp, fmt, escapeHtml, debounce } from './modules/utils.js';
import { buildApiUrl, requestJson as fetchApiJson, isApiConnectivityError } from './modules/api.js';
import { chartCanvasHeights } from './modules/charts.js';
import { pageConfig } from './modules/navigation.js';
import { loadLastStation, saveLastStation, loadVolume, saveVolume, toggleFavouriteStation, isFavouriteStation, stationId } from './modules/radio.js';

const deg = Math.PI / 180;

  function setTextAll(selector, value) {
    $$(selector).forEach((node) => { node.textContent = value; });
  }

  const sampleCities = [
    { display_name: 'New Delhi, India', latitude: 28.6139, longitude: 77.2090, aqi: 168, temp: 28, humidity: 32, wind: 18, pollutant: 'PM2.5' },
    { display_name: 'Mumbai, India', latitude: 19.0760, longitude: 72.8777, aqi: 96, temp: 30, humidity: 69, wind: 14, pollutant: 'PM10' },
    { display_name: 'Bengaluru, India', latitude: 12.9716, longitude: 77.5946, aqi: 58, temp: 24, humidity: 55, wind: 11, pollutant: 'PM2.5' },
    { display_name: 'Tokyo, Japan', latitude: 35.6762, longitude: 139.6503, aqi: 42, temp: 21, humidity: 47, wind: 9, pollutant: 'NO2' },
    { display_name: 'London, United Kingdom', latitude: 51.5072, longitude: -0.1276, aqi: 64, temp: 16, humidity: 62, wind: 16, pollutant: 'PM2.5' },
    { display_name: 'Los Angeles, United States', latitude: 34.0522, longitude: -118.2437, aqi: 122, temp: 25, humidity: 48, wind: 10, pollutant: 'O3' },
    { display_name: 'Beijing, China', latitude: 39.9042, longitude: 116.4074, aqi: 155, temp: 26, humidity: 38, wind: 13, pollutant: 'PM2.5' },
    { display_name: 'Dubai, United Arab Emirates', latitude: 25.2048, longitude: 55.2708, aqi: 132, temp: 36, humidity: 40, wind: 22, pollutant: 'PM10' },
    { display_name: 'Paris, France', latitude: 48.8566, longitude: 2.3522, aqi: 71, temp: 18, humidity: 58, wind: 12, pollutant: 'NO2' },
    { display_name: 'Sydney, Australia', latitude: -33.8688, longitude: 151.2093, aqi: 36, temp: 20, humidity: 64, wind: 17, pollutant: 'O3' }
  ];



  const solarPlanets = [
    { key: 'mercury', name: 'Mercury', symbol: '☿', type: 'Rocky planet', distance: '57.9M km', diameter: '4,879 km', day: '59 Earth days', year: '88 days', moons: '0', feature: 'Fastest orbit', summary: 'Smallest planet and closest to the Sun. It has extreme temperature swings and almost no atmosphere.', color: '#b7a58b', glow: 'rgba(183,165,139,.62)', x: 11, orbitW: 18, orbitH: 12, size: 10, scale: 3.2 },
    { key: 'venus', name: 'Venus', symbol: '♀', type: 'Rocky planet', distance: '108.2M km', diameter: '12,104 km', day: '243 Earth days', year: '225 days', moons: '0', feature: 'Hottest planet', summary: 'A thick carbon-dioxide atmosphere traps heat, making Venus hotter than Mercury despite being farther from the Sun.', color: '#d7b36a', glow: 'rgba(255,193,93,.68)', x: 20, orbitW: 30, orbitH: 17, size: 16, scale: 2.8 },
    { key: 'earth', name: 'Earth', symbol: '⊕', type: 'Rocky planet', distance: '149.6M km', diameter: '12,742 km', day: '24 hours', year: '365 days', moons: '1', feature: 'Life + air', summary: 'Our live AQI world. This dashboard uses Earth air-quality, weather and pollution readings.', color: '#38d5ff', glow: 'rgba(56,213,255,.76)', x: 30, orbitW: 42, orbitH: 22, size: 18, scale: 2.45 },
    { key: 'mars', name: 'Mars', symbol: '♂', type: 'Rocky planet', distance: '227.9M km', diameter: '6,779 km', day: '24.6 hours', year: '687 days', moons: '2', feature: 'Red dust world', summary: 'Mars is cold, dusty and rich in iron oxide, giving it a red color. Dust storms can cover huge regions.', color: '#ff6b4a', glow: 'rgba(255,107,74,.70)', x: 41, orbitW: 56, orbitH: 29, size: 14, scale: 2.25 },
    { key: 'jupiter', name: 'Jupiter', symbol: '♃', type: 'Gas giant', distance: '778.5M km', diameter: '139,820 km', day: '9.9 hours', year: '11.9 years', moons: '95+', feature: 'Largest planet', summary: 'Jupiter is the largest planet, with powerful storms and a massive magnetic field.', color: '#e0b07c', glow: 'rgba(224,176,124,.72)', x: 56, orbitW: 76, orbitH: 38, size: 34, scale: 1.85 },
    { key: 'saturn', name: 'Saturn', symbol: '♄', type: 'Gas giant', distance: '1.43B km', diameter: '116,460 km', day: '10.7 hours', year: '29.5 years', moons: '140+', feature: 'Ring system', summary: 'Saturn is famous for its bright rings made mostly of ice and rock particles.', color: '#f1d18b', glow: 'rgba(241,209,139,.72)', x: 70, orbitW: 94, orbitH: 46, size: 30, scale: 1.7 },
    { key: 'uranus', name: 'Uranus', symbol: '♅', type: 'Ice giant', distance: '2.87B km', diameter: '50,724 km', day: '17.2 hours', year: '84 years', moons: '27', feature: 'Tilted rotation', summary: 'Uranus rotates on its side and has a blue-green color from methane in its atmosphere.', color: '#7ee8e5', glow: 'rgba(126,232,229,.68)', x: 83, orbitW: 111, orbitH: 53, size: 23, scale: 1.55 },
    { key: 'neptune', name: 'Neptune', symbol: '♆', type: 'Ice giant', distance: '4.50B km', diameter: '49,244 km', day: '16.1 hours', year: '165 years', moons: '14', feature: 'Fastest winds', summary: 'Neptune is a deep-blue ice giant with some of the fastest winds in the solar system.', color: '#4a86ff', glow: 'rgba(74,134,255,.72)', x: 94, orbitW: 128, orbitH: 61, size: 22, scale: 1.45 }
  ];
  const mapMarkerLocations = {
    'New Delhi, India': { latitude: 28.6139, longitude: 77.2090, temp: 28, humidity: 32, wind: 18, pollutant: 'PM2.5' },
    'Gurugram, India': { latitude: 28.4595, longitude: 77.0266, temp: 29, humidity: 31, wind: 17, pollutant: 'PM2.5' },
    'Noida, India': { latitude: 28.5355, longitude: 77.3910, temp: 28, humidity: 34, wind: 16, pollutant: 'PM10' },
    'Ghaziabad, India': { latitude: 28.6692, longitude: 77.4538, temp: 28, humidity: 35, wind: 14, pollutant: 'PM2.5' },
    'Faridabad, India': { latitude: 28.4089, longitude: 77.3178, temp: 29, humidity: 33, wind: 15, pollutant: 'PM10' }
  };

  const state = {
    location: { ...sampleCities[0] },
    snapshot: null,
    lastUpdated: null,
    usingFallback: false,
    globe: null,
    charts: {},
    chartInstances: {},
    currentAlerts: [],
    disasterWatch: null,
    favourites: loadStoredFavourites(),
    compareCities: ['New Delhi, India', 'Mumbai, India', 'Bengaluru, India', 'London, United Kingdom'],
    radioStations: [],
    selectedRadio: loadLastStation(),
    selectedPlanet: 'earth',
    radioHasInitialSelection: Boolean(loadLastStation()),
    radioFavouritesOnly: false,
    radioUnavailableIds: new Set(),
    deferredInstallPrompt: null
  };

  document.addEventListener('DOMContentLoaded', () => {
    wireIntroScreens();
    wireNavigation();
    wireControls();
    initClock();
    initCharts();
    renderLocationMenu();
    initProjectLab();
    initRadioPlayer();
    initPwaInstall();
    initGlobe();
    initSolarSystem();
    setLocation(sampleCities[0], 'initial');
    refreshData('initial');
    window.addEventListener('resize', debounce(() => updateCharts(state.snapshot || mockSnapshot(state.location)), 160));
  });


  function wireIntroScreens() {
    const boot = $('#bootScreen');
    const openDashboard = () => {
      if (boot) {
        boot.classList.add('is-done');
        setTimeout(() => { boot.hidden = true; }, 360);
      }
      document.body.classList.remove('is-booting', 'is-welcoming');
      toast('AQI Tracker is ready. Use Search, Change, or Use my location to update every card.');
    };
    setTimeout(openDashboard, 2450);
  }

  function qp(params) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') search.set(key, value);
    });
    return search.toString();
  }

  function wireNavigation() {
    preparePageBlocks();
    $('#homeButton')?.addEventListener('click', () => showDashboardPage('dashboard'));
    $$('.rail-item[data-scroll]').forEach((button) => {
      button.addEventListener('click', () => showDashboardPage(button.dataset.scroll));
    });
    showDashboardPage('dashboard', false);
  }

  function showCurrentPageHelp() {
    const active = $('.rail-item.active')?.dataset.scroll || 'dashboard';
    const config = pageConfig[active] || pageConfig.dashboard;
    toast(`How to use: ${config.description}`);
  }

  function preparePageBlocks() {
    const main = $('#dashboard');
    if (!main) return;
    main.classList.add('is-paged');
    Array.from(main.children).forEach((child) => child.classList.add('page-block'));
  }

  function showDashboardPage(pageKey, animate = true) {
    const config = pageConfig[pageKey] || pageConfig.dashboard;
    const main = $('#dashboard');
    if (!main) return scrollToSection(pageKey);
    $$('.rail-item').forEach((item) => item.classList.toggle('active', item.dataset.scroll === pageKey));
    if (pageKey === 'dashboard') $$('.rail-item').forEach((item) => item.classList.toggle('active', item.dataset.scroll === 'dashboard'));
    $$('.page-block', main).forEach((block) => block.classList.remove('page-visible'));
    config.blocks.forEach((selector) => {
      $$(selector, main).forEach((block) => block.classList.add('page-visible'));
    });
    setText('[data-page-kicker]', config.kicker);
    setText('[data-page-title]', config.title);
    setText('[data-page-description]', config.description);
    setText('[data-page-badge]', config.badge);
    if (animate) $('.app-shell')?.scrollTo({ top: 0, behavior: 'smooth' });
    window.setTimeout(() => {
      Object.values(state.chartInstances || {}).forEach((chart) => chart?.resize?.());
      updateCharts(state.snapshot || mockSnapshot(state.location));
    }, animate ? 240 : 80);
  }

  function scrollToSection(id) {
    const target = document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderLocationMenu() {
    const menu = $('#locationDropdownMenu');
    if (!menu) return;
    menu.innerHTML = sampleCities.map((city) => `
      <button type="button" class="location-option" data-location-name="${escapeHtml(city.display_name)}">
        <span>${escapeHtml(city.display_name)}</span>
        <small>AQI ${city.aqi} · ${escapeHtml(city.pollutant)}</small>
      </button>`).join('');
    $$('.location-option', menu).forEach((button) => {
      button.addEventListener('click', () => {
        const next = sampleCities.find((city) => city.display_name === button.dataset.locationName) || sampleCities[0];
        setLocation(next, 'location-menu');
        closeLocationMenu();
        toast(`Location changed to ${next.display_name}. AQI, weather, alerts, charts and reports are updating.`);
      });
    });
  }

  function toggleLocationMenu(event) {
    event?.stopPropagation?.();
    const menu = $('#locationDropdownMenu');
    const button = $('#locationMenuButton');
    if (!menu || !button) return cycleLocation();
    const nextHidden = !menu.hidden;
    menu.hidden = nextHidden;
    button.setAttribute('aria-expanded', String(!nextHidden));
  }

  function closeLocationMenu() {
    const menu = $('#locationDropdownMenu');
    const button = $('#locationMenuButton');
    if (menu) menu.hidden = true;
    if (button) button.setAttribute('aria-expanded', 'false');
  }

  function wireControls() {
    $('#locationMenuButton')?.addEventListener('click', toggleLocationMenu);
    $('#alertsButton')?.addEventListener('click', openAlertMessage);
    $('#refreshButton')?.addEventListener('click', () => refreshData('manual'));
    $('#resetGlobeButton')?.addEventListener('click', () => { state.globe?.reset(); toast('Globe reset: default zoom, rotation and camera position restored.'); });
    $('#fullscreenButton')?.addEventListener('click', toggleFullscreen);
    $('#shareButton')?.addEventListener('click', shareDashboard);
    $('#presentationModeButton')?.addEventListener('click', togglePresentationMode);
    $('#pageHelpButton')?.addEventListener('click', showCurrentPageHelp);
    $('#generateReportButton')?.addEventListener('click', downloadReport);
    $('#generatePdfReportButton')?.addEventListener('click', downloadPdfReport);
    $('#locateButton')?.addEventListener('click', useBrowserLocation);
    $('#alertModalClose')?.addEventListener('click', closeAlertMessage);
    $('#alertModal')?.addEventListener('click', (event) => { if (event.target.id === 'alertModal') closeAlertMessage(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { closeAlertMessage(); closeLocationMenu(); } });
    $('#helpAqi')?.addEventListener('click', () => toast('AQI guide: 0–50 Good, 51–100 Moderate, 101–150 Sensitive, 151+ Unhealthy. Higher AQI means higher health risk.'));
    $('#expandWeather')?.addEventListener('click', () => {
      $('#weatherCard')?.classList.toggle('expanded');
      toast($('#weatherCard')?.classList.contains('expanded') ? 'Weather card expanded: focus on temperature, humidity, wind and visibility.' : 'Weather card collapsed: compact weather summary restored.');
    });
    $('#customizeLayers')?.addEventListener('click', () => {
      $('#layers')?.classList.toggle('compact');
      toast($('#layers')?.classList.contains('compact') ? 'Layer panel simplified: fewer controls visible.' : 'Layer controls visible: toggle overlays and adjust layer intensity.');
    });
    $('#searchForm')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const query = $('#searchInput')?.value?.trim();
      if (query) searchAndSelect(query);
    });
    $('#searchInput')?.addEventListener('input', debounce(handleSearchInput, 220));
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.search-wrap')) $('#searchResults')?.setAttribute('hidden', '');
      if (!event.target.closest('.location-picker')) closeLocationMenu();
    });
    $$('.layers-card input[type="checkbox"]').forEach((input) => {
      input.addEventListener('change', () => {
        document.body.classList.toggle(`layer-${input.dataset.layer}-off`, !input.checked);
        toast(`${input.parentElement?.innerText.trim().split('\n')[0] || 'Layer'} ${input.checked ? 'enabled' : 'disabled'} on the globe/map view.`);
      });
    });
    $$('.layers-card input[type="range"]').forEach((range) => {
      const apply = () => document.documentElement.style.setProperty(`--${range.dataset.opacity}Opacity`, Number(range.value) / 100);
      range.addEventListener('input', apply);
      apply();
    });
    $$('.dpad [data-tilt]').forEach((button) => button.addEventListener('click', () => state.globe?.nudge(button.dataset.tilt)));
    $$('[data-map-marker]').forEach((button) => {
      button.addEventListener('click', () => {
        $$('[data-map-marker]').forEach((item) => item.classList.remove('selected'));
        button.classList.add('selected');
        const name = button.dataset.name || 'New Delhi, India';
        const base = mapMarkerLocations[name] || state.location;
        setLocation({ ...base, display_name: name, aqi: Number(button.dataset.aqi) }, 'map-marker');
      });
    });
  }

  function cycleLocation() {
    const index = sampleCities.findIndex((city) => city.display_name === state.location.display_name);
    const next = sampleCities[(index + 1 + sampleCities.length) % sampleCities.length] || sampleCities[0];
    setLocation(next, 'location-menu');
    toast(`Location changed to ${next.display_name}. AQI, weather, alerts, charts and reports are updating.`);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      toast('Fullscreen enabled: useful for project presentation or focused monitoring.');
    } else {
      document.exitFullscreen?.();
      toast('Fullscreen closed: normal dashboard layout restored.');
    }
  }

  async function shareDashboard() {
    const text = `AQI Globe Dashboard — ${state.location.display_name}: AQI ${state.snapshot?.aqi?.aqi ?? '—'} (${state.snapshot?.aqi?.band?.label || 'status loading'})`;
    try {
      if (navigator.share) await navigator.share({ title: 'AQI Globe Dashboard', text });
      else await navigator.clipboard.writeText(text);
      toast('Share ready: current city AQI summary copied or sent through your device share menu.');
    } catch {
      toast(text);
    }
  }

  function initClock() {
    const update = () => {
      const now = new Date();
      $('[data-current-date]').textContent = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      $('[data-current-time]').textContent = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    };
    update();
    setInterval(update, 1000 * 30);
  }

  /**
   * Fetches JSON from the configured API base and surfaces connectivity problems clearly.
   */
  async function requestJson(path, timeoutMs = 7000) {
    try {
      return await fetchApiJson(path, timeoutMs);
    } catch (error) {
      if (isApiConnectivityError(error)) showApiConnectivityBanner();
      throw error;
    }
  }

  async function refreshData(reason) {
    setSystemStatus(reason === 'manual' ? 'Refreshing live data…' : 'Loading dashboard…');
    setTextAll('[data-refresh-status]', 'Loading');
    try {
      const loc = state.location;
      const data = await requestJson(`/api/snapshot?${qp({ lat: loc.latitude, lon: loc.longitude, name: loc.display_name })}`, 9000);
      const normalized = normalizeSnapshot(data);
      const enriched = enrichSnapshot(normalized);
      renderSnapshot(enriched);
      fetchDisasterWatch();
      setSystemStatus(state.usingFallback ? 'Hybrid demo data' : 'Backend connected');
      if (reason === 'manual') toast(state.usingFallback ? 'Some live providers were unavailable, demo values filled the gaps.' : 'Live data refreshed.');
    } catch (error) {
      state.usingFallback = true;
      renderSnapshot(mockSnapshot(state.location));
      renderDisasterWatch(mockDisasterWatch(state.location));
      setSystemStatus(isApiConnectivityError(error) ? 'API connection issue' : 'Demo mode');
      if (reason === 'manual') toast(isApiConnectivityError(error) ? 'Could not reach the backend API. Demo values are shown until the connection is fixed.' : 'Live provider failed, refreshed with demo data.');
    }
  }

  function setLocation(location, origin = 'manual') {
    const clean = {
      display_name: location.display_name || location.name || `${fmt(location.latitude, 3)}, ${fmt(location.longitude, 3)}`,
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),
      aqi: location.aqi,
      temp: location.temp,
      humidity: location.humidity,
      wind: location.wind,
      pollutant: location.pollutant
    };
    if (!Number.isFinite(clean.latitude) || !Number.isFinite(clean.longitude)) {
      clean.latitude = sampleCities[0].latitude;
      clean.longitude = sampleCities[0].longitude;
    }
    state.location = clean;
    setTextAll('[data-summary-location]', clean.display_name);
    setText('[data-top-location]', clean.display_name);
    setText('[data-detail-title]', clean.display_name.split(',').slice(0, 2).join(', '));
    setTextAll('[data-coordinates]', formatCoordinate(clean.latitude, 'N', 'S'));
    setTextAll('[data-lon]', formatCoordinate(clean.longitude, 'E', 'W'));
    state.globe?.goTo(clean.latitude, clean.longitude);
    if (origin !== 'initial') refreshData('location');
  }

  function normalizeSnapshot(data) {
    return {
      location_name: data.location_name || state.location.display_name,
      latitude: data.latitude ?? state.location.latitude,
      longitude: data.longitude ?? state.location.longitude,
      observed_at: data.observed_at || new Date().toISOString(),
      aqi: data.aqi || {},
      weather: data.weather || { current: {} },
      forecast: data.forecast || {},
      insights: data.insights || null
    };
  }

  function enrichSnapshot(snapshot) {
    const fallback = mockSnapshot(state.location);
    const liveAqi = Number(snapshot?.aqi?.aqi);
    const hasAqi = Number.isFinite(liveAqi) && liveAqi > 0;
    const hasWeather = Boolean(snapshot?.weather?.current && Number.isFinite(Number(snapshot.weather.current.temperature_2m)));
    const hasForecast = Boolean((snapshot?.forecast?.hourly || []).length);
    let usedFallback = false;

    if (!hasAqi) {
      snapshot.aqi = fallback.aqi;
      usedFallback = true;
    } else {
      snapshot.aqi.band = snapshot.aqi.band || getAqiBand(liveAqi);
      if (!snapshot.aqi.pollutants || !snapshot.aqi.pollutants.length) snapshot.aqi.pollutants = fallback.aqi.pollutants;
      if (!snapshot.aqi.dominant_pollutant) snapshot.aqi.dominant_pollutant = snapshot.aqi.pollutants?.[0] || fallback.aqi.dominant_pollutant;
    }

    if (!hasWeather) {
      snapshot.weather = fallback.weather;
      usedFallback = true;
    } else {
      snapshot.weather.daily = (snapshot.weather.daily && snapshot.weather.daily.length) ? snapshot.weather.daily : fallback.weather.daily;
      snapshot.weather.hourly = (snapshot.weather.hourly && snapshot.weather.hourly.length) ? snapshot.weather.hourly : fallback.weather.hourly;
    }

    if (!hasForecast) {
      snapshot.forecast = fallback.forecast;
      usedFallback = true;
    }

    if (!snapshot.insights || !snapshot.insights.summary) {
      snapshot.insights = fallback.insights;
      usedFallback = true;
    }

    snapshot.fallback = usedFallback;
    state.usingFallback = usedFallback;
    return snapshot;
  }

  function mockSnapshot(location) {
    const base = sampleCities.find((city) => city.display_name === location.display_name) || location;
    const aqi = Number(base.aqi ?? 84 + Math.round(Math.abs(Math.sin((base.latitude + base.longitude) / 30)) * 110));
    const band = getAqiBand(aqi);
    const temp = Number(base.temp ?? 22 + Math.round(Math.abs(Math.sin(base.latitude)) * 12));
    const humidity = Number(base.humidity ?? 38 + Math.round(Math.abs(Math.cos(base.longitude)) * 36));
    const wind = Number(base.wind ?? 8 + Math.round(Math.abs(Math.sin(base.longitude / 2)) * 18));
    const pollutant = base.pollutant || (aqi > 120 ? 'PM2.5' : 'PM10');
    const hours = Array.from({ length: 24 }, (_, index) => {
      const value = Math.max(18, Math.round(aqi + Math.sin(index / 2.5) * 24 + Math.cos(index / 1.7) * 14));
      return { time: `${String(index).padStart(2, '0')}:00`, us_aqi: value };
    });
    const temps = Array.from({ length: 4 }, (_, index) => ({ date: ['Today', 'Tomorrow', 'Day 3', 'Day 4'][index], max_temperature_2m: temp + index + 3, min_temperature_2m: temp - 6 + index }));
    return {
      location_name: location.display_name,
      latitude: location.latitude,
      longitude: location.longitude,
      observed_at: new Date().toISOString(),
      aqi: {
        aqi,
        band,
        dominant_pollutant: { label: pollutant, ratio_percent: Math.min(178, Math.round(aqi * 0.76)) },
        pollutants: [
          { label: 'PM2.5', ratio_percent: Math.min(180, Math.round(aqi * 0.78)) },
          { label: 'PM10', ratio_percent: Math.min(160, Math.round(aqi * 0.62)) },
          { label: 'NO2', ratio_percent: Math.min(120, Math.round(aqi * 0.28)) },
          { label: 'O3', ratio_percent: Math.min(135, Math.round(aqi * 0.42)) },
          { label: 'CO', ratio_percent: Math.min(90, Math.round(aqi * 0.16)) }
        ]
      },
      weather: {
        current: {
          temperature_2m: temp,
          apparent_temperature: temp + (humidity > 65 ? 3 : 1),
          relative_humidity_2m: humidity,
          dew_point_2m: Math.round(temp - ((100 - humidity) / 5)),
          precipitation: aqi < 70 ? 0.2 : 0,
          rain: aqi < 70 ? 0.1 : 0,
          cloud_cover: humidity > 60 ? 72 : 36,
          wind_speed_10m: wind,
          wind_gusts_10m: wind + 8,
          wind_direction_10m: Math.round(Math.abs(location.longitude * 3) % 360),
          pressure_msl: 1012,
          visibility: aqi > 150 ? 6500 : 12000,
          uv_index: temp > 30 ? 8 : 4,
          weather_label: aqi > 150 ? 'Haze' : 'Partly clear'
        },
        daily: temps.map((d, i) => ({ ...d, precipitation_probability_max: i === 0 ? (humidity > 60 ? 48 : 16) : 20 + i * 8, uv_index_max: temp > 30 ? 8 : 5, wind_gusts_10m_max: wind + 9 + i, precipitation_sum: i === 0 ? 0.4 : i * 0.2, sunrise: `2026-06-2${i}T05:3${i}`, sunset: `2026-06-2${i}T18:5${i}` })),
        hourly: hours.map((h, i) => ({ time: h.time, temperature_2m: temp + Math.round(Math.sin(i / 4) * 3), apparent_temperature: temp + 2, precipitation_probability: humidity > 62 ? 40 : 12, rain: humidity > 70 ? 0.2 : 0, wind_speed_10m: wind, wind_gusts_10m: wind + 6, uv_index: i > 9 && i < 16 ? 6 : 1, weather_label: humidity > 70 ? 'Cloudy' : 'Clear' }))
      },
      forecast: { hourly: hours, daily: temps },
      insights: buildInsights(aqi, band.label, pollutant, wind, humidity),
      fallback: true
    };
  }

  function getAqiBand(aqi) {
    if (aqi <= 50) return { label: 'Good', color: '#32dc7d', key: 'good' };
    if (aqi <= 100) return { label: 'Moderate', color: '#ffd84d', key: 'moderate' };
    if (aqi <= 150) return { label: 'Unhealthy for Sensitive', color: '#ff8a24', key: 'usg' };
    if (aqi <= 200) return { label: 'Unhealthy', color: '#ff453a', key: 'unhealthy' };
    if (aqi <= 300) return { label: 'Very Unhealthy', color: '#b45cff', key: 'very' };
    return { label: 'Hazardous', color: '#ff3a9a', key: 'hazard' };
  }

  function buildInsights(aqi, band, pollutant, wind, humidity) {
    return {
      source: state.usingFallback ? 'demo rules' : 'backend rules',
      summary: `AQI is ${aqi}, currently classified as ${band}. ${pollutant} is the main pollutant to watch.`,
      health_guidance: aqi > 150 ? 'Avoid long outdoor activity, use a mask if needed, and keep windows closed during peak traffic hours.' : 'Most users can continue normal activity, but sensitive groups should keep monitoring changes.',
      activity_suggestion: aqi > 150 ? 'Prefer indoor workouts today. Schedule outdoor work early morning only if readings improve.' : 'Outdoor activity is acceptable; keep checking the trend if you are sensitive to dust or pollen.',
      trend_explanation: `Wind is around ${wind} km/h and humidity is ${humidity}%, so local AQI can shift quickly near traffic corridors.`
    };
  }


  async function fetchDisasterWatch() {
    const loc = state.location;
    try {
      const data = await requestJson(`/api/disasters?${qp({ lat: loc.latitude, lon: loc.longitude, name: loc.display_name })}`, 9000);
      renderDisasterWatch(data);
    } catch {
      renderDisasterWatch(mockDisasterWatch(loc));
    }
  }

  function mockDisasterWatch(location) {
    const base = Math.abs(Math.sin((location.latitude + location.longitude) / 13));
    const nearQuake = base > .62;
    const riskScore = nearQuake ? 42 : Math.round(base * 24);
    return {
      location_name: location.display_name,
      generated_at: new Date().toISOString(),
      risk_score: riskScore,
      risk_label: riskScore > 55 ? 'High' : riskScore > 30 ? 'Moderate' : 'Low',
      summary: nearQuake ? 'A small regional earthquake signal is being watched. No critical warning in demo mode.' : 'No major nearby natural-event signal found in the demo feed.',
      earthquakes: nearQuake ? [{ title: 'Regional earthquake watch', place: 'Within regional monitoring radius', magnitude: 4.1, distance_km: 610, risk: 'Low' }] : [],
      events: base > .38 ? [{ title: 'Weather disturbance watch', category: 'Severe Storms', distance_km: 420, source: 'Demo hazard model' }] : [],
      sources: ['Demo feed'],
      errors: []
    };
  }

  function renderDisasterWatch(data) {
    state.disasterWatch = data;
    const score = Number(data?.risk_score ?? 0);
    const label = data?.risk_label || (score > 55 ? 'High' : score > 30 ? 'Moderate' : 'Low');
    const riskPill = $('[data-disaster-risk]');
    if (riskPill) {
      riskPill.textContent = `${label} risk`;
      riskPill.className = `pill ${score > 55 ? 'fail' : score > 30 ? 'warn' : 'ok'}`;
    }
    $('[data-risk-score]') && ($('[data-risk-score]').textContent = `${score}/100`);
    $('[data-risk-summary]') && ($('[data-risk-summary]').textContent = data?.summary || 'No major nearby hazard signal found.');
    const topQuake = (data?.earthquakes || [])[0];
    $('[data-nearest-quake]') && ($('[data-nearest-quake]').textContent = topQuake ? `M${fmt(topQuake.magnitude, 1)}` : 'None nearby');
    $('[data-nearest-quake-note]') && ($('[data-nearest-quake-note]').textContent = topQuake ? `${topQuake.place || topQuake.title} · ${topQuake.distance_km} km away` : 'No notable nearby quake in the current feed.');
    $('[data-natural-events]') && ($('[data-natural-events]').textContent = `${(data?.events || []).length} open`);
    $('[data-natural-events-note]') && ($('[data-natural-events-note]').textContent = (data?.events || [])[0]?.category || 'No open NASA EONET event near this location.');
    const list = $('[data-hazard-list]');
    if (list) {
      const hazards = [
        ...(data?.earthquakes || []).slice(0, 3).map((q) => ({ kind: q.risk || 'Low', title: q.title || 'Earthquake', body: `Magnitude ${fmt(q.magnitude, 1)} · ${q.distance_km} km away${q.tsunami ? ' · tsunami flag' : ''}` })),
        ...(data?.events || []).slice(0, 3).map((e) => ({ kind: 'Event', title: e.title || 'Natural event', body: `${e.category || 'Natural event'} · ${e.distance_km} km away · ${e.source || 'Live feed'}` }))
      ];
      if (!hazards.length && (data?.errors || []).length) {
        hazards.push({ kind: 'Feed notice', title: 'Live hazard feeds unavailable', body: 'USGS/NASA feeds did not respond in time. The dashboard keeps running and will retry on refresh.' });
      }
      list.innerHTML = hazards.length ? hazards.map((h) => `<article><span>${escapeHtml(h.kind)}</span><strong>${escapeHtml(h.title)}</strong><p>${escapeHtml(h.body)}</p></article>`).join('') : '<article><span>Stable</span><strong>No major nearby hazard</strong><p>Live feeds do not show an immediate earthquake or natural-event warning near this location.</p></article>';
    }
    renderNewsBriefing(state.snapshot || mockSnapshot(state.location), data);
    if (state.snapshot) renderAlerts(state.snapshot);
  }

  function renderSnapshot(snapshot) {
    state.snapshot = snapshot;
    state.lastUpdated = new Date();
    const aqi = Number(snapshot.aqi?.aqi ?? 0);
    const band = snapshot.aqi?.band || getAqiBand(aqi);
    const weather = snapshot.weather?.current || {};
    const pollutant = snapshot.aqi?.dominant_pollutant || snapshot.aqi?.pollutants?.[0] || { label: 'PM2.5', ratio_percent: 0 };

    const displayName = state.location?.display_name || snapshot.location_name || 'Selected location';
    snapshot.location_name = displayName;
    setTextAll('[data-summary-location]', displayName);
    setText('[data-top-location]', displayName);
    setText('[data-detail-title]', displayName.split(',').slice(0, 2).join(', '));
    setTextAll('[data-aqi-value]', aqi || '—');
    setTextAll('[data-aqi-stat]', aqi || '—');
    setText('[data-detail-aqi]', aqi || '—');
    setTextAll('[data-aqi-band]', band.label || 'Unavailable');
    $$('[data-aqi-value]').forEach((node) => { node.style.color = band.color || '#ff8a24'; });
    setTextAll('[data-aqi-note]', band.label ? `${band.label} conditions detected` : 'Waiting for live readings');
    setTextAll('[data-pollutant]', pollutant.label || '—');
    setTextAll('[data-pollutant-note]', pollutant.ratio_percent ? `${Math.round(pollutant.ratio_percent)}% of reference ceiling` : 'Pollutant ratio unavailable');
    setTextAll('[data-temp]', Number.isFinite(Number(weather.temperature_2m)) ? `${Math.round(weather.temperature_2m)}°C` : '—');
    setText('[data-detail-temp]', Number.isFinite(Number(weather.temperature_2m)) ? `${Math.round(weather.temperature_2m)}°C` : '—');
    setTextAll('[data-weather-note]', weather.weather_label || 'Weather loading');
    setTextAll('[data-humidity]', Number.isFinite(Number(weather.relative_humidity_2m)) ? `${Math.round(weather.relative_humidity_2m)}%` : '—');
    setText('[data-detail-humidity]', Number.isFinite(Number(weather.relative_humidity_2m)) ? `${Math.round(weather.relative_humidity_2m)}%` : '—');
    setTextAll('[data-wind]', Number.isFinite(Number(weather.wind_speed_10m)) ? `${Math.round(weather.wind_speed_10m)} km/h` : '—');
    setText('[data-detail-wind]', Number.isFinite(Number(weather.wind_speed_10m)) ? `${Math.round(weather.wind_speed_10m)} km/h` : '—');
    setText('[data-pressure]', Number.isFinite(Number(weather.pressure_msl)) ? `${Math.round(weather.pressure_msl)} hPa` : '1012 hPa');
    setText('[data-visibility]', weather.visibility ? formatVisibility(weather.visibility) : (aqi > 150 ? 'Moderate' : 'Good'));
    setTextAll('[data-refresh-status]', state.usingFallback ? 'Hybrid' : 'Live');
    setTextAll('[data-last-updated]', `Updated ${state.lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    setText('[data-status-mini]', state.usingFallback ? 'Hybrid demo' : 'Connected');
    setText('[data-data-source]', state.usingFallback ? 'Hybrid demo mode' : 'Live API mode');
    setText('[data-data-source-note]', state.usingFallback ? 'Live backend is reachable, but one or more external feeds were unavailable, so safe demo values filled the gaps.' : 'AQI, weather and forecast are coming from live API responses.');

    const selectedMarker = $('[data-selected-marker]');
    if (selectedMarker) {
      selectedMarker.textContent = aqi || '—';
      selectedMarker.dataset.aqi = String(aqi || '');
      selectedMarker.style.color = band.color || '#ff8a24';
    }
    setText('[data-city-detail-status]', document.body.classList.contains('is-zoomed') ? 'Detail layer active' : 'Zoom in to unlock');
    renderAlerts(snapshot);
    renderAreaCards(snapshot);
    renderInsights(snapshot.insights || buildInsights(aqi, band.label, pollutant.label, weather.wind_speed_10m || 0, weather.relative_humidity_2m || 0));
    renderVisitorGuide(snapshot);
    renderWeatherIntelligence(snapshot);
    renderNewsBriefing(snapshot, state.disasterWatch);
    updateCharts(snapshot);
    updateProjectLab(snapshot);
    renderGlobeDataBoard(snapshot);
    state.globe?.setSelected(state.location.latitude, state.location.longitude, aqi, band.color);
  }

  function renderAlerts(snapshot) {
    const list = $('[data-alert-list]');
    const level = $('[data-alert-level]');
    const count = $('[data-alert-count]');
    const aqi = Number(snapshot.aqi?.aqi ?? 0);
    const band = snapshot.aqi?.band?.label || getAqiBand(aqi).label;
    const pollutant = snapshot.aqi?.dominant_pollutant?.label || 'PM2.5';
    const weather = snapshot.weather?.current || {};
    const alerts = [];
    if (aqi > 200) alerts.push(['danger', 'Severe AQI warning', `AQI ${aqi} is ${band}. Avoid outdoor exposure and use clean-air precautions.`]);
    else if (aqi > 150) alerts.push(['danger', 'Unhealthy air detected', `AQI ${aqi} is ${band}. Reduce outdoor time and protect sensitive groups.`]);
    else if (aqi > 100) alerts.push(['warn', 'Sensitive group caution', `AQI ${aqi} is ${band}. Children, older adults and asthma-sensitive users should limit exposure.`]);
    else alerts.push(['good', 'Air quality acceptable', `AQI ${aqi} is ${band}. Conditions are manageable for most users.`]);
    alerts.push(['warn', `${pollutant} focus layer`, `${pollutant} is the dominant pollutant. Check traffic-heavy areas in zoom view.`]);
    if ((weather.wind_speed_10m || 0) > 18) alerts.push(['warn', 'Wind shift possible', `Wind is ${Math.round(weather.wind_speed_10m)} km/h, so hotspots may move quickly.`]);
    const disaster = state.disasterWatch;
    if (disaster && Number(disaster.risk_score || 0) > 55) alerts.push(['danger', 'Disaster watch elevated', `${disaster.risk_label} hazard signal: ${disaster.summary}`]);
    else if (disaster && Number(disaster.risk_score || 0) > 30) alerts.push(['warn', 'Disaster watch active', `${disaster.risk_label} hazard signal: ${disaster.summary}`]);
    if (state.usingFallback) alerts.push(['warn', 'Demo fallback active', 'Start the FastAPI backend to load live API data and DOCX reports.']);
    state.currentAlerts = alerts;
    list.innerHTML = alerts.slice(0, 4).map(([kind, title, body]) => `<article class="alert-item ${kind}"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(body)}</span></article>`).join('');
    const worst = alerts.some((a) => a[0] === 'danger') ? 'fail' : alerts.some((a) => a[0] === 'warn') ? 'warn' : 'ok';
    level.className = `pill ${worst}`;
    level.textContent = worst === 'fail' ? 'High risk' : worst === 'warn' ? 'Caution' : 'Stable';
    count.textContent = String(alerts.length);
  }


  function renderAreaCards(snapshot) {
    const root = $('[data-area-list]');
    if (!root) return;
    const baseAqi = Number(snapshot.aqi?.aqi ?? state.location.aqi ?? 80);
    const areas = [
      { name: 'Central corridor', note: 'Dense traffic and commercial activity', delta: 0, type: 'Traffic-heavy' },
      { name: 'Industrial belt', note: 'Factory and freight movement influence', delta: 22, type: 'PM hotspot' },
      { name: 'Residential zone', note: 'Usually calmer, varies during peak hours', delta: -38, type: 'Lower exposure' },
      { name: 'Airport / highway zone', note: 'Vehicle emissions and dust movement', delta: 14, type: 'Mobility impact' }
    ].map((area, index) => {
      const aqi = clamp(Math.round(baseAqi + area.delta + Math.sin(index + baseAqi) * 7), 25, 310);
      return { ...area, aqi, band: getAqiBand(aqi) };
    }).sort((a, b) => b.aqi - a.aqi);
    root.innerHTML = areas.map((area) => `
      <article class="area-card" style="--area-color:${area.band.color}">
        <span>${escapeHtml(area.type)}</span>
        <strong>${escapeHtml(area.name)}</strong>
        <b>AQI ${area.aqi}</b>
        <p>${escapeHtml(area.band.label)} · ${escapeHtml(area.note)}</p>
      </article>`).join('');
  }

  function openAlertMessage() {
    const modal = $('#alertModal');
    const body = $('#alertModalBody');
    if (!modal || !body) return;
    const snap = state.snapshot || mockSnapshot(state.location);
    const aqi = Number(snap.aqi?.aqi ?? 0);
    const band = snap.aqi?.band?.label || getAqiBand(aqi).label;
    const pollutant = snap.aqi?.dominant_pollutant?.label || 'PM2.5';
    const weather = snap.weather?.current || {};
    const topAlerts = state.currentAlerts.length ? state.currentAlerts : [['warn', 'AQI update', `AQI ${aqi} is ${band}.`]];
    body.innerHTML = `
      <div class="alert-score"><strong>AQI ${aqi}</strong><span>${escapeHtml(band)}</span></div>
      <p><b>Main pollutant:</b> ${escapeHtml(pollutant)}. <b>Weather:</b> ${fmt(weather.temperature_2m)}°C, ${fmt(weather.relative_humidity_2m)}% humidity, ${fmt(weather.wind_speed_10m)} km/h wind.</p>
      <div class="alert-modal-list">${topAlerts.slice(0, 5).map(([kind, title, text]) => `<article class="${kind}"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(text)}</span></article>`).join('')}</div>
      <p><b>Disaster watch:</b> ${escapeHtml(state.disasterWatch?.risk_label || 'Loading')} risk · ${escapeHtml(state.disasterWatch?.summary || 'Checking earthquake and natural-event feeds.')}</p>
      <p class="alert-action"><b>Suggested action:</b> ${aqi > 150 ? 'Avoid long outdoor activity, keep windows closed near traffic areas, and use a mask if you must travel.' : aqi > 100 ? 'Sensitive groups should reduce outdoor exposure and check the trend before travelling.' : 'Air is acceptable for most people; keep monitoring if you are sensitive.'}</p>`;
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('show'));
  }

  function closeAlertMessage() {
    const modal = $('#alertModal');
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(() => { modal.hidden = true; }, 160);
  }

  function renderInsights(insights) {
    const root = $('[data-insights]');
    if (!root) return;
    $('[data-insight-source]').textContent = insights.source || (state.usingFallback ? 'demo rules' : 'backend');
    const cards = [
      ['Situation summary', insights.summary],
      ['Health guidance', insights.health_guidance],
      ['Activity suggestion', insights.activity_suggestion],
      ['Trend explanation', insights.trend_explanation]
    ];
    root.innerHTML = cards.map(([title, text]) => `<article><h4>${escapeHtml(title)}</h4><p>${escapeHtml(text || 'No insight available yet.')}</p></article>`).join('');
  }


  function renderVisitorGuide(snapshot) {
    const aqi = Number(snapshot.aqi?.aqi ?? 0);
    const band = snapshot.aqi?.band || getAqiBand(aqi);
    const pollutant = snapshot.aqi?.dominant_pollutant?.label || 'PM2.5';
    const weather = snapshot.weather?.current || {};
    const risk = $('[data-visitor-risk]');
    const health = $('[data-visitor-health]');
    const healthNote = $('[data-visitor-health-note]');
    const outdoor = $('[data-visitor-outdoor]');
    const outdoorNote = $('[data-visitor-outdoor-note]');
    const cause = $('[data-visitor-cause]');
    const causeNote = $('[data-visitor-cause-note]');
    if (risk) {
      risk.textContent = band.label || 'AQI status';
      risk.className = `pill ${aqi > 150 ? 'fail' : aqi > 100 ? 'warn' : 'ok'}`;
    }
    if (health) health.textContent = aqi > 150 ? 'Reduce outdoor exposure' : aqi > 100 ? 'Sensitive groups be careful' : 'Normal activity is okay';
    if (healthNote) healthNote.textContent = aqi > 150 ? 'Avoid long outdoor work, use a mask during commute, and keep windows closed near traffic.' : aqi > 100 ? 'Children, older adults and asthma-sensitive users should limit long outdoor time.' : 'Air is acceptable for most visitors. Keep monitoring if you are sensitive.';
    if (outdoor) outdoor.textContent = aqi > 150 ? 'Prefer indoor plans' : aqi > 100 ? 'Short outdoor trips only' : 'Outdoor plan looks fine';
    if (outdoorNote) outdoorNote.textContent = `Current weather: ${fmt(weather.temperature_2m)}°C, ${fmt(weather.relative_humidity_2m)}% humidity, ${fmt(weather.wind_speed_10m)} km/h wind.`;
    if (cause) cause.textContent = `${pollutant} is driving AQI`;
    if (causeNote) causeNote.textContent = pollutant === 'O3' ? 'Ozone often rises with sunlight and heat; check afternoon values.' : pollutant.includes('PM') ? 'Fine dust/smoke can come from traffic, construction, industry or stagnant air.' : 'Traffic and local emissions may be influencing current air quality.';
  }


  function renderWeatherIntelligence(snapshot) {
    const weather = snapshot.weather?.current || {};
    const daily = snapshot.weather?.daily || [];
    const hourly = snapshot.weather?.hourly || [];
    const today = daily[0] || {};
    const temp = Number(weather.temperature_2m);
    const feels = Number(weather.apparent_temperature ?? temp);
    const rainChance = Number(today.precipitation_probability_max ?? hourly[0]?.precipitation_probability ?? 0);
    const uv = Number(weather.uv_index ?? today.uv_index_max ?? 0);
    const gust = Number(weather.wind_gusts_10m ?? today.wind_gusts_10m_max ?? 0);
    const visibilityKm = Number(weather.visibility) / 1000;
    setText('[data-feels-like]', Number.isFinite(feels) ? `${Math.round(feels)}°C` : '—');
    setText('[data-rain-chance]', Number.isFinite(rainChance) ? `${Math.round(rainChance)}%` : '—');
    setText('[data-uv-index]', Number.isFinite(uv) ? `${fmt(uv, 1)}` : '—');
    setText('[data-uv-note]', uv >= 8 ? 'Very high sun exposure.' : uv >= 6 ? 'High sun exposure.' : 'Manageable sun exposure.');
    setText('[data-wind-gust]', Number.isFinite(gust) ? `${Math.round(gust)} km/h` : '—');
    setText('[data-cloud-cover]', Number.isFinite(Number(weather.cloud_cover)) ? `${Math.round(weather.cloud_cover)}%` : '—');
    setText('[data-dew-point]', Number.isFinite(Number(weather.dew_point_2m)) ? `${Math.round(weather.dew_point_2m)}°C` : '—');
    setText('[data-visibility-m]', Number.isFinite(visibilityKm) ? `${fmt(visibilityKm, 1)} km` : (weather.visibility || '—'));
    setText('[data-sun-times]', formatSunPair(today.sunrise, today.sunset));
    const aqi = Number(snapshot.aqi?.aqi ?? 0);
    const score = outdoorScore(aqi, rainChance, uv, gust, feels);
    const scoreNode = $('[data-outdoor-score]');
    if (scoreNode) {
      scoreNode.textContent = `${score.label} · ${score.value}/100`;
      scoreNode.className = `pill ${score.value >= 70 ? 'ok' : score.value >= 42 ? 'warn' : 'fail'}`;
    }
    const root = $('[data-outdoor-plan]');
    if (root) {
      root.innerHTML = buildOutdoorPlan(snapshot, rainChance, uv, gust, score).map((item) => `<article><span>${escapeHtml(item.time)}</span><strong>${escapeHtml(item.label)}</strong><p>${escapeHtml(item.note)}</p></article>`).join('');
    }
  }

  function outdoorScore(aqi, rainChance, uv, gust, feels) {
    let value = 100;
    if (aqi > 200) value -= 55;
    else if (aqi > 150) value -= 38;
    else if (aqi > 100) value -= 22;
    if (rainChance > 65) value -= 16;
    if (uv > 7) value -= 12;
    if (gust > 38) value -= 15;
    if (feels > 38 || feels < 4) value -= 15;
    value = clamp(Math.round(value), 5, 100);
    return { value, label: value >= 70 ? 'Good window' : value >= 42 ? 'Use caution' : 'Avoid long exposure' };
  }

  function buildOutdoorPlan(snapshot, rainChance, uv, gust, score) {
    const aqi = Number(snapshot.aqi?.aqi ?? 0);
    return [
      { time: 'Morning', label: aqi > 150 ? 'Short essential trips' : 'Best outdoor slot', note: aqi > 150 ? 'Use a mask near traffic and keep activity light.' : 'Usually calmer for heat and ozone; still check AQI trend.' },
      { time: 'Afternoon', label: (uv > 7 || rainChance > 65) ? 'Plan carefully' : 'Moderate comfort', note: `UV ${fmt(uv,1)}, rain chance ${Math.round(rainChance || 0)}%, gusts ${Math.round(gust || 0)} km/h.` },
      { time: 'Evening', label: score.value >= 55 ? 'Good for short plans' : 'Keep it light', note: 'Watch traffic-related PM and NO₂ peaks before commuting.' }
    ];
  }

  function renderNewsBriefing(snapshot, disaster) {
    const root = $('[data-news-list]');
    if (!root) return;
    const aqi = Number(snapshot?.aqi?.aqi ?? 0);
    const band = snapshot?.aqi?.band?.label || getAqiBand(aqi).label;
    const weather = snapshot?.weather?.current || {};
    const pollutant = snapshot?.aqi?.dominant_pollutant?.label || 'PM2.5';
    const hazards = disaster || state.disasterWatch || mockDisasterWatch(state.location);
    const cards = [
      { tag: 'Air update', title: `${state.location.display_name}: AQI ${aqi || '—'} (${band})`, body: `${pollutant} is the key pollutant to track. Visitors should use the alert panel before outdoor activity.` },
      { tag: 'Weather watch', title: `${weather.weather_label || 'Weather'} · ${fmt(weather.temperature_2m)}°C`, body: `Humidity ${fmt(weather.relative_humidity_2m)}%, wind ${fmt(weather.wind_speed_10m)} km/h, gusts ${fmt(weather.wind_gusts_10m)} km/h.` },
      { tag: 'Hazard watch', title: `${hazards.risk_label || 'Low'} disaster signal`, body: hazards.summary || 'No major nearby disaster signal found right now.' },
      { tag: 'Visitor tip', title: aqi > 150 ? 'Prefer indoor plans' : 'Outdoor planning possible', body: aqi > 150 ? 'Use mask, avoid long exertion, and keep windows closed near traffic corridors.' : 'Conditions are manageable for most users, but sensitive visitors should watch trend changes.' }
    ];
    root.innerHTML = cards.map((item) => `<article><span>${escapeHtml(item.tag)}</span><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.body)}</p></article>`).join('');
  }

  function formatSunPair(sunrise, sunset) {
    const a = formatShortTime(sunrise);
    const b = formatShortTime(sunset);
    if (a === '—' && b === '—') return '—';
    return `${a} / ${b}`;
  }

  function formatShortTime(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value).slice(-5) || '—';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function setText(selector, value) {
    const node = $(selector);
    if (node) node.textContent = value;
  }

  function formatCoordinate(value, positive, negative) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '—';
    const suffix = number >= 0 ? positive : negative;
    return `${Math.abs(number).toFixed(4)}°${suffix}`;
  }

  function formatVisibility(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return String(value || '—');
    return number > 1000 ? `${(number / 1000).toFixed(1)} km` : `${Math.round(number)} m`;
  }

  function setSystemStatus(text) {
    const pill = $('[data-status-mini]');
    if (pill) pill.textContent = text;
  }

  async function handleSearchInput(event) {
    const query = event.target.value.trim();
    const box = $('#searchResults');
    if (!box) return;
    if (query.length < 2) { box.hidden = true; return; }
    let results = [];
    try {
      const data = await requestJson(`/api/geocode/search?${qp({ q: query, count: 8 })}`, 5000);
      results = data.results || data.locations || [];
    } catch {
      results = sampleCities.filter((city) => city.display_name.toLowerCase().includes(query.toLowerCase()));
    }
    if (!results.length) {
      box.innerHTML = '<div class="search-result muted">No matching city found. Press Search to use this name with demo coordinates.</div>';
      box.hidden = false;
      return;
    }
    box.innerHTML = results.slice(0, 8).map((item) => `<button class="search-result" type="button" data-lat="${item.latitude}" data-lon="${item.longitude}" data-name="${escapeHtml(item.display_name)}">${escapeHtml(item.display_name)}<small>${fmt(item.latitude, 3)}, ${fmt(item.longitude, 3)}</small></button>`).join('');
    box.hidden = false;
    $$('button[data-lat]', box).forEach((button) => button.addEventListener('click', () => {
      $('#searchInput').value = button.dataset.name;
      box.hidden = true;
      setLocation({ display_name: button.dataset.name, latitude: Number(button.dataset.lat), longitude: Number(button.dataset.lon) }, 'search');
      toast(`Dashboard updated for ${button.dataset.name}. AQI, weather, alerts, disaster watch and charts refreshed.`);
    }));
  }

  async function searchAndSelect(query) {
    try {
      const data = await requestJson(`/api/geocode/search?${qp({ q: query, count: 1 })}`, 5500);
      const item = (data.results || data.locations || [])[0];
      if (item) {
        setLocation(item, 'search');
        toast(`Dashboard updated for ${item.display_name}. AQI, weather, alerts, disaster watch and charts refreshed.`);
        return;
      }
    } catch {}
    const fallback = sampleCities.find((city) => city.display_name.toLowerCase().includes(query.toLowerCase())) || { display_name: query, latitude: state.location.latitude || 28.6139, longitude: state.location.longitude || 77.2090, aqi: state.location.aqi };
    setLocation(fallback, 'search');
    toast(`Using ${fallback.display_name} with safe fallback coordinates because the exact city was not found.`);
  }

  async function useBrowserLocation() {
    if (!navigator.geolocation) { toast('Browser location is not supported.'); return; }
    setSystemStatus('Requesting browser location…');
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      let name = `${fmt(latitude, 4)}, ${fmt(longitude, 4)}`;
      try {
        const data = await requestJson(`/api/geocode/reverse?${qp({ lat: latitude, lon: longitude })}`, 4500);
        name = data.display_name || name;
      } catch {}
      setLocation({ display_name: name, latitude, longitude }, 'browser');
      toast('Browser location applied. The dashboard is now using your current coordinates.');
    }, () => toast('Location permission denied. You can still search manually by city, country or ZIP code.'), { enableHighAccuracy: true, timeout: 9000 });
  }

  async function downloadReport() {
    const status = $('[data-report-status]');
    const button = $('#generateReportButton');
    button.disabled = true;
    status.textContent = 'Preparing report…';
    try {
      const loc = state.location;
      const response = await fetch(buildApiUrl(`/api/report/docx?${qp({ lat: loc.latitude, lon: loc.longitude, name: loc.display_name })}`));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      downloadBlob(blob, `aqi-report-${slug(loc.display_name)}.docx`);
      status.textContent = 'DOCX report downloaded successfully.';
      toast('DOCX report downloaded with current location, AQI, weather and visitor advice.');
    } catch {
      const snap = state.snapshot || mockSnapshot(state.location);
      const report = [
        'AQI Globe Dashboard Report',
        `Location: ${state.location.display_name}`,
        `Coordinates: ${fmt(state.location.latitude, 4)}, ${fmt(state.location.longitude, 4)}`,
        `AQI: ${snap.aqi?.aqi ?? '—'} (${snap.aqi?.band?.label || 'Unavailable'})`,
        `Dominant pollutant: ${snap.aqi?.dominant_pollutant?.label || '—'}`,
        `Temperature: ${snap.weather?.current?.temperature_2m ?? '—'}°C`,
        `Humidity: ${snap.weather?.current?.relative_humidity_2m ?? '—'}%`,
        `Wind: ${snap.weather?.current?.wind_speed_10m ?? '—'} km/h`,
        '',
        'Note: This fallback text report was created because the FastAPI backend was not reachable. Run python main.py for DOCX export.'
      ].join('\n');
      downloadBlob(new Blob([report], { type: 'text/plain' }), `aqi-report-${slug(state.location.display_name)}.txt`);
      status.textContent = 'Backend unavailable, demo text report downloaded.';
      toast('Fallback text report downloaded because backend DOCX export was not available.');
    } finally {
      button.disabled = false;
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function slug(text) {
    return String(text).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'location';
  }

  function initCharts() {
    if (window.Chart) {
      Chart.defaults.font.family = 'Inter, Arial, sans-serif';
      Chart.defaults.font.size = 14;
      Chart.defaults.color = '#d8e6f7';
      Chart.defaults.devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    }
    ['miniTrend', 'aqiTrendChart', 'pollutantChart', 'temperatureChart', 'correlationChart', 'radarChart', 'localHistoryChart', 'cityCompareChart', 'forecast7DayChart'].forEach((id) => {
      const canvas = document.getElementById(id);
      if (canvas) state.charts[id] = canvas;
    });
    $('#correlationAxis')?.addEventListener('change', () => updateCharts(state.snapshot || mockSnapshot(state.location)));
  }

  function updateCharts(snapshot) {
    const hourly = snapshot?.forecast?.hourly || [];
    const fallback = mockSnapshot(state.location);
    const hourData = hourly.length ? hourly : fallback.forecast.hourly;
    const values = hourData.map((item) => Number(item.us_aqi ?? item.aqi ?? item.value ?? 0));
    const labels = hourData.map((item, index) => formatHourLabel(item.time, index));
    const pollutants = snapshot?.aqi?.pollutants?.length ? snapshot.aqi.pollutants : fallback.aqi.pollutants;
    const pollutantLabels = pollutants.map((p) => cleanPollutantLabel(p.label || p.name));
    const pollutantValues = pollutants.map((p) => Number(p.ratio_percent ?? p.value ?? 0));
    const daily = snapshot?.forecast?.daily || fallback.forecast.daily;
    const dLabels = daily.map((d, i) => formatDayLabel(d.date || d.time, i));
    const max = daily.map((d) => Number(d.max_temperature_2m ?? d.max ?? d.temperature_2m_max ?? 0));
    const min = daily.map((d) => Number(d.min_temperature_2m ?? d.min ?? d.temperature_2m_min ?? 0));

    updateChartSummary(labels, values, pollutantLabels, pollutantValues, max, min);

    if (window.Chart) {
      renderChartLine('miniTrend', labels, values, { mini: true, color: getAqiBand(values.at(-1) || 0).color, label: 'AQI' });
      renderChartLine('aqiTrendChart', labels, values, { color: '#ff8a24', label: 'US AQI', thresholds: true });
      renderChartBar('pollutantChart', pollutantLabels, pollutantValues);
      renderChartDualLine('temperatureChart', dLabels, max, min);
      renderSevenDayForecastChart(snapshot);
      renderCorrelationChart(snapshot, hourData);
      renderRadarChart(pollutantLabels, pollutantValues);
      fetchLocalHistory().catch(() => renderHistoryChart(null));
    } else {
      drawLineChart(state.charts.miniTrend, labels, values, { mini: true, color: getAqiBand(values.at(-1) || 0).color });
      drawLineChart(state.charts.aqiTrendChart, labels, values, { color: '#ff8a24', label: 'US AQI', maxTicks: 6 });
      drawBarChart(state.charts.pollutantChart, pollutantLabels, pollutantValues);
      drawDualLineChart(state.charts.temperatureChart, dLabels, max, min);
      renderChartUnavailable('forecast7DayChart');
      renderChartUnavailable('correlationChart');
      renderChartUnavailable('radarChart');
      renderChartUnavailable('localHistoryChart');
    }

    updateGauge(snapshot);
    updateTreemap(pollutants);
    updateBestOutdoorWindow(hourData);
  }

  function updateChartSummary(labels, values, pollutantLabels, pollutantValues, highTemps, lowTemps) {
    const safeValues = values.filter((value) => Number.isFinite(Number(value))).map(Number);
    const avg = safeValues.length ? Math.round(safeValues.reduce((sum, value) => sum + value, 0) / safeValues.length) : '—';
    const peak = safeValues.length ? Math.round(Math.max(...safeValues)) : '—';
    const first = safeValues[0] ?? 0;
    const last = safeValues.at(-1) ?? first;
    const diff = last - first;
    const trend = Math.abs(diff) < 5 ? 'Stable' : diff > 0 ? 'Rising' : 'Improving';

    const pollutantPairs = pollutantLabels.map((label, index) => ({ label, value: Number(pollutantValues[index] ?? 0) })).filter((item) => Number.isFinite(item.value));
    const dominant = pollutantPairs.sort((a, b) => b.value - a.value)[0];

    const highs = highTemps.filter((value) => Number.isFinite(Number(value))).map(Number);
    const lows = lowTemps.filter((value) => Number.isFinite(Number(value))).map(Number);
    const high = highs.length ? Math.round(Math.max(...highs)) : null;
    const low = lows.length ? Math.round(Math.min(...lows)) : null;

    setText('[data-aqi-chart-avg]', avg === '—' ? '—' : `${avg}`);
    setText('[data-aqi-chart-peak]', peak === '—' ? '—' : `${peak}`);
    setText('[data-aqi-chart-trend]', trend);
    setText('[data-pollutant-chart-main]', dominant?.label || '—');
    setText('[data-pollutant-chart-load]', dominant ? `${Math.round(dominant.value)}%` : '—');
    setText('[data-temp-chart-high]', high === null ? '—' : `${high}°C`);
    setText('[data-temp-chart-low]', low === null ? '—' : `${low}°C`);
    setText('[data-temp-chart-range]', high === null || low === null ? '—' : `${Math.max(0, high - low)}°`);
  }

  const chartValueLabelsPlugin = {
    id: 'inlineValueLabels',
    afterDatasetsDraw(chart, args, options) {
      if (!options || !options.enabled) return;
      const { ctx } = chart;
      const suffix = options.suffix || '';
      const maxLabels = options.maxLabels || 8;
      ctx.save();
      ctx.font = '900 13px Inter, Arial, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = options.color || '#ffffff';
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(0,0,0,.82)';
      const horizontalBar = chart.config.type === 'bar' && chart.options.indexAxis === 'y';
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        if (dataset.skipValueLabels) return;
        const meta = chart.getDatasetMeta(datasetIndex);
        if (!meta || meta.hidden) return;
        const skipStep = Math.max(1, Math.ceil((dataset.data?.length || 1) / maxLabels));
        meta.data.forEach((element, index) => {
          if (index !== 0 && index !== dataset.data.length - 1 && index % skipStep !== 0) return;
          const raw = dataset.data[index];
          const value = typeof raw === 'object' && raw !== null ? raw.y : raw;
          if (!Number.isFinite(Number(value))) return;
          const position = element.tooltipPosition();
          const label = `${Math.round(Number(value))}${suffix}`;
          const x = horizontalBar ? Math.min(chart.chartArea.right - 30, position.x + 20) : position.x;
          const y = horizontalBar ? position.y : position.y - 14;
          ctx.textAlign = horizontalBar ? 'left' : 'center';
          ctx.strokeText(label, x, y);
          ctx.fillText(label, x, y);
        });
      });
      ctx.restore();
    }
  };

  function chartBaseOptions(extra = {}) {
    const base = {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 650, easing: 'easeOutQuart' },
      resizeDelay: 120,
      devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      interaction: { mode: 'nearest', intersect: false },
      layout: { padding: { top: 26, right: 30, bottom: 20, left: 20 } },
      elements: {
        line: { borderWidth: 3.5 },
        point: { radius: 4.5, hoverRadius: 7, borderWidth: 2 }
      },
      plugins: {
        legend: {
          position: 'top',
          align: 'start',
          labels: { color: '#f2f8ff', boxWidth: 13, boxHeight: 13, padding: 16, font: { weight: '900', size: 14 } }
        },
        tooltip: {
          backgroundColor: 'rgba(2, 7, 16, .98)',
          borderColor: '#62edff',
          borderWidth: 1.2,
          titleColor: '#ffffff',
          bodyColor: '#eef6ff',
          titleFont: { weight: '900', size: 14 },
          bodyFont: { weight: '800', size: 13 },
          padding: 14,
          displayColors: true,
          boxPadding: 6
        },
        inlineValueLabels: { enabled: false }
      },
      scales: {
        x: {
          ticks: { color: '#e6f0ff', maxRotation: 0, autoSkip: true, maxTicksLimit: 7, padding: 12, font: { weight: '900', size: 13 } },
          grid: { color: 'rgba(145,177,216,.18)', drawBorder: false },
          border: { color: 'rgba(145,177,216,.42)' },
          title: { color: '#ffffff', font: { weight: '900', size: 14 }, padding: { top: 10 } }
        },
        y: {
          ticks: { color: '#e6f0ff', padding: 12, font: { weight: '900', size: 13 } },
          grid: { color: 'rgba(145,177,216,.24)', drawBorder: false },
          border: { color: 'rgba(145,177,216,.42)' },
          title: { color: '#ffffff', font: { weight: '900', size: 14 }, padding: { bottom: 10 } },
          beginAtZero: true
        }
      }
    };
    return deepMerge(base, extra);
  }

  function deepMerge(target, source) {
    Object.entries(source || {}).forEach(([key, value]) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        target[key] = deepMerge({ ...(target[key] || {}) }, value);
      } else {
        target[key] = value;
      }
    });
    return target;
  }

  function setChart(id, config) {
    const canvas = state.charts[id];
    if (!canvas || !window.Chart) return null;
    if (state.chartInstances[id]) state.chartInstances[id].destroy();
    const height = chartCanvasHeights[id];
    if (height) {
      canvas.style.display = 'block';
      canvas.style.width = '100%';
      canvas.style.height = `${height}px`;
      canvas.style.maxHeight = `${height}px`;
      const shell = canvas.closest('.phase-chart-shell');
      if (shell) {
        canvas.style.height = '100%';
        canvas.style.maxHeight = '100%';
        shell.style.height = `${height}px`;
        shell.style.maxHeight = `${height}px`;
      }
    }
    state.chartInstances[id] = new Chart(canvas, config);
    return state.chartInstances[id];
  }

  function renderChartLine(id, labels, values, options = {}) {
    const color = options.color || '#35a3ff';
    const datasets = [{
      label: options.label || 'Value',
      data: values,
      borderColor: color,
      backgroundColor: transparentize(color, .20),
      pointRadius: options.mini ? 0 : 4.5,
      pointHoverRadius: 6,
      pointBorderWidth: 2,
      pointBackgroundColor: '#05080e',
      pointBorderColor: color,
      fill: !options.mini,
      tension: .42,
      borderWidth: options.mini ? 2 : 3.4,
      clip: false
    }];

    if (options.thresholds && labels.length) {
      datasets.push(
        { label: 'Sensitive guide', data: labels.map(() => 100), borderColor: 'rgba(255,216,77,.62)', borderDash: [7, 7], pointRadius: 0, borderWidth: 1.4, fill: false, skipValueLabels: true },
        { label: 'Unhealthy guide', data: labels.map(() => 150), borderColor: 'rgba(255,69,58,.62)', borderDash: [7, 7], pointRadius: 0, borderWidth: 1.4, fill: false, skipValueLabels: true }
      );
    }

    setChart(id, {
      type: 'line',
      data: { labels, datasets },
      plugins: [chartValueLabelsPlugin],
      options: chartBaseOptions({
        plugins: { legend: { display: !options.mini }, inlineValueLabels: { enabled: !options.mini, maxLabels: 6 } },
        scales: options.mini ? { x: { display: false }, y: { display: false } } : {
          ...chartBaseOptions().scales,
          x: { title: { display: true, text: 'Next 24 hours' } },
          y: { suggestedMax: Math.max(180, ...values.filter((v) => Number.isFinite(Number(v))).map(Number)), title: { display: true, text: 'US AQI' } }
        }
      })
    });
  }

  function renderChartDualLine(id, labels, maxValues, minValues) {
    setChart(id, {
      type: 'line',
      data: { labels, datasets: [
        { label: 'Daily high', data: maxValues, borderColor: '#ff8a24', backgroundColor: 'rgba(255,138,36,.13)', tension: .35, fill: false, pointRadius: 4, pointHoverRadius: 6, pointBorderWidth: 2, pointBackgroundColor: '#05080e' },
        { label: 'Daily low', data: minValues, borderColor: '#35a3ff', backgroundColor: 'rgba(53,163,255,.12)', tension: .35, fill: false, pointRadius: 4, pointHoverRadius: 6, pointBorderWidth: 2, pointBackgroundColor: '#05080e' }
      ] },
      plugins: [chartValueLabelsPlugin],
      options: chartBaseOptions({
        plugins: { inlineValueLabels: { enabled: true, suffix: '°', maxLabels: 4 } },
        scales: { x: { title: { display: true, text: 'Forecast days' } }, y: { title: { display: true, text: 'Temperature' }, ticks: { callback: (v) => `${v}°` } } }
      })
    });
  }

  function renderChartBar(id, labels, values) {
    setChart(id, {
      type: 'bar',
      data: { labels, datasets: [{
        label: '% of safety ceiling',
        data: values,
        backgroundColor: values.map((v) => transparentize(getAqiBand(v).color, .72)),
        borderColor: values.map((v) => getAqiBand(v).color),
        borderWidth: 1.5,
        borderRadius: 0,
        borderSkipped: false,
        barPercentage: .7,
        categoryPercentage: .74
      }] },
      plugins: [chartValueLabelsPlugin],
      options: chartBaseOptions({
        indexAxis: 'y',
        layout: { padding: { top: 18, right: 46, bottom: 18, left: 18 } },
        plugins: { inlineValueLabels: { enabled: true, suffix: '%', maxLabels: 6 } },
        scales: {
          x: { suggestedMax: Math.max(120, ...values.map((v) => Number(v) || 0)) + 38, title: { display: true, text: 'Load vs safe limit' }, ticks: { callback: (v) => `${v}%`, maxTicksLimit: 6 }, beginAtZero: true },
          y: { title: { display: true, text: 'Pollutant' }, ticks: { autoSkip: false, padding: 10, font: { weight: '900', size: 13 } }, grid: { display: false } }
        }
      })
    });
  }

  function renderCorrelationChart(snapshot, hourData) {
    const weatherHourly = snapshot?.weather?.hourly?.length ? snapshot.weather.hourly : mockSnapshot(state.location).weather.hourly;
    const axis = $('#correlationAxis')?.value || 'wind';
    const points = hourData.slice(0, 24).map((aqiPoint, index) => {
      const weather = weatherHourly[index] || {};
      const x = axis === 'humidity' ? Number(weather.relative_humidity_2m ?? weather.relative_humidity ?? weather.humidity ?? 0) : Number(weather.wind_speed_10m ?? weather.wind ?? 0);
      const y = Number(aqiPoint.us_aqi ?? aqiPoint.aqi ?? aqiPoint.value ?? 0);
      return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
    }).filter(Boolean);
    setChart('correlationChart', {
      type: 'scatter',
      data: { datasets: [{ label: axis === 'humidity' ? 'AQI vs humidity' : 'AQI vs wind', data: points, pointRadius: 5.5, pointHoverRadius: 8, pointBorderWidth: 1.5, backgroundColor: 'rgba(47,231,255,.74)', borderColor: '#2fe7ff' }] },
      options: chartBaseOptions({
        scales: {
          x: { title: { display: true, text: axis === 'humidity' ? 'Humidity (%)' : 'Wind speed (km/h)' }, ticks: { maxTicksLimit: 6 } },
          y: { title: { display: true, text: 'US AQI' }, ticks: { maxTicksLimit: 6 }, beginAtZero: true }
        }
      })
    });
  }

  function renderRadarChart(labels, values) {
    setChart('radarChart', {
      type: 'radar',
      data: { labels, datasets: [{ label: 'Pollutant load', data: values, borderColor: '#2fe7ff', backgroundColor: 'rgba(47,231,255,.16)', pointBackgroundColor: '#ff8a24', pointBorderColor: '#fff', borderWidth: 2 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: chartBaseOptions().plugins,
        scales: { r: { angleLines: { color: 'rgba(145,177,216,.18)' }, grid: { color: 'rgba(145,177,216,.18)' }, pointLabels: { color: '#edf6ff', font: { weight: '900', size: 13 } }, ticks: { color: '#c8d6ea', backdropColor: 'transparent', font: { weight: '800', size: 12 } }, suggestedMin: 0, suggestedMax: Math.max(100, ...values) } }
      }
    });
  }

  async function fetchLocalHistory() {
    const loc = state.location;
    const history = await requestJson(`/api/history?${qp({ lat: loc.latitude, lon: loc.longitude, days: 7, name: loc.display_name })}`, 5000);
    renderHistoryChart(history);
  }

  function renderHistoryChart(history) {
    const points = history?.points || [];
    const labels = points.map((p) => formatDayLabel(p.date));
    const values = points.map((p) => Number(p.average_aqi ?? 0));
    const note = $('[data-history-note]');
    if (!points.length) {
      if (note) note.textContent = 'No stored history yet. It starts building after successful live refreshes for this location.';
      if (window.Chart) setChart('localHistoryChart', { type: 'line', data: { labels: ['No history yet'], datasets: [{ label: 'Daily average AQI', data: [0], borderColor: '#69778c', backgroundColor: 'rgba(105,119,140,.15)' }] }, options: chartBaseOptions() });
      return;
    }
    if (note) note.textContent = `Showing ${points.length} recorded day${points.length === 1 ? '' : 's'} for this selected location.`;
    renderChartLine('localHistoryChart', labels, values, { color: '#25e17d', label: 'Daily average AQI' });
  }

  function renderChartUnavailable(id) {
    const canvas = state.charts[id];
    const setup = setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#9fb0c7';
    ctx.font = '700 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Advanced chart loads when Chart.js is available.', width / 2, height / 2);
  }

  function updateGauge(snapshot) {
    const aqi = Number(snapshot?.aqi?.aqi ?? 0);
    const band = snapshot?.aqi?.band || getAqiBand(aqi);
    const pct = clamp(aqi / 300, 0, 1);
    const gauge = $('#aqiGauge');
    if (!gauge) return;
    $('.gauge-fill', gauge)?.style.setProperty('--gauge-pct', `${pct * 100}%`);
    $('.gauge-needle', gauge)?.style.setProperty('--gauge-rotate', `${-88 + pct * 176}deg`);
    setText('[data-gauge-value]', aqi || '—');
    setText('[data-gauge-label]', `${band.label || 'Unavailable'} · ${Math.round(pct * 100)}% of severe range`);
    gauge.style.setProperty('--gauge-color', band.color || '#35a3ff');
  }

  function updateTreemap(pollutants = []) {
    const box = $('#pollutantTreemap');
    if (!box) return;
    const clean = pollutants
      .map((p) => ({ label: cleanPollutantLabel(p.label || p.name || p.key || 'Pollutant'), value: Math.max(1, Number(p.ratio_percent ?? p.value ?? 0)) }))
      .filter((p) => Number.isFinite(p.value))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
    if (!clean.length) {
      box.innerHTML = '<div class="treemap-empty">Pollutant profile will appear after AQI data loads.</div>';
      return;
    }
    const peak = Math.max(...clean.map((p) => p.value), 1);
    box.innerHTML = clean.map((p, index) => {
      const width = clamp((p.value / peak) * 100, 8, 100);
      const color = getAqiBand(p.value).color;
      return `<button type="button" class="treemap-tile tile-${index}" style="--tile-size:${width}%;--tile-color:${color}" title="${escapeHtml(p.label)} is ${Math.round(p.value)}% of the reference ceiling"><strong>${escapeHtml(p.label)}</strong><span>${Math.round(p.value)}%</span></button>`;
    }).join('');
  }

  function updateBestOutdoorWindow(hourData) {
    const entries = hourData.map((item, index) => ({ index, value: Number(item.us_aqi ?? item.aqi ?? item.value ?? 999), label: formatHourLabel(item.time, index) })).filter((item) => Number.isFinite(item.value));
    const target = $('[data-best-window]');
    const note = $('[data-best-window-note]');
    if (!entries.length || !target || !note) return;
    let best = { start: 0, avg: Infinity };
    for (let i = 0; i <= entries.length - 3; i++) {
      const avg = (entries[i].value + entries[i + 1].value + entries[i + 2].value) / 3;
      if (avg < best.avg) best = { start: i, avg };
    }
    const a = entries[best.start];
    const b = entries[Math.min(entries.length - 1, best.start + 2)];
    const band = getAqiBand(best.avg);
    target.textContent = `${a.label} – ${b.label}`;
    target.style.color = band.color;
    note.textContent = `Lowest 3-hour average is about AQI ${Math.round(best.avg)} (${band.label}).`;
  }


  async function downloadPdfReport() {
    const status = $('[data-report-status]');
    const buttons = ['#generatePdfReportButton'].map((selector) => $(selector)).filter(Boolean);
    buttons.forEach((button) => { button.disabled = true; });
    if (status) status.textContent = 'Preparing PDF report…';
    try {
      const loc = state.location;
      const response = await fetch(buildApiUrl(`/api/report/pdf?${qp({ lat: loc.latitude, lon: loc.longitude, name: loc.display_name })}`));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      downloadBlob(blob, `aqi-ai-report-${slug(loc.display_name)}.pdf`);
      if (status) status.textContent = 'PDF report downloaded successfully.';
      toast('AI PDF report downloaded with AQI, forecast, pollutants and personalised advice.');
    } catch {
      if (status) status.textContent = 'PDF backend unavailable. Use DOCX or run python main.py.';
      toast('PDF export needs the FastAPI backend. Start the server and try again.');
    } finally {
      buttons.forEach((button) => { button.disabled = false; });
    }
  }

  function initProjectLab() {
    renderComparePicker();
    renderFavourites();
    renderPollutantCards(mockSnapshot(state.location));
    renderHealthProfileAdvice(mockSnapshot(state.location));
    $('#saveFavouriteButton')?.addEventListener('click', saveCurrentFavourite);
    $('#compareCitiesButton')?.addEventListener('click', () => refreshCityComparison(true));
    $('#healthProfileSelect')?.addEventListener('change', () => renderHealthProfileAdvice(state.snapshot || mockSnapshot(state.location)));
    $('#notificationButton')?.addEventListener('click', requestAqiNotifications);
    refreshCityComparison(false);
  }

  function updateProjectLab(snapshot) {
    renderPollutantCards(snapshot);
    renderHealthProfileAdvice(snapshot);
    renderForecastStrip(snapshot);
    renderFavourites();
    fetchHistoryKpis().catch(() => renderHistoryKpis(null));
    updateFavouriteCount();
  }

  function renderComparePicker() {
    const root = $('[data-compare-picker]');
    if (!root) return;
    root.innerHTML = sampleCities.slice(0, 8).map((city) => {
      const checked = state.compareCities.includes(city.display_name) ? 'checked' : '';
      return `<label><input type="checkbox" value="${escapeHtml(city.display_name)}" ${checked}> <span>${escapeHtml(city.display_name.split(',')[0])}</span></label>`;
    }).join('');
    $$('input', root).forEach((input) => input.addEventListener('change', () => updateCompareSelection(input)));
    updateComparePickerUi();
  }

  function updateCompareSelection(input) {
    const root = $('[data-compare-picker]');
    if (!root) return;
    const checkedInputs = $$('input:checked', root);
    if (checkedInputs.length > 5) {
      input.checked = false;
      toast('You can compare maximum five cities at once.');
    }
    const next = $$('input:checked', root).map((item) => item.value);
    if (next.length < 2) {
      input.checked = true;
      toast('Keep at least two cities selected for comparison.');
    }
    state.compareCities = $$('input:checked', root).map((item) => item.value).slice(0, 5);
    updateComparePickerUi();
  }

  function updateComparePickerUi() {
    const root = $('[data-compare-picker]');
    if (!root) return;
    const checkedCount = $$('input:checked', root).length;
    $$('label', root).forEach((label) => {
      const input = $('input', label);
      const active = Boolean(input?.checked);
      label.classList.toggle('active', active);
      if (input) input.disabled = !active && checkedCount >= 5;
    });
  }

  function setComparisonStatus(message, tone = 'info') {
    const node = $('[data-comparison-status]');
    if (!node) return;
    node.textContent = message;
    node.dataset.tone = tone;
  }

  async function refreshCityComparison(showToast) {
    if (state.compareBusy) return;
    state.compareBusy = true;
    const button = $('#compareCitiesButton');
    const originalText = button?.textContent || 'Update comparison';
    if (button) {
      button.disabled = true;
      button.textContent = 'Comparing cities…';
    }
    setComparisonStatus('Checking selected cities with lightweight AQI calls…');
    const names = state.compareCities.length >= 2 ? state.compareCities : sampleCities.slice(0, 4).map((city) => city.display_name);
    const selectedCities = names.slice(0, 5).map((name) => sampleCities.find((item) => item.display_name === name)).filter(Boolean);
    try {
      const results = await Promise.all(selectedCities.map((city) => loadComparisonCity(city)));
      renderCityComparison(results);
      const liveCount = results.filter((item) => item.live).length;
      const fallbackCount = results.length - liveCount;
      setComparisonStatus(`${results.length} cities compared · ${liveCount} live · ${fallbackCount} fallback`, fallbackCount ? 'warn' : 'ok');
      if (showToast) toast(fallbackCount ? 'Comparison updated. Some cities used fallback values because live AQI was unavailable.' : 'City comparison updated with live AQI data.');
    } catch {
      const fallback = selectedCities.map((city) => buildFallbackComparison(city));
      renderCityComparison(fallback);
      setComparisonStatus('Live comparison unavailable, showing safe demo values.', 'warn');
      if (showToast) toast('Live comparison unavailable, showing fallback AQI values.');
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = originalText;
      }
      state.compareBusy = false;
    }
  }

  async function loadComparisonCity(city) {
    try {
      const data = await requestJson(`/api/aqi?${qp({ lat: city.latitude, lon: city.longitude })}`, 4200);
      const liveAqi = Number(data?.aqi);
      if (!Number.isFinite(liveAqi) || liveAqi <= 0) return buildFallbackComparison(city);
      const pollutant = cleanPollutantLabel(data?.dominant_pollutant?.label || data?.dominant_pollutant?.name || city.pollutant || 'PM2.5');
      return {
        name: city.display_name,
        aqi: Math.round(liveAqi),
        pollutant,
        band: data?.band || getAqiBand(liveAqi),
        live: true,
        latitude: city.latitude,
        longitude: city.longitude
      };
    } catch {
      return buildFallbackComparison(city);
    }
  }

  function buildFallbackComparison(city) {
    const mock = mockSnapshot(city);
    const aqi = Number(mock.aqi?.aqi ?? city.aqi ?? 0);
    return {
      name: city.display_name,
      aqi: Math.round(aqi),
      pollutant: cleanPollutantLabel(mock.aqi?.dominant_pollutant?.label || city.pollutant || 'PM2.5'),
      band: mock.aqi?.band || getAqiBand(aqi),
      live: false,
      latitude: city.latitude,
      longitude: city.longitude
    };
  }

  function renderCityComparison(results) {
    const sorted = results.slice().sort((a, b) => b.aqi - a.aqi);
    const labels = sorted.map((item) => item.name.split(',')[0]);
    const values = sorted.map((item) => Number(item.aqi) || 0);
    if (window.Chart) {
      setChart('cityCompareChart', {
        type: 'bar',
        data: { labels, datasets: [{ label: 'US AQI', data: values, backgroundColor: values.map((v) => transparentize(getAqiBand(v).color, .72)), borderColor: values.map((v) => getAqiBand(v).color), borderWidth: 1.8, borderRadius: 0, borderSkipped: false, barPercentage: .72, categoryPercentage: .78 }] },
        plugins: [chartValueLabelsPlugin],
        options: chartBaseOptions({
          indexAxis: 'y',
          layout: { padding: { top: 18, right: 44, bottom: 16, left: 18 } },
          plugins: { legend: { display: false }, inlineValueLabels: { enabled: true, maxLabels: 5 } },
          scales: {
            x: { title: { display: true, text: 'US AQI' }, suggestedMax: Math.max(180, ...values) + 35, ticks: { maxTicksLimit: 6, padding: 10 }, grid: { color: 'rgba(145,177,216,.15)' } },
            y: { ticks: { autoSkip: false, padding: 12, font: { weight: '900', size: 14 } }, grid: { display: false } }
          }
        })
      });
    } else {
      drawBarChart(state.charts.cityCompareChart, labels, values);
    }
    const list = $('[data-comparison-list]');
    if (list) {
      list.innerHTML = sorted.map((item, index) => `<button type="button" class="comparison-item" data-city="${escapeHtml(item.name)}" style="--rank-color:${item.band.color}"><span>#${index + 1} · ${item.live ? 'Live' : 'Fallback'}</span><strong>${escapeHtml(item.name)}</strong><b>AQI ${item.aqi}</b><small>${escapeHtml(item.band.label)} · ${escapeHtml(item.pollutant)}</small></button>`).join('');
    }
    $$('.comparison-item', list || document).forEach((button) => button.addEventListener('click', () => {
      const city = sampleCities.find((item) => item.display_name === button.dataset.city);
      if (city) setLocation(city, 'comparison');
    }));
  }

  function renderPollutantCards(snapshot) {
    const root = $('[data-pollutant-cards]');
    if (!root) return;
    const fallback = mockSnapshot(state.location).aqi.pollutants;
    const pollutants = snapshot?.aqi?.pollutants?.length ? snapshot.aqi.pollutants : fallback;
    root.innerHTML = pollutants.slice(0, 6).map((item) => {
      const label = cleanPollutantLabel(item.label || item.name || item.key);
      const ratio = Math.round(Number(item.ratio_percent ?? item.value ?? 0));
      const value = item.value !== undefined && item.value !== null ? `${fmt(item.value, item.value < 10 ? 1 : 0)} ${item.unit || ''}` : 'Live ratio';
      const band = getAqiBand(ratio);
      return `<article class="pollutant-profile-card" style="--pollutant-color:${band.color}"><span>${escapeHtml(label)}</span><strong>${ratio || '—'}%</strong><p>${escapeHtml(value)} · ${escapeHtml(band.label)}</p><i style="width:${clamp(ratio, 5, 100)}%"></i></article>`;
    }).join('');
  }

  function renderSevenDayForecastChart(snapshot) {
    const days = buildSevenDayForecast(snapshot);
    const labels = days.map((day) => day.label);
    const aqiValues = days.map((day) => day.aqi);
    const colors = aqiValues.map((value) => getAqiBand(value).color);
    setChart('forecast7DayChart', {
      type: 'bar',
      data: { labels, datasets: [
        { label: 'Daily AQI outlook', data: aqiValues, backgroundColor: colors.map((color) => transparentize(color, .68)), borderColor: colors, borderWidth: 1.8, borderRadius: 0, borderSkipped: false, barPercentage: .62, categoryPercentage: .72 }
      ] },
      plugins: [chartValueLabelsPlugin],
      options: chartBaseOptions({
        layout: { padding: { top: 12, right: 36, bottom: 12, left: 10 } },
        plugins: { legend: { display: false }, inlineValueLabels: { enabled: true, maxLabels: 7 } },
        scales: {
          x: { title: { display: true, text: 'Forecast days' }, ticks: { autoSkip: false, maxRotation: 0, padding: 10, font: { weight: '900', size: 12 } }, grid: { display: false } },
          y: { title: { display: true, text: 'US AQI' }, suggestedMax: Math.max(180, ...aqiValues) + 30, ticks: { maxTicksLimit: 5, padding: 10 }, beginAtZero: true }
        }
      })
    });
  }

  function buildSevenDayForecast(snapshot) {
    const fallback = mockSnapshot(state.location);
    const hourly = snapshot?.forecast?.hourly?.length ? snapshot.forecast.hourly : fallback.forecast.hourly;
    const weatherDays = snapshot?.weather?.daily?.length ? snapshot.weather.daily : fallback.weather.daily;
    const groups = new Map();
    hourly.slice(0, 24 * 7).forEach((item, index) => {
      const rawTime = item.time || '';
      const key = String(rawTime).includes('T') ? String(rawTime).slice(0, 10) : `day-${Math.floor(index / 24)}`;
      const group = groups.get(key) || [];
      const value = Number(item.us_aqi ?? item.aqi ?? item.value ?? 0);
      if (Number.isFinite(value) && value > 0) group.push(value);
      groups.set(key, group);
    });
    return Array.from({ length: 7 }, (_, index) => {
      const group = Array.from(groups.values())[index] || [];
      const aqi = group.length ? Math.round(group.reduce((sum, value) => sum + value, 0) / group.length) : Math.round(Number(snapshot?.aqi?.aqi ?? fallback.aqi.aqi) + Math.sin(index * 1.1) * 18);
      const day = weatherDays[index] || {};
      return { label: formatDayLabel(day.date, index), aqi: clamp(aqi, 5, 500), temp: Math.round(Number(day.temperature_2m_max ?? day.max_temperature_2m ?? fallback.weather.daily[index % fallback.weather.daily.length]?.max_temperature_2m ?? 28)) };
    });
  }


  function renderGlobeDataBoard(snapshot) {
    const aqi = Number(snapshot?.aqi?.aqi ?? state.location?.aqi ?? 0);
    const band = snapshot?.aqi?.band || getAqiBand(aqi);
    const weather = snapshot?.weather?.current || {};
    const pollutants = snapshot?.aqi?.pollutants?.length ? snapshot.aqi.pollutants : mockSnapshot(state.location).aqi.pollutants;
    const primaryPollutant = snapshot?.aqi?.dominant_pollutant || pollutants[0] || { label: 'PM2.5', ratio_percent: 0 };
    const meter = $('[data-board-aqi-meter]');
    if (meter) {
      meter.style.width = `${clamp((aqi / 300) * 100, 4, 100)}%`;
      meter.style.background = band.color || '#ff8a24';
    }
    setText('[data-board-visibility]', weather.visibility ? formatVisibility(weather.visibility) : (aqi > 150 ? 'Moderate' : 'Good'));
    setText('[data-board-pressure]', Number.isFinite(Number(weather.pressure_msl)) ? `${Math.round(weather.pressure_msl)} hPa` : '1012 hPa');
    const forecastRoot = $('[data-globe-forecast]');
    if (forecastRoot) {
      const days = buildSevenDayForecast(snapshot).slice(0, 4);
      forecastRoot.innerHTML = days.map((day) => {
        const dayBand = getAqiBand(day.aqi);
        return `<article style="--forecast-color:${dayBand.color}"><span>${escapeHtml(day.label)}</span><strong>AQI ${day.aqi}</strong><p>${escapeHtml(dayBand.label)} · ${day.temp}°C</p></article>`;
      }).join('');
    }
    const riskTitle = aqi > 200 ? 'High exposure risk' : aqi > 150 ? 'Outdoor caution' : aqi > 100 ? 'Sensitive caution' : 'Manageable air';
    const riskCopy = aqi > 200 ? 'Avoid unnecessary outdoor activity and keep windows closed.' : aqi > 150 ? 'Shorten outdoor plans and prefer indoor spaces.' : aqi > 100 ? 'Sensitive groups should reduce long outdoor exposure.' : 'Normal activity is manageable for most users.';
    setText('[data-board-risk-title]', riskTitle);
    setText('[data-board-risk-copy]', riskCopy);
    const load = Math.round(Number(primaryPollutant.ratio_percent ?? primaryPollutant.value ?? 0));
    const actionTitle = load > 150 ? 'Mask + indoor route' : aqi > 150 ? 'Avoid peak traffic' : 'Use clean window';
    const actionCopy = `${cleanPollutantLabel(primaryPollutant.label || primaryPollutant.name || 'PM2.5')} load is ${load || 'not'}${load ? '%' : ' available'}; choose lower-traffic timing.`;
    setText('[data-board-action-title]', actionTitle);
    setText('[data-board-action-copy]', actionCopy);
  }

  function renderForecastStrip(snapshot) {
    const root = $('[data-forecast-strip]');
    if (!root) return;
    const days = buildSevenDayForecast(snapshot);
    root.innerHTML = days.map((day) => {
      const band = getAqiBand(day.aqi);
      return `<article style="--forecast-color:${band.color}"><span>${escapeHtml(day.label)}</span><strong>AQI ${day.aqi}</strong><p>${escapeHtml(band.label)} · ${day.temp}°C</p></article>`;
    }).join('');
  }

  function renderHealthProfileAdvice(snapshot) {
    const root = $('[data-profile-advice]');
    if (!root) return;
    const profile = $('#healthProfileSelect')?.value || 'general';
    const aqi = Number(snapshot?.aqi?.aqi ?? 0);
    const pollutant = snapshot?.aqi?.dominant_pollutant?.label || 'PM2.5';
    const band = snapshot?.aqi?.band || getAqiBand(aqi);
    const map = {
      general: ['General user', aqi > 150 ? 'Keep outdoor time short and prefer indoor activities.' : 'Normal routine is fine; keep checking the trend.'],
      child: ['Child', aqi > 100 ? 'Avoid long outdoor play and keep school travel windows short.' : 'Outdoor play is okay with normal monitoring.'],
      elderly: ['Elderly person', aqi > 100 ? 'Limit walking near traffic and keep medication or support nearby.' : 'Light outdoor movement is manageable.'],
      asthma: ['Asthma-sensitive user', aqi > 100 ? 'Avoid exertion, keep inhaler support available, and stay indoors if symptoms appear.' : 'Low-risk period, but monitor PM2.5 changes.'],
      worker: ['Outdoor worker', aqi > 150 ? 'Use mask breaks, rotate exposure, hydrate and avoid peak traffic hours.' : 'Work is manageable with routine breaks.'],
      runner: ['Runner or cyclist', aqi > 100 ? 'Shift workout indoors or choose the lowest-AQI window.' : 'Light run is reasonable; avoid polluted corridors.']
    };
    const selected = map[profile] || map.general;
    root.innerHTML = `<article style="--profile-color:${band.color}"><span>${escapeHtml(selected[0])}</span><strong>${escapeHtml(band.label)}</strong><p>${escapeHtml(selected[1])}</p><small>Main pollutant: ${escapeHtml(pollutant)} · Current AQI ${aqi || '—'}</small></article>`;
  }

  function saveCurrentFavourite() {
    const item = {
      display_name: state.location.display_name,
      latitude: state.location.latitude,
      longitude: state.location.longitude,
      aqi: state.snapshot?.aqi?.aqi || state.location.aqi,
      pollutant: state.snapshot?.aqi?.dominant_pollutant?.label || state.location.pollutant
    };
    const exists = state.favourites.some((city) => city.display_name === item.display_name);
    state.favourites = exists ? state.favourites.map((city) => city.display_name === item.display_name ? item : city) : [item, ...state.favourites].slice(0, 8);
    storeFavourites();
    renderFavourites();
    toast(exists ? 'Favourite city updated.' : 'City saved to favourites.');
  }

  function renderFavourites() {
    const root = $('[data-favourite-list]');
    if (!root) return;
    updateFavouriteCount();
    if (!state.favourites.length) {
      root.innerHTML = '<article class="empty-card"><strong>No favourites yet</strong><p>Save your city to create a quick AQI watchlist.</p></article>';
      return;
    }
    root.innerHTML = state.favourites.map((city) => `<button type="button" class="favourite-item" data-name="${escapeHtml(city.display_name)}"><strong>${escapeHtml(city.display_name)}</strong><span>AQI ${city.aqi || '—'} · ${escapeHtml(city.pollutant || 'PM2.5')}</span><small>Open city</small></button>`).join('');
    $$('.favourite-item', root).forEach((button) => button.addEventListener('click', () => {
      const city = state.favourites.find((item) => item.display_name === button.dataset.name);
      if (city) setLocation(city, 'favourite');
    }));
  }

  function updateFavouriteCount() {
    setText('[data-favourite-count]', String(state.favourites.length));
  }

  function loadStoredFavourites() {
    try {
      const parsed = JSON.parse(localStorage.getItem('aqi-tracker-favourites') || '[]');
      return Array.isArray(parsed) ? parsed.slice(0, 8) : [];
    } catch {
      return [];
    }
  }

  function storeFavourites() {
    try {
      localStorage.setItem('aqi-tracker-favourites', JSON.stringify(state.favourites));
    } catch {}
  }

  async function fetchHistoryKpis() {
    const loc = state.location;
    const history = await requestJson(`/api/history?${qp({ lat: loc.latitude, lon: loc.longitude, days: 30, name: loc.display_name })}`, 5000);
    renderHistoryKpis(history);
  }

  function renderHistoryKpis(history) {
    const root = $('[data-history-kpis]');
    if (!root) return;
    const points = history?.points || [];
    if (!points.length) {
      root.innerHTML = '<article><span>Status</span><strong>No history yet</strong><p>Refresh this city a few times to build local analytics.</p></article>';
      setText('[data-history-average]', '—');
      setText('[data-history-peak]', 'No recorded days yet');
      return;
    }
    const values = points.map((p) => Number(p.average_aqi)).filter((value) => Number.isFinite(value));
    const avg = values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
    const max = Math.max(...points.map((p) => Number(p.max_aqi || 0)));
    const min = Math.min(...points.map((p) => Number(p.min_aqi || max || 0)));
    const total = points.reduce((sum, p) => sum + Number(p.count || 0), 0);
    root.innerHTML = [
      ['30-day average', avg || '—', 'Average of stored refreshes'],
      ['Peak AQI', max || '—', 'Highest recorded reading'],
      ['Best AQI', min || '—', 'Lowest recorded reading'],
      ['Refresh records', total || '—', 'Local snapshot count']
    ].map(([label, value, note]) => `<article><span>${label}</span><strong>${value}</strong><p>${note}</p></article>`).join('');
    setText('[data-history-average]', avg ? `${avg}` : '—');
    setText('[data-history-peak]', max ? `Peak ${max} · Best ${min}` : 'No recorded values yet');
  }

  async function requestAqiNotifications() {
    if (!('Notification' in window)) {
      toast('Browser notifications are not supported here.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      toast('Notification permission was not granted.');
      return;
    }
    const snap = state.snapshot || mockSnapshot(state.location);
    const aqi = Number(snap.aqi?.aqi ?? 0);
    const band = snap.aqi?.band?.label || getAqiBand(aqi).label;
    new Notification('AQI Tracker alert enabled', { body: `${state.location.display_name}: AQI ${aqi} · ${band}` });
    toast('AQI notification preview sent.');
  }

  function togglePresentationMode() {
    document.body.classList.toggle('presentation-mode');
    toast(document.body.classList.contains('presentation-mode') ? 'Presentation mode enabled.' : 'Presentation mode disabled.');
  }

  function initPwaInstall() {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      state.deferredInstallPrompt = event;
      const button = $('#installPwaButton');
      if (button) button.hidden = false;
    });
    $('#installPwaButton')?.addEventListener('click', async () => {
      if (!state.deferredInstallPrompt) return;
      state.deferredInstallPrompt.prompt();
      await state.deferredInstallPrompt.userChoice.catch(() => null);
      state.deferredInstallPrompt = null;
      $('#installPwaButton')?.setAttribute('hidden', '');
    });
  }

  /**
   * Wires the radio player, restores saved volume/station and keeps keyboard playback simple.
   */
  function initRadioPlayer() {
    const audio = $('#radioAudio');
    const volume = loadVolume(80);
    const slider = $('#radioVolumeSlider');
    if (slider) slider.value = String(volume);
    const volumeLabel = slider?.closest('.radio-volume-row')?.querySelector('strong');
    if (volumeLabel) volumeLabel.textContent = `${Math.round(volume)}%`;

    if (audio) {
      audio.volume = volume / 100;
      if (state.selectedRadio?.url) applyRadioStationToPlayer(state.selectedRadio, false, false);
      audio.addEventListener('playing', () => updateRadioPlaybackUi('playing'));
      audio.addEventListener('pause', () => updateRadioPlaybackUi(audio.currentTime ? 'paused' : 'stopped'));
      audio.addEventListener('waiting', () => updateRadioPlaybackUi('buffering'));
      audio.addEventListener('error', () => {
        if (state.selectedRadio) state.radioUnavailableIds.add(stationId(state.selectedRadio));
        renderRadioStations(state.radioStations, { preservePlayback: true });
        updateRadioPlaybackUi('error');
      });
    }

    $('#radioSearchForm')?.addEventListener('submit', (event) => {
      event.preventDefault();
      state.radioFavouritesOnly = false;
      loadRadioStations($('#radioSearchInput')?.value?.trim() || '', true).catch(() => renderRadioFallback(true));
    });
    $('#radioDropdownButton')?.addEventListener('click', () => setRadioPanelOpen(!$('[data-radio-panel]')?.classList.contains('open')));
    $('#radioMainToggle')?.addEventListener('click', toggleRadioPlayback);
    $('#radioStopButton')?.addEventListener('click', stopRadio);
    $$('[data-radio-preset]').forEach((button) => button.addEventListener('click', () => {
      const query = button.dataset.radioPreset || '';
      const input = $('#radioSearchInput');
      state.radioFavouritesOnly = query.toLowerCase() === 'favourites';
      if (input) input.value = state.radioFavouritesOnly ? '' : query;
      if (state.radioFavouritesOnly) {
        renderRadioStations(state.radioStations, { preservePlayback: true });
        setRadioPanelOpen(true);
        setText('[data-radio-count]', `${getVisibleRadioStations().length} favourite${getVisibleRadioStations().length === 1 ? '' : 's'}`);
        return;
      }
      loadRadioStations(query, true).catch(() => renderRadioFallback(true));
    }));
    slider?.addEventListener('input', (event) => {
      const value = clamp(Number(event.target.value), 0, 100);
      if (audio) audio.volume = value / 100;
      saveVolume(value);
      const label = event.target.closest('.radio-volume-row')?.querySelector('strong');
      if (label) label.textContent = `${Math.round(value)}%`;
    });
    $('#live-radio')?.addEventListener('keydown', (event) => {
      const target = event.target;
      const isFormControl = target?.matches?.('input, textarea, select, button, [contenteditable="true"]');
      if (event.code === 'Space' && !isFormControl) {
        event.preventDefault();
        toggleRadioPlayback();
      }
    });
    $('#live-radio')?.setAttribute('tabindex', '0');
    loadRadioStations('', false).catch(() => renderRadioFallback(false));
  }

  /**
   * Loads station search results without interrupting the stream that is already playing.
   */
  async function loadRadioStations(search, openPanel = false) {
    setText('[data-radio-status]', 'Loading');
    setText('[data-radio-count]', 'Loading stations');
    renderRadioSkeleton();
    const data = await requestJson(`/api/radio/stations?${qp({ q: search, countrycode: 'IN', limit: 14 })}`, 8000);
    state.radioStations = data.stations || [];
    renderRadioStations(state.radioStations, { preservePlayback: state.radioHasInitialSelection });
    setText('[data-radio-status]', state.radioStations.length ? 'Ready' : 'No stations');
    const visible = getVisibleRadioStations();
    setText('[data-radio-count]', `${visible.length} station${visible.length === 1 ? '' : 's'}`);
    setRadioPanelOpen(openPanel && visible.length > 0);
  }

  function renderRadioSkeleton() {
    const root = $('[data-radio-stations]');
    if (!root) return;
    root.innerHTML = Array.from({ length: 4 }, () => '<article class="radio-station-skeleton"><i></i><span></span><b></b></article>').join('');
    setRadioPanelOpen(true);
  }

  function getVisibleRadioStations() {
    return state.radioFavouritesOnly ? state.radioStations.filter((station) => isFavouriteStation(station)) : state.radioStations;
  }

  /**
   * Renders station cards and only auto-selects the first station during the first page load.
   */
  function renderRadioStations(stations, options = {}) {
    const root = $('[data-radio-stations]');
    if (!root) return;
    const visibleStations = getVisibleRadioStations();
    if (!visibleStations.length) {
      root.innerHTML = `<article class="empty-card"><strong>${state.radioFavouritesOnly ? 'No favourite stations yet' : 'No stream found'}</strong><p>${state.radioFavouritesOnly ? 'Tap the star on any station to save it here.' : 'Try another station name or genre.'}</p></article>`;
      setText('[data-radio-count]', '0 stations');
      return;
    }
    root.innerHTML = visibleStations.map((station) => {
      const index = stations.indexOf(station);
      const name = station.name || 'Live station';
      const initial = name.trim().slice(0, 2).toUpperCase() || 'FM';
      const meta = [station.country, station.language, station.tags].filter(Boolean).join(' · ');
      const quality = station.bitrate ? `${station.bitrate} kbps` : 'Live stream';
      const active = state.selectedRadio && stationId(state.selectedRadio) === stationId(station);
      const favourite = isFavouriteStation(station);
      const unavailable = state.radioUnavailableIds.has(stationId(station));
      return `<article class="radio-station ${active ? 'active' : ''} ${unavailable ? 'is-unavailable' : ''}" data-index="${index}" data-station-id="${escapeHtml(stationId(station))}"><button type="button" class="radio-station-play"><span class="station-cover">${escapeHtml(initial)}</span><span class="station-text"><strong>${escapeHtml(name)}</strong><span>${escapeHtml(meta || 'Internet radio')}</span><small>${unavailable ? 'Unavailable' : escapeHtml(quality)}</small></span><em>${unavailable ? '!' : '▶'}</em></button><button type="button" class="radio-favourite-toggle ${favourite ? 'active' : ''}" aria-label="${favourite ? 'Remove favourite station' : 'Save favourite station'}">★</button></article>`;
    }).join('');
    $$('.radio-station-play', root).forEach((button) => button.addEventListener('click', () => {
      const card = button.closest('.radio-station');
      selectRadioStation(Number(card?.dataset.index), true, true);
      setRadioPanelOpen(false);
    }));
    $$('.radio-favourite-toggle', root).forEach((button) => button.addEventListener('click', (event) => {
      event.stopPropagation();
      const index = Number(button.closest('.radio-station')?.dataset.index);
      const station = state.radioStations[index];
      toggleFavouriteStation(station);
      renderRadioStations(state.radioStations, { preservePlayback: true });
      toast(`${station?.name || 'Station'} ${isFavouriteStation(station) ? 'saved to favourites' : 'removed from favourites'}.`);
    }));
    if (!state.radioHasInitialSelection && !options.preservePlayback) {
      selectRadioStation(stations.indexOf(visibleStations[0]), false, false);
      state.radioHasInitialSelection = true;
    }
  }

  function setRadioPanelOpen(open) {
    const panel = $('[data-radio-panel]');
    const button = $('#radioDropdownButton');
    if (!panel || !button) return;
    panel.hidden = false;
    requestAnimationFrame(() => {
      panel.classList.toggle('open', Boolean(open));
      button.setAttribute('aria-expanded', String(Boolean(open)));
      if (!open) window.setTimeout(() => { if (!panel.classList.contains('open')) panel.hidden = true; }, 360);
    });
  }

  function applyRadioStationToPlayer(station, announce = true, autoPlay = false) {
    const stationName = station.name || 'Live station';
    const stationInitial = stationName.trim().slice(0, 2).toUpperCase() || 'FM';
    const quality = station.bitrate ? `${station.bitrate} kbps` : 'Live';
    setText('[data-radio-name]', stationName);
    setText('[data-radio-meta]', [station.country, station.language, quality, 'Tap another station to switch instantly'].filter(Boolean).join(' · ') || 'Live stream selected');
    setText('[data-radio-live-label]', station.country || 'Live station');
    setText('[data-radio-live-action]', autoPlay ? 'Starting selected station…' : 'Selected and ready');
    setText('[data-radio-art-letter]', stationInitial);
    setText('[data-radio-country]', station.country || 'Global');
    setText('[data-radio-kbps]', quality);
    setText('[data-radio-mode]', station.language || 'Internet radio');
    if (announce && !autoPlay) toast(`${stationName} selected.`);
  }

  /**
   * Selects a station. Searches and filters never call this unless the user taps a station.
   */
  function selectRadioStation(index, announce = true, autoPlay = false) {
    const station = state.radioStations[index];
    if (!station) return;
    state.selectedRadio = station;
    state.radioHasInitialSelection = true;
    saveLastStation(station);
    $$('.radio-station').forEach((card) => card.classList.toggle('active', Number(card.dataset.index) === index));
    const audio = $('#radioAudio');
    if (audio) {
      audio.pause();
      audio.src = station.url;
      audio.load();
    }
    applyRadioStationToPlayer(station, announce, autoPlay);
    if (autoPlay) window.setTimeout(() => playSelectedRadio(true), 20);
  }

  function toggleRadioPlayback() {
    const audio = $('#radioAudio');
    if (!audio) return;
    if (!state.selectedRadio) {
      setRadioPanelOpen(true);
      toast('Pick a station from the list first.');
      return;
    }
    if (!audio.paused) {
      audio.pause();
      updateRadioPlaybackUi('paused');
      return;
    }
    playSelectedRadio(false);
  }

  async function playSelectedRadio(fromStationClick = false) {
    if (!state.selectedRadio) {
      toast('Select a radio station first.');
      return;
    }
    const audio = $('#radioAudio');
    if (!audio) return;
    if (!audio.src) {
      audio.src = state.selectedRadio.url;
      audio.load();
    }
    updateRadioPlaybackUi('buffering');
    try {
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.then === 'function') await playPromise;
      updateRadioPlaybackUi('playing');
      if (fromStationClick) toast(`Playing ${state.selectedRadio.name || 'selected station'}.`);
    } catch {
      state.radioUnavailableIds.add(stationId(state.selectedRadio));
      renderRadioStations(state.radioStations, { preservePlayback: true });
      updateRadioPlaybackUi('error');
      toast('This stream could not start. That station is now marked unavailable.');
    }
  }

  function stopRadio() {
    const audio = $('#radioAudio');
    if (!audio) return;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    updateRadioPlaybackUi('stopped');
  }

  function updateRadioPlaybackUi(mode) {
    const section = $('#live-radio');
    const toggle = $('#radioMainToggle');
    const selectedName = state.selectedRadio?.name || 'Select a station';
    section?.classList.toggle('is-playing', mode === 'playing');
    section?.classList.toggle('is-buffering', mode === 'buffering');
    section?.classList.toggle('has-radio-error', mode === 'error');
    if (toggle) toggle.textContent = mode === 'playing' ? '❚❚' : '▶';
    const statusMap = { playing: 'Playing', paused: 'Paused', stopped: 'Stopped', buffering: 'Buffering', error: 'Stream blocked' };
    const actionMap = { playing: 'Live playback is active', paused: 'Playback paused', stopped: 'Stopped — choose station again', buffering: 'Connecting to live stream…', error: 'Try another station stream' };
    const status = statusMap[mode] || 'Ready';
    setText('[data-radio-status]', status);
    setText('[data-radio-small-status]', status);
    setText('[data-radio-live-label]', mode === 'playing' ? 'Now streaming' : selectedName);
    setText('[data-radio-live-action]', actionMap[mode] || 'Choose a station to start');
  }

  function renderRadioFallback(openPanel = false) {
    state.radioStations = [];
    setText('[data-radio-status]', 'Offline');
    setText('[data-radio-count]', 'Radio unavailable');
    const root = $('[data-radio-stations]');
    if (root) root.innerHTML = '<article class="empty-card"><strong>Radio API unavailable</strong><p>Start the backend or check the network, then search again.</p></article>';
    setRadioPanelOpen(openPanel);
  }

  function transparentize(hex, alpha = .3) {
    const value = String(hex || '#35a3ff').replace('#', '');
    const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value.padEnd(6, '0').slice(0, 6);
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function formatHourLabel(raw, index = 0) {
    if (!raw) return `${String(index).padStart(2, '0')}:00`;
    const text = String(raw);
    let hour = null;
    const isoMatch = text.match(/T(\d{2}):/);
    const simpleMatch = text.match(/^(\d{1,2}):/);
    if (isoMatch) hour = Number(isoMatch[1]);
    else if (simpleMatch) hour = Number(simpleMatch[1]);
    else {
      const date = new Date(text);
      if (!Number.isNaN(date.getTime())) hour = date.getHours();
    }
    if (!Number.isFinite(hour)) hour = index;
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const pretty = hour % 12 || 12;
    return `${pretty} ${suffix}`;
  }

  function formatDayLabel(raw, index = 0) {
    if (!raw) return ['Today', 'Tomorrow', 'Day 3', 'Day 4'][index] || `Day ${index + 1}`;
    const text = String(raw);
    if (/today|tomorrow|day/i.test(text)) return text;
    const date = new Date(text);
    if (Number.isNaN(date.getTime())) return text.length > 10 ? text.slice(5, 10) : text;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  function cleanPollutantLabel(label) {
    const text = String(label || '').trim();
    const map = {
      'particulate matter 2.5': 'PM2.5',
      'pm2_5': 'PM2.5',
      'particulate matter 10': 'PM10',
      'carbon monoxide': 'CO',
      'nitrogen dioxide': 'NO₂',
      'sulphur dioxide': 'SO₂',
      'sulfur dioxide': 'SO₂',
      'ozone': 'O₃',
      'dust': 'Dust'
    };
    return map[text.toLowerCase()] || text.replace('Dioxide', 'Dio.').replace('Monoxide', 'Mon.').replace('Nitrogen', 'Nit.').replace('Sulphur', 'Sul.');
  }

  function splitAxisLabel(label) {
    const text = String(label || '');
    if (text.length <= 7) return text;
    return text.split(/[\s/-]+/).filter(Boolean).slice(0, 2);
  }

  function setupCanvas(canvas) {
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 3);
    const width = Math.max(260, Math.floor(rect.width));
    const height = Math.max(110, Math.floor(rect.height || Number(canvas.height) || 220));
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { ctx, width, height };
  }

  function drawLineChart(canvas, labels, values, options = {}) {
    const setup = setupCanvas(canvas);
    if (!setup || !values.length) return;
    const { ctx, width, height } = setup;
    ctx.clearRect(0, 0, width, height);
    const padLeft = options.mini ? 6 : 48;
    const padRight = options.mini ? 6 : 24;
    const padTop = options.mini ? 6 : 22;
    const padBottom = options.mini ? 6 : 44;
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 10);
    const span = Math.max(1, max - min);
    const plotWidth = width - padLeft - padRight;
    const plotHeight = height - padTop - padBottom;
    const x = (i) => padLeft + (i / Math.max(1, values.length - 1)) * plotWidth;
    const y = (v) => padTop + (1 - ((v - min) / span)) * plotHeight;
    if (!options.mini) {
      drawGrid(ctx, width, height, padLeft, padRight, padTop, padBottom, min, max);
      drawThreshold(ctx, 100, min, max, width, height, padLeft, padRight, padTop, padBottom, 'Sensitive');
      drawThreshold(ctx, 150, min, max, width, height, padLeft, padRight, padTop, padBottom, 'Unhealthy');
    }
    ctx.beginPath();
    values.forEach((v, i) => i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v)));
    const grad = ctx.createLinearGradient(0, padTop, 0, height - padBottom);
    grad.addColorStop(0, options.color || '#35a3ff');
    grad.addColorStop(1, 'rgba(53,163,255,0.02)');
    ctx.lineWidth = options.mini ? 2 : 3;
    ctx.strokeStyle = options.color || '#35a3ff';
    ctx.shadowColor = options.color || '#35a3ff';
    ctx.shadowBlur = options.mini ? 8 : 12;
    ctx.stroke();
    ctx.shadowBlur = 0;
    if (!options.mini) {
      ctx.lineTo(width - padRight, height - padBottom);
      ctx.lineTo(padLeft, height - padBottom);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.globalAlpha = .17;
      ctx.fill();
      ctx.globalAlpha = 1;
      drawXAxisLabels(ctx, labels, x, height - 15, options.maxTicks || 6);
    }
  }

  function drawDualLineChart(canvas, labels, maxValues, minValues) {
    const setup = setupCanvas(canvas);
    if (!setup || !labels.length) return;
    const { ctx, width, height } = setup;
    ctx.clearRect(0, 0, width, height);
    const padLeft = 48, padRight = 24, padTop = 22, padBottom = 44;
    const all = maxValues.concat(minValues);
    const min = Math.min(...all) - 2;
    const max = Math.max(...all) + 2;
    const span = Math.max(1, max - min);
    const x = (i) => padLeft + (i / Math.max(1, labels.length - 1)) * (width - padLeft - padRight);
    const y = (v) => padTop + (1 - ((v - min) / span)) * (height - padTop - padBottom);
    drawGrid(ctx, width, height, padLeft, padRight, padTop, padBottom, min, max);
    drawPath(ctx, maxValues, x, y, '#ff8a24');
    drawPath(ctx, minValues, x, y, '#35a3ff');
    drawXAxisLabels(ctx, labels, x, height - 15, 4);
  }

  function drawPath(ctx, values, x, y, color) {
    ctx.beginPath();
    values.forEach((v, i) => i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v)));
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;
    values.forEach((v, i) => { ctx.beginPath(); ctx.arc(x(i), y(v), 4, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); });
  }

  function drawBarChart(canvas, labels, values) {
    const setup = setupCanvas(canvas);
    if (!setup || !values.length) return;
    const { ctx, width, height } = setup;
    ctx.clearRect(0, 0, width, height);
    const padLeft = 48, padRight = 24, padTop = 22, padBottom = 52;
    const max = Math.max(100, ...values);
    drawGrid(ctx, width, height, padLeft, padRight, padTop, padBottom, 0, max);
    drawThreshold(ctx, 100, 0, max, width, height, padLeft, padRight, padTop, padBottom, '100%');
    const gap = Math.max(14, Math.min(24, width / 40));
    const plotWidth = width - padLeft - padRight;
    const barWidth = Math.max(24, (plotWidth - gap * (values.length - 1)) / values.length);
    values.forEach((value, i) => {
      const h = (value / max) * (height - padTop - padBottom);
      const x = padLeft + i * (barWidth + gap);
      const y = height - padBottom - h;
      const color = getAqiBand(value).color;
      const gradient = ctx.createLinearGradient(0, y, 0, height - padBottom);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(53,163,255,.16)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, h);
      ctx.fillStyle = '#f4f9ff';
      ctx.font = '800 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(value)}%`, x + barWidth / 2, Math.max(padTop + 12, y - 8));
      drawCenteredLabel(ctx, labels[i], x + barWidth / 2, height - 22, Math.max(46, barWidth + gap));
    });
  }

  function drawGrid(ctx, width, height, padLeft = 40, padRight = 24, padTop = 22, padBottom = 44, minValue = null, maxValue = null) {
    const plotHeight = height - padTop - padBottom;
    ctx.save();
    ctx.strokeStyle = 'rgba(145,177,216,.15)';
    ctx.fillStyle = '#8796aa';
    ctx.font = '700 10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = padTop + i * (plotHeight / 4);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();
      if (Number.isFinite(minValue) && Number.isFinite(maxValue)) {
        const val = maxValue - i * ((maxValue - minValue) / 4);
        ctx.fillText(String(Math.round(val)), padLeft - 8, y);
      }
    }
    ctx.restore();
  }

  function drawThreshold(ctx, value, min, max, width, height, padLeft, padRight, padTop, padBottom, label) {
    if (!Number.isFinite(value) || value < min || value > max) return;
    const y = padTop + (1 - ((value - min) / Math.max(1, max - min))) * (height - padTop - padBottom);
    ctx.save();
    ctx.strokeStyle = value >= 150 ? 'rgba(255,69,58,.42)' : 'rgba(255,216,77,.36)';
    ctx.setLineDash([5, 7]);
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(width - padRight, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = value >= 150 ? '#ff8a83' : '#ffe274';
    ctx.font = '800 10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, padLeft + 8, y - 6);
    ctx.restore();
  }

  function drawXAxisLabels(ctx, labels, x, y, maxTicks = 6) {
    ctx.save();
    ctx.fillStyle = '#a8b6c9';
    ctx.font = '600 12px Inter, sans-serif';
    ctx.textBaseline = 'middle';
    const count = labels.length;
    const step = Math.max(1, Math.ceil(count / maxTicks));
    labels.forEach((label, i) => {
      if (i !== 0 && i !== count - 1 && i % step !== 0) return;
      drawCenteredLabel(ctx, label, x(i), y, 70);
    });
    ctx.restore();
  }

  function drawCenteredLabel(ctx, label, x, y, maxWidth = 70) {
    const text = String(label || '');
    ctx.save();
    ctx.fillStyle = '#a8b6c9';
    ctx.font = '600 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let shown = text;
    while (ctx.measureText(shown).width > maxWidth && shown.length > 4) shown = `${shown.slice(0, -2)}…`;
    ctx.fillText(shown, x, y);
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function initGlobe() {
    const stage = $('#earthStage');
    const canvas = $('#fallbackEarth');
    if (!stage || !canvas) return;
    state.globe = new PremiumCanvasGlobe(stage, canvas);
    state.globe.init();
  }

  function initSolarSystem() {
    const orbitRoot = $('[data-solar-orbits]');
    const navRoot = $('[data-planet-nav]');
    if (!orbitRoot || !navRoot) return;
    orbitRoot.innerHTML = solarPlanets.map((planet, index) => {
      const duration = 20 + index * 7;
      const delay = -(index * 4.4);
      const tilt = [8, -6, 4, -9, 5, -12, 10, -5][index] || 0;
      return `
      <div class="planet-orbit" data-orbit-key="${planet.key}" style="--orbit-w:${planet.orbitW}%;--orbit-h:${planet.orbitH}%;--orbit-duration:${duration}s;--orbit-delay:${delay}s;--orbit-tilt:${tilt}deg;--planet-size:${planet.size}px;--planet-color:${planet.color};--planet-glow:${planet.glow};">
        <button class="planet-dot" type="button" data-planet-key="${planet.key}" aria-label="Zoom to ${planet.name}">
          <i aria-hidden="true"></i><span>${planet.name}</span>
        </button>
      </div>`;
    }).join('');
    navRoot.innerHTML = solarPlanets.map((planet) => `
      <button class="planet-chip" type="button" data-planet-key="${planet.key}" style="--planet-color:${planet.color};--planet-glow:${planet.glow};">${planet.name}</button>`).join('');
    $$('[data-planet-key]').forEach((button) => {
      button.addEventListener('click', () => selectPlanet(button.dataset.planetKey, true));
    });
    $('#solarResetButton')?.addEventListener('click', () => selectPlanet('earth', true));
    selectPlanet(state.selectedPlanet || 'earth', false);
  }

  function selectPlanet(key, announce = false) {
    const planet = solarPlanets.find((item) => item.key === key) || solarPlanets.find((item) => item.key === 'earth') || solarPlanets[0];
    if (!planet) return;
    state.selectedPlanet = planet.key;
    const stage = $('[data-solar-stage]');
    if (stage) {
      stage.classList.add('is-focused');
      stage.style.setProperty('--focus-scale', String(planet.scale));
      stage.style.setProperty('--planet-accent', planet.color);
      stage.style.setProperty('--planet-glow', planet.glow);
      stage.dataset.focused = planet.key;
    }
    $$('[data-planet-key]').forEach((button) => button.classList.toggle('is-selected', button.dataset.planetKey === planet.key));
    $$('[data-orbit-key]').forEach((orbit) => orbit.classList.toggle('is-selected', orbit.dataset.orbitKey === planet.key));
    setText('[data-solar-type]', planet.type);
    setText('[data-solar-name]', planet.name);
    setText('[data-solar-summary]', planet.summary);
    setText('[data-solar-distance]', planet.distance);
    setText('[data-solar-diameter]', planet.diameter);
    setText('[data-solar-day]', planet.day);
    setText('[data-solar-year]', planet.year);
    setText('[data-solar-moons]', planet.moons);
    setText('[data-solar-feature]', planet.feature);
    if (announce) toast(`Solar zoom: ${planet.name} selected. Details panel updated.`);
  }

  class PremiumCanvasGlobe {
    constructor(stage, canvas) {
      this.stage = stage;
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { alpha: true });
      this.centerLon = 83;
      this.centerLat = 8;
      this.targetLon = 83;
      this.targetLat = 8;
      this.zoom = 1;
      this.dragging = false;
      this.last = { x: 0, y: 0 };
      this.markers = [];
      this.selected = null;
      this.lastFrame = 0;
      this.texture = makeWorldTexture(4096, 2048);
      this.clouds = makeCloudTexture(2048, 1024);
      this.cityLights = buildCityLights();
      this.textureStatus = 'procedural';
      this.spaceTexture = makeSpaceTexture(1600, 1000);
      this.renderCanvas = document.createElement('canvas');
      this.renderCtx = this.renderCanvas.getContext('2d', { alpha: true, willReadFrequently: true });
      this.renderImage = null;
      this.renderSize = 0;
      this.cloudOffset = 0;
      this.currentProjection = null;
    }
    init() {
      $('[data-earth-loader]')?.classList.add('hidden');
      window.addEventListener('resize', () => this.resize());
      const stopDrag = (event) => {
        this.dragging = false;
        if (event?.pointerId != null) this.canvas.releasePointerCapture?.(event.pointerId);
      };
      this.canvas.addEventListener('pointerdown', (event) => {
        this.dragging = true;
        this.last = { x: event.clientX, y: event.clientY };
        this.canvas.setPointerCapture?.(event.pointerId);
      });
      this.canvas.addEventListener('pointermove', (event) => {
        if (!this.dragging) return;
        const dx = event.clientX - this.last.x;
        const dy = event.clientY - this.last.y;
        this.centerLon -= dx * 0.18 / this.zoom;
        this.centerLat = clamp(this.centerLat + dy * 0.10 / this.zoom, -55, 55);
        this.targetLon = this.centerLon;
        this.targetLat = this.centerLat;
        this.last = { x: event.clientX, y: event.clientY };
      });
      this.canvas.addEventListener('pointerup', (event) => {
        stopDrag(event);
        this.handleClick(event);
      });
      this.canvas.addEventListener('pointerleave', stopDrag);
      this.canvas.addEventListener('pointercancel', stopDrag);
      this.canvas.addEventListener('wheel', (event) => {
        event.preventDefault();
        this.zoomBy(event.deltaY < 0 ? 0.22 : -0.22);
      }, { passive: false });
      this.resize();
      this.tryLoadSatelliteTextures();
      this.animate(0);
    }

    async tryLoadSatelliteTextures() {
      const earthUrl = 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/textures/planets/earth_atmos_2048.jpg';
      const cloudUrl = 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/textures/planets/earth_clouds_1024.png';
      try {
        const [earth, clouds] = await Promise.all([loadCanvasTexture(earthUrl, 2048, 1024), loadCanvasTexture(cloudUrl, 2048, 1024)]);
        if (earth) { this.texture = earth; this.textureStatus = 'satellite'; }
        if (clouds) this.clouds = clouds;
        this.draw();
        toast('Satellite globe texture loaded. Use scroll zoom to inspect more detail.');
      } catch {
      }
    }

    resize() {
      const isCompact = window.innerWidth <= 760;
      const ratio = Math.min(window.devicePixelRatio || 1, isCompact ? 1.75 : 2.25);
      const width = Math.max(isCompact ? 300 : 420, Math.floor(this.stage.clientWidth || window.innerWidth || 360));
      const height = Math.max(isCompact ? 320 : 540, Math.floor(this.stage.clientHeight || 620));
      this.canvas.width = Math.floor(width * ratio);
      this.canvas.height = Math.floor(height * ratio);
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;
      this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      this.currentProjection = null;
    }
    animate(now) {
      requestAnimationFrame((t) => this.animate(t));
      const frameGap = window.innerWidth <= 760 ? 55 : 40;
      if (now - this.lastFrame < frameGap) return;
      this.lastFrame = now;
      if (!this.dragging) {
        this.targetLon += 0.018;
        this.cloudOffset = (this.cloudOffset + 0.00045) % 1;
      }
      this.centerLon += shortestLongitude(this.centerLon, this.targetLon) * 0.055;
      this.centerLat += (this.targetLat - this.centerLat) * 0.055;
      this.draw();
    }
    draw() {
      const ctx = this.ctx;
      const width = this.canvas.clientWidth || this.stage.clientWidth;
      const height = this.canvas.clientHeight || this.stage.clientHeight;
      ctx.clearRect(0, 0, width, height);
      this.drawSpace(ctx, width, height);
      const board = document.querySelector('.globe-data-board');
      const boardMode = window.innerWidth > 1100 && board && getComputedStyle(board).display !== 'none';
      const baseRadius = Math.min(height * 0.51, width * (boardMode ? 0.36 : 0.46));
      const radius = baseRadius * (1 + (this.zoom - 1) * 0.09);
      const cx = width * (boardMode ? 0.39 : 0.50);
      const cy = height * 0.53;
      this.currentProjection = { cx, cy, radius, boardMode };
      this.renderSphere(ctx, cx, cy, radius);
      this.drawAtmosphere(ctx, cx, cy, radius);
      this.drawCityLights(ctx, cx, cy, radius);
      this.drawMarkers(ctx, cx, cy, radius);
      this.drawOrbitLines(ctx, cx, cy, radius);
    }
    drawSpace(ctx, width, height) {
      if (this.spaceTexture) ctx.drawImage(this.spaceTexture, 0, 0, width, height);
      const deepGlow = ctx.createRadialGradient(width * .50, height * .55, 0, width * .50, height * .55, Math.max(width, height) * .64);
      deepGlow.addColorStop(0, 'rgba(53,163,255,.14)');
      deepGlow.addColorStop(.36, 'rgba(99,102,241,.05)');
      deepGlow.addColorStop(.72, 'rgba(255,138,36,.03)');
      deepGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = deepGlow;
      ctx.fillRect(0, 0, width, height);
      const solarHaze = ctx.createRadialGradient(width * .16, height * .16, 0, width * .16, height * .16, width * .22);
      solarHaze.addColorStop(0, 'rgba(255,189,92,.12)');
      solarHaze.addColorStop(1, 'rgba(255,189,92,0)');
      ctx.fillStyle = solarHaze;
      ctx.fillRect(0, 0, width, height);
    }
    ensureRenderTarget(size) {
      if (this.renderSize === size && this.renderImage) return;
      this.renderSize = size;
      this.renderCanvas.width = size;
      this.renderCanvas.height = size;
      this.renderImage = this.renderCtx.createImageData(size, size);
    }
    renderSphere(ctx, cx, cy, radius) {
      const compact = (this.canvas.clientWidth || this.stage.clientWidth || window.innerWidth) <= 760;
      const size = Math.max(compact ? 360 : 540, Math.min(compact ? 620 : 860, Math.floor(radius * (compact ? 1.34 : 1.64))));
      this.ensureRenderTarget(size);
      const out = this.renderImage;
      const data = out.data;
      const tex = this.texture.data;
      const cloud = this.clouds.data;
      const tw = this.texture.width;
      const th = this.texture.height;
      const light = normalize([-0.44, 0.28, 0.86]);
      const halfVector = normalize([light[0], light[1], light[2] + 1]);
      const pitch = -this.centerLat * deg;
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);
      const centerLonRad = this.centerLon * deg;
      for (let y = 0; y < size; y++) {
        const sy = (y / (size - 1)) * 2 - 1;
        for (let x = 0; x < size; x++) {
          const sx = (x / (size - 1)) * 2 - 1;
          const rr = sx * sx + sy * sy;
          const index = (y * size + x) * 4;
          if (rr > 1) {
            data[index + 3] = 0;
            continue;
          }
          const zView = Math.sqrt(1 - rr);
          const yView = -sy;
          const y0 = yView * cosP + zView * sinP;
          const z0 = -yView * sinP + zView * cosP;
          const lon = Math.atan2(sx, z0) + centerLonRad;
          const lat = Math.asin(clamp(y0, -1, 1));
          const u = ((lon / (2 * Math.PI) + 0.5) % 1 + 1) % 1;
          const v = clamp(0.5 - lat / Math.PI, 0, 1);
          const tx = Math.floor(u * (tw - 1));
          const ty = clamp(Math.floor(v * (th - 1)), 0, th - 1);
          const ti = (ty * tw + tx) * 4;
          let r = tex[ti];
          let g = tex[ti + 1];
          let b = tex[ti + 2];
          const cloudU = ((u + this.cloudOffset) % 1 + 1) % 1;
          const cxi = Math.floor(cloudU * (this.clouds.width - 1));
          const cyi = clamp(Math.floor(v * (this.clouds.height - 1)), 0, this.clouds.height - 1);
          const ci = (cyi * this.clouds.width + cxi) * 4;
          const cloudA = cloud[ci + 3] / 255;
          const normal = normalize([sx, yView, zView]);
          const sun = clamp(dot(normal, light), 0, 1);
          const diffuse = 0.17 + sun * 0.95;
          const waterMask = b > g + 12 && b > r + 24 ? 1 : 0;
          const specular = waterMask ? Math.pow(Math.max(0, dot(normal, halfVector)), 28) * (0.28 + sun * 0.72) : 0;
          const cloudBrightness = 0.46 + sun * 0.54;
          r = r * diffuse * (1 - cloudA * .34) + 245 * cloudA * cloudBrightness + specular * 140;
          g = g * diffuse * (1 - cloudA * .34) + 248 * cloudA * cloudBrightness + specular * 165;
          b = b * diffuse * (1 - cloudA * .24) + 255 * cloudA * (0.52 + sun * 0.48) + specular * 210;
          if (sun < .16) {
            const night = 1 - sun / .16;
            r = r * (0.40 + 0.10 * (1 - night));
            g = g * (0.47 + 0.12 * (1 - night));
            b = b * (0.60 + 0.15 * (1 - night)) + night * 18;
          }
          const rim = Math.pow(1 - zView, 1.82);
          r += rim * 10;
          g += rim * 22;
          b += rim * 46;
          data[index] = clamp(r, 0, 255);
          data[index + 1] = clamp(g, 0, 255);
          data[index + 2] = clamp(b, 0, 255);
          data[index + 3] = 255;
        }
      }
      this.renderCtx.putImageData(out, 0, 0);
      ctx.save();
      ctx.shadowColor = 'rgba(53,163,255,.54)';
      ctx.shadowBlur = 34;
      ctx.drawImage(this.renderCanvas, cx - radius, cy - radius, radius * 2, radius * 2);
      ctx.restore();
    }
    drawAtmosphere(ctx, cx, cy, r) {
      ctx.save();
      const atmosphere = ctx.createRadialGradient(cx, cy, r * .78, cx, cy, r * 1.24);
      atmosphere.addColorStop(0, 'rgba(53,163,255,0)');
      atmosphere.addColorStop(.72, 'rgba(66, 228, 255, .18)');
      atmosphere.addColorStop(1, 'rgba(66, 228, 255, 0)');
      ctx.fillStyle = atmosphere;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(98,237,255,.76)';
      ctx.shadowColor = '#35a3ff';
      ctx.shadowBlur = 24;
      ctx.beginPath(); ctx.arc(cx, cy, r + 2, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 12;
      ctx.strokeStyle = 'rgba(53,163,255,.10)';
      ctx.beginPath(); ctx.arc(cx, cy, r + 10, 0, Math.PI * 2); ctx.stroke();
      const shadow = ctx.createLinearGradient(cx - r * 1.1, cy, cx + r * 1.1, cy + r * .12);
      shadow.addColorStop(0, 'rgba(0,0,0,.44)');
      shadow.addColorStop(.52, 'rgba(0,0,0,0)');
      shadow.addColorStop(1, 'rgba(0,0,0,.18)');
      ctx.fillStyle = shadow;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    drawCityLights(ctx, cx, cy, r) {
      this.cityLights.forEach((city) => {
        const p = this.project(city.latitude, city.longitude, cx, cy, r);
        if (!p.visible) return;
        const darkness = clamp(1 - p.sun * 2.5, 0, 1);
        if (darkness <= .06) return;
        ctx.globalAlpha = darkness * .82;
        ctx.fillStyle = '#ffd36f';
        ctx.shadowColor = '#ffb347';
        ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(p.x, p.y, city.size || 1.8, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }
    drawMarkers(ctx, cx, cy, r) {
      this.markers = [];
      sampleCities.forEach((city) => {
        const p = this.project(city.latitude, city.longitude, cx, cy, r);
        if (!p.visible) return;
        const color = getAqiBand(city.aqi).color;
        this.marker(ctx, p.x, p.y, city.aqi, color, city.display_name, city);
      });
      if (this.selected) {
        const p = this.project(this.selected.latitude, this.selected.longitude, cx, cy, r);
        if (p.visible) this.marker(ctx, p.x, p.y, this.selected.aqi, this.selected.color, this.selected.name, this.selected, true);
      }
    }
    marker(ctx, x, y, text, color, name, data, selected = false) {
      const size = selected ? 20 : 15;
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = selected ? 22 : 16;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,.78)';
      ctx.lineWidth = selected ? 3 : 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = `900 ${selected ? 12 : 10}px Inter, Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(text || ''), x, y);
      ctx.restore();
      this.markers.push({ x, y, radius: size + 7, data: { ...data, display_name: name } });
    }
    drawOrbitLines(ctx, cx, cy, r) {
      ctx.save();
      ctx.strokeStyle = 'rgba(98,237,255,.18)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 10]);
      ctx.beginPath(); ctx.ellipse(cx, cy, r * 1.18, r * .34, -0.25, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, cy, r * 1.08, r * .28, 0.72, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    project(lat, lon, cx, cy, r) {
      const latR = lat * deg;
      const dLon = (lon - this.centerLon) * deg;
      let x = Math.cos(latR) * Math.sin(dLon);
      let y = Math.sin(latR);
      let z = Math.cos(latR) * Math.cos(dLon);
      const pitch = -this.centerLat * deg;
      const y2 = y * Math.cos(pitch) - z * Math.sin(pitch);
      const z2 = y * Math.sin(pitch) + z * Math.cos(pitch);
      const light = normalize([-0.42, 0.32, 0.85]);
      const sun = clamp(dot(normalize([x, y2, z2]), light), 0, 1);
      return { x: cx + x * r, y: cy - y2 * r, visible: z2 > 0.05, z: z2, sun };
    }
    handleClick(event) {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const hit = this.markers.find((m) => Math.hypot(x - m.x, y - m.y) <= m.radius);
      if (hit) {
        setLocation(hit.data, 'globe');
        toast(`Selected ${hit.data.display_name}. Dashboard readings are updating for this marker.`);
        return;
      }
      const view = this.currentProjection;
      if (!view) return;
      if (Math.hypot(x - view.cx, y - view.cy) <= view.radius) this.zoomBy(0.25);
    }
    goTo(lat, lon) {
      this.targetLon = lon;
      this.targetLat = clamp(lat * 0.35, -38, 38);
      this.setZoom(Math.max(this.zoom, 1.35));
    }
    setSelected(lat, lon, aqi, color) {
      this.selected = { latitude: Number(lat), longitude: Number(lon), aqi, color, name: state.location.display_name };
    }
    zoomBy(delta) { this.setZoom(this.zoom + delta); }
    setZoom(value) {
      this.zoom = clamp(value, 1, 3.2);
      document.body.classList.toggle('is-zoomed', this.zoom >= 2.05);
      const unlocked = this.zoom >= 2.05;
      const zoomDepth = $('[data-zoom-depth]');
      if (zoomDepth) zoomDepth.textContent = `Zoom ${this.zoom.toFixed(1)}× · ${unlocked ? 'High-detail globe view' : 'Globe view'}`;
      setText('[data-city-detail-status]', unlocked ? 'Detail layer active' : 'Zoom in to unlock');
      if (unlocked) toast('High-detail globe zoom active: the globe is now showing closer location context.');
    }
    nudge(direction) {
      if (direction === 'left') this.targetLon -= 16;
      if (direction === 'right') this.targetLon += 16;
      if (direction === 'up') this.targetLat = clamp(this.targetLat + 8, -55, 55);
      if (direction === 'down') this.targetLat = clamp(this.targetLat - 8, -55, 55);
      if (direction === 'center') this.reset();
    }
    reset() {
      this.targetLon = 83;
      this.targetLat = 8;
      this.centerLon = 83;
      this.centerLat = 8;
      this.setZoom(1);
    }
  }



  function makeSpaceTexture(w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#020711');
    bg.addColorStop(.55, '#01030a');
    bg.addColorStop(1, '#000208');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 240; i++) {
      const x = noise(i * 19.7, 4.4) * w;
      const y = noise(i * 7.9, 12.8) * h;
      const size = 0.6 + noise(i * 5.2, 1.1) * 2.1;
      const alpha = 0.18 + noise(i * 3.8, 9.2) * 0.72;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      if (i % 11 === 0) {
        ctx.strokeStyle = `rgba(120,196,255,${alpha * .22})`;
        ctx.lineWidth = .8;
        ctx.beginPath();
        ctx.moveTo(x - size * 3, y);
        ctx.lineTo(x + size * 3, y);
        ctx.moveTo(x, y - size * 3);
        ctx.lineTo(x, y + size * 3);
        ctx.stroke();
      }
    }
    const nebulaA = ctx.createRadialGradient(w * .72, h * .22, 0, w * .72, h * .22, w * .18);
    nebulaA.addColorStop(0, 'rgba(124, 92, 255, .16)');
    nebulaA.addColorStop(1, 'rgba(124, 92, 255, 0)');
    ctx.fillStyle = nebulaA;
    ctx.fillRect(0, 0, w, h);
    const nebulaB = ctx.createRadialGradient(w * .22, h * .72, 0, w * .22, h * .72, w * .16);
    nebulaB.addColorStop(0, 'rgba(33, 211, 255, .12)');
    nebulaB.addColorStop(1, 'rgba(33, 211, 255, 0)');
    ctx.fillStyle = nebulaB;
    ctx.fillRect(0, 0, w, h);
    return canvas;
  }

  function loadCanvasTexture(url, w, h) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve({ canvas, width: w, height: h, data: ctx.getImageData(0, 0, w, h).data });
        } catch { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  function makeWorldTexture(w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    const image = ctx.createImageData(w, h);
    const d = image.data;
    for (let y = 0; y < h; y++) {
      const lat = 90 - (y / h) * 180;
      for (let x = 0; x < w; x++) {
        const lon = (x / w) * 360 - 180;
        const i = (y * w + x) * 4;
        const land = isLand(lon, lat);
        const n = layeredNoise(lon * .045, lat * .045);
        if (land) {
          const desert = desertFactor(lon, lat);
          const forest = clamp((n - .42) * 2.6, 0, 1) * (1 - desert) * (Math.abs(lat) < 55 ? 1 : .35);
          const snow = Math.abs(lat) > 64 ? clamp((Math.abs(lat) - 58) / 22, 0, 1) : 0;
          const mountain = mountainFactor(lon, lat) * (0.45 + n * .55);
          let r = 54 + forest * 24 + desert * 110 + mountain * 45;
          let g = 96 + forest * 75 + desert * 42 + mountain * 24;
          let b = 56 + forest * 28 + desert * 8 + mountain * 18;
          r = mix(r, 236, snow); g = mix(g, 241, snow); b = mix(b, 245, snow);
          d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
        } else {
          const depth = 0.45 + 0.55 * layeredNoise(lon * .025 + 12, lat * .025 - 4);
          const polar = Math.abs(lat) > 72 ? .28 : 0;
          d[i] = mix(5, 26, depth + polar);
          d[i + 1] = mix(35, 96, depth + polar);
          d[i + 2] = mix(74, 145, depth + polar);
          d[i + 3] = 255;
        }
      }
    }
    ctx.putImageData(image, 0, 0);
    return { canvas, width: w, height: h, data: ctx.getImageData(0, 0, w, h).data };
  }

  function makeCloudTexture(w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    const image = ctx.createImageData(w, h);
    const d = image.data;
    for (let y = 0; y < h; y++) {
      const lat = 90 - (y / h) * 180;
      for (let x = 0; x < w; x++) {
        const lon = (x / w) * 360 - 180;
        const streak = Math.abs(Math.sin((lon * .05 + lat * .09 + layeredNoise(lon * .02, lat * .02) * 7)));
        const n = layeredNoise(lon * .028 + 100, lat * .065 - 20);
        const alpha = n > .56 && streak > .28 ? clamp((n - .55) * 2.4, 0, .68) : 0;
        const i = (y * w + x) * 4;
        d[i] = 255; d[i + 1] = 255; d[i + 2] = 255; d[i + 3] = alpha * 255;
      }
    }
    ctx.putImageData(image, 0, 0);
    return { canvas, width: w, height: h, data: ctx.getImageData(0, 0, w, h).data };
  }

  function isLand(lon, lat) {
    return continent(lon, lat, -100, 44, 48, 24, -18) || continent(lon, lat, -61, -18, 22, 39, 7) || continent(lon, lat, 18, 5, 25, 36, -8) || continent(lon, lat, 76, 45, 82, 28, 2) || continent(lon, lat, 105, 23, 36, 23, -12) || continent(lon, lat, 78, 20, 15, 20, 7) || continent(lon, lat, 45, 23, 19, 14, -11) || continent(lon, lat, 134, -25, 25, 16, 12) || continent(lon, lat, -42, 72, 18, 9, -18) || lat < -72;
  }

  function continent(lon, lat, cx, cy, rx, ry, rotation) {
    const a = rotation * deg;
    const dx = wrapLon(lon - cx);
    const dy = lat - cy;
    const x = dx * Math.cos(a) - dy * Math.sin(a);
    const y = dx * Math.sin(a) + dy * Math.cos(a);
    const edge = (x * x) / (rx * rx) + (y * y) / (ry * ry);
    return edge < 1 + (layeredNoise(lon * .12, lat * .12) - .5) * .32;
  }

  function desertFactor(lon, lat) {
    const sahara = continent(lon, lat, 15, 22, 36, 12, -5) ? .9 : 0;
    const arabia = continent(lon, lat, 46, 23, 18, 10, -10) ? .75 : 0;
    const australia = continent(lon, lat, 132, -25, 19, 11, 8) ? .52 : 0;
    const gobi = continent(lon, lat, 103, 42, 22, 9, 0) ? .5 : 0;
    return clamp(Math.max(sahara, arabia, australia, gobi), 0, 1);
  }

  function mountainFactor(lon, lat) {
    const himalaya = continent(lon, lat, 82, 30, 30, 5, 2) ? .95 : 0;
    const andes = continent(lon, lat, -72, -20, 8, 43, -4) ? .86 : 0;
    const rockies = continent(lon, lat, -113, 45, 11, 28, -15) ? .55 : 0;
    return Math.max(himalaya, andes, rockies);
  }

  function buildCityLights() {
    const base = sampleCities.concat([
      { latitude: 40.7128, longitude: -74.0060 }, { latitude: 31.2304, longitude: 121.4737 }, { latitude: 1.3521, longitude: 103.8198 },
      { latitude: 13.7563, longitude: 100.5018 }, { latitude: 37.7749, longitude: -122.4194 }, { latitude: 55.7558, longitude: 37.6173 },
      { latitude: 30.0444, longitude: 31.2357 }, { latitude: -23.5505, longitude: -46.6333 }, { latitude: 41.0082, longitude: 28.9784 }
    ]);
    for (let i = 0; i < 120; i++) {
      const lon = -180 + noise(i * 8.17, 2.3) * 360;
      const lat = -55 + noise(i * 4.31, 7.1) * 115;
      if (isLand(lon, lat)) base.push({ latitude: lat, longitude: lon, size: .9 + noise(i, 5) * 1.2 });
    }
    return base;
  }

  function wrapLon(lon) {
    let v = lon;
    while (v > 180) v -= 360;
    while (v < -180) v += 360;
    return v;
  }

  function shortestLongitude(current, target) {
    let diff = target - current;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    return diff;
  }

  function noise(x, y) {
    const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return s - Math.floor(s);
  }

  function layeredNoise(x, y) {
    return (noise(x, y) * .55 + noise(x * 2.1 + 8, y * 2.1 - 3) * .30 + noise(x * 4.2 - 1, y * 4.2 + 6) * .15);
  }

  function mix(a, b, t) { return a + (b - a) * clamp(t, 0, 1); }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function normalize(v) { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }

  function showApiConnectivityBanner() {
    const message = 'API connection issue: the dashboard cannot reach the backend. Check the server URL or AQI_API_BASE_URL.';
    const box = $('#toast');
    if (box) box.classList.add('connectivity-warning');
    toast(message);
    window.setTimeout(() => $('#toast')?.classList.remove('connectivity-warning'), 3200);
  }

  function toast(message) {
    const box = $('#toast');
    if (!box) return;
    box.textContent = message;
    box.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => box.classList.remove('show'), 2400);
  }
