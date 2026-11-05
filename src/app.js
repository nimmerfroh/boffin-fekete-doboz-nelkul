// SPDX-License-Identifier: GPL-3.0-or-later
// Fekete doboz nélkül – Copyright (C) 2026 Nimmerfroh Károly
(function () {
'use strict';
const E = window.BoffinEngine, P = E.PARTS, LAY = window.BOFFIN_LAYOUTS;
const $ = (s, r) => (r || document).querySelector(s);
const NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
const store = {
  get(k, d) { try { const v = localStorage.getItem('fdn:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('fdn:' + k, JSON.stringify(v)); } catch (e) { /* nincs tárhely */ } },
};

// ---------- segédek a magyar szövegekhez ----------
const art = (w) => (/^[AEIOUÁÉÍÓÖŐÚÜŰaeiouáéíóöőúüűF]/.test(w) && !/^F[a-z]/.test(w) ? 'az ' : 'a ') + w; // F betű: "ef" -> az F3
const artNum = (n) => (n === 1 || n === 5 ? 'az ' : 'a ');
const wireName = (n) => n + '-' + ({ 1: 'es', 2: 'es', 3: 'as', 4: 'es', 5: 'ös', 6: 'os', 7: 'es' })[n];
const fmtA = (i) => { const a = Math.abs(i); if (a < 1e-6) return '0 mA'; if (a < 1e-3) return (a * 1e6).toFixed(0) + ' µA'; return (a * 1e3).toFixed(a < 0.01 ? 1 : 0).replace('.', ',') + ' mA'; };
const fmtV = (v) => (Math.abs(v) < 0.005 ? '0,00' : v.toFixed(2).replace('.', ',')) + ' V';

// ---------- kísérletek (src/experiments.js) ----------
const { EXPS, CHAPTERS, applyVariant } = window.BOFFIN_EXPERIMENTS(E, LAY);

// ---------- leírások az alkatrészekről ----------
const ABOUT = {
  wire: ['Vezeték', 'Összeköti a pontokat. Az áram akadály nélkül folyik rajta.'],
  bat: ['Elemtartó', 'Ez nyomja körbe az áramot. Két ceruzaelem együtt 3 voltot ad.'],
  sw: ['Kapcsoló', 'Kinyitja vagy bezárja a kört.'],
  res: ['Ellenállás', 'Fékezi az áramot. Minél nagyobb a száma, annál jobban fékez.'],
  led: ['LED', 'Világító dióda. Csak egy irányba engedi az áramot: a + jel felől.'],
  cap: ['Kondenzátor', 'Kis töltéstartály, olyan, mint egy pici akkumulátor. A nagyobbak (10 µF fölött) + jelet viselnek.'],
  npn: ['Tranzisztor', 'Mint egy csap: egy kicsi áram a középső lábán (bázis) kinyitja a nagy áramot a másik két láb között.'],
  pnp: ['Tranzisztor', 'Mint egy csap, csak fordított irányban dolgozik, mint az NPN.'],
  photo: ['Fototranzisztor', 'Olyan tranzisztor, amit nem áram, hanem fény nyit ki.'],
  lamp: ['Izzó', 'Vékony drót, ami az áramtól felforrósodik és világít.'],
  spk: ['Hangszóró', 'Az áram változása megrezegteti a membránját, ebből lesz a hang.'],
  pot: ['Állítható ellenállás', 'Tekerhető ellenállás: a csúszkája egy ellenálláscsíkon mozog. Három lába van: a két vége és a csúszka.'],
  meter: ['Mérőműszer', 'Megmutatja, mennyi áram folyik (0,5 mA vagy 50 mA állás), vagy mekkora a feszültség (5 V állás).'],
  motor: ['Motor', 'Az áram forgatja. Fordítva is működik: ha te forgatod, áramot termel.'],
  obj: ['Vizsgált tárgy', 'Ez nincs a dobozban: ide érnek a kábelvégek vagy az ujjad.'],
  jumper: ['Átkötő kábel', 'Hajlékony vezeték két távoli pont között. A végét a pont tetején lévő patentra csíptesd.'],
};
const KIT_ORDER = ['300', 'light', 'home'];
const KIT_SHORT = { '300': 'I 300', light: 'II Light', home: 'II My Home' };

// ---------- állapot ----------
const S = {
  exp: 0, stage: store.get('stage', 0), age: store.get('age', 'm'), autoread: store.get('autoread', false),
  step: 0, guess: null, variants: {}, sim: null, simLayout: null, running: false, light: 0.85,
  done: store.get('done', {}), wc: null, soundOn: false, audio: null,
};
const STAGES = ['Hozzávalók', 'Építés', 'Tippelj', 'Próbáld ki', 'Miért?'];

// a vezérlők állapota kísérletenként (a változatok újraindításakor is megmarad)
function initCtl(ex) {
  const sim = ex.sim || {};
  const ctl = { pot: { ...(sim.pot || {}) }, meter: { ...(sim.meter || {}) }, obj: { ...(sim.obj || {}) }, objName: {} };
  for (const c of ex.controls) {
    if (c && c.obj) ctl.objName[c.obj] = MATERIALS[c.set][0][0];
    if (c && c.touch) ctl.objName[c.touch] = 'érintsd';
  }
  return ctl;
}

// ---------- felolvasás ----------
let huVoice = null, voicesLoaded = false;
function pickVoice() {
  try {
    const vs = speechSynthesis.getVoices();
    if (vs.length) voicesLoaded = true;
    // magyar hang: előnyben a természetes (online) hangok, pl. Edge „Microsoft Noémi Online”
    const hu = vs.filter((v) => /^hu(-|_|$)/i.test(v.lang));
    huVoice = hu.find((v) => /natural|online/i.test(v.name)) || hu[0] || null;
  } catch (e) { /* nincs beszédszintézis */ }
}
try { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; } catch (e) { /* nincs */ }
function voiceHelp() {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|Macintosh/.test(ua) && 'ontouchend' in document) return 'iPaden: Beállítások → Kisegítő lehetőségek → Felolvasott tartalom → Hangok → Magyar, ott tölts le egy hangot.';
  if (/Android/.test(ua)) return 'Androidon: Beállítások → Rendszer → Nyelvek → Szövegfelolvasó → Google beszédszolgáltatások → Hangadatok telepítése → Magyar.';
  if (/Edg\//.test(ua)) return 'Edge-ben a magyar hangok (Noémi, Tamás) általában maguktól megjelennek; ha nem, frissítsd az oldalt.';
  if (/Windows/.test(ua)) return 'Windowson a legegyszerűbb a Microsoft Edge böngésző: abban van beépített magyar hang (Noémi, Tamás). Vagy: Gépház → Idő és nyelv → Beszéd → Hang hozzáadása → Magyar.';
  if (/Mac/.test(ua)) return 'Macen: Rendszerbeállítások → Kisegítő lehetőségek → Felolvasott tartalom → Rendszerhang → Hangok kezelése → Magyar.';
  return 'Ehhez a böngészőhöz telepíteni kell egy magyar felolvasóhangot, vagy próbáld Microsoft Edge-ben, abban van beépített magyar hang.';
}
function noVoiceNotice() {
  if (S.voiceWarned) return; S.voiceWarned = true;
  const box = document.createElement('div'); box.className = 'voicewarn'; box.setAttribute('role', 'status');
  box.innerHTML = '<b>Ezen az eszközön nincs magyar felolvasóhang.</b> Idegen nyelvű hanggal nem olvasunk fel, mert az érthetetlen lenne. <span></span> <button class="mini">Rendben</button>';
  box.querySelector('span').textContent = voiceHelp();
  box.querySelector('button').onclick = () => box.remove();
  document.querySelector('.wrap').insertBefore(box, document.querySelector('.exps'));
}
function speak(text) {
  try {
    if (!huVoice) { pickVoice(); }
    if (!huVoice) {
      // a hanglista néha késve töltődik be: egyszer még megvárjuk
      if (!voicesLoaded) { setTimeout(() => { pickVoice(); if (huVoice) speak(text); else noVoiceNotice(); }, 700); return; }
      noVoiceNotice(); return;
    }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/µF/g, ' mikrofarád').replace(/kΩ/g, ' kiloohm').replace(/Ω/g, ' ohm').replace(/mA/g, ' milliamper').replace(/ V\b/g, ' volt'));
    u.lang = huVoice.lang || 'hu-HU'; u.voice = huVoice; u.rate = S.age === 'k' ? 0.92 : 1;
    speechSynthesis.speak(u);
  } catch (e) { /* nincs beszédszintézis */ }
}
const speakIcon = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
function sayBlock(text, opts) {
  const d = document.createElement('div'); d.className = 'say';
  const b = document.createElement('button'); b.className = 'speak'; b.innerHTML = speakIcon; b.title = 'Felolvasás'; b.setAttribute('aria-label', 'Felolvasás');
  b.onclick = () => speak(text);
  const p = document.createElement('p'); p.textContent = text;
  d.append(b, p);
  if (opts && opts.auto && S.autoread) setTimeout(() => speak(text), 60);
  return d;
}

// ---------- geometria a rajzhoz ----------
const G = 66, OX = 52, OY = 46;
const px = (c) => OX + (c - 1) * G, py = (r) => OY + r * G;
const LOFF = 5;
const lvOff = (L) => (L > 1 ? -(L - 1) * LOFF : 0);

const COLORS = {
  wire: '#2E63CF', res: '#F0BF2E', sw: '#3FA453', bat: '#8C96A2', cap: '#2F8F62', lamp: '#9AA3AE', spk: '#C2463E',
  npn: '#D8443B', pnp: '#3FA453', photo: '#2A2F36', ledred: '#E0453F', ledgreen: '#38B26A',
  pot: '#3FA453', meter: '#2B3138', motor: '#AEB6BF', obj: '#7A8796',
};
const JUMPER_COLOR = { red: '#D13B33', black: '#22262B', blue: '#2F6FD6' };
const MATERIALS = {
  materials: [['semmi (levegő)', 1e12], ['alufólia', 0.1], ['ceruzabél', 300], ['sós víz', 2000], ['csapvíz', 20000], ['a kezed', 3e5], ['papír', 1e12], ['műanyag', 1e12]],
  water: [['száraz pohár', 1e12], ['csapvíz a pohárban', 5e4], ['sós víz a pohárban', 5e3]],
};

function partColor(def) {
  if (def.kind === 'led') return def.color === 'green' ? COLORS.ledgreen : COLORS.ledred;
  return COLORS[def.kind] || '#888';
}

// Egy elhelyezés rajza. Visszaad: {g, flows:[{pts, id, kind, term}], glow:[], cap:[]}
function drawPart(parent, pl, level, contacts, opts) {
  const def = P[pl.p]; const geo = E.geometry(pl); const id = pl.id || pl.p;
  const o = lvOff(level);
  const g = svgEl('g', { 'data-id': id, class: 'part', style: 'cursor:pointer' }, parent);
  const pts = geo.snaps.map((s) => [px(s.c) + o, py(s.r) + o]);
  const out = { g, id, def, flows: [], glows: [], pl, level };
  const shadow = level > 1 ? 'drop-shadow(2px 3px 2px rgba(0,0,0,.28))' : 'drop-shadow(1px 1px 1px rgba(0,0,0,.18))';
  g.style.filter = shadow;

  if (def.kind === 'jumper') {
    const [a, b] = geo.snaps; const ca = contacts[0], cb = contacts[1];
    const ha = ca ? ca.top : 1, hb = cb ? cb.top : 1;
    const x1 = px(a.c) + lvOff(ha), y1 = py(a.r) + lvOff(ha), x2 = px(b.c) + lvOff(hb), y2 = py(b.r) + lvOff(hb);
    const mx = (x1 + x2) / 2, my = Math.max(y1, y2) + 70 + Math.abs(x2 - x1) * 0.12;
    const d = `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`;
    svgEl('path', { d, fill: 'none', stroke: JUMPER_COLOR[def.color], 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
    svgEl('path', { d, fill: 'none', stroke: 'rgba(255,255,255,.25)', 'stroke-width': 2, 'stroke-linecap': 'round' }, g);
    for (const [x, y] of [[x1, y1], [x2, y2]]) svgEl('circle', { cx: x, cy: y, r: 8, fill: JUMPER_COLOR[def.color], stroke: '#fff', 'stroke-width': 2 }, g);
    const samp = []; for (let i = 0; i <= 24; i++) { const t = i / 24, u = 1 - t; samp.push([u * u * u * x1 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x2, u * u * u * y1 + 3 * u * u * t * my + 3 * u * t * t * my + t * t * t * y2]); }
    out.flows.push({ pts: samp, src: 'wire', seg: 0 });
    return out;
  }

  if (def.kind === 'wire') {
    const [x1, y1] = pts[0], [x2, y2] = pts[pts.length - 1];
    if (pts.length === 1) {
      svgEl('circle', { cx: x1, cy: y1, r: 15, fill: COLORS.wire, stroke: '#1C3F86', 'stroke-width': 2 }, g);
    } else {
      svgEl('line', { x1, y1, x2, y2, stroke: '#1C3F86', 'stroke-width': 26, 'stroke-linecap': 'round' }, g);
      svgEl('line', { x1, y1, x2, y2, stroke: COLORS.wire, 'stroke-width': 22, 'stroke-linecap': 'round' }, g);
    }
    pts.forEach(([x, y], i) => {
      const con = contacts[i] && contacts[i].connected;
      svgEl('circle', { cx: x, cy: y, r: 8, fill: con === false ? '#6D8BCB' : '#D9DEE4', stroke: '#5C6670', 'stroke-width': 1.5 }, g);
    });
    if (pts.length > 1) {
      const t = svgEl('text', { x: (pts[0][0] + pts[1][0]) / 2, y: (pts[0][1] + pts[1][1]) / 2 + 4, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: '#fff', 'font-family': 'var(--font-body)' }, g);
      t.textContent = def.n;
    }
    const cs = contacts.map((c, i) => (c.connected ? i : -1)).filter((i) => i >= 0);
    for (let j = 1; j < cs.length; j++) out.flows.push({ pts: [pts[cs[j - 1]], pts[cs[j]]], src: 'wire', seg: j - 1 });
    return out;
  }

  const col = partColor(def);
  if (def.kind === 'pot') {
    const ia = geo.snaps.findIndex((s) => s.term === 'a'), ib = geo.snaps.findIndex((s) => s.term === 'b'), iw = geo.snaps.findIndex((s) => s.term === 'w');
    const d = `M${pts[ia][0]},${pts[ia][1]} L${pts[ib][0]},${pts[ib][1]} L${pts[iw][0]},${pts[iw][1]} Z`;
    svgEl('path', { d, fill: col, stroke: 'rgba(0,0,0,.28)', 'stroke-width': 34, 'stroke-linejoin': 'round' }, g);
    svgEl('path', { d, fill: col, stroke: col, 'stroke-width': 30, 'stroke-linejoin': 'round' }, g);
    const cx = (pts[ia][0] + pts[ib][0] + pts[iw][0]) / 3, cy = (pts[ia][1] + pts[ib][1] + pts[iw][1]) / 3;
    svgEl('circle', { cx, cy, r: 15, fill: '#E9EEF2', stroke: '#2C6B3A', 'stroke-width': 2 }, g);
    const knob = svgEl('line', { x1: cx, y1: cy, x2: cx, y2: cy - 12, stroke: '#2C6B3A', 'stroke-width': 3.5, 'stroke-linecap': 'round' }, g);
    const t = svgEl('text', { x: (pts[ia][0] + pts[ib][0]) / 2, y: (pts[ia][1] + pts[ib][1]) / 2 + 4, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 800, fill: '#fff', 'font-family': 'var(--font-display)' }, g); t.textContent = 'RV';
    geo.snaps.forEach((s, i) => svgEl('circle', { cx: pts[i][0], cy: pts[i][1], r: 8, fill: '#D9DEE4', stroke: '#5C6670', 'stroke-width': 1.5 }, g));
    out.knob = { el: knob, cx, cy };
    out.flows.push({ pts: [pts[ia], [cx, cy], pts[iw]], src: 'Pa' });
    out.flows.push({ pts: [pts[iw], [cx, cy], pts[ib]], src: 'Pb' });
    return out;
  }
  if (def.kind === 'npn' || def.kind === 'pnp') {
    const d = `M${pts[0][0]},${pts[0][1]} L${pts[1][0]},${pts[1][1]} L${pts[2][0]},${pts[2][1]} Z`;
    svgEl('path', { d, fill: col, stroke: 'rgba(0,0,0,.28)', 'stroke-width': 34, 'stroke-linejoin': 'round' }, g);
    svgEl('path', { d, fill: col, stroke: col, 'stroke-width': 30, 'stroke-linejoin': 'round' }, g);
    const cx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3, cy = (pts[0][1] + pts[1][1] + pts[2][1]) / 3;
    const t = svgEl('text', { x: cx, y: cy + 2, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 800, fill: '#fff', 'font-family': 'var(--font-display)' }, g); t.textContent = def.short;
    const t2 = svgEl('text', { x: cx, y: cy + 16, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 700, fill: 'rgba(255,255,255,.85)' }, g); t2.textContent = def.kind.toUpperCase();
    geo.snaps.forEach((s, i) => {
      svgEl('circle', { cx: pts[i][0], cy: pts[i][1], r: 8, fill: '#D9DEE4', stroke: '#5C6670', 'stroke-width': 1.5 }, g);
      if (S.age === 'n') { const l = svgEl('text', { x: pts[i][0], y: pts[i][1] + 3.5, 'text-anchor': 'middle', 'font-size': 9, 'font-weight': 800, fill: '#333' }, g); l.textContent = s.term; }
    });
    const mid = [cx, cy];
    const iC = geo.snaps.findIndex((s) => s.term === 'C'), iE = geo.snaps.findIndex((s) => s.term === 'E'), iB = geo.snaps.findIndex((s) => s.term === 'B');
    out.flows.push({ pts: [pts[iC], mid, pts[iE]], src: 'C' });
    out.flows.push({ pts: [pts[iB], mid], src: 'B' });
    return out;
  }

  // két pólusú alkatrész
  const [x1, y1] = pts[0], [x2, y2] = pts[1];
  const ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  const len = Math.hypot(x2 - x1, y2 - y1);
  const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
  const body = svgEl('g', { transform: `translate(${cx},${cy}) rotate(${ang})` }, g);
  const W = len + 40, H = def.kind === 'bat' ? 50 : 40;
  if (def.kind === 'bat') {
    // a doboz a haladási irány jobb oldalára lóg ki (lefelé haladva jobbra): helyi koordinátában a negatív y felé
    const D = G * 0.95;
    svgEl('rect', { x: -W / 2, y: -D, width: W, height: D + 26, rx: 10, fill: COLORS.bat, stroke: '#5E6772', 'stroke-width': 2 }, body);
    for (const xx of [-W / 2 + 18, 4]) {
      svgEl('rect', { x: xx, y: -D + 10, width: W / 2 - 26, height: D * 0.55, rx: 8, fill: '#E8A33A', stroke: '#9A6418', 'stroke-width': 1.5 }, body);
    }
    const plus = svgEl('text', { x: -len / 2 + 24, y: 20, 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 800, fill: '#fff' }, body); plus.textContent = '+';
    const minus = svgEl('text', { x: len / 2 - 24, y: 20, 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 800, fill: '#fff' }, body); minus.textContent = '−';
    const lab = svgEl('text', { x: 0, y: 19, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 800, fill: '#fff', 'font-family': 'var(--font-display)' }, body); lab.textContent = 'B1 · 3 V';
  } else {
    svgEl('rect', { x: -W / 2, y: -H / 2, width: W, height: H, rx: 12, fill: col, stroke: 'rgba(0,0,0,.28)', 'stroke-width': 2 }, body);
    const ink = def.kind === 'res' ? '#3B2A00' : '#fff';
    const sym = svgEl('g', { stroke: ink, fill: 'none', 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, body);
    const flipText = Math.abs(ang) > 90;
    const label = (txt, y, size, weight) => {
      const t = svgEl('text', { x: 0, y, 'text-anchor': 'middle', 'font-size': size, 'font-weight': weight || 800, fill: ink, 'font-family': 'var(--font-display)', transform: flipText ? `rotate(180 0 ${y - size / 3})` : '' }, body);
      t.textContent = txt; return t;
    };
    switch (def.kind) {
      case 'res':
        svgEl('path', { d: 'M-34,6 L-24,6 L-20,-2 L-14,14 L-8,-2 L-2,14 L4,-2 L10,14 L16,-2 L20,6 L34,6' }, sym);
        label(def.short, -6, 13); label(def.name.split(' ').slice(0, 2).join(' '), 18, 9, 700);
        break;
      case 'led': {
        svgEl('path', { d: 'M-30,0 L-10,0 M10,0 L30,0 M-10,-10 L-10,10 L10,0 Z M10,-10 L10,10' }, sym);
        svgEl('path', { d: 'M2,-14 L8,-20 M8,-14 L14,-20' }, sym);
        const pl2 = svgEl('text', { x: -len / 2 + 2, y: -6, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 800, fill: '#fff' }, body); pl2.textContent = '+';
        const glow = svgEl('circle', { cx: 0, cy: 0, r: 30, fill: def.color === 'green' ? '#7CFFAE' : '#FF8A70', opacity: 0, style: 'mix-blend-mode:screen' }, body);
        const lens = svgEl('circle', { cx: 0, cy: 0, r: 8, fill: def.color === 'green' ? '#C8FFD9' : '#FFD2C8', opacity: 0 }, body);
        out.glows.push({ el: glow, lens, type: 'led' });
        const t = label(def.short, 17, 11); t.setAttribute('font-size', 11);
        break;
      }
      case 'sw': {
        if (def.mode === 'press') { svgEl('path', { d: 'M-30,6 L-12,6 M12,6 L30,6 M-12,6 L12,6', class: 'swblade' }, sym); svgEl('path', { d: 'M0,6 L0,-10 M-8,-10 L8,-10' }, sym); }
        else { svgEl('path', { d: 'M-30,6 L-12,6 M12,6 L30,6' }, sym); svgEl('path', { d: 'M-12,6 L12,-6', class: 'swblade' }, sym); }
        label(def.short, 20, 11);
        out.isSwitch = true;
        break;
      }
      case 'cap': {
        svgEl('path', { d: 'M-30,0 L-5,0 M5,0 L30,0 M-5,-12 L-5,12 M5,-12 L5,12' }, sym);
        if (def.C >= 1e-6) { const pl3 = svgEl('text', { x: -14, y: -8, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 800, fill: '#fff' }, body); pl3.textContent = '+'; }
        const bar = svgEl('rect', { x: -W / 2 + 6, y: H / 2 - 7, width: 0, height: 4, rx: 2, fill: 'var(--spark)' }, body);
        out.capBar = { el: bar, w: W - 12 };
        label(def.short + ' · ' + def.name.split(' ')[0] + ' ' + def.name.split(' ')[1], -9 + 25, 9, 700);
        break;
      }
      case 'photo': {
        svgEl('circle', { cx: 0, cy: 0, r: 9, fill: '#55606B' }, body);
        svgEl('path', { d: 'M-30,0 L-9,0 M9,0 L30,0' }, sym);
        const pl4 = svgEl('text', { x: -len / 2 + 2, y: -6, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 800, fill: '#fff' }, body); pl4.textContent = '+';
        label(def.short, 17, 11);
        const shade = svgEl('circle', { cx: 0, cy: 0, r: 26, fill: '#000', opacity: 0 }, body);
        out.glows.push({ el: shade, type: 'shade' });
        break;
      }
      case 'lamp': {
        svgEl('circle', { cx: 0, cy: 0, r: 13, fill: '#EEF0F2', stroke: '#6B737C', 'stroke-width': 2 }, body);
        const glow = svgEl('circle', { cx: 0, cy: 0, r: 34, fill: '#FFE07A', opacity: 0, style: 'mix-blend-mode:screen' }, body);
        out.glows.push({ el: glow, type: 'lamp' });
        label(def.short, 18, 10);
        break;
      }
      case 'meter': {
        label('M6', 17, 10);
        // a számlap nem forog a testtel: képernyő-koordinátában rajzoljuk
        const dial = svgEl('g', { transform: `translate(${cx},${cy})` }, g);
        svgEl('path', { d: 'M-15,4 A16,16 0 0 1 15,4', fill: '#F4F1E6', stroke: '#9AA3AE', 'stroke-width': 1.5 }, dial);
        svgEl('path', { d: 'M-15,4 A16,16 0 0 1 15,4 Z', fill: '#F4F1E6' }, dial);
        const needle = svgEl('line', { x1: 0, y1: 4, x2: 0, y2: -11, stroke: '#C2413A', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, dial);
        svgEl('circle', { cx: 0, cy: 4, r: 2.4, fill: '#333' }, dial);
        const pm = svgEl('text', { x: -len / 2 + 2, y: -6, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 800, fill: '#fff' }, body); pm.textContent = '+';
        out.meter = { needle };
        break;
      }
      case 'motor': {
        svgEl('circle', { cx: 0, cy: 0, r: 15, fill: '#E3E7EB', stroke: '#6B737C', 'stroke-width': 2 }, body);
        const pm = svgEl('text', { x: -len / 2 + 2, y: -6, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 800, fill: '#333' }, body); pm.textContent = '+';
        const fan = svgEl('g', { transform: `translate(${cx},${cy})` }, g);
        const blades = svgEl('g', {}, fan);
        for (let k = 0; k < 3; k++) svgEl('path', { d: 'M0,0 C6,-8 6,-22 0,-27 C-6,-22 -6,-8 0,0 Z', fill: 'rgba(63,164,83,.82)', stroke: '#2C6B3A', 'stroke-width': 1, transform: `rotate(${k * 120})` }, blades);
        svgEl('circle', { cx: 0, cy: 0, r: 4, fill: '#2C6B3A' }, fan);
        out.fan = { el: blades, a: 0 };
        break;
      }
      case 'obj': {
        body.firstChild && body.removeChild(body.firstChild);
        svgEl('rect', { x: -W / 2, y: -H / 2, width: W, height: H, rx: 14, fill: 'var(--surface)', 'fill-opacity': 0.75, stroke: 'var(--muted)', 'stroke-width': 2, 'stroke-dasharray': '6 5' }, body);
        const t = svgEl('text', { x: cx, y: cy + 5, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 800, fill: 'var(--ink)', 'font-family': 'var(--font-display)' }, g);
        t.textContent = '?';
        out.objLabel = t;
        break;
      }
      case 'spk': {
        svgEl('circle', { cx: 0, cy: 0, r: 14, fill: '#2A2F36' }, body);
        for (let i = -8; i <= 8; i += 4) svgEl('line', { x1: i, y1: -10, x2: i, y2: 10, stroke: '#666', 'stroke-width': 1.4 }, body);
        const ring = svgEl('circle', { cx: 0, cy: 0, r: 20, fill: 'none', stroke: 'var(--spark)', 'stroke-width': 3, opacity: 0 }, body);
        out.glows.push({ el: ring, type: 'spk' });
        const t = label('SP', -16 + 33, 10); t.setAttribute('fill', '#fff');
        break;
      }
    }
  }
  pts.forEach(([x, y]) => svgEl('circle', { cx: x, cy: y, r: 8, fill: '#D9DEE4', stroke: '#5C6670', 'stroke-width': 1.5 }, g));
  out.flows.push({ pts: [pts[0], pts[1]], src: 'ab' });
  return out;
}

// ---------- rács rajzolása ----------
const board = $('#board');
let R = null; // aktuális rajz

function drawBoard(layout, opts) {
  opts = opts || {};
  board.innerHTML = '';
  const hasJ = layout.some((p) => P[p.p].kind === 'jumper');
  const W = OX * 2 + 9 * G + 10, H = OY * 2 + 6 * G + (hasJ ? 70 : 14);
  board.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const defs = svgEl('defs', {}, board);
  defs.innerHTML = '<radialGradient id="gl"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>';
  svgEl('rect', { x: 8, y: 8, width: W - 16, height: H - 16, rx: 18, fill: 'var(--board)', stroke: 'var(--board-edge)', 'stroke-width': 2 }, board);
  const grid = svgEl('g', {}, board);
  for (let c = 1; c <= 10; c++) {
    svgEl('line', { x1: px(c), y1: py(0) - 22, x2: px(c), y2: py(6) + 22, stroke: 'var(--board-edge)', 'stroke-width': 1 }, grid);
    const t = svgEl('text', { x: px(c), y: 26, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: 'var(--label)' }, grid); t.textContent = c;
  }
  for (let r = 0; r < 7; r++) {
    svgEl('line', { x1: px(1) - 22, y1: py(r), x2: px(10) + 22, y2: py(r), stroke: 'var(--board-edge)', 'stroke-width': 1 }, grid);
    const t = svgEl('text', { x: 22, y: py(r) + 5, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: 'var(--label)' }, grid); t.textContent = E.ROWS[r];
  }
  const posts = svgEl('g', {}, board);
  for (let r = 0; r < 7; r++) for (let c = 1; c <= 10; c++) svgEl('circle', { cx: px(c), cy: py(r), r: 4.5, fill: 'var(--post)', 'data-post': E.ROWS[r] + c }, posts);

  const upto = opts.upto != null ? opts.upto : layout.length - 1;
  const shown = layout.slice(0, upto + 1);
  const chk = E.checkBuild(shown);
  const partsG = svgEl('g', {}, board);
  const items = [];
  // szint szerint rajzolunk, az átkötő kábelek a végén
  const order = shown.map((pl, i) => i).sort((a, b) => {
    const la = P[shown[a].p].kind === 'jumper' ? 99 : chk.levels[a], lb = P[shown[b].p].kind === 'jumper' ? 99 : chk.levels[b];
    return la - lb || a - b;
  });
  for (const i of order) {
    const it = drawPart(partsG, shown[i], chk.levels[i], chk.contacts[i], opts);
    it.index = i;
    if (opts.highlight === i) it.g.classList.add('hl');
    if (opts.dimBefore != null && i < opts.dimBefore) it.g.style.opacity = 0.72;
    // szintjelző a manuálhoz hasonlóan
    if (opts.showLevels && P[shown[i].p].kind !== 'jumper') {
      const geo = E.geometry(shown[i]); const s = geo.snaps[0]; const o = lvOff(chk.levels[i]);
      const bx = px(s.c) + o + 13, by = py(s.r) + o - 13;
      svgEl('circle', { cx: bx, cy: by, r: 9, fill: 'var(--ink)' }, it.g);
      const t = svgEl('text', { x: bx, y: by + 4, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 800, fill: 'var(--surface)' }, it.g); t.textContent = chk.levels[i];
    }
    items[i] = it;
  }
  // kiemelés gyűrű az aktuális lépésnél
  if (opts.highlight != null && items[opts.highlight]) {
    const bb = items[opts.highlight].g.getBBox();
    const ring = svgEl('rect', { x: bb.x - 8, y: bb.y - 8, width: bb.width + 16, height: bb.height + 16, rx: 16, fill: 'none', stroke: 'var(--spark)', 'stroke-width': 4, 'stroke-dasharray': '10 7', class: 'hl' }, board);
    ring.style.pointerEvents = 'none';
  }
  const flowG = svgEl('g', { 'pointer-events': 'none' }, board);
  const tipG = svgEl('g', { 'pointer-events': 'none' }, board);
  R = { items, flowG, tipG, layout: shown, chk, flows: [] };
  // pöttyök az áramhoz
  for (const it of items) {
    if (!it) continue;
    for (const f of it.flows) {
      let L = 0; const segs = [];
      for (let k = 1; k < f.pts.length; k++) { const d = Math.hypot(f.pts[k][0] - f.pts[k - 1][0], f.pts[k][1] - f.pts[k - 1][1]); segs.push(d); L += d; }
      const n = Math.max(1, Math.round(L / 24));
      const dots = []; for (let k = 0; k < n; k++) dots.push(svgEl('circle', { r: 3.6, fill: 'var(--spark)', stroke: 'rgba(60,40,0,.55)', 'stroke-width': 1, opacity: 0 }, flowG));
      R.flows.push({ it, f, L, segs, dots, phase: Math.random() * 24 });
    }
  }
  // érintőkapcsoló: a rajzon az ujj helyét is lehet nyomva tartani
  const ex = EXPS[S.exp]; const tc = ex.controls.find((c) => c && c.touch);
  if (tc && S.stage >= 3) for (const it of items) {
    if (!it || it.def.kind !== 'obj') continue;
    const down = (e) => { e.preventDefault(); if (S.sim) { S.sim.obj[tc.touch] = tc.R; S.ctl.objName[tc.touch] = 'ujj'; } };
    const up = () => { if (S.sim) { S.sim.obj[tc.touch] = 1e12; S.ctl.objName[tc.touch] = 'érintsd'; } };
    it.g.addEventListener('pointerdown', down); it.g.addEventListener('pointerup', up); it.g.addEventListener('pointerleave', up);
  }
  // koppintás
  partsG.addEventListener('click', onPartClick);
  posts.addEventListener('click', onPostClick);
  return R;
}

function pointAt(fl, s) {
  s = ((s % fl.L) + fl.L) % fl.L;
  const pts = fl.f.pts;
  for (let k = 0; k < fl.segs.length; k++) {
    if (s <= fl.segs[k] || k === fl.segs.length - 1) { const t = fl.segs[k] ? s / fl.segs[k] : 0; return [pts[k][0] + (pts[k + 1][0] - pts[k][0]) * t, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * t]; }
    s -= fl.segs[k];
  }
  return pts[0];
}

// ---------- szimuláció ----------
function currentLayout() {
  const ex = EXPS[S.exp]; let lay = ex.layout;
  for (const v of ex.variants) if (S.variants[v.id]) lay = applyVariant(v, lay);
  return lay;
}
function startSim() {
  const ex = EXPS[S.exp]; const lay = currentLayout();
  const prevSw = S.sim ? { ...S.sim.switches } : null;
  S.sim = new E.Sim(lay, { light: S.light, pot: S.ctl.pot, meter: S.ctl.meter, obj: S.ctl.obj });
  S.simLayout = lay;
  if (prevSw) for (const k in S.sim.switches) if (k in prevSw) S.sim.switches[k] = prevSw[k];
  S.wc = null;
  S.posts = new Map();
  S.sim.nl.chk.contacts.forEach((cs) => cs.forEach((s) => { if (s.connected) S.posts.set(E.ROWS[s.r] + s.c, S.sim.nl.postNet(s.r, s.c)); }));
}

function curOf(fl) {
  const sim = S.sim; const it = fl.it; const id = it.id;
  if (fl.f.src === 'wire') { const w = S.wc && S.wc.get(it.index); return w ? (w[fl.f.seg] || 0) : 0; }
  const c = sim.cur[id];
  if (fl.f.src === 'C') return c ? c.C : 0;
  if (fl.f.src === 'B') return c ? c.B : 0;
  if (fl.f.src === 'Pa') return c ? c.a : 0;
  if (fl.f.src === 'Pb') return c ? -c.b : 0;
  return typeof c === 'number' ? c : 0;
}

let last = 0, fcount = 0;
function frame(ts) {
  fcount++;
  const dtR = Math.min(0.05, (ts - (last || ts)) / 1000); last = ts;
  const live = S.stage >= 3 && S.sim;
  if (live) {
    const ex = EXPS[S.exp];
    S.sim.light = S.light;
    const simT = dtR * ex.sim.scale;
    let n = Math.min(400, Math.max(1, Math.round(simT / ex.sim.dt)));
    const dt = simT / n;
    // időkeret: ha a számítás nem fér bele egy képkockába, a szimuláció inkább lemarad, de a felület nem fagy be
    const t0 = performance.now();
    if (dt > 0) for (let i = 0; i < n; i++) { S.sim.step(dt); if (performance.now() - t0 > 12) break; }
    S.wc = S.sim.wireCurrents();
    audioFrame(dtR);
  }
  if (R) {
    for (const fl of R.flows) {
      let I = live ? curOf(fl) : 0;
      const a = Math.abs(I);
      let v = 0;
      if (a > 2e-5) v = Math.sign(I) * Math.min(190, 38 * Math.log10(a / 2e-5));
      fl.phase += v * dtR;
      const show = a > 2e-5;
      const n = fl.dots.length; const sp = fl.L / n;
      for (let k = 0; k < n; k++) {
        const d = fl.dots[k];
        if (!show) { d.setAttribute('opacity', 0); continue; }
        const p = pointAt(fl, fl.phase + k * sp);
        d.setAttribute('cx', p[0].toFixed(1)); d.setAttribute('cy', p[1].toFixed(1)); d.setAttribute('opacity', 1);
      }
    }
    for (const it of R.items) {
      if (!it) continue;
      const c = live ? S.sim.cur[it.id] : 0;
      for (const gl of it.glows) {
        if (gl.type === 'led') { const a = Math.abs(c || 0); const b = a > 1e-5 && c > 0 ? Math.min(1, Math.log10(a / 1e-5) / 3) : 0; gl.el.setAttribute('opacity', (b * 0.85).toFixed(2)); gl.lens.setAttribute('opacity', b.toFixed(2)); }
        else if (gl.type === 'lamp') { const b = Math.min(1, Math.abs(c || 0) / 0.15); gl.el.setAttribute('opacity', (b * 0.9).toFixed(2)); }
        else if (gl.type === 'spk') { const b = Math.min(1, Math.abs(c || 0) / 0.02); gl.el.setAttribute('opacity', (b * 0.9).toFixed(2)); gl.el.setAttribute('r', 18 + b * 8); }
        else if (gl.type === 'shade') { gl.el.setAttribute('opacity', ((1 - S.light) * 0.75).toFixed(2)); }
      }
      if (it.knob) { const pv = live ? S.sim.pot[it.id] : (S.ctl.pot[it.id] != null ? S.ctl.pot[it.id] : 0.5); const an = (-135 + 270 * pv) * Math.PI / 180; it.knob.el.setAttribute('x2', (it.knob.cx + 12 * Math.sin(an)).toFixed(1)); it.knob.el.setAttribute('y2', (it.knob.cy - 12 * Math.cos(an)).toFixed(1)); }
      if (it.meter) { const fr = live ? S.sim.meterReading(it.id).frac : 0; const an = Math.max(-0.08, Math.min(1.08, fr)) * 110 - 55; it.meter.needle.setAttribute('transform', `rotate(${an.toFixed(1)} 0 4)`); it.meter.needle.setAttribute('stroke', Math.abs(fr) > 1.05 ? '#E0201A' : '#C2413A'); }
      if (it.fan) { const w = live ? S.sim.motor[it.id].w : 0; it.fan.a += Math.sign(w) * Math.min(Math.abs(w), 300) * 0.06 * dtR * 57.3; it.fan.el.setAttribute('transform', `rotate(${(it.fan.a % 360).toFixed(1)})`); it.fan.el.style.opacity = Math.abs(w) > 150 ? 0.55 : 1; }
      if (it.objLabel) { const nm = S.ctl.objName[it.id] || '?'; if (it.objLabel.textContent !== nm) it.objLabel.textContent = nm; }
      if (it.capBar) { const vC = live ? S.sim.capV[it.id] || 0 : 0; it.capBar.el.setAttribute('width', (Math.min(1, Math.abs(vC) / 3) * it.capBar.w).toFixed(1)); }
      if (it.isSwitch) {
        const on = live ? !!S.sim.switches[it.id] : false;
        const blade = it.g.querySelector('.swblade');
        if (blade) blade.setAttribute('d', it.def.mode === 'press' ? (on ? 'M-30,6 L-12,6 M12,6 L30,6 M-12,6 L12,6' : 'M-30,6 L-12,6 M12,6 L30,6 M-12,-2 L12,-2') : (on ? 'M-30,6 L-12,6 M12,6 L30,6 M-12,6 L12,6' : 'M-30,6 L-12,6 M12,6 L30,6 M-12,6 L12,-6'));
      }
    }
    if (live && fcount % 6 === 0) { updateMeters(); updateMeterRead(); }
  }
  requestAnimationFrame(frame);
}

// ---------- hang ----------
// Módok: 'loop' – a hangszóró szimulált áramából egy periódus, ismételve;
// 'clicks' – kattanás a hangszóró áramának ugrásainál (élő szimulációból);
// 'table' / 'siren' – a frekvencia egy előre kiszimulált táblázatból (gomb állása / vezérlőfeszültség szerint).
function audioCfg() { return EXPS[S.exp].audio || { type: 'loop', probe: 'SP' }; }
function ensureAC() {
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
  if (!S.ac) { try { S.ac = new AC(); } catch (e) { return null; } }
  if (S.ac.state === 'suspended') S.ac.resume().catch(() => {});
  return S.ac;
}
const tick0 = () => new Promise((r) => setTimeout(r, 0));
async function buildLoop() {
  const lay = currentLayout(); const sr = S.ac.sampleRate; const dt = 1 / sr;
  const sim = new E.Sim(lay, { pot: S.ctl.pot }); sim.switches.S1 = true;
  const total = Math.round(sr * 0.045); const samples = new Float32Array(total);
  for (let i = 0; i < total; i++) { sim.step(dt); samples[i] = sim.cur.SP || 0; if (i % 600 === 0) await tick0(); }
  const tail = samples.subarray(Math.round(sr * 0.02)); let m = 0; for (const x of tail) m += x; m /= tail.length;
  const cr = []; for (let i = 1; i < tail.length; i++) if (tail[i - 1] < m && tail[i] >= m) cr.push(i);
  if (cr.length < 3) return null;
  const a = cr[0], b = cr[cr.length - 1]; let mx = 0; for (let i = a; i < b; i++) mx = Math.max(mx, Math.abs(tail[i] - m));
  const buf = S.ac.createBuffer(1, b - a, sr); const ch = buf.getChannelData(0);
  for (let i = 0; i < b - a; i++) ch[i] = ((tail[a + i] - m) / (mx || 1)) * 0.5;
  return { buf, freq: sr * (cr.length - 1) / (b - a) };
}
async function measureFreq(lay, opts, prep) {
  const sim = new E.Sim(lay, opts); sim.switches.S1 = true; if (prep) prep(sim);
  const dt = 1 / 48000, n = Math.round(0.03 / dt); let on = false; const edges = [];
  for (let i = 0; i < n; i++) {
    sim.step(dt); const now = Math.abs(sim.cur.SP || 0) > 0.01; if (now && !on) edges.push(sim.time); on = now;
    if (i % 400 === 0) await tick0();
  }
  return edges.length > 3 ? (edges.length - 2) / (edges[edges.length - 1] - edges[1]) : 0;
}
async function buildTable(cfg) {
  const lay = currentLayout(); const key = cfg.type + JSON.stringify(lay);
  S.tables = S.tables || {}; if (S.tables[key]) return S.tables[key];
  const tbl = [];
  for (const x of cfg.grid) {
    let f;
    if (cfg.type === 'table') f = await measureFreq(lay, { pot: { ...S.ctl.pot, [cfg.id]: x } }, (sim) => { for (const k of cfg.press) sim.switches[k] = true; });
    else f = await measureFreq(lay.map((p) => ((p.id || p.p) === cfg.cap ? { ...p, p: 'CBIG', id: cfg.cap } : p)), { capInit: { [cfg.cap]: x } });
    tbl.push([x, f]);
  }
  S.tables[key] = tbl; return tbl;
}
function interp(tbl, x) {
  if (x <= tbl[0][0]) return tbl[0][1];
  for (let i = 1; i < tbl.length; i++) if (x <= tbl[i][0]) { const [x0, y0] = tbl[i - 1], [x1, y1] = tbl[i]; if (!y0 || !y1) return x - x0 < x1 - x ? y0 : y1; return y0 + (y1 - y0) * (x - x0) / (x1 - x0); }
  return tbl[tbl.length - 1][1];
}
function stopAudio() {
  if (S.audio && S.audio.src) { try { S.audio.src.stop(); } catch (e) { /* már leállt */ } S.audio.src = null; }
  if (S.audioNode && S.audioNode.osc) { try { S.audioNode.osc.stop(); } catch (e) { /* már leállt */ } }
  S.audioNode = null;
}
async function setSound(on) {
  S.soundOn = on; stopAudio();
  if (!on) { renderControls(); return; }
  const ac = ensureAC(); if (!ac) { S.soundOn = false; renderControls(); return; }
  const cfg = audioCfg();
  if (cfg.type === 'loop') {
    if (!S.audio || S.audio.key !== JSON.stringify(currentLayout())) {
      S.audioBusy = true; renderControls();
      const res = await buildLoop(); S.audioBusy = false;
      if (!res) { S.soundOn = false; renderControls(); return; }
      S.audio = { key: JSON.stringify(currentLayout()), ...res };
    }
    if (!S.soundOn) return;
    const src = ac.createBufferSource(); src.buffer = S.audio.buf; src.loop = true;
    const gain = ac.createGain(); src.connect(gain).connect(ac.destination);
    src.start(); S.audio.src = src; S.audio.gain = gain; syncSoundGate();
  } else if (cfg.type === 'clicks') {
    S.audioNode = { type: 'clicks' }; S.lastI = null;
  } else {
    S.audioBusy = true; renderControls();
    const tbl = await buildTable(cfg); S.audioBusy = false;
    if (!S.soundOn) { renderControls(); return; }
    const osc = ac.createOscillator(); osc.type = 'square';
    const g = ac.createGain(); g.gain.value = 0; osc.connect(g).connect(ac.destination); osc.start();
    S.audioNode = { type: cfg.type, osc, gain: g, tbl };
  }
  renderControls();
}
function syncSoundGate() { if (S.audio && S.audio.gain) S.audio.gain.gain.value = S.sim && S.sim.switches.S1 ? 0.35 : 0; }
function playClick() {
  const ac = S.ac; if (!ac) return;
  if (!S.clickBuf) {
    const n = Math.round(ac.sampleRate * 0.025); S.clickBuf = ac.createBuffer(1, n, ac.sampleRate); const ch = S.clickBuf.getChannelData(0);
    for (let i = 0; i < n; i++) ch[i] = Math.sin(i / ac.sampleRate * 2 * Math.PI * 1800) * Math.exp(-i / (n / 6)) * 0.6;
  }
  const src = ac.createBufferSource(); src.buffer = S.clickBuf; src.connect(ac.destination); src.start();
}
// képkockánként: a sziréna vezérlőkondenzátora és a hang követése
function audioFrame(dtR) {
  const sim = S.sim; if (!sim) return; const cfg = audioCfg();
  if (cfg.type === 'siren') {
    // a C5 egyszerűsített, valós idejű modellje (a teljes kapcsolás hangfrekvencián nem számolható valós időben):
    // töltés a gombon és az R4-en át, kisülés a bázisellenálláson át (a bázis nagyjából az idő felében vezet)
    const press = sim.switches.S1 && sim.switches.S2; let v = S.vc || 0;
    const iIn = press ? (3 - v) / cfg.R : 0; const iOut = v > 0.65 ? (v - 0.65) / cfg.Rb * 0.5 : 0;
    v += (iIn - iOut) / cfg.C * dtR; S.vc = Math.max(0, Math.min(3, v));
    sim.capV[cfg.cap] = S.vc;
  }
  const n = S.audioNode; if (!n || !S.soundOn) return;
  if (n.type === 'clicks') { const I = sim.cur[cfg.probe] || 0; if (S.lastI != null && Math.abs(I - S.lastI) > 0.004) playClick(); S.lastI = I; return; }
  const x = n.type === 'table' ? sim.pot[cfg.id] : S.vc;
  const f = interp(n.tbl, x);
  const gate = sim.switches.S1 && f > 0 && (n.type === 'siren' || cfg.press.every((k) => sim.switches[k]));
  const t = S.ac.currentTime;
  n.osc.frequency.setTargetAtTime(Math.max(40, f || 40), t, 0.015);
  n.gain.gain.setTargetAtTime(gate ? 0.1 : 0, t, 0.01);
}

// ---------- vezérlők a rács alatt ----------
function renderControls() {
  const box = $('#ctrls'); box.innerHTML = '';
  const ex = EXPS[S.exp];
  const live = S.stage >= 3;
  const status = $('#status'); status.innerHTML = '';
  S.meterRead = null;
  if (live) {
    const p = document.createElement('span'); p.className = 'pill live'; p.textContent = 'Élő szimuláció'; status.append(p);
    if (ex.slow) { const q = document.createElement('span'); q.className = 'pill slow'; q.textContent = ex.slow + '× lassítva'; status.append(q); }
  } else if (S.stage === 1) {
    const p = document.createElement('span'); p.className = 'pill'; p.textContent = (S.step + 1) + '. lépés';
    status.append(p);
  }
  if (S.stage === 1) {
    const lay = ex.layout; const i = Math.min(S.step, lay.length - 1); const chk = E.checkBuild(lay);
    const w = document.createElement('div'); w.className = 'buildbar';
    const t = document.createElement('p'); t.textContent = (i + 1) + '/' + lay.length + '. ' + stepText(lay[i], chk.levels[i], lay);
    const prev = document.createElement('button'); prev.className = 'btn'; prev.textContent = 'Vissza';
    prev.onclick = () => { if (S.step > 0) { S.step--; refreshBoard(); renderPanel(); renderControls(); } else goStage(0); };
    const nx = document.createElement('button'); nx.className = 'btn primary'; nx.textContent = i < lay.length - 1 ? 'Következő' : 'Kész!';
    nx.onclick = () => { if (i < lay.length - 1) { S.step++; refreshBoard(); renderPanel(); renderControls(); } else goStage(2); };
    const row = document.createElement('div'); row.className = 'navrow'; row.append(prev, nx);
    w.append(t, row); box.append(w);
  }
  if (!live) { const n = document.createElement('p'); n.className = 'note wideonly'; n.style.margin = '0'; n.textContent = 'A „Próbáld ki” lépésben az áramkör életre kel: kapcsolhatod, és látod, merre folyik az áram.'; box.append(n); return; }
  for (const c of ex.controls) {
    if (c === 'S1') {
      const b = document.createElement('button'); b.className = 'ctrl'; b.setAttribute('aria-pressed', String(!!(S.sim && S.sim.switches.S1)));
      b.innerHTML = '<span class="knob"></span> S1 kapcsoló';
      b.onclick = () => { S.sim.switches.S1 = !S.sim.switches.S1; b.setAttribute('aria-pressed', String(S.sim.switches.S1)); syncSoundGate(); };
      box.append(b);
    } else if (c === 'S2') {
      const b = document.createElement('button'); b.className = 'ctrl hold';
      b.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="12" r="3.5" fill="currentColor"/></svg> S2 gomb: nyomd és tartsd';
      const down = (e) => { e.preventDefault(); S.sim.switches.S2 = true; b.classList.add('down'); };
      const up = () => { if (S.sim) S.sim.switches.S2 = false; b.classList.remove('down'); };
      b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
      b.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') down(e); });
      b.addEventListener('keyup', up);
      box.append(b);
    } else if (c === 'light') {
      const w = document.createElement('div'); w.className = 'lightctl';
      w.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" fill="currentColor"/></svg><label for="light">Fény</label><input id="light" type="range" min="0" max="1" step="0.01"><svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="var(--spark)"/><g stroke="var(--spark)" stroke-width="2" stroke-linecap="round"><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></g></svg>';
      const inp = w.querySelector('input'); inp.value = S.light; inp.oninput = () => { S.light = +inp.value; };
      box.append(w);
      const cover = document.createElement('button'); cover.className = 'ctrl hold'; cover.textContent = 'Takard le a szemet (Q4)';
      let keep = S.light;
      const down = (e) => { e.preventDefault(); keep = S.light; S.light = 0; inp.value = 0; cover.classList.add('down'); };
      const up = () => { if (cover.classList.contains('down')) { S.light = keep; inp.value = keep; cover.classList.remove('down'); } };
      cover.addEventListener('pointerdown', down); cover.addEventListener('pointerup', up); cover.addEventListener('pointerleave', up); cover.addEventListener('pointercancel', up);
      box.append(cover);
    } else if (typeof c === 'object' && c.press) {
      const b = document.createElement('button'); b.className = 'ctrl hold';
      b.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="12" r="3.5" fill="currentColor"/></svg> <span></span>';
      b.querySelector('span').textContent = c.label || c.press;
      const down = (e) => { e.preventDefault(); S.sim.switches[c.press] = true; b.classList.add('down'); };
      const up = () => { if (S.sim) S.sim.switches[c.press] = false; b.classList.remove('down'); };
      b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
      b.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') down(e); });
      b.addEventListener('keyup', up);
      box.append(b);
    } else if (typeof c === 'object' && c.pot) {
      const w = document.createElement('div'); w.className = 'lightctl';
      const id = 'pot-' + c.pot;
      w.innerHTML = '<label for="' + id + '"></label><input id="' + id + '" type="range" min="0" max="1" step="0.005">';
      w.querySelector('label').textContent = c.label || c.pot;
      const inp = w.querySelector('input'); const cur = S.sim.pot[c.pot];
      inp.value = c.invert ? 1 - cur : cur;
      inp.oninput = () => { const v = +inp.value; S.ctl.pot[c.pot] = S.sim.pot[c.pot] = c.invert ? 1 - v : v; };
      box.append(w);
    } else if (typeof c === 'object' && c.meter) {
      const w = document.createElement('div'); w.className = 'meterctl';
      const lab = document.createElement('span'); lab.className = 'mlabel'; lab.textContent = 'Műszer (M6):';
      const seg = document.createElement('div'); seg.className = 'seg';
      for (const rg of Object.keys(E.METER)) {
        const b = document.createElement('button'); b.textContent = E.METER[rg].label; b.setAttribute('aria-pressed', String(S.sim.meter[c.meter] === rg));
        b.onclick = () => { S.ctl.meter[c.meter] = S.sim.meter[c.meter] = rg; renderControls(); };
        seg.append(b);
      }
      const read = document.createElement('b'); read.className = 'mread'; S.meterRead = { el: read, id: c.meter };
      w.append(lab, seg, read); box.append(w);
    } else if (typeof c === 'object' && c.spin) {
      for (const [txt, dir] of [['Pörgesd meg!', 1], ['Visszafelé', -1]]) {
        const b = document.createElement('button'); b.className = 'ctrl hold'; b.textContent = txt;
        const down = (e) => { e.preventDefault(); S.sim.motor[c.spin].hand = dir; b.classList.add('down'); };
        const up = () => { if (S.sim) S.sim.motor[c.spin].hand = 0; b.classList.remove('down'); };
        b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
        box.append(b);
      }
    } else if (typeof c === 'object' && c.obj) {
      const w = document.createElement('div'); w.className = 'chips';
      for (const [name, R] of MATERIALS[c.set]) {
        const b = document.createElement('button'); b.className = 'mini'; b.textContent = name;
        b.setAttribute('aria-pressed', String(S.ctl.objName[c.obj] === name));
        b.onclick = () => { S.ctl.obj[c.obj] = S.sim.obj[c.obj] = R; S.ctl.objName[c.obj] = name; renderControls(); };
        w.append(b);
      }
      box.append(w);
    } else if (typeof c === 'object' && c.touch) {
      const b = document.createElement('button'); b.className = 'ctrl hold'; b.textContent = c.label || 'Érintsd meg';
      const down = (e) => { e.preventDefault(); S.sim.obj[c.touch] = c.R; S.ctl.objName[c.touch] = 'ujj'; b.classList.add('down'); };
      const up = () => { if (S.sim) S.sim.obj[c.touch] = 1e12; S.ctl.objName[c.touch] = 'érintsd'; b.classList.remove('down'); };
      b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
      box.append(b);
    } else if (c === 'sound') {
      const b = document.createElement('button'); b.className = 'ctrl'; b.setAttribute('aria-pressed', String(S.soundOn));
      b.innerHTML = '<span class="knob"></span> ' + (S.audioBusy ? 'Hang készül…' : 'Hang' + (S.audio && S.soundOn ? ' · kb. ' + Math.round(S.audio.freq) + ' Hz' : ''));
      b.disabled = !!S.audioBusy;
      b.onclick = () => setSound(!S.soundOn);
      box.append(b);
    }
  }
}

function updateMeterRead() {
  if (!S.meterRead || !S.sim) return;
  const r = S.sim.meterReading(S.meterRead.id); let txt;
  if (Math.abs(r.frac) > 1.05) txt = r.frac > 0 ? 'Túl nagy! Válts nagyobb állásra.' : 'Fordítva folyik: a mutató balra akad.';
  else if (S.age === 'k') txt = 'Mutató: ' + Math.round(Math.max(0, r.frac) * 100) + '%';
  else txt = r.unit === 'V' ? fmtV(r.value) : fmtA(r.value);
  if (S.meterRead.el.textContent !== txt) S.meterRead.el.textContent = txt;
}

// ---------- mérések (11 éveseknek) ----------
let meterBox = null;
function updateMeters() {
  if (!meterBox || !S.sim) return;
  const ex = EXPS[S.exp]; const sim = S.sim;
  const rows = [];
  for (const e of sim.nl.elements) {
    if (e.internal) continue;
    const k = e.def.kind;
    if (k === 'led' || k === 'lamp' || k === 'spk') rows.push([e.id + ' (' + ABOUT[k][0].toLowerCase() + ')', fmtA(sim.cur[e.id] || 0)]);
    if (k === 'npn' || k === 'pnp') { const c = sim.cur[e.id] || {}; rows.push([e.id + ' bázisáram', fmtA(c.B || 0)]); rows.push([e.id + ' kollektoráram', fmtA(c.C || 0)]); }
    if (k === 'cap') rows.push([e.id + ' feszültsége', fmtV(sim.capV[e.id] || 0)]);
    if (k === 'photo') rows.push([e.id + ' árama', fmtA(sim.cur[e.id] || 0)]);
    if (k === 'meter') { const r = sim.meterReading(e.id); rows.push([e.id + ' (' + E.METER[r.range].label + ')', Math.abs(r.frac) > 1.05 ? 'túlcsordul' : (r.unit === 'V' ? fmtV(r.value) : fmtA(r.value))]); }
    if (k === 'motor') { rows.push([e.id + ' fordulatszáma', Math.round(Math.abs(sim.motor[e.id].w) * 60 / 2 / Math.PI) + ' /perc']); rows.push([e.id + ' árama', fmtA(sim.cur[e.id] || 0)]); }
    if (k === 'pot') { rows.push([e.id + ' csúszka', Math.round(sim.pot[e.id] * 100) + '%']); }
  }
  rows.push(['idő a szimulációban', (sim.time < 1 ? (sim.time * 1000).toFixed(1).replace('.', ',') + ' ms' : sim.time.toFixed(1).replace('.', ',') + ' s')]);
  if (meterBox.children.length !== rows.length) { meterBox.innerHTML = ''; for (const r of rows) { const d = document.createElement('div'); d.innerHTML = '<small></small><b></b>'; meterBox.append(d); } }
  rows.forEach((r, i) => { const d = meterBox.children[i]; d.firstChild.textContent = r[0]; d.lastChild.textContent = r[1]; });
}

// ---------- koppintás a rácson ----------
function showPop(html, x, y) {
  const pop = $('#pop'); pop.innerHTML = '<button class="x" aria-label="Bezárás">×</button>' + html; pop.hidden = false;
  pop.querySelector('.x').onclick = () => { pop.hidden = true; };
  const card = $('.boardcard').getBoundingClientRect();
  pop.style.left = Math.max(8, Math.min(card.width - 310, x - card.left - 20)) + 'px';
  pop.style.top = Math.max(8, y - card.top + 14) + 'px';
}
function onPartClick(ev) {
  const g = ev.target.closest('g.part'); if (!g) return;
  const id = g.getAttribute('data-id');
  const pl = R.layout.find((p) => (p.id || p.p) === id); if (!pl) return;
  const def = P[pl.p];
  if (S.stage >= 3 && def.kind === 'sw' && def.mode === 'slide') { S.sim.switches[id] = !S.sim.switches[id]; renderControls(); syncSoundGate(); return; }
  const ab = ABOUT[def.kind] || [def.name, ''];
  let extra = '';
  if (S.stage >= 3 && S.sim && S.age !== 'k') {
    const c = S.sim.cur[id];
    if (typeof c === 'number' && def.kind !== 'wire') extra = '<p><b style="font-size:16px;display:inline">Most:</b> ' + fmtA(c) + '</p>';
    if (c && typeof c === 'object') extra = '<p><b style="font-size:16px;display:inline">Most:</b> bázis ' + fmtA(c.B) + ', kollektor ' + fmtA(c.C) + '</p>';
  }
  const kits = kitsHaving(pl.p).map((k) => '<span class="chip k' + k + '">' + KIT_SHORT[k] + '</span>').join(' ');
  showPop('<b>' + def.name + (def.kind !== 'wire' && def.kind !== 'jumper' ? ' · ' + def.short : '') + '</b><p>' + ab[1] + '</p>' + extra + (kits ? '<p style="display:flex;gap:4px;flex-wrap:wrap">' + kits + '</p>' : ''), ev.clientX, ev.clientY);
}
function onPostClick(ev) {
  const name = ev.target.getAttribute('data-post'); if (!name) return;
  if (S.stage < 3 || !S.sim || S.age !== 'n') { showPop('<b>' + name + '</b><p>' + (S.age === 'n' ? 'A „Próbáld ki” lépésben itt a pont feszültségét látod.' : 'Ez a rács ' + name + ' pontja.') + '</p>', ev.clientX, ev.clientY); return; }
  const net = S.posts.get(name);
  if (net == null) { showPop('<b>' + name + '</b><p>Ezen a ponton nincs semmi bekötve.</p>', ev.clientX, ev.clientY); return; }
  showPop('<b>' + name + ': ' + fmtV(S.sim.nodeV(net)) + '</b><p>Feszültség az elem − pólusához képest.</p>', ev.clientX, ev.clientY);
}
document.addEventListener('click', (e) => { const pop = $('#pop'); if (!pop.hidden && !pop.contains(e.target) && !e.target.closest('#board')) pop.hidden = true; });

// ---------- hozzávalók ----------
function kitsHaving(p) { return KIT_ORDER.filter((k) => (E.KITS[k].parts[p] || 0) > 0); }
function needList(layout) {
  const cnt = {}; for (const pl of layout) if (!P[pl.p].virtual) cnt[pl.p] = (cnt[pl.p] || 0) + 1;
  return Object.entries(cnt).sort((a, b) => sortKey(a[0]) - sortKey(b[0])).map(([p, n]) => {
    let left = n; const src = [];
    for (const k of KIT_ORDER) { const have = E.KITS[k].parts[p] || 0; const take = Math.min(have, left); if (take > 0) { src.push([k, take]); left -= take; } }
    return { p, n, src, missing: left };
  });
}
function sortKey(p) { const k = P[p].kind; return ['bat', 'sw', 'res', 'pot', 'led', 'cap', 'npn', 'pnp', 'photo', 'lamp', 'spk', 'motor', 'meter', 'jumper', 'wire'].indexOf(k) * 10 + (P[p].n || 0); }
function miniIcon(p) {
  const def = P[p]; const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 58 34');
  if (def.kind === 'wire') { svgEl('rect', { x: 4, y: 11, width: 50, height: 12, rx: 6, fill: COLORS.wire }, s); const t = svgEl('text', { x: 29, y: 21, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 800, fill: '#fff' }, s); t.textContent = def.n; return s; }
  if (def.kind === 'jumper') { svgEl('path', { d: 'M6,10 C14,34 44,34 52,10', fill: 'none', stroke: JUMPER_COLOR[def.color], 'stroke-width': 4, 'stroke-linecap': 'round' }, s); return s; }
  if (def.kind === 'npn' || def.kind === 'pnp' || def.kind === 'pot') { svgEl('path', { d: 'M12,9 L46,9 L29,26 Z', fill: partColor(def), stroke: partColor(def), 'stroke-width': 10, 'stroke-linejoin': 'round' }, s); }
  else svgEl('rect', { x: 3, y: 6, width: 52, height: 22, rx: 7, fill: partColor(def) }, s);
  const t = svgEl('text', { x: 29, y: def.kind === 'npn' || def.kind === 'pnp' ? 19 : 21, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 800, fill: def.kind === 'res' || def.kind === 'motor' ? '#3B2A00' : '#fff', 'font-family': 'var(--font-display)' }, s); t.textContent = def.short;
  return s;
}

// ---------- építési lépések szövege ----------
function stepText(pl, level, layout) {
  const def = P[pl.p]; const geo = E.geometry(pl);
  const pn = (s) => E.ROWS[s.r] + s.c;
  const lv = level === 1 ? 'közvetlenül a rácsra (1. szint)' : 'a már lerakott alkatrészek tetejére (' + level + '. szint)';
  const ex = EXPS[S.exp];
  const virtPosts = new Set();
  for (const q of layout || []) if (P[q.p].virtual) for (const sn of E.geometry(q).snaps) virtPosts.add(pn(sn));
  const jcol = { red: 'a piros', black: 'a fekete', blue: 'a kék' };
  if (def.kind === 'jumper') {
    const a = pn(geo.snaps[0]), b = pn(geo.snaps[1]);
    if (virtPosts.has(b)) return `Csatlakoztasd ${jcol[def.color]} átkötő kábel egyik végét ${art(a)} pont tetejére. A másik vége szabadon marad: ezzel fogsz hozzáérni ${ex.controls.some((c) => c && c.set === 'water') ? 'a vízhez' : 'a vizsgált tárgyhoz'}.`;
    return `Csíptesd ${jcol[def.color]} átkötő kábel egyik végét ${art(a)} pont tetejére, a másikat ${art(b)} pont tetejére.`;
  }
  if (def.virtual) {
    const a = pn(geo.snaps[0]), b = pn(geo.snaps[1]);
    if (ex.controls.some((c) => c && c.touch)) return `Ezt nem kell lerakni: ide fogsz ujjal érinteni. Ha kész az áramkör, érintsd meg egyszerre ${art(a)} és ${art(b)} pont tetejét.`;
    if (ex.controls.some((c) => c && c.set === 'water')) return 'Ezt nem kell lerakni: ez jelöli a poharat. Készíts elő egy poharat; a két átkötő kábel szabad vége kerül majd bele.';
    return 'Ezt nem kell lerakni: ez jelöli a vizsgált tárgyat. Készíts elő néhány dolgot: alufóliát, ceruzát (a hegyét), egy pohár vizet, papírt, egy műanyag tárgyat.';
  }
  if (def.kind === 'pot') {
    const a = geo.snaps.find((s2) => s2.term === 'a'), b = geo.snaps.find((s2) => s2.term === 'b'), w = geo.snaps.find((s2) => s2.term === 'w');
    return `Tedd le a zöld állítható ellenállást (RV) ${lv}: a két szélső lába ${art(pn(a))} és ${art(pn(b))} pontra, a középső lába (a csúszka) ${art(pn(w))} pontra kerüljön.`;
  }
  if (def.kind === 'meter') {
    const rg = ex.sim && ex.sim.meter && ex.sim.meter[pl.id || pl.p];
    return `Tedd le a mérőműszert (M6) ${art(pn(geo.snaps[0]))} és ${art(pn(geo.snaps[1]))} pont közé, ${lv}. A + jele ${art(pn(geo.snaps[0]))} pont felé nézzen.` + (rg ? ` Állítsd a kapcsolóját ${E.METER[rg].label === '5 V' ? 'az' : 'a'} ${E.METER[rg].label} állásba.` : '');
  }
  if (def.kind === 'motor') return `Tedd le a motort (${def.short}) ${art(pn(geo.snaps[0]))} és ${art(pn(geo.snaps[1]))} pont közé, ${lv}. A + jele ${art(pn(geo.snaps[0]))} pontnál legyen. Tedd rá a propellert.`;
  if (def.kind === 'jumper') return `Csíptesd ${def.color === 'red' ? 'a piros' : 'a fekete'} átkötő kábel egyik végét ${art(pn(geo.snaps[0]))} pont tetejére, a másikat ${art(pn(geo.snaps[1]))} pont tetejére.`;
  if (def.kind === 'wire') {
    if (def.n === 1) return `Tegyél egy 1-es vezetéket (kis kék gombot) ${art(pn(geo.snaps[0]))} pontra, ${lv}. Ez alátét, hogy a rá kerülő alkatrész vízszintesen álljon.`;
    return `Tedd le ${artNum(def.n)}${wireName(def.n)} kék vezetéket ${art(pn(geo.snaps[0]))} ponttól ${art(pn(geo.snaps[geo.snaps.length - 1]))} pontig, ${lv}.`;
  }
  if (def.kind === 'npn' || def.kind === 'pnp') {
    const b = geo.snaps.find((s) => s.term === 'B'); const c = geo.snaps.find((s) => s.term === 'C'); const e = geo.snaps.find((s) => s.term === 'E');
    return `Tedd le ${def.kind === 'npn' ? 'a piros NPN' : 'a zöld PNP'} tranzisztort (${def.short}) ${lv}: a háromszög csúcsa (bázis) ${art(pn(b))} pontra kerüljön, a két másik láb ${art(pn(c))} (kollektor) és ${art(pn(e))} (emitter) pontra.`;
  }
  const a = pn(geo.snaps[0]), b = pn(geo.snaps[1]);
  let pol = '';
  if (def.kind === 'led' || def.kind === 'photo') pol = ` A + jele ${art(a)} pont felé nézzen.`;
  if (def.kind === 'bat') pol = ` A + jele ${art(a)} pontnál legyen.`;
  if (def.kind === 'cap' && def.C >= 1e-6) pol = ` A + jele ${art(a)} pontnál legyen.`;
  return `Tedd le: ${def.name} (${def.short}), ${art(a)} és ${art(b)} pont közé, ${lv}.${pol}`;
}

// ---------- panel ----------
const panel = $('#panel');
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

function renderPanel() {
  const ex = EXPS[S.exp];
  panel.innerHTML = '';
  meterBox = null;
  const head = el('div'); head.append(el('h2', null, ex.title), el('div', 'tag', ex.tag)); panel.append(head);
  const st = el('div', 'stages'); st.setAttribute('role', 'tablist');
  STAGES.forEach((name, i) => {
    const b = el('button', 'stage' + (i <= (S.maxStage || 0) ? ' seen' : '')); b.innerHTML = '<span>' + (i + 1) + '</span>' + name;
    if (i === S.stage) b.setAttribute('aria-current', 'step');
    b.onclick = () => goStage(i);
    st.append(b);
  });
  panel.append(st);
  const body = el('div'); body.style.display = 'flex'; body.style.flexDirection = 'column'; body.style.gap = '14px';
  panel.append(body);
  const nav = el('div', 'navrow');
  const next = (label, fn) => { const b = el('button', 'btn primary', label); b.onclick = fn; nav.append(b); return b; };
  const back = (label, fn) => { const b = el('button', 'btn', label); b.onclick = fn; nav.append(b); return b; };

  if (S.stage === 0) {
    body.append(sayBlock(ex.intro[S.age], { auto: true }));
    body.append(el('h3', null, 'Ezek kellenek hozzá'));
    const ul = el('ul', 'parts');
    for (const n of needList(ex.layout)) {
      const li = el('li'); li.append(miniIcon(n.p));
      const d = el('div'); const def = P[n.p];
      d.append(el('div', 'pn', n.n + ' × ' + def.name + (def.kind !== 'wire' && def.kind !== 'jumper' ? ' (' + def.short + ')' : '')));
      const src = el('div', 'src');
      for (const [k, t] of n.src) { const c = el('span', 'chip k' + k, KIT_SHORT[k] + (n.n > 1 ? ' ×' + t : '')); src.append(c); }
      if (n.missing > 0) src.append(el('span', 'chip', 'hiányzik ' + n.missing));
      d.append(src); li.append(d); ul.append(li);
    }
    body.append(ul);
    const extra = ex.variants.filter((v) => v.needs).map((v) => v.needs.map((p) => P[p].name + ' (' + p + ')').join(', '));
    if (extra.length) body.append(el('p', 'note', 'A kísérletezéshez még: ' + [...new Set(extra)].join('; ') + '.'));
    next('Kezdjük az építést', () => goStage(1));
  } else if (S.stage === 1) {
    const lay = ex.layout; const chk = E.checkBuild(lay);
    const i = Math.min(S.step, lay.length - 1);
    const box = el('div', 'stepbox');
    const cnt = el('div', 'cnt');
    const lvl = chk.levels[i];
    cnt.innerHTML = '<span>' + (i + 1) + '. lépés / ' + lay.length + '</span>' + (P[lay[i].p].kind === 'jumper' ? '<span>átkötés</span>' : '<span class="lvl"><i>' + lvl + '</i> szint</span>');
    const pr = el('div', 'progress'); const bar = el('div'); bar.style.width = ((i + 1) / lay.length * 100) + '%'; pr.append(bar);
    box.append(cnt, pr, sayBlock(stepText(lay[i], lvl, lay), { auto: true }));
    const kits = kitsHaving(lay[i].p);
    if (kits.length && P[lay[i].p].kind !== 'wire') { const k = el('div', 'src'); k.style.display = 'flex'; k.style.gap = '4px'; k.style.flexWrap = 'wrap'; k.append(el('span', 'note', 'Megtalálod: ')); for (const kk of kits) k.append(el('span', 'chip k' + kk, KIT_SHORT[kk])); box.append(k); }
    body.append(box);
    if (i === 0) body.append(el('p', 'note', 'A fekete karikában lévő szám a szintet mutatja: az 1-es közvetlenül a rácsra kerül, a 2-es a már lerakott alkatrészek tetejére.'));
    back('Vissza', () => { if (S.step > 0) { S.step--; refreshBoard(); renderPanel(); renderControls(); } else goStage(0); });
    if (i < lay.length - 1) next('Megvan, jöhet a következő', () => { S.step++; refreshBoard(); renderPanel(); renderControls(); });
    else next('Kész! Jöhet a tippelés', () => goStage(2));
  } else if (S.stage === 2) {
    const q = ex.guess;
    body.append(sayBlock(q.q[S.age], { auto: true }));
    const opts = el('div', 'opts');
    q.opts.forEach(([txt, icon], idx) => {
      const b = el('button', 'opt'); b.append(guessIcon(icon)); b.append(document.createTextNode(txt));
      if (S.guess != null) { if (idx === q.right) b.classList.add('right'); else if (idx === S.guess) b.classList.add('wrong'); }
      b.onclick = () => { S.guess = idx; renderPanel(); if (S.autoread) speak((idx === q.right ? 'Eltaláltad! ' : 'Nem egészen. ') + q.after[S.age]); };
      opts.append(b);
    });
    body.append(opts);
    if (S.guess != null) {
      const f = el('div', 'feedback'); f.append(el('b', null, S.guess === q.right ? 'Eltaláltad! ' : 'Nem egészen. '), document.createTextNode(q.after[S.age])); body.append(f);
      body.append(el('p', 'note', 'Most próbáld ki a valódi áramkörön is, aztán nézd meg itt, mi történik belül.'));
    }
    back('Vissza', () => goStage(1));
    next('Próbáljuk ki', () => { if (q.variant) S.variants[q.variant] = false; goStage(3); });
  } else if (S.stage >= 3) {
    if (S.stage === 3) {
      body.append(sayBlock(ex.hint[S.age], { auto: true }));
      if (ex.variants.length) {
        body.append(el('h3', null, 'Kísérletezz'));
        const vs = el('div', 'vars');
        for (const v of ex.variants) {
          const on = !!S.variants[v.id];
          const d = el('div', 'var' + (on ? ' on' : ''));
          const h = el('div', 'vh'); h.append(el('b', null, v.label));
          const t = el('button', 'mini', on ? 'Visszaállítás' : 'Kipróbálom'); t.setAttribute('aria-pressed', String(on));
          t.onclick = () => { S.variants[v.id] = !on; startSim(); refreshBoard(); renderPanel(); renderControls(); if (S.soundOn) setSound(true); };
          h.append(t); d.append(h, el('p', null, v.real));
          vs.append(d);
        }
        body.append(vs);
      }
      back('Vissza', () => goStage(2));
      next('Miért működik?', () => goStage(4));
    } else {
      body.append(sayBlock(ex.why[S.age], { auto: true }));
      if (S.age === 'n') {
        body.append(el('h3', null, 'Mérőműszer'));
        meterBox = el('div', 'meter'); body.append(meterBox);
        body.append(el('p', 'note', 'Koppints a rács egy pontjára, és megmutatja a feszültségét.'));
      } else if (S.age === 'm') {
        body.append(el('p', 'note', 'Koppints bármelyik alkatrészre, és elmondja, mire való. A sárga pöttyök az áram útját mutatják.'));
      }
      back('Vissza', () => goStage(3));
      const nxt = EXPS[S.exp + 1];
      if (nxt) next('Következő: ' + nxt.title, () => { markDone(); selectExp(S.exp + 1); });
      else next('Kész vagyok', () => { markDone(); renderStrip(); });
    }
    if (S.age === 'n' && S.stage === 3) { body.append(el('h3', null, 'Mérőműszer')); meterBox = el('div', 'meter'); body.append(meterBox); }
  }
  panel.append(nav);
}

function guessIcon(kind) {
  const s = document.createElementNS(NS, 'svg'); s.setAttribute('width', 40); s.setAttribute('height', 40); s.setAttribute('viewBox', '0 0 40 40');
  const led = (x, on, col) => { if (on) svgEl('circle', { cx: x, cy: 20, r: 13, fill: col, opacity: 0.35 }, s); svgEl('circle', { cx: x, cy: 20, r: 7, fill: on ? col : '#9AA4AE' }, s); };
  switch (kind) {
    case 'on': led(20, true, '#FF5A3C'); break;
    case 'off': led(20, false); break;
    case 'dim': svgEl('circle', { cx: 20, cy: 20, r: 7, fill: '#FF5A3C', opacity: 0.45 }, s); break;
    case 'blink': led(12, true, '#FF5A3C'); led(28, false); break;
    case 'fade': led(12, true, '#FF5A3C'); svgEl('circle', { cx: 28, cy: 20, r: 7, fill: '#FF5A3C', opacity: 0.35 }, s); break;
    case 'sound': svgEl('path', { d: 'M8 16h6l7-6v20l-7-6H8z', fill: 'currentColor' }, s); svgEl('path', { d: 'M25 14a8 8 0 0 1 0 12M29 10a13 13 0 0 1 0 20', fill: 'none', stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, s); break;
    case 'slow': svgEl('circle', { cx: 20, cy: 20, r: 12, fill: 'none', stroke: 'currentColor', 'stroke-width': 2.5 }, s); svgEl('path', { d: 'M20 12v8l5 4', fill: 'none', stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, s); break;
    case 'same': svgEl('path', { d: 'M10 16h20M10 24h20', stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round' }, s); break;
  }
  return s;
}

// ---------- navigáció ----------
function refreshBoard() {
  const ex = EXPS[S.exp];
  if (S.stage === 1) drawBoard(ex.layout, { upto: S.step, highlight: S.step, showLevels: true, dimBefore: S.step });
  else if (S.stage >= 3) drawBoard(S.simLayout || ex.layout, { showLevels: S.age === 'n' });
  else drawBoard(ex.layout, { showLevels: S.stage === 0 });
  $('#boardtitle').textContent = S.stage === 1 ? 'Így rakd össze' : S.stage >= 3 ? 'Mi történik belül?' : 'A kész áramkör';
}
function goStage(i) {
  const prev = S.stage;
  S.stage = i; S.maxStage = Math.max(S.maxStage || 0, i);
  if (i === 1 && prev !== 1) S.step = Math.min(S.step, EXPS[S.exp].layout.length - 1);
  if (i >= 3 && (!S.sim || prev < 3)) startSim();
  if (i < 3 && S.soundOn) setSound(false);
  $('#pop').hidden = true;
  store.set('stage', i);
  refreshBoard(); renderPanel(); renderControls();
}
function markDone() { S.done[EXPS[S.exp].id] = true; store.set('done', S.done); }
function selectExp(i) {
  if (S.soundOn) setSound(false);
  S.exp = i; S.step = 0; S.guess = null; S.variants = {}; S.sim = null; S.maxStage = 0; S.audio = null;
  S.ctl = initCtl(EXPS[i]); S.vc = 0;
  S.light = EXPS[i].light || 0.85;
  store.set('exp', i);
  renderStrip(); goStage(0);
}
function renderStrip() {
  const nav = $('#exps'); nav.innerHTML = '';
  const cur = EXPS[S.exp].chapter;
  const chaps = el('div', 'chaps'); chaps.setAttribute('role', 'tablist'); chaps.setAttribute('aria-label', 'Fejezetek');
  for (const c of CHAPTERS) {
    const list = EXPS.filter((e) => e.chapter === c.id);
    const done = list.filter((e) => S.done[e.id]).length;
    const b = el('button', 'chap'); b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', String(c.id === cur));
    b.innerHTML = '<i></i><span></span><small></small>';
    b.querySelector('i').textContent = c.id; b.querySelector('span').textContent = c.short; b.querySelector('small').textContent = done + '/' + list.length;
    b.title = c.title;
    b.onclick = () => { if (c.id !== cur) { const next = list.find((e) => !S.done[e.id]) || list[0]; selectExp(EXPS.indexOf(next)); } };
    chaps.append(b);
  }
  const row = el('div', 'exprow');
  let k = 0;
  EXPS.forEach((ex, i) => {
    if (ex.chapter !== cur) return; k++;
    const b = el('button', 'exp' + (S.done[ex.id] ? ' done' : ''));
    if (i === S.exp) b.setAttribute('aria-current', 'true');
    b.innerHTML = '<span class="num">' + (S.done[ex.id] ? '✓' : cur + k) + '</span><b></b><small></small>';
    b.querySelector('b').textContent = ex.title; b.querySelector('small').textContent = ex.tag;
    b.onclick = () => selectExp(i);
    row.append(b);
  });
  nav.append(chaps, row);
}
function setAge(a) {
  S.age = a; store.set('age', a);
  document.body.classList.remove('age-k', 'age-m', 'age-n'); document.body.classList.add('age-' + a);
  document.querySelectorAll('[data-age]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.age === a)));
  if (a === 'k' && !store.get('autoreadSet', false)) { S.autoread = true; syncAutoread(); }
  refreshBoard(); renderPanel();
}
function syncAutoread() { $('#autoread').setAttribute('aria-pressed', String(S.autoread)); store.set('autoread', S.autoread); }
document.querySelectorAll('[data-age]').forEach((b) => { b.onclick = () => setAge(b.dataset.age); });
$('#autoread').onclick = () => { S.autoread = !S.autoread; store.set('autoreadSet', true); syncAutoread(); if (!S.autoread) { try { speechSynthesis.cancel(); } catch (e) { /* nincs */ } } };

// ---------- indulás ----------
S.exp = Math.min(EXPS.length - 1, store.get('exp', 0));
S.light = EXPS[S.exp].light || 0.85;
S.ctl = initCtl(EXPS[S.exp]);
S.maxStage = S.stage;
document.body.classList.add('age-' + S.age);
document.querySelectorAll('[data-age]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.age === S.age)));
syncAutoread();
renderStrip();
goStage(Math.min(4, S.stage));
requestAnimationFrame(frame);
window.__app = { S, EXPS, startSim, selectExp, goStage };
})();
