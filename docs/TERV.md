# Fejlesztési terv

Cél: IC nélküli kísérletek a Boffin I 300, Boffin II Light és Boffin II My Home alkatrészeiből, fejezetekbe rendezve. A végén a „fekete dobozok” (IC-k) működését egyszerű alkatrészekből építjük meg, és csak utána használjuk magukat az IC-ket.

Minden kísérletre igaz:
- az elrendezést a validátor ellenőrzi (szintek, alátámasztás, ütközés), és a három doboz alkatrészeiből megépíthető;
- a működést szimulációs teszt ellenőrzi, tranzisztoros kapcsolásnál β = 80…300 mellett is;
- három szinten van szöveg (5, 7, 11 éveseknek), felolvasással;
- a LED-ek a Boffin I készletben mindig soros ellenállással szerepelnek.

## Fejezetek

### A) Áram és alkatrészek
- ✅ Az első áramkör
- ✅ Vezet vagy nem vezet? (vizsgált tárgy két átkötő kábel között)
- ✅ Soros és párhuzamos izzók
- ✅ Fényerő-szabályzó (állítható ellenállás, mérőműszer)

### B) Energia és mozgás
- ✅ A motor mint áramfejlesztő (kézzel pörgetve, mérőműszerrel)
- ✅ Kondenzátor mint mini akkumulátor
- ✅ Motor sebességszabályzó (állítható ellenállás + tranzisztor)

### C) Érzékelők: a tranzisztor mint kapcsoló
- ✅ Éjjeli lámpa
- ✅ Érintőkapcsoló (két tranzisztor egymás után)
- ✅ Vízjelző
- ✅ Árnyékriasztó (a fénysorompó egyrácsos változata: fényben néma, árnyékban szól)

### D) Idő, memória, döntés
- ✅ Késleltetett lámpa
- ✅ Emlékező lámpa (flip-flop)
- ✅ Kódzár (ÉS-kapu)
- ✅ VAGY-kapu (két nyomógomb) és ✅ NEM-kapu (fordító)

### E) Rezgések és hangok
- ✅ Villogó, ✅ Hang a villogóból
- ✅ Metronóm
- ✅ Elektronikus orgona
- ✅ Sziréna

### F) Fény és hang továbbítása
- ✅ Fénytávíró (két rács: gyors villogó → üvegszál → fototranzisztor → hangszóró)
- ✅ Hangosbemondó (két tranzisztoros mikrofon-erősítő, az U4 párja)
- ✅ Hangra villogó LED (fújás gomb vagy a tablet mikrofonja)

### G) A fekete dobozok kinyitása
Menet: megépítjük egyszerű alkatrészekből → megértjük → mellé tesszük az igazi IC-t → megnézzük, mit tud pluszban. Az appban az IC „átlátszóvá válik”, és a megépített kapcsolás látszik benne. Az IC-k pontos belsejét nem ismerjük, azt építjük meg, amit csinálnak.

| IC | Egyszerű alkatrészekből | Mennyire |
|---|---|---|
| ✅ U23 stroboszkóp (Light) | villogó | teljesen |
| ✅ U2 riasztó (300) | sziréna | teljesen |
| ✅ U4 erősítő (300) | hangosbemondó | teljesen, gyengébb hangerővel |
| ✅ U22 fényorgona (Light) | hangra villogó LED + emlékező lámpa | jórészt |
| ✅ U24 infravevő (Light) | fénytávíró látható fénnyel | jórészt |
| ✅ U3 űrháború (300) | sziréna + villogó + emlékező lámpa | részben |
| ✅ U1 zene és ✅ U32 dallam | hangszer + emlékező lámpa + késleltetés | elv |
| ✅ U5 rádió (300) | hangolt kör + az U4 (a rádiófrekvenciás részt nem építjük meg) | elv |
| ✅ D8 színes LED | villogó | elv |

## App
- Fejezetes navigáció, haladásjelző, „kinyitott IC” jelvények.
- Új alkatrészmodellek: állítható ellenállás, mérőműszer (5 V / 0,5 mA / 50 mA), motor (generátorként is), mikrofon, sípolóchip, fehér LED, izzók, 4,5 V-os elemtartó, viselkedési IC-modellek.
- Tablet mikrofonja mint a virtuális mikrofon bemenete.
- Offline működés (telepíthető webapp).

## Ütemezés
1. Fejezetes szerkezet + A–C
2. D–F + mikrofon
3. G (fekete dobozok) + offline mód

Minden fázis végén: tesztek, böngészős ellenőrzés, commit, push, a GitHub Pages frissül.

## Még hátravan
- ✅ U4 erősítő IC és a hangosbemondó
- ✅ U22 fényorgona, U24 infravevő, U3 űrháború, U32 dallam, D8 színes LED
- ✅ U5 rádió (középhullám, a Kossuth Rádió 540 kHz-en)
- ✅ Offline működés (telepíthető webapp)
- A valódi készleten szerzett tapasztalatok alapján a szimuláció finomítása

## Alkatrész-album (2026. november 6.)
- ✅ 16 alkatrészkártya próbapaddal (valódi szimuláció), magyarázattal három szinten, rajzjellel, hasonlattal, kérdéssel és matricával.
- ✅ NPN ↔ PNP összehasonlítás ugyanazzal a csúszkával; új kísérlet: Nappali lámpa (PNP).
- ✅ Figyelmeztetés tartós túláramnál (LED > 30 mA, elem > 1 A).

## Munkamenet (2026. november 6-tól)
- A fejlesztés a `dev` ágon folyik; ami ott minden teszten átment, az automatikusan kimegy a https://nimmerfroh.github.io/boffin-fekete-doboz-nelkul/dev/ címre (DEV címkével).
- A `main` ágba (élesbe) csak akkor kerül át, ha a dev címen kipróbáltuk, és rábólintottunk.

## Képernyő-elrendezés (2026. november 6.)
- Vékony, a képernyő tetejére ragadó fejléc; a közepén lévő gomb mutatja, mi van nyitva, és koppintásra lecsúszik belőle a fejezet- és kísérletválasztó.
- Széles nézetben (fekvő tablet) a munkaterület pontosan kitölti a képernyőt: a rajzlap és a jobb oldali panel magában görget, a panel gombsora mindig látszik. Álló tableten és telefonon a gombsor a képernyő aljára ragad.
- Alkatrészkártyáról egy gombnyomással vissza lehet menni a legutóbbi kísérlethez.

## Átnézések (2026. november 6.)
- Két független átnézés (Codex gpt-6-astra és Claude Opus 5.5), aztán egy második kör (Opus) a javítások után.
- Fő javítások: a szimulátor átbillenéskori nem konvergált lépései (belső tranzisztorkapacitások, adaptív lépésköz); biztonság a valódi készleten (fénytávíró vevője, mérő-túlterhelés, propeller); service worker és a két csatorna szétválasztása; hang- és mikrofonkezelés; kb. 35 kérdés és sok szám a szövegekben; a válaszok sorrendjének keverése; helyi betűtípusok; források és licencek a láblécben.
- Szándékosan maradt: a vezetőképesség-mérésnél a 0,5 mA-es állás választható (figyelmeztetéssel), a fototranzisztor-kártyán nincs soros ellenállás (a kézikönyv szerint erős fényben kb. 1 kΩ).
