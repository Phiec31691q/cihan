// ============ NEWS & EVENTS ============
'use strict';

// Turkish vowel-harmony suffix fixer: "ABD'in" -> "ABD'nin", "Rusya'e" -> "Rusya'ya"
const TRV='aeıioöuüAEIİOÖUÜ';
function trSuf(word,suf){ let w=word.replace(/\.$/,''); let last, endsV, hard=false;
  if(w.length>1&&w===w.toLocaleUpperCase('tr')&&/[A-ZÇĞİÖŞÜ]$/.test(w)){ const L=w[w.length-1]; last=({K:'a',I:'ı',O:'o',U:'u',Ö:'ö',Ü:'ü',A:'a',İ:'i'})[L]||'e'; endsV=true; }
  else { const lw=w.toLocaleLowerCase('tr'); const vs=lw.match(/[aeıioöuü]/g); last=vs?vs[vs.length-1]:'e'; endsV=TRV.includes(lw[lw.length-1]); hard=/[fsthşçkp]$/.test(lw); }
  const back='aıou'.includes(last); const round='ouöü'.includes(last);
  const I=back?(round?'u':'ı'):(round?'ü':'i'); const E=back?'a':'e';
  const t=suf.toLocaleLowerCase('tr'); let k=/^(n?[iıuü]n)$/.test(t)?'gen':/^(y?[ea])$/.test(t)?'dat':/^(y?[iıuü])$/.test(t)?'acc':/^([dt][ea])$/.test(t)?'loc':/^([dt][ea]n)$/.test(t)?'abl':null;
  if(!k) return word+"'"+suf;
  const r={gen:(endsV?'n':'')+I+'n',dat:(endsV?'y':'')+E,acc:(endsV?'y':'')+I,loc:(hard?'t':'d')+E,abl:(hard?'t':'d')+E+'n'}[k];
  return w+"'"+r; }
