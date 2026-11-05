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

// ---------- kísérletek ----------
const swapPart = (from, to, onlyId) => (lay) => lay.map((p) => ((onlyId ? p.id === onlyId : p.p === from) ? { ...p, p: to } : p));
const flipPart = (id) => (lay) => lay.map((p) => {
  if ((p.id || p.p) !== id) return p;
  const [r, c] = E.parsePost(p.at); const [dr, dc] = E.DIRS[p.dir];
  const opp = { r: 'l', l: 'r', u: 'd', d: 'u' }[p.dir];
  return { ...p, at: E.ROWS[r + 2 * dr] + (c + 2 * dc), dir: opp };
});

const SOUND_LAYOUT = LAY.flash.map((p) => (p.p === 'C4' ? { ...p, p: 'C2' } : p.p === 'D2' ? { ...p, p: 'SP', id: 'SP' } : p));

const EXPS = [
  {
    id: 'first', title: 'Az első áramkör', tag: 'Körbe kell érnie az áramnak',
    layout: LAY.first, sim: { dt: 0.001, scale: 1 }, controls: ['S1'],
    intro: {
      k: 'Az áram olyan, mint a víz, ami körbe-körbe folyik. Ha a kör zárva van, a lámpa világít.',
      m: 'Az elem körbenyomja az áramot. Csak akkor folyik, ha körbe tud érni: az elemből ki, a kapcsolón, az ellenálláson és a LED-en át, majd vissza az elembe.',
      n: 'A legegyszerűbb zárt áramkör: feszültségforrás (B1), kapcsoló (S1), áramkorlátozó ellenállás (R1) és LED (D1) sorba kötve.',
    },
    guess: {
      q: { k: 'Mi lesz, ha megfordítod a lámpát (LED-et)?', m: 'Mi történik, ha a LED-et fordítva teszed vissza?', n: 'Mi történik, ha a LED polaritását megfordítod?' },
      opts: [['Ugyanúgy világít', 'on'], ['Nem világít', 'off'], ['Halványabban világít', 'dim']], right: 1,
      after: { k: 'A LED csak egy irányba engedi az áramot. Fordítva nem világít.', m: 'A LED egyirányú utca: csak a + jel felől engedi át az áramot. Fordítva elzár, és nem világít.', n: 'Záróirányban a dióda nem vezet; az áram gyakorlatilag nulla. Próbáld ki lent: „LED megfordítása”.' },
      variant: 'flip',
    },
    variants: [
      { id: 'flip', label: 'LED megfordítása', real: 'Vedd ki a piros LED-et, fordítsd meg, és tedd vissza ugyanoda.', apply: flipPart('D1') },
      { id: 'r3', label: 'R1 helyett R3 (5,1 kΩ)', real: 'Cseréld ki a 100 Ω-os R1-et az 5,1 kΩ-os R3-ra. Szerinted fényesebb vagy halványabb lesz?', apply: swapPart('R1', 'R3'), needs: ['R3'] },
    ],
    why: {
      k: 'Az elem nyomja az áramot, a kapcsoló kinyitja és bezárja az utat. Az ellenállás vigyáz a LED-re, hogy ne égjen ki.',
      m: 'Az áramnak zárt kör kell. A kapcsoló megszakítja a kört, ilyenkor sehol nem folyik áram. Az ellenállás fékezi az áramot: nagyobb ellenállás, kevesebb áram, halványabb fény.',
      n: 'A LED-en kb. 1,8 V esik, így az R1-re 3 − 1,8 = 1,2 V jut. Ohm törvénye: I = U / R = 1,2 V / 100 Ω ≈ 12 mA. Az 5,1 kΩ-mal csak kb. 0,2 mA folyik, ezért halványabb. A szimuláció ugyanezt mutatja; koppints egy pontra a feszültségéért.',
    },
  },
  {
    id: 'night', title: 'Éjjeli lámpa', tag: 'Sötétben magától kigyullad',
    layout: LAY.night, sim: { dt: 0.002, scale: 1 }, controls: ['S1', 'light'], light: 0.85,
    intro: {
      k: 'Ez a lámpa sötétben magától bekapcsol. A kis fekete szem figyeli, van-e fény.',
      m: 'A fekete kis alkatrész (Q4) fényérzékelő. A piros háromszög (Q2) egy tranzisztor: olyan, mint egy csap, ami az áramot nyitja és zárja.',
      n: 'Fénykapcsoló: a fototranzisztor (Q4) a Q2 bázisát a földre húzza, ha fény éri. Sötétben az R3-on át bázisáram folyik, és a Q2 bekapcsolja a LED-et.',
    },
    guess: {
      q: { k: 'Mi lesz, ha letakarod a kezeddel a kis fekete szemet?', m: 'Mi történik, ha letakarod a fototranzisztort (Q4)?', n: 'Mi történik a LED-del, ha a Q4-et teljesen elsötétíted?' },
      opts: [['Kigyullad a LED', 'on'], ['Nem történik semmi', 'off'], ['A LED villogni kezd', 'blink']], right: 0,
      after: { k: 'Igen! Sötétben kigyullad. Csúsztasd lent a fényt a hold felé.', m: 'Letakarva a Q4 nem vezet, a Q2 bázisa áramot kap, és a LED kigyullad.', n: 'A Q4 kikapcsol, a bázis kb. 0,7 V-ra emelkedik, a Q2 telítésbe megy, a LED áramát az R1 korlátozza.' },
    },
    variants: [],
    why: {
      k: 'A tranzisztor olyan, mint egy kapu: ha egy kicsi áram kopogtat, kinyílik, és a nagy áram átmegy a LED-hez. A fekete szem fényben ellopja ezt a kis áramot.',
      m: 'A tranzisztor középső lába (bázis) a „kapu”. Ha oda egy kicsi áram jut, a tranzisztor kinyit, és a LED-en sokkal nagyobb áram folyhat. Fényben a fototranzisztor elvezeti a kis áramot a kapu elől, ezért a LED nem ég. Sötétben a kapu megkapja, és a lámpa kigyullad.',
      n: 'Sötétben a bázisáram ≈ (3 V − 0,7 V) / 5,1 kΩ ≈ 0,45 mA. A Q2 ennek a százszorosát is átengedné, de a LED körét az R1 kb. 11 mA-re korlátozza, így a tranzisztor kapcsolóként, telítésben dolgozik. Fényben a Q4 több áramot vezet el, mint amennyit az R3 ad, ezért a bázis 0,1 V közelébe esik, és a Q2 lezár.',
    },
  },
  {
    id: 'delay', title: 'Késleltetett lámpa', tag: 'Elengeded, de még ég egy kicsit',
    layout: LAY.delay, sim: { dt: 0.002, scale: 1 }, controls: ['S1', 'S2'],
    intro: {
      k: 'Nyomd meg a gombot, aztán engedd el. A lámpa még egy kicsit világít, és lassan elalszik.',
      m: 'Olyan, mint a lépcsőházi lámpa: egy gombnyomás, és egy ideig ég. A nagy kondenzátor (C5) egy kis töltéstartály.',
      n: 'Időzítő: a nyomógomb a C5-öt feltölti, elengedés után a kondenzátor az R3-on át a Q2 bázisába sül ki, és amíg elég a bázisáram, a LED ég.',
    },
    guess: {
      q: { k: 'Megnyomod és elengeded a gombot. Mit csinál a lámpa?', m: 'Megnyomod, majd elengeded a nyomógombot (S2). Mi lesz a LED-del?', n: 'Mi történik a LED-del az S2 elengedése után?' },
      opts: [['Azonnal elalszik', 'off'], ['Még ég egy darabig, aztán elalszik', 'fade'], ['Örökké ég', 'on']], right: 1,
      after: { k: 'Így van! A kondenzátorban maradt egy kis áram, abból ég még.', m: 'A kondenzátor feltöltődött, és elengedés után lassan kiürül a tranzisztor felé. Amíg van benne töltés, ég a LED.', n: 'A kisülés közel exponenciális, az időállandó τ = R·C. Lent kicserélheted a kondenzátort vagy az ellenállást.' },
    },
    variants: [
      { id: 'c4', label: 'C5 helyett C4 (100 µF)', real: 'Cseréld a 470 µF-os kondenzátort (C5) a 100 µF-osra (C4). A + jel ugyanoda kerüljön.', apply: swapPart('C5', 'C4'), needs: ['C4'] },
      { id: 'r5', label: 'R3 helyett R5 (100 kΩ)', real: 'Cseréld az 5,1 kΩ-os R3-at a 100 kΩ-os R5-re. Hosszabb lesz vagy rövidebb? És milyen fényes?', apply: swapPart('R3', 'R5'), needs: ['R5'] },
    ],
    why: {
      k: 'A kondenzátor olyan, mint egy kis vödör. A gomb megtölti, aztán lassan kifolyik belőle az áram a tranzisztorhoz. Amíg folyik, ég a lámpa.',
      m: 'A gomb megnyomásakor a kondenzátor feltöltődik. Elengedés után az ellenálláson keresztül lassan kiürül, és közben nyitva tartja a tranzisztort. Kisebb kondenzátor hamarabb kiürül. Nagyobb ellenálláson lassabban folyik ki, de kevesebb áram jut a tranzisztorra, ezért halványabb.',
      n: 'τ = R·C = 5,1 kΩ · 470 µF ≈ 2,4 s. A LED addig ég teljes fénnyel, amíg a bázisáram elég a telítéshez, utána fokozatosan halványul; a szimulációban kb. 5 s teljes fény, utána lassú halványulás. 100 µF-tal τ ≈ 0,5 s. 100 kΩ-mal τ ≈ 47 s, de a bázisáram csak kb. 23 µA, így a LED-áram a tranzisztor erősítésén múlik. A valódi tranzisztoroknál ez darabonként eltér.',
    },
  },
  {
    id: 'flash', title: 'Villogó', tag: 'Két tranzisztor kapcsolgatja egymást',
    layout: LAY.flash, sim: { dt: 0.0005, scale: 1 }, controls: ['S1'],
    intro: {
      k: 'Két lámpa felváltva villog, magától. Senki nem nyomja a gombot!',
      m: 'Két tranzisztor és két kondenzátor felváltva kapcsolgatja egymást. Ezt rezgőkörnek hívják.',
      n: 'Astabil multivibrátor két NPN tranzisztorból. A két 100 µF-os kondenzátor keresztbe köti a kollektorokat a másik tranzisztor bázisával. Két átkötő kábel kell hozzá.',
    },
    guess: {
      q: { k: 'Bekapcsolod. Mit csinál a két lámpa?', m: 'Mit csinál a két LED, ha bekapcsolod az S1-et?', n: 'Mi lesz a két LED-del bekapcsolás után?' },
      opts: [['Felváltva villognak', 'blink'], ['Mindkettő folyamatosan ég', 'on'], ['Egyik sem ég', 'off']], right: 0,
      after: { k: 'Igen! Egyszer az egyik, egyszer a másik.', m: 'Felváltva: amikor az egyik tranzisztor bekapcsol, a kondenzátoron át kikapcsolja a másikat.', n: 'Félperiódusonként billen át; a félperiódust a bázisellenállás és a kondenzátor szorzata szabja meg.' },
    },
    variants: [
      { id: 'c5', label: 'Az egyik C4 helyett C5 (470 µF)', real: 'Cseréld a középső 100 µF-os kondenzátort (a D5–D7 közöttit) a 470 µF-os C5-re. A + jel a D5 felé nézzen.', apply: swapPart('C4', 'C5', 'C4a'), needs: ['C5'] },
    ],
    why: {
      k: 'A két tranzisztor játszik: amikor az egyik bekapcsol, meglöki a másikat, hogy kapcsoljon ki. Aztán fordítva. Így villog.',
      m: 'Amikor az egyik tranzisztor bekapcsol, a kondenzátoron keresztül egy pillanatra „lelöki” a másikat. A kondenzátor az ellenálláson át lassan újratöltődik, a másik tranzisztor visszakapcsol, és most ő löki le az elsőt. Nagyobb kondenzátornak több idő kell, ezért az a fele lassabb lesz.',
      n: 'Egy félperiódus ideje ≈ 0,69 · R · C = 0,69 · 5,1 kΩ · 100 µF ≈ 0,35 s. 3 V-on a LED-ek miatt kisebb a kollektor feszültséglépése, ezért a szimuláció kb. 0,2 s-os félperiódusokat ad (2,6 Hz). Egyik oldalt 470 µF-tal az a félperiódus kb. 4,7-szer hosszabb.',
    },
  },
  {
    id: 'sound', title: 'Hang a villogóból', tag: 'Nyissuk ki a fekete dobozt',
    layout: SOUND_LAYOUT, sim: { dt: 0.000005, scale: 1 / 1000 }, controls: ['S1', 'sound'], slow: 1000,
    intro: {
      k: 'Ugyanez a villogó, csak nagyon-nagyon gyorsan. Olyan gyorsan, hogy a villogásból hang lesz!',
      m: 'A villogó két 100 µF-os kondenzátorát ezerszer kisebbre, 0,1 µF-osra cseréljük, a jobb oldali LED helyére pedig hangszóró kerül.',
      n: 'Ugyanaz az astabil multivibrátor 0,1 µF-os csatolókondenzátorokkal (C2) és hangszóróval. A képernyőn ezerszeres lassítással látod.',
    },
    guess: {
      q: { k: 'Ha a kondenzátorok ezerszer kisebbek, mi lesz a villogással?', m: 'Ezerszer kisebb kondenzátorokkal mi történik a villogással?', n: 'Mit vársz, ha C ezredrészére csökken?' },
      opts: [['Ezerszer gyorsabb: hang lesz belőle', 'sound'], ['Ezerszer lassabb lesz', 'slow'], ['Nem változik semmi', 'same']], right: 0,
      after: { k: 'Igen! Olyan gyors, hogy már hangot hallasz.', m: 'A villogás másodpercenként kb. 1600-szor ismétlődik, ezt a hangszóró hangként adja ki.', n: 'f ≈ 1 / (1,38 · R · C) ≈ 1,4 kHz; a szimuláció kb. 1,6 kHz-et ad.' },
    },
    variants: [
      { id: 'c1', label: 'Az egyik C2 helyett C1 (0,02 µF)', real: 'Cseréld a bal oldali 0,1 µF-os kondenzátort (D1–D3) a 0,02 µF-os C1-re. Magasabb vagy mélyebb lesz a hang?', apply: swapPart('C2', 'C1', 'C4b'), needs: ['C1'] },
    ],
    why: {
      k: 'Ez ugyanaz a villogó, csak ezerszer gyorsabb. A hangszóró ilyen gyors kapcsolgatástól zümmögni kezd. A dobozban lévő hangot adó IC-k belsejében is ilyen apró villogó dolgozik.',
      m: 'Kisebb kondenzátor gyorsabban töltődik, ezért ezerszer gyorsabban kapcsolgat. Az IC-k, például a riasztó IC, belül ugyanilyen alkatrészekből állnak: tranzisztorokból, ellenállásokból és kondenzátorokból, csak parányiak, és egyetlen kis lapkán vannak. Most te építettél egyet nagyban!',
      n: 'A frekvencia fordítva arányos C-vel: 100 µF-ról 0,1 µF-ra csökkentve ezerszeres. Ha az egyik oldalt 0,02 µF-ra cseréled, az a félperiódus ötödére rövidül, a hang magasabb lesz (a szimulációban kb. 3,4 kHz). A hangot adó IC-kben ugyanilyen oszcillátor van, csak integrált formában.',
    },
  },
];

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

