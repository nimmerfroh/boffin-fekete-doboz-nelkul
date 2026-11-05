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

const X = require('../src/experiments.js')(E, L);

// minden kísérlet minden változatának elrendezése (alap + egyenként alkalmazott változatok)
function allLayouts() {
  const out = [];
  for (const ex of X.EXPS) {
    out.push([ex.id, ex.layout]);
    for (const v of ex.variants) out.push([ex.id + '/' + v.id, X.applyVariant(v, ex.layout)]);
  }
  return out;
}

test('minden elrendezés megépíthető (szintek, alátámasztás, ütközés)', () => {
  for (const [name, lay] of allLayouts()) assert.deepEqual(E.checkBuild(lay).errors, [], name);
});

test('minden kísérlet megépíthető a három doboz alkatrészeiből', () => {
  const have = {};
  for (const k of Object.values(E.KITS)) for (const [p, n] of Object.entries(k.parts)) have[p] = (have[p] || 0) + n;
  for (const [name, lay] of allLayouts()) {
    const need = {};
    for (const p of lay) if (!E.PARTS[p.p].virtual) need[p.p] = (need[p.p] || 0) + 1;
    for (const [p, n] of Object.entries(need)) assert.ok((have[p] || 0) >= n, `${name}: ${p} kell ${n}, van ${have[p] || 0}`);
  }
});

