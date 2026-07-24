/**
 * Prudent Journals service worker.
 *
 * Deliberately small. It caches three things and nothing else:
 *
 *   1. The app shell, so the site opens instantly and works offline.
 *   2. Publication and conference listings, so recent reading is available offline.
 *   3. PDFs the reader has actually opened, so a paper you were reading stays readable.
 *
 * Nothing is pre-fetched speculatively. Authenticated pages, admin routes and any
 * write request are never cached.
 */

const VERSION = 'v1';
const SHELL_CACHE = `pj-shell-${VERSION}`;
const DATA_CACHE = `pj-data-${VERSION}`;
const DOC_CACHE = `pj-docs-${VERSION}`;
const KNOWN_CACHES = [SHELL_CACHE, DATA_CACHE, DOC_CACHE];

const SHELL_ASSETS = ['/', '/publications', '/conferences', '/offline', '/icons/icon-192.png'];

// Never cached: anything private, or anything that changes state.
const PRIVATE_PATHS = ['/admin', '/dashboard', '/reviewer', '/auth'];
const CACHEABLE_API = ['/publications', '/conferences'];

const MAX_DOCS = 12;
const MAX_DATA = 40;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // A single missing asset must not fail the whole install.
      .then((cache) => Promise.allSettled(SHELL_ASSETS.map((a) => cache.add(a))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !KNOWN_CACHES.includes(k)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

/** Keep a cache from growing without bound, oldest entry first. */
async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= max) return;
  for (const key of keys.slice(0, keys.length - max)) {
    await cache.delete(key);
  }
}

function isPrivate(url) {
  return PRIVATE_PATHS.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (isPrivate(url)) return;

  // Stored documents: cache first, since a PDF at a given URL does not change.
  if (url.pathname.startsWith('/files/') || url.pathname.endsWith('.pdf')) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(DOC_CACHE).then((c) =>
                c.put(request, copy).then(() => trim(DOC_CACHE, MAX_DOCS)),
              );
            }
            return res;
          }),
      ),
    );
    return;
  }

  // Public API reads: network first so the data is fresh, cache as a fallback.
  const isApi = url.pathname.startsWith('/api/');
  if (isApi) {
    const cacheable = CACHEABLE_API.some((p) => url.pathname.includes(p));
    if (!cacheable) return;

    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(DATA_CACHE).then((c) =>
              c.put(request, copy).then(() => trim(DATA_CACHE, MAX_DATA)),
            );
          }
          return res;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  // Page navigations: network first, falling back to the cached page, then to
  // the offline notice. This is what makes the installed app open when there is
  // no connection.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match('/offline'))),
    );
    return;
  }

  // Build output is content hashed, so serving it from cache is safe.
  if (url.origin === self.location.origin && url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(SHELL_CACHE).then((c) => c.put(request, copy));
            }
            return res;
          }),
      ),
    );
  }
});

// Allows the page to activate an updated worker without a manual reload.
self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});
