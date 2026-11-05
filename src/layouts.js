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
  { p: 'R2', at: 'E3', dir: 'r' },
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

module.exports = L;