// ---------- felolvasás ----------
let huVoice = null;
function pickVoice() { try { const vs = speechSynthesis.getVoices(); huVoice = vs.find((v) => /^hu/i.test(v.lang)) || null; } catch (e) { /* nincs beszédszintézis */ } }
try { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; } catch (e) { /* nincs */ }
function speak(text) {
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/µF/g, ' mikrofarád').replace(/kΩ/g, ' kiloohm').replace(/Ω/g, ' ohm').replace(/mA/g, ' milliamper').replace(/ V\b/g, ' volt'));
    u.lang = 'hu-HU'; if (huVoice) u.voice = huVoice; u.rate = S.age === 'k' ? 0.92 : 1;
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
    svgEl('path', { d, fill: 'none', stroke: def.color === 'red' ? '#D13B33' : '#22262B', 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
    svgEl('path', { d, fill: 'none', stroke: 'rgba(255,255,255,.25)', 'stroke-width': 2, 'stroke-linecap': 'round' }, g);
    for (const [x, y] of [[x1, y1], [x2, y2]]) svgEl('circle', { cx: x, cy: y, r: 8, fill: def.color === 'red' ? '#D13B33' : '#22262B', stroke: '#fff', 'stroke-width': 2 }, g);
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
  for (const v of ex.variants) if (S.variants[v.id]) lay = v.apply(lay);
  return lay;
}
function startSim() {
  const ex = EXPS[S.exp]; const lay = currentLayout();
  const prevSw = S.sim ? { ...S.sim.switches } : null;
  S.sim = new E.Sim(lay, { light: S.light });
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
    if (dt > 0) for (let i = 0; i < n; i++) S.sim.step(dt);
    S.wc = S.sim.wireCurrents();
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
      if (it.capBar) { const vC = live ? S.sim.capV[it.id] || 0 : 0; it.capBar.el.setAttribute('width', (Math.min(1, Math.abs(vC) / 3) * it.capBar.w).toFixed(1)); }
      if (it.isSwitch) {
        const on = live ? !!S.sim.switches[it.id] : false;
        const blade = it.g.querySelector('.swblade');
        if (blade) blade.setAttribute('d', it.def.mode === 'press' ? (on ? 'M-30,6 L-12,6 M12,6 L30,6 M-12,6 L12,6' : 'M-30,6 L-12,6 M12,6 L30,6 M-12,-2 L12,-2') : (on ? 'M-30,6 L-12,6 M12,6 L30,6 M-12,6 L12,6' : 'M-30,6 L-12,6 M12,6 L30,6 M-12,6 L12,-6'));
      }
    }
    if (live && fcount % 6 === 0) updateMeters();
  }
  requestAnimationFrame(frame);
}

