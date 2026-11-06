// SPDX-License-Identifier: GPL-3.0-or-later
// Fekete doboz nélkül – Copyright (C) 2026 Nimmerfroh Károly
(function () {
'use strict';
const E = window.BoffinEngine, P = E.PARTS, LAY = window.BOFFIN_LAYOUTS;
const $ = (s, r) => (r || document).querySelector(s);
const NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
// a fejlesztői (/dev/) változat külön névteret használ, hogy ne keveredjen az éles app haladásával
const STORE_NS = /\/dev(\/|$)/.test(location.pathname) ? 'fdn-dev:' : 'fdn:';
const store = {
  get(k, d) { try { const v = localStorage.getItem(STORE_NS + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(STORE_NS + k, JSON.stringify(v)); } catch (e) { /* nincs tárhely */ } },
};

// ---------- segédek a magyar szövegekhez ----------
const art = (w) => ((/^[AEIOUÁÉÍÓÖŐÚÜŰaeiouáéíóöőúüűF]/.test(w) && !/^F[a-z]/.test(w)) || /^(1|5)\b|^(1|5)\./.test(w) ? 'az ' : 'a ') + w; // F betű: "ef" -> az F3; 1., 5. -> az
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
  ic: ['Integrált áramkör (IC)', 'Sok apró alkatrész egyetlen dobozba zárva. A lábain keresztül kötjük be; a belsejét nem látjuk, ezért hívjuk fekete doboznak.'],
  mic: ['Mikrofon', 'Szénmikrofon: a hang összenyomja a belsejét, és ettől megváltozik az ellenállása (csendben kb. 1 kΩ, fújásra kb. 10 kΩ).'],
  motor: ['Motor', 'Az áram forgatja. Fordítva is működik: ha te forgatod, áramot termel.'],
  obj: ['Vizsgált tárgy', 'Ez nincs a dobozban: ide érnek a kábelvégek vagy az ujjad.'],
  fiber: ['Üvegszálas kábel', 'Vékony üvegszál, amiben a fény a kanyarokban is továbbhalad. A végein lévő tartók a LED-re és a fototranzisztorra illeszthetők.'],
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
  const ctl = { tune: { ...(sim.tune || {}) }, pot: { ...(sim.pot || {}) }, meter: { ...(sim.meter || {}) }, obj: { ...(sim.obj || {}) }, objName: {} };
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
  if (S.voiceWarned || store.get('voiceOk', false)) return; S.voiceWarned = true;
  const box = document.createElement('div'); box.className = 'voicewarn'; box.setAttribute('role', 'status');
  box.innerHTML = '<b>Nincs magyar felolvasóhang ezen az eszközön.</b> <details><summary>Mit tehetek?</summary><span></span> (Idegen nyelvű hanggal nem olvasunk fel, mert az érthetetlen lenne.)</details> <button class="mini">Rendben</button>';
  box.querySelector('span').textContent = voiceHelp();
  box.querySelector('button').onclick = () => { box.remove(); store.set('voiceOk', true); };
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
    u.onerror = () => {   // ha az online (természetes) hang nem érhető el, egyszer újra a helyi magyar hanggal
      if (u.retried) return; const local = speechSynthesis.getVoices().find((v) => /^hu(-|_|$)/i.test(v.lang) && v.localService && v !== huVoice);
      if (!local) return; const u2 = new SpeechSynthesisUtterance(u.text); u2.retried = true; u2.lang = local.lang; u2.voice = local; u2.rate = u.rate; huVoice = local; speechSynthesis.speak(u2);
    };
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
  // automatikus felolvasás csak új szövegnél (egy válasz utáni újrarajzolás ne szakítsa félbe a visszajelzést)
  if (opts && opts.auto && S.autoread) { const key = S.exp + ':' + S.stage + ':' + text; if (S.lastAuto !== key) { S.lastAuto = key; setTimeout(() => speak(text), 60); } }
  return d;
}

// ---------- geometria a rajzhoz ----------
const G = 66, OX = 52, OY = 46;
const BLOCK = OY * 2 + 6 * G + 30; // egy rács magassága + hézag
const px = (c) => OX + (c - 1) * G, py = (r) => OY + (r % E.BOARD_ROWS) * G + Math.floor(r / E.BOARD_ROWS) * BLOCK;
const boardsOf = (layout) => (layout.some((pl) => E.geometry(pl).snaps.some((q) => q.r >= E.BOARD_ROWS)) ? 2 : 1);
const LOFF = 5;
const lvOff = (L) => (L > 1 ? -(L - 1) * LOFF : 0);

const COLORS = {
  // a feliratok miatt elég sötét árnyalatok (fehér szöveggel legalább 4,5:1 kontraszt)
  wire: '#2E63CF', res: '#F0BF2E', sw: '#2E8540', bat: '#66717D', cap: '#24774F', lamp: '#9AA3AE', spk: '#C2463E',
  coil: '#9AA3AE', varcap: '#2E8540', npn: '#C2382F', pnp: '#2E8540', photo: '#2A2F36', ledred: '#C93B35', ledgreen: '#23824B',
  pot: '#2E8540', meter: '#2B3138', motor: '#AEB6BF', obj: '#7A8796', mic: '#6B737C',
};
const IC_COLOR = { U1: '#2F6FD6', U2: '#C2382F', U23: '#C2382F', U3: '#2E8540', U4: '#E9C535', U22: '#22262B', U24: '#F2C230', U32: '#F0D84A', U5: '#C2382F' };
const IC_INK = { U4: '#3B2A00', U24: '#3B2A00', U32: '#3B2A00' };
const IC_COLORNAME = { U1: 'a kék', U2: 'a piros', U23: 'a piros', U3: 'a zöld', U4: 'a sárga', U22: 'a fekete', U24: 'a sárga', U32: 'a sárga', U5: 'a piros' };
const IC_INNER = { music: 'hangszer + memória', alarm: 'sziréna + választó', strobe: 'villogó', war: 'rezgőkörök + számláló', amp: 'erősítő', organ: 'hangkapcsoló + számláló + 3 LED', ir: 'fényszem + szűrő', melody: 'dallam + hangszóró', radio: 'rádióerősítő + egyenirányító' };
// a színes LED (D8) színsora a rajzon (saját közelítés)
const RGB_SEQ = ['#FF4A3D', '#47F07A', '#4D8DFF', '#FFE14A', '#4DF2EC', '#F25CF0', '#FFFFFF'];
const rgbCss = (c) => '#' + c.map((x) => (x ? 'ff' : '33')).join('');
const JUMPER_COLOR = { red: '#D13B33', black: '#22262B', blue: '#2F6FD6' };
const MATERIALS = {
  materials: [['semmi (levegő)', 1e12], ['alufólia', 0.1], ['ceruzabél', 300], ['sós víz', 2000], ['csapvíz', 20000], ['a kezed', 3e5], ['papír', 1e12], ['műanyag', 1e12]],
  water: [['száraz pohár', 1e12], ['csapvíz a pohárban', 5e4], ['sós víz a pohárban', 5e3]],
};

function partColor(def) {
  if (def.kind === 'ic') return IC_COLOR[def.short] || '#666';
  if (def.kind === 'led') return def.color === 'green' ? COLORS.ledgreen : def.color === 'rgb' ? '#2B2F36' : COLORS.ledred;
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

  if (def.kind === 'fiber') {
    const [x1, y1] = pts[0], [x2, y2] = pts[1];
    const d = `M${x1},${y1} C${x1 + 150},${y1 + 40} ${x2 + 150},${y2 - 40} ${x2},${y2}`;
    svgEl('path', { d, fill: 'none', stroke: '#8FD3F4', 'stroke-width': 9, 'stroke-linecap': 'round', opacity: 0.55 }, g);
    const core = svgEl('path', { d, fill: 'none', stroke: '#FFF6C9', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0 }, g);
    svgEl('circle', { cx: x1, cy: y1, r: 13, fill: 'rgba(255,255,255,.55)', stroke: '#7FB9D6', 'stroke-width': 2 }, g);
    svgEl('circle', { cx: x2, cy: y2, r: 13, fill: '#1E2227', stroke: '#7FB9D6', 'stroke-width': 2 }, g);
    out.fiber = { core };
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
  if (def.kind === 'ic' && def.ic === 'ir') {
    // az infravevő háromszög alakú modul (mint a tranzisztorok)
    const d = `M${pts[0][0]},${pts[0][1]} L${pts[1][0]},${pts[1][1]} L${pts[2][0]},${pts[2][1]} Z`;
    svgEl('path', { d, fill: col, stroke: 'rgba(0,0,0,.28)', 'stroke-width': 34, 'stroke-linejoin': 'round' }, g);
    svgEl('path', { d, fill: col, stroke: col, 'stroke-width': 30, 'stroke-linejoin': 'round' }, g);
    const cx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3, cy = (pts[0][1] + pts[1][1] + pts[2][1]) / 3;
    const t = svgEl('text', { x: cx, y: cy + 2, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 800, fill: IC_INK[def.short], 'font-family': 'var(--font-display)' }, g); t.textContent = def.short;
    svgEl('rect', { x: cx - 4, y: cy + 6, width: 8, height: 8, rx: 2, fill: '#2A2F36' }, g);   // az érzékelő ablaka
    out.icAct = svgEl('circle', { cx: cx, cy: cy - 16, r: 5, fill: 'var(--spark)', opacity: 0 }, g);
    geo.snaps.forEach((q, i) => {
      svgEl('circle', { cx: pts[i][0], cy: pts[i][1], r: 8, fill: '#D9DEE4', stroke: '#5C6670', 'stroke-width': 1.5 }, g);
      const l = svgEl('text', { x: pts[i][0], y: pts[i][1] + 3.5, 'text-anchor': 'middle', 'font-size': 9, 'font-weight': 800, fill: '#333' }, g);
      l.textContent = q.term === 'P' ? '+' : q.term === 'N' ? '−' : 'ki';
    });
    return out;
  }
  if (def.kind === 'ic') {
    const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
    const x0 = Math.min(...xs) - 24, x1 = Math.max(...xs) + 24, y0 = Math.min(...ys) - 24, y1 = Math.max(...ys) + 24;
    const open = !!S.icOpen;
    svgEl('rect', { x: x0, y: y0, width: x1 - x0, height: y1 - y0, rx: 12, fill: col, 'fill-opacity': open ? 0.18 : 1, stroke: open ? col : 'rgba(0,0,0,.3)', 'stroke-width': open ? 3 : 2, 'stroke-dasharray': open ? '8 5' : '' }, g);
    const cx = (x0 + x1) / 2;
    if (!open) {
      const ink = IC_INK[def.short] || '#fff';
      const t = svgEl('text', { x: cx, y: (y0 + y1) / 2 + 2, 'text-anchor': 'middle', 'font-size': 24, 'font-weight': 800, fill: ink, 'font-family': 'var(--font-display)' }, g); t.textContent = def.short;
      const t2 = svgEl('text', { x: cx, y: (y0 + y1) / 2 + 20, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 700, fill: ink, opacity: 0.9 }, g); t2.textContent = def.name.toUpperCase();
    } else {
      // kinyitva: a belső építőkövek vázlata (két tranzisztor és egy kondenzátor) és a felirat
      const my = (y0 + y1) / 2 - 4;
      for (const dx of [-30, 30]) svgEl('path', { d: `M${cx + dx - 11},${my - 9} L${cx + dx + 11},${my - 9} L${cx + dx},${my + 9} Z`, fill: '#D8443B', stroke: '#8A2620', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, g);
      svgEl('path', { d: `M${cx - 14},${my} L${cx - 4},${my} M${cx - 4},${my - 8} L${cx - 4},${my + 8} M${cx + 4},${my - 8} L${cx + 4},${my + 8} M${cx + 4},${my} L${cx + 14},${my}`, stroke: '#2F8F62', 'stroke-width': 2.4, fill: 'none' }, g);
      const t = svgEl('text', { x: cx, y: my + 28, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 800, fill: 'var(--ink)', 'font-family': 'var(--font-display)' }, g); t.textContent = def.short + ': ' + IC_INNER[def.ic];
    }
    const act = svgEl('circle', { cx: x1 - 12, cy: y0 + 12, r: 5, fill: 'var(--spark)', opacity: 0 }, g);
    out.icAct = act;
    if (def.ic === 'organ') {
      // a fényorgona háromszínű LED-je a modul közepén
      const ly = (y0 + y1) / 2 - 26;
      out.icGlow = svgEl('circle', { cx, cy: ly, r: 26, fill: '#fff', opacity: 0, style: 'mix-blend-mode:screen' }, g);
      out.icRGB = svgEl('circle', { cx, cy: ly, r: 9, fill: '#555', stroke: 'rgba(255,255,255,.5)', 'stroke-width': 1.5 }, g);
    }
    geo.snaps.forEach((q, i) => {
      svgEl('circle', { cx: pts[i][0], cy: pts[i][1], r: 8, fill: '#D9DEE4', stroke: '#5C6670', 'stroke-width': 1.5 }, g);
      const l = svgEl('text', { x: pts[i][0], y: pts[i][1] + (q.r === geo.snaps[0].r ? -12 : 21), 'text-anchor': 'middle', 'font-size': 9, 'font-weight': 800, fill: open ? 'var(--ink)' : '#fff' }, g);
      l.textContent = q.term === 'P' ? '+' : q.term === 'N' ? '−' : q.term;
      if (!open && IC_INK[def.short]) l.setAttribute('fill', IC_INK[def.short]);
    });
    return out;
  }
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
    const ink = def.kind === 'res' ? '#3B2A00' : (def.kind === 'lamp' || def.kind === 'coil' || def.kind === 'motor') ? '#1F2933' : '#fff';
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
        out.glows.push({ el: glow, lens, type: 'led', rgb: def.color === 'rgb' });
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
      case 'coil': {
        svgEl('path', { d: 'M-34,4 L-22,4 C-22,-12 -12,-12 -12,4 C-12,-12 -2,-12 -2,4 C-2,-12 8,-12 8,4 C8,-12 18,-12 18,4 L34,4' }, sym);
        label(def.short, 19, 10);
        break;
      }
      case 'varcap': {
        svgEl('path', { d: 'M-30,0 L-5,0 M5,0 L30,0 M-5,-12 L-5,12 M5,-12 L5,12 M-14,12 L14,-14 M8,-14 L14,-14 L14,-8' }, sym);
        label(def.short, 20, 10);
        break;
      }
      case 'lamp': {
        svgEl('circle', { cx: 0, cy: 0, r: 13, fill: '#EEF0F2', stroke: '#6B737C', 'stroke-width': 2 }, body);
        const glow = svgEl('circle', { cx: 0, cy: 0, r: 34, fill: '#FFE07A', opacity: 0, style: 'mix-blend-mode:screen' }, body);
        out.glows.push({ el: glow, type: 'lamp' });
        label(def.short, 18, 10);
        break;
      }
      case 'mic': {
        svgEl('circle', { cx: 0, cy: 0, r: 12, fill: '#1E2227' }, body);
        for (let k = -6; k <= 6; k += 4) svgEl('line', { x1: k, y1: -8, x2: k, y2: 8, stroke: '#5B636C', 'stroke-width': 1.4 }, body);
        label('X1', 17, 10);
        const ring = svgEl('circle', { cx: 0, cy: 0, r: 18, fill: 'none', stroke: 'var(--spark)', 'stroke-width': 3, opacity: 0 }, body);
        out.glows.push({ el: ring, type: 'mic' });
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
  const nb = boardsOf(layout);
  const W = OX * 2 + 9 * G + 10, H = nb * BLOCK - 30 + 14 + (hasJ ? 56 : 0);
  board.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const grid = svgEl('g', {}, board);
  const posts = svgEl('g', {}, board);
  for (let b = 0; b < nb; b++) {
    const y0 = b * BLOCK;
    svgEl('rect', { x: 8, y: 8 + y0, width: W - 16, height: OY * 2 + 6 * G - 2 + (hasJ && b === nb - 1 ? 56 : 0), rx: 18, fill: 'var(--board)', stroke: 'var(--board-edge)', 'stroke-width': 2 }, grid);
    for (let c = 1; c <= 10; c++) {
      svgEl('line', { x1: px(c), y1: py(b * E.BOARD_ROWS) - 22, x2: px(c), y2: py(b * E.BOARD_ROWS + 6) + 22, stroke: 'var(--board-edge)', 'stroke-width': 1 }, grid);
      const t = svgEl('text', { x: px(c), y: 26 + y0, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: 'var(--label)' }, grid); t.textContent = c;
    }
    for (let r = 0; r < 7; r++) {
      const R = b * E.BOARD_ROWS + r;
      svgEl('line', { x1: px(1) - 22, y1: py(R), x2: px(10) + 22, y2: py(R), stroke: 'var(--board-edge)', 'stroke-width': 1 }, grid);
      const t = svgEl('text', { x: 22, y: py(R) + 5, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: 'var(--label)' }, grid); t.textContent = E.ROWS[r];
      for (let c = 1; c <= 10; c++) svgEl('circle', { cx: px(c), cy: py(R), r: 4.5, fill: 'var(--post)', 'data-post': E.postName(R, c) }, posts);
    }
    if (nb > 1) { const t = svgEl('text', { x: W - 22, y: y0 + OY * 2 + 6 * G - 6, 'text-anchor': 'end', 'font-size': 13, 'font-weight': 800, fill: 'var(--muted)' }, grid); t.textContent = (b + 1) + '. rács'; }
  }

  const upto = opts.upto != null ? opts.upto : layout.length - 1;
  const shown = layout.slice(0, upto + 1);
  const chk = E.checkBuild(shown);
  const partsG = svgEl('g', {}, board);
  const items = [];
  // szint szerint rajzolunk, az átkötő kábelek a végén
  const order = shown.map((pl, i) => i).sort((a, b) => {
    const top = (k) => (k === 'jumper' || k === 'fiber' ? 99 : null);
    const la = top(P[shown[a].p].kind) || chk.levels[a], lb = top(P[shown[b].p].kind) || chk.levels[b];
    return la - lb || a - b;
  });
  for (const i of order) {
    const it = drawPart(partsG, shown[i], chk.levels[i], chk.contacts[i], opts);
    it.index = i;
    if (opts.highlight === i) it.g.classList.add('hl');
    if (opts.dimBefore != null && i < opts.dimBefore) it.g.style.opacity = 0.72;
    // szintjelző a manuálhoz hasonlóan
    if (opts.showLevels && P[shown[i].p].kind !== 'jumper' && P[shown[i].p].kind !== 'fiber') {
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
    // széles nézetben a rajzlap magában görget: a kiemelt alkatrész legyen látható (pl. két rácsnál a másodikon); az oldalt nem görgeti
    requestAnimationFrame(() => {
      const sc = ring.closest && ring.closest('.boardcard'); if (!sc || sc.scrollHeight <= sc.clientHeight + 2) return;
      const r = ring.getBoundingClientRect(), c = sc.getBoundingClientRect();
      if (r.top < c.top || r.bottom > c.bottom) sc.scrollTop += r.top - c.top - Math.max(0, (c.height - r.height) / 2);
    });
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
  for (const v of ex.variants) if (S.variants[v.id]) { lay = applyVariant(v, lay); if (ex.exclusive) break; }
  return lay;
}
function startSim() {
  const ex = EXPS[S.exp]; const lay = currentLayout();
  const prevSw = S.sim ? { ...S.sim.switches } : null;
  S.sim = new E.Sim(lay, { light: S.light, pot: S.ctl.pot, meter: S.ctl.meter, obj: S.ctl.obj, tune: S.ctl.tune });
  S.simLayout = lay;
  if (prevSw) for (const k in S.sim.switches) if (k in prevSw) S.sim.switches[k] = prevSw[k];
  S.wc = null;
  S.posts = new Map();
  S.sim.nl.chk.contacts.forEach((cs) => cs.forEach((s) => { if (s.connected) S.posts.set(E.postName(s.r, s.c), S.sim.nl.postNet(s.r, s.c)); }));
  S.sim.fiberOn = S.ctl.fiberOn !== false;
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
  const live = S.stage >= 3 && S.sim && !S.album && !document.hidden;
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
      // A pöttyök sebessége és erőssége az áram négyzetgyökével nő (mint a LED fénye): ahogy egy áram elfogy,
      // a pöttyök lelassulnak és elhalványulnak. A tranzisztor bázisáramát százszorosan számítjuk,
      // hogy a kis vezérlőáram ugyanúgy látsszon, mint az általa nyitott nagy kollektoráram.
      const ae = fl.f.src === 'B' ? a * 100 : a;
      const op = Math.min(1, Math.sqrt(ae / 1e-3));
      const v = op > 0.04 ? Math.sign(I) * Math.min(190, 190 * Math.sqrt(ae / 0.01)) : 0;
      fl.phase += v * dtR;
      const show = op > 0.04;
      const n = fl.dots.length; const sp = fl.L / n;
      for (let k = 0; k < n; k++) {
        const d = fl.dots[k];
        if (!show) { d.setAttribute('opacity', 0); continue; }
        const p = pointAt(fl, fl.phase + k * sp);
        d.setAttribute('cx', p[0].toFixed(1)); d.setAttribute('cy', p[1].toFixed(1)); d.setAttribute('opacity', op.toFixed(2));
      }
    }
    for (const it of R.items) {
      if (!it) continue;
      const c = live ? S.sim.cur[it.id] : 0;
      for (const gl of it.glows) {
        if (gl.type === 'led') { const a = Math.abs(c || 0); const b = c > 0 ? Math.min(1, Math.sqrt(a / 0.01)) : 0; /* 10 mA: teljes fény, 0,3 mA: épp pislákol */
          if (gl.rgb) { const col = RGB_SEQ[Math.floor((live ? S.sim.time : 0) / 0.8) % RGB_SEQ.length]; gl.el.setAttribute('fill', col); gl.lens.setAttribute('fill', col); } gl.el.setAttribute('opacity', (b * 0.85).toFixed(2)); gl.lens.setAttribute('opacity', b.toFixed(2)); }
        else if (gl.type === 'lamp') { const b = Math.min(1, Math.pow(Math.abs(c || 0) / (it.def.Inom || 0.2), 1.5));   /* a névleges teljesítményhez képest */ gl.el.setAttribute('opacity', (b * 0.9).toFixed(2)); }
        else if (gl.type === 'spk') { const b = Math.min(1, Math.abs(c || 0) / 0.02); gl.el.setAttribute('opacity', (b * 0.9).toFixed(2)); gl.el.setAttribute('r', 18 + b * 8); }
        else if (gl.type === 'mic') { const p = live ? S.sim.mic[it.id] || 0 : 0; gl.el.setAttribute('opacity', (p * 0.9).toFixed(2)); gl.el.setAttribute('r', 16 + p * 9); }
        else if (gl.type === 'shade') { gl.el.setAttribute('opacity', ((1 - S.light) * 0.75).toFixed(2)); }
      }
      if (it.knob) { const pv = live ? S.sim.pot[it.id] : (S.ctl.pot[it.id] != null ? S.ctl.pot[it.id] : 0.5); const an = (-135 + 270 * pv) * Math.PI / 180; it.knob.el.setAttribute('x2', (it.knob.cx + 12 * Math.sin(an)).toFixed(1)); it.knob.el.setAttribute('y2', (it.knob.cy - 12 * Math.cos(an)).toFixed(1)); }
      if (it.meter) { const fr = live ? S.sim.meterReading(it.id).frac : 0; const an = Math.max(-0.08, Math.min(1.08, fr)) * 110 - 55; it.meter.needle.setAttribute('transform', `rotate(${an.toFixed(1)} 0 4)`); it.meter.needle.setAttribute('stroke', Math.abs(fr) > 1.05 ? '#E0201A' : '#C2413A'); }
      if (it.fan) { const w = live ? S.sim.motor[it.id].w : 0; it.fan.a += Math.sign(w) * Math.min(Math.abs(w), 300) * 0.06 * dtR * 57.3; it.fan.el.setAttribute('transform', `rotate(${(it.fan.a % 360).toFixed(1)})`); it.fan.el.style.opacity = Math.abs(w) > 150 ? 0.55 : 1; }
      if (it.fiber) { const lk = live && S.sim.links[0]; const b = lk && S.sim.fiberOn ? Math.min(1, Math.max(0, S.sim.cur[lk.led] || 0) / 0.01) : 0; it.fiber.core.setAttribute('opacity', (b * 0.95).toFixed(2)); }
      if (it.icAct) { const st = live && S.sim.ic[it.id]; it.icAct.setAttribute('opacity', st && st.active ? (st.on ? 1 : 0.35) : 0); }
      if (it.icRGB) { const st = live && S.sim.ic[it.id]; const on = st && st.active && st.rgb.some((x) => x); it.icRGB.setAttribute('fill', on ? rgbCss(st.rgb) : '#555'); it.icGlow.setAttribute('fill', on ? rgbCss(st.rgb) : '#fff'); it.icGlow.setAttribute('opacity', on ? 0.8 : 0); }
      if (it.objLabel) { const nm = S.ctl.objName[it.id] || '?'; if (it.objLabel.textContent !== nm) it.objLabel.textContent = nm; }
      if (it.capBar) { const vC = live ? S.sim.capV[it.id] || 0 : 0; const sc = (EXPS[S.exp].sim && EXPS[S.exp].sim.capScale) || 3; it.capBar.el.setAttribute('width', (Math.min(1, Math.abs(vC) / sc) * it.capBar.w).toFixed(1)); }
      if (it.isSwitch) {
        const on = live ? !!S.sim.switches[it.id] : false;
        const blade = it.g.querySelector('.swblade');
        if (blade) blade.setAttribute('d', it.def.mode === 'press' ? (on ? 'M-30,6 L-12,6 M12,6 L30,6 M-12,6 L12,6' : 'M-30,6 L-12,6 M12,6 L30,6 M-12,-2 L12,-2') : (on ? 'M-30,6 L-12,6 M12,6 L30,6 M-12,6 L12,6' : 'M-30,6 L-12,6 M12,6 L30,6 M-12,6 L12,-6'));
      }
    }
    if (live && fcount % 6 === 0) { updateMeters(); updateMeterRead(); updateTuneRead(); updateProbes(); updateWarn(); }
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
  if (S.ac.state === 'suspended' || S.ac.state === 'interrupted') S.ac.resume().catch(() => {});
  return S.ac;
}
const tick0 = () => new Promise((r) => setTimeout(r, 0));
async function buildLoop() {
  // mindig 48 kHz-en számolunk (a gyors rezgőkörökhöz ennyi kell), a böngésző igazítja át az eszköz mintavételéhez
  const lay = currentLayout(); const sr = 48000; const dt = 1 / sr;
  const sim = new E.Sim(lay, { pot: S.ctl.pot, light: S.light }); for (const k in sim.switches) if (P[sim.nl.elements.find((e) => e.id === k).p].mode === 'slide') sim.switches[k] = true;
  sim.fiberOn = S.ctl.fiberOn !== false;
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
    if (cfg.type === 'table') f = await measureFreq(lay, cfg.param === 'light' ? { light: x, pot: S.ctl.pot } : { pot: { ...S.ctl.pot, [cfg.id]: x } }, (sim) => { for (const k of cfg.press) sim.switches[k] = true; });
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
// Erősítő: a szimulátorból az átviteli görbe (mikrofon-ellenállás → hangszóróáram), a kondenzátorokat
// hangfrekvencián rövidzárnak véve (befagyasztott feszültséggel). A tablet mikrofonjának jele ezen a görbén megy át.
async function buildTransfer(cfg) {
  const lay = currentLayout(); const key = 'micamp' + JSON.stringify(lay);
  S.tables = S.tables || {}; if (S.tables[key]) return S.tables[key];
  const sim = new E.Sim(lay, { pot: S.ctl.pot }); for (const k in sim.switches) if (/^S1/.test(k)) sim.switches[k] = true;
  const p0 = 0.05; sim.mic[cfg.mic] = p0;
  for (let i = 0; i < 1000; i++) { sim.step(0.002); if (i % 200 === 0) await tick0(); }
  sim.freezeCaps = true;
  const N = 65, I = [];
  for (let k = 0; k < N; k++) { sim.mic[cfg.mic] = p0 + 0.05 * (-1 + 2 * k / (N - 1)); for (let j = 0; j < 4; j++) sim.step(1e-5); I.push(sim.cur[cfg.probe] || 0); }
  const i0 = I[(N - 1) / 2];
  const full = cfg.full || 0.1;   // ekkora áramváltozás (A) a teljes hangerő
  const tbl = I.map((v) => Math.max(-1, Math.min(1, (v - i0) / full)));
  S.tables[key] = tbl; return tbl;
}
function stopAudio() {
  if (S.audioNode && S.audioNode.type === 'micamp') {
    const n = S.audioNode; try { n.noise.stop(); } catch (e) { /* már leállt */ }
    try { if (n.src) n.src.disconnect(); n.gate.disconnect(); } catch (e) { /* nincs */ }
  }
  if (S.audio && S.audio.src) { try { S.audio.src.stop(); } catch (e) { /* már leállt */ } S.audio.src = null; }
  if (S.audioNode && S.audioNode.osc) { try { S.audioNode.osc.stop(); } catch (e) { /* már leállt */ } }
  if (S.audioNode && S.audioNode.srcs) for (const x of S.audioNode.srcs) { try { x.stop(); } catch (e) { /* már leállt */ } }
  S.audioNode = null;
}
async function setSound(on) {
  // minden indítás új „generáció”: a közben elavult (régebbi) indítás eredményét eldobjuk, így nem marad gazdátlan hangforrás
  const gen = S.audioGen = (S.audioGen || 0) + 1;
  S.soundOn = on; stopAudio(); S.audioBusy = false;
  if (!on) { renderControls(); return; }
  const ac = ensureAC(); if (!ac) { S.soundOn = false; renderControls(); return; }
  const cfg = audioCfg();
  if (cfg.type === 'loop') {
    const akey = JSON.stringify(currentLayout()) + (S.ctl.fiberOn === false ? '|sötét' : '');
    if (!S.audio || S.audio.key !== akey) {
      S.audioBusy = true; renderControls();
      const res = await buildLoop(); if (gen !== S.audioGen) return; S.audioBusy = false;
      if (!res) { S.audio = null; S.audioSilent = true; renderControls(); return; }
      S.audioSilent = false;
      S.audio = { key: akey, ...res };
    }
    if (!S.soundOn || gen !== S.audioGen) return;
    const src = ac.createBufferSource(); src.buffer = S.audio.buf; src.loop = true;
    const gain = ac.createGain(); src.connect(gain).connect(ac.destination);
    src.start(); S.audio.src = src; S.audio.gain = gain; syncSoundGate();
  } else if (cfg.type === 'ic') {
    const osc = ac.createOscillator(); osc.type = 'square';
    const g = ac.createGain(); g.gain.value = 0; osc.connect(g).connect(ac.destination); osc.start();
    S.audioNode = { type: 'ic', osc, gain: g };
  } else if (cfg.type === 'micamp') {
    S.audioBusy = true; renderControls();
    const tbl = await buildTransfer(cfg); if (gen !== S.audioGen) return; S.audioBusy = false;
    if (!S.soundOn) { renderControls(); return; }
    const curve = new Float32Array(1025);
    for (let i = 0; i < curve.length; i++) { const u = i / (curve.length - 1) * (tbl.length - 1); const k = Math.min(tbl.length - 2, Math.floor(u)); curve[i] = tbl[k] + (tbl[k + 1] - tbl[k]) * (u - k); }
    const pre = ac.createGain(); pre.gain.value = 3;
    const sh = ac.createWaveShaper(); sh.curve = curve; sh.oversample = '2x';
    const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 80;
    const gate = ac.createGain(); gate.gain.value = 0;
    const comp = ac.createDynamicsCompressor();
    pre.connect(sh).connect(hp).connect(gate).connect(comp).connect(ac.destination);
    let src = null; if (S.micStream) { src = ac.createMediaStreamSource(S.micStream); src.connect(pre); }
    // a „Fújj bele” gombhoz: tompított zaj (fújás hangja)
    const nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const ch = nb.getChannelData(0); let lp = 0;
    for (let i = 0; i < ch.length; i++) { lp += 0.15 * ((Math.random() * 2 - 1) - lp); ch[i] = lp * 2.5; }
    const noise = ac.createBufferSource(); noise.buffer = nb; noise.loop = true; const ng = ac.createGain(); ng.gain.value = 0;
    noise.connect(ng).connect(pre); noise.start();
    S.audioNode = { type: 'micamp', src, noise, ng, gate };
  } else if (cfg.type === 'radio') {
    // a műsort a szimuláció nem tudja venni: helyette egy kitalált, egyszerű dallam szól; mellette a sistergés
    const sr = ac.sampleRate, n = Math.round(sr * 6.4); const mb = ac.createBuffer(1, n, sr); const m = mb.getChannelData(0);
    const notes = [392, 440, 494, 523, 494, 440, 392, 330, 349, 392, 440, 392, 349, 330, 294, 330];
    for (let i = 0; i < n; i++) { const t = i / sr, k = Math.floor(t / 0.4) % notes.length, x = (t % 0.4) / 0.4; const env = Math.min(1, x * 20) * Math.exp(-x * 2.2); const f = notes[k]; m[i] = env * (0.5 * Math.sin(2 * Math.PI * f * t) + 0.2 * Math.sin(4 * Math.PI * f * t) + 0.15 * Math.sin(2 * Math.PI * f / 2 * t)); }
    const nb = ac.createBuffer(1, sr * 2, sr); const z = nb.getChannelData(0);
    for (let i = 0; i < z.length; i++) z[i] = (Math.random() * 2 - 1) * (Math.random() < 0.002 ? 3 : 0.6);
    const mus = ac.createBufferSource(); mus.buffer = mb; mus.loop = true; const gm = ac.createGain(); gm.gain.value = 0;
    const noi = ac.createBufferSource(); noi.buffer = nb; noi.loop = true; const gn = ac.createGain(); gn.gain.value = 0;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3500;   // a középhullámú adás hangja tompább
    mus.connect(gm).connect(lp); noi.connect(gn).connect(lp); lp.connect(ac.destination); mus.start(); noi.start();
    S.audioNode = { type: 'radio', srcs: [mus, noi], gm, gn };
  } else if (cfg.type === 'clicks') {
    S.audioNode = { type: 'clicks' }; S.lastI = null;
  } else {
    S.audioBusy = true; renderControls();
    const tbl = await buildTable(cfg); if (gen !== S.audioGen) return; S.audioBusy = false;
    if (!S.soundOn) { renderControls(); return; }
    const osc = ac.createOscillator(); osc.type = 'square';
    const g = ac.createGain(); g.gain.value = 0; osc.connect(g).connect(ac.destination); osc.start();
    S.audioNode = { type: cfg.type, osc, gain: g, tbl };
  }
  renderControls();
}
function syncSoundGate() { if (S.audio && S.audio.gain) S.audio.gain.gain.value = S.sim && Object.keys(S.sim.switches).filter((k) => /^S1/.test(k)).every((k) => S.sim.switches[k]) ? 0.35 : 0; }
function playClick() {
  const ac = S.ac; if (!ac) return;
  if (!S.clickBuf) {
    const n = Math.round(ac.sampleRate * 0.025); S.clickBuf = ac.createBuffer(1, n, ac.sampleRate); const ch = S.clickBuf.getChannelData(0);
    for (let i = 0; i < n; i++) ch[i] = Math.sin(i / ac.sampleRate * 2 * Math.PI * 1800) * Math.exp(-i / (n / 6)) * 0.6;
  }
  const src = ac.createBufferSource(); src.buffer = S.clickBuf; src.connect(ac.destination); src.start();
}
// mikrofon: a „Fújj bele” gomb vagy a tablet mikrofonjának hangereje nyomja a virtuális szénmikrofont
async function setMicInput(on) {
  const req = S.micReq = (S.micReq || 0) + 1;   // a közben elavult kérés eredményét eldobjuk
  if (!on) { S.micPending = false; if (S.micStream) S.micStream.getTracks().forEach((t) => t.stop()); S.micStream = null; S.micAn = null; if (S.soundOn && audioCfg().type === 'micamp') setSound(true); else renderControls(); return; }
  if (S.micPending) return; S.micPending = true;
  const ac = ensureAC(); if (!ac || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { S.micPending = false; S.micErr = 'Ez a böngésző nem engedi a mikrofont.'; renderControls(); return; }
  try {
    // az erősítős kísérleteknél visszhangszűrés: a tablet hangszórója ne gerjedjen be a mikrofonon át
    const echo = audioCfg().type === 'micamp';
    const st = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: echo, noiseSuppression: false, autoGainControl: false } });
    if (req !== S.micReq) { st.getTracks().forEach((t) => t.stop()); return; }   // közben kikapcsolták vagy kísérletet váltottak
    S.micPending = false;
    const src = ac.createMediaStreamSource(st); const an = ac.createAnalyser(); an.fftSize = 1024; src.connect(an);
    S.micStream = st; S.micAn = an; S.micBuf = new Float32Array(an.fftSize); S.micErr = null;
  } catch (e) { if (req !== S.micReq) return; S.micPending = false; S.micErr = 'A mikrofont nem engedélyezted, vagy nem érhető el. A „Fújj bele” gomb így is működik.'; }
  if (S.soundOn && audioCfg().type === 'micamp') setSound(true); else renderControls();
}
function micFrame(dtR) {
  const sim = S.sim; if (!sim) return;
  const ids = Object.keys(sim.mic); if (!ids.length) return;
  let target = S.micBlow ? 1 : 0;
  if (S.micAn) {
    S.micAn.getFloatTimeDomainData(S.micBuf); let q = 0; for (const x of S.micBuf) q += x * x;
    const rms = Math.sqrt(q / S.micBuf.length); target = Math.max(target, Math.min(1, Math.max(0, (rms - 0.01) * 7)));
  }
  // gyors felfutás, lassabb lecsengés, mint egy valódi membránnál
  const p0 = S.micP || 0; S.micP = target > p0 ? p0 + (target - p0) * Math.min(1, dtR * 40) : p0 + (target - p0) * Math.min(1, dtR * 8);
  for (const id of ids) sim.mic[id] = S.micP;
  if (S.micBar) S.micBar.style.width = Math.round(S.micP * 100) + '%';
}

// képkockánként: a sziréna vezérlőkondenzátora és a hang követése
function audioFrame(dtR) {
  const sim = S.sim; if (!sim) return; const cfg = audioCfg(); micFrame(dtR);
  if (cfg.type === 'siren') {
    // a C5 egyszerűsített, valós idejű modellje (a teljes kapcsolás hangfrekvencián nem számolható valós időben):
    // töltés a gombon és az R4-en át, kisülés a bázisellenálláson át (a bázis nagyjából az idő felében vezet)
    const press = sim.switches.S1 && sim.switches.S2; let v = S.vc || 0;
    const iIn = press ? (3 - v) / cfg.R : 0; const iOut = v > 0.65 ? (v - 0.65) / cfg.Rb * 0.5 : 0;
    v += (iIn - iOut) / cfg.C * dtR; S.vc = Math.max(0, Math.min(3, v));
    sim.capV[cfg.cap] = S.vc;
  }
  const n = S.audioNode; if (!n || !S.soundOn) return;
  if (n.type === 'radio') {
    const tt = S.ac.currentTime; const st = sim.ic[cfg.ic], amp = sim.ic[cfg.amp];
    const on = Object.keys(sim.switches).filter((k) => /^S1/.test(k)).every((k) => sim.switches[k]) && st && st.active && amp && amp.active;
    const vol = on ? Math.max(0, Math.min(1, 1 - (sim.pot[cfg.pot] != null ? sim.pot[cfg.pot] : 0.5))) : 0;
    const mt = st ? st.match : 0;
    n.gm.gain.setTargetAtTime(0.35 * vol * mt, tt, 0.05);
    n.gn.gain.setTargetAtTime(vol * (st && st.f0 ? 0.03 + 0.1 * (1 - mt) : 0.04), tt, 0.05);
    return;
  }
  if (n.type === 'micamp') {
    const tt = S.ac.currentTime; const on = Object.keys(sim.switches).filter((k) => /^S1/.test(k)).every((k) => sim.switches[k]);
    n.gate.gain.setTargetAtTime(on ? 0.8 : 0, tt, 0.02);
    n.ng.gain.setTargetAtTime(S.micBlow ? 0.35 : 0, tt, 0.03);
    return;
  }
  if (n.type === 'ic') {
    const st = sim.ic[cfg.ic]; const spk = cfg.builtin || Math.abs(sim.cur.SP || 0) > 0.001;
    const tt = S.ac.currentTime;
    if (st && st.f > 0) n.osc.frequency.setTargetAtTime(st.f, tt, 0.004);
    n.gain.gain.setTargetAtTime(st && st.on && spk ? 0.1 : 0, tt, 0.006);
    return;
  }
  if (n.type === 'clicks') { const I = sim.cur[cfg.probe] || 0; if (S.lastI != null && Math.abs(I - S.lastI) > 0.004) playClick(); S.lastI = I; return; }
  const x = n.type === 'siren' ? S.vc : cfg.param === 'light' ? S.light : sim.pot[cfg.id];
  const f = interp(n.tbl, x);
  const gate = sim.switches.S1 && f > 0 && (n.type !== 'table' || cfg.press.every((k) => sim.switches[k]));
  const t = S.ac.currentTime;
  n.osc.frequency.setTargetAtTime(Math.max(40, f || 40), t, 0.015);
  n.gain.gain.setTargetAtTime(gate ? 0.1 : 0, t, 0.01);
}

// ---------- vezérlők a rács alatt ----------
// Nyomva tartandó gomb: érintés, egér és billentyűzet (szóköz / Enter) egyaránt; fókuszvesztéskor elenged.
function holdify(b, down, up) {
  let held = false;
  const d = (e) => { if (held) return; held = true; down(e); };
  const u = () => { if (!held) return; held = false; up(); };
  b.addEventListener('pointerdown', d); b.addEventListener('pointerup', u); b.addEventListener('pointerleave', u); b.addEventListener('pointercancel', u);
  b.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) d(e); });
  b.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') u(); });
  b.addEventListener('blur', u);
}
function renderControls() {
  const box = $('#ctrls'); box.innerHTML = '';
  const ex = EXPS[S.exp];
  const live = S.stage >= 3;
  const status = $('#status'); status.innerHTML = '';
  S.meterRead = null; S.micBar = null; S.tuneRead = null; S.probeEls = S.probeEls || null;
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
      holdify(b, down, up);
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
      holdify(cover, down, up);
      box.append(cover);
    } else if (typeof c === 'object' && c.toggle) {
      const b = document.createElement('button'); b.className = 'ctrl'; b.setAttribute('aria-pressed', String(!!S.sim.switches[c.toggle]));
      b.innerHTML = '<span class="knob"></span> <span></span>'; b.lastChild.textContent = c.label || c.toggle;
      b.onclick = () => { S.sim.switches[c.toggle] = !S.sim.switches[c.toggle]; b.setAttribute('aria-pressed', String(S.sim.switches[c.toggle])); syncSoundGate(); };
      box.append(b);
    } else if (typeof c === 'object' && c.fiber) {
      const b = document.createElement('button'); b.className = 'ctrl'; b.setAttribute('aria-pressed', String(S.sim.fiberOn));
      b.innerHTML = '<span class="knob"></span> Fény a kábelben';
      b.onclick = () => { S.ctl.fiberOn = S.sim.fiberOn = !S.sim.fiberOn; b.setAttribute('aria-pressed', String(S.sim.fiberOn)); if (S.soundOn) setSound(true); };
      box.append(b);
    } else if (typeof c === 'object' && c.mic) {
      const b = document.createElement('button'); b.className = 'ctrl hold'; b.textContent = 'Fújj bele!';
      const down = (e) => { e.preventDefault(); S.micBlow = true; b.classList.add('down'); };
      const up = () => { S.micBlow = false; b.classList.remove('down'); };
      holdify(b, down, up);
      const m = document.createElement('button'); m.className = 'ctrl'; m.setAttribute('aria-pressed', String(!!S.micStream));
      m.innerHTML = '<span class="knob"></span> Tablet mikrofonja';
      m.onclick = () => setMicInput(!(S.micStream || S.micPending));
      const lvl = document.createElement('div'); lvl.className = 'miclevel'; lvl.innerHTML = '<span>Hangerő</span><i><b></b></i>';
      S.micBar = lvl.querySelector('b');
      box.append(b, m, lvl);
      if (S.micErr) { const n = document.createElement('p'); n.className = 'note'; n.style.margin = '0'; n.textContent = S.micErr; box.append(n); }
    } else if (typeof c === 'object' && c.remote) {
      const b = document.createElement('button'); b.className = 'ctrl hold';
      b.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="7" r="2" fill="currentColor"/><path d="M10 12h4M10 15h4M10 18h4" stroke="currentColor" stroke-width="1.6"/></svg> Távirányító gombja';
      const set = (v) => { if (S.sim && S.sim.ic[c.remote]) S.sim.ic[c.remote].remote = v; };
      const down = (e) => { e.preventDefault(); set(true); b.classList.add('down'); };
      const up = () => { set(false); b.classList.remove('down'); };
      holdify(b, down, up);
      box.append(b);
    } else if (typeof c === 'object' && c.press) {
      const b = document.createElement('button'); b.className = 'ctrl hold';
      b.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="12" r="3.5" fill="currentColor"/></svg> <span></span>';
      b.querySelector('span').textContent = c.label || c.press;
      const down = (e) => { e.preventDefault(); S.sim.switches[c.press] = true; b.classList.add('down'); };
      const up = () => { if (S.sim) S.sim.switches[c.press] = false; b.classList.remove('down'); };
      holdify(b, down, up);
      box.append(b);
    } else if (typeof c === 'object' && c.tune) {
      const w = document.createElement('div'); w.className = 'lightctl';
      const id = 'tune-' + c.tune;
      w.innerHTML = '<label for="' + id + '"></label><input id="' + id + '" type="range" min="0" max="1" step="0.002"><span class="tuneread"></span>';
      w.querySelector('label').textContent = c.label || c.tune;
      const inp = w.querySelector('input'); inp.value = S.sim.tune[c.tune];
      inp.oninput = () => { S.ctl.tune[c.tune] = S.sim.tune[c.tune] = +inp.value; };
      S.tuneRead = { el: w.querySelector('.tuneread'), ic: c.ic };
      box.append(w);
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
      for (const rg of (c.ranges || Object.keys(E.METER))) {   // ahol más állás veszélyes (rövidzár a mérőn át), ott csak a megengedett
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
        holdify(b, down, up);
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
      holdify(b, down, up);
      box.append(b);
    } else if (c === 'sound') {
      const b = document.createElement('button'); b.className = 'ctrl'; b.setAttribute('aria-pressed', String(S.soundOn));
      b.innerHTML = '<span class="knob"></span> ' + (S.audioBusy ? 'Hang készül…' : 'Hang' + (S.soundOn && S.audioSilent ? ' · most csend' : S.audio && S.soundOn ? ' · kb. ' + Math.round(S.audio.freq) + ' Hz' : ''));
      b.disabled = !!S.audioBusy;
      b.onclick = () => setSound(!S.soundOn);
      box.append(b);
    }
  }
}

function updateTuneRead() {
  if (!S.tuneRead || !S.sim) return; const st = S.sim.ic[S.tuneRead.ic]; if (!st) return;
  const txt = !st.f0 ? 'nincs hangolt kör' : Math.round(st.f0 / 1000) + ' kHz' + (st.match > 0.5 ? ' · ' + st.station : st.match > 0.1 ? ' · halkan jön egy adó' : ' · csak sistergés');
  if (S.tuneRead.el.textContent !== txt) S.tuneRead.el.textContent = txt;
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
    if (k === 'ic') { const st = sim.ic[e.id]; rows.push([e.id + ' állapota', st.active ? (st.f ? 'működik, ' + Math.round(st.f) + ' Hz' : 'működik') : 'áll']); }
    if (k === 'mic') { rows.push([e.id + ' ellenállása', (1 + 9 * (sim.mic[e.id] || 0)).toFixed(1).replace('.', ',') + ' kΩ']); }
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
    if (c && typeof c === 'object' && (def.kind === 'npn' || def.kind === 'pnp')) extra = '<p><b style="font-size:16px;display:inline">Most:</b> bázis ' + fmtA(c.B) + ', kollektor ' + fmtA(c.C) + '</p>';
    else if (c && typeof c === 'object' && def.kind === 'pot') extra = '<p><b style="font-size:16px;display:inline">Most:</b> a csúszkán ' + fmtA(c.w || 0) + '</p>';
    else if (c && typeof c === 'object' && def.kind === 'ic' && typeof c.P === 'number') extra = '<p><b style="font-size:16px;display:inline">Most:</b> a tápból felvett áram ' + fmtA(c.P) + (typeof c.OUT === 'number' && Math.abs(c.OUT) > 1e-4 ? ', a kimeneten ' + fmtA(c.OUT) : '') + '</p>';
  }
  const kits = kitsHaving(pl.p).map((k) => '<span class="chip k' + k + '">' + KIT_SHORT[k] + '</span>').join(' ');
  const card = cardFor(pl.p);
  showPop('<b>' + def.name + (def.kind !== 'wire' && def.kind !== 'jumper' ? ' · ' + def.short : '') + '</b><p>' + ab[1] + '</p>' + extra + (kits ? '<p style="display:flex;gap:4px;flex-wrap:wrap">' + kits + '</p>' : '') + (card && card !== EXPS[S.exp] ? '<button class="mini" data-card="1">Ismerd meg! (alkatrész-album)</button>' : ''), ev.clientX, ev.clientY);
  const cb = $('#pop').querySelector('[data-card]'); if (cb) cb.onclick = () => { $('#pop').hidden = true; openCard(EXPS.indexOf(card)); };
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
function sortKey(p) { const k = P[p].kind; return ['bat', 'sw', 'ic', 'res', 'pot', 'led', 'cap', 'npn', 'pnp', 'photo', 'mic', 'lamp', 'spk', 'motor', 'meter', 'jumper', 'wire'].indexOf(k) * 10 + (P[p].n || 0); }
function miniIcon(p) {
  const def = P[p]; const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 58 34');
  if (def.kind === 'wire') { svgEl('rect', { x: 4, y: 11, width: 50, height: 12, rx: 6, fill: COLORS.wire }, s); const t = svgEl('text', { x: 29, y: 21, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 800, fill: '#fff' }, s); t.textContent = def.n; return s; }
  if (def.kind === 'jumper') { svgEl('path', { d: 'M6,10 C14,34 44,34 52,10', fill: 'none', stroke: JUMPER_COLOR[def.color], 'stroke-width': 4, 'stroke-linecap': 'round' }, s); return s; }
  if (def.kind === 'ic') { svgEl('rect', { x: 3, y: 4, width: 52, height: 26, rx: 6, fill: partColor(def) }, s); }
  else if (def.kind === 'npn' || def.kind === 'pnp' || def.kind === 'pot') { svgEl('path', { d: 'M12,9 L46,9 L29,26 Z', fill: partColor(def), stroke: partColor(def), 'stroke-width': 10, 'stroke-linejoin': 'round' }, s); }
  else svgEl('rect', { x: 3, y: 6, width: 52, height: 22, rx: 7, fill: partColor(def) }, s);
  const t = svgEl('text', { x: 29, y: def.kind === 'npn' || def.kind === 'pnp' ? 19 : 21, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 800, fill: def.kind === 'res' || def.kind === 'motor' ? '#3B2A00' : '#fff', 'font-family': 'var(--font-display)' }, s); t.textContent = def.short;
  return s;
}

// ---------- építési lépések szövege ----------
function stepText(pl, level, layout) {
  const def = P[pl.p]; const geo = E.geometry(pl);
  const nbd = layout ? boardsOf(layout) : 1;
  const pn = (s) => { const n = E.postName(s.r, s.c); if (nbd < 2) return n; const m = /^(\d):(.*)$/.exec(n); return m ? m[1] + '. rács ' + m[2] : '1. rács ' + n; };
  const lv = S.age === 'k' ? (level === 1 ? 'a rácsra' : 'a többi alkatrész tetejére') : level === 1 ? 'közvetlenül a rácsra (1. szint)' : 'a már lerakott alkatrészek tetejére (' + level + '. szint)';
  const ex = EXPS[S.exp];
  if (def.kind === 'fiber') return `Húzd rá az üvegszálas kábel átlátszó tartóját a LED-re (${pn(geo.snaps[0])}), a fekete tartót a fototranzisztorra (${pn(geo.snaps[1])}), és dugd be a kábel két végét a tartókba. A Light dobozban találod.`;
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
  if (def.kind === 'ic') {
    const nm = (q) => (q.term === 'P' ? '(+)' : q.term === 'N' ? '(−)' : q.term);
    const legs = geo.snaps.map((q) => nm(q) + ': ' + pn(q)).join(', ');
    const rot = pl.dir === 'u' ? ', balra fordítva (a felirat alulról felfelé olvasható)' : pl.dir === 'd' ? ', jobbra fordítva (a felirat felülről lefelé olvasható)' : pl.dir === 'l' ? ', fejjel lefelé' : ', a felirattal olvashatóan';
    return `Tedd le ${IC_COLORNAME[def.short] || 'a'} ${def.name} modult (${def.short}) ${lv}${rot}. A lábai: ${legs}.`;
  }
  if (def.kind === 'pot') {
    const a = geo.snaps.find((s2) => s2.term === 'a'), b = geo.snaps.find((s2) => s2.term === 'b'), w = geo.snaps.find((s2) => s2.term === 'w');
    return `Tedd le a zöld állítható ellenállást (RV) ${lv}: a két szélső lába ${art(pn(a))} és ${art(pn(b))} pontra, a középső lába (a csúszka) ${art(pn(w))} pontra kerüljön.`;
  }
  if (def.kind === 'meter') {
    const rg = ex.sim && ex.sim.meter && ex.sim.meter[pl.id || pl.p];
    const only = ex.controls.some((c) => c && c.meter === (pl.id || pl.p) && c.ranges);
    return `Tedd le a mérőműszert (M6) ${art(pn(geo.snaps[0]))} és ${art(pn(geo.snaps[1]))} pont közé, ${lv}. A + jele ${art(pn(geo.snaps[0]))} pont felé nézzen.` + (rg ? ` Állítsd a kapcsolóját ${E.METER[rg].label === '5 V' ? 'az' : 'a'} ${E.METER[rg].label} állásba.` : '') + (only ? ' Ennél a kísérletnél más állásba ne kapcsold: áramállásban a mérőn át rövidre zárnád az elemet.' : '');
  }
  if (def.kind === 'motor') return `Tedd le a motort (${def.short}) ${art(pn(geo.snaps[0]))} és ${art(pn(geo.snaps[1]))} pont közé, ${lv}. A + jele ${art(pn(geo.snaps[0]))} pontnál legyen. Tedd rá a propellert. Amíg forog, ne hajolj fölé, és ne nyúlj hozzá; ha a motor fordítva forog, a propeller leröppenhet.`;
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
  // ugyanazon a lépésen belüli újrarajzolásnál (pl. válasz után) a panel görgetési helyzete megmarad
  const pkey = S.exp + ':' + S.stage + ':' + S.step, oldBody = panel.querySelector('.pbody');
  const keepScroll = oldBody && S.panelKey === pkey ? oldBody.scrollTop : 0; S.panelKey = pkey;
  panel.innerHTML = '';
  requestAnimationFrame(() => { const b = panel.querySelector('.pbody'); if (b && keepScroll) b.scrollTop = keepScroll; });
  meterBox = null;
  if (ex.card) { renderCardPanel(ex); return; }
  const head = el('div'); head.append(el('h2', null, ex.title), el('div', 'tag', ex.tag)); panel.append(head);
  const st = el('div', 'stages'); st.setAttribute('role', 'tablist');
  STAGES.forEach((name, i) => {
    const b = el('button', 'stage' + (i <= (S.maxStage || 0) ? ' seen' : '')); b.innerHTML = '<span>' + (i + 1) + '</span>' + name;
    if (i === S.stage) b.setAttribute('aria-current', 'step');
    b.onclick = () => goStage(i);
    st.append(b);
  });
  panel.append(st);
  const body = el('div', 'pbody'); body.style.display = 'flex'; body.style.flexDirection = 'column'; body.style.gap = '14px';
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
    optOrder(ex.id + ':guess', q.opts.length).forEach((idx) => { const [txt, icon] = q.opts[idx];
      const b = el('button', 'opt'); b.append(guessIcon(icon)); b.append(document.createTextNode(txt));
      if (S.guess != null) { if (idx === q.right) b.classList.add('right'); else if (idx === S.guess) b.classList.add('wrong'); }
      b.onclick = () => { S.guess = idx; renderPanel(); if (S.autoread) speak(feedbackText(idx === q.right, 'Eltaláltad!', q.after[S.age])); };
      opts.append(b);
    });
    body.append(opts);
    if (S.guess != null) {
      body.append(feedbackEl(S.guess === q.right, 'Eltaláltad!', q.after[S.age]));
      body.append(el('p', 'note', 'Most próbáld ki a valódi áramkörön is, aztán nézd meg itt, mi történik belül.'));
    }
    back('Vissza', () => goStage(1));
    next('Próbáljuk ki', () => { if (q.variant) S.variants[q.variant] = false; goStage(3); });
  } else if (S.stage >= 3) {
    if (S.stage === 3) {
      body.append(sayBlock(ex.hint[S.age], { auto: true }));
      if (ex.inside) body.append(insideCard(ex));
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
      if (ex.inside) body.append(insideCard(ex));
      if (ex.check) body.append(checkCard(ex));
      if (S.age === 'n') {
        body.append(el('h3', null, 'Mérőműszer'));
        meterBox = el('div', 'meter'); body.append(meterBox);
        body.append(el('p', 'note', 'Koppints a rács egy pontjára, és megmutatja a feszültségét.'));
      } else if (S.age === 'm') {
        body.append(el('p', 'note', 'Koppints bármelyik alkatrészre, és elmondja, mire való. A sárga pöttyök az áram útját mutatják.'));
      }
      back('Vissza', () => goStage(3));
      const nxt = EXPS.slice(S.exp + 1).find((e) => !e.card);
      if (nxt) next('Következő: ' + nxt.title, () => { markDone(); selectExp(EXPS.indexOf(nxt)); });
      else next('Kész vagyok', () => { markDone(); renderStrip(); });
    }
    if (S.age === 'n' && S.stage === 3) { body.append(el('h3', null, 'Mérőműszer')); meterBox = el('div', 'meter'); body.append(meterBox); }
  }
  panel.append(nav);
}