function trFix(s){ if(!s||typeof s!=='string') return s; return s.replace(/([A-Za-zÇĞİıÖŞÜçğöşüâîû]+)'(nin|nın|nun|nün|in|ın|un|ün|ye|ya|e|a|yi|yı|yu|yü|i|ı|u|ü|den|dan|ten|tan|de|da|te|ta)(?![a-zçğıöşü])/g,(m,w,suf)=>trSuf(w,suf)); }

const News={
  add(cat,title,text,img,nations){ title=trFix(title); text=trFix(text); const it={day:G.day,cat,title,text:text||'',img:img||'ev_diplomacy',nations:(nations||[]).filter(x=>x!=null),id:Math.random()};
    G.news.unshift(it); if(G.news.length>250) G.news.pop(); UI.ticker&&UI.ticker(it); return it; }
};
const NEWSPAPERS=['Dünya Postası','Küresel Haber','Akşam Telgrafı','Global Times','Sabah Gazetesi'];
function cityOf(n,big){ const cs=[]; for(const k in M.cityByCell){ if(M.owner[k]==n.id) M.cityByCell[k].forEach(ci=>cs.push(CITIES[ci])); }
  if(!cs.length) return {name:n.capName||n.name,cell:n.capital}; cs.sort((a,b)=>b[4]-a[4]); const c=big?cs[0]:cs[Math.min(cs.length-1,(Math.random()**1.6*cs.length)|0)]; return {name:c[0],cell:c[3],pop:c[4]}; }
const Events={ cool:0, disasterCount:0 };
Events.T=[
 { id:'quake', w:n=>GD.SEISMIC.has(n.code)?2.2:0.15, img:'ev_quake', icon:'earth-crack', fx:'quake',
   title:c=>`${c.city.name}'de ${c.mag} büyüklüğünde deprem`, text:(n,c)=>`${c.city.name} merkezli şiddetli deprem binlerce binayı yıktı. Arama kurtarma ekipleri enkaz altındakilere ulaşmaya çalışıyor. Bölge ekonomisi ağır darbe aldı.`,
   pre:(n,c)=>{c.mag=(6+Math.random()*1.8).toFixed(1); const t=G.techMod(n); c.sev=(c.mag-5.5)*(1-(t.quake||0))*(1-(t.disaster||0))*(1-n.bld.afet*0.04);},
   ch:[ {t:'Tüm kaynakları seferber et',d:'Hazine -%5, destek +',e:(n,c)=>{n.money-=Math.max(100,n.money*0.05);n.econ*=1-0.004*c.sev;n.appMod+=6;}},
        {t:'Uluslararası yardım iste',d:'İlişkiler +, prestij -',e:(n,c)=>{n.econ*=1-0.008*c.sev;n.appMod-=2;n.money+=n.income*4;G.nations.forEach(x=>{if(x.alive&&G.rel_(x.id,n.id)>20)G.addRel(x.id,n.id,4,false);});}},
        {t:'Yerel yönetimlere bırak',d:'Para harcanmaz, destek ciddi düşer',e:(n,c)=>{n.econ*=1-0.014*c.sev;n.appMod-=12;n.stabMod-=6;}} ]},
 { id:'flood', w:n=>GD.FLOODY.has(n.code)?1.8:0.4, img:'ev_flood', icon:'flood', fx:'flood',
   title:c=>`${c.city.name} sular altında: Sel felaketi`, text:(n,c)=>`Günlerdir süren sağanak ${c.city.name} ve çevresinde dereleri taşırdı. Tarım arazileri ve altyapı büyük zarar gördü, binlerce kişi evsiz kaldı.`,
   pre:(n,c)=>{const t=G.techMod(n);c.sev=1-(t.disaster||0)-n.bld.afet*0.04;},
   ch:[ {t:'Acil durum fonu aç',d:'Hazine -, destek +',e:(n,c)=>{n.money-=Math.max(60,n.income*5);n.econ*=1-0.003*c.sev;n.appMod+=4;}},
        {t:'Altyapı yatırımı başlat',d:'Pahalı ama kalıcı: Afet Merkezi +1',e:(n,c)=>{n.money-=Math.max(150,n.income*10);n.bld.afet=Math.min(15,n.bld.afet+1);n.appMod+=2;}},
        {t:'Kaynak ayırma',d:'Ekonomi ve destek düşer',e:(n,c)=>{n.econ*=1-0.009*c.sev;n.appMod-=8;}} ]},
 { id:'fire', w:n=>GD.FIREY.has(n.code)?1.4:0.25, img:'ev_fire', icon:'wildfires', fx:'fire',
   title:c=>`${c.city.name} çevresinde dev orman yangını`, text:(n,c)=>`Kuvvetli rüzgarla büyüyen yangın on binlerce hektar ormanı küle çevirdi. Köyler tahliye ediliyor.`,
   ch:[ {t:'Yangın söndürme uçakları kirala',d:'Hazine -, destek +',e:n=>{n.money-=Math.max(50,n.income*3);n.appMod+=4;}},
        {t:'Orduyu görevlendir',d:'Asker gücü kısa süre azalır',e:n=>{n.u.piyade*=0.99;n.appMod+=2;}},
        {t:'Doğal sürece bırak',d:'Destek düşer',e:n=>{n.econ*=0.996;n.appMod-=7;}} ]},
 { id:'drought', w:n=>0.4, img:'ev_fire', icon:'sun', title:c=>`Kuraklık alarmı: Hasat yarıya düştü`, text:n=>`Kurak geçen mevsim tarım üretimini çökertti; gıda fiyatları hızla yükseliyor.`,
   ch:[ {t:'Gıda ithalatı yap',d:'Hazine -',e:n=>{n.money-=Math.max(80,n.income*6);}}, {t:'Fiyat kontrolü uygula',d:'Enflasyon +, destek +',e:n=>{n.inflation+=2;n.appMod+=2;}}, {t:'Halk idare etsin',d:'Destek -',e:n=>{n.appMod-=8*(1-(G.techMod(n).agri||0));}} ]},
 { id:'plague', w:n=>0.3, img:'ev_disease', icon:'virus', title:c=>`${c.city.name}'de yeni bir salgın baş gösterdi`, text:(n,c)=>`Hızla yayılan virüs hastaneleri doldurdu. Sağlık bakanlığı olağanüstü önlemler tartışıyor.`,
   pre:(n,c)=>{const t=G.techMod(n);c.sev=1-(t.plague||0)-n.bld.hastane*0.02;},
   ch:[ {t:'Sokağa çıkma yasağı',d:'Ekonomi -, salgın durur',e:(n,c)=>{n.econ*=1-0.01*c.sev;n.stabMod+=3;}}, {t:'Aşı kampanyası',d:'Hazine -',e:(n,c)=>{n.money-=Math.max(80,n.income*6);n.appMod+=3;}}, {t:'Hayat devam etsin',d:'Nüfus ve destek düşer',e:(n,c)=>{n.popMul=(n.popMul||1)*(1-0.004*c.sev);n.appMod-=9;n.u.piyade*=0.99;}} ]},
 { id:'crisis', w:n=>n.debt>n.gdp*300?2:0.45, img:'ev_economy', icon:'histogram', title:c=>`Borsa çöktü: Ekonomik kriz kapıda`, text:n=>`Ulusal para birimi bir haftada sert değer kaybetti. Yatırımcılar kaçıyor, işsizlik yükseliyor.`,
   ch:[ {t:'Faiz artır',d:'Büyüme -, enflasyon -',e:n=>{n.econ*=0.985;n.inflation=Math.max(1,n.inflation-3);n.appMod-=3;}}, {t:'Kurtarma paketi',d:'Hazine --, ekonomi korunur',e:n=>{n.money-=Math.max(200,n.income*12);n.econ*=0.995;}}, {t:'Para bas',d:'Hazine +, enflasyon ++',e:n=>{n.money+=n.income*8;n.inflation+=6;n.econ*=0.99;n.appMod-=5;}} ]},
 { id:'strike', w:n=>n.approval<55?1:0.3, img:'ev_protest', icon:'fist', title:c=>`${c.city.name}'de genel grev`, text:(n,c)=>`Sendikalar düşük ücretler ve yükselen hayat pahalılığı nedeniyle iş bıraktı. Fabrikalar durdu.`,
   ch:[ {t:'Zam yap',d:'Hazine -, destek +',e:n=>{n.money-=Math.max(60,n.income*4);n.appMod+=5;}}, {t:'Müzakere et',d:'Küçük maliyet',e:n=>{n.money-=n.income;n.appMod+=1;}}, {t:'Grevi yasakla',d:'İstikrar +, destek --',e:n=>{n.appMod-=10;n.stabMod+=4;}} ]},
 { id:'protest', w:n=>n.approval<45?2.5:0.15, img:'ev_protest', icon:'shouting', fx:'protest', title:c=>`${c.city.name}'de hükümet karşıtı dev protesto`, text:(n,c)=>`Yüz binlerce kişi "${c.reason}" sloganlarıyla meydanlara akın etti. Polis ile göstericiler arasında arbede yaşandı.`,
   pre:(n,c)=>{c.reason=n.weary>15?'Savaşa hayır':n.tax>0.28?'Vergi zulmüne son':n.unpopAlly>5?'Onursuz ittifaka hayır':n.inflation>8?'Pahalılığa dur de':'Hükümet istifa';},
   ch:[ {t:'Taleplere kulak ver',d:'Destek +, istikrar -',e:n=>{n.appMod+=6;n.stabMod-=2;if(n.tax>0.22)n.tax-=0.02;}}, {t:'Polis müdahalesi',d:'İstikrar +, destek -',e:n=>{n.stabMod+=5;n.appMod-=6;G.nations.forEach(x=>{if(x.alive&&x.gov==='demokrasi')G.addRel(x.id,n.id,-3,false);});}}, {t:'Sessiz kal',d:'Etkisi belirsiz',e:n=>{n.stabMod-=4;}} ]},
 { id:'coup', w:n=>n.stability<25?2.5:0.02, img:'ev_protest', icon:'hood', title:c=>`DARBE GİRİŞİMİ: Tanklar ${c.city.name} sokaklarında`, text:(n,c)=>`Ordu içindeki bir cunta yönetime el koymaya çalışıyor. Kritik saatler yaşanıyor.`,
   ch:[ {t:'Halkı sokağa çağır',d:'Destek yüksekse başarılı',e:n=>{ if(Math.random()<n.approval/70){n.appMod+=12;n.stabMod+=10;UI.toast('Darbe girişimi halk tarafından püskürtüldü','ok','shield');} else {n.gov='cunta';n.stabMod-=15;n.u.piyade*=0.9;UI.toast('Darbe başarılı oldu! Yönetim artık askeri cunta.','danger','hood');} }},
        {t:'Sadık birlikleri gönder',d:'Asker kaybı, istikrar +',e:n=>{n.u.piyade*=0.93;n.u.tank*=0.95;n.stabMod+=8;}}, {t:'Müzakere et',d:'Cunta ile güç paylaşımı',e:n=>{n.stabMod+=3;n.appMod-=8;n.policies.add('p_martial');n._tm=null;}} ]},
 { id:'terror', w:n=>n.wars.size?0.8:0.25, img:'ev_terror', icon:'explosion-rays', fx:'terror', title:c=>`${c.city.name}'de bombalı saldırı`, text:(n,c)=>`Kalabalık bir caddede meydana gelen patlama ülkeyi yasa boğdu. Güvenlik güçleri olası failleri arıyor.`,
   ch:[ {t:'Olağanüstü hal ilan et',d:'İstikrar +, destek -',e:n=>{n.stabMod+=4;n.appMod-=2;}}, {t:'Sınır ötesi operasyon',d:'Destek +, gerilim +',e:n=>{n.appMod+=4;G.tension+=4;}}, {t:'Birlik çağrısı yap',d:'Destek +',e:n=>{n.appMod+=3;}} ]},
 { id:'cyber', w:n=>0.3, img:'ev_tech', icon:'cyber-eye', title:c=>`Siber saldırı: Devlet sistemleri çöktü`, text:n=>`Kimliği belirsiz hackerlar bankacılık ve e-devlet altyapısını felç etti.`,
   pre:(n,c)=>{c.sev=1-(G.techMod(n).cyberd||0);},
   ch:[ {t:'Fidye öde',d:'Hazine -',e:(n,c)=>{n.money-=Math.max(50,n.income*3*c.sev);}}, {t:'Sistemleri sıfırla',d:'Ekonomi kısa süre durur',e:(n,c)=>{n.econ*=1-0.006*c.sev;n.research*=0.9;}}, {t:'Karşı saldırı başlat',d:'Gerilim +',e:n=>{G.tension+=3;n.appMod+=2;}} ]},
 { id:'refugee', w:n=>[...G.wars].some(w=>G.neigh?.[n.id]?.has(w.a)||G.neigh?.[n.id]?.has(w.b))?1.5:0.1, img:'ev_protest', icon:'family-house', title:c=>`Sınırda mülteci akını`, text:n=>`Komşu ülkelerdeki savaştan kaçan yüz binlerce kişi sınır kapılarına dayandı.`,
   ch:[ {t:'Kapıları aç',d:'İnsan gücü +, destek -',e:n=>{n.manpower+=n.mpMax*0.05;n.appMod-=5;G.nations.forEach(x=>{if(x.alive&&x.gov==='demokrasi')G.addRel(x.id,n.id,3,false);});}}, {t:'Kamplar kur',d:'Hazine -',e:n=>{n.money-=Math.max(60,n.income*4);}}, {t:'Sınırı kapat',d:'Destek +, ilişkiler -',e:n=>{n.appMod+=3;G.nations.forEach(x=>{if(x.alive&&x.gov==='demokrasi')G.addRel(x.id,n.id,-4,false);});}} ]},
 { id:'oil', w:n=>n.oil>0?0.5:0.2, img:'ev_oil', icon:'oil-pump', good:1, title:c=>`${c.city.name} açıklarında dev petrol rezervi bulundu`, text:n=>`Enerji bakanlığı keşfin ülkenin dışa bağımlılığını azaltacağını açıkladı.`,
   ch:[ {t:'Devlet şirketi işletsin',d:'Petrol üretimi +',e:n=>{n.oil+=0.3;n.appMod+=4;}}, {t:'Yabancı şirketlere ihale et',d:'Anında gelir',e:n=>{n.money+=n.income*25;n.oil+=0.15;}} ]},
 { id:'gold', w:n=>0.25, img:'ev_oil', icon:'gold-bar', good:1, title:c=>`${c.city.name} yakınlarında altın madeni`, text:n=>`Jeologlar bölgede yüksek tenörlü altın yatakları tespit etti.`, ch:[ {t:'Hemen işletmeye aç',d:'Hazine ++, çevreciler kızgın',e:n=>{n.money+=n.income*18;n.appMod-=2;}}, {t:'Çevre dostu madencilik',d:'Hazine +',e:n=>{n.money+=n.income*9;n.appMod+=2;}} ]},
 { id:'breakthrough', w:n=>0.35, img:'ev_tech', icon:'lightbulb', good:1, title:c=>`${c.city.name} Üniversitesi'nden çığır açan buluş`, text:n=>`Ulusal bilim insanlarının geliştirdiği teknoloji dünya basınında manşet oldu.`, ch:[ {t:'Askeri projelere aktar',d:'Araştırma +',e:n=>{n.research+=n.rp*25;}}, {t:'Patent sat',d:'Hazine +',e:n=>{n.money+=n.income*10;}} ]},
 { id:'olympics', w:n=>n.gdp>500?0.2:0.03, img:'ev_diplomacy', icon:'trophy', good:1, title:c=>`${c.city.name} olimpiyatlara ev sahipliği yapacak`, text:n=>`Uluslararası Olimpiyat Komitesi kararını açıkladı; ülke genelinde coşku var.`, ch:[ {t:'Büyük bütçe ayır',d:'Hazine -, prestij ++',e:n=>{n.money-=n.income*12;n.appMod+=10;G.nations.forEach(x=>{if(x.alive)G.addRel(x.id,n.id,3,false);});}}, {t:'Mütevazı organizasyon',d:'Destek +',e:n=>{n.money-=n.income*4;n.appMod+=4;}} ]},
 { id:'tourism', w:n=>n.wars.size?0:0.35, img:'ev_diplomacy', icon:'sun', good:1, title:c=>`Turizmde rekor yıl`, text:n=>`Yabancı ziyaretçi sayısı tüm zamanların en yüksek seviyesine ulaştı.`, ch:[ {t:'Harika',d:'Hazine +',e:n=>{n.money+=n.income*8;n.appMod+=2;}} ]},
 { id:'invest', w:n=>n.stability>60?0.4:0.1, img:'ev_economy', icon:'profit', good:1, title:c=>`Yabancı devlerden ${c.city.name}'e milyar dolarlık yatırım`, text:n=>`Teknoloji ve otomotiv şirketleri yeni fabrikalar kuracağını duyurdu.`, ch:[ {t:'Vergi teşviki ver',d:'Fabrika +1, gelir -',e:n=>{n.bld.fabrika=Math.min(40,n.bld.fabrika+1);}}, {t:'Standart koşullar',d:'Hazine +',e:n=>{n.money+=n.income*6;}} ]},
 { id:'scandal', w:n=>0.3, img:'ev_protest', icon:'newspaper', title:c=>`Yolsuzluk skandalı: Bakanlar sorgulanıyor`, text:n=>`Araştırmacı gazetecilerin ortaya çıkardığı belgeler kabineyi sarstı.`, ch:[ {t:'Bakanları görevden al',d:'İstikrar -, destek +',e:n=>{n.stabMod-=4;n.appMod+=3;}}, {t:'Haberi sansürle',d:'Destek -, basın özgürlüğü -',e:n=>{n.appMod-=4;G.nations.forEach(x=>{if(x.alive&&x.gov==='demokrasi')G.addRel(x.id,n.id,-2,false);});}}, {t:'Bağımsız soruşturma',d:'Hazine -, destek ++',e:n=>{n.money-=n.income*2;n.appMod+=5;}} ]},
 { id:'braindrain', w:n=>n.approval<50?0.4:0.1, img:'ev_tech', icon:'brain', title:c=>`Beyin göçü hızlanıyor`, text:n=>`Genç akademisyenler ve mühendisler yurt dışına göç ediyor.`, ch:[ {t:'Bilim insanlarına teşvik',d:'Hazine -',e:n=>{n.money-=n.income*5;}}, {t:'Önemseme',d:'Araştırma -',e:n=>{n.research*=0.85;n.rp*=0.95;}} ]},
 { id:'nuclearleak', w:n=>n.bld.santral>2||GD.NUKES[n.code]?0.15:0, img:'ev_nuke', icon:'nuclear-plant', title:c=>`${c.city.name} nükleer santralinde sızıntı`, text:n=>`Reaktör soğutma sistemindeki arıza radyasyon alarmına yol açtı.`, ch:[ {t:'Bölgeyi tahliye et',d:'Ekonomi -',e:n=>{n.econ*=0.99;n.appMod+=2;}}, {t:'Bilgiyi gizle',d:'Risk',e:n=>{if(Math.random()<0.5){n.appMod-=14;UI.toast('Sızıntı basına sızdı! Destek çöktü.','danger','nuclear');}}} ]},
 { id:'army_morale', w:n=>n.wars.size&&n.weary>10?1:0, img:'ev_war', icon:'broken-shield', title:c=>`Cephede moral bozukluğu`, text:n=>`Uzayan savaş askerlerin moralini düşürdü; firar vakaları artıyor.`, ch:[ {t:'Maaşları artır',d:'Hazine -, moral +',e:n=>{n.money-=n.income*6;n.weary=Math.max(0,n.weary-8);}}, {t:'Disiplin cezaları',d:'Destek -',e:n=>{n.appMod-=4;n.u.piyade*=0.99;}} ]},
 { id:'volunteers', w:n=>n.wars.size&&n.approval>55?0.9:0, img:'ev_war', icon:'rally-the-troops', good:1, title:c=>`Gönüllüler askerlik şubelerine akın etti`, text:n=>`Vatan savunması çağrısına yüz binlerce genç yanıt verdi.`, ch:[ {t:'Tümen kur',d:'+25.000 asker',e:n=>{n.u.piyade+=25000;}}, {t:'Yedekte tut',d:'İnsan gücü +',e:n=>{n.manpower+=n.mpMax*0.08;}} ]},
 { id:'arms_deal', w:n=>0.25, img:'ev_diplomacy', icon:'ammo-box', good:1, title:c=>`Silah satışı teklifi`, text:n=>`Bir müttefik ülke savunma sanayimizden büyük alım yapmak istiyor.`, ch:[ {t:'Tankları sat (100)',d:'Hazine ++',e:n=>{const k=Math.min(100,n.u.tank);n.u.tank-=k;n.money+=k*8;}}, {t:'Reddet',d:'',e:n=>{}} ]},
 { id:'locust', w:n=>['SA','YE','ET','SO','KE','PK','IN','EG','SD','MR','ML','NE','TD'].includes(n.code)?0.6:0.03, img:'ev_fire', icon:'wheat', title:c=>`Çekirge istilası tarlaları kasıp kavurdu`, text:n=>`Milyarlarca çekirgeden oluşan sürü hasadı yok etti.`, ch:[ {t:'İlaçlama yap',d:'Hazine -',e:n=>{n.money-=n.income*3;}}, {t:'Bekle',d:'Ekonomi -',e:n=>{n.econ*=0.993;n.appMod-=4;}} ]},
 { id:'storm', w:n=>['US','PH','JP','CN','BD','IN','MX','CU','HT','DO','VN','TW','KR','AU'].includes(n.code)?0.9:0.05, img:'ev_flood', icon:'tornado', fx:'flood', title:c=>`${c.city.name} kasırgayla vuruldu`, text:(n,c)=>`Saatte 200 km'yi aşan rüzgarlar ${c.city.name} kıyılarında büyük yıkıma neden oldu.`, ch:[ {t:'Yardım koordinasyonu',d:'Hazine -, destek +',e:n=>{n.money-=n.income*4;n.appMod+=3;}}, {t:'Ordu yardıma',d:'',e:n=>{n.econ*=0.996;n.appMod+=1;}} ]},
 { id:'royal', w:n=>n.gov==='monarsi'?0.3:0, img:'ev_diplomacy', icon:'crown', good:1, title:c=>`Kraliyet düğünü ülkeyi bayram havasına soktu`, text:n=>`Saray önünde toplanan kalabalıklar yeni çifti alkışladı.`, ch:[ {t:'Ulusal tatil ilan et',d:'Destek +',e:n=>{n.appMod+=6;n.econ*=0.998;}} ]},
 { id:'fatwa', w:n=>n.religion==='islam'&&n.unpopAlly>3?2:0, img:'ev_protest', icon:'crescent-staff', title:c=>`Din adamlarından hükümete sert tepki`, text:n=>`Önde gelen din adamları hükümetin dış politikasını "ümmete ihanet" olarak nitelendirdi.`, ch:[ {t:'İttifak politikasını savun',d:'Destek -',e:n=>{n.appMod-=6;}}, {t:'Din işlerine bütçe ayır',d:'Hazine -, destek +',e:n=>{n.money-=n.income*4;n.appMod+=3;}} ]},
 { id:'energy', w:n=>n.oil<0.2&&G.oilPrice>110?1.5:0.1, img:'ev_economy', icon:'power-lightning', title:c=>`Enerji krizi: Elektrik kesintileri başladı`, text:n=>`Petrol fiyatlarındaki artış enerji ithalatını içinden çıkılmaz hale getirdi.`, pre:(n,c)=>{c.sev=1-Math.min(0.8,n.bld.santral*0.08)-(n.techs.has('e_green')?0.4:0);}, ch:[ {t:'Sübvansiyon',d:'Hazine -',e:(n,c)=>{n.money-=n.income*6*Math.max(0.1,c.sev);}}, {t:'Kesintilere devam',d:'Ekonomi ve destek -',e:(n,c)=>{n.econ*=1-0.008*Math.max(0.1,c.sev);n.appMod-=6;}} ]},
 { id:'nobel', w:n=>n.techs.size>8?0.15:0.02, img:'ev_tech', icon:'medal', good:1, title:c=>`Ulusal bilim insanına Nobel ödülü`, text:n=>`Ödül, ülkenin bilimsel prestijini artırdı.`, ch:[ {t:'Araştırma fonu kur',d:'Araştırma +',e:n=>{n.research+=n.rp*15;n.appMod+=3;}} ]},
 { id:'worldcup', w:n=>0.12, img:'ev_diplomacy', icon:'trophy', good:1, title:c=>`Milli takım Dünya Kupası'nda finalde`, text:n=>`Ülke tek yürek oldu; meydanlarda dev ekranlar kuruldu.`, ch:[ {t:'Takımı tebrik et',d:'Destek ++',e:n=>{n.appMod+=7;}} ]}
];
Events.daily=function(){
  const P=N_(G.player); if(Events.cool>0){Events.cool--;return;}
  const freq=[0,0.022,0.04][G.settings.events]||0.022; if(Math.random()>freq) return;
  const opts=Events.T.map(t=>[t,t.w(P)]).filter(x=>x[1]>0); const tot=opts.reduce((s,x)=>s+x[1],0); let r=Math.random()*tot; let T=opts[0][0]; for(const [t,w] of opts){ r-=w; if(r<=0){T=t;break;} }
  Events.fire(P,T); Events.cool=12;
};
Events.fire=function(n,T){
  const c={city:cityOf(n), sev:1}; if(T.pre) T.pre(n,c);
  const title=trFix(T.title(c)), text=trFix(T.text(n,c));
  News.add(T.good?'good':'disaster',`${n.name}: ${title}`,text,T.img,[n.id]);
  if(T.fx && c.city.cell>=0) Render.pulseCity(c.city.cell,T.fx);
  if(!T.good){ G.stats.disasters++; if(G.stats.disasters>=5) G.unlock('a_disaster'); }
  if(n.id===G.player) UI.eventModal(T,c,title,text);
  else { const ch=T.ch[(Math.random()*T.ch.length)|0]; ch.e(n,c); }
};
Events.world=function(){
  if(Math.random()<0.07){ const alive=G.nations.filter(n=>n.alive&&n.id!==G.player&&n.cells>15); if(!alive.length) return; const n=alive[(Math.random()*alive.length)|0];
    const opts=Events.T.filter(t=>t.w(n)>0.3 && ['quake','flood','fire','plague','crisis','protest','coup','terror','storm','oil','olympics','strike','energy'].includes(t.id));
    if(opts.length){ const T=opts[(Math.random()*opts.length)|0]; Events.fire(n,T); if(T.id==='coup'&&Math.random()<0.4){ const govs=['cunta','otoriter','demokrasi']; n.gov=govs[(Math.random()*3)|0]; } } }
  // ambient world headlines
  if(Math.random()<0.02){ const a=G.nations.filter(n=>n.alive&&n.cells>40); if(a.length>2){ const x=a[(Math.random()*a.length)|0], y=a[(Math.random()*a.length)|0]; if(x!==y){
    const t=[[`${x.name} ve ${y.name} dışişleri bakanları bir araya geldi`,'Görüşmede bölgesel güvenlik ve ticaret ele alındı.','ev_diplomacy'],[`${x.name} yeni savunma bütçesini açıkladı`,'Bütçede SİHA ve hava savunmasına büyük pay ayrıldı.','ev_war'],[`${x.name} ekonomisi beklentileri aştı`,'Büyüme rakamları piyasalarda olumlu karşılandı.','ev_economy'],[`${x.name}'de seçim heyecanı`,'Anketler başa baş bir yarışa işaret ediyor.','ev_protest'],[`Petrol fiyatları ${G.oilPrice.toFixed(0)} dolar seviyesinde`,'Analistler jeopolitik risklerin fiyatları desteklediğini belirtiyor.','ev_oil'],[`${x.name}, ${y.name} ile ortak tatbikat düzenledi`,'Tatbikat bölgede dikkatle izlendi.','ev_war']];
    const k=t[(Math.random()*t.length)|0]; News.add('world',k[0],k[1],k[2],[x.id,y.id]); } } }
};
Events.election=function(){ const P=N_(G.player); const win=P.approval>42||Math.random()<P.approval/100;
  if(win){ P.appMod+=5; P.stabMod+=5; UI.toast('Seçimi kazandınız! Halk size yeniden güvendi.','ok','vote'); News.add('good',`${P.name}'de seçim sonuçları: İktidar yeniden kazandı`,`Oy oranı %${(40+P.approval/3).toFixed(1)} olarak açıklandı.`,'ev_protest',[P.id]); }
  else { P.stabMod-=15; P.approval=52; P.policies.clear(); P._tm=null; P.tax=0.2; UI.toast('Seçimi kaybettiniz! Yeni koalisyon hükümeti politikaları sıfırladı.','danger','vote'); News.add('protest',`${P.name}'de iktidar değişti`,'Yeni hükümet tüm politikaları gözden geçireceğini açıkladı.','ev_protest',[P.id]); }
};
