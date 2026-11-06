// SPDX-License-Identifier: GPL-3.0-or-later
// Fekete doboz nélkül – Copyright (C) 2026 Nimmerfroh Károly
// Kísérletek elrendezése a rácson. Sorrend = építési sorrend.
const L = {};

L.first = [
  { p: 'W5', at: 'B4', dir: 'r' },
  { p: 'W3', at: 'B2', dir: 'd' },
  { p: 'W2', at: 'D4', dir: 'r', id: 'W2a' },
  { p: 'W2', at: 'D7', dir: 'r', id: 'W2b' },
  { p: 'S1', at: 'B4', dir: 'l' },
  { p: 'R1', at: 'D2', dir: 'r' },
  { p: 'D1', at: 'D5', dir: 'r' },
  { p: 'B1', at: 'B8', dir: 'd' },
];

L.night = [
  { p: 'W6', at: 'A2', dir: 'r', id: 'Wp' },
  { p: 'W6', at: 'G2', dir: 'r', id: 'Wn' },
  { p: 'W3', at: 'C2', dir: 'd', id: 'Wb' },
  { p: 'W2', at: 'C3', dir: 'r', id: 'Wx' },
  { p: 'W3', at: 'C7', dir: 'd', id: 'Ws' },
  { p: 'Q2', at: 'C6', dir: 'd' },
  { p: 'R3', at: 'A2', dir: 'd' },
  { p: 'Q4', at: 'E2', dir: 'd' },
  { p: 'W4', at: 'D2', dir: 'r', id: 'Wl' },
  { p: 'D1', at: 'A3', dir: 'd' },
  { p: 'R1', at: 'C4', dir: 'r' },
  { p: 'W3', at: 'E6', dir: 'd', id: 'We' },
  { p: 'S1', at: 'A7', dir: 'd' },
  { p: 'B1', at: 'E7', dir: 'd' },
];

L.delay = [
  { p: 'W4', at: 'A2', dir: 'r', id: 'Wp1' },
  { p: 'W4', at: 'A6', dir: 'r', id: 'Wp2' },
  { p: 'W6', at: 'G2', dir: 'r', id: 'Wn1' },
  { p: 'W2', at: 'G8', dir: 'r', id: 'Wn2' },
  { p: 'W3', at: 'C2', dir: 'd', id: 'Wt' },
  { p: 'W2', at: 'C7', dir: 'r', id: 'Wx' },
  { p: 'W3', at: 'C9', dir: 'd', id: 'Ws' },
  { p: 'Q2', at: 'C5', dir: 'd' },
  { p: 'W2', at: 'A5', dir: 'r', id: 'Lp' },
  { p: 'W2', at: 'G7', dir: 'r', id: 'Ln' },
  { p: 'S2', at: 'A2', dir: 'd' },
  { p: 'C5', at: 'E2', dir: 'd' },
  { p: 'R3', at: 'D2', dir: 'r' },
  { p: 'W3', at: 'E5', dir: 'd', id: 'We' },
  { p: 'D1', at: 'A8', dir: 'd' },
  { p: 'R1', at: 'C7', dir: 'l' },
  { p: 'S1', at: 'A9', dir: 'd' },
  { p: 'B1', at: 'E9', dir: 'd' },
];

L.flash = [
  { p: 'W7', at: 'A3', dir: 'r', id: 'Wp' },
  { p: 'W6', at: 'G4', dir: 'r', id: 'Wn' },
  { p: 'W4', at: 'C3', dir: 'd', id: 'Wba' },
  { p: 'W4', at: 'C7', dir: 'd', id: 'Wbb' },
  { p: 'W3', at: 'C9', dir: 'd', id: 'Ws' },
  { p: 'D1', at: 'C4', dir: 'd' },
  { p: 'D2', at: 'C8', dir: 'd' },
  { p: 'W1', at: 'D1', id: 'Wsa' },
  { p: 'W1', at: 'D5', id: 'Wsb' },
  { p: 'R1', at: 'A4', dir: 'd', id: 'R1a' },
  { p: 'R1', at: 'A8', dir: 'd', id: 'R1b' },
  { p: 'R3', at: 'A3', dir: 'd', id: 'R3a' },
  { p: 'R3', at: 'A7', dir: 'd', id: 'R3b' },
  { p: 'Q2', at: 'E4', dir: 'd', id: 'Q2a' },
  { p: 'Q2', at: 'E8', dir: 'd', id: 'Q2b' },
  { p: 'C4', at: 'D5', dir: 'r', id: 'C4a' },
  { p: 'C4', at: 'D1', dir: 'r', id: 'C4b' },
  { p: 'S1', at: 'A9', dir: 'd' },
  { p: 'B1', at: 'E9', dir: 'd' },
  { p: 'J1', at: 'D5', to: 'E4', id: 'J1' },
  { p: 'J2', at: 'D1', to: 'E8', id: 'J2' },
];


