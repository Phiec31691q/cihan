// ============ UI CORE ============
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const ICON_ALIAS={angry:'shouting',person:'person'};
const ic=(n,c='')=>`<svg class="ic ${c}" viewBox="0 0 512 512">${ICONS[n]||ICONS[ICON_ALIAS[n]]||ICONS.info}</svg>`;
const FLAGURL={}; const flagURL=key=>{ if(FLAGURL[key]) return FLAGURL[key]; const R=Render; if(!R.atlas) return ''; const i=FLAGS.idx[key]??FLAGS.idx.NONE; const c=document.createElement('canvas'); c.width=FLAGS.fw; c.height=FLAGS.fh; c.getContext('2d').drawImage(R.atlas,(i%FLAGS.cols)*FLAGS.fw,Math.floor(i/FLAGS.cols)*FLAGS.fh,FLAGS.fw,FLAGS.fh,0,0,FLAGS.fw,FLAGS.fh); return FLAGURL[key]=c.toDataURL('image/png'); };
const flagH=(key,w=24)=>{ const h=Math.round(w*FLAGS.fh/FLAGS.fw); return `<span class="flag" style="width:${w}px;height:${h}px;background-image:url(${flagURL(key)});background-size:100% 100%"></span>`; };
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pct=v=>Math.round(v)+'%';
const relCol=r=>r>50?'#58b368':r>15?'#8fcf6a':r>-15?'#c9b25a':r>-50?'#e0803a':'#d2463a';
const relTxt=r=>r>70?'Dost':r>35?'Sıcak':r>10?'Olumlu':r>-10?'Nötr':r>-35?'Soğuk':r>-65?'Düşmanca':'Kan Davası';
const CAT_TR={war:'SAVAŞ',dip:'DİPLOMASİ',eco:'EKONOMİ',tech:'BİLİM',nuke:'NÜKLEER',protest:'PROTESTO',unrest:'KARGAŞA',disaster:'AFET',good:'GÜNDEM',world:'DÜNYA'};

const UI={ panel:null, cardId:-1, modalQ:[], target:null, tickerItems:[], lastRefresh:0, interacting:false };

// ---------- TOOLTIP ----------
document.addEventListener('mouseover',e=>{ const t=e.target.closest('[data-tip]'); const tip=$('#tip'); if(!t){ tip.classList.add('hidden'); return; } tip.innerHTML=t.dataset.tip; tip.classList.remove('hidden'); });
document.addEventListener('mousemove',e=>{ const tip=$('#tip'); if(tip.classList.contains('hidden')) return; const w=tip.offsetWidth,h=tip.offsetHeight; let x=e.clientX+16,y=e.clientY+18; if(x+w>innerWidth-6)x=e.clientX-w-12; if(y+h>innerHeight-6)y=e.clientY-h-12; tip.style.left=x+'px'; tip.style.top=y+'px'; });

// ---------- TOASTS ----------
UI.toast=function(msg,type='info',icon='info'){ msg=trFix(msg); const box=$('#toasts'); const d=document.createElement('div'); d.className='toast '+type; d.innerHTML=ic(icon)+`<div>${msg}</div>`; box.prepend(d); while(box.children.length>6) box.lastChild.remove();
  Sfx.play(type==='ok'?'ok':type==='danger'?'bad':type==='warn'?'warn':'click'); setTimeout(()=>{d.classList.add('out');setTimeout(()=>d.remove(),320);},4800); };
UI.achievement=function(a){ const box=$('#toasts'); const d=document.createElement('div'); d.className='toast ach'; d.innerHTML=ic(a[2])+`<div><small class="gold" style="letter-spacing:.14em;font-size:10px">BAŞARIM AÇILDI</small><br><b>${a[1]}</b><br><small class="mut">${a[3]}</small></div>`; box.prepend(d); Sfx.play('ach'); setTimeout(()=>{d.classList.add('out');setTimeout(()=>d.remove(),320);},6500); };

// ---------- MODALS ----------
UI.modal=function(html,opts={}){ const w=document.createElement('div'); w.className='mwrap'; w.innerHTML=html; $('#modals').appendChild(w); Sfx.play('open');
  const close=()=>{ w.remove(); if(opts.onClose) opts.onClose(); UI.modalCount(); };
  w.addEventListener('click',e=>{ if(e.target===w&&!opts.lock) close(); const b=e.target.closest('[data-close]'); if(b) close(); });
  w.close=close; if(opts.pause && G.player>=0){ UI.pauseFor(w); } return w; };
UI.pauseFor=function(w){ if(!G.settings.autoPauseEvents) return; if(!G.paused){ G.paused=true; w._resume=true; UI.refreshTop(); } const oc=w.close; w.close=()=>{ oc(); if(w._resume && !$$('.mwrap').some(x=>x._resume)) { G.paused=false; UI.refreshTop(); } }; };
UI.modalCount=()=>{};
UI.closeTop=function(){ const all=$$('.mwrap'); if(all.length){ const w=all[all.length-1]; if(!w.dataset.lock){ w.close?w.close():w.remove(); } return true; } return false; };

UI.eventModal=function(T,c,title,text){ const P=N_(G.player);
  const w=UI.modal(`<div class="modal"><div class="mhero" style="background-image:url(img/${T.img}.jpg)"><span class="tag chip ${T.good?'good':'war'}">${ic(T.icon)} ${T.good?'FIRSAT':'KRİZ'}</span></div>
    <div class="mhead">${flagH(P.flag,36)}<h2>${esc(title)}</h2></div><div class="mbody"><p>${esc(text)}</p><p class="mut" style="font-size:12px">${dateStr(G.day)} · ${esc(c.city.name)}</p></div>
    <div class="choices">${T.ch.map((ch,i)=>`<button class="choice" data-i="${i}"><span class="n">${i+1}</span><div><b>${esc(ch.t)}</b><small>${esc(ch.d)}</small></div></button>`).join('')}</div></div>`,{lock:true,pause:true});
  w.dataset.lock=1; Sfx.play('event');
  w.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{ T.ch[+b.dataset.i].e(P,c); P._tm=null; w.close(); UI.toast('Karar uygulandı: '+T.ch[+b.dataset.i].t,'info',T.icon); UI.refresh(); }); };

UI.confirm=function(title,text,yes,cb,cls='red',icon='hazard-sign'){ const w=UI.modal(`<div class="modal"><div class="mhead">${ic(icon,'gold')}<h2>${title}</h2></div><div class="mbody"><p>${text}</p></div><div class="mfoot"><button class="btn ghost" data-close>Vazgeç</button><button class="btn ${cls}" id="cfYes">${yes}</button></div></div>`);
  w.querySelector('#cfYes').onclick=()=>{ w.close(); cb(); }; };

UI.proposal=function(id,icon,title,text,btns,img){ const n=N_(id); const w=UI.modal(`<div class="modal">${img?`<div class="mhero" style="height:160px;background-image:url(img/${img}.jpg)"></div>`:''}<div class="mhead">${Leader.html(n,58,'pr')}<div><small class="mut" style="letter-spacing:.14em;font-size:11px;display:flex;gap:6px;align-items:center">${ic(icon)} DİPLOMATİK MESAJ · ${esc(Leader.of(n).full)}</small><h2>${title}</h2></div></div><div class="mbody"><p>${text}</p></div><div class="mfoot">${btns.map((b,i)=>`<button class="btn ${b[1]}" data-b="${i}">${ic(b[2]||'check-mark')} ${b[0]}</button>`).join('')}</div></div>`,{lock:true,pause:true});
  w.dataset.lock=1; w.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{ w.close(); btns[+b.dataset.b][3](); UI.refresh(); }); Sfx.play('event'); return w; };

UI.allyCall=function(def,att){ const D=N_(def),A=N_(att); UI.proposal(def,'shaking-hands',`${D.name} yardım istiyor`,`Müttefikimiz ${D.name}, ${A.name} tarafından saldırıya uğradı. İttifak yükümlülüklerimiz gereği savaşa girmemizi talep ediyorlar. Reddedersek ilişkimiz ciddi zarar görecek.`,
  [['Reddet','ghost','cancel',()=>{G.addRel(def,G.player,-30);UI.toast(`${D.name} hayal kırıklığına uğradı`,'warn','broken-shield');}],['Savaşa Gir','red','crossed-swords',()=>{G.startWar(G.player,att,false,`${N_(G.player).name}, müttefiki ${D.name}'i korumak için ${A.name}'e savaş ilan etti.`);G.addRel(def,G.player,15);}]],'ev_war'); };
UI.peaceOffer=function(id){ const n=N_(id); if(UI._po&&UI._po>G.day-60) return; UI._po=G.day; UI.proposal(id,'peace-dove',`${n.name} barış teklif ediyor`,`${n.name} hükümeti savaşın mevcut cephe hatlarında sona ermesini öneriyor. Ele geçirdiğimiz topraklar bizde kalacak.`,
  [['Reddet','ghost','cancel',()=>{}],['Barışı Kabul Et','green','peace-dove',()=>{G.endWar(G.player,id,'status');G.stats.peaceCount++;G.unlock('a_peace');News.add('dip',`${N_(G.player).name} ile ${n.name} barış imzaladı`,'Mevcut cephe hatları yeni sınır olarak kabul edildi.','ev_diplomacy',[G.player,id]);}]],'ev_diplomacy'); };
