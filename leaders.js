// ============ CİHAN — LİDERLER (kurgusal yapay zeka portreleri) ============
'use strict';
const Leader = (function(){
  const SUB = {
    'Northern America':'euro','Western Europe':'euro','Northern Europe':'euro','Australia and New Zealand':'euro',
    'Eastern Europe':'slav','Southern Europe':'med','Western Asia':'mena','Northern Africa':'mena',
    'Eastern Africa':'afr','Western Africa':'afr','Middle Africa':'afr','Southern Africa':'afr','Sub-Saharan Africa':'afr',
    'Southern Asia':'sas','Eastern Asia':'eas','South-Eastern Asia':'sea','Central Asia':'cas',
    'South America':'lat','Central America':'lat','Caribbean':'lat','Latin America and the Caribbean':'lat',
    'Melanesia':'sea','Micronesia':'sea','Polynesia':'sea'
  };
  const REG = { Europe:'euro', Americas:'lat', Africa:'afr', Asia:'eas', Oceania:'sea' };
  const CODE = { TR:'med', AZ:'med', GE:'med', AM:'med', CY:'med', IL:'med', IR:'mena', AF:'cas', MN:'cas', PK:'sas',
    US:'euro', CA:'euro', AU:'euro', NZ:'euro', ZA:'afr', RU:'slav', SU:'slav', OE:'mena', TURAN:'med' };
  const TURKIC = { TR:1, AZ:1, TM:1, OE:1, TURAN:1, KZ:1, UZ:1, KG:1, CY_N:1 };
  const NAMES = {
    tr:{ m:['Kemal','Murat','Selim','Orhan','Ahmet','Cem','Levent','Tarık','Kaan','Burak','Oğuz','Alp'], f:['Ayşe','Zeynep','Elif','Defne','Nilüfer'], l:['Yıldırım','Aksoy','Demirtaş','Karaca','Toprak','Arslan','Kaya','Erdem','Sancak','Tunalı','Akıncı','Korkmaz'] },
    euro:{ m:['James','Henry','Thomas','Martin','Lukas','Pierre','Erik','Daniel','Oliver','Hugo','Jonas','Frederik'], f:['Charlotte','Anna','Claire','Sofia','Ingrid','Emma'], l:['Hartley','Weber','Laurent','Lindqvist','Brennan','Dumont','Vogel','Carrington','Ashford','Bergman','Moreau','Hale'] },
    slav:{ m:['Viktor','Dmitri','Pavel','Oleg','Bogdan','Andrei','Milan','Tomasz','Yuri','Stanislav'], f:['Irina','Elena','Katarina','Natalia'], l:['Volkov','Petrenko','Sokolov','Nowak','Dragan','Lebedev','Kral','Marek','Orlov','Zelinski'] },
    med:{ m:['Marco','Nikos','Alejandro','Luca','Stavros','Paolo','Andreas','Davide','Rafael','Giorgos'], f:['Elena','Maria','Giulia','Sofia'], l:['Ferrante','Papadakis','Navarro','Moretti','Castellano','Kostas','Rinaldi','Vidal','Marinos','Serrano'] },
    mena:{ m:['Khalid','Omar','Yusuf','Tariq','Karim','Hassan','Faisal','Samir','Nabil','Rashid'], f:['Leila','Amira','Yasmin','Nour'], l:['Al-Mansour','Haddad','Nasser','Saleh','Barakat','Al-Rashid','Khoury','Hamdan','Aziz','Farouk'] },
    afr:{ m:['Kwame','Joseph','Samuel','Emmanuel','Moussa','Thabo','Ibrahim','Jean-Paul','Kofi','Abdoulaye'], f:['Amara','Ngozi','Fatou','Adaeze','Zola'], l:['Mensah','Okafor','Diallo','Ndlovu','Kamara','Mwangi','Traoré','Banda','Achebe','Sow'] },
    sas:{ m:['Arjun','Rahul','Vikram','Imran','Sanjay','Rohan','Anil','Farhan','Dev','Kabir'], f:['Priya','Anjali','Sana','Meera'], l:['Mehta','Rao','Chaudhry','Kapoor','Iyer','Qureshi','Banerjee','Malik','Nair','Joshi'] },
    eas:{ m:['Wei','Hiroshi','Min-jun','Jian','Kenji','Hao','Takumi','Sung-ho','Lei','Daichi'], f:['Mei','Yuna','Haruka','Ji-woo','Lin'], l:['Zhang','Tanaka','Park','Liu','Sato','Kim','Huang','Mori','Chen','Han'] },
    sea:{ m:['Arif','Somchai','Minh','Rizal','Bayu','Thanh','Rafael','Hamid','Kiet','Surya'], f:['Siti','Linh','Maya','Dewi'], l:['Santoso','Nguyen','Wongsa','Reyes','Rahman','Tran','Wijaya','Bautista','Pham','Hakim'] },
    lat:{ m:['Diego','Carlos','Mateo','Javier','Ricardo','Andrés','Felipe','Eduardo','Sergio','Tomás'], f:['Valentina','Isabel','Camila','Lucía','Mariana'], l:['Herrera','Castillo','Mendoza','Rojas','Vargas','Morales','Ortega','Fuentes','Salazar','Ibarra'] },
    cas:{ m:['Nursultan','Timur','Bakhyt','Azamat','Rustam','Erlan','Dauren','Bekzod','Temirlan','Askar'], f:['Aigerim','Dilnoza','Madina'], l:['Seitkali','Abenov','Karimov','Tokayev','Rakhimov','Umarov','Nurlanov','Ismoilov','Bekov','Saidov'] }
  };
  NAMES.jp = { m:['Hiroshi','Kenji','Takumi','Daichi','Haruto','Ren'], f:['Haruka','Yui','Aiko'], l:['Tanaka','Sato','Mori','Takahashi','Kobayashi','Fujita'] };
  NAMES.kr = { m:['Min-jun','Sung-ho','Ji-hoon','Dong-hyun','Tae-yang'], f:['Ji-woo','Seo-yeon','Min-ji'], l:['Park','Kim','Lee','Choi','Jung','Han'] };
  NAMES.cn = { m:['Wei','Jian','Hao','Lei','Ming','Zhiwei'], f:['Mei','Lin','Xiu'], l:['Zhang','Liu','Huang','Chen','Zhao','Wu'] };
  const EASN = { JP:'jp', KR:'kr', KP:'kr', CN:'cn', TW:'cn', HK:'cn', MO:'cn' };
  const FEM = { euro:'euro_f', afr:'afr_f', eas:'eas_f', lat:'lat_f' };
  const ROM = ['I','II','III','IV','V','VI','VII','VIII'];
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const cache = {};

  function group(n){
    const c = n.code || '';
    if (CODE[c]) return CODE[c];
    if (n.sub && SUB[n.sub]) return SUB[n.sub];
    const src = n.src && WORLD.countries.find(x => x.a2 === n.src);
    if (src && SUB[src.sub]) return SUB[src.sub];
    return REG[n.region] || 'euro';
  }

  function of(n){
    if (!n) return null;
    const year = (G.scenario && G.scenario.year) || 2026;
    const key = n.code + '|' + n.gov + '|' + year;
    if (cache[key]) return cache[key];
    const g = group(n), h = hash(n.code || n.name || 'x'), gov = n.gov;
    const muslim = n.religion === 'islam' || n.religion === 'sunni' || n.religion === 'shia' || /islam|sünni|şii/i.test(n.religion || '');
    const big = (n.cells || 0) > 2500;
    let img = g, title = 'Cumhurbaşkanı', female = false, regnal = false;
    const fem = FEM[g] && gov === 'demokrasi' && (h % 100) < 24;

    if (year < 1800) {
      if (n.code === 'IR' || n.code === 'PERSIA' || n.code === 'SAFAVI') { img = 'shah_old'; title = 'Şah'; regnal = true; }
      else if (g === 'mena' || g === 'cas' || n.code === 'OE' || muslim) { img = 'sultan_old'; title = n.code === 'OE' ? 'Sultan' : (g === 'cas' ? 'Han' : 'Sultan'); regnal = true; }
      else if (g === 'euro' || g === 'slav' || g === 'med') { img = 'king_old'; title = big ? 'İmparator' : 'Kral'; regnal = true; }
      else if (g === 'eas' || g === 'sea' || g === 'sas') { img = 'asiamon'; title = 'Hükümdar'; regnal = true; }
      else { img = g; title = 'Hükümdar'; }
    } else if (year < 1960) {
      const eu = g === 'euro' || g === 'slav' || g === 'med';
      if (n.code === 'OE' || (year < 1925 && g === 'mena' && gov === 'monarsi')) { img = 'sultan'; title = 'Sultan'; regnal = true; }
      else if (gov === 'monarsi' && eu && year < 1925) { img = 'kaiser'; title = big ? 'İmparator' : 'Kral'; regnal = true; }
      else if (gov === 'monarsi' && eu) { img = 'king'; title = 'Kral'; regnal = true; }
      else if (gov === 'komunizm') { img = g === 'eas' || g === 'sea' ? 'comm' : 'coldwar'; title = 'Genel Sekreter'; }
      else if ((gov === 'otoriter' || gov === 'cunta') && eu) { img = 'ww2gen'; title = gov === 'cunta' ? 'Mareşal' : 'Devlet Başkanı'; }
      else if (eu || g === 'euro') { img = 'ww2'; title = gov === 'demokrasi' ? 'Başbakan' : 'Devlet Başkanı'; }
      else img = null;
    }
    if (!img || (year >= 1960)) {
      img = g;
      if (gov === 'monarsi') { img = g === 'mena' ? 'gulf' : (g === 'eas' || g === 'sea' || g === 'sas') ? 'asiamon' : 'king'; title = g === 'mena' ? (big ? 'Kral' : 'Emir') : 'Kral'; regnal = g !== 'mena'; }
      else if (gov === 'teokrasi') { img = muslim || g === 'mena' || g === 'cas' || g === 'sas' ? 'cleric' : g; title = 'Dini Lider'; }
      else if (gov === 'cunta') { img = g === 'afr' ? 'gen_afr' : g === 'lat' ? 'gen_lat' : 'gen_mena'; title = 'General'; }
      else if (gov === 'komunizm') { img = g === 'eas' || g === 'sea' ? 'comm' : 'coldwar'; title = 'Genel Sekreter'; if (year > 1995 && img === 'coldwar') img = g === 'lat' ? 'lat' : 'slav'; }
      else if (gov === 'otoriter') { title = 'Devlet Başkanı'; }
      else if (fem) { img = FEM[g]; female = true; }
    }
    // isim
    const L = TURKIC[n.code] ? NAMES.tr : EASN[n.code] ? NAMES[EASN[n.code]] : (NAMES[g] || NAMES.euro);
    const first = (female ? L.f : L.m)[(h >>> 3) % (female ? L.f.length : L.m.length)];
    const last = L.l[(h >>> 9) % L.l.length];
    let name;
    if (regnal) name = first + ' ' + ROM[(h >>> 13) % ROM.length];
    else if (title === 'General' || title === 'Mareşal') name = last;
    else name = first + ' ' + last;
    const PM = { GB:1, DE:1, JP:1, IT:1, IN:1, CA:1, AU:1, ES:1, IL:1, NL:1, SE:1, NO:1, DK:1, BE:1, NZ:1, GR:1, PK:1, BD:1, HU:1, CZ:1, IQ:1, TH:1, MY:1 };
    if (n.code === 'US' && (title === 'Cumhurbaşkanı' || title === 'Başbakan')) title = 'Başkan';
    else if (title === 'Cumhurbaşkanı' && year >= 1960 && PM[n.code]) title = 'Başbakan';
    if (title === 'Kral' && female) title = 'Kraliçe';
    const r = { img: 'img/ldr/' + img + '.jpg', name, title, full: title + ' ' + name };
    cache[key] = r; return r;
  }

  // portre + köşe bayrağı
  function html(n, size, cls){
    const L = of(n); if (!L) return '';
    return `<span class="ldr ${cls || ''}" style="--ls:${size}px" title="${esc(L.full)}"><img src="${L.img}" alt="" loading="lazy" decoding="async"><span class="ldr-fl">${flagH(n.flag, Math.max(16, Math.round(size * 0.42)))}</span></span>`;
  }
  return { of, html, group };
})();
