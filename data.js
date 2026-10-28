// ============ CİHAN — GAME DATA ============
'use strict';
const GD = {};

GD.NAME_FIX = { US:'ABD', AE:'BAE', CD:'Kongo DC', CG:'Kongo', CF:'Orta Afrika C.', WS:'Samoa', EH:'Batı Sahra', TF:'Fransız Güney T.',
  IO:'Chagos', GS:'G. Georgia', GB:'Birleşik Krallık', BA:'Bosna-Hersek', DO:'Dominik C.', KKTC:'KKTC', FK:'Falkland',
  VC:'St. Vincent', KN:'St. Kitts', WF:'Wallis-Futuna', PM:'St. Pierre', HM:'Heard Adası', ST:'São Tomé', VI:'Virjin Adaları',
  MP:'K. Mariana', AS:'Amerikan Samoası', TC:'Turks-Caicos', CZ:'Çekya', JO:'Ürdün', UZ:'Özbekistan', CN:'Çin', CL:'Şili', TD:'Çad' };

GD.LEADER_TITLE = { demokrasi:'Cumhurbaşkanı', monarsi:'Kral', komunizm:'Genel Sekreter', teokrasi:'Dini Lider', otoriter:'Devlet Başkanı', cunta:'General', federasyon:'Başbakan' };

GD.GOVS = {
  demokrasi:{ n:'Demokrasi', icon:'vote', approvalBase:6, stability:0, tax:0, recruit:-0.1, research:0.12, warWeariness:1.3, desc:'Yüksek araştırma ve halk desteği, savaş yorgunluğu fazla.' },
  monarsi:{ n:'Monarşi', icon:'crown', approvalBase:2, stability:10, tax:0.03, recruit:0, research:0, warWeariness:1.0, desc:'İstikrarlı yönetim, orta düzey ekonomi.' },
  komunizm:{ n:'Komünizm', icon:'hammer-sickle', approvalBase:-4, stability:8, tax:0.06, recruit:0.2, research:0.05, warWeariness:0.6, desc:'Merkezi planlama, güçlü ordu, düşük özgürlük.' },
  teokrasi:{ n:'Teokrasi', icon:'prayer', approvalBase:0, stability:6, tax:-0.02, recruit:0.15, research:-0.12, warWeariness:0.7, desc:'İnanç temelli yönetim, fanatik ordu, düşük bilim.' },
  otoriter:{ n:'Otoriter Rejim', icon:'police-badge', approvalBase:-6, stability:4, tax:0.04, recruit:0.2, research:-0.05, warWeariness:0.75, desc:'Güçlü merkez, sansür, protesto riski.' },
  cunta:{ n:'Askeri Cunta', icon:'rank-3', approvalBase:-10, stability:-4, tax:0.02, recruit:0.35, research:-0.15, warWeariness:0.6, desc:'Ordu yönetimde: çok asker, kırılgan istikrar.' }
};
GD.GOV_OF = { CN:'komunizm',VN:'komunizm',LA:'komunizm',CU:'komunizm',KP:'komunizm',
  SA:'monarsi',AE:'monarsi',QA:'monarsi',KW:'monarsi',BH:'monarsi',OM:'monarsi',JO:'monarsi',MA:'monarsi',BN:'monarsi',SZ:'monarsi',BT:'monarsi',
  IR:'teokrasi',AF:'teokrasi',VA:'teokrasi',
  RU:'otoriter',BY:'otoriter',TM:'otoriter',TJ:'otoriter',AZ:'otoriter',EG:'otoriter',VE:'otoriter',NI:'otoriter',ER:'otoriter',KZ:'otoriter',UZ:'otoriter',RW:'otoriter',CM:'otoriter',ET:'otoriter',SY:'otoriter',DZ:'otoriter',
  MM:'cunta',ML:'cunta',BF:'cunta',NE:'cunta',SD:'cunta',GN:'cunta',TD:'cunta',GA:'cunta' };

GD.MUSLIM = new Set('AF AL DZ AZ BH BD BN BF TD KM DJ EG GM GN ID IR IQ JO KZ XK KW KG LB LY MY MV ML MR MA NE OM PK PS QA SA SN SL SO SD SY TJ TN TR TM AE UZ YE KKTC EH'.split(' '));
GD.ARAB = new Set('DZ BH KM DJ EG IQ JO KW LB LY MR MA OM PS QA SA SO SD SY TN AE YE EH'.split(' '));
GD.TURKIC = new Set('TR AZ KZ KG UZ TM KKTC'.split(' '));
GD.ORTHODOX = new Set('RU BY UA RS BG MK ME GR RO GE MD CY AM'.split(' '));
GD.BUDDHIST = new Set('TH MM LK KH LA BT MN JP'.split(' '));
GD.HINDU = new Set(['IN','NP']);
GD.JEWISH = new Set(['IL']);
GD.SECULAR = new Set(['CN','KP','VN','CU','KR','CZ','EE']);
GD.religionOf = a => GD.MUSLIM.has(a)?'islam':GD.JEWISH.has(a)?'yahudilik':GD.HINDU.has(a)?'hinduizm':GD.BUDDHIST.has(a)?'budizm':GD.SECULAR.has(a)?'seküler':GD.ORTHODOX.has(a)?'ortodoks':'hristiyanlık';
GD.RELIGIONS = { islam:{n:'İslam',c:[46,140,70],icon:'crescent-staff'}, hristiyanlık:{n:'Hristiyanlık',c:[60,110,200],icon:'church'}, ortodoks:{n:'Ortodoks',c:[150,80,190],icon:'church'}, yahudilik:{n:'Yahudilik',c:[90,170,230],icon:'prayer'}, hinduizm:{n:'Hinduizm',c:[240,140,40],icon:'prayer'}, budizm:{n:'Budizm',c:[230,200,60],icon:'yin-yang'}, seküler:{n:'Seküler',c:[150,150,150],icon:'atom'} };