// ---------- hang (a hangszórós kísérlethez) ----------
async function buildAudio() {
  const lay = currentLayout();
  if (!lay.some((p) => p.p === 'SP')) return null;
  if (!S.ac) return null;
  const sr = S.ac.sampleRate; const dt = 1 / sr;
  const sim = new E.Sim(lay); sim.switches.S1 = true;
  const total = Math.round(sr * 0.045); const samples = new Float32Array(total);
  for (let i = 0; i < total; i++) {
    sim.step(dt); samples[i] = sim.cur.SP || 0;
    if (i % 600 === 0) await new Promise((r) => setTimeout(r, 0));
  }
  const start = Math.round(sr * 0.02);
  const tail = samples.subarray(start); let m = 0; for (const x of tail) m += x; m /= tail.length;
  const cr = []; for (let i = 1; i < tail.length; i++) if (tail[i - 1] < m && tail[i] >= m) cr.push(i);
  if (cr.length < 3) return null;
  const a = cr[0], b = cr[cr.length - 1];
  const len = b - a; let mx = 0; for (let i = a; i < b; i++) mx = Math.max(mx, Math.abs(tail[i] - m));
  const buf = S.ac.createBuffer(1, len, sr); const ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = ((tail[a + i] - m) / (mx || 1)) * 0.5;
  const freq = sr * (cr.length - 1) / (b - a);
  return { buf, freq };
}
async function setSound(on) {
  S.soundOn = on;
  if (S.audio && S.audio.src) { try { S.audio.src.stop(); } catch (e) { /* már leállt */ } S.audio.src = null; }
  if (!on) { renderControls(); return; }
  // a hangkörnyezetet a kattintáson belül, várakozás nélkül indítjuk (a böngészők csak így engedik)
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) { S.soundOn = false; renderControls(); return; }
  if (!S.ac) { try { S.ac = new AC(); } catch (e) { S.soundOn = false; renderControls(); return; } }
  if (S.ac.state === 'suspended') S.ac.resume().catch(() => {});
  if (!S.audio || S.audio.key !== JSON.stringify(currentLayout())) {
    S.audioBusy = true; renderControls();
    const res = await buildAudio();
    S.audioBusy = false;
    if (!res) { S.soundOn = false; renderControls(); return; }
    S.audio = { key: JSON.stringify(currentLayout()), ...res };
  }
  if (!S.soundOn) return;
  const src = S.ac.createBufferSource(); src.buffer = S.audio.buf; src.loop = true;
  const gain = S.ac.createGain(); gain.gain.value = 0.35; src.connect(gain).connect(S.ac.destination);
  if (!S.sim || !S.sim.switches.S1) gain.gain.value = 0;
  src.start(); S.audio.src = src; S.audio.gain = gain;
  renderControls();
}
function syncSoundGate() { if (S.audio && S.audio.gain) S.audio.gain.gain.value = S.sim && S.sim.switches.S1 ? 0.35 : 0; }

