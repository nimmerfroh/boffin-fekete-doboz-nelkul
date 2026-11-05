# Fekete doboz nélkül

Interaktív, IC nélküli áramkör-kísérletek gyerekeknek, a **Boffin I 300**, **Boffin II Light** és **Boffin II My Home** elektronikai építőkészletek alkatrészeiből.

**Kipróbálható itt:** https://nimmerfroh.github.io/boffin-fekete-doboz-nelkul/

## Miért?

A készletek integrált áramkörei (zene-, riasztó-, „űrháborús” IC) fekete dobozok: bepattintod, és szól, de nem derül ki, hogyan. Ezek a kísérletek csak egyszerű, érthető alkatrészekből (ellenállás, kondenzátor, LED, tranzisztor) építkeznek. Az utolsó kísérletben a gyerek maga építi meg, ami egy hangot adó IC-ben történik.

## Kísérletek

**A) Áram és alkatrészek:** az első áramkör · vezet vagy nem vezet? · soros és párhuzamos izzók · fényerő-szabályzó
**B) Energia és mozgás:** a motor mint áramfejlesztő · kondenzátor mint akkumulátor · motor sebességszabályzó
**C) Érzékelők:** éjjeli lámpa · érintőkapcsoló · vízjelző
**D) Idő, memória, döntés:** késleltetett lámpa · emlékező lámpa (flip-flop) · kódzár (ÉS) · bármelyik gomb (VAGY) · fordító (NEM)
**E) Rezgések és hangok:** villogó · metronóm · hang a villogóból · elektronikus hangszer · sziréna

A további fejezetek tervét lásd: [docs/TERV.md](docs/TERV.md).

Minden kísérlet menete: hozzávalók (melyik dobozból), lépésenkénti építés a valódi A–G × 1–10-es rácson, tippelés, élő szimuláció (látható áram, kapcsolók, alkatrészcsere), magyarázat. A szövegek három szinten (5, 7 és 11 éveseknek) érhetők el, felolvasással.

## Hogyan működik?

A szimulátor (`src/engine.js`) a rácson elhelyezett alkatrészekből rakja össze a kapcsolást, majd SPICE-szerű módszerrel (csomóponti analízis, Newton-iteráció, Ebers–Moll tranzisztormodell) számolja az áramokat. Az elrendezéseket ugyanez a kód ellenőrzi: szintek, alátámasztás, ütközés. A hangot a szimulált hangszóróáramból állítja elő.

A szimuláció közelítés, a valódi alkatrészek ettől kicsit eltérhetnek, például a villogás sebességében vagy a késleltetés hosszában.

## Fejlesztés

Node.js 18+ kell hozzá, külső csomag nem.

```sh
node build.mjs        # src/ -> index.html
node --test           # a kísérletek ellenőrzése szimulációval (tests/*.test.js)
```

- `src/page.html`: az oldal váza és stílusai
- `src/engine.js`: rácsgeometria, építési ellenőrzés, áramkör-szimulátor
- `src/layouts.js`: a kísérletek elrendezése a rácson
- `src/app.js`: felület, szövegek, animáció, hang
- `index.html`: a kész, önálló oldal (ezt szolgálja ki a GitHub Pages)

## Licenc

GNU General Public License v3.0 vagy későbbi változata (GPL-3.0-or-later), lásd: [LICENSE](LICENSE). Szabadon használhatod, módosíthatod és továbbadhatod; ha a módosított változatot továbbadod, azt is GPL alatt, forráskóddal együtt kell kiadnod.

Copyright (C) 2026 Nimmerfroh Károly

## Nem hivatalos

Ez a projekt semmilyen kapcsolatban nem áll a Boffin készletek gyártójával vagy forgalmazójával. A Boffin név csak azt jelzi, melyik készletek alkatrészeihez készültek a kísérletek. A kísérletek, az elrendezések, a rajzok és a szövegek saját munka; az alkatrészlisták a gyártó nyilvános kézikönyveiből származnak.