GD.NUKES = { US:3700, RU:4300, CN:500, FR:290, GB:225, IN:170, PK:170, IL:90, KP:50 };
// active troops (k), tanks, artillery, aircraft, helicopters, ships, subs, drones
GD.MIL = {
  US:[1330,4600,2500,2700,900,240,64,600], CN:[2035,5000,3500,1600,900,370,60,500], IN:[1455,4600,3300,600,300,140,18,150], RU:[1320,5000,6000,1500,900,220,60,900],
  KP:[1280,4000,9000,450,200,400,70,20], KR:[500,2300,5000,550,700,150,22,120], PK:[654,3700,3000,450,300,110,8,100], IR:[610,1900,2500,180,120,100,19,700],
  VN:[480,1800,3000,110,80,65,6,30], EG:[440,3600,2200,500,280,150,8,60], MM:[406,600,1500,130,70,120,2,20], ID:[400,330,1300,120,180,250,4,40],
  BR:[367,400,900,250,150,110,7,30], TH:[360,650,2000,120,250,280,1,40], TR:[355,2230,2400,300,450,190,12,600], CO:[290,0,600,80,250,100,4,20],
  SY:[90,1500,2000,50,40,10,0,40], IQ:[200,500,600,50,100,60,0,30], SA:[257,1100,1200,400,250,55,0,100], DZ:[140,2000,1500,220,250,200,6,40],
  FR:[205,220,300,240,400,180,9,100], DE:[183,310,150,200,300,80,6,60], GB:[150,230,180,150,300,70,10,90], IT:[165,200,300,200,400,170,8,80],
  JP:[247,500,1000,330,700,150,22,40], UA:[880,1200,3000,80,100,10,0,2000], PL:[200,650,700,90,100,40,1,80], IL:[170,1300,1200,330,140,60,6,400],
  AZ:[67,550,700,40,50,30,4,200], AM:[45,110,250,15,20,0,0,20], GR:[143,1300,700,200,150,120,10,30], ES:[120,330,350,180,150,150,3,40],
  CA:[68,80,200,100,140,70,4,20], AU:[60,60,100,150,120,50,6,30], AF:[150,100,200,10,30,0,0,10], NG:[143,300,500,60,60,80,0,30],
  ET:[160,400,600,30,30,0,0,40], MA:[195,900,1000,90,70,120,0,50], MX:[230,0,600,100,250,150,0,30], AR:[83,400,300,40,60,40,2,10],
  KZ:[70,350,600,90,60,15,0,30], BY:[48,500,500,50,40,0,0,20], RS:[28,240,300,30,40,0,0,30], TW:[170,1000,2000,280,200,90,4,100],
  PH:[145,0,300,40,90,110,0,20], MY:[115,50,300,40,50,100,2,10], SG:[51,170,100,100,60,40,4,20], AE:[63,400,500,150,180,75,0,80],
  QA:[17,100,100,70,50,50,0,10], KW:[17,350,200,60,30,20,0,10], JO:[100,600,500,70,60,20,0,10], LB:[60,250,300,10,20,40,0,0],
  YE:[40,200,300,10,10,10,0,50], LY:[20,200,300,20,20,10,0,30], CU:[50,800,700,40,40,20,0,0], VE:[123,500,600,50,40,30,1,20],
  NL:[42,20,60,50,60,30,4,20], BE:[25,0,40,50,30,10,0,10], SE:[24,120,50,100,50,20,5,10], NO:[25,50,60,40,30,30,6,10],
  FI:[24,200,1000,60,20,30,0,10], CZ:[25,50,80,30,40,0,0,10], HU:[30,50,50,15,30,0,0,10], RO:[71,350,600,40,50,50,0,10],
  BG:[37,90,200,20,20,20,0,5], PT:[25,40,80,40,20,30,2,5], CH:[20,130,130,50,40,0,0,10], AT:[16,50,60,15,40,0,0,5],
  GE:[21,120,200,10,20,0,0,5], CY:[12,170,200,0,10,5,0,0], KKTC:[6,40,40,0,0,0,0,5], PS:[0,0,0,0,0,0,0,0], ZA:[73,200,400,90,90,50,3,10],
  SD:[100,400,600,40,40,10,0,40], DZ2:[0]
};
GD.OIL = { US:13,SA:9.5,RU:9.5,CA:4.9,IQ:4.3,CN:4.2,IR:3.3,AE:3.2,BR:3.4,KW:2.5,MX:1.6,NO:1.8,KZ:1.8,QA:1.3,NG:1.4,LY:1.2,DZ:1.0,AO:1.1,OM:1.0,VE:0.8,GB:0.7,CO:0.8,AZ:0.6,ID:0.6,EG:0.6,MY:0.5,IN:0.6,AR:0.7,EC:0.5,GY:0.6,TR:0.1,SY:0.05,TM:0.2,SS:0.15,GA:0.2,CG:0.3,GQ:0.1,BN:0.1,TD:0.1,YE:0.05 };
GD.SEISMIC = new Set('TR JP IR ID CL PE MX NP PK AF IT GR CN PH NZ EC US GT TW IN MM AL HR RS GE AM AZ TJ KG SV NI CR HT DZ MA'.split(' '));
GD.FLOODY = new Set('BD IN CN PK DE VN TH MM NG ID PH BR US GB FR IT ES TR RO NP LK MZ MW SD SS KE SO'.split(' '));
GD.FIREY = new Set('US AU CA GR TR PT ES RU BR BO CL GR IT FR DZ IL'.split(' '));

GD.RIVALS = [['IL','IR',-95],['IL','PS',-100],['IL','SY',-70],['IL','LB',-75],['IL','YE',-80],['US','IR',-85],['US','KP',-95],['US','RU',-55],['US','CN',-40],['IN','PK',-85],['IN','CN',-40],['CN','TW',-85],
  ['KR','KP',-90],['AM','AZ',-80],['GR','TR',-25],['CY','KKTC',-65],['CY','TR',-55],['RU','UA',-100],['SA','IR',-50],['MA','DZ',-55],['RS','XK',-85],['ET','ER',-45],['JP','CN',-40],['JP','KP',-75],['VE','US',-60],
  ['CU','US',-50],['PK','AF',-35],['GB','AR',-30],['SD','SS',-45],['EG','ET',-45],['RU','GE',-60],['CN','PH',-45],['CN','VN',-25],['TR','AM',-50],['TR','IL',-50],['IR','AE',-30],['UA','BY',-55],['RU','PL',-60],
  ['RU','EE',-55],['RU','LV',-55],['RU','LT',-55],['RU','FI',-45],['RU','GB',-55],['KP','JP',-70],['TR','SY',-20],['IR','AZ',-25],['DZ','FR',-15],['SO','ET',-30],['KH','TH',-30],['PK','IR',-10],['VE','GY',-55],['BO','CL',-30]];
GD.FRIENDS = [['US','IL',90],['US','GB',95],['US','JP',85],['US','KR',85],['US','CA',90],['US','AU',90],['US','TW',75],['RU','BY',95],['CN','PK',85],['CN','KP',70],['RU','CN',65],['RU','IR',60],['RU','KP',60],['TR','PK',75],
  ['TR','QA',80],['TR','AZ',95],['TR','KKTC',100],['SA','AE',85],['SA','BH',85],['GB','AU',85],['GB','CA',90],['FR','DE',85],['DE','AT',85],['IR','SY',40],['IR','YE',70],['IR','LB',60],['IR','IQ',50],['IN','RU',55],['IN','US',55],
  ['GR','CY',95],['RS','RU',70],['AM','RU',40],['AZ','PK',80],['AZ','IL',55],['TR','UZ',70],['TR','KZ',70],['TR','KG',70],['TR','TM',65],['TR','HU',45],['TR','UA',45],['TR','LY',55],['TR','SO',70],['EG','SA',65],
  ['CU','VE',85],['VE','RU',60],['NI','RU',55],['ML','RU',60],['BF','RU',60],['NE','RU',60],['UA','PL',80],['UA','GB',80],['UA','US',70],['JP','AU',80],['JP','IN',65],['KR','JP',35],['MA','US',60],['EG','AE',70],['BR','AR',45]];