// ---------- vezérlők a rács alatt ----------
function renderControls() {
  const box = $('#ctrls'); box.innerHTML = '';
  const ex = EXPS[S.exp];
  const live = S.stage >= 3;
  const status = $('#status'); status.innerHTML = '';
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
    const t = document.createElement('p'); t.textContent = (i + 1) + '/' + lay.length + '. ' + stepText(lay[i], chk.levels[i]);
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
    } else if (c === 'sound') {
      const b = document.createElement('button'); b.className = 'ctrl'; b.setAttribute('aria-pressed', String(S.soundOn));
      b.innerHTML = '<span class="knob"></span> ' + (S.audioBusy ? 'Hang készül…' : 'Hang' + (S.audio && S.soundOn ? ' · kb. ' + Math.round(S.audio.freq) + ' Hz' : ''));
      b.disabled = !!S.audioBusy;
      b.onclick = () => setSound(!S.soundOn);
      box.append(b);
    }
  }
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
  const cnt = {}; for (const pl of layout) cnt[pl.p] = (cnt[pl.p] || 0) + 1;
  return Object.entries(cnt).sort((a, b) => sortKey(a[0]) - sortKey(b[0])).map(([p, n]) => {
    let left = n; const src = [];
    for (const k of KIT_ORDER) { const have = E.KITS[k].parts[p] || 0; const take = Math.min(have, left); if (take > 0) { src.push([k, take]); left -= take; } }
    return { p, n, src, missing: left };
  });
}
function sortKey(p) { const k = P[p].kind; return ['bat', 'sw', 'res', 'led', 'cap', 'npn', 'pnp', 'photo', 'lamp', 'spk', 'jumper', 'wire'].indexOf(k) * 10 + (P[p].n || 0); }
function miniIcon(p) {
  const def = P[p]; const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 58 34');
  if (def.kind === 'wire') { svgEl('rect', { x: 4, y: 11, width: 50, height: 12, rx: 6, fill: COLORS.wire }, s); const t = svgEl('text', { x: 29, y: 21, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 800, fill: '#fff' }, s); t.textContent = def.n; return s; }
  if (def.kind === 'jumper') { svgEl('path', { d: 'M6,10 C14,34 44,34 52,10', fill: 'none', stroke: def.color === 'red' ? '#D13B33' : '#22262B', 'stroke-width': 4, 'stroke-linecap': 'round' }, s); return s; }
  if (def.kind === 'npn' || def.kind === 'pnp') { svgEl('path', { d: 'M12,9 L46,9 L29,26 Z', fill: partColor(def), stroke: partColor(def), 'stroke-width': 10, 'stroke-linejoin': 'round' }, s); }
  else svgEl('rect', { x: 3, y: 6, width: 52, height: 22, rx: 7, fill: partColor(def) }, s);
  const t = svgEl('text', { x: 29, y: def.kind === 'npn' || def.kind === 'pnp' ? 19 : 21, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 800, fill: def.kind === 'res' ? '#3B2A00' : '#fff', 'font-family': 'var(--font-display)' }, s); t.textContent = def.short;
  return s;
}

