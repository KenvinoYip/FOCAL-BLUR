const CACHE_NAME = 'coffee-daily-v2.2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './main.js',
  './coffee-data.js',
  './liquor-data.js',
  './pwa/pwa-prompt.js',
  './pwa/pwa-guide.html',
  // 如果你有默认图片，也可以加在这里
];

self.addEventListener('install', (e) => {
  self.skipWaiting(); // 强制跳过等待，立即激活
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    Promise.all([
      self.clients.claim(), // 立即控制所有页面
      caches.keys().then((keys) => {
        return Promise.all(keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
          return Promise.resolve();
        }));
      })
    ])
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }
  if (req.destination === 'image') {
    e.respondWith(
      caches.match(req).then((res) => {
        if (res) return res;
        return fetch(req).then((netRes) => {
          const clone = netRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return netRes;
        });
      })
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((res) => res || fetch(req))
  );
});
