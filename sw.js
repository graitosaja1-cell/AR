/* Service worker — Laporan PWA. Naikkan nomor VERSI bila ingin memaksa cache lama dibuang. */
const VERSI = 'laporan-v1';
const INTI = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];
const HOST_LUAR = /(^|\.)jsdelivr\.net$|^fonts\.googleapis\.com$|^fonts\.gstatic\.com$/;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSI).then(c => c.addAll(INTI)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== VERSI).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  /* Halaman utama: ambil versi terbaru dari jaringan, cadangan dari cache bila offline */
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => {
      if (res && res.ok) { const salin = res.clone(); caches.open(VERSI).then(c => c.put('index.html', salin)); }
      return res;
    }).catch(() => caches.match('index.html', { ignoreSearch: true })));
    return;
  }
  /* File sendiri + pustaka CDN (XLSX, font): pakai cache dulu, perbarui di belakang layar */
  if (u.origin !== location.origin && !HOST_LUAR.test(u.hostname)) return;
  e.respondWith(caches.match(req).then(hit => {
    const jaringan = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) { const salin = res.clone(); caches.open(VERSI).then(c => c.put(req, salin)); }
      return res;
    }).catch(() => hit);
    return hit || jaringan;
  }));
});
