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
- Fénytávíró (villogó LED → fototranzisztor → hangszóró)
- Mikrofon-erősítő (a tablet mikrofonjával is)
- ✅ Hangra villogó LED (fújás gomb vagy a tablet mikrofonja)

### G) A fekete dobozok kinyitása
Menet: megépítjük egyszerű alkatrészekből → megértjük → mellé tesszük az igazi IC-t → megnézzük, mit tud pluszban. Az appban az IC „átlátszóvá válik”, és a megépített kapcsolás látszik benne. Az IC-k pontos belsejét nem ismerjük, azt építjük meg, amit csinálnak.

| IC | Egyszerű alkatrészekből | Mennyire |
|---|---|---|
| U23 stroboszkóp (Light) | villogó | teljesen |
| U2 riasztó (300) | sziréna | teljesen |
| U4 erősítő (300) | mikrofon-erősítő | teljesen, gyengébb hangerővel |
| U22 fényorgona (Light) | hangra villogó LED | jórészt |
| U24 infravevő (Light) | fénytávíró látható fénnyel | jórészt |
| U3 űrháború (300) | két rezgőkör keverése | részben |
| U1 zene / U32 dallam | orgona + emlékező lámpa | elv |
| U5 rádió (300) | középhullámú rádió | bizonytalan, haladó |
| D8 színes LED | több LED + villogó | elv |

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
