// SPDX-License-Identifier: GPL-3.0-or-later
// Offline működés: az oldal, az ikonok és a betűtípusok a gyorsítótárba kerülnek.
// A VERSION-t a build szkript tölti ki az oldal tartalmából, így új kiadásnál a régi gyorsítótár törlődik.
const VERSION = 'efb80eacb5fe';
const CACHE = 'fdn-' + VERSION;
// a hangfájlok külön, verziótól független tárba kerülnek (nem töltődnek le újra minden kiadásnál)
const SOUNDS = 'fdn-hangok-1';
const PUKI_N = 48;
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('fdn-') && k !== CACHE && k !== SOUNDS).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
  // a pukihangokat a háttérben előre letölti, hogy net nélkül is szóljanak
  e.waitUntil(caches.open(SOUNDS).then((c) => Promise.all(Array.from({ length: PUKI_N }, (_, i) => {
    const u = './hangok/puki/' + String(i + 1).padStart(2, '0') + '.mp3';
    return c.match(u).then((hit) => hit || c.add(u).catch(() => {}));
  }))));
});
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const font = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !font) return;
  // az oldal: előbb a hálózat (friss változat), ha nincs net, a tárolt
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put('./index.html', cp)); return r; }).catch(() => caches.match('./index.html')));
    return;
  }
  if (url.pathname.includes('/hangok/')) {
    e.respondWith(caches.open(SOUNDS).then((c) => c.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }))));
    return;
  }
  // minden más (ikonok, betűtípusok): a tárolt, ha van; különben hálózat és eltárolás
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok || r.type === 'opaque') { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); } return r; })));
});