// ---- 1. fázis: A–C fejezet ----

// Vezet vagy nem vezet? A vizsgált tárgy (TP) a két átkötő kábel szabad vége között van.
L.conduct = [
  { p: 'W5', at: 'B4', dir: 'r', id: 'Wp' },
  { p: 'M6', at: 'B2', dir: 'd' },
  { p: 'R1', at: 'F2', dir: 'r' },
  { p: 'D1', at: 'F5', dir: 'r' },
  { p: 'W3', at: 'D8', dir: 'd', id: 'Wr' },
  { p: 'TP', at: 'D3', dir: 'r' },
  { p: 'W3', at: 'D2', dir: 'd', id: 'Wl' },
  { p: 'W2', at: 'F4', dir: 'r', id: 'Wa' },
  { p: 'W2', at: 'F7', dir: 'r', id: 'Wb' },
  { p: 'B1', at: 'B8', dir: 'd' },
  { p: 'J2', at: 'B4', to: 'D5' },
  { p: 'J1', at: 'B2', to: 'D3' },
];

// Soros izzók (a párhuzamos változat külön elrendezés).
L.series = [
  { p: 'W5', at: 'B4', dir: 'r' },
  { p: 'W3', at: 'B2', dir: 'd' },
  { p: 'W2', at: 'D4', dir: 'r', id: 'W2a' },
  { p: 'W2', at: 'D7', dir: 'r', id: 'W2b' },
  { p: 'S1', at: 'B4', dir: 'l' },
  { p: 'L1', at: 'D2', dir: 'r' },
  { p: 'L2', at: 'D5', dir: 'r' },
  { p: 'B1', at: 'B8', dir: 'd' },
];
L.parallel = [
  { p: 'W4', at: 'B3', dir: 'r', id: 'Wp' },
  { p: 'W2', at: 'B8', dir: 'r', id: 'Wb' },
  { p: 'W7', at: 'D3', dir: 'r', id: 'Wn' },
  { p: 'L1', at: 'B3', dir: 'd' },
  { p: 'L2', at: 'B5', dir: 'd' },
  { p: 'S1', at: 'B6', dir: 'r' },
  { p: 'B1', at: 'B9', dir: 'd' },
];

// Fényerő-szabályzó: az RV-t változtatható ellenállásként használjuk (a vége és a csúszka között).
L.dimmer = [
  { p: 'W5', at: 'B4', dir: 'r', id: 'Wp' },
  { p: 'RV', at: 'B2', dir: 'd' },
  { p: 'M6', at: 'F8', dir: 'u' },
  { p: 'W2', at: 'E3', dir: 'd', id: 'Wx' },
  { p: 'W3', at: 'F5', dir: 'r', id: 'Wy' },
  { p: 'S1', at: 'B4', dir: 'l' },
  { p: 'B1', at: 'B8', dir: 'd' },
  { p: 'R1', at: 'C3', dir: 'd' },
  { p: 'D1', at: 'F3', dir: 'r' },
  { p: 'W2', at: 'F7', dir: 'r', id: 'Wl' },
];

// A motor mint áramfejlesztő: elem nélkül, kézzel pörgetve.
L.generator = [
  { p: 'M1', at: 'C3', dir: 'r' },
  { p: 'M6', at: 'E3', dir: 'r' },
  { p: 'W3', at: 'C3', dir: 'd', id: 'Wa' },
  { p: 'W3', at: 'C5', dir: 'd', id: 'Wb' },
];

// Kondenzátor mint mini akkumulátor.
L.capbat = [
  { p: 'W5', at: 'B2', dir: 'r', id: 'Wx' },
  { p: 'W5', at: 'D2', dir: 'r', id: 'Wn' },
  { p: 'D1', at: 'B8', dir: 'd' },
  { p: 'B1', at: 'B9', dir: 'd' },
  { p: 'S2', at: 'A5', dir: 'r' },
  { p: 'C5', at: 'B2', dir: 'd', id: 'C5a' },
  { p: 'C5', at: 'B3', dir: 'd', id: 'C5b' },
  { p: 'M6', at: 'B4', dir: 'd' },
  { p: 'R2', at: 'B6', dir: 'r' },
  { p: 'W4', at: 'D6', dir: 'r', id: 'Wl' },
  { p: 'W2', at: 'A5', dir: 'd', id: 'Ws' },
  { p: 'J1', at: 'A7', to: 'B9' },
];