GD.COALITIONS = {
  NATO:{n:'NATO',flag:'NATO',type:'askeri',color:[40,90,200],m:'US CA GB FR DE IT ES PT NL BE LU DK NO IS PL CZ SK HU RO BG GR TR HR SI AL ME MK EE LV LT FI SE'},
  CSTO:{n:'KGAÖ',flag:'CSTO',type:'askeri',color:[180,40,40],m:'RU BY AM KZ KG TJ'},
  EU:{n:'Avrupa Birliği',flag:'EU',type:'ekonomik',color:[30,60,180],m:'AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE'},
  SCO:{n:'Şanghay İşbirliği Ö.',flag:'CN',type:'siyasi',color:[60,140,200],m:'CN RU IN PK KZ KG TJ UZ IR BY'},
  ARAB:{n:'Arap Birliği',flag:'AL_ARAB',type:'siyasi',color:[20,130,60],m:'DZ BH KM DJ EG IQ JO KW LB LY MR MA OM PS QA SA SO SD SY TN AE YE'},
  TURKIC:{n:'Türk Devletleri T.',flag:'TURKIC',type:'siyasi',color:[40,170,210],m:'TR AZ KZ KG UZ'},
  GCC:{n:'Körfez İşbirliği K.',flag:'SA',type:'askeri',color:[200,170,60],m:'SA AE QA KW BH OM'},
  ASEAN:{n:'ASEAN',flag:'ID',type:'ekonomik',color:[220,60,60],m:'ID TH MY SG PH VN BN KH LA MM TL'},
  AU:{n:'Afrika Birliği',flag:'AU_UNION',type:'siyasi',color:[40,140,40],m:'DZ AO BJ BW BF BI CM CV CF TD KM CG CD CI DJ EG GQ ER SZ ET GA GM GH GN GW KE LS LR LY MG MW ML MR MU MA MZ NA NE NG RW ST SN SC SL SO ZA SS SD TZ TG TN UG ZM ZW EH'},
  BRICS:{n:'BRICS',flag:'BRICS',type:'ekonomik',color:[200,120,40],m:'BR RU IN CN ZA EG ET IR AE ID'},
  MERCOSUR:{n:'MERCOSUR',flag:'MERCOSUR',type:'ekonomik',color:[40,100,160],m:'AR BR PY UY BO'}
};

GD.UNITS = {
  piyade:{n:'Piyade Tümeni',icon:'rally-the-troops',batch:10000,cost:380,mp:10000,pow:1,up:0.00009,unit:'asker',desc:'Ordunun bel kemiği. Ucuz ve çok sayıda.'},
  tank:{n:'Ana Muharebe Tankı',icon:'battle-tank',batch:50,cost:260,mp:200,pow:60,up:0.012,unit:'tank',desc:'Zırhlı yarma gücü. Cephede hızlı ilerleme.'},
  topcu:{n:'Obüs Bataryası',icon:'cannon',batch:50,cost:140,mp:300,pow:35,up:0.006,unit:'top',desc:'Uzun menzilli ateş desteği, savunmada güçlü.'},
  ucak:{n:'Savaş Uçağı Filosu',icon:'jet-fighter',batch:10,cost:850,mp:40,pow:320,up:0.09,unit:'uçak',desc:'Hava üstünlüğü ve hava saldırısı imkanı.'},
  heli:{n:'Taarruz Helikopteri',icon:'helicopter-tail',batch:10,cost:320,mp:30,pow:120,up:0.03,unit:'helikopter',desc:'Tank avcısı, hızlı müdahale.'},
  drone:{n:'SİHA Filosu',icon:'delivery-drone',batch:20,cost:110,mp:20,pow:95,up:0.008,unit:'SİHA',req:'t_drone',desc:'Silahlı insansız hava araçları. Düşük maliyet, yüksek etki.'},
  gemi:{n:'Fırkateyn',icon:'battleship',batch:2,cost:1100,mp:400,pow:0,nav:100,up:0.12,unit:'gemi',desc:'Deniz gücü. Çıkarma harekatı için gerekli.'},
  denizalti:{n:'Denizaltı',icon:'submarine',batch:2,cost:1500,mp:150,pow:0,nav:150,up:0.14,unit:'denizaltı',desc:'Gizli deniz gücü, abluka ve caydırıcılık.'},
  hs:{n:'Hava Savunma Sistemi',icon:'radar-dish',batch:5,cost:420,mp:100,pow:10,up:0.03,unit:'sistem',desc:'Düşman füze ve hava saldırılarını engeller.'},
  fuze:{n:'Balistik Füze',icon:'missile-pod',batch:20,cost:220,mp:0,pow:0,up:0.002,unit:'füze',desc:'Tek kullanımlık hassas vuruş. Düşman ordusunu zayıflatır.'},
  nukleer:{n:'Nükleer Başlık',icon:'nuclear-bomb',batch:1,cost:6000,mp:0,pow:0,up:0.5,unit:'başlık',req:'t_nuke',desc:'Nihai caydırıcılık. Kullanımı dünyayı sarsar.'}
};

GD.BUILDINGS = {
  fabrika:{n:'Fabrika',icon:'factory',cost:600,desc:'+%1.5 GSYİH büyümesi / yıl, +gelir',max:40},
  universite:{n:'Üniversite',icon:'graduate-cap',cost:500,desc:'+%6 araştırma hızı',max:30},
  hastane:{n:'Hastane',icon:'hospital-cross',cost:400,desc:'+halk desteği, salgın direnci',max:30},
  kisla:{n:'Kışla',icon:'barracks-tent',cost:350,desc:'+%5 insan gücü yenilenmesi, +moral',max:30},
  akademi:{n:'Harp Akademisi',icon:'medal',cost:700,desc:'+%3 asker kalitesi (saldırı gücü)',max:20},
  kale:{n:'Sınır Tahkimatı',icon:'stone-tower',cost:450,desc:'+%4 savunma gücü',max:25},
  tersane:{n:'Tersane',icon:'anchor',cost:550,desc:'+%5 deniz gücü, gemi maliyeti -%3',max:20},
  hava:{n:'Hava Üssü',icon:'airplane',cost:600,desc:'+%5 hava gücü',max:20},
  santral:{n:'Enerji Santrali',icon:'power-lightning',cost:800,desc:'+%2 gelir, enerji krizlerine direnç',max:20},
  rafineri:{n:'Petrol Rafinerisi',icon:'oil-rig',cost:700,desc:'Petrol gelirini +%15 artırır',max:15},
  liman:{n:'Ticaret Limanı',icon:'cargo-ship',cost:500,desc:'Ticaret anlaşması gelirini artırır',max:20},
  afet:{n:'Afet Merkezi',icon:'siren',cost:300,desc:'Doğal afet hasarını azaltır',max:15},
  istihbarat:{n:'İstihbarat Merkezi',icon:'spy',cost:650,desc:'+%6 casusluk başarısı, karşı istihbarat',max:15},
  medya:{n:'Medya Merkezi',icon:'tv',cost:300,desc:'+propaganda, protestoları yumuşatır',max:15}
};