UI.surrenderOffer=function(id){ const n=N_(id); if(UI._so&&UI._so>G.day-60) return; UI._so=G.day; UI.proposal(id,'peace-dove',`${n.name} teslim olmak istiyor`,`${n.name} ordusu çöktü. Hükümet koşulsuz teslimiyet ya da himayemize girmeyi öneriyor.`,
  [['Reddet','ghost','cancel',()=>{}],['Kukla Devlet Yap','blue','chess-king',()=>{G.endWar(G.player,id,'status');const P=N_(G.player);P.puppets.add(id);n.overlord=P.id;n.allies.add(P.id);P.allies.add(id);G.unlock('a_vassal');}],['Tamamen İlhak Et','gold','stamper',()=>{G.endWar(G.player,id,'annex');}]],'ev_war'); };
UI.aiProposal=function(id,type){ const n=N_(id); if(UI._ap&&UI._ap>G.day-25) return; UI._ap=G.day; const P=N_(G.player);
  if(type==='ally') UI.proposal(id,'shaking-hands',`${n.name} ittifak öneriyor`,`${n.name}, ${P.name} ile ortak savunma anlaşması imzalamak istiyor. Bu ittifak rakiplerini kızdırabilir.`,[['Reddet','ghost','cancel',()=>G.addRel(id,P.id,-5)],['İttifak Kur','blue','shaking-hands',()=>{G.makeAlliance(P.id,id);G.unlock('a_ally');}]],'ev_diplomacy');
  if(type==='trade') UI.proposal(id,'trade',`${n.name} ticaret anlaşması öneriyor`,`İki ülke arasındaki gümrük duvarlarını kaldıracak anlaşma gelirlerimizi artıracak.`,[['Reddet','ghost','cancel',()=>{}],['İmzala','green','contract',()=>{P.trade.add(id);n.trade.add(P.id);G.addRel(id,P.id,8);UI.toast(`${n.name} ile ticaret anlaşması`,'ok','trade');}]],'ev_economy');
  if(type==='ultimatum') UI.proposal(id,'hazard-sign',`${n.name}'den ÜLTİMATOM`,`${n.name}, sınır bölgelerimizden çekilmemizi talep ediyor. Aksi halde "gereken adımları atacaklarını" açıkladılar.`,[['Kabul Et (toprak ver)','ghost','thumb-down',()=>{ let k=0; for(let i=0;i<M.N&&k<12;i++){ if(M.owner[i]===P.id){ for(let q=0;q<6;q++){const j=M.nb[i*6+q]; if(j>=0&&M.owner[j]===id){G.setOwner(i,id,true);k++;break;}} } } P.appMod-=10; G._frontDirty=true; UI.toast('Sınır bölgeleri teslim edildi. Halk öfkeli.','danger','shouting'); }],['Reddet','red','fist',()=>{ P.appMod+=4; if(Math.random()<0.55) G.schedule(3,()=>{ if(n.alive&&!n.wars.has(P.id)) G.startWar(id,P.id,false,`${n.name}, reddedilen ültimatomun ardından ${P.name}'e savaş açtı.`); }); }]],'ev_war'); };
UI.unVote=function(){ const u=G.un; UI.proposal(u.a,'globe','BM Güvenlik Konseyi oylaması',`Gündem: <b>${esc(u.text)}</b><br><br>Oyunuz müttefiklerinizle ilişkilerinizi etkileyecek.`,
  [['Çekimser','ghost','scales',()=>{u.votes[G.player]='abs';}],['Hayır','red','thumb-down',()=>{u.votes[G.player]='no';G.addRel(u.a,G.player,8);G.addRel(u.b,G.player,-8);}],['Evet','green','thumb-up',()=>{u.votes[G.player]='yes';G.addRel(u.a,G.player,-10);G.addRel(u.b,G.player,8);}]],'ev_diplomacy'); };
UI.gameOver=function(win,msg){ if(UI._over) return; UI._over=true; G.paused=true; const P=N_(G.player);
  const w=UI.modal(`<div class="modal wide"><div class="mhero" style="height:280px;background-image:url(img/${win?'victory':'defeat'}.jpg)"></div><div class="mhead">${flagH(P.flag,48)}<div><small class="mut" style="letter-spacing:.2em">${win?'ZAFER':'YENİLGİ'}</small><h2 style="font-size:30px">${win?'Tarih sizi yazacak':'Devletiniz yıkıldı'}</h2></div></div>
  <div class="mbody"><p>${esc(msg||(win?'':'Son topraklarınız da düştü. '+P.name+' tarih sahnesinden çekildi.'))}</p><div class="go-stats"><div><b>${dateStr(G.day)}</b><span>Tarih</span></div><div><b>${(P.cells/M.N*100).toFixed(1)}%</b><span>Dünya Karası</span></div><div><b>${G.stats.destroyed}</b><span>Yok Edilen Ülke</span></div><div><b>${fmt(G.stats.captured)}</b><span>Ele Geçirilen Bölge</span></div><div><b>${G.achievements.size}</b><span>Başarım</span></div><div><b>${G.stats.peaceCount}</b><span>Barış Antlaşması</span></div></div></div>
  <div class="mfoot"><button class="btn ghost" id="goMenu">${ic('exit-door')} Ana Menü</button>${win?`<button class="btn gold" id="goCont">${ic('play-button')} Oynamaya Devam Et</button>`:''}</div></div>`,{lock:true}); w.dataset.lock=1;
  w.querySelector('#goMenu').onclick=()=>{ w.close(); UI.toMenu(); }; const c=w.querySelector('#goCont'); if(c) c.onclick=()=>{ w.close(); UI._over=false; G.opts.winShare=101; G.paused=false; }; Sfx.play(win?'ach':'war'); };

// ---------- TICKER ----------
UI.ticker=function(it){ if(G.player<0) return; const P=G.player; const mine=it.nations&&it.nations.includes(P); const imp=mine||it.cat==='nuke'||(it.cat==='war'&&it.nations.some(n=>N_(n)&&N_(n).cells>800));
  if(!imp && it.cat==='world' && Math.random()<0.5) return;
  UI.tickerItems.unshift(it); if(UI.tickerItems.length>14) UI.tickerItems.pop(); UI.renderTicker(); if(mine) Sfx.play('news');
  if(mine && (it.cat==='protest')) UI.toast(it.title,'danger','shouting');
  UI.badge('news',1); };
UI.renderTicker=function(){ const m=$('#tkmove'); m.innerHTML=UI.tickerItems.map(it=>`<span class="tk-item" data-id="${it.id}"><span class="cat cat-${it.cat}">${CAT_TR[it.cat]||''}</span>${it.nations[0]!=null&&N_(it.nations[0])?flagH(N_(it.nations[0]).flag,18):''}${esc(it.title)}</span>`).join('');
  m.querySelectorAll('.tk-item').forEach(e=>e.onclick=()=>UI.newspaper()); UI._tkx=UI._tkx??innerWidth*0.4; };
UI.tickerFrame=function(dt){ const m=$('#tkmove'); if(!m||!m.firstChild) return; UI._tkx-=dt*55; const w=m.scrollWidth; if(UI._tkx<-w) UI._tkx=$('.tk-track').offsetWidth; m.style.transform=`translateX(${UI._tkx}px)`; };

// ---------- NEWSPAPER ----------
UI.newspaper=function(cat){ UI.badge('news',0,true); const P=N_(G.player); const name=NEWSPAPERS[(G.day/30|0)%NEWSPAPERS.length];
  const list=G.news.filter(n=>!cat||n.cat===cat||(cat==='mine'&&n.nations.includes(G.player))).slice(0,40);
  const lead=list.find(n=>n.nations.includes(G.player))||list[0];
  const rest=list.filter(n=>n!==lead);
  const w=UI.modal(`<div class="paper"><button class="x" data-close>${ic('cancel')}</button><div class="mast"><h1>${name}</h1><div class="meta"><span>${dateStr(G.day)}</span><span>Dünya Gerilimi: %${G.tension.toFixed(0)} · Petrol ${G.oilPrice.toFixed(0)}$</span><span>Sayı ${1000+G.day}</span></div></div>
  <div class="ptabs">${[['','Tüm Haberler'],['mine','Ülkemiz'],['war','Savaş'],['dip','Diplomasi'],['eco','Ekonomi'],['protest','Protesto'],['disaster','Afet'],['tech','Bilim']].map(([k,l])=>`<button data-c="${k}" class="${(cat||'')===k?'on':''}">${l}</button>`).join('')}</div>
  <div class="pbody">${lead?`<div class="lead"><img src="img/${lead.img}.jpg" alt=""><div><div class="story"><div class="when">${CAT_TR[lead.cat]} · ${dateStr(lead.day)} ${lead.nations.slice(0,3).map(x=>N_(x)?flagH(N_(x).flag,20):'').join('')}</div></div><h2>${esc(lead.title)}</h2><p>${esc(lead.text||'Ayrıntılar gelmeye devam ediyor.')} Uzmanlar gelişmelerin bölge dengelerini derinden etkileyeceği görüşünde.</p></div></div>`:'<div class="empty" style="color:#5a4a30">Henüz haber yok.</div>'}
  <div class="cols">${rest.map((n,i)=>`<div class="story"><div class="when">${n.nations.slice(0,2).map(x=>N_(x)?flagH(N_(x).flag,16):'').join('')} ${CAT_TR[n.cat]} · ${dateStr(n.day)}</div>${i%5===0?`<img src="img/${n.img}.jpg" alt="">`:''}<h3>${esc(n.title)}</h3><p>${esc(n.text)}</p></div>`).join('')}</div></div></div>`);
  w.querySelectorAll('.ptabs button').forEach(b=>b.onclick=()=>{ w.close(); UI.newspaper(b.dataset.c||undefined); }); };

