// SPDX-License-Identifier: GPL-3.0-or-later
// Fekete doboz nélkül – Copyright (C) 2026 Nimmerfroh Károly
// Boffin-szerű rács, építési ellenőrzés és áramkör-szimulátor (MNA + Newton).
// Böngészőben és Node-ban is fut.
(function (root) {
  'use strict';
  const ROWS = 'ABCDEFG';
  const DIRS = { r: [0, 1], l: [0, -1], d: [1, 0], u: [-1, 0] };

  // ---- Alkatrész-könyvtár -------------------------------------------------
  // kind: wire | bat | res | sw | led | cap | npn | pnp | photo | lamp | spk
  // len: a két szélső snap távolsága (rácsegységben); wire esetén a snapek száma.
  const PARTS = {
    W1: { kind: 'wire', n: 1, name: '1-es vezeték', short: '1' },
    W2: { kind: 'wire', n: 2, name: '2-es vezeték', short: '2' },
    W3: { kind: 'wire', n: 3, name: '3-as vezeték', short: '3' },
    W4: { kind: 'wire', n: 4, name: '4-es vezeték', short: '4' },
    W5: { kind: 'wire', n: 5, name: '5-ös vezeték', short: '5' },
    W6: { kind: 'wire', n: 6, name: '6-os vezeték', short: '6' },
    W7: { kind: 'wire', n: 7, name: '7-es vezeték', short: '7' },
    B1: { kind: 'bat', V: 3.0, Rint: 0.4, name: 'Elemtartó (2×AA)', short: 'B1' },
    S1: { kind: 'sw', mode: 'slide', name: 'Tolókapcsoló', short: 'S1' },
    S2: { kind: 'sw', mode: 'press', name: 'Nyomógomb', short: 'S2' },
    R1: { kind: 'res', R: 100, name: '100 Ω ellenállás', short: 'R1' },
    R2: { kind: 'res', R: 1000, name: '1 kΩ ellenállás', short: 'R2' },
    R3: { kind: 'res', R: 5100, name: '5,1 kΩ ellenállás', short: 'R3' },
    R4: { kind: 'res', R: 10000, name: '10 kΩ ellenállás', short: 'R4' },
    R5: { kind: 'res', R: 100000, name: '100 kΩ ellenállás', short: 'R5' },
    D1: { kind: 'led', color: 'red', Is: 7.6e-18, n: 2, Rs: 5, name: 'Piros LED', short: 'D1' },
    D2: { kind: 'led', color: 'green', Is: 2.3e-20, n: 2, Rs: 5, name: 'Zöld LED', short: 'D2' },
    C1: { kind: 'cap', C: 0.02e-6, name: '0,02 µF kondenzátor', short: 'C1' },
    C2: { kind: 'cap', C: 0.1e-6, name: '0,1 µF kondenzátor', short: 'C2' },
    C3: { kind: 'cap', C: 10e-6, name: '10 µF kondenzátor', short: 'C3' },
    C4: { kind: 'cap', C: 100e-6, name: '100 µF kondenzátor', short: 'C4' },
    C5: { kind: 'cap', C: 470e-6, name: '470 µF kondenzátor', short: 'C5' },
    Q1: { kind: 'pnp', name: 'PNP tranzisztor', short: 'Q1' },
    Q2: { kind: 'npn', name: 'NPN tranzisztor', short: 'Q2' },
    Q4: { kind: 'photo', name: 'Fototranzisztor', short: 'Q4' },
    L1: { kind: 'lamp', R: 16, Inom: 0.2, name: 'Izzó (2,5 V)', short: 'L1' },
    L2: { kind: 'lamp', R: 20, Inom: 0.3, name: 'Izzó (6 V)', short: 'L2' },
    RV: { kind: 'pot', R: 50000, name: 'Állítható ellenállás (50 kΩ)', short: 'RV' },
    M6: { kind: 'meter', name: 'Mérőműszer', short: 'M6' },
    M1: { kind: 'motor', name: 'Motor', short: 'M1' },
    M4: { kind: 'motor', name: 'Átlátszó motor', short: 'M4' },
    X1: { kind: 'mic', name: 'Mikrofon', short: 'X1' },
    TP: { kind: 'obj', virtual: true, name: 'Vizsgált tárgy', short: '?' },
    CBIG: { kind: 'cap', C: 10, virtual: true, name: 'segéd-kondenzátor', short: 'C' },
    SP: { kind: 'spk', R: 8, name: 'Hangszóró', short: 'SP' },
    J1: { kind: 'jumper', name: 'Átkötő kábel (fekete)', short: 'J', color: 'black' },
    J2: { kind: 'jumper', name: 'Átkötő kábel (piros)', short: 'J', color: 'red' },
    J4: { kind: 'jumper', name: 'Átkötő kábel (kék)', short: 'J', color: 'blue' },
    // IC-modulok (viselkedési modell): lábak a modul felső sorában balról jobbra, és az alsó sor két szélén
    U1: { kind: 'ic', ic: 'music', pins: ['TRG', 'P', 'HLD', 'N', 'OUT'], name: 'Zene IC', short: 'U1' },
    U2: { kind: 'ic', ic: 'alarm', pins: ['IN1', 'IN2', 'IN3', 'N', 'OUT'], name: 'Riasztó IC', short: 'U2' },
    U23: { kind: 'ic', ic: 'strobe', pins: ['CTL', 'P', 'NC', 'N', 'OUT'], name: 'Stroboszkóp IC', short: 'U23' },
    // pos: a lábak helye a modul bal felső sarkához képest [sor, oszlop]; body: a snap nélküli, takart pontok
    U3: { kind: 'ic', ic: 'war', pins: ['P', 'OUT', 'IN1', 'N', 'IN2'], pos: [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2]], body: [[0, 1]], name: 'Űrháború IC', short: 'U3' },
    U4: { kind: 'ic', ic: 'amp', pins: ['N', 'INP', 'FIL', 'OUT', 'P'], name: 'Erősítő IC', short: 'U4' },
    U22: { kind: 'ic', ic: 'organ', pins: ['R', 'G', 'B', 'P', 'N', 'FB', 'INP'], pos: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 0], [2, 1], [2, 2]], body: [[1, 0], [1, 1]], name: 'Fényorgona', short: 'U22' },
    U24: { kind: 'ic', ic: 'ir', pins: ['P', 'OUT', 'N'], pos: [[0, 0], [1, 1], [2, 0]], body: [[1, 0]], name: 'Infravevő', short: 'U24' },
    U32: { kind: 'ic', ic: 'melody', pins: ['P', 'N'], pos: [[0, 0], [0, 2]], body: [[0, 1]], name: 'Dallam IC', short: 'U32' },
    U5: { kind: 'ic', ic: 'radio', pins: ['N', 'INP', 'INP2', 'OUT'], pos: [[0, 0], [0, 1], [0, 2], [1, 0]], body: [[1, 1]], name: 'Rádió IC', short: 'U5' },
    // antennatekercs (vasmagos tekercs, kb. 380 µH) és forgókondenzátor (kb. 40–220 pF): ezek adják a rádió hangolt körét.
    // Hangfrekvencián a tekercs vezetékként, a forgókondenzátor szakadásként viselkedik.
    A1: { kind: 'coil', R: 5, L: 380e-6, name: 'Antennatekercs', short: 'A1' },
    CV: { kind: 'varcap', Cmin: 40e-12, Cmax: 220e-12, name: 'Forgókondenzátor', short: 'CV' },
    // színes LED: piros, zöld és kék LED egy tokban, egy kis vezérlőáramkörrel, beépített áramkorlátozó ellenállással
    D8: { kind: 'led', color: 'rgb', Is: 2.3e-20, n: 2, Rs: 100, name: 'Színes LED', short: 'D8' },
    FC: { kind: 'fiber', name: 'Üvegszálas kábel (két tartóval)', short: 'FC' },
  };

  // A mérőműszer (M6) méréshatárai: belső ellenállás és végkitérés (áram).
  const METER = {
    '5V': { R: 10000, fs: 0.5e-3, label: '5 V' },
    '0.5mA': { R: 200, fs: 0.5e-3, label: '0,5 mA' },
    '50mA': { R: 2, fs: 50e-3, label: '50 mA' },
  };
  // Motor: belső ellenállás, EMF-állandó, súrlódás, tehetetlenség (kb. 3000/perc 3 V-on, üresjárásban ~60 mA).
  const MOTOR = { Rm: 5, Ke: 0.0085, b: 1.6e-6, Tc: 0.0085 * 0.025, J: 3e-6, wHand: 120 };

  // Melyik dobozban hány darab van (a hivatalos alkatrészlisták alapján).
  const KITS = {
    '300': { name: 'Boffin I 300', parts: { J1: 1, J2: 1, W1: 6, W2: 9, W3: 4, W4: 2, W5: 1, W6: 1, W7: 1, B1: 2, S1: 1, S2: 1, R1: 1, R2: 1, R3: 1, R4: 1, R5: 1, RV: 1, D1: 1, D2: 1, C1: 1, C2: 1, C3: 1, C4: 1, C5: 1, Q1: 1, Q2: 1, Q4: 1, L1: 1, L2: 1, SP: 1, M1: 1, X1: 1, U1: 1, U2: 1, U3: 1, U4: 1, U5: 1, A1: 1, CV: 1 } },
    light: { name: 'Boffin II Light', parts: { J1: 1, J2: 1, W1: 3, W2: 6, W3: 3, W4: 1, W5: 1, W6: 1, B1: 2, S1: 1, S2: 1, R1: 1, R3: 1, R5: 1, RV: 1, D1: 1, C2: 1, C4: 1, Q1: 1, Q2: 1, Q4: 1, SP: 1, M1: 1, X1: 1, FC: 1, U23: 1, U22: 1, U24: 1, D8: 1 } },
    home: { name: 'Boffin II My Home', parts: { J1: 1, J2: 1, J4: 2, W1: 3, W2: 6, W3: 3, W4: 1, W5: 1, W6: 1, S1: 1, S2: 1, R3: 1, C5: 1, Q2: 1, Q4: 1, M4: 1, M6: 1, U32: 1, D8: 1 } },
  };

  function postKey(r, c) { return r + ',' + c; }
  // Több rács: a második rács sorai 10-zel eltolva ("2:A3" -> 10. sor). Így az ellenőrzés és a
  // kapcsolásszámítás változatlan, csak a rajz és az elnevezés tud a rácsokról.
  const BOARD_ROWS = 10;
  function postName(r, c) { const b = Math.floor(r / BOARD_ROWS); return (b ? (b + 1) + ':' : '') + ROWS[r % BOARD_ROWS] + c; }
  function parsePost(s) {
    let b = 0; const m = /^(\d+):(.*)$/.exec(s); if (m) { b = parseInt(m[1], 10) - 1; s = m[2]; }
    return [ROWS.indexOf(s[0]) + b * BOARD_ROWS, parseInt(s.slice(1), 10)];
  }

  // Egy elhelyezés geometriája: snapek (terminálok) és a test által takart pontok.
  function geometry(pl) {
    const def = PARTS[pl.p];
    const [r0, c0] = parsePost(pl.at);
    const [dr, dc] = DIRS[pl.dir || 'r'];
    const snaps = []; // {r,c,term}
    const body = [];  // takart, snap nélküli pontok
    if (def.kind === 'jumper' || def.kind === 'fiber') {
      const [r1, c1] = parsePost(pl.to);
      snaps.push({ r: r0, c: c0, term: 'a' }); snaps.push({ r: r1, c: c1, term: 'b' });
      return { snaps, body, jumper: def.kind === 'jumper', fiber: def.kind === 'fiber' };
    }
    if (def.kind === 'wire') {
      for (let i = 0; i < def.n; i++) snaps.push({ r: r0 + dr * i, c: c0 + dc * i, term: 'w' + i });
    } else if (def.kind === 'ic') {
      // 3 × 2-es modul: felső sor 3 lába, alsó sor két szélső lába; a középső alsó pont a test
      // a modul elforgatható: 'r' = alaphelyzet, 'd' = 90°-kal jobbra, 'l' = 180°, 'u' = 90°-kal balra
      const pos0 = def.pos || [[0, 0], [0, 1], [0, 2], [1, 0], [1, 2]], body0 = def.body || [[1, 1]];
      const all = pos0.concat(body0); const mr = Math.max(...all.map((q) => q[0])), mc = Math.max(...all.map((q) => q[1]));
      const rot = ([r, c]) => (pl.dir === 'd' ? [c, mr - r] : pl.dir === 'l' ? [mr - r, mc - c] : pl.dir === 'u' ? [mc - c, r] : [r, c]);
      def.pins.forEach((t, i) => { const [r, c] = rot(pos0[i]); snaps.push({ r: r0 + r, c: c0 + c, term: t }); });
      for (const q of body0) { const [r, c] = rot(q); body.push({ r: r0 + r, c: c0 + c }); }
    } else if (def.kind === 'pot') {
      // két vége 2 egységre, a csúszka középen, a haladási irányhoz képest balra (lefelé haladva jobbra)
      const pr = -dc, pc = dr;
      snaps.push({ r: r0, c: c0, term: 'a' });
      snaps.push({ r: r0 + 2 * dr, c: c0 + 2 * dc, term: 'b' });
      snaps.push({ r: r0 + dr + pr, c: c0 + dc + pc, term: 'w' });
      body.push({ r: r0 + dr, c: c0 + dc });
    } else if (def.kind === 'npn' || def.kind === 'pnp') {
      // a két szélső snap (NPN: kollektor, emitter; PNP: emitter, kollektor) 2 egységre,
      // a bázis középen, a haladási irányhoz képest jobbra fordítva (pl. lefelé -> balra).
      const pr = dc, pc = -dr;
      const t1 = def.kind === 'npn' ? 'C' : 'E', t2 = def.kind === 'npn' ? 'E' : 'C';
      snaps.push({ r: r0, c: c0, term: t1 });
      snaps.push({ r: r0 + 2 * dr, c: c0 + 2 * dc, term: t2 });
      snaps.push({ r: r0 + dr + pr, c: c0 + dc + pc, term: 'B' });
      body.push({ r: r0 + dr, c: c0 + dc });
    } else {
      snaps.push({ r: r0, c: c0, term: 'a' });
      snaps.push({ r: r0 + 2 * dr, c: c0 + 2 * dc, term: 'b' });
      body.push({ r: r0 + dr, c: c0 + dc });
      if (def.kind === 'bat') {
        // az elemtartó doboza a haladási irány bal oldalára (lefelé haladva jobbra) kilóg
        const pr = -dc, pc = dr;
        for (let i = 0; i <= 2; i++) body.push({ r: r0 + dr * i + pr, c: c0 + dc * i + pc, side: true });
      }
    }
    return { snaps, body };
  }

  // Építési ellenőrzés: szintek, alátámasztás, ütközések. Visszaad: {levels, errors, posts}
  function checkBuild(layout) {
    const height = new Map();   // post -> hány snap van egymáson
    const covered = new Map();  // post -> [{idx, level}] test által takart
    const errors = [];
    const levels = [];
    const contacts = []; // pl idx -> lista {r,c,term,connected}
    layout.forEach((pl, idx) => {
      const g = geometry(pl);
      const id = pl.id || pl.p;
      if (g.fiber) { levels.push(0); contacts.push(g.snaps.map((s2) => ({ ...s2, connected: false }))); return; }
      if (g.jumper) {
        const cs = g.snaps.map((s) => {
          const h = height.get(postKey(s.r, s.c)) || 0;
          if (!h) errors.push(`${id}: a(z) ${postName(s.r, s.c)} ponton nincs mire csíptetni`);
          return { ...s, connected: h > 0, top: h };
        });
        levels.push(0); contacts.push(cs); return;
      }
      for (const s of g.snaps.concat(g.body)) {
        if (s.r < 0 || s.r % BOARD_ROWS > 6 || s.r >= 2 * BOARD_ROWS || s.c < 1 || s.c > 10) errors.push(`${id}: lelóg a rácsról (${s.r},${s.c})`);
      }
      let top = 0;
      for (const s of g.snaps) top = Math.max(top, height.get(postKey(s.r, s.c)) || 0);
      const level = top + 1;
      levels.push(level);
      const cs = [];
      let supported = 0;
      for (const s of g.snaps) {
        const h = height.get(postKey(s.r, s.c)) || 0;
        const cov = covered.get(postKey(s.r, s.c));
        if (cov && cov.length) errors.push(`${id}: a(z) ${postName(s.r, s.c)} pontot egy másik alkatrész teste takarja`);
        if (h === top) { supported++; cs.push({ ...s, connected: true }); }
        else if (h === 0) { cs.push({ ...s, connected: false }); }
        else errors.push(`${id}: a(z) ${postName(s.r, s.c)} ponton ${h} magas a torony, de az alkatrész ${level}. szinten van`);
      }
      const needAll = PARTS[pl.p].kind !== 'wire';
      if (needAll && supported !== g.snaps.length) errors.push(`${id}: nem minden lába támaszkodik (${level}. szint)`);
      if (!needAll && (cs[0].connected === false || cs[cs.length - 1].connected === false)) errors.push(`${id}: a vezeték vége lóg`);
      for (const b of g.body) {
        const k = postKey(b.r, b.c);
        const h = height.get(k) || 0;
        if (h >= level - 1 && h > 0) errors.push(`${id}: a teste ütközik a(z) ${postName(b.r, b.c)} ponton lévő snappel`);
        const cov = covered.get(k) || [];
        for (const o of cov) if (o.level === level) errors.push(`${id}: a teste ütközik ${o.id} testével (${postName(b.r, b.c)})`);
        cov.push({ idx, level, id });
        covered.set(k, cov);
      }
      for (const s of cs) if (s.connected) height.set(postKey(s.r, s.c), level);
      contacts.push(cs);
    });
    return { levels, errors, contacts };
  }

  // ---- Kapcsolási rajz (nettók) ---------------------------------------------
  function buildNetlist(layout) {
    const chk = checkBuild(layout);
    const parent = new Map();
    const find = (k) => { while (parent.get(k) !== k) { parent.set(k, parent.get(parent.get(k))); k = parent.get(k); } return k; };
    const add = (k) => { if (!parent.has(k)) parent.set(k, k); };
    const union = (a, b) => { add(a); add(b); const ra = find(a), rb = find(b); if (ra !== rb) parent.set(ra, rb); };
    layout.forEach((pl, i) => {
      const cs = chk.contacts[i].filter((s) => s.connected);
      cs.forEach((s) => add(postKey(s.r, s.c)));
      if (PARTS[pl.p].kind === 'wire' || PARTS[pl.p].kind === 'jumper') for (let j = 1; j < cs.length; j++) union(postKey(cs[0].r, cs[0].c), postKey(cs[j].r, cs[j].c));
    });
    const netOf = new Map(); let nn = 0;
    for (const k of parent.keys()) { const r = find(k); if (!netOf.has(r)) netOf.set(r, nn++); }
    const postNet = (r, c) => netOf.get(find(postKey(r, c)));
    const elements = [];
    layout.forEach((pl, i) => {
      const def = PARTS[pl.p];
      if (def.kind === 'wire' || def.kind === 'jumper' || def.kind === 'fiber') return;
      const t = {};
      for (const s of chk.contacts[i]) t[s.term] = s.connected ? postNet(s.r, s.c) : -1;
      elements.push({ idx: i, id: pl.id || pl.p, p: pl.p, def, t, pl });
    });
    return { chk, nets: nn, postNet, elements };
  }

  // ---- Szimulátor (SPICE-szerű: társított modellek, pn-átmenet korlátozás, lépésfelezés) ----
  const VT = 0.025851;
  const BJT = { Is: 1e-14, bf: 150, br: 2 };
  root.__BJT = BJT;
  function pnjlim(vnew, vold, vt, vcrit) {
    if (vnew > vcrit && Math.abs(vnew - vold) > 2 * vt) {
      if (vold > 0) { const arg = 1 + (vnew - vold) / vt; return arg > 0 ? vold + vt * Math.log(arg) : vcrit; }
      return vt * Math.log(Math.max(vnew / vt, 1e-30));
    }
    return vnew;
  }
  const safeExp = (x) => Math.exp(Math.min(x, 80));

  function Sim(layout, opts) {
    opts = opts || {};
    const nl0 = opts.netlist || buildNetlist(layout);
    const elements = []; let nets = nl0.nets;
    // több rácsnál (külön elemmel) a negatív pólusokat egy közös földre kötjük: áram nem folyik rajta,
    // csak a lebegő áramkör feszültségeit rögzíti (stabilabb számítás)
    const bats = nl0.elements.filter((e) => e.def.kind === 'bat' && e.t.b >= 0);
    // csak akkor, ha a két elem tényleg külön, egymással semmin át össze nem kötött áramkörben van
    // (a sorba kötött elemeket nem szabad így összekötni: az egyiket rövidre zárná)
    const par = new Map(); const fd = (x) => { while (par.has(x) && par.get(x) !== x) x = par.get(x); return x; };
    for (const e of nl0.elements) { const ns = Object.values(e.t).filter((x) => x >= 0); for (const x of ns) if (!par.has(x)) par.set(x, x); for (let i = 1; i < ns.length; i++) { const r1 = fd(ns[0]), r2 = fd(ns[i]); if (r1 !== r2) par.set(r1, r2); } }
    for (let k = 1; k < bats.length; k++) if (fd(bats[k].t.b) !== fd(bats[0].t.b)) elements.push({ idx: -1, id: '#gnd' + k, p: 'RS', def: { kind: 'res', R: 1 }, t: { a: bats[k].t.b, b: bats[0].t.b }, internal: true });
    for (const e of nl0.elements) {
      if (e.def.kind === 'led' && e.t.a >= 0 && e.t.b >= 0) {
        const mid = nets++;
        elements.push({ ...e, t: { a: e.t.a, b: mid } });
        elements.push({ idx: -1, id: e.id + '#rs', p: 'RS', def: { kind: 'res', R: e.def.Rs }, t: { a: mid, b: e.t.b }, internal: true });
      } else elements.push(e);
    }
    this.nl = { ...nl0, nets, elements };
    this.layout = layout;
    // üvegszálas kábel: a LED fénye a kábel másik végén lévő fototranzisztorra jut
    this.links = []; this.fiberOn = true;
    for (const pl of layout || []) {
      if (PARTS[pl.p].kind !== 'fiber') continue;
      const [ra, ca] = parsePost(pl.at), [rb, cb] = parsePost(pl.to);
      const hit = (e, r, c) => { const g = geometry(e.pl); return g.snaps.concat(g.body).some((q) => q.r === r && q.c === c); };
      const led = nl0.elements.find((e) => e.def.kind === 'led' && hit(e, ra, ca));
      const ph = nl0.elements.find((e) => e.def.kind === 'photo' && hit(e, rb, cb));
      if (led && ph) this.links.push({ led: led.id, photo: ph.id, k: pl.k != null ? pl.k : 0.35 });
    }
    const bat = elements.find((e) => e.def.kind === 'bat' && e.t.b >= 0);
    const vs = Math.max(3, elements.filter((e) => e.def.kind === 'bat').reduce((a, e) => a + e.def.V, 0));
    this.vLo = -vs - 1; this.vHi = 2 * vs + 1;
    this.ground = bat ? bat.t.b : 0;
    const map = new Array(nets).fill(-1); let n = 0;
    for (let k = 0; k < nets; k++) if (k !== this.ground) map[k] = n++;
    this.map = map; this.n = n;
    this.v = new Float64Array(n);
    this.vnew = new Float64Array(n);
    this.G = new Float64Array(n * n);
    this.rhs = new Float64Array(n);
    this.time = 0;
    this.light = opts.light != null ? opts.light : 0.8;
    this.switches = {}; this.capV = {}; this.cur = {}; this.jx = {}; this.pot = {}; this.meter = {}; this.motor = {}; this.obj = {}; this.mic = {}; this.ic = {}; this.tune = {};
    for (const e of elements) {
      if (e.def.kind === 'sw') this.switches[e.id] = false;
      // a kondenzátorok kezdőfeszültségében néhány mV eltérés: a valódi áramkörökben a zaj és az
      // alkatrész-eltérések mindig kibillentik a szimmetrikus rezgőköröket, a szimulációban ez pótolja őket
      if (e.def.kind === 'cap') this.capV[e.id] = (opts.capInit && opts.capInit[e.id] != null) ? opts.capInit[e.id] : jitter(e.id);
      if (e.def.kind === 'npn' || e.def.kind === 'pnp') this.jx[e.id] = { vbe: 0, vbc: 0 };
      if (e.def.kind === 'led') this.jx[e.id] = { vd: 0 };
      if (e.def.kind === 'pot') this.pot[e.id] = (opts.pot && opts.pot[e.id] != null) ? opts.pot[e.id] : 0.5;
      if (e.def.kind === 'varcap') this.tune[e.id] = (opts.tune && opts.tune[e.id] != null) ? opts.tune[e.id] : 0.5;
      if (e.def.kind === 'meter') this.meter[e.id] = (opts.meter && opts.meter[e.id]) || '50mA';
      if (e.def.kind === 'motor') this.motor[e.id] = { w: 0, hand: 0 };
      if (e.def.kind === 'mic') this.mic[e.id] = 0;
      if (e.def.kind === 'ic') this.ic[e.id] = { phase: 0, t: 0, f: 0, on: false, active: false, gOut: 1e-9, play: 0, note: 0, prevTrg: false, mode: 0, vt: 0, avg: null, inHi: false, count: 0, rgb: [0, 0, 0], fbV: 0, remote: false, gP: 1e-9, lo1: false, lo2: false };
      if (e.def.kind === 'obj') this.obj[e.id] = (opts.obj && opts.obj[e.id] != null) ? opts.obj[e.id] : 1e12;
    }
  }

  // szénmikrofon: csendben kb. 1 kΩ, erős hangnyomásra (fújás) kb. 10 kΩ
  function micR(p) { return 1000 + 9000 * Math.max(0, Math.min(1, p || 0)); }
  // determinisztikus, a hasonló nevekre is jól szóródó eltérés (FNV-1a hash), ±10 mV
  function jitter(id) {
    let h = 2166136261; for (const ch of String(id)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
    return ((h % 2001) / 1000 - 1) * 0.01;
  }
  // IC-modulok belső terhelései (láb → (−)) és a viselkedési modell
  // [láb, ellenállás, másik láb (alapból a (−))]
  const IC_LOADS = {
    strobe: [['P', 30000], ['CTL', 10000]],
    alarm: [['IN1', 20000], ['IN2', 20000], ['IN3', 20000]],
    music: [['P', 30000], ['HLD', 100000], ['TRG', 100000]],
    war: [['P', 30000], ['IN1', 100000, 'P'], ['IN2', 100000, 'P']],   // a bemenetek belül a (+)-ra húzva
    amp: [['P', 600], ['FIL', 100, 'P'], ['INP', 50000]],              // FIL: szűrt táp a (+)-ról
    organ: [['P', 1500], ['R', 1e6], ['G', 1e6], ['B', 1e6], ['INP', 1e6]],
    ir: [['P', 3000]],
    melody: [],
    radio: [['OUT', 2000], ['INP', 1e6], ['INP2', 1, 'INP']],   // a két INP pont belül össze van kötve
  };
  // A rádió: egy valódi adó, a Kossuth Rádió Solt 540 kHz-en. A műsort a szimuláció nem tudja venni,
  // a hangja helyett egy egyszerű, lassan változó jel jelzi (a hangot az app egy kitalált dallammal adja).
  const STATIONS = [{ f: 540e3, name: 'Kossuth Rádió (Solt, 540 kHz)' }];
  const RADIO_STRAY = 15e-12, RADIO_Q = 35;
  // saját dallam a dallam IC (U32) modelljéhez
  const TUNE2 = [[392, .25], [392, .25], [440, .5], [392, .5], [523, .5], [494, 1], [392, .25], [392, .25], [440, .5], [392, .5], [587, .5], [523, 1], [0, .5]];
  const TUNE2_LEN = TUNE2.reduce((a, n) => a + n[1], 0);
  // a fényorgona színsora: [piros, zöld, kék]
  const ORGAN_COLORS = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 0], [0, 1, 1], [1, 0, 1], [1, 1, 1]];
  // az űrháború IC nyolc hangja (saját közelítés)
  function warTone(mode, t) {
    const fr = (x) => x - Math.floor(x);
    switch (mode) {
      case 0: return 2200 - 1800 * fr(t * 6);                         // lézer: gyors lefelé söprés
      case 1: return fr(t * 12) < 0.5 ? 700 : 0;                       // gépágyú
      case 2: return 600 + 400 * Math.sin(2 * Math.PI * 7 * t);        // ufó: remegő hang
      case 3: return 300 + 1500 * fr(t * 1.5);                         // rakéta: lassan emelkedik
      case 4: return fr(t * 4) < 0.5 ? 1500 - 2000 * fr(t * 8) : 0;    // két lövés egymás után
      case 5: return 180 + 120 * fr(t * 25);                           // motorzúgás
      case 6: return fr(t * 3) < 0.5 ? 1200 : 900;                     // vészjelzés
      default: return 400 + 2400 * Math.abs(Math.sin(2 * Math.PI * 0.8 * t)); // csillagkapu
    }
  }
  // saját dallam a zene IC modelljéhez (a valódi U1 dallamát nem ismerjük): [frekvencia Hz, hossz s]
  const TUNE = [[523, .3], [659, .3], [784, .3], [659, .3], [698, .3], [880, .6], [784, .3], [698, .3], [659, .3], [587, .3], [523, .6], [0, .2],
    [587, .3], [698, .3], [880, .3], [698, .3], [659, .3], [784, .6], [698, .3], [659, .3], [587, .3], [494, .3], [523, .6], [0, .4]];
  const TUNE_LEN = TUNE.reduce((a, n) => a + n[1], 0);
  // A riasztó IC öt hangja (saját közelítés; a bemenetek kombinációja választ)
  function alarmTone(mode, t) {
    const fr = (x) => x - Math.floor(x);
    switch (mode) {
      case 2: return 450 + 1050 * fr(t / 1.4); // csak IN2: felfelé söprő riasztóhang
      case 1: return fr(t * 9) < 0.5 ? 900 : 0; // csak IN1: gépfegyver (gyors szaggatás)
      case 4: return fr(t / 1.2) < 0.5 ? 650 : 520; // csak IN3: tűzoltóautó (lassú kéthangú)
      case 3: return 1800 - 1400 * fr(t * 3); // IN1 + IN2: lézerpisztoly (gyors lefelé söprés)
      case 6: return fr(t * 2.5) < 0.5 ? 980 : 780; // IN2 + IN3: mentőautó (gyors kéthangú)
      default: return 450 + 1050 * Math.abs(2 * fr(t / 2) - 1);
    }
  }
  Sim.prototype._icStep = function (e, dt) {
    const d = e.def, t = e.t, st = this.ic[e.id];
    const v = (pin) => (t[pin] >= 0 ? this.nodeV(t[pin]) : 0) - (t.N >= 0 ? this.nodeV(t.N) : 0);
    st.t += dt;
    if (d.ic === 'strobe') {
      st.active = v('P') > 2;
      const ictl = Math.max(0, v('CTL')) / 10000;
      st.f = st.active ? 2e5 * ictl : 0;           // a CTL-en befolyó áram szabja meg a villogás ütemét
      st.phase = (st.phase + st.f * dt) % 1;
      st.on = st.active && st.f > 0.2 && st.phase < 0.25;
      st.gOut = st.on ? 1 / 8 : 1e-9;
    } else if (d.ic === 'alarm') {
      const bits = (v('IN1') > 1.5 ? 1 : 0) | (v('IN2') > 1.5 ? 2 : 0) | (v('IN3') > 1.5 ? 4 : 0);
      if (bits !== st.mode) { st.mode = bits; st.t = 0; }
      st.active = bits !== 0;
      st.f = st.active ? alarmTone(bits, st.t) : 0;
      st.on = st.active && st.f > 0;
      st.gOut = st.on ? 0.5 / 6 : 1e-9;             // hangfrekvencián kapcsol: a kijelzéshez az átlagos vezetése
    } else if (d.ic === 'music') {
      const pw = v('P') > 2; const trg = v('TRG') > 1.5;
      if (pw && !st.wasOn) st.play = 20;            // bekapcsoláskor kb. 20 s zene
      if (pw && trg && !st.prevTrg) { st.play = 20; st.t = 0; }
      if (pw && v('HLD') > 1.5) st.play = Math.max(st.play, 1);
      st.prevTrg = trg; st.wasOn = pw;
      st.play = pw ? Math.max(0, st.play - dt) : 0;
      st.active = pw && st.play > 0;
      let x = st.t % TUNE_LEN, k = 0; while (k < TUNE.length - 1 && x >= TUNE[k][1]) { x -= TUNE[k][1]; k++; }
      st.note = k; st.f = st.active ? TUNE[k][0] : 0;
      st.on = st.active && st.f > 0 && x < TUNE[k][1] * 0.85;
      st.gOut = st.on ? 0.5 / 6 : 1e-9;
    }
    else if (d.ic === 'war') {
      st.active = v('P') > 2;
      const lo1 = v('IN1') < 0.8, lo2 = v('IN2') < 0.8;   // a bemenetet a (−)-ra kötve lép a következő hangra
      if (st.active && ((lo1 && !st.lo1) || (lo2 && !st.lo2))) { st.mode = (st.mode + 1) % 8; st.t = 0; }
      st.lo1 = lo1; st.lo2 = lo2;
      st.f = st.active ? warTone(st.mode, st.t) : 0;
      st.on = st.active && st.f > 0;
      st.gOut = st.on ? 0.5 / 6 : 1e-9;
    } else if (d.ic === 'amp') {
      // teljesítményerősítő: a bemenet változását (a lassú átlagához képest) 20-szorosára erősíti;
      // a kimenet belül kondenzátoron át csatolt, a kitérés a tápfeszültség felénél korlátos
      const vp = v('P'); st.active = vp > 2;
      const vin = v('INP'); if (st.avg == null) st.avg = vin;
      if (!this.freezeCaps) st.avg += (vin - st.avg) * Math.min(1, dt / 0.02);
      const vmax = Math.max(0.05, vp / 2 - 0.3);
      st.vt = st.active ? vmax * Math.tanh(20 * (vin - st.avg) / vmax) : 0;
    } else if (d.ic === 'organ') {
      const vp = v('P'); st.active = vp > 2.5;
      const vi = v('INP');
      const hi = st.inHi ? vi > 0.45 * vp : vi > 0.55 * vp;   // Schmitt-trigger a bemeneten
      if (st.active && hi && !st.inHi) st.count = (st.count + 1) % ORGAN_COLORS.length;
      st.inHi = hi; st.fbV = st.active && !hi ? vp : 0;     // FB: a bemenet fordítottja
      const force = ['R', 'G', 'B'].map((k) => (v(k) > 1.2 ? 1 : 0));
      st.rgb = !st.active ? [0, 0, 0] : force.some((x) => x) ? force : ORGAN_COLORS[st.count];
      st.on = st.active;
    } else if (d.ic === 'ir') {
      st.active = v('P') > 2.5;
      // a távirányító kódolt villanássorozatot küld; a vevő kimenete ennek ütemében a (−)-ra kapcsol
      const ph = (st.t * 20) % 1;
      st.on = st.active && st.remote && ph < 0.7;
      st.gOut = st.on ? 1 / 100 : 1e-9;
    } else if (d.ic === 'radio') {
      // a hangolt kör: antennatekercs és forgókondenzátor párhuzamosan a bemenet és egy másik pont között
      const vo = v('OUT'); st.active = vo > 0.2;
      const inp = [t.INP, t.INP2].filter((x) => x >= 0);
      const pair = (k) => this.nl.elements.find((x) => x.def.kind === k && (inp.includes(x.t.a) || inp.includes(x.t.b)));
      const coil = pair('coil'), vc = pair('varcap');
      const other = (x) => (inp.includes(x.t.a) ? x.t.b : x.t.a);
      st.f0 = 0; st.match = 0; st.station = null;
      if (coil && vc && other(coil) === other(vc) && other(coil) >= 0) {
        const C = vc.def.Cmin + (vc.def.Cmax - vc.def.Cmin) * (this.tune[vc.id] != null ? this.tune[vc.id] : 0.5) + RADIO_STRAY;
        st.f0 = 1 / (2 * Math.PI * Math.sqrt(coil.def.L * C));
        for (const sta of STATIONS) {
          const y = RADIO_Q * (st.f0 / sta.f - sta.f / st.f0); const m = 1 / (1 + y * y);
          if (m > st.match) { st.match = m; st.station = sta.name; }
        }
      }
      // a „műsor” lassan változó jele (a kijelzéshez); a kimenet ennek ütemében több-kevesebb áramot vesz fel
      const prog = 0.6 * Math.sin(2 * Math.PI * 2.3 * st.t) + 0.4 * Math.sin(2 * Math.PI * 0.7 * st.t);
      st.iAud = st.active ? 25e-6 * st.match * prog : 0;
      st.on = st.active && st.match > 0.3;
    } else if (d.ic === 'melody') {
      st.active = v('P') > 2;
      let x = st.t % TUNE2_LEN, k = 0; while (k < TUNE2.length - 1 && x >= TUNE2[k][1]) { x -= TUNE2[k][1]; k++; }
      st.note = k; st.f = st.active ? TUNE2[k][0] : 0;
      st.on = st.active && st.f > 0 && x < TUNE2[k][1] * 0.85;
      st.gP = st.active ? (st.on ? 1 / 250 : 1 / 2000) : 1e-9;   // a beépített hangszóró árama hangonként
    }
    // lábáramok (a kijelzéshez): a csomópontból az IC-be folyó áram
    const cur = {}; let sumN = 0;
    const vpin = (pin) => (t[pin] >= 0 ? this.nodeV(t[pin]) : 0);
    for (const [pin, R, to] of IC_LOADS[d.ic]) {
      const o = to || 'N'; if (t[pin] < 0 || t[o] < 0) continue;
      const i = (vpin(pin) - vpin(o)) / R; cur[pin] = (cur[pin] || 0) + i; if (o === 'N') sumN += i; else cur[o] = (cur[o] || 0) - i;
    }
    let io = 0;
    if (d.ic === 'amp') io = t.OUT >= 0 ? (v('OUT') - st.vt) / AMP_ROUT : 0;
    else if (t.OUT >= 0) io = v('OUT') * st.gOut;
    cur.OUT = (cur.OUT || 0) + io;
    if (d.ic === 'organ' && t.FB >= 0) { cur.FB = (v('FB') - st.fbV) / 47000; sumN += cur.FB; }
    if (d.ic === 'melody' && t.P >= 0) { cur.P = v('P') * st.gP; sumN += cur.P; }
    if (d.ic === 'radio' && t.OUT >= 0) { cur.OUT += st.iAud || 0; sumN += st.iAud || 0; }
    cur.N = -(sumN + io);
    this.cur[e.id] = cur;
  };
  const AMP_ROUT = 0.5;
  function potR(d, p) { p = Math.max(0, Math.min(1, p)); return { ra: Math.max(1, d.R * p), rb: Math.max(1, d.R * (1 - p)) }; }

  // A motor tengelyének mozgása (explicit Euler, a lépés végén). Kézi pörgetésnél a sebességet a kéz adja.
  Sim.prototype._motorStep = function (id, i, dt) {
    const m = this.motor[id];
    if (m.hand !== 0) { m.w = m.hand * MOTOR.wHand; return; }
    const T = MOTOR.Ke * i;
    if (Math.abs(m.w) < 1 && Math.abs(T) <= MOTOR.Tc) { m.w = 0; return; }
    const fr = MOTOR.b * m.w + MOTOR.Tc * Math.sign(m.w || T);
    const w2 = m.w + (T - fr) / MOTOR.J * dt;
    m.w = (m.w !== 0 && Math.sign(w2) !== Math.sign(m.w) && Math.abs(T) <= MOTOR.Tc) ? 0 : w2;
  };
  // A mérőműszer kitérése: 0..1 a végkitérésig (1 felett: túlcsordulás), és a kijelzett érték.
  Sim.prototype.meterReading = function (id) {
    const r = METER[this.meter[id]]; const i = this.cur[id] || 0;
    const frac = i / r.fs;
    const value = this.meter[id] === '5V' ? i * r.R : i;
    return { frac, value, range: this.meter[id], unit: this.meter[id] === '5V' ? 'V' : 'A' };
  };

  // A fototranzisztort érő fény: környezeti fény, vagy ha üvegszál köti egy LED-hez, annak fénye
  // (a kábeltartó a környezeti fény nagy részét kitakarja).
  Sim.prototype.photoLight = function (id) {
    const lk = this.links.find((l) => l.photo === id);
    if (!lk) return this.light;
    // a kábel fekete tartója a fototranzisztoron marad; ha a kábelben nem jut fény (elzárva), csak a szórt fény marad
    const I = this.fiberOn ? Math.max(0, this.cur[lk.led] || 0) : 0;
    return 0.08 * this.light + lk.k * Math.min(1.2, I / 0.01);
  };

  Sim.prototype.nodeV = function (net) {
    if (net < 0) return NaN;
    return net === this.ground ? 0 : this.v[this.map[net]];
  };
  Sim.prototype._i = function (net) { return net === this.ground || net < 0 ? -1 : this.map[net]; };

  // Egy iteráció: linearizált egyenletrendszer felépítése a v munkapontban.
  // jxs: a pn-átmenetek előző iterációs feszültségei (ezt frissíti); visszaadja, volt-e korlátozás.
  Sim.prototype._load = function (v, dt, capV) {
    const n = this.n, G = this.G, R = this.rhs; G.fill(0); R.fill(0);
    const vv = (net) => (net === this.ground || net < 0 ? 0 : v[this.map[net]]);
    const I = (net) => this._i(net);
    const stampG = (a, b, g) => {
      if (a >= 0) G[a * n + a] += g; if (b >= 0) G[b * n + b] += g;
      if (a >= 0 && b >= 0) { G[a * n + b] -= g; G[b * n + a] -= g; }
    };
    const stampI = (a, b, ieq) => { // ieq: a-ból b felé az elemen át folyó állandó áramrész
      if (a >= 0) R[a] -= ieq; if (b >= 0) R[b] += ieq;
    };
    let limited = false;
    for (const e of this.nl.elements) {
      const d = e.def, t = e.t;
      if (d.kind === 'npn' || d.kind === 'pnp') {
        if (t.B < 0 || t.C < 0 || t.E < 0) continue;
        const s = d.kind === 'npn' ? 1 : -1;
        const B = I(t.B), C = I(t.C), E = I(t.E);
        const Vb = vv(t.B), Vc = vv(t.C), Ve = vv(t.E);
        const j = this.jx[e.id];
        const vcrit = VT * Math.log(VT / (Math.SQRT2 * BJT.Is));
        let vbe = s * (Vb - Ve), vbc = s * (Vb - Vc);
        const vbe2 = pnjlim(vbe, j.vbe, VT, vcrit), vbc2 = pnjlim(vbc, j.vbc, VT, vcrit);
        if (vbe2 !== vbe || vbc2 !== vbc) limited = true;
        vbe = vbe2; vbc = vbc2; j.vbe = vbe; j.vbc = vbc;
        const ef = safeExp(vbe / VT), er = safeExp(vbc / VT);
        const If = BJT.Is * (ef - 1), Ir = BJT.Is * (er - 1);
        const gf = BJT.Is * ef / VT + 1e-12, gr = BJT.Is * er / VT + 1e-12;
        const Ic = If - Ir - Ir / BJT.br, Ib = If / BJT.bf + Ir / BJT.br;
        const a_c = gf, b_c = -gr * (1 + 1 / BJT.br);   // dIc/dvbe, dIc/dvbc
        const a_b = gf / BJT.bf, b_b = gr / BJT.br;      // dIb/dvbe, dIb/dvbc
        // kifolyó áram egy csomópontból: s*I0 + a*(Vb-Ve - s*vbe) + b*(Vb-Vc - s*vbc)
        const row = (r, I0, a, b) => {
          if (r < 0) return;
          if (B >= 0) G[r * n + B] += a + b;
          if (E >= 0) G[r * n + E] -= a;
          if (C >= 0) G[r * n + C] -= b;
          R[r] -= s * I0 - a * s * vbe - b * s * vbc;
        };
        row(C, Ic, a_c, b_c);
        row(B, Ib, a_b, b_b);
        row(E, -(Ic + Ib), -(a_c + a_b), -(b_c + b_b));
        continue;
      }
      if (d.kind === 'ic') {
        const st = this.ic[e.id];
        for (const [pin, R, to] of IC_LOADS[d.ic]) { const o = to || 'N'; if (t[pin] >= 0 && t[o] >= 0) stampG(I(t[pin]), I(t[o]), 1 / R); }
        if (t.N < 0) continue;
        if (d.ic === 'amp') {
          // a kimenet feszültségforrás kis belső ellenállással (az előző lépés bemenetéből számolva)
          if (t.OUT >= 0) { const g = 1 / AMP_ROUT; stampG(I(t.OUT), I(t.N), g); stampI(I(t.OUT), I(t.N), -st.vt * g); }
        } else if (t.OUT >= 0) stampG(I(t.OUT), I(t.N), st.gOut);
        if (d.ic === 'organ' && t.FB >= 0) { const g = 1 / 47000; stampG(I(t.FB), I(t.N), g); stampI(I(t.FB), I(t.N), -st.fbV * g); }
        if (d.ic === 'melody' && t.P >= 0) stampG(I(t.P), I(t.N), st.gP);
        if (d.ic === 'radio' && t.OUT >= 0) stampI(I(t.OUT), I(t.N), st.iAud || 0);
        continue;
      }
      if (d.kind === 'pot') {
        const { ra, rb } = potR(d, this.pot[e.id]);
        if (t.a >= 0 && t.w >= 0) stampG(I(t.a), I(t.w), 1 / ra);
        if (t.w >= 0 && t.b >= 0) stampG(I(t.w), I(t.b), 1 / rb);
        continue;
      }
      if (t.a < 0 || t.b < 0) continue;
      const a = I(t.a), b = I(t.b);
      const u = vv(t.a) - vv(t.b);
      switch (d.kind) {
        case 'res': case 'lamp': case 'spk': case 'coil': stampG(a, b, 1 / d.R); break;
        case 'varcap': stampG(a, b, 1e-12); break;
        case 'meter': stampG(a, b, 1 / METER[this.meter[e.id]].R); break;
        case 'obj': stampG(a, b, 1 / Math.max(0.05, this.obj[e.id])); break;
        case 'mic': stampG(a, b, 1 / micR(this.mic[e.id])); break;
        case 'motor': { const g = 1 / MOTOR.Rm; stampG(a, b, g); stampI(a, b, -MOTOR.Ke * this.motor[e.id].w * g); break; }
        case 'sw': stampG(a, b, this.switches[e.id] ? 20 : 1e-10); break;
        case 'bat': { const g = 1 / d.Rint; stampG(a, b, g); stampI(a, b, -d.V * g); break; }
        case 'cap': { const g = d.C / dt; stampG(a, b, g); stampI(a, b, -g * capV[e.id]); break; }
        case 'led': {
          const nvt = d.n * VT; const j = this.jx[e.id];
          const vcrit = nvt * Math.log(nvt / (Math.SQRT2 * d.Is));
          let vd = pnjlim(u, j.vd, nvt, vcrit); if (vd !== u) limited = true; j.vd = vd;
          const ex = safeExp(vd / nvt); const id = d.Is * (ex - 1); const g = d.Is * ex / nvt + 1e-12;
          stampG(a, b, g); stampI(a, b, id - g * vd); break;
        }
        case 'photo': {
          const Iph = 1e-7 + 4e-3 * Math.pow(Math.max(0, Math.min(1, this.photoLight(e.id))), 1.6);
          // sima modell: pozitív feszültségen telítődő áram, negatívon lineáris folytatás;
          // a 0 V-nál az érték és a meredekség is folytonos, így a Newton-iteráció nem ugrál
          let i, g;
          if (u >= 0) { const ex = Math.exp(-u / 0.12); i = Iph * (1 - ex); g = Iph * ex / 0.12; }
          else { g = Iph / 0.12; i = g * u; }
          g += 1e-9; i += 1e-9 * u;
          stampG(a, b, g); stampI(a, b, i - g * u); break;
        }
      }
    }
    for (let k = 0; k < n; k++) G[k * n + k] += 1e-9;
    return limited;
  };

  Sim.prototype._solveInto = function (x) { // G x = rhs
    const n = this.n, A = this.G;
    for (let i = 0; i < n; i++) x[i] = this.rhs[i];
    for (let k = 0; k < n; k++) {
      let piv = k, mx = Math.abs(A[k * n + k]);
      for (let i = k + 1; i < n; i++) { const a = Math.abs(A[i * n + k]); if (a > mx) { mx = a; piv = i; } }
      if (mx < 1e-30) A[k * n + k] = 1e-30;
      if (piv !== k) {
        for (let j = 0; j < n; j++) { const t = A[k * n + j]; A[k * n + j] = A[piv * n + j]; A[piv * n + j] = t; }
        const t = x[k]; x[k] = x[piv]; x[piv] = t;
      }
      const akk = A[k * n + k];
      for (let i = k + 1; i < n; i++) {
        const m = A[i * n + k] / akk; if (m === 0) continue;
        for (let j = k; j < n; j++) A[i * n + j] -= m * A[k * n + j];
        x[i] -= m * x[k];
      }
    }
    for (let i = n - 1; i >= 0; i--) { let s = x[i]; for (let j = i + 1; j < n; j++) s -= A[i * n + j] * x[j]; x[i] = s / A[i * n + i]; }
  };

  Sim.prototype._newton = function (dt) {
    const v = this.v, x = this.vnew;
    // csomópontonkénti „bizalmi sugár”: ha egy csomópont lépésének iránya megfordul, a sugár feleződik
    if (!this.trust || this.trust.length !== this.n) { this.trust = new Float64Array(this.n); this.lastD = new Float64Array(this.n); }
    const tr = this.trust, ld = this.lastD; tr.fill(1); ld.fill(0);
    for (let it = 0; it < 50; it++) {
      const limited = this._load(v, dt, this.capV);
      this._solveInto(x);
      let conv = !limited;
      // csillapítás csomópontonként: egy iterációban egy csomópont legfeljebb 1 V-ot mozdulhat
      // (különben pl. egy áramforrásszerű elem miatt a megoldás két hamis érték között ugrálhat).
      // Csomópontonként korlátozunk, hogy egy elszálló csomópont ne fogja vissza a többit.
      for (let k = 0; k < this.n; k++) {
        if (!isFinite(x[k])) return false;
        let d = x[k] - v[k];
        if (it > 0) {
          if (d * ld[k] < 0 && Math.abs(d) > 0.05) tr[k] = Math.max(0.02, tr[k] * 0.5);
          if (Math.abs(d) > tr[k]) { d = Math.sign(d) * tr[k]; conv = false; }
        }
        ld[k] = d;
        if (Math.abs(d) > 1e-6 + 1e-4 * Math.abs(x[k])) conv = false;
        // fizikai korlát: ezekben az áramkörökben egy csomópont sem lehet messze a tápfeszültségen kívül
        v[k] = Math.max(this.vLo, Math.min(this.vHi, v[k] + d));
      }
      if (conv && it > 0) return true;
    }
    return false;
  };

  Sim.prototype._commit = function (dt) {
    for (const e of this.nl.elements) {
      const d = e.def, t = e.t;
      if (d.kind === 'npn' || d.kind === 'pnp') {
        if (t.B < 0 || t.C < 0 || t.E < 0) { this.cur[e.id] = { C: 0, B: 0, E: 0 }; continue; }
        const s = d.kind === 'npn' ? 1 : -1;
        const vbe = s * (this.nodeV(t.B) - this.nodeV(t.E)), vbc = s * (this.nodeV(t.B) - this.nodeV(t.C));
        const If = BJT.Is * (safeExp(vbe / VT) - 1), Ir = BJT.Is * (safeExp(vbc / VT) - 1);
        const Ic = s * (If - Ir - Ir / BJT.br), Ib = s * (If / BJT.bf + Ir / BJT.br);
        this.cur[e.id] = { C: Ic, B: Ib, E: -(Ic + Ib) };
        continue;
      }
      if (d.kind === 'ic') { this._icStep(e, dt); continue; }
      if (d.kind === 'pot') {
        const { ra, rb } = potR(d, this.pot[e.id]);
        const va = this.nodeV(t.a), vb = this.nodeV(t.b), vw = this.nodeV(t.w);
        const iaw = t.a >= 0 && t.w >= 0 ? (va - vw) / ra : 0, iwb = t.w >= 0 && t.b >= 0 ? (vw - vb) / rb : 0;
        this.cur[e.id] = { a: iaw, w: iwb - iaw, b: -iwb };
        continue;
      }
      if (t.a < 0 || t.b < 0) { this.cur[e.id] = 0; if (d.kind === 'motor') this._motorStep(e.id, 0, dt); continue; }
      const u = this.nodeV(t.a) - this.nodeV(t.b);
      let i = 0;
      switch (d.kind) {
        case 'res': case 'lamp': case 'spk': case 'coil': i = u / d.R; break;
        case 'varcap': i = 0; break;
        case 'meter': i = u / METER[this.meter[e.id]].R; break;
        case 'obj': i = u / Math.max(0.05, this.obj[e.id]); break;
        case 'mic': i = u / micR(this.mic[e.id]); break;
        case 'motor': i = (u - MOTOR.Ke * this.motor[e.id].w) / MOTOR.Rm; this._motorStep(e.id, i, dt); break;
        case 'sw': i = u * (this.switches[e.id] ? 20 : 1e-10); break;
        case 'bat': i = (u - d.V) / d.Rint; break;
        case 'cap': i = d.C / dt * (u - this.capV[e.id]); if (!this.freezeCaps) this.capV[e.id] = u; break;
        case 'led': i = d.Is * (safeExp(u / (d.n * VT)) - 1); break;
        case 'photo': { const Iph = 1e-7 + 4e-3 * Math.pow(Math.max(0, Math.min(1, this.photoLight(e.id))), 1.6); i = (u >= 0 ? Iph * (1 - Math.exp(-u / 0.12)) : Iph * u / 0.12) + 1e-9 * u; break; }
      }
      this.cur[e.id] = i;
    }
    this.time += dt;
  };

  Sim.prototype._snap = function () {
    const jx = {}; for (const k in this.jx) jx[k] = { ...this.jx[k] };
    return { v: Float64Array.from(this.v), jx };
  };
  Sim.prototype._restore = function (s) { this.v.set(s.v); for (const k in s.jx) Object.assign(this.jx[k], s.jx[k]); };

  Sim.prototype.step = function (dt, depth) {
    depth = depth || 0;
    const snap = this._snap();
    if (this._newton(dt)) { this._commit(dt); this.converged = true; return true; }
    this._restore(snap);
    if (depth >= 5) { this._newton(dt); this._commit(dt); this.converged = false; return false; }
    const a = this.step(dt / 2, depth + 1);
    const b = this.step(dt / 2, depth + 1);
    return a && b;
  };


  // A vezetékekben folyó áram megjelenítéshez: nettónként kis ellenálláshálózat.
  Sim.prototype.wireCurrents = function () {
    const nl = this.nl, layout = this.layout, chk = nl.chk;
    const inj = new Map(); // post -> a postból az alkatrészekbe kifolyó áram
    const addInj = (r, c, i) => { const k = postKey(r, c); inj.set(k, (inj.get(k) || 0) + i); };
    for (const e of nl.elements) {
      if (e.internal) continue;
      const cs = chk.contacts[e.idx];
      const cur = this.cur[e.id];
      for (const s of cs) {
        if (!s.connected) continue;
        let i = 0;
        if (typeof cur === 'object' && cur) i = cur[s.term] || 0;
        else if (s.term === 'a') i = cur || 0; else if (s.term === 'b') i = -(cur || 0);
        addInj(s.r, s.c, i);
      }
    }
    // csak vezeték-élek; nettónként Laplace-egyenlet
    const edges = []; const nodes = new Map();
    layout.forEach((pl, i) => {
      if (PARTS[pl.p].kind !== 'wire' && PARTS[pl.p].kind !== 'jumper') return;
      const cs = chk.contacts[i].filter((s) => s.connected);
      for (let j = 1; j < cs.length; j++) edges.push({ wire: i, seg: j - 1, a: postKey(cs[j - 1].r, cs[j - 1].c), b: postKey(cs[j].r, cs[j].c) });
      // a lebegő középső snapek miatt a szegmensek az összekötött snapok között vannak
    });
    for (const ed of edges) { if (!nodes.has(ed.a)) nodes.set(ed.a, nodes.size); if (!nodes.has(ed.b)) nodes.set(ed.b, nodes.size); }
    const N = nodes.size; const res = new Map();
    if (!N) return res;
    const L = new Float64Array(N * N); const rhs = new Float64Array(N);
    for (const ed of edges) { const a = nodes.get(ed.a), b = nodes.get(ed.b); L[a * N + a]++; L[b * N + b]++; L[a * N + b]--; L[b * N + a]--; }
    for (const [k, i] of nodes) rhs[i] = -(inj.get(k) || 0);
    for (let i = 0; i < N; i++) L[i * N + i] += 1e-6; // rögzítés
    // Gauss
    const A = L, x = rhs;
    for (let k = 0; k < N; k++) {
      let piv = k, mx = Math.abs(A[k * N + k]);
      for (let i = k + 1; i < N; i++) { const a = Math.abs(A[i * N + k]); if (a > mx) { mx = a; piv = i; } }
      if (piv !== k) { for (let j = 0; j < N; j++) { const t = A[k * N + j]; A[k * N + j] = A[piv * N + j]; A[piv * N + j] = t; } const t = x[k]; x[k] = x[piv]; x[piv] = t; }
      for (let i = k + 1; i < N; i++) { const m = A[i * N + k] / A[k * N + k]; if (!m) continue; for (let j = k; j < N; j++) A[i * N + j] -= m * A[k * N + j]; x[i] -= m * x[k]; }
    }
    for (let i = N - 1; i >= 0; i--) { let s = x[i]; for (let j = i + 1; j < N; j++) s -= A[i * N + j] * x[j]; x[i] = s / A[i * N + i]; }
    for (const ed of edges) {
      const i = x[nodes.get(ed.a)] - x[nodes.get(ed.b)];
      if (!res.has(ed.wire)) res.set(ed.wire, []);
      res.get(ed.wire)[ed.seg] = i;
    }
    return res;
  };

  // ASCII rajz (teszteléshez)
  function ascii(layout) {
    const nb = layout.some((pl) => geometry(pl).snaps.some((q) => q.r >= BOARD_ROWS)) ? 2 : 1;
    const g = []; for (let r = 0; r < nb * BOARD_ROWS; r++) { g.push(new Array(11).fill(' . ')); }
    const chk = checkBuild(layout);
    layout.forEach((pl, i) => {
      const geo = geometry(pl); const id = (pl.id || pl.p).padEnd(3).slice(0, 3);
      if (geo.jumper || geo.fiber) return;
      for (const s of geo.snaps) g[s.r] && (g[s.r][s.c] = id);
      for (const b of geo.body) if (!b.side && g[b.r]) g[b.r][b.c] = id.toLowerCase();
    });
    let s = '    ' + Array.from({ length: 10 }, (_, i) => String(i + 1).padStart(2).padEnd(3)).join('') + '\n';
    for (let r = 0; r < nb * BOARD_ROWS; r++) { if (r % BOARD_ROWS > 6) { if (r % BOARD_ROWS === 7 && Math.floor(r / BOARD_ROWS) < nb - 1) s += '   --- ' + (Math.floor(r / BOARD_ROWS) + 2) + '. rács ---\n'; continue; } s += ' ' + ROWS[r % BOARD_ROWS] + '  ' + g[r].slice(1).join('') + '\n'; }
    return s;
  }

  const api = { STATIONS, PARTS, KITS, METER, MOTOR, ROWS, BOARD_ROWS, DIRS, geometry, checkBuild, buildNetlist, Sim, ascii, postName, parsePost };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.BoffinEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
