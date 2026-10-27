// Choir Loop Practice — offline support.
// App shell is cached on install; Google Fonts are cached as they're fetched,
// so after one online visit the app works fully offline in the rehearsal room.
const CACHE = 'choir-loop-v9';
const SHELL = ['./', 'index.html', 'multitrack.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if(e.request.method !== 'GET') return;

  // Fonts (cross-origin): cache-first, fill cache from network
  if(url.origin !== location.origin) {
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
        if(res.ok || res.type === 'opaque') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => hit))
    );
    return;
  }

  // Same-origin app shell: network-first so updates land, cache fallback offline
  e.respondWith(
    fetch(e.request).then(res => {
      if(res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request).then(hit => hit || caches.match('index.html')))
  );
});