// ---------- TOP BAR ----------
UI.buildHUD=function(){
  document.documentElement.style.setProperty('--atlas',`url(${FLAGS.src})`);
  $('#tkopen').innerHTML=ic('newspaper'); $('#tkopen').onclick=()=>UI.newspaper(); $('#tkopen').dataset.tip='<b>Gazete</b><br>Tüm haberleri oku';
  const nav=[['army','Ordu','rally-the-troops','O'],['eco','Ekonomi','coins-pile','E'],['dip','Diplomasi','shaking-hands','D'],['tech','Teknoloji','atom','T'],['pol','Politika','scales','P'],['spy','İstihbarat','spy','İ'],['coal','Koalisyon','team-upgrade','K'],['un','BM','globe','B'],['news','Gazete','newspaper','G'],['stats','İstatistik','histogram','S'],['rank','Sıralama','podium','R'],['ach','Başarım','trophy','A']];
  $('#leftnav').innerHTML=nav.map(n=>`<button class="nv" data-p="${n[0]}" data-tip="<b>${n[1]}</b> <span class='kbd'>${n[3]}</span>">${ic(n[2])}<span>${n[1]}</span></button>`).join('');
  $$('#leftnav .nv').forEach(b=>b.onclick=()=>{ Sfx.play('click'); if(b.dataset.p==='news') return UI.newspaper(); UI.openPanel(b.dataset.p); });
  $('#pnClose').innerHTML=ic('cancel'); $('#pnClose').onclick=()=>UI.openPanel(null);
  const modes=[['political','Siyasi Harita (Bayraklar)','tower-flag'],['diplo','Diplomatik İlişkiler','shaking-hands'],['alliance','İttifaklar & Koalisyonlar','team-upgrade'],['econ','Ekonomik Güç','coins-pile'],['power','Askeri Güç','crossed-swords'],['stab','İstikrar','scales'],['religion','Din Haritası','prayer'],['terrain','Arazi','mountains']];
  $('#modes').innerHTML=modes.map(m=>`<button data-m="${m[0]}" data-tip="<b>${m[1]}</b>" class="${Render.mode===m[0]?'on':''}">${ic(m[2])}</button>`).join('');
  $$('#modes button').forEach(b=>b.onclick=()=>{ Render.setMode(b.dataset.m); $$('#modes button').forEach(x=>x.classList.toggle('on',x===b)); Sfx.play('click'); });
  $('#zoom').innerHTML=`<button id="zin" data-tip="Yakınlaştır">${ic('magnifying-glass')}</button><button id="zout" data-tip="Uzaklaştır">${ic('globe')}</button><button id="zcap" data-tip="Başkente git">${ic('castle')}</button>`;
  $('#zin').onclick=()=>UI.zoomBy(1.5); $('#zout').onclick=()=>UI.zoomBy(1/1.5); $('#zcap').onclick=()=>{ const P=N_(G.player); if(P.capital>=0) Render.flyTo(M.x[P.capital],M.y[P.capital],3); };
  const mini=$('#minicv'); const mm=e=>{ const r=mini.getBoundingClientRect(); Render.cam.x=(e.clientX-r.left)/r.width*M.W; Render.cam.y=(e.clientY-r.top)/r.height*M.H; Render.clampCam(); };
  mini.onpointerdown=e=>{ mm(e); mini.setPointerCapture(e.pointerId); mini.onpointermove=mm; }; mini.onpointerup=()=>{ mini.onpointermove=null; };
  UI.renderTicker();
};
UI.zoomBy=function(f,cx=innerWidth/2,cy=innerHeight/2){ const c=Render.cam; const [wx,wy]=Render.s2w(cx,cy); c.z*=f; Render.clampCam(); const [nx,ny]=Render.s2w(cx,cy); c.x+=wx-nx; c.y+=wy-ny; Render.clampCam(); };
UI.badge=function(p,n,reset){ const b=document.querySelector(`.nv[data-p="${p}"]`); if(!b) return; let el=b.querySelector('.badge'); if(reset){ if(el) el.remove(); return; } if(!el){ el=document.createElement('i'); el.className='badge'; el.textContent='0'; b.appendChild(el);} const v=(+el.textContent||0)+n; el.textContent=v>99?'99+':v; };
UI.refreshTop=function(){ const P=N_(G.player); if(!P) return; const gv=GD.GOVS[P.gov]; const pw=G.power(P); const tt=G.tension; const def=tt>85?1:tt>65?2:tt>45?3:tt>25?4:5; const dcol=['','#ff3b2f','#ff8a2a','#e8c440','#6fbf5a','#4a90d8'][def];
  const R=(icn,v,l,tip,extra='')=>`<div class="res" data-tip="${tip}">${ic(icn)}<div><div class="v num">${v}${extra}</div><div class="l">${l}</div></div></div>`;
  const mb=(v,c)=>`<div class="meter"><i style="width:${clamp(v,0,100)}%;background:${c}"></i></div>`;
  const sp=G.speed; const research=P.researching?GD.TECHS.find(t=>t[0]===P.researching):null;
  $('#topbar').innerHTML=`<div class="tb-nation" id="tbNation">${Leader.html(P,44,'tb')}<div><div class="nm">${esc(P.name)}</div><div class="gv">${esc(Leader.of(P).full)}</div></div></div>
  <div class="tb-res">
   ${R('coins-pile',fmtM(P.money),'Hazine',`<b>Hazine</b><br>Günlük gelir: ${fmtM(P.income)}<br>Günlük gider: ${fmtM(P.expense)}<br>Borç: ${fmtM(P.debt)}`,`<span class="d ${P.net>=0?'green':'red'}">${P.net>=0?'+':''}${fmtM(P.net)}</span>`)}
   ${R('profit',fmtM(P.gdp*1000),'GSYİH',`<b>Gayri Safi Yurt İçi Hasıla</b><br>Büyüme: %${(P.growth*100).toFixed(1)} / yıl<br>Enflasyon: %${P.inflation.toFixed(1)}`)}
   ${R('rally-the-troops',fmt(P.u.piyade),'Asker',`<b>Ordu</b><br>Askeri güç: ${fmt(pw)}<br>Tank: ${fmt(P.u.tank)} · Uçak: ${fmt(P.u.ucak)} · SİHA: ${fmt(P.u.drone)}`)}
   ${R('person',fmt(P.manpower),'İnsan Gücü',`<b>İnsan Gücü</b><br>Asker alınabilecek nüfus<br>Maks: ${fmt(P.mpMax)}`)}
   ${R('crossed-swords',fmt(pw),'Askeri Güç',`<b>Toplam Askeri Güç</b><br>Moral: %${(P.morale*100).toFixed(0)}<br>Savaşlar: ${P.wars.size}`)}
   ${R('oil-drum',P.oil.toFixed(2),'Petrol',`<b>Petrol Üretimi</b><br>Varil fiyatı: ${G.oilPrice.toFixed(0)}$`)}
   ${R('atom','+'+P.rp.toFixed(1),'Bilim',`<b>Araştırma</b><br>${research?research[1]+': '+Math.floor(P.research)+'/'+G.techCost(P,research):'Araştırma seçilmedi!'}`)}
   <div class="res" data-tip="<b>Halk Desteği</b><br>%30 altı: protestolar, darbe riski">${ic('thumb-up')}<div><div class="v num" style="color:${P.approval>55?'#7fd38c':P.approval>35?'#e8c440':'#ff6a55'}">${pct(P.approval)}</div>${mb(P.approval,P.approval>55?'#58b368':P.approval>35?'#e0a030':'#d2463a')}</div></div>
   <div class="res" data-tip="<b>İstikrar</b><br>Düşük istikrar isyan ve darbe getirir">${ic('scales')}<div><div class="v num">${pct(P.stability)}</div>${mb(P.stability,'#4a90d8')}</div></div>
   <div class="defcon" data-tip="<b>DEFCON ${def}</b><br>Dünya gerilimi: %${tt.toFixed(0)}"><b style="color:${dcol}">${def}</b><span>DEFCON</span></div>
  </div>
  <div class="tb-time"><div class="tb-date"><div class="dt">${dateStr(G.day)}</div><div class="dy">${G.paused?'DURAKLATILDI':'Gün '+G.day}</div></div>
   <div class="speeds"><button data-s="0" class="${G.paused?'on':''}" data-tip="Duraklat <span class='kbd'>Boşluk</span>">${ic('pause-button')}</button>${[1,2,3,4,5].map(s=>`<button data-s="${s}" class="${!G.paused&&sp===s?'on':''}" data-tip="Hız ${s} <span class='kbd'>${s}</span>">${s===1?ic('play-button'):s}</button>`).join('')}</div></div>
  <button class="tb-menu" id="tbMenu" data-tip="Menü <span class='kbd'>Esc</span>">${ic('hamburger-menu')}</button>`;
  $('#tbNation').onclick=()=>UI.showCard(G.player,true);
  $$('.speeds button').forEach(b=>b.onclick=()=>{ const s=+b.dataset.s; if(s===0) G.paused=!G.paused; else { G.speed=s; G.paused=false; } Sfx.play('click'); UI.refreshTop(); });
  $('#tbMenu').onclick=()=>UI.pauseMenu();
  // war bar
  const wars=[...P.wars].map(e=>{ const w=G.wars.find(x=>(x.a===P.id&&x.b===e)||(x.b===P.id&&x.a===e)); return [e,w]; }).filter(x=>x[1]);
  $('#warbar').innerHTML=wars.slice(0,5).map(([e,w])=>{ const my=w.a===P.id?w.pA:w.pB, th=w.a===P.id?w.pB:w.pA; const r=my&&th?my/(my+th):0.5; return `<div class="wb" data-e="${e}" data-tip="<b>${esc(N_(e).name)} ile savaş</b><br>Cephe gücü: ${fmt(my||0)} vs ${fmt(th||0)}<br>Savaş skoru: ${G.warScore(P.id,e).toFixed(0)}">${ic('crossed-swords','red')}${flagH(N_(e).flag,22)}<div class="vs"><i style="width:${r*100}%"></i><i style="width:${(1-r)*100}%"></i></div></div>`; }).join('')+(wars.length>5?`<div class="wb">+${wars.length-5}</div>`:'');
  $$('#warbar .wb[data-e]').forEach(b=>b.onclick=()=>{ UI.showCard(+b.dataset.e,true); });
};
UI.refresh=function(force){ const now=performance.now(); if(!force&&now-UI.lastRefresh<250) return; UI.lastRefresh=now; if(G.player<0) return; UI.refreshTop(); if(UI.cardId>=0) UI.showCard(UI.cardId); if(UI.panel && !UI.interacting) Panels.render(UI.panel,true); };

