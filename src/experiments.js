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

const SOUND_LAYOUT = LAY.sound;

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
    id: 'delay', chapter: 'D', hint: { k: 'Kapcsold be az S1-et, nyomd meg az S2 gombot, aztán engedd el!', m: 'Kapcsold be az S1-et, nyomd meg és engedd el az S2-t. Figyeld a kondenzátor sárga csíkját: ennyi töltés van benne. Aztán próbáld ki: engedd el a gombot, és rögtön kapcsold ki az S1-et! A lámpa azonnal elalszik, pedig a kondenzátorban még van töltés.', n: 'S1 be, S2 rövid nyomás. Figyeld a C5 feszültségét és a bázisáramot a mérőn. Utána: S2 elengedése után azonnal S1 ki. A C5 ugyanúgy kisül (a C5 → R3 → bázis → emitter → C5 körben), de a LED nem kap áramot.' },
    title: 'Késleltetett lámpa', tag: 'Elengeded, de még ég egy kicsit',
    layout: LAY.delay, sim: { dt: 0.002, scale: 1 }, controls: ['S1', 'S2'],
    intro: {
      k: 'Nyomd meg a gombot, aztán engedd el. A lámpa még egy kicsit világít, és lassan elalszik.',
      m: 'Olyan, mint a lépcsőházi lámpa: egy gombnyomás, és egy ideig ég. A nagy kondenzátor (C5) nem a lámpát táplálja, hanem egy ideig bekapcsolva tartja a tranzisztort. A lámpa áramát mindig az elem adja.',
      n: 'Időzítő: a nyomógomb a C5-öt feltölti, elengedés után a kondenzátor az R3-on át a Q2 bázisába sül ki. Amíg elég a bázisáram, a tranzisztor vezet, és az elem áramot ad a LED-nek.',
    },
    guess: {
      q: { k: 'Megnyomod és elengeded a gombot. Mit csinál a lámpa?', m: 'Megnyomod, majd elengeded a nyomógombot (S2). Mi lesz a LED-del?', n: 'Mi történik a LED-del az S2 elengedése után?' },
      opts: [['Azonnal elalszik', 'off'], ['Még ég egy darabig, aztán elalszik', 'fade'], ['Örökké ég', 'on']], right: 1,
      after: { k: 'Így van! A kondenzátor még egy ideig bekapcsolva tartja a tranzisztort, ezért ég még a lámpa.', m: 'A kondenzátor feltöltődött, és elengedés után lassan kiürül a tranzisztor bázisán át. Amíg van benne elég töltés, a tranzisztor bekapcsolva marad, és az elem áramot ad a LED-nek.', n: 'A kisülés közel exponenciális, az időállandó τ = R·C. Lent kicserélheted a kondenzátort vagy az ellenállást.' },
    },
    variants: [
      { id: 'c4', label: 'C5 helyett C4 (100 µF)', real: 'Cseréld a 470 µF-os kondenzátort (C5) a 100 µF-osra (C4). A + jel ugyanoda kerüljön.', apply: swapPart('C5', 'C4'), needs: ['C4'] },
      { id: 'r5', label: 'R3 helyett R5 (100 kΩ)', real: 'Cseréld az 5,1 kΩ-os R3-at a 100 kΩ-os R5-re. Hosszabb lesz vagy rövidebb? És milyen fényes?', apply: swapPart('R3', 'R5'), needs: ['R5'] },
    ],
    why: {
      k: 'A lámpa mindig az elemből kapja az áramot. A tranzisztor olyan, mint egy csap: amíg nyitva van, folyik az áram a lámpába. A gomb megtölti a kondenzátort, ez a kis vödör. A vödörből egy kevés csöpög a csap karjára, és nyitva tartja. Ha kiürül, a csap elzáródik, és a lámpa elalszik.',
      m: 'A gomb megnyomásakor a kondenzátor feltöltődik. Elengedés után az ellenálláson keresztül lassan kiürül, és közben nyitva tartja a tranzisztort. A LED áramát közben végig az elem adja, ezért kell, hogy az S1 be legyen kapcsolva. A kondenzátorból csak egy kicsi áram jön, a tranzisztor ennek sokszorosát engedi át az elemből a LED-be. Kisebb kondenzátor hamarabb kiürül. Nagyobb ellenálláson lassabban folyik ki, de kevesebb áram jut a tranzisztorra, ezért halványabb. A végén a lámpa még sokáig halványan pislákol: a kondenzátor kb. 0,6 V-nál már alig ad áramot, ezért nagyon lassan ürül ki teljesen. Sötét szobában a valódi készleten is látszik.',
      n: 'A LED-áram végig az elemből folyik a kollektoron át. A C5-ből csak a bázisáram jön, ezt a tranzisztor kb. β-szorosra erősíti. τ = R·C = 5,1 kΩ · 470 µF ≈ 2,4 s. A LED addig ég teljes fénnyel, amíg a bázisáram elég a telítéshez, utána fokozatosan halványul; a szimulációban kb. 5 s teljes fény, utána lassú halványulás. 100 µF-tal τ ≈ 0,5 s. 100 kΩ-mal τ ≈ 47 s, de a bázisáram csak kb. 23 µA, így a LED-áram a tranzisztor erősítésén múlik. A valódi tranzisztoroknál ez darabonként eltér. A C5 kb. 0,6 V alatt már alig ad bázisáramot (a bázis–emitter dióda exponenciális), ezért a kisülés a végén nagyon lelassul: 10 s után a bázisáram kb. 10 µA (LED 1,6 mA), 20 s után kb. 2 µA (LED 0,26 mA), a LED tehát fokozatosan, hosszan halványul el.',
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
    layout: LAY.capbat, sim: { dt: 0.002, scale: 1, meter: { M6: '5V' } }, controls: ['S2', { meter: 'M6', ranges: ['5V'] }],
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
      n: 'Töltsd fel, engedd el, és figyeld a feszültség csökkenését. Melyik feszültségnél alszik ki a LED? Vigyázat: a mérő itt csak 5 V-os állásban lehet. Áramállásban (0,5 mA vagy 50 mA) szinte nincs ellenállása, és a gomb megnyomásakor rövidre zárná az elemet.',
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
      n: 'Érintőkapcsoló Darlington-kapcsolással: az ujj (kb. 100 kΩ–1 MΩ) és az R5 (100 kΩ) adja a bázisáramot. Az R5 védelem is: ha a két pontot fém köti össze, ez korlátozza a tranzisztorok áramát.',
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
      n: 'Bázisáram ≈ (3 V − 1,4 V) / (R5 + R_bőr) ≈ 1,6 V / 600 kΩ ≈ 3 µA. β₁·β₂ ≈ 20 000-rel ez kb. 60 mA lehetne, de a LED körét az R1 kb. 11 mA-re korlátozza. Egyetlen tranzisztorral csak kb. 0,5 mA lenne: a LED alig derengene.',
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

  // ===================== D) Idő, memória, döntés =====================
  {
    id: 'flipflop', chapter: 'D', title: 'Emlékező lámpa', tag: 'Megjegyzi, melyik gombot nyomtad',
    layout: LAY.flipflop, sim: { dt: 0.002, scale: 1 }, controls: ['S1', { press: 'S2a', label: 'S2a gomb' }, { press: 'S2b', label: 'S2b gomb' }],
    intro: {
      k: 'Két lámpa és két gomb. Megnyomod az egyiket, és az áramkör megjegyzi, akkor is, ha elengedted!',
      m: 'Két tranzisztor egymást tartja be- és kikapcsolva. A gombokkal átbillented őket, és ott is maradnak: az áramkör emlékszik.',
      n: 'Bistabil multivibrátor (RS flip-flop): két keresztbe csatolt NPN tranzisztor. A gombok a bázisokat földelik (beállítás és törlés).',
    },
    guess: {
      q: { k: 'Megnyomod és elengeded a gombot. A lámpa marad, vagy visszaugrik?', m: 'Megnyomod, majd elengeded az S2b-t. Mi lesz a LED-ekkel elengedés után?', n: 'Mi tartja meg az állapotot a gomb elengedése után?' },
      opts: [['Úgy marad', 'on'], ['Visszaugrik', 'off']], right: 0,
      after: { k: 'Igen! Megjegyzi. Ez egy pici memória.', m: 'Úgy marad: a két tranzisztor egymást tartja abban az állapotban. Ez egy 1 bites memória.', n: 'A visszacsatolás: a bekapcsolt tranzisztor alacsonyan tartja a másik bázisát, a kikapcsolt a magas kollektorfeszültségével nyitva tartja a párját.' },
    },
    variants: [],
    hint: {
      k: 'Kapcsold be, aztán nyomd meg az egyik gombot, majd a másikat!',
      m: 'Kapcsold be az S1-et. Nyomd meg felváltva az S2a-t és az S2b-t, és figyeld, melyik LED ég elengedés után.',
      n: 'Figyeld a két bázisáramot: mindig csak az egyik tranzisztor vezet. A halványan derengő LED áramát a másik tranzisztor bázisárama adja.',
    },
    why: {
      k: 'A két tranzisztor olyan, mint két gyerek egy libikókán: ha az egyik lent van, a másik fent marad. A gomb átbillenti őket, és úgy is maradnak.',
      m: 'Amelyik tranzisztor be van kapcsolva, az lehúzza a másik bázisát, így az kikapcsolva marad. A kikapcsolt tranzisztor pedig áramot ad a párjának, hogy az bekapcsolva maradjon. Ezért marad meg az állapot. A számítógép memóriájában milliárdnyi ilyen kis „libikóka” van.',
      n: 'A kikapcsolt oldal LED-jén csak a másik tranzisztor bázisárama folyik (kb. 0,1 mA), ezért dereng halványan. Ez egy statikus memóriacella (SRAM) alapja: két keresztbe kötött fordító. A számítógépek gyorsítótára így tárol biteket.',
    },
  },
  {
    id: 'and', chapter: 'D', title: 'Kódzár (ÉS-kapu)', tag: 'Csak két gombbal együtt nyílik',
    layout: LAY.and, sim: { dt: 0.002, scale: 1 }, controls: ['S1', { press: 'S2a', label: 'S2a gomb' }, { press: 'S2b', label: 'S2b gomb' }],
    intro: {
      k: 'Ez egy titkos zár. A lámpa csak akkor gyullad ki, ha mindkét gombot egyszerre nyomod.',
      m: 'Két tranzisztor egymás alatt van, mint két ajtó egymás után. Az áram csak akkor jut át, ha mindkét ajtó nyitva van.',
      n: 'ÉS-kapu két sorba kötött NPN tranzisztorral: a kimenet (LED) csak akkor aktív, ha mindkét bemenet (gomb) aktív.',
    },
    guess: {
      q: { k: 'Ha csak az egyik gombot nyomod, kigyullad a lámpa?', m: 'Kigyullad a LED, ha csak az S2a-t nyomod?', n: 'Mi az ÉS-kapu kimenete, ha csak az egyik bemenet aktív?' },
      opts: [['Nem, mindkettő kell', 'off'], ['Igen', 'on']], right: 0,
      after: { k: 'Igen! Mindkét gomb kell, ez a titkos kód.', m: 'Mindkét tranzisztornak vezetnie kell, különben az áram útja megszakad.', n: '0 ÉS 1 = 0: a soros kapcsolásban bármelyik lezárt tranzisztor megszakítja az áramot.' },
    },
    variants: [],
    hint: {
      k: 'Kapcsold be. Nyomd az egyik gombot, aztán a másikat, aztán mindkettőt egyszerre!',
      m: 'Próbáld ki mind a négy esetet: egyik sem, csak az egyik, csak a másik, mindkettő.',
      n: 'Írd fel az igazságtáblát a négy esetre.',
    },
    why: {
      k: 'Az áramnak két kapun kell átmennie egymás után. Mindkét kaput a saját gombja nyitja. Ha az egyik zárva van, az áram nem jut át.',
      m: 'Ez az ÉS-kapu: „ez ÉS az is kell”. A számítógép ilyen kapukból dönt. Egy liftajtó is csak akkor indul, ha be van csukva ÉS megnyomták a gombot.',
      n: 'Igazságtábla: 00→0, 01→0, 10→0, 11→1. A valódi logikai áramkörökben ugyanígy tranzisztorok sorba kötésével építik (CMOS NAND-kapu). Ezekből a kapukból bármilyen számolás összerakható.',
    },
  },
  {
    id: 'or', chapter: 'D', title: 'Bármelyik gomb (VAGY-kapu)', tag: 'Egyik vagy másik, mindegy',
    layout: LAY.or, sim: { dt: 0.002, scale: 1 }, controls: [{ press: 'S2a', label: 'S2a gomb' }, { press: 'S2b', label: 'S2b gomb' }],
    intro: {
      k: 'Két csengőgomb, mint egy ház két ajtaján. Bármelyiket nyomod, a lámpa kigyullad.',
      m: 'A két nyomógomb egymás mellett van. Az áram bármelyiken át tud menni.',
      n: 'VAGY-kapu: két párhuzamos kapcsoló. A kimenet akkor aktív, ha legalább az egyik bemenet aktív.',
    },
    guess: {
      q: { k: 'Ha csak az egyik gombot nyomod, kigyullad a lámpa?', m: 'Kigyullad a LED, ha csak az egyik gombot nyomod?', n: 'Mi a VAGY-kapu kimenete, ha csak az egyik bemenet aktív?' },
      opts: [['Igen, bármelyik elég', 'on'], ['Nem, mindkettő kell', 'off']], right: 0,
      after: { k: 'Igen! Bármelyik gomb elég.', m: 'A két gomb két külön utat ad az áramnak. Elég, ha az egyik nyitva van.', n: '0 VAGY 1 = 1: a párhuzamos ágak közül egy is elég a kör zárásához.' },
    },
    variants: [],
    hint: {
      k: 'Nyomd az egyik gombot, aztán a másikat!',
      m: 'Próbáld ki mind a négy esetet, és hasonlítsd össze a kódzárral.',
      n: 'Írd fel az igazságtáblát, és vesd össze az ÉS-kapuéval.',
    },
    why: {
      k: 'Az áram két úton is mehet. Ha bármelyik gombot megnyomod, kinyílik egy út, és a lámpa kigyullad.',
      m: 'Ez a VAGY-kapu: „ez VAGY az elég”. Egy autóban a belső világítás akkor gyullad fel, ha bármelyik ajtót kinyitod.',
      n: 'Igazságtábla: 00→0, 01→1, 10→1, 11→1. Itt kapcsolókkal építettük; tranzisztorral két párhuzamos tranzisztor adja ugyanezt. Az ÉS, a VAGY és a NEM együtt bármilyen logikai függvényt meg tud valósítani.',
    },
  },
  {
    id: 'not', chapter: 'D', title: 'Fordító (NEM-kapu)', tag: 'Megnyomod, és kialszik',
    layout: LAY.not, sim: { dt: 0.002, scale: 1 }, controls: ['S1', { press: 'S2', label: 'S2 gomb' }],
    intro: {
      k: 'Fordított lámpa: magától ég, és ha megnyomod a gombot, kialszik.',
      m: 'A tranzisztor a LED mellett van. Ha a gombbal bekapcsolod, az áram a tranzisztoron megy át a LED helyett, és a LED kialszik.',
      n: 'NEM-kapu (inverter): a tranzisztor a LED-del párhuzamosan van kötve, és bekapcsolva rövidre zárja. Gomb lenyomva → LED ki; gomb felengedve → LED be.',
    },
    guess: {
      q: { k: 'Ha megnyomod a gombot, mi lesz a lámpával?', m: 'Mi történik a LED-del, ha megnyomod az S2-t?', n: 'Mi a NEM-kapu kimenete aktív bemenetnél?' },
      opts: [['Kialszik', 'off'], ['Kigyullad', 'on']], right: 0,
      after: { k: 'Igen! Ez a fordított lámpa.', m: 'A bekapcsolt tranzisztor „rövidzár” a LED mellett: az áram azon megy, nem a LED-en.', n: 'NEM 1 = 0: a telített tranzisztoron kb. 0,1 V esik, ez kevés a LED nyitásához.' },
    },
    variants: [],
    hint: {
      k: 'Kapcsold be, aztán nyomd meg a gombot!',
      m: 'Kapcsold be az S1-et, és nyomogasd az S2-t. Figyeld, merre mennek a sárga pöttyök gombnyomásra.',
      n: 'Nézd a kollektoráramot gombnyomásra: kb. 29 mA, mert most csak az R1 korlátozza.',
    },
    why: {
      k: 'A tranzisztor egy rövidebb út az áramnak. Ha kinyitod a gombbal, az áram inkább arra megy, és a lámpának nem jut.',
      m: 'Ez a NEM-kapu: mindig az ellenkezőjét csinálja annak, amit a bemenet mond. A számítógépben ez a legegyszerűbb építőkocka. Két ilyen fordító egymásba kötve az emlékező lámpát adja.',
      n: 'Bemenet 0 → kimenet 1, bemenet 1 → kimenet 0. Az emlékező lámpa (flip-flop) két keresztbe kötött NEM-kapu. Ha két gombot párhuzamosan kötünk a bázisra, NEM-VAGY (NOR) kapu lesz belőle; a NOR egymagában is univerzális: bármelyik logikai áramkör felépíthető belőle.',
    },
  },

  // ===================== E) Rezgések és hangok (új) =====================
  {
    id: 'metronome', chapter: 'E', title: 'Metronóm', tag: 'Kattog, mint egy óra',
    layout: LAY.metronome, sim: { dt: 0.0005, scale: 1 }, controls: ['S1', 'sound'], audio: { type: 'clicks', probe: 'SP' },
    intro: {
      k: 'Ugyanaz a villogó, de az egyik lámpa helyén hangszóró van. Minden villanásnál kattan egyet.',
      m: 'A villogó egyik LED-jét hangszóróra cseréljük. Ahányszor a tranzisztor ki- vagy bekapcsol, a hangszóró kattan.',
      n: 'Astabil multivibrátor hangszóróval: a kollektoráram ugrásai kattanásként hallatszanak. A ritmus kb. 0,6 s-onként ismétlődik (tik–tak: kb. 0,4 s és 0,2 s).',
    },
    guess: {
      q: { k: 'Mit fogsz hallani?', m: 'Mit ad ki a hangszóró, ha a villogóba kötöd?', n: 'Mit hallasz, ha a hangszóró egy lassú, kb. 1,7 Hz-es négyszögjelet kap?' },
      opts: [['Kattogást', 'sound'], ['Folyamatos sípolást', 'same'], ['Semmit', 'off']], right: 0,
      after: { k: 'Igen! Tik-tak, tik-tak.', m: 'Kattogást: a hangszóró membránja minden kapcsolásnál egyet ugrik.', n: 'Kattanásokat: a hangszóró csak az áram változására reagál, az állandó áramra nem.' },
    },
    variants: [
      { id: 'c5', label: 'Az egyik C4 helyett C5 (470 µF)', real: 'Cseréld a középső 100 µF-os kondenzátort (a D5–D7 közöttit) a 470 µF-os C5-re. A + jel a D5 felé nézzen.', apply: (lay) => lay.map((p) => (p.id === 'C4a' ? { ...p, p: 'C5' } : p)), needs: ['C5'] },
    ],
    hint: {
      k: 'Kapcsold be, és nyomd meg a Hang gombot!',
      m: 'Kapcsold be az S1-et és a hangot. Figyeld: a kattanás akkor jön, amikor a LED ki- vagy bekapcsol.',
      n: 'Figyeld meg, hogy a kattanás a hangszóró áramának ugrásakor szól. A C5-ös változattal lassíthatod.',
    },
    why: {
      k: 'A hangszóró csak akkor szól, ha változik rajta az áram. A villogó mindig kapcsolgat, ezért a hangszóró minden kapcsolásnál kattan egyet.',
      m: 'A hangszóróban egy mágnes és egy tekercs mozgatja a membránt. Ha az áram hirtelen bekapcsol vagy kikapcsol, a membrán egyet ugrik: ez a kattanás. A zenészek metronómja is ilyen egyenletes kattogással segít tartani a ritmust.',
      n: 'Minden átbillenésnél egy kattanás: periódusonként kettő. A szimulációban a hangszórós oldal kb. 0,4 s-ig vezet, a LED-es kb. 0,2 s-ig: a hangszórón kisebb a feszültségesés, mint a LED-en, ezért nagyobb a kollektor feszültséglépése, és lassabban billen vissza. C5-tel az egyik szakasz kb. 1 s-ra nyúlik. Ha mindkét oldalon nagyobb lenne a kondenzátor, egyenletesen lassulna.',
    },
  },
  {
    id: 'organ', chapter: 'E', title: 'Elektronikus hangszer', tag: 'Gombbal szól, tekerővel hangolod',
    layout: LAY.organ, sim: { dt: 0.000005, scale: 1 / 1000, pot: { RV: 0.3 } }, slow: 1000,
    controls: ['S1', { press: 'S2', label: 'Billentyű (S2)' }, { pot: 'RV', label: 'Hangmagasság (RV)', invert: true }, 'sound'],
    audio: { type: 'table', probe: 'SP', param: 'pot', id: 'RV', press: ['S2'], grid: [0, 0.04, 0.1, 0.2, 0.35, 0.55, 0.8, 1] },
    intro: {
      k: 'Ez egy hangszer! Nyomd a gombot, és szól. A tekerővel magasabb vagy mélyebb lesz.',
      m: 'A hangos villogó egyik ellenállása helyén egy billentyű (S2) és egy állítható ellenállás (RV) van. A billentyű indítja a rezgést, az RV a sebességét, vagyis a hangmagasságot állítja.',
      n: 'Astabil multivibrátor, amelynek egyik bázisellenállása R2 + RV (1–51 kΩ), és egy nyomógombon át kap tápot. Gomb nélkül az egyik tranzisztor nem kap bázisáramot, a rezgés leáll.',
    },
    guess: {
      q: { k: 'Ha tekered a tekerőt, mi lesz a hanggal?', m: 'Mi történik a hanggal, ha nagyobbra állítod az RV ellenállását?', n: 'Hogyan függ a frekvencia az RV ellenállásától?' },
      opts: [['Mélyebb lesz', 'slow'], ['Magasabb lesz', 'sound'], ['Nem változik', 'same']], right: 0,
      after: { k: 'Igen! Nagyobb fékezés, lassabb rezgés, mélyebb hang.', m: 'Nagyobb ellenálláson lassabban töltődik a kondenzátor, lassabb a rezgés: mélyebb a hang.', n: 'A félperiódus ≈ 0,69 · R · C, tehát nagyobb R → hosszabb periódus → kisebb frekvencia.' },
    },
    variants: [],
    hint: {
      k: 'Kapcsold be a hangot, aztán nyomd a billentyűt, és közben tekerd a hangmagasságot!',
      m: 'Kapcsold be az S1-et és a hangot. Tartsd nyomva a billentyűt, és tekerd az RV-t. Tudsz dallamot játszani?',
      n: 'Keresd meg a legmélyebb és a legmagasabb hangot. A kijelzés 1000× lassított.',
    },
    why: {
      k: 'A hang nagyon gyors rezgés. A tekerő azt állítja, milyen gyorsan rezeg: gyors rezgés magas hang, lassú rezgés mély hang.',
      m: 'A hangmagasságot az adja meg, hányszor rezeg másodpercenként a hangszóró. A tekerő a kondenzátor töltődését lassítja vagy gyorsítja. A billentyű nélkül az egyik tranzisztor nem kap áramot, ezért csend van, mint egy zongorán, ha nem ütsz le billentyűt.',
      n: 'A szimuláció szerint kb. 240 Hz és 3,2 kHz között hangolható. A frekvencia nem arányos a gomb állásával, mert a másik oldal félperiódusa állandó (0,69 · 5,1 kΩ · 0,1 µF ≈ 0,35 ms). Az első elektronikus hangszerek (pl. a theremin) is ilyen oszcillátorokkal működtek.',
    },
  },
  {
    id: 'siren', chapter: 'E', title: 'Sziréna', tag: 'Felfelé és lefelé csúszó hang',
    layout: LAY.siren, sim: { dt: 0.000005, scale: 1 / 1000 }, slow: 1000, controls: ['S1', { press: 'S2', label: 'Sziréna gomb (S2)' }, 'sound'],
    audio: { type: 'siren', probe: 'SP', cap: 'C5', R: 10000, Rb: 5100, C: 470e-6, grid: [0.7, 0.75, 0.85, 1, 1.25, 1.6, 2, 2.5, 3] },
    intro: {
      k: 'Tartsd nyomva a gombot: a hang egyre magasabb. Engedd el: lassan lecsúszik és elhallgat. Mint egy mentőautó!',
      m: 'A hangos villogó egyik oldala nem közvetlenül az elemről kap áramot, hanem egy nagy kondenzátorról (C5). A gomb lassan feltölti, elengedve lassan kiürül, és közben változik a hang.',
      n: 'Az astabil multivibrátor egyik bázisellenállását egy RC-tag (R4 = 10 kΩ, C5 = 470 µF) feszültsége táplálja: a vezérlőfeszültség változásával változik a frekvencia (feszültségvezérelt oszcillátor).',
    },
    guess: {
      q: { k: 'Ha nyomva tartod a gombot, mi lesz a hanggal?', m: 'Mi történik a hanggal, amíg nyomva tartod az S2-t?', n: 'Hogyan változik a frekvencia a C5 töltődése közben?' },
      opts: [['Egyre magasabb', 'sound'], ['Egyre mélyebb', 'slow'], ['Ugyanolyan marad', 'same']], right: 0,
      after: { k: 'Igen! Felfelé csúszik, mint a sziréna.', m: 'Ahogy a kondenzátor töltődik, a tranzisztor egyre gyorsabban kap áramot, és egyre gyorsabban rezeg.', n: 'Nagyobb vezérlőfeszültségnél gyorsabban töltődik a bázisoldali kondenzátor, rövidebb a félperiódus, nő a frekvencia.' },
    },
    variants: [],
    hint: {
      k: 'Kapcsold be a hangot, aztán tartsd nyomva a gombot pár másodpercig, majd engedd el!',
      m: 'Kapcsold be az S1-et és a hangot. Tartsd nyomva az S2-t, figyeld a C5 sárga csíkját, aztán engedd el.',
      n: 'Figyeld a C5 feszültségét a mérőn: kb. 0,7 V alatt elhallgat. A kijelzés 1000× lassított.',
    },
    why: {
      k: 'A nagy kondenzátor egy lassan teli- és kiürülő vödör. Minél telibb, annál gyorsabban rezeg a villogó, és annál magasabb a hang.',
      m: 'A villogó sebessége attól függ, milyen erősen kap áramot az egyik tranzisztor. Ezt az áramot most egy lassan töltődő kondenzátor adja. Töltődéskor nő a hang, kisüléskor csökken. A dobozban lévő riasztó IC (U2) is ilyen, egymást vezérlő rezgőkörökkel szól.',
      n: 'A szimuláció szerint kb. 0,8 V-on 630 Hz, 3 V-on kb. 1450 Hz, 0,7 V alatt a rezgés leáll. Töltéskor τ ≈ R4 · C5 ≈ 4,7 s (a bázisáram miatt valamivel gyorsabban áll be). Ez egy feszültségvezérelt oszcillátor (VCO), a szintetizátorok és a rádiók egyik alapeleme. A hang a szimulációból kiszámolt frekvencia–feszültség táblázatból és a C5 egyszerűsített töltődési modelljéből készül.',
    },
  },

  // ===================== C) Érzékelők (új) =====================
  {
    id: 'shadow', chapter: 'C', title: 'Árnyékriasztó', tag: 'Megszólal, ha valaki eltakarja a fényt',
    layout: LAY.shadow, sim: { dt: 0.000005, scale: 1 / 1000 }, slow: 1000, light: 0.7, controls: ['S1', 'light', 'sound'],
    audio: { type: 'table', probe: 'SP', param: 'light', press: [], grid: [0, 0.03, 0.06, 0.1, 0.15, 0.2, 0.3, 0.45, 0.7, 1] },
    intro: {
      k: 'Ez egy riasztó. Amíg fény éri a kis fekete szemet, csendben van. Ha valaki eltakarja, megszólal!',
      m: 'A sziréna kondenzátora helyén most fototranzisztor (Q4) van. Fényben elvezeti a rezgőkör áramát, ezért csend van. Árnyékban nem vezet, és a rezgőkör megszólal.',
      n: 'A hangos multivibrátor egyik bázisellenállása az R4 (10 kΩ) és a Q4 alkotta, fényfüggő feszültségosztóról kap tápot. Fényben a Q4 a vezérlőfeszültséget 0,7 V alá húzza, a rezgés leáll.',
    },
    guess: {
      q: { k: 'Ha letakarod a kis fekete szemet, mi lesz?', m: 'Mi történik, ha árnyék vetül a fototranzisztorra?', n: 'Mi történik a vezérlőfeszültséggel és a hanggal, ha a Q4-et elsötétíted?' },
      opts: [['Megszólal a riasztó', 'sound'], ['Semmi', 'same'], ['Kialszik a LED', 'off']], right: 0,
      after: { k: 'Igen! Sötétben megszólal.', m: 'Árnyékban a Q4 nem vezet, így a rezgőkör áramot kap, és szólni kezd.', n: 'A vezérlőfeszültség megemelkedik, és a rezgőkör teljes sötétben kb. 700 Hz-en szól.' },
    },
    variants: [],
    hint: {
      k: 'Kapcsold be a hangot, aztán húzd a fényt a hold felé!',
      m: 'Kapcsold be az S1-et és a hangot, aztán halványítsd a fényt. Félhomályban mélyebb a hang!',
      n: 'Keresd meg, milyen fénynél szólal meg, és hogyan változik a hangmagasság a fénnyel.',
    },
    why: {
      k: 'A kis fekete szem fényben elveszi az áramot a riasztótól. Ha árnyék jön, már nem veszi el, és a riasztó megszólal.',
      m: 'Ez a sziréna és az éjjeli lámpa keveréke. A fototranzisztor fényben „lecsapolja” a rezgőkör áramát. Árnyékban ez megszűnik, és a rezgőkör szól. Ilyen elven működnek a boltok ajtajában a csengők, amik megszólalnak, ha belépsz a fénysugárba.',
      n: 'A szimulációban erős fénynél a rezgés leáll, teljes sötétben kb. 700 Hz, félhomályban kb. 340 Hz: a Q4 árama folyamatosan hangolja a feszültségvezérelt oszcillátort. Ez ugyanaz a kapcsolás, mint a sziréna, csak a C5 helyett fény állítja a vezérlőfeszültséget. A hang a szimulációból kiszámolt frekvencia–fényerő táblázatból készül.',
    },
  },

  // ===================== F) Fény és hang továbbítása =====================
  {
    id: 'clap', chapter: 'F', title: 'Hangra villogó LED', tag: 'Tapsra, fújásra felvillan',
    layout: LAY.clap, sim: { dt: 0.002, scale: 1 }, controls: ['S1', { mic: 'X1' }],
    intro: {
      k: 'Fújj bele a mikrofonba, vagy tapsolj mellette, és a lámpa felvillan!',
      m: 'Az éjjeli lámpa fototranzisztora helyén most mikrofon (X1) van. A hang megnyomja a mikrofont, megváltozik az ellenállása, és ettől a tranzisztor bekapcsol.',
      n: 'A szénmikrofon (X1) ellenállása csendben kb. 1 kΩ, erős hangnyomásra kb. 10 kΩ. Az R4-gyel (10 kΩ) feszültségosztót alkot a Q2 bázisán; erős hangnál a bázisfeszültség 0,6 V fölé emelkedik.',
    },
    guess: {
      q: { k: 'Ha belefújsz a mikrofonba, mi lesz a lámpával?', m: 'Mi történik a LED-del, ha belefújsz az X1-be?', n: 'Mi történik a bázisfeszültséggel, ha a mikrofon ellenállása megnő?' },
      opts: [['Kigyullad', 'on'], ['Semmi', 'off']], right: 0,
      after: { k: 'Igen! A fújástól felvillan.', m: 'A fújás megnyomja a mikrofon belsejét, nő az ellenállása, és ettől a tranzisztor bekapcsolja a LED-et.', n: 'Nagyobb alsó ellenállás → nagyobb bázisfeszültség → a tranzisztor nyit.' },
    },
    variants: [],
    hint: {
      k: 'Kapcsold be, aztán nyomd a „Fújj bele” gombot! Vagy kapcsold be a tablet mikrofonját, és tapsolj!',
      m: 'Kapcsold be az S1-et. Próbáld a „Fújj bele” gombbal, vagy kapcsold be a tablet mikrofonját, és beszélj, tapsolj.',
      n: 'Figyeld a bázisáramot hangosabb és halkabb hangnál. Hol a bekapcsolási küszöb?',
    },
    why: {
      k: 'A mikrofonban apró szemcsék vannak. Ha hang éri, összenyomódnak, és ettől másképp vezeti az áramot. A tranzisztor ezt észreveszi, és felkapcsolja a lámpát.',
      m: 'A hang a levegő rezgése. A mikrofonba érve megmozdítja a belsejét, és ettől megváltozik az ellenállása. Ez a kicsi változás a tranzisztor bázisán elég ahhoz, hogy a LED kigyulladjon. Így működnek a tapsra kapcsoló lámpák. (A tablet mikrofonja itt csak azt méri, milyen hangos a hang, és ezzel „nyomja” a virtuális mikrofont.)',
      n: 'Feszültségosztó: U_B = 3 V · R_X1 / (R_X1 + 10 kΩ). 1 kΩ-nál kb. 0,27 V (zárva), 10 kΩ-nál 1,5 V (a tranzisztor bekapcsol, a LED-áramot az R1 korlátozza). A küszöb a szimulációban kb. 3 kΩ-nál van. A valódi szénmikrofon változása beszédnél kisebb, ezért erős hang (fújás, taps közelről) kell.',
    },
  },

  {
    id: 'lightlink', chapter: 'F', title: 'Fénytávíró', tag: 'A hang fénnyel utazik egy üvegszálon',
    layout: LAY.lightlink, sim: { dt: 0.000005, scale: 1 / 1000 }, slow: 1000,
    controls: ['S1', { toggle: 'S1b', label: 'S1 (vevő)' }, { fiber: true }, 'sound'],
    intro: {
      k: 'Két rács, két áramkör, és nincs köztük vezeték! Az egyik nagyon gyorsan villog, a fény egy üvegszálon átmegy a másikhoz, és az megszólal.',
      m: 'Az 1. rácson egy nagyon gyors villogó van, olyan gyors, hogy a szemed nem látja. A D1 LED fényét egy üvegszálas kábel viszi át a 2. rács fototranzisztorára. A vevő a fény villogásából hangot csinál.',
      n: 'Optikai átvitel: az adó egy kb. 2,5 kHz-es astabil multivibrátor, a D1 LED fénye üvegszálon jut a vevő fototranzisztorára (Q4). A Q4 árama vezérli a Q2c tranzisztort, ami a hangszórót hajtja. A két áramkör elektromosan teljesen független.',
    },
    guess: {
      q: { k: 'Ha letakarod a kábelt, hogy ne menjen át a fény, mi lesz a hanggal?', m: 'Mi történik a hanggal, ha elzárod a fényt a kábelben?', n: 'Mit hallasz, ha megszakítod az optikai összeköttetést?' },
      opts: [['Elhallgat', 'off'], ['Ugyanúgy szól', 'sound']], right: 0,
      after: { k: 'Igen! A hangot a fény viszi, fény nélkül csend van.', m: 'A vevő csak a fényből tudja, mit kell szólnia. Fény nélkül nincs mit felerősítenie.', n: 'A két áramkört csak a fény köti össze; megszakítva a vevő kimenete nyugalomba áll.' },
    },
    variants: [],
    hint: {
      k: 'Kapcsold be mindkét kapcsolót és a hangot! Aztán kapcsold ki a „Fény a kábelben” gombot.',
      m: 'Kapcsold be mindkét S1-et és a hangot. A valódi áramkörön szakítsd meg a fényt, például húzd ki a kábelt a tartóból. A „Fény a kábelben” kapcsolóval itt is kipróbálhatod. Ki- és bekapcsolgatva morzejeleket küldhetsz!',
      n: 'Figyeld a fototranzisztor áramát a mérőn, és hasonlítsd össze az adó LED-jének áramával. A kijelzés 1000× lassított.',
    },
    why: {
      k: 'A LED olyan gyorsan villog, hogy nem látod. A kis fekete szem a kábel másik végén látja, és minden villanásnál meglöki a hangszórót. A sok gyors lökésből lesz a hang.',
      m: 'A hang rezgés. Az adó ezt a rezgést fényvillogássá alakítja. Az üvegszál a fényt a kanyarokban is továbbviszi. A vevő a villogást visszaalakítja árammá, és a hangszóró megszólal. Az internet is nagyrészt így utazik: üvegszálakban, fényvillanásokként. A Light dobozban lévő infravevő IC (U24) is fényjeleket fog, csak láthatatlan infravörös fénnyel.',
      n: 'A Q4 fotoárama a D1 fényével arányos, és a Q2c-t a LED villogásának ütemében kapcsolgatja. A szimulációban kb. 2,4 kHz-es hang szól a vevőben, és ha a fényt elzárjuk, a vevő árama gyakorlatilag nulla. Az R4 (10 kΩ) levezeti a szórt fény kis áramát, hogy a vevő nyugalomban zárva maradjon. A fénycsatolást a szimuláció egyszerűsítve modellezi (a LED-áram egy része jut el a fototranzisztorig).',
    },
  },

  // ===================== G) A fekete dobozok kinyitása =====================
  {
    id: 'u23', chapter: 'G', title: 'Kinyitjuk: U23 stroboszkóp', tag: 'Egy kész villogó egy dobozban',
    layout: LAY.ic_u23, sim: { dt: 0.001, scale: 1 }, controls: ['S1'],
    inside: {
      title: 'Mi van az U23-ban?',
      blocks: ['Két tranzisztoros villogó (rezgőkör)', 'Kondenzátorok: ezek adják az ütemet', 'Kimeneti tranzisztor: ez kapcsolja a LED-et'],
      built: ['flash', 'metronome'],
      text: {
        k: 'Az U23 belsejében ugyanaz van, mint amit te építettél: egy villogó. Csak kicsiben, egy dobozba zárva.',
        m: 'A Light kézikönyve szerint az U23 ellenállásokból, kondenzátorokból és tranzisztorokból áll. Ugyanaz a rezgőkör dolgozik benne, mint a te villogódban. A CTL lábon keresztül állíthatod, milyen gyorsan villogjon.',
        n: 'A gyártó szerint a modul diszkrét alkatrészekből (ellenállás, kondenzátor, tranzisztor) épül fel. A pontos belső rajzát nem ismerjük, de a működése egy villogó (astabil multivibrátor): a CTL-en befolyó áram a kondenzátor töltőáramát állítja, az OUT egy kimeneti tranzisztor, ami a (−) felé kapcsol.',
      },
    },
    variants: [
      { id: 'fast', label: 'R5 helyett R3 (5,1 kΩ)', real: 'Cseréld a 100 kΩ-os R5-öt (A3–C3) az 5,1 kΩ-os R3-ra. Gyorsabb vagy lassabb lesz a villogás?', apply: (lay) => lay.map((p) => (p.p === 'R5' ? { ...p, p: 'R3' } : p)), needs: ['R3'] },
    ],
    intro: {
      k: 'Ez egy fekete doboz, vagyis IC. Bekötjük, és villog. Mit gondolsz, mi lehet benne?',
      m: 'Az U23 stroboszkóp IC a Light dobozban van. Bekötjük egy LED-del, és megnézzük, mit csinál. Aztán kinyitjuk, és megnézzük, mi van benne.',
      n: 'Az U23 lábai: (+) és (−) a táp, OUT a kimenet (a (−) felé kapcsol), CTL a sebességszabályzó bemenet, NC nincs bekötve. A CTL-re kötött ellenállás (itt R5) szabja meg a villogás ütemét.',
    },
    guess: {
      q: { k: 'Mit gondolsz, mi van a dobozban?', m: 'Mi lehet az U23 belsejében, ha villogtatja a LED-et?', n: 'Milyen kapcsolás valósíthatja meg az U23 működését?' },
      opts: [['Egy villogó, mint amit építettem', 'blink'], ['Egy kis elem', 'on'], ['Varázslat', 'same']], right: 0,
      after: { k: 'Igen! Egy villogó van benne, mint a tiéd.', m: 'Egy rezgőkör, mint a te villogód, csak parányi alkatrészekből.', n: 'Egy astabil multivibrátor és egy kimeneti kapcsolótranzisztor.' },
    },
    hint: {
      k: 'Kapcsold be, és figyeld a lámpát! Aztán nyomd meg a „Nyisd ki az IC-t” gombot.',
      m: 'Kapcsold be az S1-et. Nyisd ki az IC-t, és nézd meg, mi van benne. Próbáld ki az R3-mal is.',
      n: 'Mérd meg a CTL-en befolyó áramot R5-tel és R3-mal. Hogyan függ tőle a villogás üteme?',
    },
    why: {
      k: 'Az IC egy kis doboz, amibe sok apró alkatrészt zártak. Az U23-ban egy villogó van, mint amit te raktál össze. Így már tudod, mi van benne, és nyugodtan használhatod.',
      m: 'Az IC-ket azért találták ki, hogy ne kelljen mindig mindent elemenként összerakni. Te már megépítetted ugyanezt két tranzisztorból és két kondenzátorból (Villogó). Az U23 ugyanezt tudja, csak kisebb helyen, kevesebb vezetékkel. Nagyobb ellenállással a CTL lábon lassabban villog, kisebbel olyan gyorsan, hogy folyamatos fénynek látszik.',
      n: 'A modellünkben a villogás frekvenciája arányos a CTL áramával: 100 kΩ-mal kb. 5 Hz (látható villogás), 5,1 kΩ-mal kb. 40 Hz, ami már folyamatos fénynek tűnik. A saját villogódban ugyanezt a bázisellenállás és a kondenzátor szorzata szabta meg (≈ 0,69 · R · C). Ez egy viselkedési modell, a valódi modul számai ettől eltérhetnek.',
    },
  },
  {
    id: 'u2', chapter: 'G', title: 'Kinyitjuk: U2 riasztó', tag: 'Egy sziréna, kész formában',
    layout: LAY.ic_u2, sim: { dt: 0.002, scale: 1 }, controls: ['S1', 'sound'], audio: { type: 'ic', ic: 'U2' },
    inside: {
      title: 'Mi van az U2-ben?',
      blocks: ['Hangkeltő rezgőkör (mint a hangszered)', 'Lassú vezérlő: felfelé söpri a hangot (mint a sziréna kondenzátora)', 'Választó: a bemenetek döntik el, melyik hangot adja', 'Kimeneti tranzisztor a hangszóróhoz'],
      built: ['siren', 'organ', 'and'],
      text: {
        k: 'Az U2-ben egy sziréna van, mint amit te építettél. Csak többféle hangot is tud.',
        m: 'A kézikönyv szerint az U2 egy speciális hangkeltő IC és néhány segédalkatrész. Benne egy rezgőkör szól, amit egy lassabb jel hangol, ahogy a te szirénádban a kondenzátor. A bemenetek (IN1, IN2, IN3) választják ki, melyik hangot adja.',
        n: 'Belül egy feszültségvezérelt oszcillátor (mint a szirénád), egy lassú vezérlőjel-generátor (söprés, szaggatás) és egy logikai választó: a három bemenet kombinációja dönti el a hangot, ahogy a kódzárban és a VAGY-kapuban a gombok. A kimeneti tranzisztor hajtja a hangszórót.',
      },
    },
    variants: [
      { id: 'in1', label: 'IN1 is a (+)-ra', real: 'Tegyél egy 3-as vezetéket az A3 és a C3 pont közé (2. szint): így az IN1 is a (+)-ra kerül.', apply: (lay) => lay.concat([{ p: 'W3', at: 'A3', dir: 'd', id: 'Lin1' }]) },
      { id: 'in3', label: 'IN3 is a (+)-ra', real: 'Tegyél egy 3-as vezetéket az A5 és a C5 pont közé (2. szint): így az IN3 is a (+)-ra kerül.', apply: (lay) => lay.concat([{ p: 'W3', at: 'A5', dir: 'd', id: 'Lin3' }]) },
    ],
    intro: {
      k: 'Ez a piros doboz egy riasztó. Bekötjük, és megszólal. Ismerős lesz a hangja!',
      m: 'Az U2 riasztó IC a Boffin I 300 dobozban van. Bekötjük a hangszóróval. A bemeneteivel (IN1, IN2, IN3) választhatod ki a hangot.',
      n: 'Az U2 lábai: IN1, IN2, IN3 vezérlőbemenetek (a (+)-ra kötve aktívak, ezeken kap tápot is), (−) a táp negatív pólusa, OUT a kimenet (a hangszórón át a (+) felé).',
    },
    guess: {
      q: { k: 'Melyik saját kísérletedre fog hasonlítani a hangja?', m: 'Melyik megépített kísérletedhez hasonlít az U2 hangja?', n: 'Melyik saját kapcsolásod valósítja meg az U2 alapműködését?' },
      opts: [['A szirénára', 'sound'], ['Az éjjeli lámpára', 'on'], ['A kódzárra', 'off']], right: 0,
      after: { k: 'Igen! Olyan, mint a szirénád.', m: 'Igen, a felfelé söprő hang olyan, mint a te szirénád hangja.', n: 'A söprő hang egy feszültségvezérelt oszcillátor, ahogy a szirénádban.' },
    },
    hint: {
      k: 'Kapcsold be, és kapcsold be a hangot!',
      m: 'Kapcsold be az S1-et és a hangot. Próbáld ki a lenti változatokat: más bemenetekkel más hangot ad.',
      n: 'Próbáld végig a bemenet-kombinációkat. Nyisd ki az IC-t, és vesd össze a saját szirénáddal.',
    },
    why: {
      k: 'A riasztó IC belsejében egy sziréna van, mint amit te raktál össze. A gyártó a sok kis alkatrészt egyetlen dobozba tette, hogy könnyebb legyen használni.',
      m: 'Te már megépítetted a riasztó lelkét: a szirénát. Ott egy kondenzátor lassan töltődött, és közben változott a hang. Az U2-ben ugyanez történik, csak parányi alkatrészekkel, és többféle mintával. A bemenetekkel választasz, mint a kódzárban a gombokkal.',
      n: 'Az U2 öt hangot ad a bemenetek kombinációitól függően. A modellünkben: IN2 = söprő riasztó, IN1 = gépfegyver, IN3 = tűzoltóautó, IN1+IN2 = lézerpisztoly, IN2+IN3 = mentőautó. Ezek saját közelítések: a valódi IC hangmintáit és pontos hozzárendelését nem ismerjük. A kijelzésen a kimenet átlagos áramát látod, mert a hangfrekvenciás kapcsolgatás túl gyors a valós idejű szimulációhoz.',
    },
  },
  {
    id: 'u1', chapter: 'G', title: 'Kinyitjuk: U1 zene', tag: 'Hangszer + memória + léptető',
    layout: LAY.ic_u1, sim: { dt: 0.002, scale: 1 }, controls: ['S1', { press: 'S2', label: 'Újra (TRG)' }, 'sound'], audio: { type: 'ic', ic: 'U1' },
    inside: {
      title: 'Mi van az U1-ben?',
      blocks: ['Hangkeltő rezgőkör: ez szól (mint a hangszered)', 'Memória: a dallam hangjai (sok-sok emlékező lámpa)', 'Léptető (számláló): sorban kiolvassa a hangokat', 'Időzítő: kb. 20 másodperc után leállítja (mint a késleltetett lámpa)'],
      built: ['organ', 'flipflop', 'delay'],
      text: {
        k: 'A zene IC-ben egy hangszer van, mint a tiéd, és egy emlékező rész, ami megjegyzi a dallamot.',
        m: 'Egy dallamhoz három dolog kell: valami, ami szól (a hangszered), valami, ami megjegyzi a hangokat (sok emlékező lámpa), és valami, ami sorban lépteti őket. Az U1-ben mindhárom benne van, egy speciális hangkeltő IC-ben.',
        n: 'A dallamot egy csak olvasható memória (ROM) tárolja; egy számláló lépteti a címeket, a kiolvasott adat egy programozható oszcillátor frekvenciáját állítja. Egy ilyen memória bitjeit nem tudjuk elemenként megépíteni (nagyon sok kellene), de az építőköveit igen: rezgőkör (hangszer), 1 bites memória (emlékező lámpa), időzítő (késleltetett lámpa).',
      },
    },
    variants: [
      { id: 'hld', label: 'HLD a (+)-ra: folyamatos zene', real: 'Tegyél egy 3-as vezetéket az A5 és a C5 pont közé (2. szint): így a HLD a (+)-ra kerül, és a zene nem áll le.', apply: (lay) => lay.concat([{ p: 'W3', at: 'A5', dir: 'd', id: 'Lhld' }]) },
    ],
    intro: {
      k: 'Ez a kék doboz zenél! Bekötjük, és lejátszik egy dallamot. Mi lehet benne?',
      m: 'Az U1 zene IC a Boffin I 300 dobozban van. Bekapcsoláskor kb. 20 másodpercig zenél. Az S2 gombbal újraindíthatod.',
      n: 'Az U1 lábai: (+) és (−) a táp, OUT a kimenet, TRG az újraindító bemenet (a (+)-ra érintve újra zenél), HLD a tartó bemenet (a (+)-ra kötve folyamatosan zenél).',
    },
    guess: {
      q: { k: 'Mi kell ahhoz, hogy egy doboz dallamot játsszon?', m: 'Mi kell egy dallam lejátszásához?', n: 'Milyen építőelemekből áll egy dallamlejátszó?' },
      opts: [['Hangszer és memória a hangoknak', 'sound'], ['Csak egy hangszóró', 'same'], ['Csak egy elem', 'on']], right: 0,
      after: { k: 'Igen! Kell valami, ami szól, és valami, ami emlékszik a dallamra.', m: 'Kell egy hangszer, egy memória és valami, ami sorban lépteti a hangokat.', n: 'Oszcillátor, memória (ROM) és számláló.' },
    },
    hint: {
      k: 'Kapcsold be, és kapcsold be a hangot! Ha elhallgat, nyomd meg az Újra gombot.',
      m: 'Kapcsold be az S1-et és a hangot. Kb. 20 másodperc után leáll; az S2-vel újraindíthatod.',
      n: 'Kösd a HLD-t a (+)-ra (lenti változat), és figyeld, hogy nem áll le. Nyisd ki az IC-t.',
    },
    why: {
      k: 'A zene IC egy nagyon okos doboz. Van benne egy hangszer, mint amit te építettél, és egy nagy-nagy emlékező rész, ami megjegyzi, melyik hang jön.',
      m: 'Ezt az IC-t már nem tudjuk elemenként megépíteni, mert a dallam megjegyzéséhez rengeteg emlékező lámpa kellene. De minden darabját ismered: a hangszer szól, az emlékező lámpa megjegyez, a késleltetett lámpa pedig egy idő után leállít. Az IC ezeket rakja össze, parányi méretben.',
      n: 'A modellünk egy saját, rövid dallamot játszik (a valódi U1 dallamát nem ismerjük), kb. 20 s-ig; a HLD a (+)-on folyamatos lejátszást ad, a TRG felfutó éle újraindít. Egy 20 hangos dallam néhány száz bitnyi memóriát igényel, ez több száz flip-flop lenne: ezért éri meg integrált áramkörbe zárni.',
    },
  },
  // ===================== F) Mikrofon-erősítő =====================
  {
    id: 'amp', chapter: 'F', title: 'Hangosbemondó', tag: 'A mikrofon hangja a hangszóróból szól',
    layout: LAY.amp, sim: { dt: 0.002, scale: 1 }, controls: ['S1', { mic: 'X1', echo: true }, 'sound'],
    audio: { type: 'micamp', probe: 'SP', mic: 'X1', full: 0.04 },
    intro: {
      k: 'Beszélj bele a mikrofonba, és a hangszóróból a saját hangod szól! Ez egy kis hangosbemondó.',
      m: 'A mikrofon (X1) a hang hatására egy picit megváltoztatja az ellenállását. Ez a változás nagyon kicsi, ezért két tranzisztor (Q2a és Q2b) felerősíti, és a hangszóró már hallhatóan megszólal.',
      n: 'Kétfokozatú erősítő: a mikrofon az R2-vel feszültségosztót alkot, a váltakozó jel a C3-on át egy Darlington-pár bázisára jut. A munkapontot az R5 állítja be a kimenetről visszacsatolva, ezért a tranzisztorok β-jától alig függ. A hangszóró az R1-gyel sorban a kollektorkörben van.',
    },
    guess: {
      q: { k: 'Ha beszélsz a mikrofonba, mi lesz?', m: 'Mi történik a hangszóróval, ha a mikrofonba beszélsz?', n: 'Mekkora lesz a hangszóró áramának változása a mikrofon ellenállásának változásához képest?' },
      opts: [['Megszólal a hangszóró', 'sound'], ['Kigyullad egy lámpa', 'on'], ['Semmi', 'same']], right: 0,
      after: { k: 'Igen! A hangszóróból a te hangod jön.', m: 'A tranzisztorok felerősítik a mikrofon kicsi változását, és a hangszóró a te hangodat szólaltatja meg.', n: 'A szimulációban a mikrofon ±90 Ω-os változása kb. 15 mA-es (csúcstól csúcsig) áramváltozást ad a hangszóróban, 14 mA-es nyugalmi áram mellett.' },
    },
    variants: [],
    hint: {
      k: 'Kapcsold be, aztán kapcsold be a hangot és a tablet mikrofonját, és mondj valamit! Vagy nyomd a „Fújj bele” gombot.',
      m: 'Kapcsold be az S1-et, a hangot és a tablet mikrofonját. Beszélj halkan, aztán hangosan. A legjobb fejhallgatóval: ha a tablet hangszórója visszaszól a mikrofonba, sípolni kezd (ez a gerjedés, a valódi hangosításnál is előfordul).',
      n: 'Figyeld a hangszóró áramát csendben és hangos beszédnél. Hangos hangnál a jel torzul: a kimenet nem tud a tápfeszültségnél nagyobbat és nullánál kisebbet adni.',
    },
    why: {
      k: 'A mikrofonba érő hang egy picit megnyomja a mikrofont. Ez nagyon kicsi változás, a hangszóró ettől még nem szólna. A tranzisztorok olyanok, mint egy nagyító: a kicsi változásból nagyot csinálnak. Így szól a hangszóró a te hangoddal.',
      m: 'Az erősítés azt jelenti, hogy egy kicsi változás vezérel egy nagyot. A mikrofon ellenállása a hangtól csak kicsit változik, de a tranzisztorok ezt sokszorosára nagyítják, és ez már meg tudja mozgatni a hangszóró membránját. A C3 kondenzátor csak a változást engedi át, az állandó feszültséget nem, ezért a tranzisztorok munkapontja nem csúszik el. A valódi készleten halkabb lesz, mint egy igazi hangosbemondó: ehhez kellene az U4 erősítő IC (a következő fejezetben).',
      n: 'A Darlington-pár áramerősítése kb. β², így a kicsi bázisáram-változásból nagy kollektoráram-változás lesz. Az R5 negatív visszacsatolás: ha a kimenet feszültsége nő, több bázisáram folyik, a tranzisztorok jobban nyitnak, és a kimenetet visszahúzzák. Így a nyugalmi áram β = 80 és 300 között is kb. 14–15 mA marad. A hangot a tablet úgy állítja elő, hogy a szimulátorból kiszámolja az erősítő átviteli görbéjét (mikrofon-ellenállás → hangszóróáram), és ezen vezeti át a tablet mikrofonjának jelét; a túlvezérlés torzítása is ebből jön.',
    },
  },

  // ===================== G) a többi fekete doboz =====================
  {
    id: 'u4', chapter: 'G', title: 'Kinyitjuk: U4 erősítő', tag: 'Hangosbemondó egy dobozban',
    layout: LAY.ic_u4, sim: { dt: 0.002, scale: 1 }, controls: ['S1', { mic: 'X1', echo: true }, 'sound'],
    audio: { type: 'micamp', probe: 'SP', mic: 'X1', full: 0.15 },
    inside: {
      title: 'Mi van az U4-ben?',
      blocks: ['Erősítő tranzisztorok (mint a hangosbemondóban)', 'Csatolókondenzátorok: csak a változást engedik át', 'Szűrt táp (FIL) a mikrofonnak'],
      built: ['amp'],
      text: {
        k: 'Az U4-ben is egy erősítő van, mint a hangosbemondódban. Csak erősebb, és kisebb helyen elfér.',
        m: 'A 300-as kézikönyv szerint az U4 egy erősítő IC a hozzá mindig szükséges alkatrészekkel. Ugyanazt csinálja, mint a te hangosbemondód, csak jóval hangosabban, és nem függ annyira attól, milyen tranzisztorok vannak benne.',
        n: 'A modul egy integrált teljesítményerősítő a külső alkatrészeivel (csatoló- és szűrőkondenzátorok). A modellünkben a bemenet változását 20-szorosára erősíti, a kimenet belül kondenzátoron át csatolt, és a kitérése a tápfeszültség feléig terjed. A kézikönyv szerint a FIL láb szűrt tápot ad, hogy a mikrofon tápja ne zúgjon; a modellünkben ez egy 100 Ω-os ellenállás a (+) felé. A valódi modul pontos belső rajzát nem ismerjük.',
      },
    },
    variants: [],
    intro: {
      k: 'Ez a sárga doboz egy erősítő. Beszélj bele a mikrofonba, és nagyon hangosan szól!',
      m: 'Az U4 erősítő IC a 300-as dobozban van. Ugyanazt csinálja, mint a hangosbemondód, csak sokkal hangosabban. Bekötjük, kipróbáljuk, aztán kinyitjuk.',
      n: 'Az U4 lábai: (+) és (−) a táp, INP a bemenet, OUT a kimenet, FIL a szűrt táp. A mikrofont az R2 a FIL-ről táplálja; a hangszóró az OUT és a (−) között van. Az IC itt elforgatva áll a rácson.',
    },
    guess: {
      q: { k: 'Hangosabb lesz, mint a hangosbemondód?', m: 'Hangosabban vagy halkabban szól, mint a két tranzisztoros hangosbemondód?', n: 'Hányszor nagyobb lesz a hangszóró áramának változása, mint a hangosbemondónál?' },
      opts: [['Hangosabb', 'sound'], ['Ugyanolyan', 'same'], ['Halkabb', 'dim']], right: 0,
      after: { k: 'Igen! Sokkal hangosabb.', m: 'Sokkal hangosabb: az IC-ben több és erősebb tranzisztor dolgozik.', n: 'A szimulációban ugyanarra a mikrofonváltozásra kb. 180 mA-es változás jön a 15 mA helyett, vagyis kb. tizenkétszer akkora.' },
    },
    hint: {
      k: 'Kapcsold be a hangot és a mikrofont, és mondj valamit! Aztán nyisd ki az IC-t.',
      m: 'Kapcsold be az S1-et, a hangot és a tablet mikrofonját. Hasonlítsd össze a hangosbemondóval. Fejhallgatóval jobb, különben sípolhat.',
      n: 'Nézd meg a hangszóró áramát, és hasonlítsd össze a hangosbemondóéval. Hangos hangnál itt is torzul a jel: hol van a határ?',
    },
    why: {
      k: 'Az U4-ben egy erősítő van, mint amit te építettél két tranzisztorból. Csak sokkal erősebb. Most már tudod, mi van a dobozban.',
      m: 'Az erősítő IC-ket rádiókban, hangszórókban, telefonokban használják. Egy erősítőt megépíteni sok alkatrész, az IC-ben ez mind egy tokban van. Te már tudod, hogyan működik: a kicsi változást egy nagy áram követi.',
      n: 'Az IC-s erősítő előnye: nagyobb erősítés, kisebb torzítás, és a működése nem függ az egyes tranzisztorok β-jától, mert a belsejében erős negatív visszacsatolás van. A hangosbemondódban az R5 ugyanezt csinálta kicsiben. Ez egy viselkedési modell; a valódi U4 erősítése és hangereje ettől eltérhet.',
    },
  },
  {
    id: 'u3', chapter: 'G', title: 'Kinyitjuk: U3 űrháború', tag: 'Nyolc űrhang egy dobozban',
    layout: LAY.ic_u3, sim: { dt: 0.002, scale: 1 }, controls: ['S1', { press: 'S2', label: 'Következő hang (S2)' }, 'sound'], audio: { type: 'ic', ic: 'U3' },
    inside: {
      title: 'Mi van az U3-ban?',
      blocks: ['Hangot adó rezgőkör, aminek a hangmagassága állítható', 'Lassú rezgőkör, ami hangolja a gyorsat', 'Számláló: gombnyomásra a következő hangot választja'],
      built: ['siren', 'flash', 'flipflop'],
      text: {
        k: 'Az U3-ban rezgőkörök vannak, mint a szirénádban és a villogódban. Egy kis számláló pedig megjegyzi, melyik hangnál tartasz.',
        m: 'A hangot egy rezgőkör adja, mint a szirénádban. A hangmagasságát egy lassabb rezgőkör hangolja, ettől lesz „lézeres” vagy „ufós”. A gombnyomásokat egy számláló jegyzi meg. A számláló emlékező lámpákból (flip-flopokból) áll.',
        n: 'Az U3 egy hanggeneráló IC a kiegészítő alkatrészeivel. A működése: egy hangolható oszcillátor, egy lassú modulálóoszcillátor és egy háromfokozatú számláló (3 flip-flop: 2³ = 8 állapot). A pontos hangjait nem ismerjük; a modellünk nyolc saját űrhangot ad.',
      },
    },
    variants: [],
    intro: {
      k: 'Ez a zöld doboz űrhangokat ad. Minden gombnyomásra másik hangot!',
      m: 'Az U3 űrháború IC a 300-as dobozban van. Nyolcféle hangot tud. A nyomógomb az IN1 lábat a (−)-ra köti, és ettől a következő hangra lép.',
      n: 'Az U3 lábai: (+), (−), OUT (a hangszóró a (+) és az OUT között), IN1 és IN2 vezérlőbemenet. A kézikönyv szerint a bemeneteket a (−)-ra kötve lehet végiglépkedni a nyolc hangon.',
    },
    guess: {
      q: { k: 'Ha megnyomod a gombot, mi lesz?', m: 'Mi történik, ha megnyomod az S2-t?', n: 'Hány gombnyomás után kerülsz vissza az első hanghoz?' },
      opts: [['Másik hang szól', 'sound'], ['Elhallgat', 'off'], ['Ugyanaz szól', 'same']], right: 0,
      after: { k: 'Igen! Minden nyomásra új hang jön.', m: 'Minden gombnyomásra a következő hang jön, nyolc után kezdi elölről.', n: 'Nyolc: a három flip-flopos számláló 8 állapot után körbeér.' },
    },
    hint: {
      k: 'Kapcsold be a hangot, és nyomogasd a gombot!',
      m: 'Kapcsold be az S1-et és a hangot. Nyomogasd az S2-t, és számold meg, hány hangja van.',
      n: 'Számold meg a hangokat, és figyeld az U3 állapotát a mérőknél. Melyik hang emlékeztet a szirénádra?',
    },
    why: {
      k: 'Az űrhangokat rezgőkörök csinálják, mint a szirénádban. A doboz megjegyzi, hányszor nyomtad meg a gombot, és mindig a következő hangot adja.',
      m: 'Két rezgőkör dolgozik együtt: egy gyors, ami a hangot adja, és egy lassú, ami folyton változtatja a gyors hangmagasságát. A szirénánál a lassú rész a kondenzátor töltődése volt. A számláló emlékező lámpákból áll, mint a flip-flopod, csak hármat kötnek egymás után.',
      n: 'Három flip-flop egymás után kötve 0-tól 7-ig számol (bináris számláló): minden gombnyomás az első flip-flopot billenti át, és ha az visszaáll, a következőt. A hangot választó áramkör ebből a 3 bitből választja ki, melyik hangot kapcsolja be. Az U2 riasztóban ezt a három bitet te adtad meg kívülről (IN1, IN2, IN3).',
    },
  },
  {
    id: 'u22', chapter: 'G', title: 'Kinyitjuk: U22 fényorgona', tag: 'Hangra színt vált',
    layout: LAY.ic_u22, sim: { dt: 0.002, scale: 1 }, controls: ['S1', { mic: 'X1' }],
    inside: {
      title: 'Mi van az U22-ben?',
      blocks: ['Hangérzékelő: a mikrofon jeléből kapcsoló lesz (mint a hangra villogó LED-nél)', 'Számláló: megjegyzi, hányadik színnél tartasz', 'Piros, zöld és kék LED egy tokban'],
      built: ['clap', 'flipflop'],
      text: {
        k: 'Az U22-ben egy hangkapcsoló van, mint a hangra villogó lámpádban, és három kis lámpa: egy piros, egy zöld és egy kék.',
        m: 'A Light kézikönyve szerint az U22 ellenállásokból, kondenzátorokból, tranzisztorokból, egy háromszínű LED-ből és IC-kből áll. A hangot ugyanúgy veszi észre, mint a te hangra villogó LED-ed. Minden hangnál egy számláló lép egyet, és a számláló dönti el, melyik színek égjenek.',
        n: 'A bemeneten egy komparátor (Schmitt-trigger) van: ha az INP feszültsége a tápfeszültség kb. 55%-a fölé megy, egyet lép a számláló, és csak akkor léphet újra, ha a feszültség 45% alá esett. A számláló kimenetei kapcsolják a piros, zöld és kék LED-et. A modellünk hét színt léptet sorban; a valódi IC színsorrendje ettől eltérhet. A kézikönyv szerint az R, G, B lábakkal a színek közvetlenül is vezérelhetők.',
      },
    },
    variants: [],
    intro: {
      k: 'Fújj bele a mikrofonba, és a lámpa minden fújásra más színű lesz!',
      m: 'Az U22 fényorgona a Light dobozban van. A kézikönyv minden kapcsolásában két elemmel (6 V) szerepel, ezért mi is két elemmel kötjük. Minden hangra, fújásra vagy tapsra másik színre vált.',
      n: 'Az U22 lábai: R, G, B színvezérlés, (+) és (−) a táp (itt két elem sorban, 6 V), INP a bemenet, FB visszacsatolás. A mikrofon az R3-mal feszültségosztót alkot az INP-n, mint a hangra villogó LED-nél.',
    },
    guess: {
      q: { k: 'Ha belefújsz, mi lesz a lámpával?', m: 'Mi történik a fényorgonával, ha belefújsz a mikrofonba?', n: 'Mi történik, ha folyamatosan fújod a mikrofont, és nem engeded el?' },
      opts: [['Másik színű lesz', 'blink'], ['Kialszik', 'off'], ['Semmi', 'same']], right: 0,
      after: { k: 'Igen! Minden fújásra új szín.', m: 'Minden hangnál egyet lép, és másik színt kapcsol be.', n: 'Csak egyet lép: a számláló csak akkor léphet újra, ha a bemenet közben visszaesett.' },
    },
    hint: {
      k: 'Kapcsold be, és nyomd a „Fújj bele” gombot többször egymás után!',
      m: 'Kapcsold be az S1-et, és fújj bele többször. Kapcsold be a tablet mikrofonját, és tapsolj vagy énekelj.',
      n: 'Számold meg, hány szín van, és melyik színek keverékek (sárga = piros + zöld, türkiz = zöld + kék, lila = piros + kék, fehér = mind a három).',
    },
    why: {
      k: 'A dobozban egy hangkapcsoló, egy számláló és három kis lámpa van. A hangra a számláló egyet lép, és egy másik lámpát kapcsol be. Ha egyszerre több lámpa ég, a színük összekeveredik.',
      m: 'A hangra villogó LED-ed a hangot kapcsolásra fordította le. Az U22 ugyanezt csinálja, de nem csak villan, hanem számol is: megjegyzi, hányadik hangnál tartasz, mint az emlékező lámpád. A három szín keveréséből újabb színek lesznek: piros és zöld együtt sárgának látszik.',
      n: 'A színkeverés az additív színkeverés: a szemünkben háromféle színérzékelő van (piros, zöld, kék), ezért a három LED fényének keverékéből sok színt látunk. A tévé és a tablet képernyője is így működik, piros, zöld és kék pontokból.',
    },
  },
  {
    id: 'u24', chapter: 'G', title: 'Kinyitjuk: U24 infravevő', tag: 'Érzi a távirányító láthatatlan fényét',
    layout: LAY.ic_u24, sim: { dt: 0.002, scale: 1 }, controls: ['S1', { remote: 'U24' }],
    inside: {
      title: 'Mi van az U24-ben?',
      blocks: ['Fényérzékelő, ami csak az infravörös fényt látja (mint egy fototranzisztor)', 'Erősítő és szűrő: csak a gyorsan villogó fényt engedi át', 'Kimeneti tranzisztor: ez kapcsolja a LED-et'],
      built: ['lightlink', 'night'],
      text: {
        k: 'Az U24-ben egy fényt érző szem van, mint a fototranzisztor, és egy kapcsoló. A szem csak a távirányító láthatatlan fényét veszi észre.',
        m: 'A távirányító infravörös fényt villogtat, amit a szemünk nem lát. Az U24 érzékelője ezt fogja fel, mint a fénytávírónál a fototranzisztor. Egy szűrő csak a gyors villogást engedi tovább, ezért a lámpák állandó fénye nem zavarja.',
        n: 'Az infravevő modulok belsejében egy infravörös fotodióda, egy erősítő, egy kb. 38 kHz-re hangolt sávszűrő és egy egyenirányító (demodulátor) van; a kimenet egy tranzisztor, ami adás alatt a (−) felé kapcsol. A távirányító a kódot 38 kHz-es villanássorozatokban küldi. A fénytávíród ugyanezt csinálta látható fénnyel és szűrő nélkül.',
      },
    },
    variants: [],
    intro: {
      k: 'A távirányító láthatatlan fénnyel üzen. Ez a kis sárga doboz meglátja, és felkapcsolja a lámpát!',
      m: 'Az U24 infravevő a Light dobozban van. Ha egy tévé-távirányítót ráfogsz, és megnyomod bármelyik gombját, a LED villogni kezd.',
      n: 'Az U24 lábai: (+), (−) és a kimenet. A kimenet adás közben a (−)-ra kapcsol, ezért a LED a (+) és a kimenet közé kerül. A kézikönyv szerint itt nem kell elé ellenállás.',
    },
    guess: {
      q: { k: 'Ha megnyomod a távirányító gombját, mi lesz?', m: 'Mit csinál a LED, ha a távirányítóval rávilágítasz az U24-re?', n: 'Miért villog a LED, és miért nem ég folyamatosan?' },
      opts: [['Villog a lámpa', 'blink'], ['Semmi, hiszen nem látszik a fény', 'off'], ['Megszólal', 'sound']], right: 0,
      after: { k: 'Igen! A doboz látja, amit mi nem.', m: 'A LED villog: a távirányító jelét a fénye villogása hordozza.', n: 'Mert a távirányító a kódot villanássorozatként küldi, és a kimenet ezt követi.' },
    },
    hint: {
      k: 'Kapcsold be, aztán nyomd és tartsd a „Távirányító gombja” gombot! A valódi készletnél egy tévé-távirányító kell.',
      m: 'Kapcsold be az S1-et, aztán nyomd a távirányító gombot. A valódi készletnél fogd rá az U24-re egy tévé-távirányítót, és nyomj meg rajta bármit.',
      n: 'Tipp: a tablet vagy telefon kamerája sokszor látja az infravörös fényt. Nézd a kamerán át a távirányító végét, miközben nyomod a gombját!',
    },
    why: {
      k: 'A távirányító lámpája olyan fényt ad, amit a szemünk nem lát. Az U24 látja, és bekapcsolja a LED-et. Ugyanaz, mint a fénytávíród, csak láthatatlan fénnyel.',
      m: 'Az infravörös fény a piros fényen túl van, a szemünk már nem látja, de a fényérzékelők igen. A távirányító így szól a tévéhez úgy, hogy közben nem villog a szobában semmi. Az U24 a fénytávíró vevőjének egy ügyesebb változata: nem zavarja meg a lámpák és a nap fénye.',
      n: 'A sávszűrő miatt a vevő csak a 38 kHz körül villogó fényre reagál, az állandó fényre (nap, lámpa) nem. Ezért nem kapcsol be a szoba világításától, amit a fénytávíród fototranzisztora megtenne. A modellünkben a távirányító jelét egy egyszerű villogás helyettesíti.',
    },
  },
  {
    id: 'd8', chapter: 'G', title: 'Kinyitjuk: a színes LED (D8)', tag: 'Egy LED, amiben villogó van',
    layout: LAY.ic_d8, sim: { dt: 0.002, scale: 1 }, controls: ['S1'],
    inside: {
      title: 'Mi van a D8-ban?',
      blocks: ['Piros, zöld és kék LED egy tokban', 'Egy parányi vezérlő IC: ez váltogatja a színeket (mint egy villogó)', 'Áramkorlátozó ellenállás'],
      built: ['flash'],
      text: {
        k: 'Ebben a LED-ben három kis lámpa van, és egy pici villogó, ami felváltva kapcsolja őket.',
        m: 'A Light kézikönyve szerint a színes LED-ben piros, zöld és kék LED van, és egy kis áramkör, ami vezérli őket. Olyan, mint a te villogód, csak nem két lámpát kapcsolgat, hanem hármat, és többféle sorrendben.',
        n: 'A színes LED-ek tokjában a három LED-chip mellett egy apró vezérlő IC is van, ami egy saját ütemadóval (oszcillátorral) lépteti a színeket. Az áramot a beépített ellenállás korlátozza. A modellünkben a színek sorrendje és üteme saját közelítés.',
      },
    },
    variants: [],
    intro: {
      k: 'Ez egy különleges lámpa: magától változtatja a színét!',
      m: 'A D8 színes LED a Light és a My Home dobozban van. Úgy néz ki, mint egy sima LED, de bekapcsolva magától váltogatja a színét.',
      n: 'A D8 két lábú, mint egy LED, és ugyanúgy van iránya (+). A My Home LED-jeibe áramkorlátozó ellenállás van építve, ezért elé nem kell ellenállás.',
    },
    guess: {
      q: { k: 'Bekapcsolod. Milyen színű lesz?', m: 'Mit csinál a D8, ha bekapcsolod?', n: 'Hány alkatrész lehet egy ilyen LED-ben?' },
      opts: [['Váltogatja a színét', 'blink'], ['Mindig piros', 'on'], ['Nem világít', 'off']], right: 0,
      after: { k: 'Igen! Mindenféle színe van.', m: 'Magától váltogatja a színét: van benne egy kis vezérlő.', n: 'Legalább öt: három LED, egy vezérlő IC és egy ellenállás.' },
    },
    hint: {
      k: 'Kapcsold be, és figyeld a színeket!',
      m: 'Kapcsold be az S1-et, és nézd, milyen színeket mutat. Melyik szín keverék?',
      n: 'Figyeld a LED áramát: változik-e, amikor színt vált?',
    },
    why: {
      k: 'A LED-ben három kis lámpa van: piros, zöld és kék. Egy pici villogó felváltva kapcsolja őket. Ha kettő egyszerre ég, a színük összekeveredik.',
      m: 'Nem csak a nagy dobozokban vannak IC-k: egy LED-be is befér egy. A villogód két tranzisztorral két lámpát kapcsolgatott. A D8-ban ezt egy parányi IC csinálja három lámpával.',
      n: 'A D8 árama a színtől függően változik, mert egyszerre egy, kettő vagy három LED-chip ég. A modellünk a D8-at egyetlen LED-ként számolja, beépített ellenállással; a színváltás csak a rajzon látszik.',
    },
  },
  {
    id: 'u32', chapter: 'G', title: 'Kinyitjuk: U32 dallam IC', tag: 'Zene, hangszóróval együtt',
    layout: LAY.ic_u32, sim: { dt: 0.002, scale: 1, meter: { M6: '50mA' } }, controls: ['S1', { meter: 'M6' }, 'sound'], audio: { type: 'ic', ic: 'U32', builtin: true },
    inside: {
      title: 'Mi van az U32-ben?',
      blocks: ['Hangot adó rezgőkör (mint a hangszeredben)', 'Memória a dallam hangjaival', 'Beépített kis hangszóró'],
      built: ['organ', 'flipflop'],
      text: {
        k: 'Az U32-ben egy kis hangszer van, ami megjegyezte a dallamot, és egy pici hangszóró is.',
        m: 'A My Home kézikönyve szerint az U32 egy memóriába írt dallamot játszik le, és a beépített hangszórója szólaltatja meg. A hangot ugyanúgy egy rezgőkör adja, mint a te hangszeredben, csak a hangokat nem te választod, hanem a memória.',
        n: 'A dallam IC-k belsejében egy oszcillátor, egy osztó (ez adja a hangmagasságokat), egy számláló és egy kis memória (ROM) van, ami sorban megmondja, melyik hang jön és meddig szól. A dallamot nem ismerjük; a modellünk egy saját rövid dallamot játszik.',
      },
    },
    variants: [],
    intro: {
      k: 'Ez a kis doboz zenél, és még hangszóró sem kell hozzá!',
      m: 'Az U32 dallam IC a My Home dobozban van. Két lába van, mint egy lámpának, és bekapcsolva dallamot játszik. A mérőműszer megmutatja, mennyi áramot vesz fel.',
      n: 'Az U32 két lábú, a (+) jel felül. A mérőműszer (50 mA-es állásban) sorban van vele; minden hangnál megváltozik a felvett áram.',
    },
    guess: {
      q: { k: 'Mit csinál a mérő mutatója zene közben?', m: 'Mit csinál a mérőműszer, amíg a dallam szól?', n: 'Miért változik a mérő kitérése zene közben?' },
      opts: [['Ugrál', 'blink'], ['Áll', 'same'], ['Nulla', 'off']], right: 0,
      after: { k: 'Igen! Minden hangnál mozdul.', m: 'Ugrál: amikor szól egy hang, több áram kell, a szünetekben kevesebb.', n: 'Mert a beépített hangszóró árama hangonként be- és kikapcsol.' },
    },
    hint: {
      k: 'Kapcsold be a hangot és az S1-et, és figyeld a mérő mutatóját!',
      m: 'Kapcsold be az S1-et és a hangot. Figyeld a mérőt a hangok és a szünetek alatt.',
      n: 'Olvasd le a mérőt hang közben és szünetben. Mennyi áram jut a hangszóróra?',
    },
    why: {
      k: 'Az U32-ben egy kis hangszer van, ami megjegyezte a dallamot. Ha áramot kap, eljátssza. A hangszóró is benne van, ezért nem kell külön.',
      m: 'A hangszereden te választottad a hangot a gombbal és a tekerővel. Az U32-ben a memória mondja meg, melyik hang jön. Az U1 zene IC ugyanezt tudja, csak annak külső hangszóró kell.',
      n: 'A mérő átlagos áramot mutat: hang közben a hangszóró áramának átlaga, szünetben csak a vezérlő kicsi árama. A modellünkben ez kb. 12 mA, illetve 1,5 mA. A valódi U32 számai ettől eltérhetnek.',
    },
  },

  {
    id: 'u5', chapter: 'G', title: 'Kinyitjuk: U5 rádió', tag: 'Hangold be a Kossuth Rádiót',
    layout: LAY.ic_u5, sim: { dt: 0.002, scale: 1, tune: { CV: 0.5 }, pot: { RV: 0.4 } },
    controls: ['S1', { toggle: 'S1b', label: 'S1 (erősítő)' }, { tune: 'CV', ic: 'U5', label: 'Hangolás (CV)' }, { pot: 'RV', label: 'Hangerő (RV)', invert: true }, 'sound'],
    audio: { type: 'radio', ic: 'U5', amp: 'U4', pot: 'RV' },
    inside: {
      title: 'Mi van az U5-ben?',
      blocks: ['Nagyfrekvenciás erősítő: a nagyon gyenge rádiójelet felerősíti', 'Egyenirányító: a rádióhullámból kiválogatja a hangot', 'Önszabályozás: erős adónál visszaveszi az erősítést'],
      built: ['amp'],
      text: {
        k: 'Az U5-ben egy nagyon érzékeny erősítő van, ami a levegőben repülő rádióhullámokból hangot csinál. Ezt már nem építettük meg, mert nagyon gyors tranzisztorok kellenek hozzá.',
        m: 'A 300-as kézikönyv szerint az U5 egy különleges erősítő, amit csak rádiókban használnak. A rádióhullám nagyon gyorsan rezeg, másodpercenként félmilliószor. Az U5 ezt a gyors rezgést erősíti fel, és kiválogatja belőle a lassabb hangrezgést. A hangot utána az U4 erősíti fel, mint a hangosbemondódban.',
        n: 'Az ilyen rádió-IC-kben (mint a TA7642 vagy a ZN414) több fokozatú nagyfrekvenciás erősítő, egy detektor (egyenirányító) és automatikus erősítésszabályozás (AGC) van; a tápot a kimeneti lábon, egy ellenálláson át kapják (itt R4). Az AGC-feszültség az R5-ön át jut vissza a hangolt kör aljára, a C1 ezt a pontot a rádiófrekvencia számára a (−)-ra köti. A szimulátor a rádiófrekvenciát nem számolja: a vétel erősségét a hangolt kör rezonanciafrekvenciájából és az adó frekvenciájából becsüli.',
      },
    },
    variants: [],
    intro: {
      k: 'Rádiót építünk! A levegőben láthatatlan rádióhullámok repülnek. A tekerővel kell megkeresni az adót.',
      m: 'Az antennatekercs (A1) és a forgókondenzátor (CV) együtt egy hangolt kört alkot: ez választja ki a sok rádióadó közül az egyiket. Az U5 a gyenge jelet hanggá alakítja, az U4 felerősíti, a hangszóró megszólaltatja. Két rácson építjük: az elsőn a vevő, a másodikon az erősítő, a kettőt két átkötő kábel köti össze.',
      n: 'Középhullámú rádió: a hangolt kör (A1 ∥ CV) rezonanciafrekvenciája f = 1 / (2π·√(L·C)). A szimulációban L ≈ 380 µH, C ≈ 55–235 pF (a szórt kapacitással), így kb. 530–1100 kHz hangolható. Magyarországon középhullámon a Kossuth Rádió szól, 540 kHz-en, a solti adóról.',
    },
    guess: {
      q: { k: 'Hol szól a rádió: a tekerő elején, közepén vagy a végén?', m: 'A forgókondenzátor melyik állásánál fogod a Kossuth Rádiót?', n: 'Mekkora kapacitás kell a 540 kHz-hez 380 µH-s tekerccsel?' },
      opts: [['Majdnem a végén', 'on'], ['Középen', 'same'], ['Az elején', 'off']], right: 0,
      after: { k: 'Igen! Majdnem egészen el kell tekerni.', m: 'Majdnem a végén: a Kossuth a középhullám legalsó szélén van, ahhoz a legnagyobb kapacitás kell.', n: 'C = 1 / ((2π·540 kHz)²·380 µH) ≈ 229 pF, ebből kb. 15 pF a szórt kapacitás, tehát a CV kb. 214 pF-on áll, közel a maximumhoz.' },
    },
    hint: {
      k: 'Kapcsold be a hangot, aztán lassan tekerd a hangolást, amíg a sistergés helyett zene nem szól!',
      m: 'Kapcsold be az S1-et és a hangot. Lassan húzd a hangolást, és figyeld, mikor tűnik el a sistergés. A valódi készleten a forgókondenzátort nagyon lassan tekerd, és fordítsd el a rácsot is: az antennatekercs iránya számít.',
      n: 'Keresd meg, milyen széles az a sáv, ahol az adó jól szól. A valódi rádiónál este, sötétedés után külföldi középhullámú adók is bejöhetnek.',
    },
    why: {
      k: 'A rádióadó tornya láthatatlan hullámokat küld, amelyek mindenhol ott vannak körülöttünk. A tekercs és a forgókondenzátor együtt olyan, mint egy hinta: csak akkor leng nagyot, ha a hullám épp a neki való ütemben lökdösi. A tekerővel ezt az ütemet állítod be.',
      m: 'A hangolt kör a rezonancia miatt működik: a tekercs és a kondenzátor együtt egy bizonyos ütemben szeret rezegni, és ilyenkor egy adott frekvenciájú rádióhullámot sokkal erősebben vesz fel, mint a többit. A forgókondenzátorral ezt a frekvenciát állítod. Fontos: a szimulációban a Kossuth Rádió műsorát nem tudjuk venni, ezért egy kitalált dallam szól helyette. A valódi készlettel viszont, ha elég erős az adó, tényleg a Kossuth szólhat.',
      n: 'A sávszélesség kb. f/Q: a modellünkben Q ≈ 35, így kb. 15 kHz széles sávban szól az adó. A valódi készleten az antennatekercs induktivitása és a forgókondenzátor tartománya eltérhet; ha a CV teljesen becsavart állásában sem éri el a 540 kHz-et, akkor a Kossuth nem fogható ezzel a kapcsolással. Az, hogy a solti adó éppen sugároz-e, a műsorszórótól függ (karbantartások is vannak).',
    },
  },
  {
    id: 'daylamp', chapter: 'C', title: 'Nappali lámpa (PNP)', tag: 'Fényben gyullad ki',
    layout: LAY.daylamp, sim: { dt: 0.002, scale: 1 }, light: 0.85, controls: ['S1', 'light'],
    intro: {
      k: 'Ez az éjjeli lámpa fordítottja: világosban világít, sötétben elalszik. Egy zöld tranzisztor dolgozik benne.',
      m: 'A zöld PNP tranzisztor (Q1) akkor nyit ki, ha a bázisát a − felé húzzák. Fényben a fototranzisztor (Q4) épp ezt teszi, ezért a LED világosban ég.',
      n: 'PNP kapcsoló a (+) oldalon: az R3 a bázist a (+) felé húzza (zárva), fényben a Q4 a (−) felé húzza, a bázisáram kifolyik, és a Q1 vezet. Egy átkötő kábel kell hozzá.',
    },
    guess: {
      q: { k: 'Mit csinál a lámpa, ha letakarod a kis fekete szemet?', m: 'Mi történik a LED-del, ha letakarod a Q4-et?', n: 'Mi lesz a kollektorárammal, ha a Q4 nem kap fényt?' },
      opts: [['Elalszik', 'off'], ['Kigyullad', 'on'], ['Semmi nem változik', 'same']], right: 0,
      after: { k: 'Igen! Ez a lámpa a fényt szereti.', m: 'Sötétben a Q4 nem vezet, az R3 a bázist a + felé húzza, és a PNP bezár.', n: 'A bázis a (+) közelébe kerül, nincs bázisáram, így a kollektoráram is nulla.' },
    },
    variants: [],
    hint: {
      k: 'Kapcsold be, és húzd a fényt a hold felé! Vagy takard le a szemet.',
      m: 'Kapcsold be, és változtasd a fényt. Hasonlítsd össze az Éjjeli lámpával!',
      n: 'Milyen fényszintnél kapcsol? Hasonlítsd össze az NPN-es éjjeli lámpa kapcsolási pontjával.',
    },
    why: {
      k: 'A zöld tranzisztor fordított csap: akkor nyit ki, ha lefelé húzzák a karját. Fényben a szem lehúzza, és a lámpa világít.',
      m: 'Az éjjeli lámpában a piros NPN volt, és a szem fényben elvette tőle az áramot. Itt a zöld PNP van, és a szem fényben épp kinyitja. Ugyanazok az alkatrészek, tükrözve: ezért van NPN és PNP is.',
      n: 'A szimulációban kb. 0,2-es fényszint fölött kapcsol be: ekkor a Q4 árama meghaladja az R3-on folyó kb. 0,14 mA-t (0,7 V / 5,1 kΩ), és a különbség a bázisból folyik ki. PNP (Q1) a Boffin I 300-ban és a Light dobozban is van.',
    },
  },

];