// tech: id, n, branch, cost, req[], icon, desc, eff{}
GD.TECH_BRANCHES = { mil:{n:'Askeri',icon:'crossed-swords',c:'#c9503f'}, eco:{n:'Ekonomi',icon:'coins-pile',c:'#d4a849'}, sci:{n:'Bilim',icon:'atom',c:'#4aa3d8'}, soc:{n:'Toplum',icon:'family-house',c:'#5fb36a'}, int:{n:'İstihbarat',icon:'spy',c:'#9a6fd0'} };
GD.TECHS = [
  ['t_inf','Modern Piyade Teçhizatı','mil',80,[],'flamethrower-soldier','Piyade gücü +%10',{inf:0.10}],
  ['t_armor','Kompozit Zırh','mil',140,['t_inf'],'battle-tank','Tank gücü +%20',{tank:0.20}],
  ['t_drone','SİHA Teknolojisi','mil',160,['t_inf'],'delivery-drone','SİHA üretimini açar, SİHA gücü +%10',{drone:0.10}],
  ['t_pgm','Akıllı Mühimmat','mil',220,['t_drone'],'target-arrows','Füze/hava saldırısı etkisi +%35',{strike:0.35}],
  ['t_stealth','Gizli Uçaklar','mil',320,['t_armor'],'stealth-bomber','Hava gücü +%25',{air:0.25}],
  ['t_ew','Elektronik Harp','mil',300,['t_pgm'],'radio-tower','Düşman saldırı gücü -%8 (savunmada)',{def:0.08}],
  ['t_shield','Füze Kalkanı','mil',380,['t_ew'],'defense-satellite','Gelen füze hasarı -%50',{mshield:0.5}],
  ['t_nuke','Nükleer Silah Programı','mil',600,['t_stealth','t_pgm'],'nuclear','Nükleer başlık üretimini açar',{}],
  ['t_hyper','Hipersonik Füzeler','mil',520,['t_shield'],'rocket-flight','Füze etkisi +%40, kalkanları aşar',{strike:0.4}],
  ['t_robot','Robot Askerler','mil',800,['t_hyper','t_ai'],'robot-golem','Tüm kara gücü +%30',{all:0.30}],
  ['t_naval','Mavi Vatan Doktrini','mil',200,['t_inf'],'battleship','Deniz gücü +%25, çıkarma maliyeti -%30',{navy:0.25}],
  ['t_special','Özel Kuvvetler','mil',250,['t_inf'],'ninja-mask','Saldırı gücü +%8',{atk:0.08}],
  ['e_ind','Sanayi 4.0','eco',100,[],'factory','Gelir +%8',{inc:0.08}],
  ['e_trade','Serbest Ticaret Bölgeleri','eco',150,['e_ind'],'trade','Ticaret geliri +%40',{trade:0.4}],
  ['e_bank','Dijital Bankacılık','eco',180,['e_ind'],'bank','Faiz ve borç maliyeti -%30, gelir +%4',{inc:0.04,debt:0.3}],
  ['e_green','Yenilenebilir Enerji','eco',220,['e_ind'],'wind-turbine','Enerji krizlerinden korunma, gelir +%5',{inc:0.05}],
  ['e_agri','Akıllı Tarım','eco',140,[],'farm-tractor','Kuraklık etkisi -%50, nüfus artışı +',{agri:0.5}],
  ['e_logi','Lojistik Ağı','eco',260,['e_trade'],'truck','Ordu bakım maliyeti -%15',{upkeep:0.15}],
  ['e_ai','Yapay Zeka Ekonomisi','eco',450,['e_bank','s_super'],'circuitry','Gelir +%15',{inc:0.15}],
  ['e_crypto','Dijital Rezerv','eco',380,['e_bank'],'gold-bar','Yaptırımların etkisi -%50',{sanction:0.5}],
  ['e_space','Uzay Madenciliği','eco',900,['e_ai','s_space'],'mining','Gelir +%25',{inc:0.25}],
  ['s_super','Süper Bilgisayarlar','sci',120,[],'laptop','Araştırma hızı +%12',{res:0.12}],
  ['s_gene','Genetik Mühendisliği','sci',220,['s_super'],'dna1','Nüfus artışı ve insan gücü +%10',{mp:0.1}],
  ['s_vacc','Aşı Teknolojisi','sci',180,['s_gene'],'syringe','Salgın hasarı -%70',{plague:0.7}],
  ['s_quant','Kuantum Hesaplama','sci',420,['s_super'],'atom','Araştırma +%20, casusluk +%10',{res:0.2,spy:0.1}],
  ['t_ai','Askeri Yapay Zeka','sci',480,['s_quant'],'brain','Tüm birlikler +%12',{all:0.12}],
  ['s_fusion','Füzyon Enerjisi','sci',700,['s_quant'],'power-lightning','Gelir +%20',{inc:0.2}],
  ['s_space','Uzay Programı','sci',500,['s_super'],'space-shuttle','Uydu ağı: casusluk +%15, prestij',{spy:0.15}],
  ['s_mars','Mars Kolonisi','sci',1400,['s_space','s_fusion'],'rocket','Bilim Zaferi kazanırsınız',{win:1}],
  ['c_media','Medya Hakimiyeti','soc',100,[],'tv','Halk desteği +5',{appr:5}],
  ['c_egov','E-Devlet','soc',140,['c_media'],'smartphone','İstikrar +6, vergi verimi +%4',{stab:6,inc:0.04}],
  ['c_edu','Eğitim Reformu','soc',160,[],'open-book','Araştırma +%10',{res:0.10}],
  ['c_health','Genel Sağlık Sistemi','soc',180,['c_edu'],'heart-plus','Halk desteği +6, salgın -%30',{appr:6,plague:0.3}],
  ['c_nation','Milli Kimlik','soc',240,['c_media'],'knight-banner','İşgal bölgelerinde huzursuzluk -%40',{unrest:0.4}],
  ['c_diplo','Diplomasi Akademisi','soc',200,['c_egov'],'shaking-hands','İlişki kazanımları +%30',{diplo:0.3}],
  ['c_urban','Kentsel Dönüşüm','soc',260,['c_egov'],'modern-city','Deprem hasarı -%60',{quake:0.6}],
  ['c_afad','Afet Yönetim Sistemi','soc',200,['c_urban'],'siren','Tüm afet hasarı -%35',{disaster:0.35}],
  ['i_cyberd','Siber Savunma','int',120,[],'padlock','Siber saldırılara karşı koruma',{cyberd:0.6}],
  ['i_cybero','Siber Ordu','int',220,['i_cyberd'],'cyber-eye','Siber saldırı operasyonunu açar',{}],
  ['i_sat','Casus Uydu Ağı','int',260,['i_cyberd'],'satellite','Casusluk +%15, düşman ordusu görünür',{spy:0.15}],
  ['i_deep','Derin Operasyonlar','int',380,['i_sat'],'hood','Darbe ve isyan operasyonları +%20',{spy:0.2}],
  ['i_prop','Küresel Propaganda','int',300,['i_cybero'],'megaphone','Dünya algısı: tüm ilişkiler yavaşça +',{prop:1}],
  ['i_counter','Karşı İstihbarat','int',260,['i_cyberd'],'eye-target','Düşman casusluk başarısı -%40',{counter:0.4}]
];