// Motor sebességszabályzó: RV feszültségosztó + két tranzisztor (Darlington) + motor.
L.motorspeed = [
  { p: 'W7', at: 'A3', dir: 'r', id: 'Wp' },
  { p: 'W6', at: 'G4', dir: 'r', id: 'Wn' },
  { p: 'W2', at: 'B4', dir: 'r', id: 'Wb' },
  { p: 'W1', at: 'C3', id: 'Wr' },
  { p: 'W1', at: 'C6', id: 'Ws1' },
  { p: 'W1', at: 'B7', id: 'Ws2' },
  { p: 'M1', at: 'C8', dir: 'd' },
  { p: 'W3', at: 'C9', dir: 'd', id: 'Wc' },
  { p: 'RV', at: 'A3', dir: 'd' },
  { p: 'Q2', at: 'A6', dir: 'd', id: 'Q2a' },
  { p: 'Q2', at: 'A8', dir: 'd', id: 'Q2b' },
  { p: 'W3', at: 'E8', dir: 'd', id: 'Lm' },
  { p: 'S1', at: 'A9', dir: 'd' },
  { p: 'B1', at: 'E9', dir: 'd' },
  { p: 'J1', at: 'C6', to: 'B7' },
  { p: 'J2', at: 'C3', to: 'G4' },
];

// Érintőkapcsoló: az ujj (TP) köti össze a C3 és az E3 pontot; két tranzisztor egymás után.
L.touch = [
  { p: 'W7', at: 'A3', dir: 'r', id: 'Wp' },
  { p: 'W2', at: 'G8', dir: 'r', id: 'Wn' },
  { p: 'W2', at: 'B3', dir: 'd', id: 'Wt' },
  { p: 'W3', at: 'B6', dir: 'd', id: 'Wc' },
  { p: 'W2', at: 'F6', dir: 'r', id: 'We' },
  { p: 'W3', at: 'C9', dir: 'd', id: 'Wbat' },
  { p: 'R5', at: 'E3', dir: 'r' },   // 100 kΩ: ha a két pontot fém köti össze, ez korlátozza a tranzisztorok áramát
  { p: 'D1', at: 'C8', dir: 'd' },
  { p: 'W2', at: 'A3', dir: 'd', id: 'Lt' },
  { p: 'W2', at: 'A6', dir: 'd', id: 'Lc' },
  { p: 'Q2', at: 'D6', dir: 'd', id: 'Q2a' },
  { p: 'Q2', at: 'E8', dir: 'd', id: 'Q2b' },
  { p: 'R1', at: 'A8', dir: 'd' },
  { p: 'S1', at: 'A9', dir: 'd' },
  { p: 'B1', at: 'E9', dir: 'd' },
  { p: 'TP', at: 'C3', dir: 'd' },
];

// Vízjelző: ugyanaz, mint az érintőkapcsoló, csak a két érintési pontról átkötő kábel megy a pohár vízbe.
L.water = L.touch.filter((p) => p.p !== 'TP').concat([
  { p: 'TP', at: 'E1', dir: 'd' },
  { p: 'J2', at: 'C3', to: 'E1' },
  { p: 'J1', at: 'E3', to: 'G1' },
]);

// ---- 2. fázis: D fejezet ----

// Emlékező lámpa (flip-flop): a villogó elrendezése, a két kondenzátor helyén ellenállással;
// az S2a / S2b a bázisokat földeli.
L.flipflop = L.flash
  .filter((p) => p.id !== 'R3a' && p.id !== 'R3b')
  .map((p) => (p.id === 'C4a' ? { ...p, p: 'R3', id: 'Rx1' } : p.id === 'C4b' ? { ...p, p: 'R3', id: 'Rx2' } : p))
  .concat([
    { p: 'W1', at: 'C1', id: 'Wg1' },
    { p: 'W1', at: 'C5', id: 'Wg2' },
    { p: 'S2', at: 'C3', dir: 'l', id: 'S2a' },
    { p: 'S2', at: 'C7', dir: 'l', id: 'S2b' },
    { p: 'J4', at: 'C1', to: 'G4', id: 'J4a' },
    { p: 'J4', at: 'C5', to: 'G5', id: 'J4b' },
  ]);

// Kódzár (ÉS-kapu): két tranzisztor egymás alatt; mindkét gombot nyomni kell.
L.and = [
  { p: 'W7', at: 'A3', dir: 'r', id: 'Wp' },
  { p: 'W2', at: 'G8', dir: 'r', id: 'Wn' },
  { p: 'W3', at: 'C9', dir: 'd', id: 'Ws' },
  { p: 'Q2', at: 'E7', dir: 'd', id: 'Q2b' },
  { p: 'D1', at: 'C5', dir: 'r' },
  { p: 'S2', at: 'D4', dir: 'r', id: 'S2a' },
  { p: 'R3', at: 'F2', dir: 'r', id: 'R3b' },
  { p: 'W1', at: 'D2', id: 'Wsp' },
  { p: 'R1', at: 'A5', dir: 'd' },
  { p: 'Q2', at: 'C7', dir: 'd', id: 'Q2a' },
  { p: 'R3', at: 'D4', dir: 'l', id: 'R3a' },
  { p: 'S2', at: 'F6', dir: 'l', id: 'S2b' },
  { p: 'W2', at: 'G7', dir: 'r', id: 'Ln' },
  { p: 'S1', at: 'A9', dir: 'd' },
  { p: 'B1', at: 'E9', dir: 'd' },
  { p: 'J1', at: 'D2', to: 'A3' },
  { p: 'J2', at: 'F2', to: 'A4' },
];

