// SPDX-License-Identifier: GPL-3.0-or-later
// Fekete doboz nélkül – Copyright (C) 2026 Nimmerfroh Károly
// Összefűzi a src/ fájlokat egyetlen, önálló index.html-lé.
// Használat: node build.mjs
import { readFileSync, writeFileSync } from 'node:fs';

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
writeFileSync(new URL('./index.html', import.meta.url), page);
// service worker: a verzió az oldal tartalmából (új kiadásnál a tabletek maguktól frissülnek)
const { createHash } = await import('node:crypto');
const version = createHash('sha256').update(page).digest('hex').slice(0, 12);
writeFileSync(new URL('./sw.js', import.meta.url), read('./src/sw.template.js').replace('__VERSION__', version));
console.log(`index.html kész (${(page.length / 1024).toFixed(0)} kB), sw.js verzió: ${version}`);
