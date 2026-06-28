const DEFAULT_TIMEOUT_MS = 7000;

/**
 * Builds an API URL. Same-origin paths are used by default; window.AQI_API_BASE_URL can point to a separate backend.
 */
export function buildApiUrl(path) {
  const rawBase = typeof window !== 'undefined' ? String(window.AQI_API_BASE_URL || '').trim() : '';
  if (!rawBase) return path;
  const base = rawBase.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Fetches JSON from the AQI backend with timeout and explicit connectivity errors.
 */
export async function requestJson(path, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(buildApiUrl(path), { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    const reason = error?.name === 'AbortError' ? 'timeout' : 'network';
    const wrapped = new Error(`AQI API ${reason}: ${error?.message || 'request failed'}`);
    wrapped.isApiConnectivityError = true;
    wrapped.cause = error;
    throw wrapped;
  } finally {
    window.clearTimeout(timer);
  }
}

/**
 * Returns true when an error means the configured API origin/path is unreachable.
 */
export function isApiConnectivityError(error) {
  return Boolean(error?.isApiConnectivityError || error?.name === 'AbortError' || /Failed to fetch|NetworkError|AQI API/i.test(String(error?.message || '')));
}