// „Ellenőrizd magad!”: egy új helyzetről szóló kérdés a kísérlet végén (megértette-e, nem csak megcsinálta)
// a válaszlehetőségek sorrendje kérdésenként rögzített, de keverhető (különben mindig az első lenne a jó)
function optOrder(key, n) {
  let h = 2166136261; for (const ch of key) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; const j = h % (i + 1); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return idx;
}
// a visszajelzés: jó válasznál nem kettőzzük az „Igen!”-t, rossz válasznál elhagyjuk az elején álló helyeslést
const AFFIRM = /^(Igen|Így van|Pontosan|Úgy van)[!,.]\s*/;
function feedbackText(ok, okWord, after) { return ok ? (AFFIRM.test(after) ? after : okWord + ' ' + after) : 'Nem egészen. ' + after.replace(AFFIRM, ''); }
function feedbackEl(ok, okWord, after) {
  const t = feedbackText(ok, okWord, after); const m = /^(\S+(?: \S+)?[!.]) (.*)$/.exec(t);
  const f = el('div', 'feedback'); f.append(el('b', null, m ? m[1] + ' ' : ''), document.createTextNode(m ? m[2] : t)); return f;
}
function checkCard(ex) {
  const q = ex.check; const d = el('div', 'checkq');
  d.append(el('h3', null, 'Ellenőrizd magad!'));
  d.append(sayBlock(q.q[S.age]));
  const opts = el('div', 'opts');
  optOrder(ex.id + ':check', q.opts.length).forEach((idx) => { const [txt, icon] = q.opts[idx];
    const b = el('button', 'opt'); b.append(guessIcon(icon)); b.append(document.createTextNode(txt));
    if (S.check != null) { if (idx === q.right) b.classList.add('right'); else if (idx === S.check) b.classList.add('wrong'); }
    b.onclick = () => { S.check = idx; if (ex.card && idx === q.right) { markDone(); renderAlbumCount(); } renderPanel(); if (S.autoread) speak(feedbackText(idx === q.right, 'Igen!', q.after[S.age])); };
    opts.append(b);
  });
  d.append(opts);
  if (S.check != null) d.append(feedbackEl(S.check === q.right, 'Igen!', q.after[S.age]));
  if (ex.card && S.check === q.right) d.append(el('p', 'sticker-got', 'Megvan a matrica! ⭐ Nézd meg az albumban.'));
  return d;
}
function insideCard(ex) {
  const d = el('div', 'inside');
  const h = el('div', 'vh'); h.append(el('b', null, ex.inside.title));
  const t = el('button', 'mini', S.icOpen ? 'Csukd be az IC-t' : 'Nyisd ki az IC-t'); t.setAttribute('aria-pressed', String(!!S.icOpen));
  t.onclick = () => { S.icOpen = !S.icOpen; refreshBoard(); renderPanel(); };
  h.append(t); d.append(h);
  if (S.icOpen) {
    d.append(sayBlock(ex.inside.text[S.age]));
    const ol = el('ol', 'blocks'); for (const b of ex.inside.blocks) ol.append(el('li', null, b)); d.append(ol);
    const row = el('div', 'built'); row.append(el('span', 'note', 'Ezeket már megépítetted, nézd meg újra:'));
    for (const id of ex.inside.built) {
      const i = EXPS.findIndex((x) => x.id === id); if (i < 0) continue;
      const b = el('button', 'mini', EXPS[i].chapter + ' · ' + EXPS[i].title); b.onclick = () => { selectExp(i); goStage(3); };
      row.append(b);
    }
    d.append(row);
  }
  return d;
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
// kísérlet- vagy lépésváltáskor a munkaterület (rács + kezelőszervek + szöveg) a képernyő tetejére kerül,
// hogy tableten egyszerre látszódjon a rács és a kapcsolók (a fejléc és a választósor fölé görgetődik)
function focusWork() {
  if (!S.booted) return;
  const m = document.querySelector('.main'); if (!m) return;
  // a munkaterület teteje a ragadós fejléc alá kerüljön (telefonon a fejléc nem ragad, ott a képernyő tetejére)
  const hd = $('.top'); const off = (hd && getComputedStyle(hd).position === 'sticky' ? hd.offsetHeight : 0) + 8;
  const top = m.getBoundingClientRect().top;
  if (Math.abs(top - off) < 24 && top >= off - 4) return;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: Math.max(0, scrollY + top - off), behavior: reduce ? 'auto' : 'smooth' });
}
function goStage(i) {
  const prev = S.stage;
  S.stage = i; S.maxStage = Math.max(S.maxStage || 0, i);
  if (i === 1 && prev !== 1) S.step = Math.min(S.step, EXPS[S.exp].layout.length - 1);
  if (i >= 3 && (!S.sim || prev < 3)) startSim();
  if (i < 3 && S.soundOn) setSound(false);
  if (i < 3 && (S.micStream || S.micPending)) setMicInput(false);
  $('#pop').hidden = true;
  store.set('stage', i);
  refreshBoard(); renderPanel(); renderControls();
  focusWork();
}
// ---------- alkatrész-album ----------
const CARD_LIST = () => EXPS.filter((e) => e.card);
// melyik kártya tartozik egy alkatrészhez (azonos fajta: pl. bármelyik ellenállás → az ellenállás kártyája)
function cardFor(p) {
  const k = P[p].kind; const list = CARD_LIST();
  return list.find((c) => c.part === p) || list.find((c) => P[c.part].kind === k) || null;
}
function openCard(i) { showAlbum(false); selectExp(i); focusWork(); }
// vissza a kísérletekhez: oda, ahol a gyerek utoljára járt (ha nincs ilyen, az első még el nem végzett kísérlethez)
function backToExps() {
  showAlbum(false);
  if (!EXPS[S.exp].card) return;
  let i = S.lastExp;
  if (i == null || !EXPS[i] || EXPS[i].card) { i = EXPS.findIndex((e) => !e.card && !S.done[e.id]); if (i < 0) i = 0; }
  selectExp(i); focusWork();
}
function renderAlbumCount() { const c = $('#albumcount'); if (c) { const list = CARD_LIST(); c.textContent = list.filter((e) => S.done[e.id]).length + ' / ' + list.length; } }
function showAlbum(on) {
  S.album = on;
  $('#album').hidden = !on; $('.main').hidden = on; setDrawer(false); updateNow();
  $('#albumbtn').setAttribute('aria-pressed', String(on));
  if (on) {
    if (S.soundOn) setSound(false);
    if (S.micStream || S.micPending) setMicInput(false);
    renderAlbum();
    const a = $('#album'); const top = a.getBoundingClientRect().top; if (S.booted && top < 0) window.scrollTo({ top: Math.max(0, scrollY + top - 8) });
  }
}
function renderAlbum() {
  const box = $('#albumgrid'); box.innerHTML = '';
  for (const c of CARD_LIST()) {
    const i = EXPS.indexOf(c); const got = !!S.done[c.id];
    const b = el('button', 'sticker' + (got ? ' got' : '')); b.setAttribute('aria-label', c.title + (got ? ', megvan a matrica' : ''));
    const ic = el('div', 'sicon'); ic.append(symbolSvg(c.symbol)); b.append(ic);
    b.append(el('b', null, c.title), el('small', null, c.tag));
    if (got) b.append(el('span', 'star', '⭐'));
    b.onclick = () => openCard(i);
    box.append(b);
  }
  renderAlbumCount();
}
// rajzjelek (kapcsolási rajz) az albumhoz és a kártyákhoz
function symbolSvg(kind) {
  const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 120 60'); s.setAttribute('aria-hidden', 'true');
  const g = svgEl('g', { fill: 'none', stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s);
  const P2 = (d) => svgEl('path', { d }, g);
  const txt = (x, y, t, size) => { const e = svgEl('text', { x, y, 'text-anchor': 'middle', 'font-size': size || 14, 'font-weight': 800, fill: 'currentColor', stroke: 'none' }, s); e.textContent = t; };
  switch (kind) {
    case 'bat': P2('M10,30 H50 M70,30 H110 M50,14 V46 M58,22 V38 M62,14 V46 M70,22 V38'); txt(44, 12, '+'); break;
    case 'wire': P2('M10,30 H110'); svgEl('circle', { cx: 10, cy: 30, r: 4, fill: 'currentColor' }, g); svgEl('circle', { cx: 110, cy: 30, r: 4, fill: 'currentColor' }, g); break;
    case 'sw': P2('M10,40 H40 M80,40 H110 M40,40 L78,22'); svgEl('circle', { cx: 40, cy: 40, r: 3, fill: 'currentColor' }, g); svgEl('circle', { cx: 80, cy: 40, r: 3, fill: 'currentColor' }, g); break;
    case 'led': P2('M10,30 H45 M75,30 H110 M45,14 V46 L75,30 Z M75,14 V46 M64,12 L74,2 M74,12 L84,2'); P2('M70,2 H74 V6 M80,2 H84 V6'); break;
    case 'res': P2('M10,30 H30 L36,18 L46,42 L56,18 L66,42 L76,18 L86,42 L90,30 H110'); break;
    case 'lamp': P2('M10,30 H40 M80,30 H110'); svgEl('circle', { cx: 60, cy: 30, r: 20 }, g); P2('M46,16 L74,44 M74,16 L46,44'); break;
    case 'motor': P2('M10,30 H40 M80,30 H110'); svgEl('circle', { cx: 60, cy: 30, r: 20 }, g); txt(60, 36, 'M', 18); break;
    case 'spk': P2('M10,22 H40 M10,38 H40 M40,18 H52 V42 H40 Z M52,18 L72,6 V54 L52,42'); break;
    case 'cap': P2('M10,30 H52 M68,30 H110 M52,12 V48 M68,12 Q60,30 68,48'); txt(44, 12, '+'); break;
    case 'pot': P2('M10,40 H30 L36,28 L46,52 L56,28 L66,52 L76,28 L86,52 L90,40 H110 M60,8 V26 M54,20 L60,27 L66,20'); break;
    case 'photo': svgEl('circle', { cx: 64, cy: 32, r: 22 }, g); P2('M56,18 V46 M20,32 H56 M56,24 L84,10 M56,40 L84,54 M76,50 L84,54 L78,46 M14,8 L30,20 M24,4 L40,16 M26,20 H30 V16 M36,16 H40 V12'); break;
    case 'mic': P2('M10,30 H38 M82,30 H110 M38,10 V50'); svgEl('circle', { cx: 60, cy: 30, r: 22 }, g); break;
    case 'npn': svgEl('circle', { cx: 64, cy: 30, r: 24 }, g); P2('M56,14 V46 M20,30 H56 M56,22 L82,6 M56,38 L82,54 M72,52 L82,54 L78,44'); txt(18, 52, 'B', 12); txt(100, 10, 'C', 12); txt(100, 58, 'E', 12); break;
    case 'pnp': svgEl('circle', { cx: 64, cy: 30, r: 24 }, g); P2('M56,14 V46 M20,30 H56 M56,22 L82,6 M56,38 L82,54 M66,38 L57,39 L62,47'); txt(18, 52, 'B', 12); txt(100, 10, 'C', 12); txt(100, 58, 'E', 12); break;
    case 'meter': P2('M10,30 H38 M82,30 H110'); svgEl('circle', { cx: 60, cy: 30, r: 22 }, g); txt(60, 36, 'A', 18); break;
    case 'ic': P2('M30,10 H90 V50 H30 Z M18,20 H30 M18,40 H30 M90,20 H102 M90,40 H102'); txt(60, 36, 'IC', 16); break;
  }
  return s;
}
// élő mérőszámok a kártyákon
function probeVal(pr) {
  const sim = S.sim; if (!sim) return null;
  const id = pr.ids.find((x) => sim.cur[x] != null); if (!id) return null;
  const c = sim.cur[id];
  if (pr.ratio) { const b = Math.abs(c.B), cc = Math.abs(c.C); return b > 2e-7 ? Math.round(cc / b) + '×' : '–'; }
  const v = pr.term ? c[pr.term] : c; return typeof v === 'number' ? fmtA(Math.abs(v)) : null;
}
function updateProbes() { if (!S.probeEls) return; for (const [pr, e] of S.probeEls) { const v = probeVal(pr); const t = v == null ? '–' : v; if (e.textContent !== t) e.textContent = t; } }
// figyelmeztetés: túl nagy áram (a valódi alkatrész tönkremenne) vagy rövidzár
function updateWarn() {
  const st = $('#status'); let w = st.querySelector('.pill.warn');
  let msg = '';
  if (S.sim && S.stage >= 3) {
    for (const e of S.sim.nl.elements) {
      if (e.internal) continue; const c = S.sim.cur[e.id];
      if (e.def.kind === 'led' && typeof c === 'number' && c > 0.03) msg = 'Túl nagy áram a LED-en (' + fmtA(c) + '): a valódi LED kiégne!';
      if (e.def.kind === 'bat' && typeof c === 'number' && Math.abs(c) > 1) msg = 'Rövidzár: ' + fmtA(Math.abs(c)) + ' folyik az elemből!';
      if (e.def.kind === 'meter') { const r = S.sim.meterReading(e.id); if (Math.abs(r.frac) > 1.2) msg = 'A mérő túlterhelődik (' + Math.abs(r.frac).toFixed(1).replace('.', ',') + '-szoros): kapcsolj nagyobb állásba!'; }
    }
  }
  // csak a tartós túláramot jelezzük (a kondenzátor feltöltésekor egy pillanatra folyó nagy áram nem rövidzár)
  S.warnN = msg ? (S.warnN || 0) + 1 : 0; if (S.warnN < 3) msg = '';
  if (msg && !w) { w = el('span', 'pill warn'); st.append(w); }
  if (w) { if (msg) w.textContent = '⚠ ' + msg; else w.remove(); }
}
function renderCardPanel(ex) {
  const head = el('div'); head.append(el('div', 'cardkicker', 'Alkatrész-album'), el('h2', null, ex.title), el('div', 'tag', ex.tag)); panel.append(head);
  const body = el('div', 'pbody'); body.style.display = 'flex'; body.style.flexDirection = 'column'; body.style.gap = '14px'; panel.append(body);
  body.append(sayBlock(ex.intro[S.age], { auto: true }));
  const sym = el('div', 'symrow'); const sv = el('div', 'symbox'); sv.append(symbolSvg(ex.symbol)); sym.append(sv);
  const an = el('div', 'analogy'); an.append(el('b', null, 'Hasonlat: '), document.createTextNode(ex.analogy)); sym.append(an);
  body.append(sym);
  body.append(el('h3', null, 'Próbáld ki'));
  body.append(sayBlock(ex.hint[S.age]));
  if (ex.variants.length) {
    const ch = el('div', 'choices'); ch.setAttribute('role', 'group'); ch.setAttribute('aria-label', 'Változatok');
    const opt = (label, id) => { const on = id ? !!S.variants[id] : !ex.variants.some((v) => S.variants[v.id]); const b = el('button', 'mini', label); b.setAttribute('aria-pressed', String(on)); b.onclick = () => { S.variants = id ? { [id]: true } : {}; startSim(); refreshBoard(); renderPanel(); renderControls(); if (S.soundOn) setSound(true); }; ch.append(b); };
    opt('Alap', null); for (const v of ex.variants) opt(v.label, v.id);
    body.append(ch);
    const act = ex.variants.find((v) => S.variants[v.id]); if (act) body.append(el('p', 'note', act.real));
  }
  S.probeEls = [];
  if (ex.probes && ex.probes.length) {
    const pb = el('div', 'meter');
    for (const pr of ex.probes) { const d = el('div'); d.append(el('small', null, pr.label)); const v = el('b', null, '–'); d.append(v); pb.append(d); S.probeEls.push([pr, v]); }
    body.append(pb); updateProbes();
  }
  body.append(el('h3', null, 'Hogyan működik?'));
  body.append(sayBlock(ex.why[S.age]));
  const kits = kitsHaving(ex.part).map((k) => '<span class="chip k' + k + '">' + KIT_SHORT[k] + '</span>').join(' ');
  if (kits) { const k = el('div', 'where'); k.innerHTML = '<b>Melyik dobozban van?</b> ' + kits; body.append(k); }
  const kind = P[ex.part].kind;
  const rel = EXPS.filter((e) => !e.card && e.layout.some((p) => P[p.p].kind === kind || (kind === 'sw' && P[p.p].kind === 'sw')));
  if (rel.length) {
    body.append(el('h3', null, 'Ezekben a kísérletekben szerepel'));
    const rl = el('div', 'rel');
    for (const e of rel.slice(0, 12)) { const b = el('button', 'mini', e.chapter + ' · ' + e.title); b.onclick = () => { selectExp(EXPS.indexOf(e)); focusWork(); }; rl.append(b); }
    body.append(rl);
  }
  if (ex.check) body.append(checkCard(ex));
  const nav = el('div', 'navrow');
  const back = el('button', 'btn', '← Album'); back.onclick = () => showAlbum(true); nav.append(back);
  const toExps = el('button', 'btn', 'Kísérletek'); toExps.onclick = backToExps; nav.append(toExps);
  const list = CARD_LIST(); const k2 = list.indexOf(ex);
  if (k2 < list.length - 1) { const nx = el('button', 'btn primary', 'Következő: ' + list[k2 + 1].title); nx.onclick = () => { openCard(EXPS.indexOf(list[k2 + 1])); }; nav.append(nx); }
  panel.append(nav);
}
function markDone() { S.done[EXPS[S.exp].id] = true; store.set('done', S.done); }
function selectExp(i) {
  if (S.soundOn) setSound(false);
  if (S.micStream || S.micPending) setMicInput(false); S.micBlow = false; S.micP = 0;
  if (!EXPS[i].card) S.lastExp = i;
  S.exp = i; S.step = 0; S.guess = null; S.check = null; S.variants = {}; S.sim = null; S.maxStage = 0; S.audio = null;
  S.ctl = initCtl(EXPS[i]); S.vc = 0; S.icOpen = false;
  S.light = EXPS[i].light || 0.85;
  store.set('expId', EXPS[i].id);
  renderStrip(); goStage(EXPS[i].card ? 3 : 0);
}
function renderStrip() {
  const nav = $('#exps'); nav.innerHTML = '';
  updateNow();
  // a lecsúszó választóban a fejezetgomb csak a listát váltja; kísérletet a kártyájára koppintva választunk
  const base = EXPS[S.exp].card ? EXPS[S.lastExp != null ? S.lastExp : 0].chapter : EXPS[S.exp].chapter;
  const cur = S.navChap || base;
  const head = el('div', 'drawhead'); head.append(el('h2', null, 'Válassz kísérletet'));
  const x = el('button', 'x', '×'); x.setAttribute('aria-label', 'Bezárás'); x.onclick = () => setDrawer(false); head.append(x);
  nav.append(head);
  const chaps = el('div', 'chaps'); chaps.setAttribute('role', 'tablist'); chaps.setAttribute('aria-label', 'Fejezetek');
  for (const c of CHAPTERS) {
    const list = EXPS.filter((e) => e.chapter === c.id);
    const done = list.filter((e) => S.done[e.id]).length;
    const b = el('button', 'chap'); b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', String(c.id === cur));
    b.innerHTML = '<i></i><span></span><small></small>';
    b.querySelector('i').textContent = c.id; b.querySelector('span').textContent = c.short; b.querySelector('small').textContent = done + '/' + list.length;
    b.title = c.title;
    b.onclick = () => { S.navChap = c.id; renderStrip(); const f = $('#exps .chap[aria-selected="true"]'); if (f) f.focus({ preventScroll: true }); };
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
    b.onclick = () => pickExp(i);
    row.append(b);
  });
  nav.append(chaps, row);
}
// a fejléc közepén lévő gomb: mi van most nyitva (koppintásra lecsúszik a választó)
function updateNow() {
  const ex = EXPS[S.exp]; let k, sub, t;
  if (S.album) { k = '★'; sub = 'Alkatrész-album · kísérletek'; t = 'Matricák'; }
  else if (ex.card) { k = '★'; sub = 'Alkatrész · kísérletek'; t = ex.title; }
  else { k = ex.chapter + (EXPS.filter((e) => e.chapter === ex.chapter).indexOf(ex) + 1); sub = 'Kísérletek – koppints a váltáshoz'; t = ex.title; }
  $('#nowk').textContent = k; $('#nows').textContent = sub; $('#nowt').textContent = t;
  $('#nowbtn').setAttribute('aria-label', 'Kísérletek: most ' + t + '. Koppints a választáshoz.');
}
function setDrawer(on) {
  const d = $('#exps'); if (!d || on === !!S.drawer) return;
  S.drawer = on;
  if (on) {
    S.navChap = null; renderStrip();
    const hb = $('.top').getBoundingClientRect().bottom;
    document.documentElement.style.setProperty('--drawtop', Math.max(8, Math.round(hb) + 4) + 'px');
  }
  d.classList.toggle('open', on); $('#drawback').hidden = !on; $('#nowbtn').setAttribute('aria-expanded', String(on));
  if (on) requestAnimationFrame(() => { const f = d.querySelector('[aria-current]') || d.querySelector('.chap[aria-selected="true"]'); if (f) f.focus({ preventScroll: true }); if (f) f.scrollIntoView({ block: 'nearest' }); });
  else if (d.contains(document.activeElement)) $('#nowbtn').focus({ preventScroll: true });
}
function pickExp(i) {
  setDrawer(false);
  if (S.album) showAlbum(false);
  if (i !== S.exp) selectExp(i);
  focusWork();
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
// hosszú érintésre ne jöjjön elő a helyi menü (kijelölés, másolás) a gombokon és a rácson
document.addEventListener('contextmenu', (e) => { if (e.target.closest && e.target.closest('button, .ctrl, #board')) e.preventDefault(); });
// Puki gomb: minden nyomásra egy véletlen, valódi pukifelvétel (hangok/puki, forrás: FORRASOK.md).
// Csak a kiválasztott fájl töltődik le; a service worker megjegyzi, így utána offline is megy.
// A gomb kiírja a sorszámot, hogy meg lehessen mondani, melyik nem jó.
const PUKI_N = 48;
const pukiBuf = new Map(); let pukiLast = 0;
function decodeAudio(ac, data) { return new Promise((ok, bad) => { const p = ac.decodeAudioData(data, ok, bad); if (p && p.catch) p.catch(bad); }); }
$('#puki').onclick = async () => {
  const ac = ensureAC(); if (!ac) return;
  let n; do { n = 1 + Math.floor(Math.random() * PUKI_N); } while (n === pukiLast && PUKI_N > 1);
  pukiLast = n; $('#pukin').textContent = '#' + n;
  try {
    let buf = pukiBuf.get(n);
    if (!buf) { const r = await fetch('hangok/puki/' + String(n).padStart(2, '0') + '.mp3'); if (!r.ok) return; buf = await decodeAudio(ac, await r.arrayBuffer()); pukiBuf.set(n, buf); }
    const src = ac.createBufferSource(); src.buffer = buf; src.playbackRate.value = 0.88 + Math.random() * 0.27;
    const g = ac.createGain(); g.gain.value = 0.9; src.connect(g).connect(ac.destination); src.start();
  } catch (e) { /* offline és még nincs letöltve, vagy nem sikerült dekódolni */ }
};
$('#albumbtn').onclick = () => showAlbum(!S.album);
$('#nowbtn').onclick = () => setDrawer(!S.drawer);
$('#drawback').onclick = () => setDrawer(false);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.drawer) setDrawer(false); });
// a ragadós fejléc magassága: ennyivel kisebb a munkaterület
{ const hd = $('.top'); const upd = () => document.documentElement.style.setProperty('--toph', hd.offsetHeight + 'px'); upd(); if (window.ResizeObserver) new ResizeObserver(upd).observe(hd); }
// ha az app háttérbe kerül (másik app, lezárt képernyő): a hang és a mikrofon leáll
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) return;
  if (S.soundOn) setSound(false);
  if (S.micStream || S.micPending) setMicInput(false);
  try { if (S.ac && S.ac.state === 'running') S.ac.suspend(); } catch (e) { /* nincs */ }
});
$('#albumback').onclick = backToExps;
$('#autoread').onclick = () => { S.autoread = !S.autoread; store.set('autoreadSet', true); syncAutoread(); if (!S.autoread) { try { speechSynthesis.cancel(); } catch (e) { /* nincs */ } } };

// ---------- indulás ----------
S.exp = Math.max(0, EXPS.findIndex((e) => e.id === store.get('expId', null)));   // a kísérletet azonosítóval tároljuk (a sorrend változhat)
if (store.get('expId', null) == null) S.stage = 0;   // régi (sorszámos) tárolás után az első lépéstől
S.light = EXPS[S.exp].light || 0.85;
S.ctl = initCtl(EXPS[S.exp]);
S.maxStage = S.stage;
document.body.classList.add('age-' + S.age);
document.querySelectorAll('[data-age]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.age === S.age)));
syncAutoread();
renderStrip();
goStage(Math.min(4, S.stage));
S.booted = true;
requestAnimationFrame(frame);
window.__app = { S, EXPS, startSim, selectExp, goStage };
})();