// policies: id, n, icon, cost/day, desc, eff
GD.POLICIES = [
  ['p_conscript','Zorunlu Askerlik','rally-the-troops',0,'İnsan gücü +%40, halk desteği -3',{mp:0.4,appr:-3}],
  ['p_mobil','Genel Seferberlik','siren',0,'İnsan gücü +%100, gelir -%15, destek -8 (savaşta)',{mp:1.0,inc:-0.15,appr:-8}],
  ['p_wareco','Savaş Ekonomisi','factory',0,'Birlik maliyeti -%25, gelir -%8',{ucost:-0.25,inc:-0.08}],
  ['p_censor','Basın Sansürü','padlock',0,'Protesto şansı -%50, araştırma -%8, demokrasilerle ilişki -',{protest:-0.5,res:-0.08}],
  ['p_press','Basın Özgürlüğü','newspaper',0,'Destek +4, araştırma +%5, protesto +%20',{appr:4,res:0.05,protest:0.2}],
  ['p_free','Serbest Piyasa','coins',0,'Gelir +%8, istikrar -3',{inc:0.08,stab:-3}],
  ['p_state','Devletçilik','bank',0,'İstikrar +5, gelir -%4',{stab:5,inc:-0.04}],
  ['p_welfare','Sosyal Devlet','family-house',0,'Destek +8, gelir -%10',{appr:8,inc:-0.10}],
  ['p_taxcut','Vergi İndirimi','receive-money',0,'Destek +6, vergi geliri -%15',{appr:6,inc:-0.15}],
  ['p_martial','Sıkıyönetim','police-badge',0,'İstikrar +15, destek -10, isyan -%60',{stab:15,appr:-10,unrest:0.6}],
  ['p_prop','Devlet Propagandası','megaphone',0,'Savaş yorgunluğu -%40, destek +3',{weary:0.4,appr:3}],
  ['p_green','Yeşil Dönüşüm','wind-turbine',0,'Destek +3, gelir -%3, afet riski -',{appr:3,inc:-0.03}],
  ['p_tour','Turizm Teşviki','sun',0,'Gelir +%4 (barışta)',{inc:0.04}],
  ['p_arms','Silah İhracatı','ammo-box',0,'Gelir +%5, barışçıl ülkelerle ilişki -',{inc:0.05}],
  ['p_merc','Paralı Askerler','money-stack',0,'Saldırı gücü +%10, günlük maliyet artar',{atk:0.1,inc:-0.05}],
  ['p_wall','Sınır Duvarı','stone-tower',0,'Savunma +%10, ticaret -%20',{def:0.1,trade:-0.2}],
  ['p_migr','Açık Kapı Göç Politikası','person',0,'İnsan gücü +%15, istikrar -4',{mp:0.15,stab:-4}],
  ['p_edu','Ücretsiz Yükseköğretim','graduate-cap',0,'Araştırma +%15, gelir -%5',{res:0.15,inc:-0.05}],
  ['p_nukedoc','Nükleer Caydırıcılık Doktrini','nuclear',0,'Saldırıya uğrama riski -%40, gerilim +',{deter:0.4}],
  ['p_isolation','İzolasyonizm','shield',0,'İstikrar +5, ilişkiler yavaşça soğur',{stab:5}],
  ['p_expans','Yayılmacılık','flag-objective',0,'Saldırı gücü +%8, dünya gerilimi +, komşular endişeli',{atk:0.08}],
  ['p_relig','Dini Muhafazakarlık','prayer',0,'Aynı inançtaki ülkelerle ilişki +, araştırma -%5',{res:-0.05,stab:4}],
  ['p_secular','Laiklik','scales',0,'Araştırma +%6, dini ülkelerle ilişki -',{res:0.06}],
  ['p_austerity','Kemer Sıkma','wallet',0,'Gider -%15, destek -6',{inc:0.08,appr:-6}]
];

GD.SPY_OPS = [
  ['o_intel','Casusluk','binoculars',150,0.85,'Hedef ülkenin tüm verilerini açığa çıkarır ve araştırma çalar.'],
  ['o_sabot','Sabotaj','explosion-rays',400,0.6,'Düşman ordusunun %5\'ini ve ekonomisini vurur.'],
  ['o_cyber','Siber Saldırı','cyber-eye',300,0.65,'Hazineden para çalar, araştırmayı yavaşlatır.','i_cybero'],
  ['o_unrest','İsyan Kışkırt','fist',500,0.5,'Hedefte istikrarı ve halk desteğini çökertir.'],
  ['o_elect','Seçim Müdahalesi','vote',600,0.45,'Hedefin size bakışını iyileştirir (demokrasiler).'],
  ['o_coup','Darbe Destekle','hood',1200,0.3,'Hükümeti devirip size dost bir rejim kurar.'],
  ['o_smear','Karalama Kampanyası','megaphone',250,0.7,'Hedefin dünya ile ilişkilerini bozar.']
];

