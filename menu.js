// ============ CİHAN — ANA MENÜ (sinematik) ============
'use strict';
const Menu = { idx: 0, timer: null, fx: null, feat: [] };

UI.buildMenu = function(){
  const tiles = [
    ['online','Çok Oyunculu','world','Yakında'],
    ['scen','Senaryolar','scroll-unfurled', GD.SCENARIOS.length + ' senaryo'],
    ['load','Oyun Yükle','save','Kayıtlar'],
    ['ach','Başarımlar','trophy','Ödüller'],
    ['set','Ayarlar','settings-knobs','Ses ve grafik'],
    ['help','Nasıl Oynanır','open-book','Rehber']
  ];
  $('#menubtns').innerHTML =
    `<button class="mbtn primary m-in" data-m="play" style="--d:.18s"><span class="mb-ic">${ic('crossed-swords')}</span><span class="mb-tx"><b>Tek Oyunculu</b><small>Kampanyaya başla · Modern Dünya 2026</small></span><span class="mb-go">${ic('play-button')}</span><i class="gleam"></i></button>
     <div class="mgrid">${tiles.map((t,i)=>`<button class="mtile m-in${t[0]==='online'?' soon':''}" data-m="${t[0]}" style="--d:${.26+i*.05}s">${ic(t[2])}<b>${t[1]}</b><small>${t[3]}</small><i class="gleam"></i></button>`).join('')}</div>
     <div class="mlinks m-in" style="--d:.6s"><button data-m="cred">${ic('quill-ink')} Krediler</button><button data-m="priv">${ic('padlock')} Gizlilik</button></div>`;
  $$('#menubtns [data-m]').forEach(b=>{
    b.onmouseenter=()=>Sfx.play('hover');
    b.onclick=()=>{ Sfx.resume(); Sfx.play('click'); const m=b.dataset.m;
      if(m==='play'||m==='scen') Scen.open(m==='play'?'modern':null);
      if(m==='online') UI.soon(); if(m==='set') UI.settings(); if(m==='help') UI.help(); if(m==='cred') UI.credits();
      if(m==='load') UI.loadMenu(); if(m==='ach') UI.achModal(); if(m==='priv') Menu.privacy(); };
  });
  Menu.ticker(); Menu.buildShow(); Menu.startFx();
};

Menu.privacy = function(){
  UI.modal(`<div class="modal"><div class="mhead">${ic('padlock','gold')}<h2>Gizlilik</h2></div><div class="mbody help"><p><b>CİHAN</b> tamamen çevrimdışı çalışır. Hesap, reklam, analiz veya izleme yoktur; hiçbir kişisel veri toplanmaz ya da cihaz dışına gönderilmez.</p><p>Kayıtlı oyunlar yalnızca senin cihazında, senin seçtiğin dosyalarda tutulur.</p><p>Oyundaki lider portreleri yapay zeka ile üretilmiş kurgusal karakterlerdir; gerçek kişileri temsil etmez.</p></div><div class="mfoot"><button class="btn gold" data-close>Tamam</button></div></div>`);
};

Menu.ticker = function(){
  const base = ['Rusya–Ukrayna cephesinde çatışmalar sürüyor','Orta Doğu\'da gerilim tırmanıyor, Körfez alarmda','NATO doğu kanadını güçlendiriyor','Küresel piyasalarda resesyon endişesi','Tayvan Boğazı\'nda yeni tatbikat','Ankara\'da kritik zirve: bölgesel ittifak masada','Afrika\'da darbe dalgası endişe yaratıyor','BM Güvenlik Konseyi olağanüstü toplandı'];
  const news = (G.news||[]).slice(0,6).map(n=>n.title||n.t).filter(Boolean);
  const items = [...news, ...base].slice(0, 10);
  const row = items.map(t=>`<span class="mt-it"><i></i>${esc(t)}</span>`).join('');
  $('#mtmove').innerHTML = row + row;
  $('#mtmove').style.animationDuration = Math.max(40, items.length * 7) + 's';
};