// Bármelyik gomb (VAGY-kapu): két nyomógomb egymás mellett.
L.or = [
  { p: 'W5', at: 'B4', dir: 'r' },
  { p: 'W3', at: 'B2', dir: 'd' },
  { p: 'W2', at: 'D4', dir: 'r', id: 'W2a' },
  { p: 'W2', at: 'D7', dir: 'r', id: 'W2b' },
  { p: 'S2', at: 'C3', dir: 'r', id: 'S2b' },
  { p: 'S2', at: 'B4', dir: 'l', id: 'S2a' },
  { p: 'R1', at: 'D2', dir: 'r' },
  { p: 'D1', at: 'D5', dir: 'r' },
  { p: 'B1', at: 'B8', dir: 'd' },
  { p: 'W2', at: 'C2', dir: 'r', id: 'La' },
  { p: 'W2', at: 'B5', dir: 'd', id: 'Lb' },
];

// Fordító (NEM-kapu): a tranzisztor a LED-del párhuzamosan; gombnyomásra elvezeti az áramot.
L.not = [
  { p: 'W5', at: 'B4', dir: 'r' },
  { p: 'W3', at: 'B2', dir: 'd' },
  { p: 'W2', at: 'D4', dir: 'r', id: 'W2a' },
  { p: 'W2', at: 'D7', dir: 'r', id: 'W2b' },
  { p: 'Q2', at: 'E6', dir: 'd' },
  { p: 'S2', at: 'F1', dir: 'r' },
  { p: 'S1', at: 'B4', dir: 'l' },
  { p: 'R1', at: 'D2', dir: 'r' },
  { p: 'D1', at: 'D5', dir: 'r' },
  { p: 'B1', at: 'B8', dir: 'd' },
  { p: 'R3', at: 'F5', dir: 'l' },
  { p: 'J1', at: 'F1', to: 'B5' },
  { p: 'J2', at: 'E6', to: 'D4' },
  { p: 'J4', at: 'G6', to: 'D8' },
];

// ---- 2. fázis: E fejezet ----

// Hang a villogóból: a villogó 0,1 µF-os kondenzátorokkal, a jobb LED helyén hangszóró.
L.sound = L.flash.map((p) => (p.p === 'C4' ? { ...p, p: 'C2' } : p.p === 'D2' ? { ...p, p: 'SP', id: 'SP' } : p));

// Metronóm: a villogó, a jobb LED helyén hangszóróval (minden átbillenéskor kattan).
L.metronome = L.flash.map((p) => (p.p === 'D2' ? { ...p, p: 'SP', id: 'SP' } : p));

// Hangszer: a hangos villogó bal oldali bázisellenállása helyén nyomógomb + állítható ellenállás + R2.
L.organ = L.sound
  .filter((p) => p.id !== 'R3a')
  .map((p) => (p.id === 'C4b' || p.id === 'Wsa' ? { ...p, at: 'E1' } : p.p === 'J2' ? { ...p, at: 'E1' } : p))
  .concat([
    { p: 'RV', at: 'A1', dir: 'd' },
    { p: 'W1', at: 'D2', id: 'Wsr' },
    { p: 'S2', at: 'A1', dir: 'r' },
    { p: 'R2', at: 'B2', dir: 'd' },
    { p: 'J4', at: 'D2', to: 'C3' },
  ]);

// Sziréna: a bal oldali bázisellenállás egy kondenzátor (C5) feszültségéről kap tápot;
// a gomb az R4-en át tölti, elengedve lassan kisül, közben a hang magassága változik.
L.siren = L.sound
  .filter((p) => p.id !== 'Wp')
  .concat([
    { p: 'W6', at: 'A4', dir: 'r', id: 'Wp' },
    { p: 'W3', at: 'A1', dir: 'r', id: 'Wv' },
    { p: 'W1', at: 'C1', id: 'Wsc' },
    { p: 'R4', at: 'C2', dir: 'd' },
  ])
  // a 2. szintű alkatrészek a vezetékek után jönnek
  .sort((a, b) => lvl1First(a) - lvl1First(b))
  .concat([
    { p: 'C5', at: 'A1', dir: 'd' },
    { p: 'S2', at: 'A2', dir: 'd' },
    { p: 'J4', at: 'C1', to: 'G4', id: 'J4a' },
    { p: 'J4', at: 'E2', to: 'A5', id: 'J4b' },
  ]);