// ---------- PANELS ----------
UI.openPanel=function(p){ UI.panel=(UI.panel===p)?null:p; $$('#leftnav .nv').forEach(b=>b.classList.toggle('on',b.dataset.p===UI.panel)); const el=$('#panel');
  if(!UI.panel){ el.classList.add('hidden'); return; } el.classList.remove('hidden'); el.classList.toggle('wide',UI.panel==='tech'); Panels.render(UI.panel); Sfx.play('open'); };
$('#panel').addEventListener('pointerdown',()=>{UI.interacting=true;}); addEventListener('pointerup',()=>{ setTimeout(()=>UI.interacting=false,200); });
$('#panel').addEventListener('focusin',()=>{UI.interacting=true;}); $('#panel').addEventListener('focusout',()=>{UI.interacting=false;});

// ---------- COUNTRY CARD ----------
UI.showCard=function(id,fly){ const n=N_(id); if(!n||(!n.alive&&id!==G.player)){ UI.hideCard(); return; } const P=N_(G.player); const me=id===G.player; const prev=UI.cardId; UI.cardId=id; if(Render.sel!==id) Render.select(id);
  if(fly&&n.capital>=0) Render.flyTo(n.label?n.label.x:M.x[n.capital],n.label?n.label.y:M.y[n.capital],Math.max(Render.cam.z,clamp(28/Math.sqrt(n.cells+4),1,5)));
  const el=$('#card'); const sc=el.scrollTop; el.classList.remove('hidden'); const gv=GD.GOVS[n.gov]; const rel=me?100:G.rel_(id,P.id); const known=me||P.intel.has(id)||G.allied(P.id,id)||true;
  const atWar=!me&&P.wars.has(id), ally=!me&&G.allied(P.id,id);
  const chips=[]; if(atWar) chips.push(`<span class="chip war">${ic('crossed-swords')} Savaşta</span>`); if(ally) chips.push(`<span class="chip ally">${ic('shaking-hands')} Müttefik</span>`); if(!me&&P.pacts.has(id)) chips.push(`<span class="chip good">${ic('contract')} Saldırmazlık</span>`); if(!me&&P.trade.has(id)) chips.push(`<span class="chip good">${ic('trade')} Ticaret</span>`); if(!me&&P.sanc.has(id)) chips.push(`<span class="chip war">${ic('scales')} Yaptırım</span>`); if(P.puppets.has(id)) chips.push(`<span class="chip gold">${ic('chess-king')} Kuklamız</span>`); if(n.overlord>=0) chips.push(`<span class="chip">${flagH(N_(n.overlord).flag,16)} ${esc(N_(n.overlord).name)} kuklası</span>`); if(!me&&G.truce(P.id,id)&&!P.pacts.has(id)) chips.push(`<span class="chip">${ic('peace-dove')} Ateşkes</span>`); if(!me&&P.guarantees.has(id)) chips.push(`<span class="chip ally">${ic('shield')} Garanti</span>`);
  const coal=[...n.coal].map(c=>G.coalitions[c]).filter(Boolean);
  let war='';
  if(atWar){ const w=G.wars.find(x=>(x.a===P.id&&x.b===id)||(x.b===P.id&&x.a===id)); const my=w?(w.a===P.id?w.pA:w.pB):0, th=w?(w.a===P.id?w.pB:w.pA):0; const r=my&&th?my/(my+th):0.5; const ws=G.warScore(P.id,id); const pr=P.priority[id]||1;
    war=`<div class="warbox"><h5>${ic('crossed-swords')} CEPHE DURUMU</h5><div class="row" style="font-size:12px;margin-bottom:4px">${flagH(P.flag,20)}<b class="num">${fmt(my||0)}</b><span class="sp"></span><b class="num">${fmt(th||0)}</b>${flagH(n.flag,20)}</div><div class="vs"><i style="width:${r*100}%"></i><i style="width:${(1-r)*100}%"></i></div>
     <div class="row" style="margin-top:8px;font-size:12px"><span class="mut">Savaş skoru</span><span class="sp"></span><b class="${ws>=0?'green':'red'}">${ws>0?'+':''}${ws.toFixed(0)}</b></div>
     <div class="row" style="font-size:12px"><span class="mut">Kayıplar</span><span class="sp"></span><span class="num">${fmt(w?(w.a===P.id?w.casA:w.casB):0)} / <span class="red">${fmt(w?(w.a===P.id?w.casB:w.casA):0)}</span></span></div>
     <div style="margin-top:8px;font-size:12px" class="row"><span class="mut">Cephe önceliği</span><span class="sp"></span><b class="gold" id="prV">${pr.toFixed(1)}x</b></div><input type="range" min="0.3" max="3" step="0.1" value="${pr}" id="prS">
     <div class="acts-grid" style="margin-top:10px"><button class="btn sm red" id="aTarget">${ic('crosshair')} Saldırı Hedefi</button><button class="btn sm" id="aAir">${ic('jet-fighter')} Hava Saldırısı</button><button class="btn sm" id="aMis">${ic('missile-pod')} Füze (${fmt(P.u.fuze)})</button><button class="btn sm" id="aNav">${ic('anchor')} Deniz Çıkarması</button>${P.u.nukleer>=1?`<button class="btn sm red" id="aNuke" style="grid-column:span 2">${ic('nuclear-bomb')} NÜKLEER SALDIRI (${P.u.nukleer|0})</button>`:''}</div>
     <div class="acts-grid" style="margin-top:6px"><button class="btn sm green" id="pWhite">${ic('peace-dove')} Beyaz Barış</button><button class="btn sm green" id="pStatus">${ic('contract')} Mevcut Hatlarda Barış</button><button class="btn sm gold" id="pAnnex" style="grid-column:span 2">${ic('stamper')} Teslim Ol / İlhak Talebi</button></div></div>`; }
  const occ=[]; if(!me){ let c=0; for(let i=0;i<M.N;i++) if(M.owner[i]===P.id&&M.core[i]===id) c++; if(c>0) occ.push(c); }
  const pw=G.power(n), share=(n.cells/M.N*100);
  const wars=[...n.wars].map(x=>N_(x)).filter(x=>x&&x.alive); const allies=[...G.alliesOf(id)].map(x=>N_(x)).filter(x=>x&&x.alive);
  const A=(id2,icn,label,cls='',tip='')=>`<button class="btn sm ${cls}" data-a="${id2}" ${tip?`data-tip="${tip}"`:''}>${ic(icn)} ${label}</button>`;
  el.innerHTML=`<div class="cc-head"><div class="bgf" style="background-image:url(${flagURL(n.flag)});background-size:cover;background-position:center"></div>${Leader.html(n,66,'cc')}<div><h3>${esc(n.name)}</h3><div class="lname">${esc(Leader.of(n).full)}</div><div class="sub">${ic(gv.icon)} ${gv.n} · ${ic(GD.RELIGIONS[n.religion].icon)} ${GD.RELIGIONS[n.religion].n}</div></div><button class="x" id="ccX">${ic('cancel')}</button></div>
  <div class="cc-body">${chips.length?`<div class="chips" style="margin-bottom:10px">${chips.join('')}</div>`:''}
   ${!me?`<div class="row" style="margin-bottom:12px;font-size:12px"><span class="mut">İlişki</span><div class="relbar" style="flex:1"><i style="${rel>=0?`left:50%;width:${rel/2}%`:`right:50%;width:${-rel/2}%`};background:${relCol(rel)}"></i></div><b style="color:${relCol(rel)}">${relTxt(rel)} (${rel.toFixed(0)})</b></div>`:''}
   ${war}
   <div class="kv" style="margin-bottom:12px"><div>${ic('castle')}<div><b>${esc(n.capital>=0&&M.cityByCell[n.capital]?CITIES[M.cityByCell[n.capital][0]][0]:(n.capName||'—'))}</b><span>Başkent</span></div></div><div>${ic('family-house')}<div><b class="num">${fmt(n.pop)}</b><span>Nüfus</span></div></div>
   <div>${ic('coins-pile')}<div><b class="num">${fmtM(n.gdp*1000)}</b><span>GSYİH</span></div></div><div>${ic('crossed-swords')}<div><b class="num">${fmt(pw)}</b><span>Askeri Güç</span></div></div>
   <div>${ic('rally-the-troops')}<div><b class="num">${fmt(n.u.piyade)}</b><span>Asker</span></div></div><div>${ic('treasure-map')}<div><b class="num">%${share.toFixed(2)}</b><span>Dünya Karası</span></div></div>
   <div>${ic('thumb-up')}<div><b>${pct(n.approval)}</b><span>Halk Desteği</span></div></div><div>${ic('scales')}<div><b>${pct(n.stability)}</b><span>İstikrar</span></div></div>
   ${me||P.intel.has(id)?`<div>${ic('battle-tank')}<div><b class="num">${fmt(n.u.tank)}</b><span>Tank</span></div></div><div>${ic('jet-fighter')}<div><b class="num">${fmt(n.u.ucak)}</b><span>Uçak</span></div></div><div>${ic('battleship')}<div><b class="num">${fmt(n.u.gemi)}</b><span>Gemi</span></div></div><div>${ic('nuclear-bomb')}<div><b class="num">${fmt(n.u.nukleer)}</b><span>Nükleer</span></div></div>`:''}</div>
   ${coal.length?`<div class="sec"><div class="sec-h">${ic('team-upgrade')} Koalisyonlar</div><div class="chips">${coal.map(c=>`<span class="chip">${flagH(c.flag,18)} ${esc(c.name)}</span>`).join('')}</div></div>`:''}
   ${wars.length?`<div class="sec"><div class="sec-h">${ic('crossed-swords')} Savaştığı Ülkeler</div><div class="chips">${wars.slice(0,14).map(x=>`<span class="chip war" data-go="${x.id}" style="cursor:pointer">${flagH(x.flag,18)} ${esc(x.name)}</span>`).join('')}</div></div>`:''}
   ${allies.length?`<div class="sec"><div class="sec-h">${ic('shaking-hands')} Müttefikleri <span class="r">${allies.length}</span></div><div class="chips">${allies.slice(0,16).map(x=>`<span class="chip ally" data-go="${x.id}" style="cursor:pointer">${flagH(x.flag,18)} ${esc(x.name)}</span>`).join('')}</div></div>`:''}
   ${me?`<div class="acts-grid">${A('panel-army','rally-the-troops','Ordu')}${A('panel-eco','coins-pile','Ekonomi')}${A('panel-tech','atom','Teknoloji')}${A('panel-pol','scales','Politika')}</div>`:
   `<div class="sec"><div class="sec-h">${ic('scroll-quill')} Diplomatik Eylemler</div><div class="acts-grid">
     ${atWar?'':A('declare','crossed-swords','Savaş İlan Et','red','Savaş ilan et. Müttefikleri devreye girebilir.')}
     ${ally?A('breakAlly','broken-shield','İttifakı Boz'):(atWar?'':A('ally','shaking-hands','İttifak Teklif Et','blue',`Kabul ihtimali ilişkiye bağlı. Rakipleri öfkelenebilir.`))}
     ${atWar?'':A('trade','trade',P.trade.has(id)?'Ticareti İptal Et':'Ticaret Anlaşması')}
     ${atWar||P.pacts.has(id)?'':A('pact','contract','Saldırmazlık Paktı')}
     ${A('aid','receive-money','Yardım Gönder','',`${fmtM(Math.max(50,Math.round(P.income*10)))} gönderir`)}
     ${A('sanction','scales',P.sanc.has(id)?'Yaptırımı Kaldır':'Yaptırım Uygula')}
     ${A('insult','megaphone','Kınama Yap')}
     ${atWar?'':A('guarantee','shield',P.guarantees.has(id)?'Garantiyi Çek':'Bağımsızlık Garantisi')}
     ${atWar||P.puppets.has(id)?'':A('vassal','chess-king','Kukla Yapmayı Dene','','Çok güçlü olmanız gerekir')}
     ${atWar?'':A('demand','treasure-map','Toprak Talep Et','','Sınır bölgelerini ister. Reddedilirse savaş çıkabilir.')}
     ${A('spy','spy','İstihbarat Operasyonu')}
     ${occ.length?A('release','dove',`Serbest Bırak (${occ[0]})`,'','İşgal ettiğiniz topraklarını kukla devlet olarak bağımsız yapar'):''}
   </div></div>`}
  </div>`;
  el.scrollTop=sc;
  $('#ccX').onclick=()=>UI.hideCard();
  el.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>UI.showCard(+b.dataset.go,true));
  el.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{ Sfx.play('click'); const a=b.dataset.a;
    if(a.startsWith('panel-')) return UI.openPanel(a.slice(6));
    if(a==='declare') return UI.confirm('Savaş İlanı',`${esc(n.name)}'e savaş ilan etmek üzeresiniz.${G.alliesOf(id).size?` <b>${G.alliesOf(id).size}</b> müttefiki savaşa katılabilir.`:''} Uluslararası toplumun tepkisini çekebilirsiniz.`,'Savaş İlan Et',()=>{ Act.declare(id); UI.showCard(id); },'red','crossed-swords');
    if(a==='spy'){ UI.openPanel('spy'); return; }
    if(Act[a]) { Act[a](id); UI.refresh(true); UI.showCard(id); } });
  const prS=$('#prS'); if(prS) prS.oninput=()=>{ P.priority[id]=+prS.value; $('#prV').textContent=(+prS.value).toFixed(1)+'x'; };
  const bind=(sel,f)=>{ const b=$(sel); if(b) b.onclick=f; };
  bind('#aTarget',()=>UI.startTarget('attack',id)); bind('#aAir',()=>UI.startTarget('air',id)); bind('#aMis',()=>UI.startTarget('missile',id)); bind('#aNav',()=>UI.startTarget('naval',id)); bind('#aNuke',()=>UI.startTarget('nuke',id));
  bind('#pWhite',()=>{Act.peace(id,'white');UI.refresh(true);}); bind('#pStatus',()=>{Act.peace(id,'status');UI.refresh(true);}); bind('#pAnnex',()=>{Act.peace(id,'annex');UI.refresh(true);});
};
UI.hideCard=function(){ UI.cardId=-1; $('#card').classList.add('hidden'); if(Render.sel>=0) Render.select(-1); };