// ---------- LİDER VİTRİNİ ----------
Menu.buildShow = function(){
  const codes = ['TR','US','RU','CN','DE','GB','FR','IL','IR','IN','JP','SA','BR','UA','EG','KR','PK','IT'];
  Menu.feat = codes.map(c=>G.byCode[c]).filter(i=>i!=null && N_(i).alive && !N_(i).horde && N_(i).cells>0);
  if(!Menu.feat.length) Menu.feat = G.nations.filter(n=>n.alive&&n.cells>0&&!n.horde).sort((a,b)=>b.cells-a.cells).slice(0,10).map(n=>n.id);
  const el = $('#mshow');
  el.innerHTML = `<div class="ms-tag">${ic('crown')} LİDER VİTRİNİ</div><div class="ms-card" id="msCard"></div>
    <div class="ms-nav"><button class="ms-arr" id="msPrev">${ic('return-arrow')}</button><div class="ms-dots" id="msDots">${Menu.feat.map((_,i)=>`<i data-i="${i}"></i>`).join('')}</div><button class="ms-arr nx" id="msNext">${ic('return-arrow')}</button></div>`;
  $('#msPrev').onclick=()=>{ Sfx.play('click'); Menu.show(Menu.idx-1,true); };
  $('#msNext').onclick=()=>{ Sfx.play('click'); Menu.show(Menu.idx+1,true); };
  $$('#msDots i').forEach(d=>d.onclick=()=>{ Sfx.play('click'); Menu.show(+d.dataset.i,true); });
  let sx=null; const card=$('#msCard');
  card.addEventListener('pointerdown',e=>{ sx=e.clientX; });
  card.addEventListener('pointerup',e=>{ if(sx==null) return; const d=e.clientX-sx; sx=null; if(Math.abs(d)>40) Menu.show(Menu.idx+(d<0?1:-1),true); });
  Menu.idx = Math.max(0, Menu.feat.indexOf(G.byCode.TR));
  Menu.show(Menu.idx, false);
};

Menu.rank = function(n){ const arr=G.nations.filter(x=>x.alive&&x.cells>0).sort((a,b)=>G.power(b)-G.power(a)); return arr.indexOf(n)+1; };

Menu.show = function(i, user){
  if(!Menu.feat.length) return;
  Menu.idx = (i + Menu.feat.length) % Menu.feat.length;
  const n = N_(Menu.feat[Menu.idx]), L = Leader.of(n), gv = GD.GOVS[n.gov];
  const card = $('#msCard'); if(!card) return;
  card.innerHTML = `<div class="ms-por"><img src="${L.img}" alt=""><div class="ms-fl" style="background-image:url(${flagURL(n.flag)})"></div><span class="ms-rank">#${Menu.rank(n)}<small>GÜÇ</small></span></div>
    <div class="ms-info"><div class="ms-nat">${flagH(n.flag,30)}<h3>${esc(n.name)}</h3></div>
      <div class="ms-ldr">${esc(L.full)}</div>
      <div class="ms-gov">${ic(gv.icon)} ${gv.n} · ${GD.RELIGIONS[n.religion].n}</div>
      <div class="ms-stats"><div><b>${fmt(n.pop)}</b><span>Nüfus</span></div><div><b>${fmt(n.u.piyade)}</b><span>Asker</span></div><div><b>${fmtM(n.gdp*1000)}</b><span>GSYİH</span></div></div>
      <button class="btn gold block ms-go" id="msGo">${ic('crown')} Bu Ülkeyle Oyna</button></div>`;
  card.classList.remove('swap'); void card.offsetWidth; card.classList.add('swap');
  $$('#msDots i').forEach((d,k)=>d.classList.toggle('on',k===Menu.idx));
  $('#msGo').onclick = ()=>{ Sfx.resume(); Sfx.play('click'); Menu.wantCode = n.code; Scen.sel = G.scenario?.id && GD.SCENARIOS.find(s=>s.id===G.scenario.id) ? G.scenario.id : 'modern'; Scen.start(); };
  if(UI.mode==='menu' && n.label) Render.flyTo(n.label.x - 0/1, n.label.y, clamp(17/Math.sqrt(n.cells+4),0.55,1.8), 2600);
  if(UI.mode==='menu') Render.select(n.id);
  clearTimeout(Menu.timer); Menu.timer = setTimeout(()=>{ if(UI.mode==='menu') Menu.show(Menu.idx+1,false); }, user?12000:7000);
};