function lvl1First(p) { return ['W7', 'W6', 'W4', 'W3', 'W1', 'R4', 'D1', 'SP'].includes(p.p) && !['R3a', 'R3b', 'R1a', 'R1b'].includes(p.id) ? 0 : 1; }

// ---- 2. fázis: árnyékriasztó és hangra villogó LED ----

// Árnyékriasztó: a sziréna, a C5 helyén fototranzisztorral, a gomb helyén vezetékkel.
// Fényben a Q4 lehúzza a vezérlőfeszültséget (csend), árnyékban megszólal.
L.shadow = L.siren.map((p) => (p.p === 'C5' ? { ...p, p: 'Q4' } : p.p === 'S2' ? { p: 'W3', at: 'A2', dir: 'd', id: 'Wk' } : p));

// Hangra villogó LED: az éjjeli lámpa, a fototranzisztor helyén mikrofonnal.
L.clap = L.night.map((p) => (p.p === 'Q4' ? { ...p, p: 'X1' } : p.p === 'R3' ? { ...p, p: 'R4' } : p));

// ---- 2. fázis: fénytávíró (két rács, üvegszálas kábel) ----

// Gyors villogó (adó): a villogó 0,1 µF-os kondenzátorokkal, két LED-del.
L.fast = L.flash.map((p) => (p.p === 'C4' ? { ...p, p: 'C2' } : p));

// Fénytávíró: az 1. rácson a gyors villogó (adó), a 2. rácson a vevő; az üvegszál a D1 LED-ről a Q4-re viszi a fényt.
L.lightlink = L.fast.concat([
  { p: 'W6', at: '2:A2', dir: 'r', id: 'Wp2' },
  { p: 'W6', at: '2:G2', dir: 'r', id: 'Wn2' },
  { p: 'W3', at: '2:C2', dir: 'd', id: 'Wb2' },
  { p: 'W3', at: '2:C7', dir: 'd', id: 'Ws2' },
  { p: 'Q2', at: '2:C5', dir: 'd', id: 'Q2c' },
  { p: 'Q4', at: '2:A2', dir: 'd' },
  { p: 'R4', at: '2:E2', dir: 'd' },
  { p: 'W3', at: '2:D2', dir: 'r', id: 'Lb2' },
  { p: 'SP', at: '2:A5', dir: 'd' },
  { p: 'W3', at: '2:E5', dir: 'd', id: 'Le2' },
  { p: 'S1', at: '2:A7', dir: 'd', id: 'S1b' },
  { p: 'B1', at: '2:E7', dir: 'd', id: 'B1b' },
  { p: 'FC', at: 'D4', to: '2:B2' },
]);

// ---- 3. fázis: G fejezet, IC-modulok ----
// Közös keret: felső sín (+) az A sorban, alsó sín (−) az F sorban, elem és kapcsoló a 8. oszlopban.
const icFrame = [
  { p: 'W6', at: 'A3', dir: 'r', id: 'Wp' },
  { p: 'W6', at: 'F3', dir: 'r', id: 'Wn' },
  { p: 'W2', at: 'C8', dir: 'd', id: 'Ws' },
];
const icFrameTop = [
  { p: 'W3', at: 'A4', dir: 'd', id: 'Lp' },   // az IC középső felső lába a (+)-ra
  { p: 'W3', at: 'D3', dir: 'd', id: 'Ln' },   // az IC (−) lába az alsó sínre
  { p: 'S1', at: 'A8', dir: 'd' },
  { p: 'B1', at: 'D8', dir: 'd' },
];

// U23 stroboszkóp: CTL-en ellenállás (sebesség), OUT-on LED + R1 a (+) felől.
L.ic_u23 = icFrame.concat([
  { p: 'U23', at: 'C3' },
  { p: 'R1', at: 'B7', dir: 'd' },
], icFrameTop, [
  { p: 'R5', at: 'A3', dir: 'd' },
  { p: 'D1', at: 'D7', dir: 'l' },
  { p: 'W2', at: 'A7', dir: 'd', id: 'Lr' },
]);

// U2 riasztó: az IN2 a (+)-ra, hangszóró az OUT és a (+) között.
L.ic_u2 = icFrame.concat([
  { p: 'U2', at: 'C3' },
  { p: 'SP', at: 'B7', dir: 'd' },
], icFrameTop, [
  { p: 'W3', at: 'D5', dir: 'r', id: 'Lo' },
  { p: 'W2', at: 'A7', dir: 'd', id: 'Lsp' },
]);

// U1 zene: ugyanaz a keret; a (+) láb középen van, ugyanúgy a felső sínre kötve.
L.ic_u1 = L.ic_u2.map((p) => (p.p === 'U2' ? { ...p, p: 'U1' } : p)).concat([{ p: 'S2', at: 'A3', dir: 'd' }]);  // S2: újraindítás (TRG)