GD.ACHIEVEMENTS = [
  ['a_first','İlk Fetih','flag-objective','İlk toprağını ele geçir.'],['a_annex','İlhak','stamper','Bir ülkeyi tamamen yok et.'],['a_five','Fatih','sword-brandish','5 ülkeyi yok et.'],
  ['a_10p','Bölgesel Güç','tower-flag','Dünya karalarının %5\'ine sahip ol.'],['a_25p','Süper Güç','castle','Dünya karalarının %15\'ine sahip ol.'],['a_50p','Dünya İmparatorluğu','crown','Dünya karalarının %35\'ine sahip ol.'],
  ['a_ally','Müttefik','shaking-hands','Bir ittifak kur.'],['a_coal','Koalisyon Kurucusu','team-upgrade','Kendi koalisyonunu kur.'],['a_peace','Barış Elçisi','peace-dove','Bir savaşı barışla bitir.'],
  ['a_rich','Ekonomi Devi','coins-pile','Hazinede 50.000 M$ biriktir.'],['a_army','Dev Ordu','rally-the-troops','2 milyon askere ulaş.'],['a_tech10','Bilim İnsanı','test-tubes','10 teknoloji araştır.'],
  ['a_tech30','Teknoloji Lideri','atom','30 teknoloji araştır.'],['a_nuke','Kıyamet Günü','nuclear-bomb','Nükleer silah kullan.'],['a_spy','Gölge Usta','spy','5 başarılı casusluk operasyonu.'],
  ['a_coup','Kral Yapıcı','hood','Başarılı bir darbe destekle.'],['a_naval','Çıkarma Ustası','anchor','Deniz çıkarması yap.'],['a_survive','Hayatta Kalan','shield','10 yıl hayatta kal.'],
  ['a_disaster','Kriz Yöneticisi','siren','5 doğal afeti atlat.'],['a_popular','Halkın Sevgilisi','thumb-up','Halk desteğini %90 üstüne çıkar.'],['a_mars','Kızıl Gezegen','rocket','Mars Kolonisi kur.'],
  ['a_capital','Başkent Düştü','castle-ruins','Bir düşman başkentini ele geçir.'],['a_vassal','Hükümdar','chess-king','Bir ülkeyi kuklan yap.'],['a_un','Barış Gücü','globe','BM oylamasında 3 kez kazanan tarafta ol.']
];

GD.TIPS = ['Haritada bir ülkeye tıklayıp savaş ilan edebilir, ardından "Saldırı Hedefi" ile ilerleme yönünü seçebilirsiniz.','Halk desteği %30\'un altına düşerse protestolar ve darbe girişimleri başlar.',
 'Okyanus aşırı saldırılar için yeterli deniz gücü gerekir: Ordu > Deniz Çıkarması.','Müttefikleriniz düşmanlarınızla savaşa otomatik olarak katılabilir.','Koalisyonlar ortak savunma sağlar, ancak bazı ülkeleri kızdırabilir.',
 'İşgal edilen topraklar barıştan sonra zamanla entegre olur. Milli Kimlik teknolojisi huzursuzluğu azaltır.','Teknoloji ağacındaki Mars Kolonisi size bilim zaferi kazandırır.','Deprem riski yüksek ülkelerde Kentsel Dönüşüm araştırmak hayat kurtarır.',
 'Kuşatılan düşman bölgeleri kendiliğinden teslim olur.','Gazete, dünyada olan biteni ve halkın size bakışını gösterir.','Nükleer silah kullanmak dünya gerilimini zirveye taşır.','Başkent düşen ülkeler büyük moral kaybı yaşar.'];

