const CACHE_NAME = 'aqi-tracker-v46-mobile-optimized';
const ASSETS = [
  '/',
  '/index.html',
  '/styles/tokens.css',
  '/styles/base.css',
  '/styles/layout.css',
  '/styles/components.css',
  '/styles/charts.css',
  '/styles/globe.css',
  '/styles/radio.css',
  '/styles/pages.css',
  '/styles/responsive.css',
  '/scripts/main.js',
  '/scripts/dashboard.js',
  '/scripts/modules/utils.js',
  '/scripts/modules/api.js',
  '/scripts/modules/charts.js',
  '/scripts/modules/navigation.js',
  '/scripts/modules/radio.js',
  '/assets/aqi-tracker-logo-icon.png',
  '/assets/aqi-tracker-logo-square.png',
  '/assets/favicon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request).then(response => response || caches.match('/index.html'))));
});