// ---- 4. fázis: mikrofon-erősítő és a többi IC ----

// Mikrofon-erősítő (hangosbemondó): a mikrofon jele a C3-on át egy Darlington-párra (Q2a + Q2b) jut;
// a munkapontot az R5 állítja be a kimenetről visszacsatolva, így a tranzisztorok erősítésétől alig függ.
L.amp = [
  { p: 'S1', at: 'A9', dir: 'd' },
  { p: 'B1', at: 'E9', dir: 'd' },
  { p: 'R2', at: 'A4', dir: 'l' },
  { p: 'X1', at: 'G2', dir: 'r' },
  { p: 'C3', at: 'C2', dir: 'r' },
  { p: 'R5', at: 'B6', dir: 'l' },
  { p: 'Q2', at: 'C5', dir: 'd', id: 'Q2a' },
  { p: 'Q2', at: 'E6', dir: 'd', id: 'Q2b' },
  { p: 'SP', at: 'A8', dir: 'd' },
  { p: 'R1', at: 'D8', dir: 'l' },
  { p: 'W6', at: 'A4', dir: 'r', id: 'Wp' },
  { p: 'W3', at: 'C9', dir: 'd', id: 'Ws' },
  { p: 'W6', at: 'G4', dir: 'r', id: 'Wn' },
  { p: 'W7', at: 'A2', dir: 'd', id: 'Wm' },
  { p: 'W3', at: 'B4', dir: 'd', id: 'Wb' },
  { p: 'W4', at: 'B6', dir: 'd', id: 'Wo' },
  { p: 'W2', at: 'E5', dir: 'd', id: 'We' },
  { p: 'W2', at: 'C8', dir: 'd', id: 'Wx' },
  { p: 'J1', at: 'B6', to: 'C5' },
];

// IC-keret: (+) sín az A sorban, (−) sín az F sorban, kapcsoló és elem a 8. oszlopban
const icFrame2 = [
  { p: 'W6', at: 'A3', dir: 'r', id: 'Wp' },
  { p: 'W6', at: 'F3', dir: 'r', id: 'Wn' },
  { p: 'W2', at: 'C8', dir: 'd', id: 'Ws' },
];
const icBat = [{ p: 'S1', at: 'A8', dir: 'd' }, { p: 'B1', at: 'D8', dir: 'd' }];

// U4 erősítő IC (elforgatva): a mikrofont az R2 a szűrt tápról (FIL) táplálja, a hangszóró az OUT és a (−) között.
// Itt a (−) sín van alul hosszabban, a 2. oszlopig.
L.ic_u4 = [
  { p: 'W6', at: 'A3', dir: 'r', id: 'Wp' },
  { p: 'W7', at: 'F2', dir: 'r', id: 'Wn' },
  { p: 'W2', at: 'C8', dir: 'd', id: 'Ws' },
  { p: 'W3', at: 'B2', dir: 'd', id: 'Wi' },
  { p: 'U4', at: 'B4', dir: 'u' },
  { p: 'W2', at: 'A5', dir: 'd', id: 'Lp' },
  { p: 'W3', at: 'D4', dir: 'd', id: 'Ln' },
  { p: 'SP', at: 'D5', dir: 'd' },
  { p: 'R2', at: 'B4', dir: 'l' },
  { p: 'W3', at: 'C2', dir: 'r', id: 'Lin' },
  { p: 'X1', at: 'D2', dir: 'd' },
].concat(icBat);

// U3 űrháború IC: hangszóró az OUT és a (+) között, az S2 az IN1-et a (−)-ra köti (következő hang).
L.ic_u3 = icFrame2.concat([
  { p: 'U3', at: 'C4' },
  { p: 'W3', at: 'A4', dir: 'd', id: 'Lp' },
  { p: 'SP', at: 'C6', dir: 'u' },
  { p: 'W3', at: 'D5', dir: 'd', id: 'Ln' },
  { p: 'S2', at: 'D4', dir: 'd' },
], icBat);

// U24 infravevő: a LED a (+) és a kimenet között (a modul kimenete belül korlátozza az áramot).
L.ic_u24 = icFrame2.concat([
  { p: 'U24', at: 'B4' },
  { p: 'W2', at: 'A4', dir: 'd', id: 'Lp' },
  { p: 'W3', at: 'D4', dir: 'd', id: 'Ln' },
  { p: 'D1', at: 'A5', dir: 'd' },
], icBat);

// D8 színes LED: egyedül, a két sín között (az áramkorlátozó ellenállás a LED-be van építve).
L.ic_d8 = icFrame2.concat([
  { p: 'D8', at: 'B5', dir: 'd' },
  { p: 'W2', at: 'A5', dir: 'd', id: 'Lp' },
  { p: 'W3', at: 'D5', dir: 'd', id: 'Ln' },
], icBat);

