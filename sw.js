// SPDX-License-Identifier: GPL-3.0-or-later
// Offline működés: az oldal, az ikonok, a betűtípusok és a hangok a gyorsítótárba kerülnek.
// A VERSION-t a build szkript tölti ki az oldal, a manifest, az ikonok és a hangok tartalmából: új kiadásnál a régi tár törlődik.
// Két csatorna van: az éles (main) a webhely gyökerében, a fejlesztői (dev) a /dev/ alatt. Mindkettő csak a saját
// tárolóit kezeli, és az éles service worker nem nyúl a /dev/ alatti kérésekhez (annak saját service workere van).
const VERSION = '6f57d316d0c1';
const CHANNEL = 'main';
const PREFIX = 'fdn-' + CHANNEL + '-';
const CACHE = PREFIX + VERSION;
// a hangfájlok külön tárba kerülnek; a nevük a hangfájlok tartalmából képzett jel, így csak akkor töltődnek le újra, ha változtak
const SOUNDS = 'fdn-hangok-' + CHANNEL + '-' + 'c6f00205';
const PUKI_N = 48;
const FONTS = ['atkinson-hyperlegible-latin-400', 'atkinson-hyperlegible-latin-700', 'atkinson-hyperlegible-latin-ext-400', 'atkinson-hyperlegible-latin-ext-700', 'baloo2-latin', 'baloo2-latin-ext'].map((f) => './fonts/' + f + '.woff2');
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/icon.svg'].concat(FONTS);
const BASE = new URL('./', self.location).pathname;   // pl. /boffin-fekete-doboz-nelkul/ vagy …/dev/
// a saját régi tárolóink: a csatorna korábbi verziói, és (az élesnél) a csatornák bevezetése előtti régi nevek
const isOld = (k) => (k.startsWith(PREFIX) && k !== CACHE) || (k.startsWith('fdn-hangok-' + CHANNEL + '-') && k !== SOUNDS) || (CHANNEL === 'main' && (/^fdn-[0-9a-f]{12}$/.test(k) || k === 'fdn-hangok-1'));
// csak a saját, sikeres, nem átirányított válasz kerülhet a tárba (különben egy 404-es vagy hibaoldal is offline kezdőlap lenne)
const good = (r) => r && r.ok && r.type === 'basic' && !r.redirected;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter(isOld).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
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
  // csak a saját könyvtárunk kéréseit kezeljük; az éles változat a /dev/ alattiakat sem
  if (!font && (!url.pathname.startsWith(BASE) || (CHANNEL === 'main' && (url.pathname === BASE + 'dev' || url.pathname.startsWith(BASE + 'dev/'))))) return;
  // az oldal: előbb a hálózat (friss változat), ha nincs net, a tárolt. Csak a kezdőlapot kezeljük így.
  if (req.mode === 'navigate') {
    if (url.pathname !== BASE && url.pathname !== BASE + 'index.html') return;
    e.respondWith(fetch(req).then((r) => { if (good(r)) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put('./index.html', cp)); } return r.ok ? r : caches.match('./index.html', { cacheName: CACHE }).then((hit) => hit || r); }).catch(() => caches.match('./index.html', { cacheName: CACHE })));
    return;
  }
  if (url.pathname.includes('/hangok/')) {
    e.respondWith(caches.open(SOUNDS).then((c) => c.match(req).then((hit) => hit || fetch(req).then((r) => { if (good(r)) c.put(req, r.clone()); return r; }))));
    return;
  }
  // minden más (ikonok, betűtípusok): a tárolt, ha van; különben hálózat és eltárolás
  e.respondWith(caches.open(CACHE).then((c) => c.match(req).then((hit) => hit || fetch(req).then((r) => { if (good(r) || (font && (r.ok || r.type === 'opaque'))) c.put(req, r.clone()); return r; }))));
});
