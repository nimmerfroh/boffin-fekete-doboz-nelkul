// SPDX-License-Identifier: GPL-3.0-or-later
// Fekete doboz nélkül – Copyright (C) 2026 Nimmerfroh Károly
// A kísérletek leírása: fejezet, elrendezés, vezérlők, szövegek három korosztálynak.
// Szintek: k = 5 éves, m = 7 éves, n = 11 éves.
(function (root) {
'use strict';
function define(E, LAY) {
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
    id: 'first', chapter: 'A', hint: { k: 'Kapcsold be az S1-et! Nézd, merre mennek a sárga pöttyök: ez az áram.', m: 'Kapcsold be az S1 kapcsolót, alul vagy magán a rácson. A sárga pöttyök mutatják, merre folyik az áram.', n: 'Kapcsold be az S1-et. A pöttyök sebessége az áram nagyságát mutatja (logaritmikusan).' },
    title: 'Az első áramkör', tag: 'Körbe kell érnie az áramnak',
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
    id: 'night', chapter: 'C', hint: { k: 'Kapcsold be, aztán húzd a fényt a hold felé, vagy nyomd a „Takard le” gombot!', m: 'Kapcsold be az S1-et, és állítsd a fényt. Figyeld, mikor gyullad ki a LED.', n: 'Kapcsold be az S1-et, és a fénycsúszkával keresd meg a billenési pontot.' },
    title: 'Éjjeli lámpa', tag: 'Sötétben magától kigyullad',
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
    id: 'delay', chapter: 'D', hint: { k: 'Kapcsold be az S1-et, nyomd meg az S2 gombot, aztán engedd el!', m: 'Kapcsold be az S1-et, nyomd meg és engedd el az S2-t. Figyeld a kondenzátor sárga csíkját: ennyi töltés van benne.', n: 'S1 be, S2 rövid nyomás. Figyeld a C5 feszültségét és a bázisáramot a mérőn.' },
    title: 'Késleltetett lámpa', tag: 'Elengeded, de még ég egy kicsit',
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
    id: 'flash', chapter: 'E', hint: { k: 'Kapcsold be, és figyeld a két lámpát!', m: 'Kapcsold be az S1-et. Figyeld a két kondenzátor sárga csíkját: felváltva töltődnek.', n: 'S1 be. Figyeld a két bázisáramot: mindig csak az egyik tranzisztor vezet.' },
    title: 'Villogó', tag: 'Két tranzisztor kapcsolgatja egymást',
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
    id: 'sound', chapter: 'E', hint: { k: 'Kapcsold be, és nyomd meg a Hang gombot! A képernyőn lelassítva látod.', m: 'Kapcsold be az S1-et és a hangot. A képernyő ezerszer lassabban mutatja, ami valójában történik.', n: 'S1 be, Hang be. A kijelzés 1000× lassított; a hang a szimulált hangszóróáramból készül.' },
    title: 'Hang a villogóból', tag: 'Nyissuk ki a fekete dobozt',
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
  // ===================== A) Áram és alkatrészek =====================
  {
    id: 'conduct', chapter: 'A', title: 'Vezet vagy nem vezet?', tag: 'Mi engedi át az áramot?',
    layout: LAY.conduct, sim: { dt: 0.002, scale: 1, meter: { M6: '50mA' }, obj: { TP: 1e12 } },
    controls: [{ obj: 'TP', set: 'materials' }, { meter: 'M6' }],
    intro: {
      k: 'Megnézzük, mi engedi át az áramot. Fogd a két kábel végét a dologhoz, és figyeld a lámpát és a mutatót!',
      m: 'A két átkötő kábel szabad végével különféle tárgyakat érintünk meg. Ha a tárgy vezeti az áramot, a kör bezárul: a LED világít, a mérőműszer kileng.',
      n: 'Vezetőképesség-vizsgáló: a vizsgált tárgy sorba kerül a LED-del és a mérőműszerrel. A műszer érzékenyebb a LED-nél, ezért a gyengén vezető anyagokat (víz, bőr) is kimutatja.',
    },
    guess: {
      q: { k: 'Melyik vezeti az áramot: a ceruza hegye vagy a papír?', m: 'Melyik vezeti az áramot: a ceruzabél (grafit) vagy a papír?', n: 'Grafit vagy papír: melyik zárja a kört?' },
      opts: [['A ceruzabél', 'on'], ['A papír', 'off'], ['Egyik sem', 'off']], right: 0,
      after: { k: 'Igen! A ceruza hegye vezet, a papír nem.', m: 'A grafit vezet, ezért a LED világít. A papír szigetelő: nem enged át áramot.', n: 'A grafit félfém, vezet; a papír szigetelő, gyakorlatilag végtelen ellenállású.' },
    },
    variants: [],
    hint: {
      k: 'Válassz egy tárgyat lent, és nézd: világít a lámpa? Kileng a mutató?',
      m: 'Válassz tárgyat. Ha a mutató alig mozdul, kapcsold a műszert érzékenyebb állásba (0,5 mA).',
      n: 'Válassz tárgyat, és váltogasd a méréshatárt. A csapvíz és a kéz árama a LED-nek kevés, de a 0,5 mA-es állásban látszik.',
    },
    why: {
      k: 'Van, ami átengedi az áramot, mint a fém és a ceruza hegye. Ezek a vezetők. Van, ami nem, mint a papír és a műanyag. Ezek a szigetelők. A víz és a kezed is átenged egy kicsit, de csak nagyon keveset.',
      m: 'A fémekben az áram könnyen halad, ezért a LED fényesen ég. A ceruzabél is vezet, csak gyengébben. A víz és a bőr nagyon kevés áramot enged át: a LED-nek ez nem elég, de az érzékeny mérőműszer megmutatja. A papír és a műanyag szigetelő. Ezért van a vezetékeken műanyag bevonat.',
      n: 'A kör árama I = (3 V − U_LED) / (R1 + R_műszer + R_tárgy). Alufóliával kb. 11 mA, grafittal (néhány száz Ω) kb. 3 mA, csapvízzel (kb. 20 kΩ) kb. 0,07 mA, bőrrel (több száz kΩ) néhány µA. A műszer 50 mA-es állásban 50 mA-nél, 0,5 mA-es állásban már 0,5 mA-nél ér a végkitérésre: százszor érzékenyebb.',
    },
  },
  {
    id: 'series', chapter: 'A', title: 'Soros és párhuzamos izzók', tag: 'Egymás után vagy egymás mellett?',
    layout: LAY.series, sim: { dt: 0.002, scale: 1 }, controls: ['S1'],
    intro: {
      k: 'Két lámpát kötünk be. Előbb egymás után, aztán egymás mellé. Melyik világít jobban?',
      m: 'Két izzót egymás után (sorosan) kötünk. Utána átépítjük, hogy egymás mellett (párhuzamosan) legyenek. Figyeld, mennyire világítanak.',
      n: 'Soros és párhuzamos kapcsolás összehasonlítása a 2,5 V-os (L1) és a 6 V-os (L2) izzóval, 3 V-ról.',
    },
    guess: {
      q: { k: 'Két lámpa egymás után. Fényesebbek lesznek, mint egy lámpa, vagy halványabbak?', m: 'Ha két izzót egymás után kötsz, fényesebbek vagy halványabbak lesznek, mint egyetlen izzó?', n: 'Mi történik az áramerősséggel, ha két izzót sorba kötsz?' },
      opts: [['Halványabbak', 'dim'], ['Ugyanolyanok', 'on'], ['Fényesebbek', 'on']], right: 0,
      after: { k: 'Igen! Egymás után halványabbak, mert az áramnak mindkettőn át kell mennie.', m: 'Sorosan az áramnak mindkét izzón át kell jutnia, ez nehezebb, ezért kisebb az áram, és halványabbak.', n: 'Soros kapcsolásnál az ellenállások összeadódnak, így az áram kisebb: kb. 80 mA az egyes izzók 180 és 140 mA-e helyett.' },
    },
    variants: [
      { id: 'par', label: 'Építsd át párhuzamosra', real: 'Építsd át a rajz szerint: a két izzó egymás mellé kerül, a felső és az alsó vezeték közé.', layout: 'parallel', needs: ['W7', 'W4'] },
    ],
    hint: {
      k: 'Kapcsold be, és nézd, mennyire világítanak. Aztán nyomd meg lent az „Építsd át” gombot!',
      m: 'Kapcsold be az S1-et. Utána építsd át párhuzamosra, és hasonlítsd össze.',
      n: 'S1 be. Hasonlítsd össze az izzók áramát soros és párhuzamos kapcsolásban.',
    },
    why: {
      k: 'Egymás után a két lámpa osztozik az áramon, ezért halványak. Egymás mellett mindegyik külön utat kap, ezért fényesebbek.',
      m: 'Sorosan az áram egyetlen úton halad, és mindkét izzó fékezi. Párhuzamosan mindkét izzó a teljes elemfeszültséget kapja, és mindkettőn külön áram folyik. A lakásban is párhuzamosan vannak bekötve a lámpák, ezért nem halványodnak el, ha bekapcsolsz egy másikat. A 6 V-os izzó 3 V-on mindig halványabb a 2,5 V-osnál.',
      n: 'Sorosan R = R1 + R2 ≈ 36 Ω, I = 3 V / 36 Ω ≈ 83 mA mindkettőn. Párhuzamosan mindkettőre 3 V jut: L1-en kb. 180 mA, L2-n kb. 140 mA folyik, az elemből összesen kb. 320 mA. Ezért fogy gyorsabban az elem párhuzamos kapcsolásnál. (A modell az izzók meleg ellenállásával számol; a valóságban hidegen kisebb.)',
    },
  },
  {
    id: 'dimmer', chapter: 'A', title: 'Fényerő-szabályzó', tag: 'Tekerd, és halványul',
    layout: LAY.dimmer, sim: { dt: 0.002, scale: 1, meter: { M6: '50mA' }, pot: { RV: 0 } }, controls: ['S1', { pot: 'RV', label: 'Fényerő (RV)', invert: true }, { meter: 'M6' }],
    intro: {
      k: 'A zöld gombbal (RV) a lámpa fényét lehet állítani. A mutató megmutatja, mennyi áram folyik.',
      m: 'Az állítható ellenállás (RV) olyan, mint egy csap: tekerve változik, mennyire fékezi az áramot. A mérőműszer (M6) mutatja az áramot.',
      n: 'Az RV-t változtatható ellenállásként használjuk (az egyik vég és a csúszka között 0–50 kΩ). Sorba van kötve az R1-gyel, a LED-del és a mérőműszerrel.',
    },
    guess: {
      q: { k: 'Ha tekered a gombot, mi lesz a lámpával?', m: 'Mi történik a LED-del, ha tekered az RV gombját?', n: 'Hogyan változik a LED árama az RV ellenállásával?' },
      opts: [['Halványodik vagy erősödik', 'dim'], ['Csak ki-be kapcsol', 'blink'], ['Semmi', 'same']], right: 0,
      after: { k: 'Igen! A gombbal halványítod.', m: 'Minél nagyobb az ellenállás, annál kevesebb áram jut a LED-hez, és annál halványabb.', n: 'I ≈ (3 V − U_LED) / (R1 + R_RV): 0 Ω-nál kb. 11 mA, 50 kΩ-nál kb. 0,03 mA.' },
    },
    variants: [],
    hint: {
      k: 'Kapcsold be, és húzd a gombot! Nézd a lámpát és a mutatót.',
      m: 'Kapcsold be az S1-et, és tekerd az RV-t. Ha a mutató már alig mozdul, kapcsold a műszert 0,5 mA-re.',
      n: 'Figyeld, hogy a fényerő nem egyenletesen változik: a gomb elején gyorsan halványul, utána alig. Miért?',
    },
    why: {
      k: 'A gomb egy fékező, amit erősebbre vagy gyengébbre tudsz állítani. Erős fékezésnél kevés áram megy a lámpához, és halványabb lesz.',
      m: 'Az ellenállás fékezi az áramot. Az RV-ben egy csúszka megy végig egy ellenálláscsíkon: ahogy tekered, hosszabb vagy rövidebb darabon kell átmennie az áramnak. Hosszabb darab, nagyobb fékezés, halványabb fény. A mérőműszer ezt számokban is mutatja.',
      n: 'A LED-áram az ellenállással fordítottan arányos (I ≈ 1,2 V / R), ezért a gomb elején, ahol R még kicsi, nagyon gyorsan változik, utána lassan. A „lineáris” potméter így a fényerőben nem lineáris; ezért használnak a hangerőszabályzókban logaritmikus potmétert.',
    },
  },

  // ===================== B) Energia és mozgás =====================
  {
    id: 'generator', chapter: 'B', title: 'A motor mint áramfejlesztő', tag: 'Pörgesd meg, és áramot ad',
    layout: LAY.generator, sim: { dt: 0.002, scale: 1, meter: { M6: '5V' } }, controls: [{ spin: 'M1' }, { meter: 'M6' }],
    intro: {
      k: 'Itt nincs elem! Pörgesd meg kézzel a motort, és figyeld a mutatót.',
      m: 'Nincs elem az áramkörben, csak egy motor és a mérőműszer. Ha a motort kézzel pörgeted, áramot termel.',
      n: 'A motor fordítva is működik: forgatva feszültséget indukál (generátor). A mérőműszer 5 V-os állásban a motor feszültségét méri.',
    },
    guess: {
      q: { k: 'Nincs elem. Ha megpörgeted a motort, megmozdul a mutató?', m: 'Elem nélkül, csak kézzel pörgetve, kileng a műszer?', n: 'Mit mér a műszer, ha a motor tengelyét kézzel forgatod?' },
      opts: [['Igen, a motor áramot termel', 'on'], ['Nem, elem nélkül nincs áram', 'off']], right: 0,
      after: { k: 'Igen! Ha pörgeted, a motor áramot ad.', m: 'A forgó motor áramot termel. Így működnek az erőművek generátorai és a biciklidinamó is.', n: 'Kb. 1 V-ot: a feszültség a fordulatszámmal arányos.' },
    },
    variants: [],
    hint: {
      k: 'Nyomd és tartsd a „Pörgesd meg” gombot! Aztán próbáld visszafelé is.',
      m: 'Tartsd nyomva a „Pörgesd meg” gombot. Utána próbáld visszafelé: merre lendül a mutató?',
      n: 'Pörgesd mindkét irányba. Visszafelé a feszültség előjele megfordul, a mutató balra akad.',
    },
    why: {
      k: 'A motorban mágnes és drót van. Ha forgatod, a mágnes áramot kelt a drótban. Ez a dinamó, mint a biciklin.',
      m: 'A motor belsejében tekercs forog egy mágnes mellett. Ha a motort elemmel hajtjuk, az áram forgatja. Ha mi forgatjuk, a mágnes kelt áramot a tekercsben. Ugyanaz az alkatrész kétféleképpen működik. Visszafelé forgatva az áram is visszafelé folyik. Egy LED-hez ez kevés lenne, annak kb. 1,8 V kell.',
      n: 'Indukált feszültség: U = k · ω, a fordulatszámmal arányos. Kézzel kb. 1100/perc érhető el, ez kb. 1 V. A LED nyitófeszültsége kb. 1,8 V, ezért egy LED nem világítana róla, de a műszer kimutatja. Fordított forgásirányban U előjele is megfordul.',
    },
  },
  {
    id: 'capbat', chapter: 'B', title: 'Kondenzátor mint akkumulátor', tag: 'Feltöltöd, és egy kicsit kitart',
    layout: LAY.capbat, sim: { dt: 0.002, scale: 1, meter: { M6: '5V' } }, controls: ['S2', { meter: 'M6' }],
    intro: {
      k: 'A két nagy kondenzátor kis tartály az áramnak. A gombbal megtöltöd, aztán figyeld, meddig világít a lámpa.',
      m: 'Az S2 gomb nyomva tartásakor az elem feltölti a két 470 µF-os kondenzátort. Elengedés után az elem már nincs bekötve: a LED a kondenzátorokból kap áramot. A műszer a feszültségüket mutatja.',
      n: 'Két párhuzamos 470 µF-os kondenzátor (940 µF) kisül az R2 (1 kΩ) és a LED felé. A mérőműszer 5 V-os állásban a kondenzátorok feszültségét méri.',
    },
    guess: {
      q: { k: 'Feltöltöd, aztán elengeded a gombot. Mit csinál a lámpa?', m: 'Feltöltöd a kondenzátorokat, aztán elengeded az S2-t. Mi lesz a LED-del?', n: 'Mi történik a LED-del és a feszültséggel az S2 elengedése után?' },
      opts: [['Még világít egy kicsit', 'fade'], ['Azonnal kialszik', 'off'], ['Örökké világít', 'on']], right: 0,
      after: { k: 'Igen! A kondenzátorban maradt áram, abból világít még.', m: 'A kondenzátorok tárolták a töltést, és most átadják a LED-nek. Ahogy fogy, a LED halványul.', n: 'A kondenzátor feszültsége csökken, a LED kb. 1,6 V alatt kialszik: nagyjából 1,5–2 másodperc.' },
    },
    variants: [
      { id: 'one', label: 'Csak egy kondenzátorral', real: 'Vedd ki az egyik 470 µF-os kondenzátort (a B3–D3 közöttit). Rövidebb vagy hosszabb ideig világít majd?', apply: (lay) => lay.filter((p) => p.id !== 'C5b') },
    ],
    hint: {
      k: 'Nyomd meg és tartsd az S2 gombot, aztán engedd el, és figyeld a lámpát!',
      m: 'Tartsd nyomva az S2-t pár másodpercig, aztán engedd el. Figyeld a mutatót: ennyi „töltés” van a tartályban.',
      n: 'Töltsd fel, engedd el, és figyeld a feszültség csökkenését. Melyik feszültségnél alszik ki a LED?',
    },
    why: {
      k: 'A kondenzátor olyan, mint egy kis vödör. A gombbal teletöltöd, utána a lámpa kiissza belőle az áramot. Kicsi a vödör, ezért hamar kiürül.',
      m: 'A kondenzátor töltést tárol, mint egy nagyon kicsi akkumulátor. Sokkal kevesebbet tud, mint egy elem, de nagyon gyorsan feltölthető és kisüthető. Két kondenzátor együtt kétszer annyit tárol, mint egy.',
      n: 'Q = C · U = 940 µF · 3 V ≈ 2,8 mC. A LED kb. 1,6 V-ig világít, addig kb. 1,3 mC töltés fogy el, nagyjából 1 mA-es átlagárammal ez másfél–két másodperc. Egy ceruzaelem kb. 2000 mAh-t, azaz 7200 C-ot tárol: több milliószor ennyit.',
    },
  },
  {
    id: 'motorspeed', chapter: 'B', title: 'Motor sebességszabályzó', tag: 'Gombbal gyorsítod a ventilátort',
    layout: LAY.motorspeed, sim: { dt: 0.002, scale: 1, pot: { RV: 0.5 } }, controls: ['S1', { pot: 'RV', label: 'Sebesség (RV)', invert: true }],
    intro: {
      k: 'A gombbal a ventilátor sebességét állítod. A két piros tranzisztor segít, hogy a kicsi gomb a nagy motort is irányítsa.',
      m: 'Az RV gombja egy kis feszültséget állít be. Ezt két tranzisztor egymás után felerősíti, hogy a motor elég áramot kapjon.',
      n: 'Az RV feszültségosztó, a csúszkája két tranzisztorból álló Darlington-kapcsolást vezérel; a motor az emitterkörben van (emitterkövető).',
    },
    guess: {
      q: { k: 'Tekered a gombot. Mi lesz a ventilátorral?', m: 'Mi történik a motorral, ha tekered az RV-t?', n: 'Hogyan függ a motor fordulatszáma a csúszka állásától?' },
      opts: [['Gyorsul vagy lassul', 'dim'], ['Csak ki-be kapcsol', 'blink'], ['Semmi', 'same']], right: 0,
      after: { k: 'Igen! A gombbal gyorsítod és lassítod.', m: 'A gomb a tranzisztorokon keresztül szabályozza, mennyi áram jut a motorhoz.', n: 'A motor feszültsége kb. a csúszka feszültsége mínusz 1,4 V (két bázis–emitter átmenet).' },
    },
    variants: [],
    hint: {
      k: 'Kapcsold be, és húzd a sebesség gombot!',
      m: 'Kapcsold be az S1-et, és állítsd a sebességet. Figyeld, mikor indul el a motor.',
      n: 'Keresd meg, melyik állásnál indul el a motor, és mekkora a legnagyobb fordulatszám.',
    },
    why: {
      k: 'A gombon csak egy picike áram megy át. A tranzisztorok ebből a picike áramból nagyot csinálnak, ami már a motort is meg tudja forgatni.',
      m: 'Az RV-n át csak nagyon kevés áram folyik, ez kevés egy motorhoz. Az első tranzisztor százszorosára erősíti, a második még százszorosára. Így a gomb nagyon kis áramával irányíthatod a motor nagy áramát. Ha a gomb túl alacsony feszültséget ad, a motor el sem indul.',
      n: 'Darlington-kapcsolás: a teljes áramerősítés β₁·β₂ ≈ 10 000–20 000, így a csúszka árama mikroamperes, a motoré 30–60 mA. Ára a két bázis–emitter feszültség (kb. 1,4 V): a motorra legfeljebb kb. 1,6 V jut, ezért lassabb, mint közvetlenül az elemre kötve. Egy tranzisztorral az RV terhelése miatt a szabályozás csak a skála legvégén működne.',
    },
  },

  // ===================== C) Érzékelők =====================
  {
    id: 'touch', chapter: 'C', title: 'Érintőkapcsoló', tag: 'Ujjal kapcsolod be',
    layout: LAY.touch, sim: { dt: 0.002, scale: 1, obj: { TP: 1e12 } }, controls: ['S1', { touch: 'TP', R: 5e5, label: 'Érintsd meg a C3 és az E3 pontot' }],
    intro: {
      k: 'Ha ujjal megérinted a két pontot, kigyullad a lámpa. Pedig a kezed nem fém!',
      m: 'Az ujjad nagyon kevés áramot vezet. Két tranzisztor egymás után ezt a picike áramot olyan erősre növeli, hogy a LED kigyullad.',
      n: 'Érintőkapcsoló Darlington-kapcsolással: az ujj (kb. 100 kΩ–1 MΩ) és az R2 adja a bázisáramot.',
    },
    guess: {
      q: { k: 'Mi lesz, ha ujjal megérinted a két pontot?', m: 'Mi történik, ha egyszerre megérinted a C3 és az E3 pontot?', n: 'Elég-e a bőr ellenállásán átfolyó áram a LED bekapcsolásához?' },
      opts: [['Kigyullad a LED', 'on'], ['Semmi, a kéz nem vezet', 'off']], right: 0,
      after: { k: 'Igen! A kezed egy picit vezeti az áramot, és ez elég.', m: 'A bőröd vezet egy kicsit. Ez a kis áram a tranzisztorokon keresztül felerősödik, és kigyullad a LED.', n: 'Néhány µA bázisáram β²-szerese már bőven telítésbe viszi a kimeneti tranzisztort.' },
    },
    variants: [],
    hint: {
      k: 'Kapcsold be, aztán nyomd és tartsd az „Érintsd meg” gombot!',
      m: 'Kapcsold be az S1-et. A valódi áramkörön tedd az ujjad a C3 és az E3 pontra; itt a gombot tartsd nyomva.',
      n: 'Nézd a mérőn a bázisáramot érintéskor: néhány µA.',
    },
    why: {
      k: 'A kezed egy nagyon picit vezeti az áramot. Ez olyan kevés, hogy egy lámpa nem gyulladna ki tőle. De a két tranzisztor felnagyítja, mint egy nagyító, és a lámpa kigyullad.',
      m: 'Az első tranzisztor a te picike áramodat kb. százszorosára erősíti. Ezt a második még százszorosára. Így tízezerszeres erősítés jön ki, és ez már elég a LED-nek. A telefonok érintőképernyője másképp működik, de ott is ilyen parányi változásokat erősítenek fel.',
      n: 'Bázisáram ≈ (3 V − 1,4 V) / (R2 + R_bőr) ≈ 1,6 V / 500 kΩ ≈ 3 µA. β₁·β₂ ≈ 20 000-rel ez kb. 60 mA lehetne, de a LED körét az R1 kb. 11 mA-re korlátozza. Egyetlen tranzisztorral csak kb. 0,5 mA lenne: a LED alig derengene.',
    },
  },
  {
    id: 'water', chapter: 'C', title: 'Vízjelző', tag: 'Szól, ha tele a pohár',
    layout: LAY.water, sim: { dt: 0.002, scale: 1, obj: { TP: 1e12 } }, controls: ['S1', { obj: 'TP', set: 'water' }],
    intro: {
      k: 'Ugyanaz az áramkör, mint az érintőkapcsoló. Most a két kábel vége egy pohárba kerül. Ha víz ér hozzá, kigyullad a lámpa.',
      m: 'Az érintőkapcsolóból vízjelzőt csinálunk: a két érintési pontról átkötő kábel megy egy pohárba. Ha a víz eléri a kábelvégeket, a kör bezárul.',
      n: 'Az érintőkapcsoló bemenetét két átkötő kábellel egy edénybe vezetjük; a víz ellenállása (néhány tíz kΩ) zárja a bázisáram útját.',
    },
    guess: {
      q: { k: 'Ha a kábelek vége vízbe ér, mi lesz?', m: 'Mi történik, ha a két kábelvég vízbe ér?', n: 'Elég-e a csapvíz vezetése a bekapcsoláshoz?' },
      opts: [['Kigyullad a LED', 'on'], ['Semmi', 'off']], right: 0,
      after: { k: 'Igen! A víz vezeti az áramot.', m: 'A csapvízben oldott sók vannak, ezért vezet egy kicsit. Ez a tranzisztoroknak elég.', n: 'A csapvíz néhány tíz kΩ-ja még jobb is, mint a bőr néhány száz kΩ-ja.' },
    },
    variants: [],
    hint: {
      k: 'Kapcsold be, aztán válaszd lent: „víz a pohárban”!',
      m: 'Kapcsold be az S1-et, és próbáld ki száraz pohárral, csapvízzel és sós vízzel.',
      n: 'Hasonlítsd össze a bázisáramot csapvíznél és sós víznél.',
    },
    why: {
      k: 'A víz egy kicsit vezeti az áramot. Ha a két kábelvég a vízbe ér, a víz összeköti őket, és a lámpa kigyullad. Így jelezheti egy gép, hogy tele van a kád.',
      m: 'A tiszta víz alig vezet, de a csapvízben oldott ásványi sók vannak, ezek viszik az áramot. A sós víz még jobban vezet. A mosógépek és a pincék vízjelzői is ezen az elven működnek.',
      n: 'A víz vezetését az oldott ionok adják. Csapvíznél az ellenállás a kábelvégek között jellemzően 10–100 kΩ, sós víznél ennek töredéke. A Darlington-kapcsolásnak már 1 MΩ is elég, ezért a jelző nagyon érzékeny. Egyenárammal a kábelvégek idővel korrodálnak (elektrolízis), ezért a profi érzékelők váltakozó árammal mérnek.',
    },
  },

];


const CHAPTERS = [
  { id: 'A', title: 'Áram és alkatrészek', short: 'Alapok' },
  { id: 'B', title: 'Energia és mozgás', short: 'Energia' },
  { id: 'C', title: 'Érzékelők', short: 'Érzékelők' },
  { id: 'D', title: 'Idő, memória, döntés', short: 'Idő és döntés' },
  { id: 'E', title: 'Rezgések és hangok', short: 'Rezgések' },
  { id: 'F', title: 'Fény és hang továbbítása', short: 'Továbbítás' },
  { id: 'G', title: 'A fekete dobozok kinyitása', short: 'Fekete dobozok' },
];
const ORDER = ['first', 'conduct', 'series', 'dimmer', 'generator', 'capbat', 'motorspeed', 'night', 'touch', 'water', 'delay', 'flash', 'sound'];
EXPS.sort((x, y) => ORDER.indexOf(x.id) - ORDER.indexOf(y.id));

// Egy változat alkalmazása: vagy átalakítja az elrendezést, vagy egy másik elrendezésre cseréli.
function applyVariant(v, lay) { return v.layout ? LAY[v.layout] : v.apply(lay); }

return { EXPS, CHAPTERS: CHAPTERS.filter((c) => EXPS.some((e) => e.chapter === c.id)), applyVariant };
}
if (typeof module !== 'undefined' && module.exports) module.exports = define; else root.BOFFIN_EXPERIMENTS = define;
})(typeof window !== 'undefined' ? window : globalThis);