// U32 dallam IC (beépített hangszóróval), előtte a mérőműszer (50 mA).
L.ic_u32 = icFrame2.concat([
  { p: 'M6', at: 'B4', dir: 'd' },
  { p: 'U32', at: 'E4' },
  { p: 'W2', at: 'A4', dir: 'd', id: 'Lp' },
  { p: 'W2', at: 'D4', dir: 'd', id: 'Lm' },
  { p: 'W2', at: 'E6', dir: 'd', id: 'Ln' },
], icBat);

// U22 fényorgona két elemmel (6 V): mikrofon a bemeneten, R3 a (+)-ról; két átkötő kábel.
L.ic_u22 = [
  { p: 'W5', at: 'A3', dir: 'r', id: 'Wp' },
  { p: 'W6', at: 'G3', dir: 'r', id: 'Wn' },
  { p: 'W1', at: 'C6', id: 'Wr' },
  { p: 'U22', at: 'C3' },
  { p: 'B1', at: 'A9', dir: 'd', id: 'B1a' },
  { p: 'B1', at: 'E9', dir: 'd', id: 'B1b' },
  { p: 'W3', at: 'E3', dir: 'd', id: 'Ln' },
  { p: 'X1', at: 'E5', dir: 'd' },
  { p: 'R3', at: 'A6', dir: 'd' },
  { p: 'W3', at: 'C9', dir: 'd', id: 'Lb' },
  { p: 'W2', at: 'G8', dir: 'r', id: 'Lg' },
  { p: 'S1', at: 'A7', dir: 'r' },
  { p: 'J1', at: 'D5', to: 'A5' },
  { p: 'J2', at: 'C6', to: 'E5' },
];

// U5 rádió két rácson. 1. rács: a vevő – hangolt kör (A1 ∥ CV) az U5 bemenetén, az R5 a kimenetről adja a bemenet
// munkapontját (és az automatikus hangerő-szabályzást), a C1 ezt a pontot a rádiófrekvencia számára a (−)-ra köti;
// az U5 tápja a kimenetén, az R4-en át jön; a hang a C3-on át a hangerő-szabályzóra (RV) megy.
// 2. rács: az U4 erősítő és a hangszóró. Az RV csúszkáját és a két (−)-t átkötő kábel köti össze.
L.ic_u5 = [
  { p: 'S1', at: 'A9', dir: 'd' },
  { p: 'B1', at: 'E9', dir: 'd' },
  { p: 'R4', at: 'A8', dir: 'l' },
  { p: 'U5', at: 'F1', dir: 'l' },
  { p: 'A1', at: 'C2', dir: 'r' },
  { p: 'CV', at: 'D2', dir: 'r' },
  { p: 'R5', at: 'B6', dir: 'l' },
  { p: 'C1', at: 'E4', dir: 'd' },
  { p: 'C3', at: 'C6', dir: 'd' },
  { p: 'RV', at: 'E5', dir: 'd' },
  { p: 'W2', at: 'A8', dir: 'r', id: 'Wp' },
  { p: 'W3', at: 'C9', dir: 'd', id: 'Ws' },
  { p: 'W7', at: 'G3', dir: 'r', id: 'Wn' },
  { p: 'W3', at: 'A6', dir: 'd', id: 'Wo' },
  { p: 'W2', at: 'C2', dir: 'd', id: 'Wi' },
  { p: 'W4', at: 'B4', dir: 'd', id: 'Wt' },
  { p: 'W2', at: 'E5', dir: 'r', id: 'Wv' },
  { p: 'J1', at: 'A6', to: 'F3' },
  { p: 'J2', at: 'C2', to: 'G2' },
  // 2. rács: erősítő
  { p: 'W6', at: '2:A3', dir: 'r', id: 'Wp2' },
  { p: 'W6', at: '2:F3', dir: 'r', id: 'Wn2' },
  { p: 'W2', at: '2:C8', dir: 'd', id: 'Ws2' },
  { p: 'U4', at: '2:B4', dir: 'u' },
  { p: 'W2', at: '2:A5', dir: 'd', id: 'Lp2' },
  { p: 'W3', at: '2:D4', dir: 'd', id: 'Ln2' },
  { p: 'SP', at: '2:D5', dir: 'd' },
  { p: 'S1', at: '2:A8', dir: 'd', id: 'S1b' },
  { p: 'B1', at: '2:D8', dir: 'd', id: 'B1b' },
  { p: 'J1', at: 'F6', to: '2:C4', id: 'J1b' },
  { p: 'J2', at: 'G4', to: '2:F3', id: 'J2b' },
];

