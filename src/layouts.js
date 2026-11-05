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

module.exports = L;
