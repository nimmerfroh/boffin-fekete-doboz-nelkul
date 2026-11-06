// SPDX-License-Identifier: GPL-3.0-or-later
// Fekete doboz nélkül – Copyright (C) 2026 Nimmerfroh Károly
// Összefűzi a src/ fájlokat egyetlen, önálló index.html-lé, és elkészíti a service workert.
// Használat:
//   node build.mjs                                – index.html és sw.js a projekt gyökerébe (helyi kipróbáláshoz)
//   node build.mjs --out _site --channel main     – a teljes éles webhely egy könyvtárba
//   node build.mjs --out _site/dev --channel dev  – a fejlesztői változat (DEV címkével, külön tárolóval)
import { readFileSync, writeFileSync, mkdirSync, cpSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : def; };
const channel = arg('channel', 'main');
const outDir = arg('out', null);
const broken = process.argv.includes('--broken');   // a fejlesztői ág tesztjei elbuktak: figyelmeztető sáv
if (!['main', 'dev'].includes(channel)) throw new Error('ismeretlen csatorna: ' + channel);

const read = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');
let page = read('./src/page.html');
const engine = read('./src/engine.js');
const layouts = '(function () {\nconst module = { exports: {} };\n' + read('./src/layouts.js') + '\nwindow.BOFFIN_LAYOUTS = module.exports;\n})();';
const experiments = read('./src/experiments.js');
const app = read('./src/app.js');

for (const [name, code] of [['ENGINE', engine], ['LAYOUTS', layouts], ['EXPERIMENTS', experiments], ['APP', app]]) {
  if (code.includes('</script')) throw new Error(`${name}: a kód nem tartalmazhat </script> szöveget`);
  const mark = `/*${name}*/`;
  if (!page.includes(mark)) throw new Error(`hiányzik a ${mark} jelölő a page.html-ből`);
  page = page.replace(mark, () => code);
}
let manifest = read('./manifest.webmanifest');
if (channel === 'dev') {
  // fejlesztői változat: feltűnő DEV címke, más név és színsáv, hogy ne keveredjen az élessel
  const sub = (a, b) => { if (!page.includes(a)) throw new Error('nem található: ' + a); page = page.replace(a, () => b); };
  sub('<title>Fekete doboz nélkül</title>', '<title>Fekete doboz nélkül – DEV</title>');
  sub('<meta name="theme-color" content="#2457C5">', '<meta name="theme-color" content="#C2410C">');
  sub('<h1>Fekete doboz nélkül</h1>', '<h1>Fekete doboz nélkül <span class="devtag" title="Fejlesztői változat: itt próbáljuk ki az újdonságokat, mielőtt az éles oldalra kerülnek">DEV</span></h1>');
  if (broken) sub('<body>', '<body><div style="background:#B42318;color:#fff;padding:10px 16px;font-weight:700;text-align:center">Figyelem: ennek a fejlesztői változatnak a tesztjei nem mentek át, hibás lehet.</div>');
  sub('</style>', '.devtag { display: inline-block; vertical-align: middle; font-size: 13px; font-weight: 800; letter-spacing: .06em; color: #fff; background: #C2410C; border-radius: 8px; padding: 2px 8px; margin-left: 6px; }\n</style>');
  const m = JSON.parse(manifest);
  m.name = 'Fekete doboz nélkül – DEV'; m.short_name = 'Fekete doboz DEV'; m.theme_color = '#C2410C';
  manifest = JSON.stringify(m, null, 2) + '\n';
}

// service worker: a verzió az oldal tartalmából (új kiadásnál a tabletek maguktól frissülnek)
const pukiN = readdirSync(new URL('./hangok/puki/', import.meta.url)).filter((f) => /^\d\d\.mp3$/.test(f)).length;
if (!page.includes(`const PUKI_N = ${pukiN};`)) throw new Error('az app.js PUKI_N értéke nem egyezik a hangok/puki fájlok számával: ' + pukiN);
// a verzió az oldal, a manifest, az ikonok és a hangok tartalmából: bármelyik változik, a telepített app frissül
const hashDir = (h, d) => { for (const f of readdirSync(new URL('./' + d + '/', import.meta.url), { recursive: true }).map(String).sort()) { try { h.update(f).update(readFileSync(new URL('./' + d + '/' + f, import.meta.url))); } catch (e) { /* könyvtár */ } } return h; };
const version = hashDir(hashDir(hashDir(createHash('sha256').update(page).update(manifest), 'icons'), 'hangok'), 'fonts').digest('hex').slice(0, 12);
const soundsVer = hashDir(createHash('sha256'), 'hangok').digest('hex').slice(0, 8);
const sw = read('./src/sw.template.js').replace('__VERSION__', version).replace('__PUKI_N__', String(pukiN)).replace('__CHANNEL__', channel).replace('__SOUNDS_VER__', soundsVer);

if (!outDir) {
  writeFileSync(new URL('./index.html', import.meta.url), page);
  writeFileSync(new URL('./sw.js', import.meta.url), sw);
} else {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outDir + '/index.html', page);
  writeFileSync(outDir + '/sw.js', sw);
  writeFileSync(outDir + '/manifest.webmanifest', manifest);
  for (const d of ['icons', 'hangok', 'fonts']) cpSync(new URL('./' + d, import.meta.url), outDir + '/' + d, { recursive: true });
}
console.log(`${channel}: index.html kész (${(page.length / 1024).toFixed(0)} kB), sw.js verzió: ${version}${outDir ? ', könyvtár: ' + outDir : ''}`);