// ---------- építési lépések szövege ----------
function stepText(pl, level) {
  const def = P[pl.p]; const geo = E.geometry(pl);
  const pn = (s) => E.ROWS[s.r] + s.c;
  const lv = level === 1 ? 'közvetlenül a rácsra (1. szint)' : 'a már lerakott alkatrészek tetejére (' + level + '. szint)';
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
    box.append(cnt, pr, sayBlock(stepText(lay[i], lvl), { auto: true }));
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
      body.append(sayBlock(playHint(ex), { auto: true }));
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

function playHint(ex) {
  const k = S.age;
  const t = {
    first: { k: 'Kapcsold be az S1-et! Nézd, merre mennek a sárga pöttyök: ez az áram.', m: 'Kapcsold be az S1 kapcsolót, alul vagy magán a rácson. A sárga pöttyök mutatják, merre folyik az áram.', n: 'Kapcsold be az S1-et. A pöttyök sebessége az áram nagyságát mutatja (logaritmikusan).' },
    night: { k: 'Kapcsold be, aztán húzd a fényt a hold felé, vagy nyomd a „Takard le” gombot!', m: 'Kapcsold be az S1-et, és állítsd a fényt. Figyeld, mikor gyullad ki a LED.', n: 'Kapcsold be az S1-et, és a fénycsúszkával keresd meg a billenési pontot.' },
    delay: { k: 'Kapcsold be az S1-et, nyomd meg az S2 gombot, aztán engedd el!', m: 'Kapcsold be az S1-et, nyomd meg és engedd el az S2-t. Figyeld a kondenzátor sárga csíkját: ennyi töltés van benne.', n: 'S1 be, S2 rövid nyomás. Figyeld a C5 feszültségét és a bázisáramot a mérőn.' },
    flash: { k: 'Kapcsold be, és figyeld a két lámpát!', m: 'Kapcsold be az S1-et. Figyeld a két kondenzátor sárga csíkját: felváltva töltődnek.', n: 'S1 be. Figyeld a két bázisáramot: mindig csak az egyik tranzisztor vezet.' },
    sound: { k: 'Kapcsold be, és nyomd meg a Hang gombot! A képernyőn lelassítva látod.', m: 'Kapcsold be az S1-et és a hangot. A képernyő ezerszer lassabban mutatja, ami valójában történik.', n: 'S1 be, Hang be. A kijelzés 1000× lassított; a hang a szimulált hangszóróáramból készül.' },
  };
  return t[ex.id][k];
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
  S.light = EXPS[i].light || 0.85;
  store.set('exp', i);
  renderStrip(); goStage(0);
}
function renderStrip() {
  const nav = $('#exps'); nav.innerHTML = '';
  EXPS.forEach((ex, i) => {
    const b = el('button', 'exp' + (S.done[ex.id] ? ' done' : ''));
    if (i === S.exp) b.setAttribute('aria-current', 'true');
    b.innerHTML = '<span class="num">' + (S.done[ex.id] ? '✓' : i + 1) + '</span><b></b><small></small>';
    b.querySelector('b').textContent = ex.title; b.querySelector('small').textContent = ex.tag;
    b.onclick = () => selectExp(i);
    nav.append(b);
  });
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
S.maxStage = S.stage;
document.body.classList.add('age-' + S.age);
document.querySelectorAll('[data-age]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.age === S.age)));
syncAutoread();
renderStrip();
goStage(Math.min(4, S.stage));
requestAnimationFrame(frame);
window.__app = { S, EXPS, startSim };
})();