// ---------- TARGETING ----------
const TARGET_TXT={attack:['crosshair','Saldırı yönünü seçin: ordunuz bu noktaya doğru ilerleyecek'],air:['jet-fighter','Hava saldırısı için düşman bölgesi seçin'],missile:['missile-pod','Füze hedefi seçin (şehirler en iyi hedeftir)'],naval:['anchor','Çıkarma yapılacak düşman kıyısını seçin'],nuke:['nuclear-bomb','NÜKLEER HEDEF SEÇİN']};
UI.startTarget=function(kind,enemy){ UI.target={kind,enemy}; const t=TARGET_TXT[kind]; const b=$('#targetBanner'); b.innerHTML=`${ic(t[0])} ${t[1]} <span class="kbd">Esc</span> iptal`; b.classList.remove('hidden'); $('#map').classList.add('target'); Sfx.play('warn'); };
UI.endTarget=function(){ UI.target=null; $('#targetBanner').classList.add('hidden'); $('#map').classList.remove('target'); };
UI.applyTarget=function(cell){ const t=UI.target; const P=N_(G.player); if(cell<0) return; const o=M.owner[cell];
  if(!P.wars.has(o)){ UI.toast('Savaşta olduğunuz bir ülkenin toprağını seçin.','warn','crosshair'); return; }
  if(t.kind==='attack'){ P.target={enemy:o,x:M.x[cell],y:M.y[cell]}; UI.toast(`Ordular ${N_(o).name} içlerine doğru ilerliyor`,'ok','crosshair'); UI.endTarget(); return; }
  if(t.kind==='naval'){ const r=G.navalInvasion(P.id,cell); if(!r.ok) UI.toast(r.msg,'danger','anchor'); else UI.toast(`Çıkarma filosu yola çıktı: ${r.days} gün, ${fmtM(r.cost)}`,'info','battleship'); UI.endTarget(); return; }
  if(t.kind==='nuke'){ UI.endTarget(); UI.confirm('NÜKLEER SALDIRI ONAYI',`Bu karar geri alınamaz. ${esc(N_(o).name)} topraklarına nükleer başlık fırlatılacak. Tüm dünya size düşman olacak ve misilleme gelebilir.`,'FÜZEYİ FIRLAT',()=>{ const r=G.strike(P.id,cell,'nuke'); if(!r.ok) UI.toast(r.msg,'danger','nuclear-bomb'); },'red','nuclear-bomb'); return; }
  const r=G.strike(P.id,cell,t.kind); if(!r.ok) UI.toast(r.msg,'danger',t.kind==='air'?'jet-fighter':'missile-pod'); UI.endTarget(); UI.refresh(true); };