// „Ellenőrizd magad!” – a kísérlet végén egy kérdés egy ÚJ helyzetről, amit a gyerek nem próbált ki,
// de a megértett elv alapján meg tudja válaszolni. A válaszlehetőségek közösek, a kérdés és a magyarázat korosztályonként más.
const CHECKS = {
  first: {
    q: { k: 'Ha az ellenállást és a lámpát felcseréled (a lámpa + jele továbbra is az elem + oldala felé néz), világít a lámpa?', m: 'Ha a LED és az ellenállás sorrendjét felcseréled (a LED + jele továbbra is a + felé néz), mi lesz?', n: 'Mi változik, ha a soros körben felcseréled az R1 és a D1 sorrendjét (a LED iránya marad)?' },
    opts: [['Ugyanúgy világít', 'same'], ['Nem világít', 'off'], ['Fényesebb lesz', 'on']], right: 0,
    after: { k: 'Igen! A sorrend mindegy, csak a kör legyen zárt.', m: 'Egy körben az áram mindenhol ugyanakkora, ezért mindegy, melyik alkatrész van elöl.', n: 'Soros körben az áram minden ponton ugyanaz, és a feszültségek összege sem függ a sorrendtől: semmi nem változik.' },
  },
  conduct: {
    q: { k: 'Ha egy pénzérmét teszel a két kábelvég közé, mi lesz a lámpával?', m: 'Mit mutat a LED, ha egy fémpénzt vizsgálsz?', n: 'Mit vársz egy fémpénznél: mekkora lesz az ellenállása a többi anyaghoz képest?' },
    opts: [['Fényesen világít', 'on'], ['Halványan', 'dim'], ['Nem világít', 'off']], right: 0,
    after: { k: 'Igen! A pénz fémből van, és a fém vezet.', m: 'A pénzérme fém, a fémek jól vezetnek, ezért a LED fényesen ég, mint az alufóliánál.', n: 'A fémek ellenállása nagyon kicsi (az érméé néhány ezred ohm), így a kör áramát csak az R1 és a LED korlátozza.' },
  },
  series: {
    q: { k: 'Ha három izzót kötnél egymás után, milyen fényesek lennének?', m: 'Ha egy harmadik izzót is sorba kötnél a kettő mellé, mi történne a fényükkel?', n: 'Mi történik a fényerővel, ha sorosan még egy izzót kötsz a körbe?' },
    opts: [['Még halványabbak', 'dim'], ['Ugyanolyanok', 'same'], ['Fényesebbek', 'on']], right: 0,
    after: { k: 'Igen! Minél több izzó van egymás után, annál kevesebb jut egynek.', m: 'Sorosan mindegyik izzó fékezi az áramot, és az elem feszültségén is osztoznak: hárman még kevesebbet kapnak.', n: 'A soros ellenállások összeadódnak, az áram csökken, és minden izzóra kisebb feszültség jut: a fényerő tovább csökken.' },
  },
  dimmer: {
    q: { k: 'Ha a tekerő helyére a nagy, 100 kΩ-os ellenállást teszed, milyen lesz a lámpa?', m: 'Mi történik, ha az RV helyett az R5-öt (100 kΩ) kötöd be?', n: 'Mekkora lesz nagyjából a LED árama, ha az RV helyett az R5 (100 kΩ) van a körben?' },
    opts: [['Nagyon halvány vagy sötét', 'dim'], ['Ugyanolyan fényes', 'same'], ['Fényesebb', 'on']], right: 0,
    after: { k: 'Igen! A nagy ellenállás nagyon fékezi az áramot.', m: 'A 100 kΩ még a tekerő legnagyobb állásánál is nagyobb fék, ezért a LED alig vagy egyáltalán nem világít.', n: 'I ≈ (3 V − 1,8 V) / 100 kΩ ≈ 12 µA: ezt a mérő még mutatja, de a LED-en nem látszik.' },
  },
  generator: {
    q: { k: 'Ha gyorsabban pörgeted a motort, mit csinál a mutató?', m: 'Mi történik a mérő kitérésével, ha gyorsabban forgatod a motort?', n: 'Hogyan függ a motor által termelt feszültség a fordulatszámtól?' },
    opts: [['Jobban kitér', 'on'], ['Ugyanannyit', 'same'], ['Kevésbé tér ki', 'dim']], right: 0,
    after: { k: 'Igen! Gyorsabb pörgetés, több áram.', m: 'Minél gyorsabban forog a tekercs a mágnes mellett, annál nagyobb feszültséget kelt.', n: 'A keltett feszültség arányos a fordulatszámmal (U = k·ω): kétszer gyorsabban kétszer akkora.' },
  },
  capbat: {
    q: { k: 'Ha az ellenállást egy nagyobbra cseréled, mi lesz a lámpával feltöltés után?', m: 'Ha az R2 (1 kΩ) helyett az R4-et (10 kΩ) teszed be, mi változik?', n: 'Hogyan változik a LED fénye és a világítás ideje, ha az R2 helyére 10 kΩ kerül?' },
    opts: [['Halványabb, de tovább világít', 'fade'], ['Fényesebb, és tovább világít', 'on'], ['Ugyanolyan', 'same']], right: 0,
    after: { k: 'Igen! A nagyobb fék miatt lassabban fogy a tartály, de kevesebb jut a lámpának.', m: 'A nagyobb ellenálláson kevesebb áram folyik: a LED halványabb, de a kondenzátor lassabban ürül ki.', n: 'Tízszer nagyobb ellenállással kb. tizedannyi az áram, és kb. tízszer tovább tart a kisülés (τ = R·C).' },
  },
  motorspeed: {
    q: { k: 'Ha a motor helyére a kis izzót (L1) teszed, mit csinál a tekerő?', m: 'Ha a motor helyére az izzót (L1) teszed, mit állít majd a tekerő?', n: 'A motor itt a második tranzisztor emitterkörében van. Mit állít a tekerő, ha a motor helyére az L1 izzó kerül?' },
    opts: [['Az izzó fényét', 'dim'], ['Az izzó csak villogni fog', 'blink'], ['Az izzó nem világít', 'off']], right: 0,
    after: { k: 'Igen! A tekerő most az izzó fényét állítja.', m: 'A tranzisztorok nem csak a motort tudják szabályozni: az izzónál a fényerőt. A teljes fényét nem éri el, mert a két tranzisztor elvesz egy kis feszültséget.', n: 'Emitterkövetőként a kimenet kb. a csúszka feszültsége mínusz 1,3 V, így az izzóra legfeljebb kb. 1,7 V jut (a szimulációban kb. 90 mA): halványabb, de folyamatosan állítható. Egy LED-nek ez kevés lenne, mert neki ellenállással együtt ennél több feszültség kell.' },
  },
  night: {
    q: { k: 'Ha a felső ellenállás helyére egy nagyobbat teszel, mikor gyullad ki a lámpa?', m: 'Mi történik, ha az R3 (5,1 kΩ) helyére az R5-öt (100 kΩ) teszed?', n: 'Hogyan változik a bekapcsolási fényszint, ha az R3 helyére 100 kΩ kerül?' },
    opts: [['Csak még sötétebben', 'dim'], ['Már világosban is', 'on'], ['Semmi nem változik', 'same']], right: 0,
    after: { k: 'Igen! Most a szemnek könnyebb elvezetni a kicsi áramot, ezért csak nagy sötétben gyullad ki.', m: 'A nagyobb ellenálláson kevesebb áram jut a bázishoz, ezt a fototranzisztor már kis fénynél is el tudja vezetni. Ezért csak sötétebben gyullad ki, és halványabb is lesz.', n: 'A bázisra jutó áram kb. 2,3 V / 100 kΩ ≈ 23 µA; ennyit a fototranzisztor már gyenge fénynél is elvezet. A küszöb sötétebb fény felé tolódik, a LED-áram pedig legfeljebb β · 23 µA.' },
  },
  touch: {
    q: { k: 'Ha nedves ujjal érsz hozzá, mi lesz?', m: 'Mi történik, ha nedves ujjal érinted meg a két pontot?', n: 'Hogyan változik a bázisáram, ha nedves a bőröd?' },
    opts: [['Könnyebben kigyullad', 'on'], ['Nem gyullad ki', 'off'], ['Villogni kezd', 'blink']], right: 0,
    after: { k: 'Igen! A nedves bőr jobban vezet.', m: 'A nedves bőr ellenállása kisebb, ezért több áram jut a tranzisztorhoz, és biztosabban kigyullad a lámpa.', n: 'A bőr ellenállása nedvesen sokszor kisebb, így a bázisáram nő; a LED áramát továbbra is az R1 korlátozza.' },
  },
  water: {
    q: { k: 'Ha csak az egyik kábelvég ér a vízbe, világít a lámpa?', m: 'Mi történik, ha csak az egyik kábelvég ér bele a vízbe?', n: 'Mi lesz a bázisárammal, ha csak az egyik kábelvég ér a vízbe?' },
    opts: [['Nem világít', 'off'], ['Világít', 'on'], ['Halványan világít', 'dim']], right: 0,
    after: { k: 'Igen! Az áramnak az egyik kábelen be, a másikon ki kell jutnia. Egy kábel nem elég.', m: 'Az áramnak zárt kör kell: a vízen át az egyik kábelvégtől a másikig. Ha csak az egyik ér bele, a kör nyitva van.', n: 'Nyitott körben nem folyik bázisáram, így mindkét tranzisztor zárva marad.' },
  },
  daylamp: {
    q: { k: 'Ha a szem helyére egy ellenállást (R4) teszel, mikor világít a lámpa?', m: 'Mi történik, ha a Q4 helyére az R4-et (10 kΩ) teszed?', n: 'Mi lesz, ha a fototranzisztor helyére egy 10 kΩ-os ellenállás kerül?' },
    opts: [['Mindig világít, fénytől függetlenül', 'on'], ['Sosem világít', 'off'], ['Csak sötétben világít', 'dim']], right: 0,
    after: { k: 'Igen! Az ellenállás nem lát, mindig ugyanúgy húzza a kart.', m: 'Az ellenállás mindig ugyanannyira húzza a bázist a − felé, nem függ a fénytől: a lámpa mindig ég.', n: 'Az R4-en kb. 0,23 mA folyik a (−) felé, ebből kb. 0,14 mA-t az R3 ad, a maradék kb. 0,09 mA a bázisból jön; ennek β-szorosa már telíti a Q1-et.' },
  },
  shadow: {
    q: { k: 'Ha éjszaka lekapcsolod a villanyt a szobában, mit csinál a riasztó?', m: 'Mi történik, ha teljesen besötétedik a szobában?', n: 'Miért nem jó ez a kapcsolás egy sötét szobában?' },
    opts: [['Folyamatosan szól', 'sound'], ['Csendben marad', 'off'], ['Villogni kezd a LED', 'blink']], right: 0,
    after: { k: 'Igen! A riasztó a sötétet árnyéknak hiszi.', m: 'A riasztó nem tudja megkülönböztetni az árnyékot a sötét szobától: sötétben mindig szól.', n: 'A kapcsolás csak a fény erősségét figyeli, nem a változását. Ezért használnak a valódi fénysorompók egy saját, villogó fényforrást (mint az U24 infravevő a távirányítóval).' },
  },
  delay: {
    q: { k: 'Ha két nagy kondenzátort teszel egymás mellé, meddig ég a lámpa?', m: 'Ha a C5 mellé egy második 470 µF-os kondenzátort kötsz párhuzamosan, mi változik?', n: 'Hogyan változik a késleltetés, ha a C5-tel párhuzamosan még egy 470 µF-os kondenzátor kerül a körbe?' },
    opts: [['Tovább ég', 'slow'], ['Rövidebb ideig', 'fade'], ['Ugyanannyi ideig', 'same']], right: 0,
    after: { k: 'Igen! Két tartályban több fér el.', m: 'Két kondenzátor együtt kétszer annyi töltést tárol, ezért kb. kétszer tovább tartja nyitva a tranzisztort.', n: 'Párhuzamosan a kapacitások összeadódnak (940 µF), így τ = R·C, és vele a késleltetés is kb. kétszeresére nő.' },
  },
  flipflop: {
    q: { k: 'Ha kikapcsolod és újra bekapcsolod, emlékszik, melyik lámpa égett?', m: 'Mi történik, ha az S1-et kikapcsolod, majd újra bekapcsolod?', n: 'Megmarad-e a flip-flop állapota a táp kikapcsolása után?' },
    opts: [['Elfelejti: bármelyik kigyulladhat', 'same'], ['Emlékszik: ugyanaz gyullad ki', 'on'], ['Egyik sem gyullad ki', 'off']], right: 0,
    after: { k: 'Igen! Áram nélkül elfelejti.', m: 'Az emlékező lámpa csak addig emlékszik, amíg kap áramot. Bekapcsoláskor az a tranzisztor nyer, amelyik egy hajszállal gyorsabb.', n: 'Ez „felejtő” memória: az állapotot csak a két tranzisztor egymást tartó árama őrzi. A számítógép munkamemóriája (RAM) is ilyen, ezért vész el kikapcsoláskor.' },
  },
  and: {
    q: { k: 'Ha három gomb lenne egymás után, hányat kellene megnyomni?', m: 'Ha egy harmadik gombot is beépítenél ugyanígy, sorban, mikor gyulladna ki a LED?', n: 'Mit valósít meg három, ugyanígy sorba kötött bemenet?' },
    opts: [['Mind a hármat', 'on'], ['Bármelyiket', 'blink'], ['Kettő is elég', 'same']], right: 0,
    after: { k: 'Igen! Mindegyiknek nyitva kell lennie, hogy átjusson az áram.', m: 'Egymás után kötve minden gombnak zárva kell lennie, különben megszakad a kör.', n: 'Háromszoros ÉS-kaput: a kimenet csak akkor igaz, ha mindhárom bemenet igaz.' },
  },
  or: {
    q: { k: 'Ha három gomb lenne egymás mellett, hányat kellene megnyomni?', m: 'Ha egy harmadik gombot is párhuzamosan kötnél a kettő mellé, mikor gyulladna ki a LED?', n: 'Mit valósít meg három párhuzamos bemenet?' },
    opts: [['Bármelyik egy elég', 'on'], ['Mind a hármat', 'same'], ['Egyik sem működne', 'off']], right: 0,
    after: { k: 'Igen! Bármelyik gomb kinyit egy utat az áramnak.', m: 'Párhuzamosan mindegyik gomb külön utat ad az áramnak: egy is elég.', n: 'Háromszoros VAGY-kaput: a kimenet igaz, ha legalább az egyik bemenet igaz.' },
  },
  not: {
    q: { k: 'Ha két ilyen fordítót kötsz egymás után, mit csinál a lámpa, ha megnyomod a gombot?', m: 'Ha egy fordító kimenete egy második fordítót vezérel, mit csinál a második lámpája gombnyomásra?', n: 'Mi a két egymás után kötött NEM-kapu eredménye?' },
    opts: [['Kigyullad, mint egy sima kapcsolónál', 'on'], ['Mindig ég', 'same'], ['Sosem ég', 'off']], right: 0,
    after: { k: 'Igen! Kétszer megfordítva visszajön az eredeti.', m: 'Az első fordító megfordítja, a második visszafordítja: olyan lesz, mintha egy sima kapcsoló lenne.', n: 'NEM(NEM(A)) = A: két fordító egymás után az eredeti jelet adja (ezt erősítő-pufferként is használják).' },
  },
  flash: {
    q: { k: 'Ha a nagy kondenzátorok helyett nagyon kicsiket teszel be, mit látsz?', m: 'Mi történik, ha mindkét C4 (100 µF) helyett C2-t (0,1 µF) teszel be?', n: 'Mi lesz a villogással, ha a kapacitás ezredrészére csökken?' },
    opts: [['Mindkét lámpa folyamatosan égni látszik', 'on'], ['Lassabban villog', 'slow'], ['Kialszanak', 'off']], right: 0,
    after: { k: 'Igen! Olyan gyorsan villog, hogy a szemed már nem tudja követni.', m: 'Ezerszer kisebb kondenzátorral ezerszer gyorsabban villog: a szemünk ezt folyamatos (kicsit halványabb) fénynek látja. Hangszóróval hangot hallanál!', n: 'A frekvencia kb. ezerszeresére nő (néhány kHz), a szem kb. 50 Hz fölött már nem látja a villogást: mindkét LED kb. félerővel égni látszik.' },
  },
  metronome: {
    q: { k: 'Ha a két 5,1 kΩ-os ellenállást 10 kΩ-osra cseréled, gyorsabban vagy lassabban kattog?', m: 'Hogyan változik a kattogás, ha a két R3 (5,1 kΩ) helyett R4-et (10 kΩ) teszel be?', n: 'Hogyan függ a metronóm üteme a bázisellenállásoktól?' },
    opts: [['Lassabban kattog', 'slow'], ['Gyorsabban kattog', 'blink'], ['Ugyanúgy', 'same']], right: 0,
    after: { k: 'Igen! A nagyobb fék lassabban tölti a kondenzátort.', m: 'A kondenzátor a bázisellenálláson át töltődik. Nagyobb ellenálláson lassabban, ezért ritkábban kattog.', n: 'A félperiódus ≈ 0,69 · R · C, tehát az R kétszerezése kb. kétszer hosszabb ütemet ad.' },
  },
  sound: {
    q: { k: 'Ha a kicsi kondenzátorok helyett nagyokat teszel be, mit hallasz?', m: 'Mi történik, ha a két C2 (0,1 µF) helyett C4-et (100 µF) teszel be?', n: 'Mi lesz a hangból, ha a kapacitás ezerszeresére nő?' },
    opts: [['Hang helyett lassú kattogás', 'slow'], ['Magasabb hang', 'sound'], ['Ugyanaz a hang', 'same']], right: 0,
    after: { k: 'Igen! Visszakapod a metronómot.', m: 'Nagy kondenzátorral ezerszer lassabb lesz, mint a villogónál: hang helyett külön kattanásokat hallasz.', n: 'Néhány kHz helyett néhány Hz: a hangszóró már nem hangot ad, hanem egyedi kattanásokat (ez a metronóm).' },
  },
  organ: {
    q: { k: 'Ha nyomva tartod a billentyűt, és közben lassan tekersz, mit hallasz?', m: 'Mi történik, ha a billentyűt nyomva tartod, és közben forgatod a tekerőt?', n: 'Mit hallasz, ha a hang szólása közben folyamatosan változtatod az RV-t?' },
    opts: [['A hang fel vagy le csúszik', 'sound'], ['Elhallgat', 'off'], ['Kattogni kezd', 'slow']], right: 0,
    after: { k: 'Igen! Mint amikor egy csúszós hangot fütyülsz.', m: 'A tekerő folyamatosan változtatja a töltődés sebességét, ezért a hang folyamatosan magasabb vagy mélyebb lesz.', n: 'A frekvencia folytonosan követi az ellenállást: ez egy feszültség- vagy ellenállás-vezérelt oszcillátor, a szirénák és a szintetizátorok alapja.' },
  },
  siren: {
    q: { k: 'Ha a nagy kondenzátor helyett egy kisebbet teszel be, milyen lesz a sziréna?', m: 'Mi változik, ha a C5 (470 µF) helyett a C4-et (100 µF) teszed be?', n: 'Hogyan változik a felfutás és a lecsengés ideje kisebb vezérlő-kondenzátorral?' },
    opts: [['Gyorsabban fut fel és cseng le', 'sound'], ['Lassabban', 'slow'], ['Nem szól', 'off']], right: 0,
    after: { k: 'Igen! A kis tartály hamar megtelik és hamar kiürül.', m: 'A kisebb kondenzátor gyorsabban töltődik és sül ki, ezért a hang gyorsabban emelkedik és ereszkedik.', n: 'A vezérlőkör időállandója az R · C-vel arányos: kb. ötödére csökken.' },
  },
  clap: {
    q: { k: 'Ha a felső ellenállást kisebbre cseréled, mi lesz?', m: 'Mi történik, ha az R4 (10 kΩ) helyett az R3-at (5,1 kΩ) teszed be?', n: 'Hogyan változik a bekapcsolási küszöb, ha a felső ellenállás 5,1 kΩ-ra csökken?' },
    opts: [['Érzékenyebb: halkabb hangra is villan', 'sound'], ['Kevésbé érzékeny', 'dim'], ['Semmi nem változik', 'same']], right: 0,
    after: { k: 'Igen! Kisebb hang is elég lesz.', m: 'A kisebb felső ellenállás több feszültséget ad a bázisra, ezért a mikrofon kisebb változása is elég a bekapcsoláshoz.', n: 'A küszöb ott van, ahol U_B ≈ 0,6 V: R_X1 ≈ R_felső / 4. 10 kΩ-nál ez kb. 2,5 kΩ, 5,1 kΩ-nál kb. 1,3 kΩ, vagyis sokkal kisebb hangnyomás is elég.' },
  },
  amp: {
    q: { k: 'Ha csak egy tranzisztor lenne kettő helyett, milyen hangos lenne?', m: 'Ha a két tranzisztor helyett csak egyet használnál, hogyan szólna?', n: 'Hogyan változik az erősítés, ha a Darlington-pár helyett egyetlen tranzisztor marad?' },
    opts: [['Halkabban', 'dim'], ['Hangosabban', 'sound'], ['Ugyanúgy', 'same']], right: 0,
    after: { k: 'Igen! Két nagyító jobban nagyít, mint egy.', m: 'A két tranzisztor egymás után sokkal jobban erősít. Eggyel kisebb az erősítés, ezért halkabb a hang.', n: 'A Darlington-pár áramerősítése kb. β², egy tranzisztoré csak β, így az erősítés jóval kisebb (a visszacsatolás miatt nem pontosan század, de jelentősen).' },
  },
  lightlink: {
    q: { k: 'Ha a fénykábelt nagyon élesen meghajlítod, mi lesz a hanggal?', m: 'Mi történik, ha az üvegszálat nagyon élesen megtöröd?', n: 'Miért gyengül a jel, ha az üvegszálat élesen meghajlítod?' },
    opts: [['Halkabb lesz vagy elhallgat', 'dim'], ['Hangosabb lesz', 'sound'], ['Semmi nem változik', 'same']], right: 0,
    after: { k: 'Igen! Az éles kanyarban a fény kiszökik a kábelből.', m: 'A fény a kábel falán pattogva halad. Éles kanyarnál már nem pattan vissza, hanem kiszökik, ezért kevesebb jut a vevőhöz.', n: 'A teljes visszaverődéshez a fénynek elég lapos szögben kell a falra érkeznie; éles hajlításnál ez megszűnik, és a fény nagy része kilép (a Light kézikönyve is így magyarázza).' },
  },
  u23: {
    q: { k: 'Ha a CTL lábhoz kisebb ellenállást kötsz, hogyan villog?', m: 'Mi történik, ha a CTL-en lévő R5 (100 kΩ) helyére az R4-et (10 kΩ) teszed?', n: 'Hogyan változik a villogás frekvenciája, ha a CTL ellenállása tizedére csökken?' },
    opts: [['Gyorsabban villog', 'blink'], ['Lassabban villog', 'slow'], ['Kialszik', 'off']], right: 0,
    after: { k: 'Igen! Több áram, gyorsabb villogás.', m: 'Kisebb ellenálláson több áram folyik a CTL-be, és az IC ettől gyorsabban villog, mint a villogód kisebb ellenállással.', n: 'A modellünkben a frekvencia a CTL áramával arányos, így kb. tízszeresére nő, és a villogás már folyamatos fénynek látszik.' },
  },
  d8: {
    q: { k: 'Ha a színes lámpát fordítva teszed be, mi lesz?', m: 'Mi történik, ha a D8-at fordítva (a + jellel a − felé) kötöd be?', n: 'Mi lesz, ha a D8 polaritását megfordítod?' },
    opts: [['Nem világít', 'off'], ['Visszafelé váltja a színeket', 'blink'], ['Ugyanúgy világít', 'same']], right: 0,
    after: { k: 'Igen! A LED csak egy irányban engedi át az áramot.', m: 'A színes LED is LED: fordítva nem enged át áramot, így a benne lévő vezérlő sem kap tápot.', n: 'A LED-chipek és a vezérlő zárófeszültséget kapnak; 3 V-on ez nem árt nekik, de nem folyik áram.' },
  },
  u2: {
    q: { k: 'Ha a hangszóró helyett egy lámpát teszel be (ellenállással), mit látsz?', m: 'Mi történik, ha a hangszóró helyére a LED-et és az R1-et kötöd?', n: 'Mit mutat egy LED az U2 kimenetén a hangszóró helyett?' },
    opts: [['A lámpa világít (nagyon gyorsan villog)', 'on'], ['Semmi', 'off'], ['A lámpa lassan villog', 'slow']], right: 0,
    after: { k: 'Igen! A riasztó most a lámpát kapcsolgatja, csak olyan gyorsan, hogy folyamatosnak látod.', m: 'Az IC ugyanúgy kapcsolgat, csak most a LED-et. Hangmagasságú ütemben, ezért a szemed folyamatos fénynek látja.', n: 'A kimenet több száz Hz-en kapcsol, ezt a szem nem látja villogásnak, csak átlagos fényerőnek.' },
  },
  u3: {
    q: { k: 'Az első hangtól indulsz, és kilencszer nyomod meg a gombot. Melyik hang szól?', m: 'Az első hangtól indulva kilencszer megnyomod az S2-t. Hányadik hang szól?', n: 'Melyik állapotba kerül a 3 bites számláló 9 lépés után, ha 0-ról indult?' },
    opts: [['A második', 'sound'], ['Az első', 'same'], ['Egy új, kilencedik', 'on']], right: 0,
    after: { k: 'Igen! Nyolc után újrakezdi, és még egyet lép.', m: 'Nyolc hangja van: a nyolcadik nyomás után újra az első jön, a kilencedik után a második.', n: '9 mod 8 = 1: a számláló 0-ról 9 lépés után az 1-es állapotban van, ami a második hang.' },
  },
  u1: {
    q: { k: 'Ha a hangszóró helyett egy lámpát teszel be (ellenállással), mit csinál zene közben?', m: 'Mi történik, ha a hangszóró helyére a LED-et és az R1-et kötöd?', n: 'Mit mutat egy LED a zene IC kimenetén?' },
    opts: [['A zene ütemére villog', 'blink'], ['Folyamatosan ég', 'on'], ['Nem világít', 'off']], right: 0,
    after: { k: 'Igen! Minden hangnál felvillan, a szünetekben elalszik.', m: 'A hangok alatt az IC kapcsolgat, a szünetekben nem. A LED így a dallam ritmusában villog.', n: 'Hang közben a kimenet hangfrekvencián kapcsol (a szem átlagnak látja), szünetben nyitva van: a LED a dallam ritmusát mutatja.' },
  },
  u32: {
    q: { k: 'Ha a mérőt kiveszed, és a helyére egy vezetéket teszel, szól tovább a zene?', m: 'Mi változik, ha a mérőműszer helyére egy vezetéket teszel?', n: 'Mennyit változtat a működésen a mérő 50 mA-es állása?' },
    opts: [['Ugyanúgy szól', 'same'], ['Elhallgat', 'off'], ['Hangosabban szól', 'sound']], right: 0,
    after: { k: 'Igen! A mérő csak megmutatja az áramot, nem kell a zenéhez.', m: 'A mérőműszer úgy van kitalálva, hogy szinte ne zavarja az áramot. Nélküle is ugyanúgy szól.', n: 'Áramállásban a mérő belső ellenállása kicsi (néhány ohm) a dallam IC-éhez képest, ezért alig változtat a körön.' },
  },
  u4: {
    q: { k: 'Ha a mikrofon helyére a fényt érző szemet teszed, és előtte villogtatsz egy lámpát, mit hallasz?', m: 'Mi történik, ha a mikrofon helyére a fototranzisztort (Q4) teszed, és előtte egy lámpát villogtatsz?', n: 'Mit hallasz, ha a mikrofon helyett a Q4 fototranzisztor van a bemeneten, és változó fény éri?' },
    opts: [['Hallod a fény villogását', 'sound'], ['Semmi nem hallatszik', 'off'], ['A lámpa elalszik', 'dim']], right: 0,
    after: { k: 'Igen! Az erősítő mindent felerősít, ami változik: most a fényt.', m: 'Az erősítőnek mindegy, honnan jön a változás. A fototranzisztor a fény változását alakítja árammá, és az U4 ezt hallhatóvá teszi, mint a fénytávírónál.', n: 'A Q4 és az R2 osztója a fényerővel arányos feszültséget ad, ennek változását az U4 erősíti: a villogás frekvenciáján szól a hangszóró.' },
  },
  u22: {
    q: { k: 'Ha a mikrofon helyére a nyomógombot teszed, mi lesz?', m: 'Mi történik, ha a mikrofon helyére az S2 nyomógombot kötöd?', n: 'Mit csinál a fényorgona, ha az INP és a (−) közé a mikrofon helyett nyomógomb kerül?' },
    opts: [['Minden gombnyomásra színt vált', 'blink'], ['Folyamatosan villog', 'on'], ['Nem vált színt', 'same']], right: 0,
    after: { k: 'Igen! A gomb is ki-be kapcsol, mint a hang.', m: 'A gomb lenyomása és elengedése ugyanúgy le- és felhúzza a bemenetet, mint egy hang a mikrofonban. Minden nyomásra lép egyet.', n: 'Az R3 felhúzza az INP-t, a gomb a (−)-ra húzza: elengedéskor felfutó él jön, és a számláló egyet lép.' },
  },
  u24: {
    q: { k: 'Ha a lámpa helyére hangszórót teszel (ellenállással), mit hallasz, ha nyomod a távirányítót?', m: 'Mi történik, ha a LED helyett a hangszórót és az R1-et kötöd be, és megnyomod a távirányítót?', n: 'Mit hallasz, ha az U24 kimenetére LED helyett hangszóró kerül?' },
    opts: [['Zümmögést, amíg nyomod', 'sound'], ['Semmit', 'off'], ['Folyamatos sípolást, akkor is, ha nem nyomod', 'on']], right: 0,
    after: { k: 'Igen! Hallod a távirányító titkos üzenetét.', m: 'A kimenet a távirányító villanássorozatának ütemében kapcsol, ezt a hangszóró zümmögésként adja vissza.', n: 'A demodulált kódjel (ezredmásodperces impulzusok) hangfrekvenciás tartományba esik, ezért hallható; a Light kézikönyvében is van ilyen kapcsolás.' },
  },
  u5: {
    q: { k: 'Ha a hangolót a másik végére tekered, mit hallasz?', m: 'Mi történik, ha a forgókondenzátort a másik végállásba tekered?', n: 'Mit veszel nappal, ha a hangolást a sáv felső végére (kb. 1100 kHz) állítod?' },
    opts: [['Csak sistergést', 'off'], ['Hangosabban a Kossuthot', 'sound'], ['Teljes csendet', 'dim']], right: 0,
    after: { k: 'Igen! Ott most nincs adó, csak sistereg.', m: 'A Kossuth csak egy frekvencián szól. Máshová hangolva csak a zajt hallod. Este külföldi adók is bejöhetnek!', n: 'Kisebb kapacitással nagyobb a rezonanciafrekvencia; ott nappal nincs erős középhullámú adó, csak a légköri és elektromos zaj. Este, a jobb terjedés miatt távoli adók is foghatók.' },
  },
};
for (const ex of EXPS) if (CHECKS[ex.id]) ex.check = CHECKS[ex.id];