// Pick ekranında vitrinden seçilen ülkeyi önceden seç
(function(){
  const _po = Pick.open;
  Pick.open = function(s){ _po.apply(this, arguments); if(Menu.wantCode){ const id=G.byCode[Menu.wantCode]; Menu.wantCode=null; if(id!=null && N_(id).alive && !N_(id).horde) Pick.select(id,true); } };
  const _sh = UI.show;
  UI.show = function(id){
    const wasMenu = !$('#menu').classList.contains('hidden');
    const r = _sh.apply(this, arguments);
    if(id==='menu'){ Menu.enter(); }
    else if(wasMenu){ clearTimeout(Menu.timer); if(Render.sel>=0 && UI.mode!=='pick') Render.select(-1); }
    return r;
  };
})();

Menu.enter = function(){
  const m = $('#menu'); m.classList.remove('entered'); void m.offsetWidth; m.classList.add('entered');
  if(G.player<0 && Menu.feat.length) { Menu.ticker(); Menu.show(Menu.idx,false); }
  Menu.startFx();
};

// ---------- PARÇACIK EFEKTİ ----------
Menu.startFx = function(){
  const cv = $('#menufx'); if(!cv) return;
  if(Menu.fx) return; const ctx = cv.getContext('2d'); const P = [];
  const dpr = Math.min(2, devicePixelRatio||1);
  const fit = ()=>{ cv.width = innerWidth*dpr; cv.height = innerHeight*dpr; };
  fit(); addEventListener('resize', fit);
  const cnt = innerWidth < 900 ? 34 : 60;
  for(let i=0;i<cnt;i++) P.push({ x:Math.random(), y:Math.random(), r:.6+Math.random()*1.8, v:.012+Math.random()*.03, w:Math.random()*6.28, a:.25+Math.random()*.55 });
  let last = performance.now();
  Menu.fx = true;
  const step = now=>{
    const dt = Math.min(.05,(now-last)/1000); last = now;
    if(!$('#menu').classList.contains('hidden')){
      const W = cv.width, H = cv.height; ctx.clearRect(0,0,W,H);
      ctx.globalCompositeOperation = 'lighter';
      for(const p of P){ p.y -= p.v*dt; p.w += dt*.8; p.x += Math.sin(p.w)*.00025; if(p.y < -.02){ p.y = 1.02; p.x = Math.random(); }
        const x = p.x*W, y = p.y*H, r = p.r*dpr*3.2;
        const g = ctx.createRadialGradient(x,y,0,x,y,r); const al = p.a*(.6+.4*Math.sin(p.w*2));
        g.addColorStop(0,`rgba(255,214,140,${al})`); g.addColorStop(1,'rgba(255,170,60,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x,y,r,0,6.283); ctx.fill(); }
      ctx.globalCompositeOperation = 'source-over';
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

// Türkçe ek uyumu: bildirim ve diplomatik mesajlarda isim eklerini düzelt
(function(){
  const _t = UI.toast; UI.toast = function(msg, ...r){ return _t.call(this, trFix(msg), ...r); };
  const _p = UI.proposal; UI.proposal = function(id, icon, title, text, ...r){ return _p.call(this, id, icon, trFix(title), trFix(text), ...r); };
})();