// ---------- MAP INPUT ----------
UI.bindMap=function(){ const cv=$('#map'); const pts=new Map(); let down=null, moved=false, pinch=null;
  cv.addEventListener('pointerdown',e=>{ Sfx.resume(); cv.setPointerCapture(e.pointerId); pts.set(e.pointerId,[e.clientX,e.clientY]); if(pts.size===1){ down={x:e.clientX,y:e.clientY,cx:Render.cam.x,cy:Render.cam.y}; moved=false; } else if(pts.size===2){ const [a,b]=[...pts.values()]; pinch={d:Math.max(1,Math.hypot(a[0]-b[0],a[1]-b[1])),z:Render.cam.z}; moved=true; } Render.fly=null; });
  cv.addEventListener('pointermove',e=>{ if(pts.has(e.pointerId)) pts.set(e.pointerId,[e.clientX,e.clientY]);
    if(pts.size===2&&pinch){ const [a,b]=[...pts.values()]; const d=Math.hypot(a[0]-b[0],a[1]-b[1]); const f=pinch.z*d/pinch.d/Render.cam.z; UI.zoomBy(f,(a[0]+b[0])/2,(a[1]+b[1])/2); moved=true; return; }
    if(down&&pts.size===1){ const dx=e.clientX-down.x, dy=e.clientY-down.y; if(Math.abs(dx)+Math.abs(dy)>(e.pointerType==='mouse'?5:12)){ moved=true; cv.classList.add('drag'); } if(moved){ Render.cam.x=down.cx-dx/Render.cam.z; Render.cam.y=down.cy-dy/Render.cam.z; Render.clampCam(); } }
    UI._hov=[e.clientX,e.clientY]; });
  const up=e=>{ pts.delete(e.pointerId); if(pts.size<2) pinch=null; if(pts.size===1&&down){ const [p]=[...pts.values()]; down={x:p[0],y:p[1],cx:Render.cam.x,cy:Render.cam.y}; moved=true; } cv.classList.remove('drag'); if(down&&!moved&&pts.size===0){ const [wx,wy]=Render.s2w(e.clientX,e.clientY); const cell=M.cellAt(wx,wy); UI.mapClick(cell); } if(pts.size===0) down=null; };
  cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',up); cv.addEventListener('pointerleave',()=>{UI._hov=null;$('#hover').classList.add('hidden');});
  cv.addEventListener('wheel',e=>{ e.preventDefault(); Render.fly=null; UI.zoomBy(Math.exp(-e.deltaY*0.0016),e.clientX,e.clientY); },{passive:false});
  cv.addEventListener('dblclick',e=>{ UI.zoomBy(2,e.clientX,e.clientY); });
};
UI.mapClick=function(cell){ if(UI.mode==='pick'){ if(cell>=0) Pick.select(M.owner[cell]); return; }
  if(UI.target){ UI.applyTarget(cell); return; } if(cell<0){ UI.hideCard(); return; } Sfx.play('click'); UI.showCard(M.owner[cell]); };
UI.hoverFrame=function(){ const h=$('#hover'); if(!UI._hov||!G.nations.length){ return; } const [x,y]=UI._hov; const [wx,wy]=Render.s2w(x,y); const cell=M.cellAt(wx,wy); if(cell<0){ h.classList.add('hidden'); return; }
  const n=N_(M.owner[cell]); if(!n) return; const cs=M.cityByCell[cell]; const city=cs?CITIES[cs[0]][0]:''; const core=M.core[cell]!==M.owner[cell]?N_(M.core[cell]):null; const P=G.player>=0?N_(G.player):null;
  const key=cell+'_'+n.id+'_'+(P?P.wars.has(n.id):0); if(UI._hk!==key){ UI._hk=key; h.innerHTML=`${flagH(n.flag,24)}<div><b>${esc(n.name)}</b>${city?` <small>· ${esc(city)}</small>`:''}${core?`<br><small class="red">İşgal altında: ${esc(core.name)}</small>`:''}${P&&n.id!==P.id?`<br><small style="color:${relCol(G.rel_(n.id,P.id))}">${P.wars.has(n.id)?'SAVAŞTA':relTxt(G.rel_(n.id,P.id))}</small>`:''}</div>`; }
  h.classList.remove('hidden'); h.style.left=(x+16)+'px'; h.style.top=(y+16)+'px'; };

// ---------- KEYBOARD ----------
addEventListener('keydown',e=>{ if(e.target.tagName==='INPUT') return; const k=e.key.toLowerCase();
  if(k==='escape'){ if(UI.target) return UI.endTarget(); if(UI.closeTop()) return; if(UI.panel) return UI.openPanel(null); if(UI.cardId>=0) return UI.hideCard(); if(UI.mode==='game') UI.pauseMenu(); return; }
  if(UI.mode!=='game') return;
  if(k===' '){ e.preventDefault(); G.paused=!G.paused; UI.refreshTop(); }
  if('12345'.includes(k)&&k.length===1){ G.speed=+k; G.paused=false; UI.refreshTop(); }
  const map={o:'army',e:'eco',d:'dip',t:'tech',p:'pol','ı':'spy',i:'spy',k:'coal',b:'un',s:'stats',r:'rank',a:'ach'}; if(map[k]&&!e.ctrlKey&&!e.metaKey) UI.openPanel(map[k]); if(k==='g') UI.newspaper();
  if(k==='+'||k==='=') UI.zoomBy(1.4); if(k==='-') UI.zoomBy(1/1.4);
  if(k==='m'){ const ms=['political','diplo','alliance','econ','power','stab','religion','terrain']; const i=(ms.indexOf(Render.mode)+1)%ms.length; Render.setMode(ms[i]); $$('#modes button').forEach(x=>x.classList.toggle('on',x.dataset.m===ms[i])); }
  if(k==='h'){ const P=N_(G.player); if(P.capital>=0) Render.flyTo(M.x[P.capital],M.y[P.capital],3); }
});
UI.keys={}; addEventListener('keydown',e=>{ if(e.target.tagName!=='INPUT') UI.keys[e.key]=1; }); addEventListener('keyup',e=>{ delete UI.keys[e.key]; });
UI.keyPan=function(dt){ const k=UI.keys; let dx=0,dy=0; if(k.ArrowLeft)dx--; if(k.ArrowRight)dx++; if(k.ArrowUp)dy--; if(k.ArrowDown)dy++; if(UI.mode==='game'&&!UI.panel){} if(dx||dy){ Render.cam.x+=dx*dt*700/Render.cam.z; Render.cam.y+=dy*dt*700/Render.cam.z; Render.clampCam(); } };

// ---------- MENUS ----------
UI.show=function(id){ ['boot','menu','scen','pick','hud'].forEach(s=>$('#'+s).classList.toggle('hidden',s!==id&&!(id==='hud'&&false))); };
UI.toMenu=function(){ G.paused=true; G.player=-1; UI.mode='menu'; UI.hideCard(); UI.openPanel(null); $('#modals').innerHTML=''; UI._over=false; UI.show('menu'); };
UI.buildMenu=function(){
  const B=[['play','Tek Oyunculu','crossed-swords','primary','Kampanya'],['online','Çok Oyunculu','world','','Online'],['scen','Senaryolar','scroll-unfurled','',GD.SCENARIOS.length+' senaryo'],['load','Oyun Yükle','save',''],['set','Ayarlar','settings-knobs',''],['help','Nasıl Oynanır','open-book',''],['ach','Başarımlar','trophy',''],['cred','Krediler','quill-ink','']];
  $('#menubtns').innerHTML=B.map(b=>`<button class="mbtn ${b[3]}" data-m="${b[0]}">${ic(b[2])}${b[1]}${b[4]?`<small>${b[4]}</small>`:''}</button>`).join('');
  $$('#menubtns .mbtn').forEach(b=>{ b.onmouseenter=()=>Sfx.play('hover'); b.onclick=()=>{ Sfx.resume(); Sfx.play('click'); const m=b.dataset.m;
    if(m==='play'||m==='scen') Scen.open(m==='play'?'modern':null);
    if(m==='online') UI.soon(); if(m==='set') UI.settings(); if(m==='help') UI.help(); if(m==='cred') UI.credits(); if(m==='load') UI.loadMenu(); if(m==='ach') UI.achModal(); }; });
  $('#menunews').innerHTML=`<h4>${ic('newspaper')} DÜNYA GÜNDEMİ</h4><ul>${['Rusya–Ukrayna cephesinde çatışmalar sürüyor','Orta Doğu\'da gerilim tırmanıyor: Körfez alarmda','NATO doğu kanadını güçlendiriyor','Küresel ekonomi resesyon sinyalleri veriyor','Tayvan Boğazı\'nda yeni tatbikat'].map(t=>`<li>${ic('megaphone')}${t}</li>`).join('')}</ul>`;
};
UI.soon=function(){ UI.modal(`<div class="modal"><div class="soon">${ic('world','hero')}<div class="big">YAKINDA</div><p class="mut">Çok oyunculu mod üzerinde çalışıyoruz. Arkadaşlarınla aynı dünya haritasında ittifak kurup savaşabileceğin online savaşlar çok yakında burada.</p><div class="chips" style="justify-content:center;margin:18px 0 22px"><span class="chip gold">${ic('team-upgrade')} 8 oyuncuya kadar</span><span class="chip gold">${ic('conversation')} Oyun içi sohbet</span><span class="chip gold">${ic('podium')} Sıralı maçlar</span></div><button class="btn gold" data-close>Tamam</button></div></div>`); };
UI.credits=function(){ UI.modal(`<div class="modal"><div class="mhead">${ic('quill-ink','gold')}<h2>Krediler</h2></div><div class="mbody help"><p><b>CİHAN — Dünya Hakimiyeti</b> bir büyük strateji oyunudur.</p><h4>${ic('treasure-map')} Harita Verisi</h4><p>Natural Earth (kamu malı) ülke sınırları, world-atlas paketi ile.</p><h4>${ic('tower-flag')} Bayraklar</h4><p>flagcdn.com ülke bayrakları; tarihi bayraklar oyun için çizildi.</p><h4>${ic('cog')} Simgeler</h4><p>game-icons.net (CC BY 3.0) — Lorc, Delapouite ve diğer sanatçılar.</p><h4>${ic('speaker')} Ses</h4><p>Tüm ses efektleri ve müzik gerçek zamanlı olarak sentezlenir.</p></div><div class="mfoot"><button class="btn" data-close>Kapat</button></div></div>`); };
UI.help=function(){ UI.modal(`<div class="modal wide"><div class="mhead">${ic('open-book','gold')}<h2>Nasıl Oynanır</h2></div><div class="mbody help">
 <h4>${ic('treasure-map')} Amaç</h4><p>Bir ülke seç, ekonomini büyüt, ordunu kur, ittifaklar oluştur ve dünya karalarının büyük kısmını bayrağın altında topla. Senaryoya göre hayatta kalma veya tehdidi yok etme hedefleri de vardır.</p>
 <h4>${ic('crossed-swords')} Savaş</h4><ul><li>Haritada bir ülkeye tıkla → <b>Savaş İlan Et</b>.</li><li>Cepheler otomatik oluşur; sınırlardaki küçük bayraklar askerlerini temsil eder ve çatışır.</li><li><b>Saldırı Hedefi</b> ile ilerleme yönünü seç, <b>Cephe Önceliği</b> ile gücünü o cepheye yığ.</li><li>Hava saldırısı, füze, deniz çıkarması ve nükleer silahlar savaş kartında.</li><li>Savaş skoru yükselince barış/ilhak talep et.</li></ul>
 <h4>${ic('rally-the-troops')} Ordu Basma</h4><p>Ordu panelinden birlik eğit. Her birlik hazine ve insan gücü harcar, günlük bakım gideri vardır.</p>
 <h4>${ic('coins-pile')} Ekonomi</h4><p>Vergiyi ayarla, binalar inşa et, ticaret anlaşmaları yap. Yüksek vergi halkı kızdırır, para basmak enflasyon yaratır.</p>
 <h4>${ic('shouting')} Halk ve Olaylar</h4><p>Halk desteği düşerse protestolar, grevler ve darbe girişimleri yaşanır. Deprem, sel, salgın gibi afetler şehirlerini vurur; vereceğin kararlar sonucu belirler. Halkının dini/kültürel olarak sevmediği ülkelerle ittifak kurmak protestolara yol açar.</p>
 <h4>${ic('keyboard')} Kısayollar</h4><p><span class="kbd">Boşluk</span> duraklat · <span class="kbd">1-5</span> hız · <span class="kbd">O</span> Ordu · <span class="kbd">E</span> Ekonomi · <span class="kbd">D</span> Diplomasi · <span class="kbd">T</span> Teknoloji · <span class="kbd">P</span> Politika · <span class="kbd">K</span> Koalisyon · <span class="kbd">G</span> Gazete · <span class="kbd">M</span> harita modu · <span class="kbd">H</span> başkent · <span class="kbd">Ok tuşları</span> kaydır · <span class="kbd">Fare tekeri</span> yakınlaştır</p>
 </div><div class="mfoot"><button class="btn gold" data-close>Anladım</button></div></div>`); };