const CHAPTERS = [
  { id: 'A', title: 'Áram és alkatrészek', short: 'Alapok' },
  { id: 'B', title: 'Energia és mozgás', short: 'Energia' },
  { id: 'C', title: 'Érzékelők', short: 'Érzékelők' },
  { id: 'D', title: 'Idő, memória, döntés', short: 'Idő és döntés' },
  { id: 'E', title: 'Rezgések és hangok', short: 'Rezgések' },
  { id: 'F', title: 'Fény és hang továbbítása', short: 'Továbbítás' },
  { id: 'G', title: 'A fekete dobozok kinyitása', short: 'Fekete dobozok' },
];
const ORDER = ['first', 'conduct', 'series', 'dimmer', 'generator', 'capbat', 'motorspeed', 'night', 'daylamp', 'touch', 'water', 'shadow', 'delay', 'flipflop', 'and', 'or', 'not', 'flash', 'metronome', 'sound', 'organ', 'siren', 'clap', 'amp', 'lightlink', 'u23', 'd8', 'u2', 'u3', 'u1', 'u32', 'u4', 'u22', 'u24', 'u5'];
EXPS.sort((x, y) => ORDER.indexOf(x.id) - ORDER.indexOf(y.id));

// ===================== Alkatrész-album: ismerkedés az alkatrészekkel =====================
// Minden kártya egy kis próbapad (valódi szimulációval), magyarázat három szinten, rajzjel, hasonlat és egy kérdés.
// A helyes válasz után a kártya „matrica” lesz az albumban.
// Mezők: intro = Mi ez?, hint = Próbáld ki, why = Hogyan működik?, check = kérdés; variants: egyszerre csak egy lehet bekapcsolva.
const swapP = (from, to) => (lay) => lay.map((p) => (p.p === from ? { ...p, p: to } : p));
const CARDS = [
  {
    id: 'p_bat', part: 'B1', symbol: 'bat', title: 'Elem', tag: 'Ez hajtja az áramot',
    analogy: 'Szivattyú: körbe hajtja az áramot a vezetékekben.',
    layout: LAY.bench_bat, sim: { dt: 0.002, scale: 1, meter: { M6: '5V' } }, controls: ['S1', { meter: 'M6', ranges: ['5V'] }], probes: [],
    intro: { k: 'Az elem adja az áramot. Olyan, mint egy kis szivattyú, ami körbe hajtja az áramot. Két vége van: a + és a −.', m: 'Az elemtartóban két ceruzaelem van egymás után, együtt 3 voltot adnak. Az áram a + végéből indul, végigmegy az áramkörön, és a − végébe érkezik vissza.', n: 'A B1 két sorba kötött AA cella (2 × 1,5 V = 3 V). A feszültség a hajtóerő; itt a mérő 5 V-os állásban, az elemmel párhuzamosan méri. Nagy áramnál a belső ellenállás miatt a kapocsfeszültség kicsit csökken.' },
    hint: { k: 'Kapcsold be az S1-et, és nézd a mutatót! A mérő gombja maradjon az 5 V-on.', m: 'Kapcsold be az S1-et: a mérő megmutatja, hány voltot ad az elem. A mérőt csak 5 V-os állásban használd, áramállásban rövidre zárná az elemet!', n: 'Olvasd le a feszültséget. Mennyi lenne két elemtartóval sorba kötve? És párhuzamosan? (A mérő itt csak 5 V-os állásban lehet: áramállásban szinte nincs ellenállása, és rövidre zárná az elemet.)' },
    why: { k: 'Az elemben különböző anyagok találkoznak, és ettől indul az áram. Ha az anyag elfogy, az elem lemerül.', m: 'Az elemben két különböző anyag van, közöttük vegyi folyamat zajlik. Ez tolja az áramot a + felől a − felé az áramkörön keresztül. Ha lemerül, kisebb lesz a feszültsége.', n: 'Az elektrokémiai cella a kémiai energiát alakítja elektromossá. Sorba kötött cellák feszültsége összeadódik, a párhuzamosaké nem (csak tovább bírják). A My Home dobozban 3 elemes tartó van (B3, 4,5 V).' },
    check: {
      q: { k: 'Ha két elemtartót kötsz egymás után, többet vagy kevesebbet mutatna a mérő?', m: 'Mit mutatna a mérő két sorba kötött elemtartóval?', n: 'Mekkora két sorba kötött B1 feszültsége?' },
      opts: [['Kétszer annyit (6 V)', 'on'], ['Ugyanannyit (3 V)', 'same'], ['Kevesebbet', 'dim']], right: 0,
      after: { k: 'Igen! Egymás után a feszültségük összeadódik.', m: 'Sorba kötve a feszültségek összeadódnak: 3 V + 3 V = 6 V. Ezért van a fényorgonánál két elemtartó.', n: 'U = 3 V + 3 V = 6 V. Párhuzamosan 3 V maradna, csak a tárolt energia lenne kétszeres.' },
    },
  },
  {
    id: 'p_wire', part: 'W3', symbol: 'wire', title: 'Vezeték', tag: 'Ezen az úton megy az áram',
    analogy: 'Cső: ebben folyik az áram.',
    layout: LAY.first, sim: { dt: 0.001, scale: 1 }, controls: ['S1'], probes: [{ ids: ['D1'], label: 'Áram a körben' }],
    intro: { k: 'A kék vezetékek az utak, ezeken megy az áram. Ha egy út megszakad, az áram nem jut el a lámpáig.', m: 'A kék vezetékekben fém van, ezen halad az áram. A rajtuk lévő szám (1–7) azt mutatja, hány pattintógomb van rajtuk.', n: 'A vezeték jó közelítéssel nulla ellenállású összeköttetés: a két végén ugyanakkora a feszültség. Ami egy vezetéken van, az egyetlen csomópont.' },
    hint: { k: 'Kapcsold be, és kövesd ujjal a sárga pöttyöket: körbe mennek!', m: 'Kapcsold be az S1-et, és kövesd a pöttyöket az elem + végétől a − végéig. Látod, hogy kör?', n: 'Kapcsold be, és koppints a rács pontjaira: egy vezeték minden pontján ugyanaz a feszültség.' },
    why: { k: 'Az áram csak körben tud menni: ki az elemből, át a lámpán, és vissza az elembe.', m: 'Az áram zárt körben folyik. Ha bárhol megszakad a kör, mindenhol megáll. Ezért fontos, hogy minden pattintás jól üljön.', n: 'Kirchhoff áramtörvénye: egy csomópontba befolyó áramok összege egyenlő a kifolyókéval. Zárt kör nélkül nincs áram.' },
    check: {
      q: { k: 'Ha egy vezetéket kiveszel a körből, mi lesz a lámpával?', m: 'Mi történik, ha a kör egyik vezetékét kiveszed?', n: 'Mekkora lesz az áram, ha a kör egy helyen megszakad?' },
      opts: [['Elalszik', 'off'], ['Halványabb lesz', 'dim'], ['Ugyanúgy ég', 'same']], right: 0,
      after: { k: 'Igen! Megszakad az út, és az áram megáll.', m: 'Ha a kör megszakad, az áram mindenhol megáll, nem csak ott, ahol a lyuk van.', n: 'Nulla: nyitott körben nem folyik áram, a teljes elemfeszültség a szakadás két oldala között jelenik meg.' },
    },
  },
  {
    id: 'p_sw', part: 'S1', symbol: 'sw', title: 'Kapcsoló és nyomógomb', tag: 'Kinyitja és elzárja az utat',
    analogy: 'Csap vagy híd: átengedi az áramot, vagy elzárja előle az utat.',
    layout: LAY.first, sim: { dt: 0.001, scale: 1 }, controls: ['S1', { press: 'S2', label: 'S2 nyomógomb' }], probes: [{ ids: ['D1'], label: 'Áram a körben' }],
    variants: [{ id: 'press', label: 'Nyomógomb a tolókapcsoló helyett', real: 'Cseréld a tolókapcsolót (S1) a nyomógombra (S2).', apply: swapP('S1', 'S2') }],
    intro: { k: 'A kapcsolóval be- és kikapcsolod a lámpát. A tolókapcsoló bekapcsolva marad, a nyomógomb csak addig, amíg nyomod.', m: 'A tolókapcsoló (S1) két állású: be vagy ki, és úgy is marad. A nyomógomb (S2) csak addig köt össze, amíg nyomod, mint a csengő gombja.', n: 'Mindkettő egy fémes érintkező, ami zárja vagy bontja a kört. Zárva szinte nulla, nyitva szinte végtelen az ellenállása.' },
    hint: { k: 'Kapcsold be és ki a kapcsolót. Aztán próbáld ki a nyomógombbal is!', m: 'Kapcsolgasd az S1-et. Aztán cseréld nyomógombra, nyomd meg, majd engedd el.', n: 'Hasonlítsd össze a kettőt: melyik kell egy villanyhoz, és melyik egy csengőhöz?' },
    why: { k: 'A kapcsoló olyan, mint egy kis híd. Bekapcsolva átengedi az áramot, kikapcsolva felhúzza a hidat.', m: 'A kapcsoló belsejében két fémlemez van. Bekapcsolva összeérnek, és az áram átjut. Kikapcsolva szétválnak, és a kör megszakad.', n: 'A tolókapcsoló bistabil (mindkét állapotában megmarad), a nyomógomb monostabil (rugó viszi vissza). Az emlékező lámpa (flip-flop) elektronikusan csinál két nyomógombból egy tolókapcsolót.' },
    check: {
      q: { k: 'Melyik kell egy csengőhöz: a tolókapcsoló vagy a nyomógomb?', m: 'Egy ajtócsengőbe melyiket tennéd?', n: 'Melyik kell egy csengőhöz, és miért?' },
      opts: [['A nyomógomb', 'sound'], ['A tolókapcsoló', 'on'], ['Mindegy', 'same']], right: 0,
      after: { k: 'Igen! A csengő csak addig szól, amíg nyomod.', m: 'A nyomógomb: elengedéskor magától kikapcsol, így a csengő nem szól tovább.', n: 'A nyomógomb, mert monostabil: elengedve a rugó bontja a kört.' },
    },
  },
  {
    id: 'p_led', part: 'D1', symbol: 'led', title: 'LED', tag: 'Egyirányú lámpa',
    analogy: 'Egyirányú szelep, ami világít, amikor átfolyik rajta az áram.',
    layout: LAY.first, sim: { dt: 0.001, scale: 1 }, controls: ['S1'], probes: [{ ids: ['D1', 'D2'], label: 'A LED árama' }],
    variants: [
      { id: 'flip', label: 'Fordítsd meg a LED-et', real: 'Fordítsd meg a LED-et: a + jele most a másik oldalra kerül.', apply: (lay) => lay.map((p) => (p.p === 'D1' ? { ...p, at: 'D7', dir: 'l' } : p)) },
      { id: 'green', label: 'Zöld LED', real: 'Cseréld a piros LED-et a zöldre (D2).', apply: swapP('D1', 'D2'), needs: ['D2'] },
      { id: 'nor', label: 'Ellenállás nélkül (csak a képernyőn!)', real: 'Ezt NE próbáld ki a valódi készleten: a LED tönkremenne. A képernyőn megnézheted, mi történne.', apply: (lay) => lay.map((p) => (p.p === 'R1' ? { p: 'W3', at: 'D2', dir: 'r', id: 'Wr' } : p)) },
    ],
    intro: { k: 'A LED egy kis lámpa, ami csak egy irányban engedi át az áramot. A + jelének az elem + oldala felé kell néznie.', m: 'A LED (fénykibocsátó dióda) csak egy irányban vezet, és közben világít. Mindig ellenállás kell elé, különben túl sok áram folyna át rajta, és tönkremenne.', n: 'A LED félvezető dióda: nyitóirányban kb. 1,8 V (piros), illetve 2 V (zöld) fölött vezet, és az áram a feszültséggel meredeken nő. Ezért kell áramkorlátozó ellenállás: I ≈ (U_elem − U_LED) / R.' },
    hint: { k: 'Kapcsold be. Aztán próbáld ki fordítva is!', m: 'Kapcsold be, aztán próbáld ki fordítva, a zöld LED-del, és (csak a képernyőn) ellenállás nélkül. Figyeld a figyelmeztetést!', n: 'Hasonlítsd össze a piros és a zöld LED áramát ugyanazzal az ellenállással. Miért kisebb a zöldé?' },
    why: { k: 'A LED olyan, mint egy ajtó, ami csak egy irányba nyílik. Ha fordítva teszed be, zárva marad, és nem világít.', m: 'A LED csak egy irányban vezet: fordítva nem folyik áram. Ellenállás nélkül viszont túl sok áram folyna, és a valódi LED kiégne: ezt jelzi a piros figyelmeztetés.', n: 'A zöld LED nyitófeszültsége nagyobb, ezért ugyanazon az ellenálláson kisebb áram folyik. Ellenállás nélkül csak az elem és a LED belső ellenállása korlátozna: a szimulációban 100 mA fölé menne, a valódi LED kb. 20–30 mA-t bír.' },
    check: {
      q: { k: 'Ha a LED-et fordítva teszed be, és egymás után kötöd egy izzóval, világít az izzó?', m: 'Egy fordítva bekötött LED után sorban egy izzó van. Világít az izzó?', n: 'Mi lesz egy izzóval, ha vele sorban egy záróirányú LED van?' },
      opts: [['Nem', 'off'], ['Igen', 'on'], ['Csak halványan', 'dim']], right: 0,
      after: { k: 'Igen! A fordított LED az izzó elől is elzárja az utat.', m: 'Egymás után kötve ugyanaz az áram menne át mindkettőn. A fordított LED nem enged át semmit, így az izzó sem kap áramot.', n: 'Soros körben a záróirányú dióda megszakítja az áramot: az izzó sötét marad.' },
    },
  },
  {
    id: 'p_res', part: 'R1', symbol: 'res', title: 'Ellenállás', tag: 'Fékezi az áramot',
    analogy: 'Szűk cső: kevesebb víz fér át rajta.',
    layout: LAY.first, sim: { dt: 0.001, scale: 1 }, controls: ['S1'], probes: [{ ids: ['D1'], label: 'Áram a körben' }],
    variants: [
      { id: 'r2', label: 'R2 (1 kΩ)', real: 'Cseréld az R1-et (100 Ω) az R2-re (1 kΩ).', apply: swapP('R1', 'R2'), needs: ['R2'] },
      { id: 'r3', label: 'R3 (5,1 kΩ)', real: 'Cseréld az R1-et az R3-ra (5,1 kΩ).', apply: swapP('R1', 'R3'), needs: ['R3'] },
      { id: 'r4', label: 'R4 (10 kΩ)', real: 'Cseréld az R1-et az R4-re (10 kΩ).', apply: swapP('R1', 'R4'), needs: ['R4'] },
      { id: 'r5', label: 'R5 (100 kΩ)', real: 'Cseréld az R1-et az R5-re (100 kΩ).', apply: swapP('R1', 'R5'), needs: ['R5'] },
    ],
    intro: { k: 'Az ellenállás fékezi az áramot. Minél nagyobb, annál kevesebb áram jut a lámpának.', m: 'Az ellenállások különböző erősen fékezik az áramot. Az értéküket ohmban (Ω) mérik: R1 100 Ω, R2 1 kΩ, R3 5,1 kΩ, R4 10 kΩ, R5 100 kΩ. (1 kΩ = 1000 Ω.)', n: 'Ohm törvénye: I = U / R. A LED-del sorban I ≈ (3 V − 1,8 V) / R: 100 Ω-mal kb. 12 mA, 100 kΩ-mal kb. 12 µA.' },
    hint: { k: 'Kapcsold be, aztán próbáld ki a többi ellenállást. Melyikkel a legfényesebb?', m: 'Cseréld sorban az ellenállásokat, és figyeld a LED fényét és az áramot.', n: 'Számold ki előre az áramot Ohm törvényével, aztán ellenőrizd a kijelzőn.' },
    why: { k: 'Az ellenállás olyan, mint egy szűk cső: kevesebb víz fér át rajta. Nagy ellenálláson kevés áram megy át, és a lámpa halvány.', m: 'Az ellenállás anyaga nehezebben engedi át az áramot, mint egy vezeték. Arra jó, hogy pont annyi áram folyjon, amennyi kell: például ne égjen ki a LED.', n: 'Az ellenálláson eső feszültség U = I · R, a hővé alakuló teljesítmény P = I² · R. Ezért melegszik egy túlterhelt ellenállás.' },
    check: {
      q: { k: 'Ha két ellenállást kötsz egymás után, fényesebb vagy halványabb lesz a lámpa?', m: 'Mi történik, ha az R1 után még egy 100 Ω-os ellenállást kötsz sorba?', n: 'Mekkora két sorba kötött 100 Ω-os ellenállás eredője, és mi lesz az árammal?' },
      opts: [['Halványabb', 'dim'], ['Fényesebb', 'on'], ['Ugyanolyan', 'same']], right: 0,
      after: { k: 'Igen! Két fék jobban fékez, mint egy.', m: 'Egymás után kötve az ellenállások összeadódnak: nagyobb fék, kevesebb áram.', n: 'R = 100 Ω + 100 Ω = 200 Ω, az áram kb. a felére csökken (kb. 6 mA).' },
    },
  },
  {
    id: 'p_lamp', part: 'L1', symbol: 'lamp', title: 'Izzó', tag: 'Forró drót, ami világít',
    analogy: 'Kályha: a forró drót a melegtől világít.',
    layout: LAY.bench_lamp, sim: { dt: 0.001, scale: 1 }, controls: ['S1'], probes: [{ ids: ['L1', 'L2'], label: 'Az izzó árama' }],
    variants: [{ id: 'l2', label: 'A nagy izzó (L2, 6 V)', real: 'Cseréld az L1 izzót az L2-re (6 V-os).', apply: swapP('L1', 'L2'), needs: ['L2'] }],
    intro: { k: 'Az izzóban egy vékony drót van. Ha áram folyik rajta, felforrósodik, és világítani kezd.', m: 'Az izzó egy vékony, tekercselt drót egy üvegburában. Az áram felmelegíti, és a forró drót világít. Sok áram kell neki, és nem kell elé ellenállás.', n: 'Az izzószál ellenállása hidegen kicsi, melegen nagyobb (az L1-é üzemi hőmérsékleten kb. 16 Ω). Az L1 3,2 V / 0,2 A-es, az L2 6 V-os: 3 V-on halványabban izzik.' },
    hint: { k: 'Kapcsold be, aztán próbáld ki a nagy izzót is!', m: 'Kapcsold be, és hasonlítsd össze a két izzót: melyik fényesebb 3 V-on?', n: 'Nézd meg az áramokat. Miért kap kevesebbet az L2?' },
    why: { k: 'Az izzó a melegtől világít, mint a kályha forró része. Ezért meleg is lesz, ne fogd meg sokáig!', m: 'Az izzó az áram nagy részét hővé alakítja, és csak a kis része lesz fény. Ezért cserélték le a LED-ekre, amelyek ugyanannyi fényhez sokkal kevesebb áramot kérnek.', n: 'Az L2-t 6 V-ra tervezték: 3 V-on a teljesítménye (P = U² / R) jóval kisebb a névlegesnél, ezért alig izzik. A LED fényhasznosítása az izzóénak sokszorosa.' },
    check: {
      q: { k: 'Melyik kér több áramot: az izzó vagy a LED?', m: 'Ugyanakkora fényhez melyik kér több áramot: az izzó vagy a LED?', n: 'Ugyanakkora fényhez melyiknek nagyobb a teljesítményfelvétele?' },
      opts: [['Az izzó', 'on'], ['A LED', 'dim'], ['Ugyanannyit', 'same']], right: 0,
      after: { k: 'Igen! Az izzó sok áramot elhasznál melegítésre.', m: 'Az izzó: az áram nagy része hő lesz belőle. A LED ugyanannyi fényhez sokkal kevesebbet kér.', n: 'Az izzó: hatásfoka néhány százalék, a LED-é ennek sokszorosa (a My Home kézikönyve szerint a LED az izzó áramának kb. ötödével beéri).' },
    },
  },
  {
    id: 'p_motor', part: 'M1', symbol: 'motor', title: 'Motor', tag: 'Az áramból mozgást csinál',
    analogy: 'Mágneses forgó: az áram és a mágnes lökdösi egymást, és ettől forog.',
    layout: LAY.bench_motor, sim: { dt: 0.002, scale: 1 }, controls: ['S1'], probes: [{ ids: ['M1'], label: 'A motor árama' }],
    variants: [{ id: 'rev', label: 'Fordítsd meg a motort', real: 'Fordítsd meg a motort: a + jele a másik oldalra kerül.', apply: (lay) => lay.map((p) => (p.p === 'M1' ? { ...p, at: 'D7', dir: 'l' } : p)) }],
    intro: { k: 'A motor az áramtól forog. Ha fordítva kötöd be, visszafelé forog.', m: 'A motorban tekercsek és egy mágnes van. Az áram a tekercsből mágnest csinál, és a két mágnes forgatja a tengelyt.', n: 'Egyenáramú motor: a tekercsek mágneses tere és az állandó mágnes egymásra hat. Induláskor nagy az áram, forgás közben a motor ellenfeszültséget kelt, és az áram lecsökken.' },
    hint: { k: 'Kapcsold be, és nézd a ventilátort! Aztán fordítsd meg a motort.', m: 'Kapcsold be, figyeld az áramot induláskor és forgás közben. Aztán fordítsd meg.', n: 'Mekkora az áram induláskor, és mekkora, amikor már felpörgött? Miért?' },
    why: { k: 'A motorban mágnesek lökdösik egymást, és ettől forog. Ha megfordítod az áramot, a lökdösés is megfordul.', m: 'Ha megfordítod a motort, az áram a másik irányba folyik a tekercsekben, a mágneses erő is megfordul, és visszafelé forog. Ugyanez a motor áramot is termel, ha te forgatod (Energia fejezet).', n: 'Forgás közben a motor generátorként is működik: a keltett feszültség szembe dolgozik az elemmel, ezért üresjárásban sokkal kisebb az áram, mint álló helyzetben.' },
    check: {
      q: { k: 'Ha két elemmel hajtanád, gyorsabban vagy lassabban forogna?', m: 'Mi történne, ha kétszer akkora feszültséggel (két elemtartóval) hajtanád a motort?', n: 'Hogyan függ az üresjárási fordulatszám a tápfeszültségtől?' },
      opts: [['Gyorsabban', 'on'], ['Lassabban', 'slow'], ['Visszafelé', 'same']], right: 0,
      after: { k: 'Igen! Több hajtóerő, gyorsabb forgás.', m: 'Nagyobb feszültség nagyobb áramot hajt át, és a motor gyorsabban forog.', n: 'Közel arányosan: a motor addig gyorsul, amíg a keltett ellenfeszültség majdnem eléri a tápfeszültséget.' },
    },
  },
  {
    id: 'p_spk', part: 'SP', symbol: 'spk', title: 'Hangszóró', tag: 'Rezgésből hang',
    analogy: 'Dob: a lemeze rezeg, és ezt halljuk hangként.',
    layout: LAY.bench_spk, sim: { dt: 0.001, scale: 1 }, controls: [{ press: 'S2', label: 'Nyomógomb (S2)' }, 'sound'], audio: { type: 'clicks', probe: 'SP' }, probes: [{ ids: ['SP'], label: 'A hangszóró árama' }],
    intro: { k: 'A hangszóró hangot ad. Ha bekapcsolod vagy kikapcsolod az áramot, egyet kattan.', m: 'A hangszóróban egy tekercs és egy mágnes van, a tekercs egy vékony lemezhez (membránhoz) van rögzítve. Az áram megmozdítja a membránt, és a levegő rezgését halljuk hangként.', n: 'Elektrodinamikus hangszóró: a tekercsre ható erő arányos az árammal. Állandó áramnál a membrán nem mozog, csak a változáskor (kattanás). Hangot gyorsan változó, hangfrekvenciás áram ad.' },
    hint: { k: 'Kapcsold be a hangot, nyomd meg a gombot, aztán engedd el!', m: 'Kapcsold be a hangot. Nyomd meg és engedd el a gombot: mikor kattan?', n: 'Mikor kattan: a megnyomáskor, nyomva tartás közben vagy elengedéskor? Mi kellene a folyamatos hanghoz?' },
    why: { k: 'A hangszóró egy kis dob. Ha az áram megrántja, egyet koppan. Ha nagyon gyorsan rángatják, hangot hallasz.', m: 'A membrán csak akkor mozdul, amikor az áram változik. Ha másodpercenként több százszor kapcsolgatják, a sok kattanás hanggá áll össze: így szól a villogóból épített hang és a sziréna.', n: 'A hallható tartomány kb. 20 Hz – 20 kHz. A rezgőköreid (Rezgések fejezet) ilyen frekvencián kapcsolgatják a hangszóró áramát.' },
    check: {
      q: { k: 'Mi kell ahhoz, hogy a hangszóró ne csak kattanjon, hanem sípoljon?', m: 'Mit kellene csinálni a gombbal, hogy folyamatos hangot halljunk?', n: 'Milyen áram kell a folyamatos hanghoz?' },
      opts: [['Nagyon gyorsan kapcsolgatni', 'sound'], ['Erősebben megnyomni', 'on'], ['Nyomva tartani', 'same']], right: 0,
      after: { k: 'Igen! Ha nagyon gyorsan be-ki kapcsolod, sípolni fog. Kézzel ilyen gyors nem vagy, ezt egy villogó csinálja.', m: 'Másodpercenként több százszor kellene be- és kikapcsolni. Ezt egy rezgőkör tudja, kézzel nem megy.', n: 'Hangfrekvenciás, változó áram: például egy astabil multivibrátor kimenete néhány száz Hz-en.' },
    },
  },
  {
    id: 'p_cap', part: 'C5', symbol: 'cap', title: 'Kondenzátor', tag: 'Kis tartály az áramnak',
    analogy: 'Vödör: gyorsan megtelik töltéssel, aztán kiadja.',
    layout: LAY.capbat, sim: { dt: 0.002, scale: 1, meter: { M6: '5V' } }, controls: ['S2', { meter: 'M6', ranges: ['5V'] }], probes: [{ ids: ['D1'], label: 'A LED árama' }],
    variants: [
      { id: 'one', label: 'Csak egy C5', real: 'Vedd ki az egyik 470 µF-os kondenzátort.', apply: (lay) => lay.filter((p) => p.id !== 'C5b') },
      { id: 'c4', label: 'Két kisebb (C4, 100 µF)', real: 'Cseréld a két C5-öt C4-re (100 µF).', apply: swapP('C5', 'C4'), needs: ['C4'] },
    ],
    intro: { k: 'A kondenzátor egy kis tartály az áramnak. Gyorsan megtelik, és aztán egy kicsit kiadja.', m: 'A kondenzátor két, egymáshoz nagyon közeli fémlemezből áll. Ha feltöltöd, töltést tárol, és később kiadja. A nagyobbakon + jel van: azokat csak egy irányban szabad bekötni.', n: 'C = Q / U. A Boffin kondenzátorai: C1 0,02 µF, C2 0,1 µF, C3 10 µF, C4 100 µF, C5 470 µF. Az elektrolit kondenzátorok (C3–C5) polarizáltak.' },
    hint: { k: 'Nyomd meg a gombot egy kicsit, aztán engedd el, és nézd a lámpát!', m: 'Töltsd fel a gombbal, engedd el, és figyeld a mérőt. Próbáld ki egy kondenzátorral és a kisebbekkel (C4) is.', n: 'Mérd meg, mennyi idő alatt esik a feszültség a felére a különböző kapacitásokkal.' },
    why: { k: 'A kondenzátor olyan, mint egy vödör: a gomb megtölti, aztán a lámpa kiissza belőle. A kisebb vödör hamarabb kiürül.', m: 'Minél nagyobb a kondenzátor, annál több töltés fér bele, és annál tovább tud áramot adni. A villogókban és az időzítőkben ez adja az időt.', n: 'Kisülés ellenálláson át: U(t) = U₀ · e^(−t / RC). Az időállandó a kapacitással arányos: két C4-gyel kb. 4,7-szer gyorsabb, mint két C5-tel.' },
    check: {
      q: { k: 'Ha egy pici kondenzátorral (C2) próbálnád, meddig világítana a lámpa?', m: 'Mi lenne, ha a nagy kondenzátorok helyett a pici C2-t (0,1 µF) használnád?', n: 'Mennyi ideig tartana a kisülés 0,1 µF-tal?' },
      opts: [['Csak egy villanásnyi ideig', 'fade'], ['Tovább', 'slow'], ['Ugyanannyi ideig', 'same']], right: 0,
      after: { k: 'Igen! A pici vödör egy szempillantás alatt kiürül.', m: 'A C2 kb. tízezerszer kisebb, mint a két C5 együtt: annyi töltés sem fér bele, hogy lássuk a lámpát.', n: 'Kb. tízezerszer rövidebb időállandó: ezredmásodpercek alatt kisül, a LED legfeljebb egy alig látható villanást ad.' },
    },
  },
  {
    id: 'p_pot', part: 'RV', symbol: 'pot', title: 'Állítható ellenállás', tag: 'Csúszkával állítható fék',
    analogy: 'Csúszka egy ellenálláscsíkon: két ellenállás egyben.',
    layout: LAY.dimmer, sim: { dt: 0.002, scale: 1, pot: { RV: 0.5 }, meter: { M6: '50mA' } }, controls: ['S1', { pot: 'RV', label: 'Csúszka (RV)', invert: true }, { meter: 'M6' }], probes: [{ ids: ['D1'], label: 'A LED árama' }],
    intro: { k: 'Ez egy állítható fék. A karjával állítod, mennyire fékezze az áramot.', m: 'Az RV-ben egy 50 kΩ-os ellenálláscsík van, és egy csúszka, ami végigmegy rajta. Három lába van: a csík két vége és a csúszka.', n: 'Potenciométer: a csúszka a csíkot két részre osztja (R_a + R_b = 50 kΩ). Két lábbal bekötve változtatható ellenállás, hárommal feszültségosztó.' },
    hint: { k: 'Kapcsold be, és húzd a csúszkát ide-oda!', m: 'Kapcsold be, húzd a csúszkát, és figyeld a LED fényét és a mérőt.', n: 'Hol áll a csúszka, amikor a LED épp kialszik? Mekkora ott az ellenállás?' },
    why: { k: 'Ha a csúszkát elhúzod, hosszabb vagy rövidebb csíkon kell átmennie az áramnak. Hosszabb csík, nagyobb fék, halványabb lámpa.', m: 'Itt a csík egyik vége és a csúszka van bekötve: a csúszka helye szabja meg, mekkora darabon fut át az áram. A hangerőszabályzók és a régi rádiók tekerőgombjai is ilyenek.', n: 'Itt változtatható ellenállásként (két láb) dolgozik. A rádiónál és a motorszabályzónál feszültségosztóként (mindhárom láb): ott a csúszkán a két végpont közötti, tetszőleges feszültség jelenik meg.' },
    check: {
      q: { k: 'Melyik két lába között van mindig ugyanakkora ellenállás, akárhogy húzod a csúszkát?', m: 'Melyik két láb között nem változik az ellenállás, ha mozgatod a csúszkát?', n: 'Melyik két láb között állandó az 50 kΩ?' },
      opts: [['A két szélső láb között', 'same'], ['Az egyik szélső és a csúszka között', 'dim'], ['Sehol', 'off']], right: 0,
      after: { k: 'Igen! A két vég között mindig az egész csík van.', m: 'A két szélső láb a csík két vége: köztük mindig a teljes, 50 kΩ-os csík van. A csúszkával csak azt állítod, hol osztod ketté.', n: 'A két szélső láb között R_a + R_b = 50 kΩ állandó; csak az arányuk változik.' },
    },
  },
  {
    id: 'p_photo', part: 'Q4', symbol: 'photo', title: 'Fototranzisztor', tag: 'A fény nyitja ki',
    analogy: 'Fénytől nyíló csap: minél több fény, annál több áram.',
    layout: LAY.bench_photo, light: 0.85, sim: { dt: 0.001, scale: 1 }, controls: ['S1', 'light'], probes: [{ ids: ['D1'], label: 'Áram (a fénytől függ)' }],
    intro: { k: 'Ez egy kis fekete szem. Fényben átengedi az áramot, sötétben nem.', m: 'A fototranzisztor (Q4) olyan tranzisztor, amit nem áram, hanem fény nyit ki. Minél több fény éri, annál több áramot enged át.', n: 'A fototranzisztor bázisáramát a beeső fény adja, ezt a tranzisztor felerősíti. Sötétben csak nagyon kicsi áram szivárog át rajta.' },
    hint: { k: 'Kapcsold be, és húzd a fényt! Aztán takard le a szemet.', m: 'Kapcsold be, állítsd a fényt, és figyeld a LED-et és az áramot.', n: 'Hogyan függ az áram a fénytől? Hol éri el azt az áramot, amit egy 100 Ω-os ellenállás adna?' },
    why: { k: 'A szem fényt lát, és ettől kinyit egy kis kaput az áramnak. Sötétben bezárja.', m: 'A fény energiát ad a fototranzisztor belsejének, és ettől vezetni kezd. Így lehet fénnyel áramot vezérelni: ez az éjjeli lámpa és a fénytávíró érzékelője.', n: 'A modellünkben az áram a fény kb. 1,6. hatványával nő. A valódi alkatrész az infravörös fényre is érzékeny, ezért zavarhatja a napfény.' },
    check: {
      q: { k: 'Az éjjeli lámpa sötétben gyullad ki. Mit kellene tenni, hogy inkább világosban gyulladjon ki?', m: 'Az éjjeli lámpában a szem fényben elveszi az áramot a tranzisztortól. Mit cserélnél, hogy világosban gyulladjon ki?', n: 'Hogyan alakítanád át az éjjeli lámpa feszültségosztóját, hogy fényben kapcsoljon be?' },
      opts: [['Felcserélném a szemet és az ellenállást', 'on'], ['Erősebb elemet tennék bele', 'same'], ['Ez nem lehetséges', 'off']], right: 0,
      after: { k: 'Igen! Akkor a szem nem elveszi, hanem odaadja az áramot a kapunak.', m: 'Ha a szem kerül felülre, fényben áramot ad a tranzisztor bázisának, és a lámpa világosban gyullad ki. A Nappali lámpa kísérlet ugyanezt PNP tranzisztorral oldja meg.', n: 'Felcserélve a feszültségosztó fordítva működik: fényben a bázis feszültsége nő. (A Nappali lámpa ugyanezt PNP tranzisztorral éri el.)' },
    },
  },
  {
    id: 'p_mic', part: 'X1', symbol: 'mic', title: 'Mikrofon', tag: 'A hangtól változik',
    analogy: 'Összenyomható szivacs: a hang nyomása változtatja, mennyi áramot enged át.',
    layout: LAY.bench_mic, sim: { dt: 0.002, scale: 1 }, controls: ['S1', { mic: 'X1' }], probes: [{ ids: ['D1'], label: 'Áram a körben' }],
    intro: { k: 'A mikrofon érzi a hangot. Ha belefújsz, megváltozik, mennyi áramot enged át.', m: 'A mikrofon (X1) olyan ellenállás, ami a levegő nyomására változik: csendben kb. 1 kΩ, erős fújásra kb. 10 kΩ.', n: 'A modellünkben a hangnyomás 1 és 10 kΩ között változtatja az ellenállást. Itt a LED-del sorban: nagyobb ellenállás, kisebb áram.' },
    hint: { k: 'Kapcsold be, és fújj bele! Mi lesz a lámpával?', m: 'Kapcsold be, és nyomd a „Fújj bele” gombot, vagy kapcsold be a tablet mikrofonját.', n: 'Mennyire esik az áram fújás közben? Számold ki, mekkora lett a mikrofon ellenállása.' },
    why: { k: 'Ha belefújsz, a mikrofon jobban fékezi az áramot, és a lámpa halványabb lesz.', m: 'A hang nyomása megváltoztatja a mikrofon ellenállását. Ez a kis változás már jel: a hangosbemondó ezt erősíti fel, a hangra villogó LED pedig kapcsolásra használja.', n: 'I ≈ (3 V − 1,8 V) / (R_mic + 100 Ω): 1 kΩ-nál kb. 1 mA, 10 kΩ-nál kb. 0,1 mA. Önmagában ez gyenge jel, ezért kell utána erősítő (tranzisztor vagy U4).' },
    check: {
      q: { k: 'Ha a mikrofont egy tranzisztor kapujához kötöd, mire lehet jó?', m: 'Mire használhatod a mikrofon ellenállás-változását, ha egy tranzisztorhoz kötöd?', n: 'Mit nyersz, ha a mikrofon egy tranzisztor bázisát vezérli?' },
      opts: [['Tapsra kapcsoló lámpára', 'on'], ['Semmire', 'off'], ['Elem töltésére', 'same']], right: 0,
      after: { k: 'Igen! Így épült a hangra villogó LED.', m: 'A tranzisztor felerősíti a kicsi változást, így egy taps is fel tudja kapcsolni a lámpát (Hangra villogó LED).', n: 'A mikrofon kis ellenállás-változása a bázis feszültségét mozgatja, a tranzisztor ezt sokszoros kollektoráram-változássá erősíti.' },
    },
  },
  {
    id: 'p_npn', part: 'Q2', symbol: 'npn', title: 'NPN tranzisztor', tag: 'Kicsi áram nyit ki egy nagyot',
    analogy: 'Csap egy kis karral: a karját felfelé (a + felé) húzva nyílik.',
    layout: LAY.bench_npn, sim: { dt: 0.002, scale: 1, pot: { RV: 0.95 } }, controls: ['S1', { pot: 'RV', label: 'Bázis (RV)', invert: true }],
    probes: [{ ids: ['Q2', 'Q1'], term: 'B', label: 'Bázisáram (kicsi)' }, { ids: ['Q2', 'Q1'], term: 'C', label: 'Kollektoráram (nagy)' }, { ids: ['Q2', 'Q1'], ratio: true, label: 'Hányszoros?' }],
    variants: [{ id: 'pnp', label: 'Ugyanez PNP-vel', real: 'A PNP-s változat: a zöld Q1 tranzisztor, az emittere a + felé kerül.', layout: 'bench_pnp' }],
    intro: { k: 'A tranzisztor egy kis csap. Egy egészen kicsi áram a középső lábán kinyit egy nagy áramot a másik kettő között.', m: 'A tranzisztornak három lába van: bázis (B), kollektor (C) és emitter (E). A bázisba folyó kicsi áram kb. 150-szer nagyobb áramot enged át a kollektor és az emitter között.', n: 'NPN bipoláris tranzisztor: I_C ≈ β · I_B (itt β ≈ 150), amíg a kollektorkör engedi; utána telítésbe megy, és kapcsolóként dolgozik. Bekapcsolásához a bázist kb. 0,6–0,7 V-tal az emitter fölé kell vinni.' },
    hint: { k: 'Kapcsold be, és lassan húzd a csúszkát jobbra! Figyeld a két számot.', m: 'Húzd a csúszkát, és hasonlítsd össze a bázisáramot és a kollektoráramot. Aztán nézd meg a PNP-s változatot is!', n: 'Hol kezd vezetni? Mekkora az erősítés középen, és mi történik a végén (telítés)?' },
    why: { k: 'Az NPN tranzisztort úgy nyitod ki, hogy a kis karját felfelé, a + felé húzod. Akkor a nagy áram is megindul.', m: 'Az NPN emittere a − felé kerül. Ha a bázisát a + felé húzod, egy kicsi áram folyik be rajta, és a tranzisztor kinyit. A legtöbb kísérletben ilyen piros tranzisztor kapcsolta a lámpát.', n: 'Az NPN-ben a fő áram a kollektorból az emitter felé folyik (a rajzjel nyila kifelé mutat). Kapcsolóként a terhelés alá, a (−) oldalra szokás tenni: ez az alsó oldali kapcsoló.' },
    check: {
      q: { k: 'Ha a csúszkát egészen balra húzod (a − felé), mi lesz a lámpával?', m: 'Mi történik, ha a bázist egészen a − felé húzod?', n: 'Mi lesz a kollektorárammal, ha a bázis feszültsége 0,5 V alá esik?' },
      opts: [['Elalszik', 'off'], ['Fényesebb lesz', 'on'], ['Villogni kezd', 'blink']], right: 0,
      after: { k: 'Igen! Lefelé húzva a csap bezárul.', m: 'Ha a bázis nem kap áramot, a tranzisztor zárva van, és a lámpa elalszik.', n: '0,5 V alatt a bázisáram elhanyagolható, így a kollektoráram is (I_C ≈ β · I_B).' },
    },
  },
  {
    id: 'p_pnp', part: 'Q1', symbol: 'pnp', title: 'PNP tranzisztor', tag: 'Az NPN tükörképe',
    analogy: 'Fordított csap: a karját lefelé (a − felé) húzva nyílik.',
    layout: LAY.bench_pnp, sim: { dt: 0.002, scale: 1, pot: { RV: 0.05 } }, controls: ['S1', { pot: 'RV', label: 'Bázis (RV)', invert: true }],
    probes: [{ ids: ['Q1', 'Q2'], term: 'B', label: 'Bázisáram (kicsi)' }, { ids: ['Q1', 'Q2'], term: 'C', label: 'Kollektoráram (nagy)' }, { ids: ['Q1', 'Q2'], ratio: true, label: 'Hányszoros?' }],
    variants: [{ id: 'npn', label: 'Ugyanez NPN-nel', real: 'Az NPN-es változat: a piros Q2 tranzisztor, az emittere a − felé kerül.', layout: 'bench_npn' }],
    intro: { k: 'Ez is egy kis csap, csak fordítva működik: akkor nyit ki, ha a karját lefelé, a − felé húzod.', m: 'A PNP tranzisztor (Q1, zöld) az NPN tükörképe: az emittere a + felé kerül, és akkor nyit ki, ha a bázisából áram folyik ki a − felé.', n: 'PNP: I_C ≈ β · I_B itt is igaz, de minden áram és feszültség iránya fordított. Akkor vezet, ha a bázis kb. 0,6–0,7 V-tal az emitter (a +) alatt van.' },
    hint: { k: 'Húzd a csúszkát, és figyeld: most melyik irányba gyullad ki a lámpa?', m: 'Húzd a csúszkát mindkét irányba. Hasonlítsd össze az NPN-es változattal: ugyanaz a csúszka, fordított hatás.', n: 'Hasonlítsd össze a két változat számait ugyanannál a csúszkaállásnál.' },
    why: { k: 'A PNP az NPN fordítottja. Az NPN-t felfelé húzva nyitod ki, a PNP-t lefelé.', m: 'A PNP-t a lámpa fölé, a + oldalra szokás tenni, az NPN-t a lámpa alá, a − oldalra. Ugyanazt tudják, csak egymás tükörképei. A Nappali lámpa kísérletben PNP dolgozik.', n: 'A PNP rajzjelében a nyíl befelé mutat (az emitterbe folyik be az áram). Kapcsolóként felső oldali kapcsoló a (+) és a terhelés között. NPN és PNP párokból épülnek például az erősítők kimeneti fokozatai.' },
    check: {
      q: { k: 'Melyik tranzisztort tennéd a lámpa fölé, a + oldalra?', m: 'Ha a tranzisztornak a + és a lámpa közé kell kerülnie, melyiket választod?', n: 'Felső oldali kapcsolóhoz (a + és a terhelés közé) melyik típus való?' },
      opts: [['A PNP-t', 'on'], ['Az NPN-t', 'same'], ['Bármelyik ugyanúgy jó', 'blink']], right: 0,
      after: { k: 'Igen! A PNP a + oldalon, az NPN a − oldalon szeret lenni.', m: 'A PNP emittere a +-ra kerül, ezért ő való a lámpa fölé. Az NPN-é a −-ra, ő a lámpa alá.', n: 'A PNP: az emittere a (+)-on van, a bázisát a (−) felé húzva kapcsol. Egy NPN felső oldalon emitterkövetőként dolgozna, és elvesztene kb. 0,7 V-ot (a motorszabályzó két tranzisztora ezért vesztett kb. 1,3 V-ot).' },
    },
  },
  {
    id: 'p_meter', part: 'M6', symbol: 'meter', title: 'Mérőműszer', tag: 'Megmutatja, mennyi áram folyik',
    analogy: 'Vízóra: megmutatja, mennyi víz folyik át rajta.',
    layout: LAY.dimmer, sim: { dt: 0.002, scale: 1, pot: { RV: 0.3 }, meter: { M6: '50mA' } }, controls: ['S1', { pot: 'RV', label: 'Csúszka (RV)', invert: true }, { meter: 'M6' }], probes: [],
    intro: { k: 'A mérő megmutatja, mennyi áram folyik. Minél jobban kitér a mutató, annál több.', m: 'Az M6 mérőműszer a My Home dobozban van. Három állása van: 5 V (feszültség), 0,5 mA és 50 mA (áram). Áramot sorosan, a kör részeként mér.', n: 'Árammérőként kicsi a belső ellenállása (50 mA-es állásban kb. 2 Ω), sorosan kell bekötni. Feszültségmérőként nagy (5 V-os állásban 10 kΩ), a mért alkatrésszel párhuzamosan kell bekötni.' },
    hint: { k: 'Kapcsold be, és húzd a csúszkát: figyeld a mutatót!', m: 'Próbáld ki mindhárom állást. Melyikben mutat értelmes számot?', n: 'Mi történik, ha sorosan bekötve 5 V-os állásba kapcsolod? És ha 0,5 mA-esbe?' },
    why: { k: 'A mérő olyan, mint egy vízóra: az áram átfolyik rajta, és közben meglöki a mutatót.', m: 'A mérőt jó állásba kell kapcsolni. Ha túl kicsi a méréshatár, a mutató kiakad. Ha feszültséget mérsz vele, a mért alkatrész mellé kell kötni, nem a körbe.', n: 'Sorosan, 5 V-os állásban a 10 kΩ-os belső ellenállás szinte elzárja a kört. Áramállásban viszont párhuzamosan kötve rövidre zárná azt, amivel párhuzamos: ezért figyelmeztet a kondenzátoros kísérlet.' },
    check: {
      q: { k: 'Ha a mérőt 50 mA-es állásban egyenesen az elemre kötnéd, mi történne?', m: 'Mi lenne, ha a mérőt áramállásban (50 mA) egyenesen az elem két végére kötnéd?', n: 'Mekkora áram folyna, ha az 50 mA-es állású mérőt közvetlenül a 3 V-os elemre kötnéd?' },
      opts: [['Rövidzár: nagyon nagy áram folyna', 'on'], ['A mérő 3 V-ot mutatna', 'same'], ['Nem folyna áram', 'off']], right: 0,
      after: { k: 'Igen! Ilyet sose csinálj: a mérő szinte nem fékezi az áramot, és tönkremenne.', m: 'Áramállásban a mérőnek szinte nincs ellenállása, ezért rövidre zárná az elemet. A mérő és az elem is tönkremehet.', n: 'I ≈ 3 V / (2 Ω + 0,4 Ω) ≈ 1,2 A: a végkitérés huszonnégyszerese. Feszültséget mindig feszültségállásban mérj.' },
    },
  },
  {
    id: 'p_ic', part: 'U23', symbol: 'ic', title: 'IC (integrált áramkör)', tag: 'Sok alkatrész egy tokban',
    analogy: 'Fekete doboz: sok parányi alkatrész egy kis tokba zárva.',
    layout: LAY.ic_u23, sim: { dt: 0.001, scale: 1 }, controls: ['S1'], probes: [{ ids: ['D1'], label: 'A LED árama' }],
    intro: { k: 'Az IC egy kis doboz, amibe sok-sok parányi alkatrészt zártak. Kívülről nem látod, mi van benne.', m: 'Az IC (integrált áramkör) egy apró szilíciumlapka, rajta tranzisztorok, ellenállások és kondenzátorok. A Boffin IC-i modulok: a lapka mellett a szükséges kiegészítő alkatrészek is benne vannak.', n: 'Az integrált áramkörben a tranzisztorok, ellenállások és kondenzátorok egyetlen félvezető lapkán készülnek. A lábakon (táp, bemenetek, kimenet) át használjuk; a belső felépítést a gyártó adatlapja írja le.' },
    hint: { k: 'Kapcsold be, és nézd a lámpát! A Fekete dobozok fejezetben kinyitjuk.', m: 'Kapcsold be. A G fejezetben (Fekete dobozok) mindegyik IC-t kinyitjuk, és megnézzük, mi van benne.', n: 'Nézd meg az U23 lábait: melyik a táp, melyik a kimenet, és melyik a vezérlő bemenet?' },
    why: { k: 'Az IC-ben ugyanazok az alkatrészek vannak, amiket már ismersz, csak nagyon kicsik.', m: 'Egy telefonban több milliárd tranzisztor van, ezek mind IC-kben ülnek. A Boffin IC-i egyszerűbbek: egy villogó, egy sziréna, egy dallam. A legtöbbet már te is megépítetted kis alkatrészekből.', n: 'Az U23 belseje egy astabil multivibrátor és egy kimeneti kapcsolótranzisztor; ezt a Villogó kísérletben két tranzisztorból már megépítetted.' },
    check: {
      q: { k: 'Az U23-ban egy villogó van. Miből tudnád te is megépíteni?', m: 'Melyik alkatrészekből építhetnéd meg magad azt, amit az U23 csinál?', n: 'Milyen kapcsolással helyettesíthető az U23?' },
      opts: [['Két tranzisztorból és két kondenzátorból', 'blink'], ['Egy elemből és egy lámpából', 'on'], ['Egyetlen ellenállásból', 'same']], right: 0,
      after: { k: 'Igen! Ezt a Villogó kísérletben már meg is csináltad.', m: 'Két tranzisztor, két kondenzátor és néhány ellenállás: ez a villogó (Rezgések fejezet).', n: 'Egy astabil multivibrátorral (2 tranzisztor, 2 kondenzátor, 4 ellenállás) és egy kimeneti tranzisztorral.' },
    },
  },
].map((c) => ({ variants: [], ...c, card: true, chapter: 'P', exclusive: true }));
EXPS.push(...CARDS);


// Egy változat alkalmazása: vagy átalakítja az elrendezést, vagy egy másik elrendezésre cseréli.
function applyVariant(v, lay) { return v.layout ? LAY[v.layout] : v.apply(lay); }

return { EXPS, CHAPTERS: CHAPTERS.filter((c) => EXPS.some((e) => e.chapter === c.id)), applyVariant };
}
if (typeof module !== 'undefined' && module.exports) module.exports = define; else root.BOFFIN_EXPERIMENTS = define;
})(typeof window !== 'undefined' ? window : globalThis);