// ---- Alkatrész-album: próbapadok ----
// Tranzisztoros próbapad (NPN): az RV csúszkája az R4-en át adja a bázisáramot, a kollektorkörben LED és R1.
L.bench_npn = [
  { p: 'S1', at: 'A9', dir: 'd' },
  { p: 'B1', at: 'E9', dir: 'd' },
  { p: 'RV', at: 'G4', dir: 'r' },
  { p: 'R4', at: 'E5', dir: 'r' },
  { p: 'Q2', at: 'E8', dir: 'd' },
  { p: 'D1', at: 'F4', dir: 'u' },
  { p: 'R1', at: 'D6', dir: 'r' },
  { p: 'W2', at: 'F4', dir: 'd', id: 'Wp' },
  { p: 'W3', at: 'C9', dir: 'd', id: 'Ws' },
  { p: 'W4', at: 'G6', dir: 'r', id: 'Wn' },
  { p: 'W2', at: 'E5', dir: 'd', id: 'Ww' },
  { p: 'W2', at: 'E7', dir: 'd', id: 'Wb' },
  { p: 'W2', at: 'D8', dir: 'd', id: 'Wk' },
  { p: 'W3', at: 'D4', dir: 'r', id: 'Wx' },
  { p: 'J1', at: 'G4', to: 'A9', id: 'Jp' },
];
// Ugyanez PNP-vel (tükörkép): az emitter a (+)-on, a LED és az R1 a kollektor és a (−) között.
L.bench_pnp = [
  { p: 'S1', at: 'A9', dir: 'd' },
  { p: 'B1', at: 'E9', dir: 'd' },
  { p: 'RV', at: 'G4', dir: 'r' },
  { p: 'R4', at: 'D5', dir: 'u' },
  { p: 'Q1', at: 'A7', dir: 'd' },
  { p: 'R1', at: 'C6', dir: 'd' },
  { p: 'D1', at: 'E7', dir: 'd' },
  { p: 'W3', at: 'A7', dir: 'r', id: 'Wp' },
  { p: 'W3', at: 'C9', dir: 'd', id: 'Ws' },
  { p: 'W4', at: 'G6', dir: 'r', id: 'Wn' },
  { p: 'W3', at: 'D5', dir: 'd', id: 'Ww' },
  { p: 'W2', at: 'B5', dir: 'r', id: 'Wb' },
  { p: 'W2', at: 'C6', dir: 'r', id: 'Wk' },
  { p: 'W2', at: 'E6', dir: 'r', id: 'Wx' },
  { p: 'J1', at: 'A9', to: 'G4', id: 'Jp' },
];
// Nappali lámpa (PNP): fényben a fototranzisztor a (−) felé húzza a bázist, és a PNP bekapcsol.
L.daylamp = [
  { p: 'S1', at: 'A9', dir: 'd' },
  { p: 'B1', at: 'E9', dir: 'd' },
  { p: 'R3', at: 'A8', dir: 'd' },
  { p: 'Q4', at: 'E8', dir: 'd' },
  { p: 'Q1', at: 'A7', dir: 'd' },
  { p: 'R1', at: 'C6', dir: 'd' },
  { p: 'D1', at: 'E7', dir: 'd' },
  { p: 'W3', at: 'A7', dir: 'r', id: 'Wp' },
  { p: 'W3', at: 'C9', dir: 'd', id: 'Ws' },
  { p: 'W3', at: 'G7', dir: 'r', id: 'Wn' },
  { p: 'W3', at: 'C8', dir: 'd', id: 'Wb' },
  { p: 'W2', at: 'C6', dir: 'r', id: 'Wk' },
  { p: 'W2', at: 'E6', dir: 'r', id: 'Wx' },
  { p: 'J1', at: 'C8', to: 'B6', id: 'Jb' },
];
// Az első áramkörből cserével kapott próbapadok
const fromFirst = (f) => L.first.map((p) => f(p) || p);
L.bench_bat = fromFirst((p) => (p.p === 'R1' ? { ...p, p: 'M6' } : p.p === 'D1' ? { p: 'W3', at: 'D5', dir: 'r', id: 'Wd' } : null));
L.bench_lamp = fromFirst((p) => (p.p === 'R1' ? { p: 'W3', at: 'D2', dir: 'r', id: 'Wr' } : p.p === 'D1' ? { ...p, p: 'L1' } : null));
L.bench_motor = fromFirst((p) => (p.p === 'R1' ? { p: 'W3', at: 'D2', dir: 'r', id: 'Wr' } : p.p === 'D1' ? { ...p, p: 'M1' } : null));
L.bench_spk = fromFirst((p) => (p.p === 'D1' ? { ...p, p: 'SP' } : p.p === 'S1' ? { ...p, p: 'S2' } : null));
L.bench_photo = fromFirst((p) => (p.p === 'R1' ? { ...p, p: 'Q4' } : null));
L.bench_mic = fromFirst((p) => (p.p === 'R1' ? { ...p, p: 'X1' } : null));

module.exports = L;
