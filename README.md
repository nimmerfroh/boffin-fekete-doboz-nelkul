# Fekete doboz nélkül

Interaktív, IC nélküli áramkör-kísérletek gyerekeknek, a **Boffin I 300**, **Boffin II Light** és **Boffin II My Home** elektronikai építőkészletek alkatrészeiből.

**Kipróbálható itt:** https://nimmerfroh.github.io/boffin-fekete-doboz-nelkul/

## Telepítés a tabletre (offline is működik)

Nyisd meg a fenti címet, aztán:
- **iPad / iPhone (Safari):** Megosztás gomb → *Főképernyőhöz adás*.
- **Android (Chrome):** menü (⋮) → *Alkalmazás telepítése* vagy *Hozzáadás a kezdőképernyőhöz*.

Egyszeri megnyitás után internet nélkül is fut. Új kiadásnál magától frissül, amikor legközelebb van net.

## Miért?

A készletek integrált áramkörei (zene-, riasztó-, „űrháborús” IC) fekete dobozok: bepattintod, és szól, de nem derül ki, hogyan. Ezek a kísérletek csak egyszerű, érthető alkatrészekből (ellenállás, kondenzátor, LED, tranzisztor) építkeznek. Az utolsó kísérletben a gyerek maga építi meg, ami egy hangot adó IC-ben történik.

## Kísérletek

**A) Áram és alkatrészek:** az első áramkör · vezet vagy nem vezet? · soros és párhuzamos izzók · fényerő-szabályzó
**B) Energia és mozgás:** a motor mint áramfejlesztő · kondenzátor mint akkumulátor · motor sebességszabályzó
**C) Érzékelők:** éjjeli lámpa · érintőkapcsoló · vízjelző · árnyékriasztó
**D) Idő, memória, döntés:** késleltetett lámpa · emlékező lámpa (flip-flop) · kódzár (ÉS) · bármelyik gomb (VAGY) · fordító (NEM)
**E) Rezgések és hangok:** villogó · metronóm · hang a villogóból · elektronikus hangszer · sziréna
**F) Fény és hang továbbítása:** hangra villogó LED (a tablet mikrofonjával is) · hangosbemondó (két tranzisztoros mikrofon-erősítő) · fénytávíró (két rács, üvegszál)
**G) A fekete dobozok kinyitása:** U23 stroboszkóp · D8 színes LED · U2 riasztó · U3 űrháború · U1 zene · U32 dallam · U4 erősítő · U22 fényorgona · U24 infravevő · U5 rádió (középhullám, a Kossuth Rádió 540 kHz-en). Az IC-t valódi alkatrészként építjük be, aztán „kinyitjuk”: megmutatjuk, mely saját kísérletek rakják ki a belsejét.

**Alkatrész-album** (a fejléc „Alkatrészek” gombja): 16 alkatrész (elem, vezeték, kapcsoló, LED, ellenállás, izzó, motor, hangszóró, kondenzátor, állítható ellenállás, fototranzisztor, mikrofon, NPN és PNP tranzisztor, mérőműszer, IC) egy-egy kis próbapaddal, magyarázattal, rajzjellel, hasonlattal és kérdéssel; a jó válasz után matrica jár. A PNP tranzisztorhoz külön kísérlet is van: a nappali lámpa (C fejezet).

A további fejezetek tervét lásd: [docs/TERV.md](docs/TERV.md).

Minden kísérlet menete: hozzávalók (melyik dobozból), lépésenkénti építés a valódi A–G × 1–10-es rácson, tippelés, élő szimuláció (látható áram, kapcsolók, alkatrészcsere), magyarázat. A szövegek három szinten (5, 7 és 11 éveseknek) érhetők el, felolvasással.

## Hogyan működik?

A szimulátor (`src/engine.js`) a rácson elhelyezett alkatrészekből rakja össze a kapcsolást, majd SPICE-szerű módszerrel (csomóponti analízis, Newton-iteráció, Ebers–Moll tranzisztormodell) számolja az áramokat. Az elrendezéseket ugyanez a kód ellenőrzi: szintek, alátámasztás, ütközés. A hangot a szimulált hangszóróáramból állítja elő.

Az IC-modulok (U1, U2, U3, U4, U5, U22, U23, U24, U32 és a D8 színes LED) viselkedési modellek a kézikönyvben leírt lábkiosztás és működés alapján; a belső hangmintáik és pontos számaik saját közelítések. A rádiónál a szimulátor nem számol rádiófrekvencián: a vétel erősségét a hangolt kör rezonanciafrekvenciájából becsüli, és a műsor helyett egy kitalált dallam szól. A szimuláció közelítés, a valódi alkatrészek ettől kicsit eltérhetnek, például a villogás sebességében vagy a késleltetés hosszában.

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
- `index.html`, `sw.js`: a kész, önálló oldal és a service worker (helyi kipróbáláshoz; a `sw.js`-t a build készíti a `src/sw.template.js`-ből)
- `manifest.webmanifest`, `icons/`, `hangok/`: telepíthető webapp, ikonok, hangok

### Ágak és címek

| Ág | Cím | Mire való |
|---|---|---|
| `main` | https://nimmerfroh.github.io/boffin-fekete-doboz-nelkul/ | éles változat |
| `dev` | https://nimmerfroh.github.io/boffin-fekete-doboz-nelkul/dev/ | fejlesztői változat (DEV címkével): itt próbáljuk ki az újdonságokat |

A fejlesztés a `dev` ágon folyik; ami ott bevált, az kerül át a `main`-be. Bármelyik ágra feltöltve a `.github/workflows/pages.yml` lefuttatja mindkét ág tesztjeit, és kiadja a webhelyet: a `main`-t a gyökérbe, a `dev`-et a `/dev/` alá (`node build.mjs --out _site --channel main`, illetve `--out _site/dev --channel dev`). A két változat külön appként telepíthető, és külön offline tárolót használ.

## Licenc

GNU General Public License v3.0 vagy későbbi változata (GPL-3.0-or-later), lásd: [LICENSE](LICENSE). Szabadon használhatod, módosíthatod és továbbadhatod; ha a módosított változatot továbbadod, azt is GPL alatt, forráskóddal együtt kell kiadnod.

Copyright (C) 2026 Nimmerfroh Károly

**Kivétel: a pukihangok** (`hangok/puki/`) nem a GPL alá tartoznak. Ezek a Wikimedia Commonsról letöltött, átdolgozott valódi felvételek Creative Commons licenccel (CC BY 3.0, illetve CC BY-SA 3.0/4.0). A forrásokat és a szerzőket a [hangok/puki/FORRASOK.md](hangok/puki/FORRASOK.md) sorolja fel. A legtöbb darab a Yle Arkisto „Different kind of real farts” gyűjteményéből való (CC BY 3.0).

**Betűtípusok** (`fonts/`): Baloo 2 és Atkinson Hyperlegible, SIL Open Font License 1.1 (`fonts/OFL-*.txt`). Helyben vannak, így az app nem kér semmit külső szerverről, és offline is a saját betűivel jelenik meg.

## Nem hivatalos

Ez a projekt semmilyen kapcsolatban nem áll a Boffin készletek gyártójával vagy forgalmazójával. A Boffin név csak azt jelzi, melyik készletek alkatrészeihez készültek a kísérletek. A kísérletek, az elrendezések, a rajzok és a szövegek saját munka; az alkatrészlisták a gyártó nyilvános kézikönyveiből származnak.
