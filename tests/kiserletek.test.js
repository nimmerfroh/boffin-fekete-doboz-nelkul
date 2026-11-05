// A kísérletek viselkedésének ellenőrzése a szimulátorral.
// Futtatás: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../src/engine.js');
const L = require('../src/layouts.js');

const swap = (lay, f) => lay.map((p) => f(p) || p);
const SOUND = swap(L.flash, (p) => (p.p === 'C4' ? { ...p, p: 'C2' } : p.p === 'D2' ? { ...p, p: 'SP', id: 'SP' } : null));
const run = (sim, secs, dt) => { for (let i = 0, n = Math.round(secs / dt); i < n; i++) sim.step(dt); };
const withBeta = (bf, fn) => { const old = globalThis.__BJT.bf; globalThis.__BJT.bf = bf; try { return fn(); } finally { globalThis.__BJT.bf = old; } };

// Periódus mérése: a figyelt áram felfutó élei között eltelt átlagos idő.
function period(layout, id, secs, dt, thr) {
  const s = new E.Sim(layout); s.switches.S1 = true;
  const edges = []; let on = false;
  for (let i = 0, n = Math.round(secs / dt); i < n; i++) {
    s.step(dt);
    const now = Math.abs(s.cur[id]) > thr;
    if (now && !on) edges.push(s.time);
    on = now;
  }
  assert.ok(edges.length > 3, `${id}: nem rezeg (élek: ${edges.length})`);
  return (edges[edges.length - 1] - edges[1]) / (edges.length - 2);
}

test('minden elrendezés megépíthető (szintek, alátámasztás, ütközés)', () => {
  for (const [name, lay] of Object.entries({ ...L, sound: SOUND })) {
    const chk = E.checkBuild(lay);
    assert.deepEqual(chk.errors, [], name);
  }
});

test('minden kísérlet megépíthető a három doboz alkatrészeiből', () => {
  const have = {};
  for (const k of Object.values(E.KITS)) for (const [p, n] of Object.entries(k.parts)) have[p] = (have[p] || 0) + n;
  for (const [name, lay] of Object.entries({ ...L, sound: SOUND })) {
    const need = {};
    for (const p of lay) need[p.p] = (need[p.p] || 0) + 1;
    for (const [p, n] of Object.entries(need)) assert.ok((have[p] || 0) >= n, `${name}: ${p} kell ${n}, van ${have[p] || 0}`);
  }
});

test('1. első áramkör: világít, fordított LED-del nem', () => {
  const s = new E.Sim(L.first); s.switches.S1 = true; run(s, 0.01, 0.001);
  assert.ok(s.cur.D1 > 0.008 && s.cur.D1 < 0.015, `LED-áram ${s.cur.D1}`);
  const flipped = swap(L.first, (p) => (p.p === 'D1' ? { ...p, at: 'D7', dir: 'l' } : null));
  const f = new E.Sim(flipped); f.switches.S1 = true; run(f, 0.01, 0.001);
  assert.ok(Math.abs(f.cur.D1) < 1e-6);
});

test('2. éjjeli lámpa: sötétben ég, világosban nem', () => {
  for (const [light, lit] of [[1, false], [0.3, false], [0.1, true], [0, true]]) {
    const s = new E.Sim(L.night, { light }); s.switches.S1 = true; run(s, 0.05, 0.001);
    assert.equal(s.cur.D1 > 0.005, lit, `fény ${light}: LED ${s.cur.D1}`);
  }
});

test('3. késleltetett lámpa: elengedés után még ég, aztán elhalványul', () => {
  const s = new E.Sim(L.delay); s.switches.S1 = true;
  run(s, 0.1, 0.001); s.switches.S2 = true; run(s, 0.3, 0.001); s.switches.S2 = false;
  run(s, 2, 0.002); assert.ok(s.cur.D1 > 0.009, `2 s után: ${s.cur.D1}`);
  run(s, 13, 0.005); assert.ok(s.cur.D1 < 0.002, `15 s után: ${s.cur.D1}`);
});

test('4. villogó: β = 80…300 mellett is kb. 2,6 Hz', () => {
  for (const bf of [80, 150, 300]) {
    const T = withBeta(bf, () => period(L.flash, 'D1', 4, 0.0005, 0.004));
    assert.ok(T > 0.3 && T < 0.5, `β=${bf}: periódus ${T}`);
  }
});

test('5. hang: kb. 1,6 kHz, C1-gyel magasabb', () => {
  const f1 = 1 / period(SOUND, 'SP', 0.03, 1 / 48000, 0.01);
  assert.ok(f1 > 1300 && f1 < 2000, `f = ${f1}`);
  const f2 = 1 / period(swap(SOUND, (p) => (p.id === 'C4b' ? { ...p, p: 'C1' } : null)), 'SP', 0.03, 1 / 48000, 0.01);
  assert.ok(f2 > f1 * 1.5, `C1-gyel f = ${f2}`);
});
