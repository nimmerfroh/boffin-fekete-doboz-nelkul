// SPDX-License-Identifier: GPL-3.0-or-later
// Fekete doboz nélkül – Copyright (C) 2026 Nimmerfroh Károly
// Véletlen pukihangok előállítása (hangminta nélkül, számolással).
// Böngészőben és Node-ban is fut.
(function (root) {
  'use strict';
  // egyszerű, magozható véletlenszám-generátor (mulberry32)
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const KINDS = ['rövid', 'hosszú', 'cincogó', 'brummogó', 'pattogó', 'szortyogó'];

  // Egy pukihang mintái. A „hang” egy lebegő magasságú, lüktető berregés (a záróizom csapkodása),
  // egy kis zajjal keverve, aluláteresztő szűrőn át.
  function puki(sr, seed) {
    const R = rng(seed == null ? (Math.random() * 2 ** 32) : seed);
    const between = (a, b) => a + (b - a) * R();
    const kind = KINDS[Math.floor(R() * KINDS.length)];
    let dur = between(0.35, 0.9), f0 = between(70, 150), noise = between(0.05, 0.25), flutter = between(18, 35), bend = between(-0.45, 0.25), cutoff = between(500, 1100);
    let bursts = 1;
    if (kind === 'rövid') { dur = between(0.15, 0.3); f0 = between(110, 190); }
    if (kind === 'hosszú') { dur = between(1.1, 1.9); bend = between(-0.6, -0.2); }
    if (kind === 'cincogó') { f0 = between(230, 380); dur = between(0.3, 0.8); cutoff = between(1400, 2200); noise = 0.05; }
    if (kind === 'brummogó') { f0 = between(45, 70); dur = between(0.6, 1.2); cutoff = between(300, 500); }
    if (kind === 'pattogó') { bursts = 2 + Math.floor(R() * 4); dur = between(0.5, 1.1); }
    if (kind === 'szortyogó') { noise = between(0.4, 0.7); flutter = between(8, 16); }
    const n = Math.round(sr * dur), out = new Float32Array(n);
    // a pattogó fajtánál szünetek a hangban
    const gaps = [];
    for (let b = 1; b < bursts; b++) { const at = (b / bursts + between(-0.06, 0.06)) * dur; gaps.push([at, at + between(0.03, 0.08)]); }
    let ph = 0, fph = 0, drift = 0, lp1 = 0, lp2 = 0, nz = 0, env = 0;
    const kc = 1 - Math.exp(-2 * Math.PI * cutoff / sr);
    for (let i = 0; i < n; i++) {
      const t = i / sr, x = t / dur;
      drift += (R() - 0.5) * 0.004; drift *= 0.999;                    // lassú, véletlen lebegés
      const f = Math.max(30, f0 * (1 + bend * x + drift + 0.06 * Math.sin(2 * Math.PI * 3.1 * t)));
      ph = (ph + f / sr) % 1;
      fph = (fph + flutter * (1 + 0.3 * Math.sin(2 * Math.PI * 1.7 * t)) / sr) % 1;
      // aszimmetrikus impulzus: rövid nyitás, hosszú zárás
      const pulse = ph < 0.35 ? Math.sin(Math.PI * ph / 0.35) : -0.2;
      const flap = 0.55 + 0.45 * Math.sin(2 * Math.PI * fph);
      nz = 0.7 * nz + 0.3 * (R() * 2 - 1);                               // tompított zaj
      let s = (pulse * (1 - noise) + nz * noise * 1.6) * flap;
      lp1 += kc * (s - lp1); lp2 += kc * (lp1 - lp2); s = lp2;
      // burkoló: gyors indulás, a végén elhal; a szüneteknél elhallgat
      let target = x < 0.04 ? x / 0.04 : x > 0.8 ? Math.max(0, (1 - x) / 0.2) : 1;
      for (const [a, b] of gaps) if (t >= a && t < b) target = 0;
      env += (target - env) * 0.01;
      out[i] = s * env;
    }
    let mx = 0; for (const v of out) mx = Math.max(mx, Math.abs(v));
    const k = mx > 0 ? 0.7 / mx : 0; for (let i = 0; i < n; i++) out[i] *= k;
    return { samples: out, kind, dur };
  }
  const api = { puki, KINDS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Puki = api;
})(typeof window !== 'undefined' ? window : globalThis);