// Scenario builder helpers: own(map) where map {OWNERCODE:[list]}
GD.SCENARIOS = [
  { id:'modern', n:'Modern Dünya 2026', year:2026, img:'sc_modern', diff:2, desc:'Günümüz dünyası. Rusya–Ukrayna savaşı sürüyor, Orta Doğu karışık, büyük güçler nüfuz mücadelesinde. Kendi yolunu çiz.',
    wars:[['RU','UA']], occupy:[['RU','UA',{lonMin:36.5}],['RU','UA',{latMax:46.3,lonMin:32.5}]], coal:['NATO','CSTO','EU','SCO','ARAB','TURKIC','GCC','ASEAN','AU','BRICS','MERCOSUR'], aggr:0.5 },
  { id:'ww3', n:'III. Dünya Savaşı 2030', year:2030, img:'sc_ww3', diff:4, desc:'Tayvan krizi tetiği çekti. NATO ve müttefikleri, Rusya–Çin–İran–Kuzey Kore ekseniyle topyekün savaşta. Dünya alevler içinde.',
    wars:[['RU','UA'],['CN','TW'],['RU','PL'],['CN','US'],['RU','US'],['IR','IL'],['KP','KR'],['CN','JP'],['RU','EE'],['RU','LV'],['RU','LT'],['RU','FI'],['IR','SA'],['BY','PL'],['CN','PH'],['KP','US']],
    coal:['NATO','CSTO','EU','SCO','GCC','AU'], extraCoal:[{id:'AXIS',n:'Avrasya Ekseni',flag:'SU',type:'askeri',color:[160,20,20],m:'RU CN IR KP BY'}], aggr:0.85 },
  { id:'cold', n:'Soğuk Savaş 1983', year:1983, img:'sc_cold', diff:3, desc:'Demir Perde Avrupa\'yı bölüyor. Sovyetler Birliği Afganistan\'da, İran–Irak savaşı sürüyor. DEFCON seviyesi kritik.',
    own:{SU:'RU UA BY KZ UZ TM KG TJ AZ AM GE MD LT LV EE',YU:'RS HR BA SI ME MK XK',CS:'CZ SK',ROC_TW:''},
    names:{SU:['Sovyetler Birliği','SU','komunizm'],YU:['Yugoslavya','YU','komunizm'],CS:['Çekoslovakya','CS','komunizm']},
    govs:{PL:'komunizm',HU:'komunizm',RO:'komunizm',BG:'komunizm',AL:'komunizm',DE:'demokrasi',IR:'teokrasi',IQ:'otoriter',AF:'komunizm',ET:'komunizm',AO:'komunizm',MZ:'komunizm',ZA:'otoriter',CL:'cunta',AR:'cunta',KH:'komunizm',MN:'komunizm',YE:'komunizm'},
    wars:[['IR','IQ'],['SU','AF']], coal:['NATO'], extraCoal:[{id:'WARSAW',n:'Varşova Paktı',flag:'SU',type:'askeri',color:[190,30,30],m:'SU PL HU RO BG CS'}], noCoal:['CSTO','EU','SCO','BRICS','TURKIC'], aggr:0.55 },
  { id:'ww1', n:'I. Dünya Savaşı 1914', year:1914, img:'sc_ww1', diff:3, desc:'Saraybosna\'da sıkılan kurşun imparatorlukları savaşa sürükledi. İttifak Devletleri, İtilaf Devletleri\'ne karşı. Osmanlı son kez sahnede.',
    own:{OE:'TR SY IQ IL PS LB JO KKTC CY',RU_EMP:'RU UA BY FI PL LT LV EE MD GE AM AZ KZ UZ TM KG TJ',GE_EMP:'DE',AH:'AT HU CZ SK SI HR BA',GB:'GB IE IN PK BD MM LK CA AU NZ ZA EG SD KE UG NG GH SL MY SG BW ZW ZM MW BZ GY JM BS KW AE QA BH OM YE NA SO',
      FR:'FR DZ TN MA SN ML NE MR GN CI BF BJ TD CF CG GA CM VN LA KH MG DJ',IT_KGD:'IT LY ER',JP_EMP:'JP KR KP TW',QING:'CN MN',US:'US PH PR CU',BE:'BE CD RW BI',PT:'PT AO MZ GW',ES:'ES EH GQ',NL:'NL ID SR',DK:'DK GL IS'},
    names:{OE:['Osmanlı İmparatorluğu','OE','monarsi'],RU_EMP:['Rus İmparatorluğu','RU_EMP','monarsi'],GE_EMP:['Alman İmparatorluğu','GE_EMP','monarsi'],AH:['Avusturya-Macaristan','AH','monarsi'],JP_EMP:['Japon İmparatorluğu','JP_EMP','monarsi'],QING:['Çin Cumhuriyeti','ROC','otoriter'],IT_KGD:['İtalya Krallığı','IT_KGD','monarsi'],GB:['Britanya İmparatorluğu','GB','monarsi'],FR:['Fransız Sömürge İmparatorluğu','FR','demokrasi']},
    wars:[['AH','RS'],['GE_EMP','FR'],['GE_EMP','RU_EMP'],['GE_EMP','GB'],['AH','RU_EMP'],['OE','RU_EMP'],['OE','GB'],['GE_EMP','BE'],['OE','FR']],
    extraCoal:[{id:'CENTRAL',n:'İttifak Devletleri',flag:'GE_EMP',type:'askeri',color:[60,60,60],m:'GE_EMP AH OE BG'},{id:'ENTENTE',n:'İtilaf Devletleri',flag:'GB',type:'askeri',color:[60,90,170],m:'GB FR RU_EMP RS BE JP_EMP'}], noCoal:'all', aggr:0.6, era:1914 },
  { id:'ww2', n:'II. Dünya Savaşı 1939', year:1939, img:'sc_ww2', diff:3, desc:'Avrupa yeniden savaşta. Mihver Devletleri hızla yayılıyor, Müttefikler direniyor. Türkiye tarafsız — şimdilik.',
    own:{GE_EMP:'DE AT CZ',IT_KGD:'IT AL LY ET ER SO',JP_EMP:'JP KR KP TW',SU:'RU UA BY KZ UZ TM KG TJ AZ AM GE MN',GB:'GB IN PK BD MM LK CA AU NZ ZA EG SD KE UG NG GH MY SG BW ZW ZM IQ JO IL PS KW',FR:'FR DZ TN MA SN ML NE MR GN CI BF BJ TD CF CG GA CM VN LA KH MG SY LB',ROC:'CN TW_',NL:'NL ID SR',BE:'BE CD',PT:'PT AO MZ',US:'US PH PR'},
    names:{GE_EMP:['Alman Reich','GE_EMP','otoriter'],IT_KGD:['İtalya Krallığı','IT_KGD','otoriter'],JP_EMP:['Japon İmparatorluğu','JP_EMP','monarsi'],SU:['Sovyetler Birliği','SU','komunizm'],GB:['Britanya İmparatorluğu','GB','monarsi'],FR:['Fransa','FR','demokrasi'],ROC:['Çin Cumhuriyeti','ROC','otoriter']},
    wars:[['GE_EMP','PL'],['GB','GE_EMP'],['FR','GE_EMP'],['JP_EMP','ROC']],
    extraCoal:[{id:'AXIS',n:'Mihver Devletleri',flag:'GE_EMP',type:'askeri',color:[70,70,70],m:'GE_EMP IT_KGD JP_EMP'},{id:'ALLIES',n:'Müttefikler',flag:'GB',type:'askeri',color:[60,90,170],m:'GB FR PL'}], noCoal:'all', aggr:0.7, era:1939 },
  { id:'ottoman', n:'Osmanlı Zirvesi 1683', year:1683, img:'sc_ottoman', diff:2, desc:'Osmanlı İmparatorluğu Viyana kapılarında. Üç kıtaya yayılan cihan devleti, Habsburglar, Safeviler ve Ruslarla çevrili.',
    own:{OE:'TR GR BG RO MD RS BA ME MK AL XK HU CY KKTC SY IQ LB IL PS JO EG LY TN DZ GE AM KW',SAFAVID:'IR AZ AF',MUGHAL:'IN PK BD NP',HABS:'AT CZ SK SI HR',PLLT:'PL LT BY UA LV',RUSSIA:'RU KZ',QING:'CN MN TW',ES:'ES MX GT HN SV NI CR PA CO VE EC PE BO CL AR PY UY CU PH',PT:'PT BR AO MZ',GB:'GB IE',FR:'FR',SE:'SE FI EE',MA:'MA EH',NL:'NL ID'},
    names:{OE:['Osmanlı İmparatorluğu','OE','monarsi'],SAFAVID:['Safevi Devleti','IR_SHAH','monarsi'],MUGHAL:['Babür İmparatorluğu','MUGHAL','monarsi'],HABS:['Habsburg Monarşisi','AH','monarsi'],PLLT:['Lehistan-Litvanya','PL','monarsi'],RUSSIA:['Rus Çarlığı','RU_EMP','monarsi'],QING:['Çing Hanedanı','QING','monarsi'],ES:['İspanya İmparatorluğu','ES_FR','monarsi'],SE:['İsveç İmparatorluğu','SE','monarsi']},
    wars:[['OE','HABS'],['OE','PLLT']], noCoal:'all', aggr:0.6, era:1683 },
  { id:'rome', n:'Roma İmparatorluğu 117', year:117, img:'sc_rome', diff:2, desc:'Trajan döneminde Roma en geniş sınırlarında. Partlar doğuda, barbar kabileler kuzeyde. Ebedi şehri koru ve genişlet.',
    own:{ROMA:'IT ES PT FR BE NL CH AT SI HR BA RS ME AL MK XK GR BG RO TR CY KKTC SY LB IL PS JO EG LY TN DZ MA GB HU AM AZ GE IQ',PARTH:'IR AF TM',HAN:'CN KP KR',KUSHAN:'PK IN UZ TJ',},
    names:{ROMA:['Roma İmparatorluğu','ROMA','monarsi'],PARTH:['Part İmparatorluğu','IR_SHAH','monarsi'],HAN:['Han Hanedanı','QING','monarsi'],KUSHAN:['Kuşan İmparatorluğu','MUGHAL','monarsi']},
    wars:[['ROMA','PARTH']], noCoal:'all', aggr:0.55, era:117 },
  { id:'mongol', n:'Moğol Fırtınası 1240', year:1240, img:'sc_mongol', diff:3, desc:'Cengiz Han\'ın torunları dünyayı sarsıyor. Moğol orduları Rus prensliklerini ve Avrupa kapılarını zorluyor.',
    own:{MONGOL:'MN KZ KG UZ TJ TM AF IR KP',SONG:'CN TW',RUS:'RU BY UA',SELJUK:'TR AM GE AZ',DELHI:'IN PK BD',HRE:'DE AT CZ NL BE CH IT',KHWAR:''},
    names:{MONGOL:['Moğol İmparatorluğu','MONGOL','monarsi'],SONG:['Song Hanedanı','QING','monarsi'],RUS:['Rus Prenslikleri','RU_EMP','monarsi'],SELJUK:['Anadolu Selçuklu Devleti','TR','monarsi'],DELHI:['Delhi Sultanlığı','MUGHAL','monarsi'],HRE:['Kutsal Roma Germen İmp.','GE_EMP','monarsi']},
    wars:[['MONGOL','RUS'],['MONGOL','SONG'],['MONGOL','SELJUK'],['MONGOL','PL'],['MONGOL','HU']], noCoal:'all', aggr:0.8, era:1240 },
  { id:'ussr', n:'Sovyetlerin Dönüşü 2028', year:2028, img:'sc_cold', diff:4, desc:'Moskova eski Sovyet cumhuriyetlerini tek bayrak altında topladı ve Baltık\'a yöneldi. NATO alarmda.',
    own:{SU:'RU BY KZ KG TJ AM'}, names:{SU:['Yeni Sovyetler Birliği','SU','komunizm']}, wars:[['SU','UA'],['SU','EE'],['SU','LV'],['SU','LT'],['SU','GE'],['SU','MD']], coal:['NATO','EU','TURKIC','SCO','GCC','ASEAN','AU','ARAB'], aggr:0.7 },
  { id:'turan', n:'Turan Birliği', year:2027, img:'sc_mongol', diff:2, desc:'Türk devletleri tek bir konfederasyonda birleşti: Turan. Hazar\'dan Altaylara uzanan yeni bir güç doğuyor.',
    own:{TURAN:'TR AZ KZ KG UZ TM KKTC'}, names:{TURAN:['Turan Birliği','TURKIC','demokrasi']}, coal:['NATO','CSTO','EU','SCO','ARAB','GCC','ASEAN','AU','BRICS'], aggr:0.5 },
  { id:'mideast', n:'Orta Doğu Ateşi 2027', year:2027, img:'sc_mideast', diff:3, desc:'İsrail–İran gerilimi topyekün savaşa döndü. Körfez, Levant ve Kızıldeniz alevler içinde. Bölge güçleri taraf seçiyor.',
    wars:[['IL','IR'],['IL','LB'],['SA','YE'],['IR','AE'],['IL','YE'],['SD','SS']], coal:['NATO','CSTO','EU','ARAB','GCC','TURKIC'], aggr:0.75 },
  { id:'balkan', n:'Balkan Barut Fıçısı', year:2027, img:'sc_balkan', diff:2, desc:'Sırbistan–Kosova krizi alevlendi, Ege\'de gerilim tırmanıyor. Balkanlar yine dünya siyasetinin merkezinde.',
    wars:[['RS','XK'],['RS','BA']], rel:[['GR','TR',-70],['RS','HR',-60],['AL','RS',-60]], coal:['NATO','EU','CSTO'], aggr:0.65 },
  { id:'africa', n:'Afrika Federasyonu', year:2035, img:'sc_royale', diff:3, desc:'Afrika Birliği tek devlete dönüştü: Afrika Federasyonu. Kıtanın kaynakları artık tek elde.',
    own:{AFRICA:'DZ AO BJ BW BF BI CM CV CF TD KM CG CD CI DJ GQ ER SZ ET GA GM GH GN GW KE LS LR MG MW ML MR MU MZ NA NE NG RW ST SN SC SL SO ZA SS SD TZ TG UG ZM ZW EH TN'},
    names:{AFRICA:['Afrika Federasyonu','AU_UNION','demokrasi']}, coal:['NATO','EU','SCO','ARAB'], aggr:0.5 },
  { id:'royale', n:'Herkes Herkese Karşı', year:2026, img:'sc_royale', diff:5, desc:'Tüm ittifaklar çöktü. Her ülke herkese karşı savaşta. Son ayakta kalan kazanır.', allWar:true, noCoal:'all', aggr:1 },
  { id:'plague', n:'Kızıl Sürü Salgını', year:2031, img:'sc_plague', diff:4, desc:'Bilinmeyen bir patojen orta Afrika\'da insanları "Sürü"ye dönüştürüyor. Sürü tüm insanlığa karşı savaşta ve hızla yayılıyor.',
    own:{HORDE:'CF'}, names:{HORDE:['Kızıl Sürü','HORDE','cunta']}, hordeWar:'HORDE', hordeBoost:{army:2000000}, coal:['NATO','EU','CSTO','SCO','AU','ARAB'], aggr:0.4 },
  { id:'machine', n:'Makine İsyanı 2045', year:2045, img:'sc_ww3', diff:5, desc:'Kontrolden çıkan askeri yapay zeka Kuzey Amerika\'nın batısını ele geçirdi. Makineler insanlığa savaş açtı.',
    cellOwn:[['MACHINE','US',{lonMax:-114,latMin:31,latMax:42}]], names:{MACHINE:['Makine Kolektifi','MACHINE','cunta']}, hordeWar:'MACHINE', hordeBoost:{army:3500000,tech:true}, coal:['NATO','EU','CSTO','SCO'], aggr:0.4 },
  { id:'peace', n:'Barış Dünyası (Sandbox)', year:2026, img:'sc_modern', diff:1, desc:'Savaş yok, saldırgan yapay zeka yok. Ekonomini kur, teknolojini geliştir ve dünyayı kendi tarzında şekillendir.', coal:['NATO','EU','CSTO','SCO','ARAB','TURKIC','GCC','ASEAN','AU','BRICS','MERCOSUR'], aggr:0.08 }
];
// Temel senaryolar (sade sürüm)
GD.ALL_SCENARIOS = GD.SCENARIOS;
GD.SCENARIOS = GD.SCENARIOS.filter(s=>['modern','ww3','cold','ww1','ww2','ottoman'].includes(s.id));
