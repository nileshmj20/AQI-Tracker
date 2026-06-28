const LAST_STATION_KEY = 'aqiRadioLastStation';
const VOLUME_KEY = 'aqiRadioVolume';
const FAVOURITES_KEY = 'aqiRadioFavourites';

/**
 * Creates a stable ID for a station even when the API does not return one.
 */
export function stationId(station) {
  return String(station?.id || station?.stationuuid || station?.url || station?.name || '').trim();
}

/**
 * Loads the last selected radio station from localStorage.
 */
export function loadLastStation() {
  try {
    const value = JSON.parse(localStorage.getItem(LAST_STATION_KEY) || 'null');
    return value && value.url ? value : null;
  } catch {
    return null;
  }
}

/**
 * Persists a selected station without autoplaying it on the next visit.
 */
export function saveLastStation(station) {
  if (!station?.url) return;
  const compact = {
    id: stationId(station),
    name: station.name || 'Live station',
    url: station.url,
    country: station.country || '',
    language: station.language || '',
    bitrate: station.bitrate || 0,
    tags: station.tags || ''
  };
  localStorage.setItem(LAST_STATION_KEY, JSON.stringify(compact));
}

/**
 * Loads saved radio volume as a 0-100 number.
 */
export function loadVolume(defaultValue = 80) {
  const value = Number(localStorage.getItem(VOLUME_KEY));
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : defaultValue;
}

/**
 * Saves radio volume as a 0-100 number.
 */
export function saveVolume(value) {
  localStorage.setItem(VOLUME_KEY, String(Math.max(0, Math.min(100, Number(value) || 0))));
}

/**
 * Loads favourite radio station IDs from localStorage.
 */
export function loadFavouriteStations() {
  try {
    const value = JSON.parse(localStorage.getItem(FAVOURITES_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

/**
 * Toggles a radio station favourite and returns the updated ID list.
 */
export function toggleFavouriteStation(station) {
  const id = stationId(station);
  if (!id) return loadFavouriteStations();
  const favourites = new Set(loadFavouriteStations());
  favourites.has(id) ? favourites.delete(id) : favourites.add(id);
  const next = Array.from(favourites);
  localStorage.setItem(FAVOURITES_KEY, JSON.stringify(next));
  return next;
}

/**
 * Checks if a station is saved as favourite.
 */
export function isFavouriteStation(station) {
  const id = stationId(station);
  return Boolean(id && loadFavouriteStations().includes(id));
}