UI.settings=function(){ const S=G.settings; const tg=(k,l,d)=>`<div class="set-row"><label>${l}<small>${d}</small></label><button class="tog ${S[k]?'on':''}" data-k="${k}"></button></div>`;
  const w=UI.modal(`<div class="modal"><div class="mhead">${ic('settings-knobs','gold')}<h2>Ayarlar</h2></div><div class="mbody">
   <div class="set-row"><label>Bayrak opaklığı<small>Toprakların üstündeki bayrak katmanı</small></label><input type="range" min="0.2" max="0.95" step="0.05" value="${S.flagAlpha}" id="sFa" style="width:150px"></div>
   ${tg('labels','Ülke isimleri','Harita üzerinde ülke adları')}${tg('cities','Şehirler','Yakınlaştırınca şehirler görünür')}${tg('tokens','Cephe askerleri','Sınırlarda çatışan bayrak askerleri')}${tg('borders','Gerçek sınır çizgileri','Yakın zoomda vektör sınırlar')}${tg('sound','Ses efektleri','')}${tg('music','Müzik','Dinamik orkestral müzik')}${tg('autoPauseEvents','Olaylarda duraklat','Karar pencereleri açılınca oyun durur')}
   <div class="set-row"><label>Olay sıklığı<small>Afet, kriz ve fırsat olayları</small></label><div class="seg" id="sEv">${['Kapalı','Normal','Sık'].map((t,i)=>`<button data-v="${i}" class="${S.events===i?'on':''}">${t}</button>`).join('')}</div></div>
  </div><div class="mfoot"><button class="btn gold" data-close>Kaydet</button></div></div>`);
  w.querySelectorAll('.tog').forEach(b=>b.onclick=()=>{ const k=b.dataset.k; S[k]=!S[k]; b.classList.toggle('on',S[k]); if(k==='music') { Sfx.resume(); Sfx.setMusic(S.music);} });
  w.querySelector('#sFa').oninput=e=>{ S.flagAlpha=+e.target.value; clearTimeout(UI._fa); UI._fa=setTimeout(()=>{ if(G.nations.length) Render.renderAll(); },120); };
  w.querySelectorAll('#sEv button').forEach(b=>b.onclick=()=>{ S.events=+b.dataset.v; w.querySelectorAll('#sEv button').forEach(x=>x.classList.toggle('on',x===b)); }); };
UI.achModal=function(){ UI.modal(`<div class="modal wide"><div class="mhead">${ic('trophy','gold')}<h2>Başarımlar</h2></div><div class="mbody"><div class="ach-grid" style="grid-template-columns:repeat(3,1fr)">${GD.ACHIEVEMENTS.map(a=>`<div class="ach ${G.achievements.has(a[0])?'on':''}">${ic(a[2])}<div><b>${a[1]}</b><small>${a[3]}</small></div></div>`).join('')}</div></div><div class="mfoot"><button class="btn" data-close>Kapat</button></div></div>`); };
UI.pauseMenu=function(){ if($('.mwrap.pm')) return; const was=G.paused; G.paused=true; UI.refreshTop();
  const w=UI.modal(`<div class="modal" style="width:380px"><div class="mhead" style="justify-content:center"><h2>Oyun Duraklatıldı</h2></div><div class="mbody" style="display:flex;flex-direction:column;gap:8px">
   <button class="btn lg gold block" data-close>${ic('play-button')} Devam Et</button><button class="btn lg block" id="pmSave">${ic('save')} Oyunu Kaydet</button><button class="btn lg block" id="pmLoad">${ic('open-book')} Oyun Yükle</button><button class="btn lg block" id="pmSet">${ic('settings-knobs')} Ayarlar</button><button class="btn lg block" id="pmHelp">${ic('help')} Nasıl Oynanır</button><button class="btn lg block red" id="pmMenu">${ic('exit-door')} Ana Menü</button></div></div>`,{onClose:()=>{ G.paused=was; UI.refreshTop(); }});
  w.classList.add('pm');
  w.querySelector('#pmSave').onclick=()=>{ Save.saveMenu(); }; w.querySelector('#pmLoad').onclick=()=>UI.loadMenu(); w.querySelector('#pmSet').onclick=()=>UI.settings(); w.querySelector('#pmHelp').onclick=()=>UI.help();
  w.querySelector('#pmMenu').onclick=()=>UI.confirm('Ana menüye dön','Kaydedilmemiş ilerleme kaybolacak.','Ana Menü',()=>{ w.remove(); UI.toMenu(); },'red','exit-door'); };
UI.loadMenu=function(){ Save.loadMenu(); };

// ---------- SCENARIO SCREEN ----------
const Scen={ sel:null, opts:{diff:1,win:60,events:1} };
Scen.open=function(id){ UI.mode='scen'; UI.show('scen'); $('#scenBack').innerHTML=ic('return-arrow')+' Geri'; $('#scenBack').onclick=()=>{ UI.mode='menu'; UI.show('menu'); };
  $('#scengrid').innerHTML=GD.SCENARIOS.map(s=>`<div class="sc-card" data-id="${s.id}"><img src="img/${s.img}.jpg" alt=""><span class="yr">${s.year<1000?'MS '+s.year:s.year}</span><div class="sc-info"><h3>${s.n}</h3><span class="stars">${[1,2,3,4,5].map(i=>ic('star-medal',i<=s.diff?'':'off')).join('')}</span></div></div>`).join('');
  $$('.sc-card').forEach(c=>{ c.onclick=()=>{ Sfx.play('click'); Scen.select(c.dataset.id); }; c.ondblclick=()=>Scen.start(); });
  Scen.select(id||Scen.sel||'modern'); };
