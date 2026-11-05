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
const ORDER = ['first', 'conduct', 'series', 'dimmer', 'generator', 'capbat', 'motorspeed', 'night', 'touch', 'water', 'shadow', 'delay', 'flipflop', 'and', 'or', 'not', 'flash', 'metronome', 'sound', 'organ', 'siren', 'clap', 'lightlink'];
EXPS.sort((x, y) => ORDER.indexOf(x.id) - ORDER.indexOf(y.id));

// Egy változat alkalmazása: vagy átalakítja az elrendezést, vagy egy másik elrendezésre cseréli.
function applyVariant(v, lay) { return v.layout ? LAY[v.layout] : v.apply(lay); }

return { EXPS, CHAPTERS: CHAPTERS.filter((c) => EXPS.some((e) => e.chapter === c.id)), applyVariant };
}
if (typeof module !== 'undefined' && module.exports) module.exports = define; else root.BOFFIN_EXPERIMENTS = define;
})(typeof window !== 'undefined' ? window : globalThis);