test('minden kísérletnek van szövege mindhárom korosztálynak', () => {
  for (const ex of X.EXPS) for (const key of ['intro', 'why', 'hint']) for (const a of ['k', 'm', 'n']) assert.ok(ex[key][a] && ex[key][a].length > 20, `${ex.id}.${key}.${a}`);
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

// ---------- 1. fázis: A–C fejezet ----------
const lay = (id) => X.EXPS.find((e) => e.id === id).layout;

test('A. vezet vagy nem vezet: fólia világít, papír nem, csapvíz a 0,5 mA-es állásban látszik', () => {
  const m = (R, rg) => { const s = new E.Sim(lay('conduct'), { obj: { TP: R }, meter: { M6: rg } }); run(s, 0.02, 0.001); return s; };
  assert.ok(m(0.1, '50mA').cur.D1 > 0.008);
  assert.ok(Math.abs(m(1e12, '50mA').cur.D1) < 1e-6);
  const f = m(20000, '0.5mA').meterReading('M6').frac; assert.ok(f > 0.05 && f < 1, `csapvíz kitérés ${f}`);
  assert.ok(m(20000, '50mA').meterReading('M6').frac < 0.01);
});

test('A. soros izzók halványabbak, mint párhuzamosan', () => {
  const ser = new E.Sim(L.series); ser.switches.S1 = true; run(ser, 0.01, 0.001);
  const par = new E.Sim(L.parallel); par.switches.S1 = true; run(par, 0.01, 0.001);
  assert.ok(par.cur.L1 > 1.8 * ser.cur.L1, `soros ${ser.cur.L1}, párhuzamos ${par.cur.L1}`);
});

test('A. fényerő-szabályzó: a gombbal a LED árama monoton csökken', () => {
  let prev = Infinity;
  for (const p of [0, 0.05, 0.2, 0.5, 1]) {
    const s = new E.Sim(lay('dimmer'), { pot: { RV: p } }); s.switches.S1 = true; run(s, 0.01, 0.001);
    assert.ok(s.cur.D1 < prev, `p=${p}`); prev = s.cur.D1;
    if (p === 0) assert.ok(s.cur.D1 > 0.008);
  }
  assert.ok(prev < 1e-4);
});

test('B. motor mint áramfejlesztő: kézzel kb. 1 V, visszafelé negatív', () => {
  const s = new E.Sim(lay('generator'), { meter: { M6: '5V' } }); s.motor.M1.hand = 1; run(s, 0.05, 0.001);
  const v = s.meterReading('M6').value; assert.ok(v > 0.6 && v < 1.6, `U=${v}`);
  s.motor.M1.hand = -1; run(s, 0.05, 0.001); assert.ok(s.meterReading('M6').value < -0.6);
  s.motor.M1.hand = 0; run(s, 3, 0.002); assert.ok(Math.abs(s.meterReading('M6').value) < 0.05);
});

test('B. kondenzátor mint akkumulátor: elengedés után még ég, egy kondival rövidebben', () => {
  const t = (layout) => {
    const s = new E.Sim(layout, { meter: { M6: '5V' } }); s.switches.S2 = true; run(s, 0.5, 0.001); s.switches.S2 = false;
    let time = 0; while (s.cur.D1 > 1e-4 && time < 10) { run(s, 0.05, 0.002); time += 0.05; }
    return time;
  };
  const two = t(lay('capbat')), one = t(lay('capbat').filter((p) => p.id !== 'C5b'));
  assert.ok(two > 1 && two < 4, `két kondi: ${two} s`);
  assert.ok(one < two * 0.7, `egy kondi: ${one} s`);
});

test('B. motor sebességszabályzó: a gombbal szabályozható, β = 80…300 mellett is', () => {
  for (const bf of [80, 150, 300]) withBeta(bf, () => {
    const rpm = (p) => { const s = new E.Sim(lay('motorspeed'), { pot: { RV: p } }); s.switches.S1 = true; run(s, 1.5, 0.001); return s.motor.M1.w * 60 / 2 / Math.PI; };
    const fast = rpm(0), mid = rpm(0.3), off = rpm(0.9);
    assert.ok(fast > 1000, `β=${bf}: ${fast}`); assert.ok(mid > 50 && mid < fast, `β=${bf}: közép ${mid}`); assert.ok(off < 10, `β=${bf}: ${off}`);
  });
});

test('C. érintőkapcsoló és vízjelző: érintésre / vízre kigyullad, β = 80…300 mellett is', () => {
  for (const bf of [80, 150, 300]) withBeta(bf, () => {
    for (const [id, R] of [['touch', 1e6], ['water', 5e4]]) {
      const on = new E.Sim(lay(id), { obj: { TP: R } }); on.switches.S1 = true; run(on, 0.02, 0.001);
      const off = new E.Sim(lay(id), { obj: { TP: 1e12 } }); off.switches.S1 = true; run(off, 0.02, 0.001);
      assert.ok(on.cur.D1 > 0.008, `${id} β=${bf}: ${on.cur.D1}`); assert.ok(off.cur.D1 < 1e-5, `${id} β=${bf} ki: ${off.cur.D1}`);
    }
  });
});

test('a fototranzisztoros áramkör hirtelen fényváltozásnál is gyorsan konvergál', () => {
  const s = new E.Sim(L.night, { light: 0.5 }); s.switches.S1 = true;
  let seed = 1; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  let fails = 0;
  for (let f = 0; f < 200; f++) { s.light = f % 20 < 10 ? rnd() : (f % 2 ? 0 : 1); for (let i = 0; i < 8; i++) if (!s.step(0.002)) fails++; }
  assert.equal(fails, 0);
});

// ---------- 2. fázis: D és E fejezet ----------
const freqOf = (layout, opts, prep, secs) => {
  const s = new E.Sim(layout, opts); s.switches.S1 = true; if (prep) prep(s);
  const dt = 1 / 48000; let on = false; const edges = [];
  for (let i = 0, n = Math.round((secs || 0.03) / dt); i < n; i++) { s.step(dt); const now = Math.abs(s.cur.SP || 0) > 0.01; if (now && !on) edges.push(s.time); on = now; }
  return edges.length > 3 ? (edges.length - 2) / (edges[edges.length - 1] - edges[1]) : 0;
};

test('D. emlékező lámpa: a gomb elengedése után is megtartja az állapotot, β = 80…300', () => {
  for (const bf of [80, 150, 300]) withBeta(bf, () => {
    const s = new E.Sim(lay('flipflop')); s.switches.S1 = true; run(s, 0.05, 0.001);
    s.switches.S2b = true; run(s, 0.1, 0.001); s.switches.S2b = false; run(s, 0.3, 0.001);
    assert.ok(s.cur.D1 > 0.005 && s.cur.D2 < 0.0005, `β=${bf} S2b után: ${s.cur.D1} ${s.cur.D2}`);
    s.switches.S2a = true; run(s, 0.1, 0.001); s.switches.S2a = false; run(s, 0.3, 0.001);
    assert.ok(s.cur.D2 > 0.005 && s.cur.D1 < 0.0005, `β=${bf} S2a után: ${s.cur.D1} ${s.cur.D2}`);
  });
});

test('D. logikai kapuk igazságtáblája (ÉS, VAGY, NEM), β = 80…300', () => {
  const led = (id, sw) => { const s = new E.Sim(lay(id)); s.switches.S1 = true; Object.assign(s.switches, sw); run(s, 0.02, 0.001); return s.cur.D1 > 0.005; };
  for (const bf of [80, 300]) withBeta(bf, () => {
    for (const [a, b] of [[0, 0], [0, 1], [1, 0], [1, 1]]) {
      assert.equal(led('and', { S2a: !!a, S2b: !!b }), !!(a && b), `ÉS ${a}${b} β=${bf}`);
      assert.equal(led('or', { S2a: !!a, S2b: !!b }), !!(a || b), `VAGY ${a}${b} β=${bf}`);
    }
    assert.equal(led('not', { S2: false }), true); assert.equal(led('not', { S2: true }), false);
  });
});

test('E. metronóm: kb. 0,6 s-onként ismétlődő tik-tak; C5-tel lassabb', () => {
  const T = period(lay('metronome'), 'SP', 4, 0.0005, 0.004);
  assert.ok(T > 0.45 && T < 0.8, `T=${T}`);
  const T2 = period(lay('metronome').map((p) => (p.id === 'C4a' ? { ...p, p: 'C5' } : p)), 'SP', 8, 0.001, 0.004);
  assert.ok(T2 > 1.8 * T, `C5-tel T=${T2}`);
});

test('E. hangszer: billentyű nélkül néma, a gombbal hangolható', () => {
  const o = lay('organ');
  assert.equal(freqOf(o, { pot: { RV: 0.3 } }), 0);
  const fs = [0, 0.2, 0.6, 1].map((p) => freqOf(o, { pot: { RV: p } }, (s) => { s.switches.S2 = true; }));
  for (let i = 1; i < fs.length; i++) assert.ok(fs[i] < fs[i - 1], `nem csökken: ${fs}`);
  assert.ok(fs[0] > 2000 && fs[3] < 400, `tartomány: ${fs}`);
});

test('E. sziréna: a hang a vezérlőfeszültséggel emelkedik, 0,7 V alatt néma', () => {
  const big = lay('siren').map((p) => ((p.id || p.p) === 'C5' ? { ...p, p: 'CBIG', id: 'C5' } : p));
  const f = (v) => freqOf(big, { capInit: { C5: v } });
  assert.equal(f(0.6), 0);
  const fs = [0.8, 1.5, 3].map(f);
  assert.ok(fs[0] > 300 && fs[1] > fs[0] && fs[2] > fs[1], `f: ${fs}`);
});

test('C. árnyékriasztó: fényben néma, sötétben szól', () => {
  assert.equal(freqOf(lay('shadow'), { light: 0.6 }), 0);
  const dark = freqOf(lay('shadow'), { light: 0 });
  assert.ok(dark > 400 && dark < 1500, `sötétben ${dark} Hz`);
});

test('F. hangra villogó LED: csendben sötét, erős hangra (fújásra) kigyullad, β = 80…300', () => {
  for (const bf of [80, 300]) withBeta(bf, () => {
    const led = (p) => { const s = new E.Sim(lay('clap')); s.switches.S1 = true; s.mic.X1 = p; run(s, 0.02, 0.001); return s.cur.D1; };
    assert.ok(led(0) < 1e-5, `β=${bf} csend`); assert.ok(led(1) > 0.008, `β=${bf} fújás`);
  });
});

test('F. fénytávíró: üvegszállal a vevő szól, elzárt fénynél csend és nincs áram, β = 80…300', () => {
  for (const bf of [80, 300]) withBeta(bf, () => {
    const s = new E.Sim(lay('lightlink'), { light: 0.6 }); s.switches.S1 = true; s.switches.S1b = true;
    assert.equal(s.links.length, 1);
    const f = freqOf(lay('lightlink'), { light: 0.6 }, (x) => { x.switches.S1b = true; });
    assert.ok(f > 1500 && f < 3500, `β=${bf}: ${f} Hz`);
    const off = (x) => { x.switches.S1b = true; x.fiberOn = false; };
    assert.equal(freqOf(lay('lightlink'), { light: 0.6 }, off), 0);
    const q = new E.Sim(lay('lightlink'), { light: 0.9 }); off(q); q.switches.S1 = true; run(q, 0.005, 1 / 48000);
    assert.ok(Math.abs(q.cur.SP) < 0.002, `nyugalmi áram ${q.cur.SP}`);
  });
});

test('a rezgőkörök 44,1 és 48 kHz-es lépésközzel is maguktól elindulnak', () => {
  for (const sr of [44100, 48000]) for (const id of ['sound', 'lightlink', 'organ']) {
    const s = new E.Sim(lay(id), { light: 0.85, pot: { RV: 0.3 } });
    for (const k in s.switches) s.switches[k] = true;
    const dt = 1 / sr; let on = false, edges = 0;
    for (let i = 0, n = Math.round(0.03 / dt); i < n; i++) { s.step(dt); const now = Math.abs(s.cur.SP) > 0.01; if (now && !on) edges++; on = now; }
    assert.ok(edges > 5, `${id} @ ${sr} Hz: ${edges} él`);
  }
});

// ---------- 3. fázis: G fejezet (IC-modulok) ----------
test('G. U23: villog, a CTL-ellenállás szabja az ütemet (100 kΩ lassú, 5,1 kΩ gyors)', () => {
  const rate = (layout) => { const s = new E.Sim(layout); s.switches.S1 = true; let on = false; const ed = []; for (let i = 0; i < 3000; i++) { s.step(0.001); const now = s.cur.D1 > 0.005; if (now && !on) ed.push(s.time); on = now; } return (ed.length - 1) / (ed[ed.length - 1] - ed[0]); };
  const slow = rate(lay('u23')), fast = rate(lay('u23').map((p) => (p.p === 'R5' ? { ...p, p: 'R3' } : p)));
  assert.ok(slow > 2 && slow < 10, `lassú: ${slow}`); assert.ok(fast > 25, `gyors: ${fast}`);
  const off = new E.Sim(lay('u23')); run(off, 0.5, 0.001); assert.ok(Math.abs(off.cur.D1) < 1e-6, 'kikapcsolva nem villoghat');
});

test('G. U2: az IN2 a (+)-on söprő riasztóhangot ad, más bemenetekkel más hangot', () => {
  const st = (extra) => { const s = new E.Sim(lay('u2').concat(extra || [])); s.switches.S1 = true; const fs = []; for (let i = 0; i < 700; i++) { s.step(0.002); fs.push(s.ic.U2.f); } return { s, fs }; };
  const a = st(); assert.equal(a.s.ic.U2.mode, 2); assert.ok(Math.max(...a.fs) - Math.min(...a.fs.filter((f) => f > 0)) > 500, 'söprés');
  assert.ok(Math.abs(a.s.cur.SP) > 0.01, 'a hangszórón áram folyik');
  const b = st([{ p: 'W3', at: 'A3', dir: 'd', id: 'Lin1' }]); assert.equal(b.s.ic.U2.mode, 3);
});

test('G. U1: bekapcsoláskor kb. 20 s-ig zenél, a TRG (S2) újraindítja, a HLD-vel nem áll le', () => {
  const s = new E.Sim(lay('u1')); s.switches.S1 = true; run(s, 1, 0.002);
  assert.ok(s.ic.U1.active && s.ic.U1.f > 0);
  run(s, 20, 0.004); assert.ok(!s.ic.U1.active, '20 s után leáll');
  s.switches.S2 = true; run(s, 0.1, 0.002); s.switches.S2 = false; run(s, 0.5, 0.002); assert.ok(s.ic.U1.active, 'TRG újraindít');
  const h = new E.Sim(lay('u1').concat([{ p: 'W3', at: 'A5', dir: 'd', id: 'Lhld' }])); h.switches.S1 = true; run(h, 25, 0.004); assert.ok(h.ic.U1.active, 'HLD-vel folyamatos');
});

test('késleltetett lámpa: a LED az elemből kap áramot, S1 nélkül a kisülő C5 sem gyújtja meg', () => {
  for (const s1 of [true, false]) {
    const s = new E.Sim(L.delay); s.switches.S1 = true; s.switches.S2 = true;
    run(s, 1, 0.002);
    s.switches.S2 = false; s.switches.S1 = s1;
    run(s, 2, 0.002);
    assert.ok(s.capV.C5 > 1.2, 'a C5 még nincs kisülve');
    if (s1) assert.ok(s.cur.D1 > 0.008, 'S1 bekapcsolva ég'); else assert.ok(Math.abs(s.cur.D1) < 1e-6, 'S1 kikapcsolva nem ég');
  }
});

test('puki: minden felvétel megvan, és a forrásuk fel van tüntetve', () => {
  const fs = require('node:fs'); const path = require('node:path');
  const dir = path.join(__dirname, '..', 'hangok', 'puki');
  const files = fs.readdirSync(dir).filter((f) => /^\d\d\.mp3$/.test(f)).sort();
  const app = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
  const n = +/const PUKI_N = (\d+);/.exec(app)[1];
  assert.equal(files.length, n);
  files.forEach((f, i) => assert.equal(f, String(i + 1).padStart(2, '0') + '.mp3'));
  const src = fs.readFileSync(path.join(dir, 'FORRASOK.md'), 'utf8');
  for (const f of files) { assert.ok(src.includes('| ' + f + ' |'), f + ' forrása'); assert.ok(fs.statSync(path.join(dir, f)).size > 2000); }
});

// ---- 4. fázis: mikrofon-erősítő és a többi IC ----
function micSwing(lay, amp) {
  const s = new E.Sim(lay); s.switches.S1 = true; s.mic.X1 = 0.05; run(s, 2, 0.002);
  const i0 = s.cur.SP; let mx = -1, mn = 1; const dt = 1 / 48000;
  for (let i = 0; i < 4800; i++) { s.mic.X1 = 0.05 + amp * Math.sin(2 * Math.PI * 300 * i * dt); s.step(dt); if (i > 1000) { mx = Math.max(mx, s.cur.SP); mn = Math.min(mn, s.cur.SP); } }
  return { i0, pp: mx - mn };
}
test('hangosbemondó: a munkapont β-tól függetlenül kb. 14 mA, és a mikrofon jele felerősítve a hangszóróban', () => {
  for (const bf of [80, 150, 300]) withBeta(bf, () => {
    const { i0, pp } = micSwing(L.amp, 0.01);
    assert.ok(i0 > 0.011 && i0 < 0.018, `β=${bf}: nyugalmi áram ${i0}`);
    assert.ok(pp > 0.008, `β=${bf}: jel ${pp}`);
  });
});
test('U4 erősítő: ugyanarra a mikrofonjelre sokkal nagyobb kitérés, mint a hangosbemondóé', () => {
  const a = micSwing(L.amp, 0.01).pp, b = micSwing(L.ic_u4, 0.01).pp;
  assert.ok(b > 5 * a, `U4 ${b}, hangosbemondó ${a}`);
});
test('U3 űrháború: az S2 minden nyomása a következő hangra léptet, nyolc után körbeér', () => {
  const s = new E.Sim(L.ic_u3); s.switches.S1 = true; run(s, 0.1, 0.002);
  const modes = [s.ic.U3.mode];
  for (let k = 0; k < 8; k++) { s.switches.S2 = true; run(s, 0.05, 0.002); s.switches.S2 = false; run(s, 0.1, 0.002); modes.push(s.ic.U3.mode); }
  assert.deepEqual(modes, [0, 1, 2, 3, 4, 5, 6, 7, 0]);
  assert.ok(Math.abs(s.cur.SP) > 0.05, 'szól a hangszóró');
});
test('U22 fényorgona: minden fújásra másik szín, folyamatos fújásra csak egyet lép', () => {
  const s = new E.Sim(L.ic_u22); s.switches.S1 = true; run(s, 0.2, 0.002);
  const seen = [];
  for (let k = 0; k < 3; k++) { s.mic.X1 = 1; run(s, 0.15, 0.002); s.mic.X1 = 0; run(s, 0.15, 0.002); seen.push(s.ic.U22.rgb.join('')); }
  assert.equal(new Set(seen).size, 3, seen.join(' '));
  const c = s.ic.U22.count; s.mic.X1 = 1; run(s, 1, 0.002); assert.equal(s.ic.U22.count, (c + 1) % 7);
});
test('U24 infravevő: a LED csak a távirányító jelére ég', () => {
  const s = new E.Sim(L.ic_u24); s.switches.S1 = true; run(s, 0.1, 0.002);
  assert.ok(Math.abs(s.cur.D1) < 1e-5);
  s.ic.U24.remote = true; let sum = 0; for (let i = 0; i < 250; i++) { s.step(0.002); sum += s.cur.D1; }
  assert.ok(sum / 250 > 0.003, 'átlag ' + sum / 250);
});
test('D8 és U32: a színes LED és a dallam IC áramot vesz fel; a dallam IC árama hangonként változik', () => {
  let s = new E.Sim(L.ic_d8); s.switches.S1 = true; run(s, 0.05, 0.002);
  assert.ok(s.cur.D8 > 0.004 && s.cur.D8 < 0.02, 'D8 ' + s.cur.D8);
  s = new E.Sim(L.ic_u32, { meter: { M6: '50mA' } }); s.switches.S1 = true; let mx = 0, mn = 1;
  for (let i = 0; i < 1500; i++) { s.step(0.002); const v = s.meterReading('M6').value; mx = Math.max(mx, v); mn = Math.min(mn, v); }
  assert.ok(mx > 0.008 && mn < 0.003, `U32 mérő ${mn}–${mx}`);
});
test('U5 rádió: csak a Kossuth 540 kHz-es frekvenciájára hangolva szól, a hangerőt az RV állítja', () => {
  const tuneFor = (f) => { const C = 1 / ((2 * Math.PI * f) ** 2 * E.PARTS.A1.L) - 15e-12; return (C - E.PARTS.CV.Cmin) / (E.PARTS.CV.Cmax - E.PARTS.CV.Cmin); };
  const swing = (tune, pot) => {
    const s = new E.Sim(L.ic_u5, { tune: { CV: tune }, pot: { RV: pot } }); s.switches.S1 = s.switches.S1b = true; run(s, 4, 0.002);
    let mx = -1, mn = 1; for (let i = 0; i < 600; i++) { s.step(0.002); mx = Math.max(mx, s.cur.SP); mn = Math.min(mn, s.cur.SP); }
    return { pp: mx - mn, st: s.ic.U5 };
  };
  const on = swing(tuneFor(540e3), 0.2), off = swing(tuneFor(800e3), 0.2), quiet = swing(tuneFor(540e3), 0.95);
  assert.ok(Math.abs(on.st.f0 - 540e3) < 3e3, 'f0 ' + on.st.f0);
  assert.ok(on.st.match > 0.9 && off.st.match < 0.02);
  assert.ok(on.pp > 0.01, 'szól: ' + on.pp);
  assert.ok(off.pp < on.pp / 20, 'elhangolva csend: ' + off.pp);
  assert.ok(quiet.pp < on.pp / 3, 'lehalkítva: ' + quiet.pp);
});