Scen.select=function(id){ Scen.sel=id; const s=GD.SCENARIOS.find(x=>x.id===id); $$('.sc-card').forEach(c=>c.classList.toggle('sel',c.dataset.id===id)); const o=Scen.opts;
  const segs=(k,arr)=>`<div class="seg" data-k="${k}">${arr.map(([v,l])=>`<button data-v="${v}" class="${o[k]==v?'on':''}">${l}</button>`).join('')}</div>`;
  $('#scendetail').innerHTML=`<div class="hero" style="background-image:url(img/${s.img}.jpg)"></div><div class="bd"><div><span class="chip gold">${s.year<1000?'MS '+s.year:s.year}</span></div><h2>${s.n}</h2><p>${s.desc}</p>
   <div class="row"><span class="mut" style="font-size:12px;letter-spacing:.1em">ZORLUK</span><span class="stars">${[1,2,3,4,5].map(i=>ic('star-medal',i<=s.diff?'':'off')).join('')}</span></div>
   ${s.wars&&s.wars.length?`<div class="opt"><label>Süren savaşlar</label><div class="chips">${s.wars.slice(0,8).map(([a,b])=>`<span class="chip war">${flagH(s.names?.[a]?.[1]||a,16)} – ${flagH(s.names?.[b]?.[1]||b,16)}</span>`).join('')}</div></div>`:''}
   <div class="opt"><label>Yapay zeka zorluğu</label>${segs('diff',[[0,'Kolay'],[1,'Normal'],[2,'Zor'],[3,'Efsane']])}</div>
   <div class="opt"><label>Zafer koşulu (dünya karası)</label>${segs('win',[[25,'%25'],[40,'%40'],[60,'%60'],[85,'%85']])}</div>
   <div class="opt"><label>Olay sıklığı</label>${segs('events',[[0,'Kapalı'],[1,'Normal'],[2,'Sık']])}</div>
   <button class="btn gold lg block" id="scGo">${ic('treasure-map')} Ülke Seç</button></div>`;
  $$('#scendetail .seg').forEach(sg=>sg.querySelectorAll('button').forEach(b=>b.onclick=()=>{ o[sg.dataset.k]=+b.dataset.v; sg.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b)); Sfx.play('click'); }));
  $('#scGo').onclick=()=>Scen.start(); };
Scen.start=function(){ const s=GD.SCENARIOS.find(x=>x.id===Scen.sel); UI.show('boot'); $('#bootmsg').textContent='Dünya kuruluyor…'; $('#bootbar').style.width='60%'; $('#boottip').textContent=pick(GD.TIPS);
  setTimeout(()=>{ G.settings.difficulty=Scen.opts.diff; G.settings.events=Scen.opts.events; G.setup(s,{winShare:Scen.opts.win}); Render.select(-1); Render.mode='political'; Render.renderAll(); $('#bootbar').style.width='100%';
    setTimeout(()=>Pick.open(s),200); },60); };

// ---------- COUNTRY PICK ----------
const Pick={ sel:-1 };
Pick.open=function(s){ UI.mode='pick'; UI.show('pick'); $('#pick').classList.remove('hidden'); $('#pickScen').textContent=s.n; $('#pickBack').innerHTML=ic('return-arrow')+' Senaryolar'; $('#pickBack').onclick=()=>{ Render.select(-1); Scen.open(s.id); };
  $('#pickSearchIc').innerHTML=ic('magnifying-glass'); Render.cam.z=0.5; Render.cam.x=M.W*0.52; Render.cam.y=M.H*0.42; Render.clampCam();
  const alive=G.nations.filter(n=>n.alive&&n.cells>0); const top=[...alive].sort((a,b)=>G.power(b)*b.cells-G.power(a)*a.cells).slice(0,14);
  const feat=['TR','US','RU','CN','DE','GB','FR','IL','IR','UA','IN','JP','SA','BR','OE','SU','GE_EMP','ROMA','MONGOL','TURAN','HORDE','AFRICA'].map(c=>G.byCode[c]).filter(i=>i!=null&&N_(i).alive&&!N_(i).horde);
  const list=[...new Set([...feat,...top.map(n=>n.id)])].slice(0,18);
  $('#pickQuick').innerHTML=`<h5>ÖNE ÇIKAN ÜLKELER</h5>`+list.map(i=>{const n=N_(i);return `<button data-id="${i}">${flagH(n.flag,26)}<span>${esc(n.name)}</span><span class="p">${'★'.repeat(n.cells>3000?3:n.cells>800?2:1)}</span></button>`;}).join('');
  $$('#pickQuick button').forEach(b=>b.onclick=()=>{ Pick.select(+b.dataset.id,true); });
  const inp=$('#pickSearch'), res=$('#pickResults'); inp.value='';
  inp.oninput=()=>{ const q=inp.value.toLocaleLowerCase('tr').trim(); if(!q){res.classList.remove('on');return;} const m=alive.filter(n=>n.name.toLocaleLowerCase('tr').includes(q)).slice(0,12); res.innerHTML=m.map(n=>`<button data-id="${n.id}">${flagH(n.flag,24)}${esc(n.name)}</button>`).join('')||'<div class="empty">Bulunamadı</div>'; res.classList.add('on'); res.querySelectorAll('button').forEach(b=>b.onclick=()=>{ Pick.select(+b.dataset.id,true); res.classList.remove('on'); inp.value=''; }); };
  $('#pickCard').innerHTML=''; Pick.select(G.byCode.TR!=null&&N_(G.byCode.TR).alive?G.byCode.TR:(G.byCode.OE!=null&&N_(G.byCode.OE).alive?G.byCode.OE:list[0]),false);
};
Pick.select=function(id,fly){ const n=N_(id); if(!n||!n.alive||n.horde){ if(n&&n.horde) UI.toast('Bu taraf oynanamaz','warn','skull-crossed-bones'); return; } Pick.sel=id; Render.select(id); Sfx.play('click');
  if(fly&&n.label) Render.flyTo(n.label.x,n.label.y,clamp(30/Math.sqrt(n.cells+4),0.6,4));
  const gv=GD.GOVS[n.gov]; const wars=[...n.wars].map(N_); const coal=[...n.coal].map(c=>G.coalitions[c]).filter(Boolean); const pw=G.power(n); const diff=pw>3e6?'Kolay':pw>8e5?'Orta':pw>1.5e5?'Zor':'Çok Zor';
  $('#pickCard').innerHTML=`<div class="cc-head">${Leader.html(n,84,'cc')}<div><h3 style="font-size:22px">${esc(n.name)}</h3><div class="lname">${esc(Leader.of(n).full)}</div><div class="sub">${ic(gv.icon)} ${gv.n} · ${GD.RELIGIONS[n.religion].n}</div></div></div><div class="cc-body">
   <p class="mut" style="font-size:12.5px;margin-bottom:12px">${gv.desc}</p>
   <div class="kv" style="margin-bottom:12px"><div>${ic('family-house')}<div><b>${fmt(n.pop)}</b><span>Nüfus</span></div></div><div>${ic('coins-pile')}<div><b>${fmtM(n.gdp*1000)}</b><span>GSYİH</span></div></div><div>${ic('rally-the-troops')}<div><b>${fmt(n.u.piyade)}</b><span>Asker</span></div></div><div>${ic('crossed-swords')}<div><b>${fmt(pw)}</b><span>Güç</span></div></div><div>${ic('treasure-map')}<div><b>%${(n.cells/M.N*100).toFixed(2)}</b><span>Dünya Karası</span></div></div><div>${ic('nuclear-bomb')}<div><b>${n.u.nukleer|0}</b><span>Nükleer</span></div></div></div>
   ${coal.length?`<div class="chips" style="margin-bottom:10px">${coal.map(c=>`<span class="chip">${flagH(c.flag,16)} ${esc(c.name)}</span>`).join('')}</div>`:''}
   ${wars.length?`<div class="chips" style="margin-bottom:10px">${wars.slice(0,8).map(w=>`<span class="chip war">${ic('crossed-swords')} ${flagH(w.flag,16)} ${esc(w.name)}</span>`).join('')}</div>`:''}
   <div class="row" style="margin-bottom:14px;font-size:12px"><span class="mut">ZORLUK</span><span class="sp"></span><b class="gold">${diff}</b></div>
   <button class="btn gold lg block" id="pkGo">${ic('crown')} ${esc(n.name)} ile Başla</button></div>`;
  $('#pkGo').onclick=()=>Game.begin(id); };

// ---------- GAME BEGIN ----------
const Game={};
Game.begin=function(id){ G.player=id; const P=N_(id); P.autoResearch=false; UI.mode='game'; $('#pick').classList.add('hidden'); UI.show('hud'); $('#hud').classList.remove('hidden'); Render.select(-1); UI.tickerItems=[]; UI._over=false;
  if(!P.researching) AI.pickTech(P);
  UI.buildHUD(); UI.refresh(true); G.paused=false; G.speed=1;
  if(P.capital>=0) Render.flyTo(P.label?P.label.x:M.x[P.capital],P.label?P.label.y:M.y[P.capital],clamp(34/Math.sqrt(P.cells+4),0.8,4),1600);
  News.add('good',`${P.name} yeni bir döneme giriyor`,`${P.name} lideri ulusa seslendi: "Ülkemizi dünyanın en güçlü devleti yapacağız." Gözler yeni hükümetin ilk adımlarında.`,'ev_diplomacy',[id]);
  const wars=[...P.wars]; if(wars.length) UI.toast(`Savaştasınız: ${wars.map(w=>N_(w).name).slice(0,3).join(', ')}`,'danger','crossed-swords');
  setTimeout(()=>UI.toast('İpucu: Bir ülkeye tıklayarak diplomasi ve savaş seçeneklerini aç.','info','help'),1500);
  setTimeout(()=>UI.toast('İpucu: Sol menüden Ordu panelini açıp birlik eğitebilirsin.','info','rally-the-troops'),6000);
  Sfx.resume(); Sfx.play('war'); };
