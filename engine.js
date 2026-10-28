// ============ CİHAN — CORE ENGINE ============
'use strict';
const G = {
  day:0, speed:1, paused:true, nations:[], byCode:{}, player:-1, news:[], events:[], wars:[], truces:{}, coalitions:{},
  tension:20, settings:{ flagAlpha:0.56, labels:true, cities:true, tokens:true, sound:true, music:true, events:1, difficulty:1, borders:true, autoPauseEvents:true },
  stats:{ captured:0, lost:0, killed:0, casualties:0, disasters:0, spyOk:0, unWins:0, destroyed:0, peaceCount:0 },
  hist:[], achievements:new Set(), un:null, radiated:null, listeners:{}, scenario:null
};
G.on=(ev,f)=>{(G.listeners[ev]=G.listeners[ev]||[]).push(f);};
G.emit=(ev,...a)=>{(G.listeners[ev]||[]).forEach(f=>{try{f(...a);}catch(e){console.error(e);}});};
const rnd=Math.random, clamp=(v,a,b)=>v<a?a:v>b?b:v, pick=a=>a[(rnd()*a.length)|0];
const fmt=(v)=>{const a=Math.abs(v);if(a>=1e9)return (v/1e9).toFixed(2)+' Mr';if(a>=1e6)return (v/1e6).toFixed(a>=1e7?1:2)+' Mn';if(a>=1e4)return (v/1e3).toFixed(0)+'B';if(a>=1e3)return (v/1e3).toFixed(1)+'B';return Math.round(v)+'';};
const fmtM=(v)=>{const a=Math.abs(v);if(a>=1e6)return (v/1e6).toFixed(2)+' T$';if(a>=1e3)return (v/1e3).toFixed(a>=1e4?0:1)+' Mr$';return Math.round(v)+' M$';};
const dateStr=(d)=>{const y=G.scenario.year, dt=new Date(Date.UTC(2001,0,1)+d*864e5);const yy=y+Math.floor(d/365);const m=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];const doy=d%365;const md=[31,28,31,30,31,30,31,31,30,31,30,31];let mm=0,dd=doy;while(dd>=md[mm]){dd-=md[mm];mm++;}return (dd+1)+' '+m[mm]+' '+yy;};
const yearOf=d=>G.scenario.year+Math.floor(d/365);

// ---------- MAP / CELL INIT ----------
const M = {};
M.init=function(){
  const w=WORLD; M.W=w.W; M.H=w.H; M.R=w.R; const hw=Math.sqrt(3)*w.R, rh=1.5*w.R; M.hw=hw; M.rh=rh;
  const cf=w.cells, N=cf.length/3; M.N=N;
  M.col=new Int16Array(N); M.row=new Int16Array(N); M.cc=new Int16Array(N); M.x=new Float32Array(N); M.y=new Float32Array(N);
  const grid=new Int32Array((w.rows+3)*(w.cols+3)).fill(-1); const GC=w.cols+3; M.GC=GC;
  for(let i=0;i<N;i++){const c=cf[i*3],r=cf[i*3+1];M.col[i]=c;M.row[i]=r;M.cc[i]=cf[i*3+2];M.x[i]=c*hw+(r&1?hw/2:0);M.y[i]=r*rh;grid[r*GC+c]=i;}
  M.grid=grid;
  M.nb=new Int32Array(N*6).fill(-1); M.coast=new Uint8Array(N);
  for(let i=0;i<N;i++){const c=M.col[i],r=M.row[i];const odd=r&1;
    const d=odd?[[1,0],[-1,0],[0,-1],[1,-1],[0,1],[1,1]]:[[1,0],[-1,0],[-1,-1],[0,-1],[-1,1],[0,1]];
    let k=0;for(const [dc,dr] of d){const cc=c+dc,rr=r+dr;let j=-1;if(cc>=0&&rr>=0&&rr<w.rows+3&&cc<GC)j=grid[rr*GC+cc];M.nb[i*6+k]=j;if(j<0)M.coast[i]=1;k++;}}
  M.owner=new Int16Array(N); M.core=new Int16Array(N); M.integ=new Float32Array(N); M.rad=new Float32Array(N); M.unrest=new Float32Array(N);
  // per original-country stats
  M.cGdp=new Float32Array(N); M.cPop=new Float32Array(N);
  const cn=w.countries; for(let i=0;i<N;i++){const c=cn[M.cc[i]];const n=Math.max(1,M.countryCells(M.cc[i]));M.cGdp[i]=c.gdp/n;M.cPop[i]=c.pop/n;}
  M.cityByCell={}; CITIES.forEach((c,i)=>{(M.cityByCell[c[3]]=M.cityByCell[c[3]]||[]).push(i);});
};
M._ccount=null;
M.countryCells=function(ci){ if(!M._ccount){M._ccount=new Int32Array(WORLD.countries.length);const cf=WORLD.cells;for(let i=0;i<cf.length;i+=3)M._ccount[cf[i+2]]++;} return M._ccount[ci]; };
M.cellAt=function(x,y){ // world coords
  const r0=Math.round(y/M.rh);let best=-1,bd=1e9;
  for(let r=r0-1;r<=r0+1;r++){const off=(r&1)?M.hw/2:0;const c0=Math.round((x-off)/M.hw);for(let c=c0-1;c<=c0+1;c++){if(r<0||c<0||c>=M.GC)continue;const i=M.grid[r*M.GC+c];if(i<0)continue;const d=(M.x[i]-x)**2+(M.y[i]-y)**2;if(d<bd){bd=d;best=i;}}}
  return bd<(M.R*1.3)**2?best:-1;
};
M.lonlat=(lon,lat)=>{const k=M.W/(2*Math.PI);const yN=-k*Math.log(Math.tan(Math.PI/4+84*Math.PI/360));return [M.W/2+lon/360*M.W, -k*Math.log(Math.tan(Math.PI/4+lat*Math.PI/360))-yN];};
M.toLonLat=(x,y)=>{const k=M.W/(2*Math.PI);const yN=-k*Math.log(Math.tan(Math.PI/4+84*Math.PI/360));const lon=(x-M.W/2)/M.W*360;const lat=(2*Math.atan(Math.exp(-(y+yN)/k))-Math.PI/2)*180/Math.PI;return [lon,lat];};

// ---------- NATIONS ----------
function makeNation(code,name,flagKey,gov,src){
  const n={ id:G.nations.length, code, src:src||code, name, flag:flagKey, gov:gov||'demokrasi', alive:true,
    color:null, religion:GD.religionOf(src||code), region:'', sub:'',
    money:0, tax:0.2, econ:1, gdpBase:0, popBase:0, gdp:0, pop:0, income:0, expense:0, net:0, debt:0, inflation:2, growth:0.02,
    u:{piyade:0,tank:0,topcu:0,ucak:0,heli:0,drone:0,gemi:0,denizalti:0,hs:0,fuze:0,nukleer:0},
    manpower:0, mpMax:0, approval:60, stability:65, weary:0, morale:1, research:0, rp:0, techs:new Set(), researching:null, policies:new Set(), bld:{},
    cells:0, startCells:0, capital:-1, origCapital:-1, coastal:false, wars:new Set(), allies:new Set(), pacts:new Set(), trade:new Set(), sanc:new Set(), guarantees:new Set(),
    overlord:-1, puppets:new Set(), coal:new Set(), aggr:0.3+rnd()*0.5, ai:{next:(rnd()*20)|0,target:-1,lastNaval:-999}, target:null, priority:{}, appMod:0, stabMod:0,
    hist:[], killed:0, lost:0, oil:0, leader:'', disasters:0, nukesUsed:0, lastWarDay:-9999, cooldown:{}, intel:new Set(), warStart:{}, startPower:0
  };
  for(const k in GD.BUILDINGS) n.bld[k]=0;
  G.nations.push(n); G.byCode[code]=n.id; return n;
}
function flagColor(key){ const a=FLAGS.avg[key]; if(!a) return [128,128,128]; return a.slice(); }
function nationColor(n){ // distinct-ish color derived from flag avg + hash
  let h=0; for(const ch of n.code) h=(h*31+ch.charCodeAt(0))>>>0;
  const a=flagColor(n.flag); const j=((h%60)-30); return [clamp(a[0]+j,20,235),clamp(a[1]-j/2,20,235),clamp(a[2]+j/3,20,235)];
}
const N_=id=>G.nations[id];
G.power=function(n){ // land power
  const t=G.techMod(n); const u=n.u;
  const p=(u.piyade*(1+t.inf) + u.tank*60*(1+t.tank) + u.topcu*35 + u.ucak*320*(1+t.air) + u.heli*120 + u.drone*95*(1+t.drone) + u.hs*10)*(1+t.all)*(1+t.atk)*(1+n.bld.akademi*0.03)*n.morale;
  return p;
};
G.navy=function(n){const t=G.techMod(n);return (n.u.gemi*100+n.u.denizalti*150)*(1+t.navy)*(1+n.bld.tersane*0.05);};
G.techMod=function(n){
  if(n._tm && n._tmv===n.techs.size+n.policies.size*100) return n._tm;
  const m={inf:0,tank:0,drone:0,strike:0,air:0,def:0,mshield:0,all:0,navy:0,atk:0,inc:0,trade:0,debt:0,agri:0,upkeep:0,sanction:0,res:0,mp:0,plague:0,spy:0,appr:0,stab:0,unrest:0,diplo:0,quake:0,disaster:0,cyberd:0,prop:0,counter:0,ucost:0,protest:0,weary:0,deter:0,win:0};
  for(const t of GD.TECHS){ if(n.techs.has(t[0])) for(const k in t[7]) m[k]=(m[k]||0)+t[7][k]; }
  for(const p of GD.POLICIES){ if(n.policies.has(p[0])) for(const k in p[5]) m[k]=(m[k]||0)+p[5][k]; }
  n._tm=m; n._tmv=n.techs.size+n.policies.size*100; return m;
};
G.costFactor=n=>clamp((n.gdp*1e9/Math.max(1,n.pop))/40000,0.1,1.2);
G.unitCost=function(n,k){const U=GD.UNITS[k];const t=G.techMod(n);let c=U.cost*Math.max(0.4,Math.sqrt(G.costFactor(n)))*(1+t.ucost);if(k==='gemi'||k==='denizalti')c*=(1-n.bld.tersane*0.03);return Math.max(1,Math.round(c*G.eraCost()));};
G.eraCost=()=>G.scenario&&G.scenario.era&&G.scenario.era<1800?0.06:1;
G.bldCost=(n,k)=>Math.round(GD.BUILDINGS[k].cost*(1+n.bld[k]*0.18)*Math.max(0.5,Math.sqrt(G.costFactor(n)))*G.eraCost())||1;
G.techCost=(n,t)=>Math.round(t[3]*(1+0.1*Math.max(0,n.techs.size-6)/6));

// ---------- SCENARIO SETUP ----------
G.setup=function(sc,opts){
  G.scenario=sc; G.opts=opts||{}; G.day=0; G.nations=[]; G.byCode={}; G.news=[]; G.wars=[]; G.truces={}; G.coalitions={}; G.tension=sc.id==='ww3'?75:sc.id==='peace'?5:25; G.achievements=new Set(); G.hist=[];
  G.stats={captured:0,lost:0,killed:0,casualties:0,disasters:0,spyOk:0,unWins:0,destroyed:0,peaceCount:0};
  const cn=WORLD.countries; const codeToNation={};
  // base nations from countries (dedupe)
  const seen={};
  cn.forEach((c,i)=>{ if(seen[c.a2]!==undefined) return; seen[c.a2]=1;
    const n=makeNation(c.a2, GD.NAME_FIX[c.a2]||c.tr, FLAGS.idx[c.a2]!==undefined?c.a2:'NONE', GD.GOV_OF[c.a2]||'demokrasi', c.a2);
    n.region=c.region; n.sub=c.sub; n.capName=c.capital; codeToNation[c.a2]=n.id; });
  // scenario-specific nations
  const ownMap={}; // a2 -> new code
  if(sc.own) for(const code in sc.own){ const lst=sc.own[code].split(' ').filter(Boolean); if(!lst.length) continue;
    let nn; if(G.byCode[code]!==undefined && !sc.names?.[code]) nn=N_(G.byCode[code]);
    else { const nm=sc.names?.[code]||[code,code,'demokrasi']; if(G.byCode[code]!==undefined){ nn=N_(G.byCode[code]); nn.name=nm[0]; nn.flag=nm[1]; nn.gov=nm[2]; } else { nn=makeNation(code,nm[0],nm[1],nm[2],lst[0]); nn.region=cn.find(c=>c.a2===lst[0])?.region||''; } }
    lst.forEach(a=>ownMap[a]=nn.id); }
  if(sc.names) for(const code in sc.names){ if(G.byCode[code]===undefined){ const nm=sc.names[code]; makeNation(code,nm[0],nm[1],nm[2]); } }
  if(sc.govs) for(const a in sc.govs) if(G.byCode[a]!==undefined) N_(G.byCode[a]).gov=sc.govs[a];
  // cell ownership
  for(let i=0;i<M.N;i++){ const c=cn[M.cc[i]]; let id=codeToNation[c.a2];
    if(ownMap[c.a2]!==undefined) id=ownMap[c.a2];
    else if(c.sov && codeToNation[c.sov]!==undefined && !(sc.own && ownMap[c.a2]===undefined && false)) id=ownMap[c.sov]!==undefined?ownMap[c.sov]:codeToNation[c.sov];
    M.owner[i]=id; M.core[i]=id; M.integ[i]=1; M.rad[i]=0; M.unrest[i]=0; }
  if(sc.cellOwn) for(const [code,a2,box] of sc.cellOwn){ const tid=G.byCode[code]; for(let i=0;i<M.N;i++){ if(cn[M.cc[i]].a2!==a2) continue; if(inBox(i,box)){M.owner[i]=tid;M.core[i]=tid;} } }
  // aggregate base econ
  G.nations.forEach(n=>{n.gdpBase=0;n.popBase=0;n.cells=0;});
  for(let i=0;i<M.N;i++){const n=N_(M.owner[i]);n.cells++;n.gdpBase+=M.cGdp[i];n.popBase+=M.cPop[i];}
  // historical eras: scale economy down
  const eraScale=sc.era?(sc.era<500?0.004:sc.era<1300?0.006:sc.era<1800?0.012:sc.era<1920?0.06:0.1):1;
  G.eraScale=eraScale;
  // capitals and initial stats
  G.nations.forEach(n=>{
    n.alive=n.cells>0; n.startCells=n.cells; if(!n.alive) return;
    n.color=nationColor(n);
    // capital: original country capital cell if owned, else largest-pop owned country capital
    let cap=-1, best=-1; cn.forEach(c=>{ if(c.cap!=null && M.owner[c.cap]===n.id){ if(c.a2===n.code){cap=c.cap;best=1e18;} else if(c.pop>best){best=c.pop;cap=c.cap;} } });
    if(n.code==='IL'&&M.owner[44510]===n.id) cap=44510;
    if(cap<0){ for(let i=0;i<M.N;i++) if(M.owner[i]===n.id){cap=i;break;} }
    n.capital=cap; n.origCapital=cap;
    n.gdp=n.gdpBase*eraScale; n.pop=n.popBase*(sc.era?Math.max(0.05,eraScale*3):1);
    // military
    const memb=[]; for(const a2 in ownMap) if(ownMap[a2]===n.id) memb.push(a2); if(!memb.length) memb.push(n.code);
    memb.forEach(a2=>{ const m=GD.MIL[a2]; const c=cn.find(x=>x.a2===a2); const pop=c?c.pop:n.pop; const g=c?c.gdp:n.gdp;
      if(m&&m.length>=8){ n.u.piyade+=m[0]*1000; n.u.tank+=m[1]; n.u.topcu+=m[2]; n.u.ucak+=m[3]; n.u.heli+=m[4]; n.u.gemi+=Math.round(m[5]*0.35); n.u.denizalti+=m[6]; n.u.drone+=m[7]; }
      else { const tr=Math.max(500,Math.min(pop*0.004,400000)); n.u.piyade+=Math.round(tr); n.u.tank+=Math.round(g*0.8); n.u.topcu+=Math.round(g*0.7); n.u.ucak+=Math.round(g*0.12); n.u.heli+=Math.round(g*0.1); n.u.gemi+=Math.round(g*0.02); n.u.drone+=Math.round(g*0.05); }
      if(GD.NUKES[a2]) n.u.nukleer+=Math.round(GD.NUKES[a2]/40);
      n.oil+=(GD.OIL[a2]||0); });
    if(sc.era){ n.u.drone=0;n.u.heli=0;n.u.nukleer=0;n.u.hs=0; if(sc.era<1900){n.u.tank=0;n.u.ucak=0;n.u.denizalti=0;n.u.topcu=Math.round(n.u.topcu*0.3);} else if(sc.era<1930){n.u.ucak=Math.round(n.u.ucak*0.2);n.u.tank=Math.round(n.u.tank*0.1);} n.u.piyade=Math.round(n.u.piyade*(sc.era<1800?0.6:1.3)); n.oil*=sc.era<1900?0:0.3; }
    n.u.fuze=sc.era?0:Math.round(n.u.ucak*0.6); n.u.hs=sc.era?0:Math.round(n.u.ucak*0.1);
    n.mpMax=Math.round(n.pop*0.02); n.manpower=Math.round(n.mpMax*0.5);
    n.money=Math.round(n.gdp*1000/365*20*0.07+200);
    const gv=GD.GOVS[n.gov]; n.approval=clamp(58+gv.approvalBase+(rnd()*10-5),20,90); n.stability=clamp(62+gv.stability+(rnd()*10-5),20,95);
    if(GD.NUKES[n.code]&&!sc.era){ n.techs.add('t_nuke'); }
    const devel=clamp(n.gdp*1e9/Math.max(1,n.pop)/60000,0,1);
    const startT=Math.round(devel*10+(n.gdp>1000?3:0)); const order=['t_inf','e_ind','s_super','c_media','c_edu','i_cyberd','t_drone','e_trade','e_bank','t_armor','c_egov','s_gene','t_naval','e_agri','c_health'];
    if(!sc.era) for(let k=0;k<startT&&k<order.length;k++) n.techs.add(order[k]);
    if(n.code==='TR'||n.code==='US'||n.code==='IL'||n.code==='IR'||n.code==='CN'||n.code==='RU'||n.code==='UA') n.techs.add('t_drone');
    n.coastal=false; n.leader='';
  });
  // starting occupations (e.g., RU in UA)
  if(sc.occupy) for(const [occ,vic,box] of sc.occupy){ const o=G.byCode[occ],v=G.byCode[vic]; if(o==null||v==null) continue; for(let i=0;i<M.N;i++) if(M.owner[i]===v && inBox(i,box)){ M.owner[i]=o; M.integ[i]=0; N_(o).cells++; N_(v).cells--; } }
  // relations matrix
  const NN=G.nations.length; G.NN=NN; G.rel=new Float32Array(NN*NN); G.relBase=new Float32Array(NN*NN);
  const alive=G.nations.filter(n=>n.alive);
  const neigh=G.computeNeighbors();
  for(const a of alive) for(const b of alive){ if(a===b) continue; let r=5;
    if(a.religion===b.religion) r+=15; if(a.gov===b.gov) r+=10;
    if((a.gov==='demokrasi')!==(b.gov==='demokrasi')) r-=8;
    if(GD.ARAB.has(a.code)&&GD.ARAB.has(b.code)) r+=15; if(GD.TURKIC.has(a.code)&&GD.TURKIC.has(b.code)) r+=25;
    if((a.code==='IL'&&b.religion==='islam')||(b.code==='IL'&&a.religion==='islam')) r-=40;
    if(neigh[a.id]&&neigh[a.id].has(b.id)) r-=6;
    G.rel[a.id*NN+b.id]=r; }
  const setR=(x,y,v)=>{const a=G.byCode[x],b=G.byCode[y];if(a==null||b==null)return;G.rel[a*NN+b]=v;G.rel[b*NN+a]=v;};
  if(!sc.era){ GD.RIVALS.forEach(r=>setR(...r)); GD.FRIENDS.forEach(r=>setR(...r)); }
  (sc.rel||[]).forEach(r=>setR(...r));
  G.relBase.set(G.rel);
  // coalitions
  const coalIds=sc.noCoal==='all'?[]:(sc.coal||Object.keys(GD.COALITIONS)).filter(k=>!(sc.noCoal||[]).includes(k));
  coalIds.forEach(k=>{const c=GD.COALITIONS[k];G.addCoalition(k,c.n,c.flag,c.type,c.color,c.m.split(' '));});
  (sc.extraCoal||[]).forEach(c=>G.addCoalition(c.id,c.n,c.flag,c.type,c.color,c.m.split(' ')));
  // wars
  if(sc.allWar){ for(const a of alive) for(const b of alive) if(a.id<b.id && neigh[a.id]?.has(b.id)) G.startWar(a.id,b.id,true); }
  (sc.wars||[]).forEach(([a,b])=>{const x=G.byCode[a],y=G.byCode[b];if(x!=null&&y!=null&&N_(x).alive&&N_(y).alive)G.startWar(x,y,true);});
  if(sc.hordeWar){ const h=G.byCode[sc.hordeWar]; const hn=N_(h); hn.aggr=1; hn.horde=true; hn.u.piyade=sc.hordeBoost.army; hn.money=50000; hn.approval=100; hn.stability=100; hn.mpMax=1e8; hn.manpower=1e8;
    if(sc.hordeBoost.tech){ GD.TECHS.forEach(t=>{ if(t[2]==='mil') hn.techs.add(t[0]); }); hn.u.drone=5000; hn.u.ucak=1500; }
    for(const n of alive) if(n.id!==h){ G.rel[h*NN+n.id]=-100; G.rel[n.id*NN+h]=-100; } neigh[h]?.forEach(b=>G.startWar(h,b,true)); }
  G.player=-1; G.radCells=[];
  alive.forEach(n=>{ n.startPower=G.power(n); });
  G.recount(); G.updateBorders(true);
};
function inBox(i,b){const [lon,lat]=M.toLonLat(M.x[i],M.y[i]);if(b.lonMin!=null&&lon<b.lonMin)return false;if(b.lonMax!=null&&lon>b.lonMax)return false;if(b.latMin!=null&&lat<b.latMin)return false;if(b.latMax!=null&&lat>b.latMax)return false;return true;}
G.addCoalition=function(id,name,flag,type,color,codes,founder){
  const mem=new Set(); codes.forEach(c=>{const x=G.byCode[c]; if(x!=null&&N_(x).alive) mem.add(x);});
  if(!mem.size && founder==null) return null;
  if(founder!=null) mem.add(founder);
  const c={id,name,flag,type,color:color||[150,150,150],members:mem,founder:founder??-1,created:G.day}; G.coalitions[id]=c;
  mem.forEach(m=>N_(m).coal.add(id));
  const NN=G.NN; mem.forEach(a=>mem.forEach(b=>{ if(a!==b){ G.rel[a*NN+b]=Math.min(100,G.rel[a*NN+b]+(type==='askeri'?25:12)); } }));
  return c;
};
G.computeNeighbors=function(){ const s={}; for(let i=0;i<M.N;i++){const o=M.owner[i];for(let k=0;k<6;k++){const j=M.nb[i*6+k];if(j<0)continue;const p=M.owner[j];if(p!==o){(s[o]=s[o]||new Set()).add(p);}}} G.neigh=s; return s; };
G.recount=function(){
  G.nations.forEach(n=>{n.cells=0;n.gdpBase=0;n.popBase=0;n.coastal=false;n.occCells=0;});
  for(let i=0;i<M.N;i++){const n=N_(M.owner[i]);n.cells++;const occ=M.core[i]!==M.owner[i];const f=(occ?0.45+0.55*M.integ[i]:1)*(1-M.rad[i]);n.gdpBase+=M.cGdp[i]*f;n.popBase+=M.cPop[i]*(1-M.rad[i]*0.8);if(M.coast[i])n.coastal=true;if(occ)n.occCells++;}
};
G.rel_=(a,b)=>G.rel[a*G.NN+b];
G.addRel=function(a,b,v,sym=true){const NN=G.NN;const t=G.techMod(N_(a));if(v>0)v*=1+t.diplo;G.rel[a*NN+b]=clamp(G.rel[a*NN+b]+v,-100,100);if(sym)G.rel[b*NN+a]=clamp(G.rel[b*NN+a]+v,-100,100);};
G.atWar=(a,b)=>N_(a).wars.has(b);
G.allied=(a,b)=>{ if(N_(a).allies.has(b)) return true; for(const c of N_(a).coal){ const co=G.coalitions[c]; if(co&&co.type==='askeri'&&co.members.has(b)) return true; } return false; };
G.alliesOf=function(a){ const s=new Set(N_(a).allies); for(const c of N_(a).coal){const co=G.coalitions[c];if(co&&co.type==='askeri')co.members.forEach(m=>{if(m!==a)s.add(m);});} N_(a).puppets.forEach(p=>s.add(p)); if(N_(a).overlord>=0)s.add(N_(a).overlord); return s; };

// ---------- WAR ----------
G.startWar=function(a,b,silent,reason){
  const A=N_(a),B=N_(b); if(a===b||!A.alive||!B.alive||A.wars.has(b)) return false;
  A.wars.add(b); B.wars.add(a); A.allies.delete(b); B.allies.delete(a); A.pacts.delete(b); B.pacts.delete(a); A.trade.delete(b); B.trade.delete(a);
  G.wars.push({a,b,start:G.day,accA:0,accB:0,casA:0,casB:0,capA:0,capB:0});
  A.warStart[b]=G.day; B.warStart[a]=G.day; A.lastWarDay=G.day; B.lastWarDay=G.day;
  G.addRel(a,b,-60); G.tension=clamp(G.tension+(B.cells>500||A.cells>500?6:2),0,100);
  if(!silent){ News.add('war',`${A.name}, ${B.name}'e savaş ilan etti`,reason||`${A.name} ordusu sınırı geçti. ${B.name} hükümeti genel seferberlik ilan ederken dünya başkentleri endişeli.`,'ev_war',[a,b]);
    G.emit('war',a,b); if(a===G.player||b===G.player) Sfx.play('war');
    // allies called
    G.callAllies(b,a); G.callAllies(a,b,true);
    // world reaction
    G.nations.forEach(n=>{ if(!n.alive||n.id===a||n.id===b) return; if(G.rel_(n.id,b)>50) G.addRel(n.id,a,-15,false); if(G.rel_(n.id,b)<-50) G.addRel(n.id,a,8,false); });
  }
  G.dirtyBorders(a); G.dirtyBorders(b);
  return true;
};
G.callAllies=function(def,att,offensive){
  const al=G.alliesOf(def);
  al.forEach(x=>{ const X=N_(x); if(!X.alive||X.wars.has(att)||x===att) return;
    if(G.allied(x,att)) return;
    if(x===G.player){ if(!offensive) UI.allyCall(def,att); return; }
    let ch=offensive?0.25:0.75; ch+= (G.rel_(x,def)-G.rel_(x,att))/400; if(X.wars.size>2) ch-=0.3; if(X.horde) ch=0;
    if(rnd()<ch){ G.startWar(x,att,true); News.add('war',`${X.name}, müttefiki ${N_(def).name} için savaşa girdi`,`${X.name} ittifak yükümlülüklerini yerine getirerek ${N_(att).name}'e karşı cephe açtı.`,'ev_war',[x,att]); if(att===G.player) UI.toast(`${X.name} size savaş ilan etti!`,'danger','crossed-swords'); }
    else if(!offensive){ G.addRel(x,def,-20); }
  });
};
G.endWar=function(a,b,type){
  const A=N_(a),B=N_(b); A.wars.delete(b); B.wars.delete(a);
  G.wars=G.wars.filter(w=>!((w.a===a&&w.b===b)||(w.a===b&&w.b===a)));
  G.truces[Math.min(a,b)+'_'+Math.max(a,b)]=G.day+365;
  if(type==='white'){ for(let i=0;i<M.N;i++){ const o=M.owner[i],c=M.core[i]; if((o===a&&c===b)||(o===b&&c===a)){ G.setOwner(i,c,true); } } }
  if(type==='annex'){ for(let i=0;i<M.N;i++){ if(M.owner[i]===b){ G.setOwner(i,a,true); } } }
  G.dirtyBorders(a); G.dirtyBorders(b); G.addRel(a,b,20);
};
G.truce=(a,b)=>(G.truces[Math.min(a,b)+'_'+Math.max(a,b)]||0)>G.day;
G.setOwner=function(i,id,quiet){
  const old=M.owner[i]; if(old===id) return; M.owner[i]=id; const O=N_(old),Nn=N_(id); O.cells--; Nn.cells++;
  if(M.core[i]===id){ M.integ[i]=1; } else M.integ[i]=0;
  M.unrest[i]=M.core[i]===id?0:0.3;
  Render.cellChanged(i);
  if(i===O.capital){ G.capitalLost(old,id); }
  const cs=M.cityByCell[i]; if(cs&&!quiet&&(id===G.player||old===G.player)){ const c=CITIES[cs[0]]; if(c[4]>300000||c[5]) UI.toast(id===G.player?`${c[0]} ele geçirildi`:`${c[0]} düştü!`, id===G.player?'ok':'danger','flag-objective'); }
  if(O.cells<=0) G.destroyNation(old,id);
  if(id===G.player&&!quiet){ G.stats.captured++; G.unlock('a_first'); } if(old===G.player&&!quiet) G.stats.lost++;
};
G.capitalLost=function(id,by){
  const n=N_(id); let best=-1,bp=-1;
  for(let i=0;i<M.N;i++) if(M.owner[i]===id){ const cs=M.cityByCell[i]; const p=cs?CITIES[cs[0]][4]:M.cPop[i]*0.01; if(p>bp){bp=p;best=i;} }
  n.capital=best; n.morale=Math.max(0.5,n.morale-0.15); n.stability=Math.max(0,n.stability-15); n.approval=Math.max(0,n.approval-8);
  if(by!=null&&N_(by)) { News.add('war',`${n.name}'in başkenti ${N_(by).name} kontrolüne geçti`,`Başkentin düşüşü ${n.name} yönetimini ${best>=0?'yeni bir merkeze taşınmaya':'çöküşe'} zorladı. Askerlerin morali dibe vurdu.`,'ev_war',[id,by]); if(by===G.player) G.unlock('a_capital'); if(id===G.player) UI.toast('Başkentimiz düştü! Hükümet yeni şehre taşındı.','danger','castle-ruins'); }
};
G.destroyNation=function(id,by){
  const n=N_(id); if(!n.alive) return; n.alive=false;
  [...n.wars].forEach(w=>{N_(w).wars.delete(id);}); n.wars.clear(); G.wars=G.wars.filter(w=>w.a!==id&&w.b!==id);
  n.allies.forEach(a=>N_(a).allies.delete(id)); n.coal.forEach(c=>{const co=G.coalitions[c];if(co)co.members.delete(id);});
  n.puppets.forEach(p=>N_(p).overlord=-1); if(n.overlord>=0)N_(n.overlord).puppets.delete(id);
  News.add('war',`${n.name} haritadan silindi`,`${by!=null?N_(by).name+' orduları':'Savaş'} son direniş noktalarını da düşürdü. ${n.name} artık bağımsız bir devlet değil.`,'ev_war',[id,by]);
  if(by===G.player){ G.stats.destroyed++; G.unlock('a_annex'); if(G.stats.destroyed>=5) G.unlock('a_five'); }
  if(id===G.player) UI.gameOver(false);
  G.emit('destroyed',id);
};

// fronts: compute border cells for all nations each day (cached)
G.updateBorders=function(full){
  // build list: for each war pair, front cells
  const fr={}; // key a_b -> {a:[cells of a touching b], b:[...]} 
  for(let i=0;i<M.N;i++){ const o=M.owner[i]; const W=N_(o).wars; if(!W.size) continue;
    for(let k=0;k<6;k++){ const j=M.nb[i*6+k]; if(j<0) continue; const p=M.owner[j]; if(p!==o && W.has(p)){ const key=o+'_'+p; (fr[key]=fr[key]||new Set()).add(i); } } }
  G.fronts=fr; G._frontDirty=false;
};
G.dirtyBorders=function(id){ G._frontDirty=true; Render.nationBordersDirty(id); };
G.frontLen=function(a){ let s=0; N_(a).wars.forEach(b=>{const f=G.fronts[a+'_'+b];if(f)s+=f.size*(N_(a).priority[b]||1);}); return s; };

G.combatDay=function(){
  if(G._frontDirty) G.updateBorders();
  const captures=[];
  for(const w of G.wars){
    const A=N_(w.a),B=N_(w.b); if(!A.alive||!B.alive) continue;
    const fa=G.fronts[w.a+'_'+w.b], fb=G.fronts[w.b+'_'+w.a];
    if(!fa||!fb||!fa.size){ w.contact=false; continue; } w.contact=true;
    const LA=G.frontLen(w.a)||1, LB=G.frontLen(w.b)||1;
    const shA=fa.size*(A.priority[w.b]||1)/LA, shB=fb.size*(B.priority[w.a]||1)/LB;
    const pA=G.power(A)*shA, pB=G.power(B)*shB; w.pA=pA; w.pB=pB;
    const tA=G.techMod(A), tB=G.techMod(B);
    const dA=(1.12+tA.def+A.bld.kale*0.04+(A.policies.has('p_wall')?0.1:0)), dB=(1.12+tB.def+B.bld.kale*0.04+(B.policies.has('p_wall')?0.1:0));
    // A attacks B
    const diffMul=(id)=>id===G.player?[1.25,1,0.85,0.7][G.settings.difficulty]:1;
    const rA=(pA*diffMul(w.a))/(pA*diffMul(w.a)+pB*dB*diffMul(w.b)+1), rB=(pB*diffMul(w.b))/(pB*diffMul(w.b)+pA*dA*diffMul(w.a)+1);
    w.ratio=rA;
    const spd=0.09;
    const len=Math.min(fa.size,fb.size);
    if(rA>0.5) w.accA+=Math.sqrt(len)*spd*(rA-0.5)*4*(A.horde?1.4:1);
    if(rB>0.5) w.accB+=Math.sqrt(len)*spd*(rB-0.5)*4*(B.horde?1.4:1);
    // casualties (power units)
    const eng=Math.min(pA,pB)*0.0035+Math.max(pA,pB)*0.0006;
    const lossA=eng*(1.4-rA), lossB=eng*(0.4+rA);
    G.applyLosses(A,lossA,G.power(A)); G.applyLosses(B,lossB,G.power(B));
    w.casA+=lossA; w.casB+=lossB; A.killed+=lossB; B.killed+=lossA; A.lost+=lossA; B.lost+=lossB;
    if(w.a===G.player){G.stats.killed+=lossB;G.stats.casualties+=lossA;} if(w.b===G.player){G.stats.killed+=lossA;G.stats.casualties+=lossB;}
    A.weary+=lossA/Math.max(1,A.pop)*600*(GD.GOVS[A.gov].warWeariness)*(1-tA.weary); B.weary+=lossB/Math.max(1,B.pop)*600*(GD.GOVS[B.gov].warWeariness)*(1-tB.weary);
    while(w.accA>=1){ w.accA-=1; captures.push([w.a,w.b]); }
    while(w.accB>=1){ w.accB-=1; captures.push([w.b,w.a]); }
  }
  for(const [a,b] of captures){ if(N_(a).alive&&N_(b).alive) G.captureOne(a,b); }
};
G.applyLosses=function(n,loss,total){ if(total<=0) return; const f=clamp(loss/total,0,0.05); const u=n.u;
  u.piyade=Math.max(0,u.piyade*(1-f)); u.tank=Math.max(0,u.tank*(1-f*1.1)); u.topcu=Math.max(0,u.topcu*(1-f*0.8)); u.ucak=Math.max(0,u.ucak*(1-f*0.5)); u.heli=Math.max(0,u.heli*(1-f*0.9)); u.drone=Math.max(0,u.drone*(1-f*1.2)); };
G.captureOne=function(a,b){
  const fr=G.fronts[b+'_'+a]; if(!fr||!fr.size) return;
  const A=N_(a); let tgt=A.target&&A.target.enemy===b?A.target:null;
  if(!tgt && A.id!==G.player){ const B=N_(b); if(B.capital>=0) tgt={x:M.x[B.capital],y:M.y[B.capital]}; }
  let best=-1,bs=-1e9; let cnt=0;
  for(const c of fr){ cnt++; if(cnt>400&&best>=0&&rnd()<0.7) continue; let s=rnd()*3; let na=0; for(let k=0;k<6;k++){const j=M.nb[c*6+k]; if(j>=0&&M.owner[j]===a) na++;} s+=na*1.6; if(tgt){ const d=Math.hypot(M.x[c]-tgt.x,M.y[c]-tgt.y); s-=d*0.02*(A.id===G.player?2.2:1); } if(M.cityByCell[c]) s+=0.5; if(s>bs){bs=s;best=c;} }
  if(best<0) return;
  G.setOwner(best,a); fr.delete(best); Render.captureFx(best,a,b);
  // update front sets locally
  const fa=(G.fronts[a+'_'+b]=G.fronts[a+'_'+b]||new Set()); fa.add(best);
  for(let k=0;k<6;k++){ const j=M.nb[best*6+k]; if(j<0) continue; const o=M.owner[j];
    if(o===b){ fr.add(j); // check pocket single cell
      let hasB=false; for(let q=0;q<6;q++){const z=M.nb[j*6+q]; if(z>=0&&M.owner[z]===b){hasB=true;break;}} if(!hasB&&!M.coast[j]&&N_(b).cells>1){ G.setOwner(j,a); fr.delete(j); Render.captureFx(j,a,b); } }
    else if(N_(a).wars.has(o)){ (G.fronts[o+'_'+a]=G.fronts[o+'_'+a]||new Set()).add(j); (G.fronts[a+'_'+o]=G.fronts[a+'_'+o]||new Set()).add(best); }
  }
  G._frontDirty=true; G._frontAge=(G._frontAge||0)+1;
};
G.navalInvasion=function(a,cell,cb){
  const A=N_(a); const b=M.owner[cell]; if(!A.wars.has(b)) return {ok:false,msg:'Bu ülkeyle savaşta değilsiniz.'};
  if(!M.coast[cell]) return {ok:false,msg:'Çıkarma için kıyı bölgesi seçmelisiniz.'};
  const nav=G.navy(A), en=G.navy(N_(b)); if(A.u.gemi<2) return {ok:false,msg:'En az 2 fırkateyn gerekir.'};
  if((A.cooldown.naval||0)>G.day) return {ok:false,msg:'Donanma hazırlanıyor ('+(A.cooldown.naval-G.day)+' gün).'};
  // origin: nearest own coastal cell
  let o=-1,bd=1e12; for(let i=0;i<M.N;i++) if(M.owner[i]===a&&M.coast[i]){const d=(M.x[i]-M.x[cell])**2+(M.y[i]-M.y[cell])**2;if(d<bd){bd=d;o=i;}}
  if(o<0) return {ok:false,msg:'Kıyınız yok.'};
  const dist=Math.sqrt(bd); const days=Math.max(2,Math.round(dist/60));
  const cost=Math.round(dist*0.6*(1-G.techMod(A).navy*0.6)); if(A.money<cost) return {ok:false,msg:'Yetersiz hazine: '+fmtM(cost)};
  A.money-=cost; A.cooldown.naval=G.day+days+20;
  const success=nav/(nav+en*0.6+1);
  Render.ship(o,cell,days,A.id);
  G.schedule(days,()=>{ if(!N_(a).alive||!A.wars.has(M.owner[cell])) return; const bb=M.owner[cell];
    if(rnd()<success+0.25){ G.setOwner(cell,a); let k=0; for(let q=0;q<6;q++){const j=M.nb[cell*6+q]; if(j>=0&&M.owner[j]===bb&&k<3){G.setOwner(j,a);k++;}} Render.captureFx(cell,a,bb); G._frontDirty=true;
      A.u.gemi=Math.max(0,A.u.gemi-Math.round(A.u.gemi*0.03)); if(a===G.player){G.unlock('a_naval'); UI.toast('Çıkarma başarılı! Sahil başı kuruldu.','ok','anchor');}
      News.add('war',`${A.name} ${N_(bb).name} kıyılarına çıkarma yaptı`,`Amfibi harekatla sahil başı kuruldu. Çatışmalar kıyı şeridinde yoğunlaşıyor.`,'ev_war',[a,bb]); }
    else { A.u.gemi=Math.max(0,Math.round(A.u.gemi*0.85)); A.u.piyade*=0.97; if(a===G.player) UI.toast('Çıkarma püskürtüldü! Donanma kayıp verdi.','danger','sinking-ship'); News.add('war',`${A.name}'in çıkarma girişimi püskürtüldü`,`${N_(bb).name} kıyı savunması çıkarma filosuna ağır kayıplar verdirdi.`,'ev_war',[a,bb]); }
  });
  return {ok:true,days,cost};
};
G.queue=[]; G.schedule=(d,f)=>G.queue.push({at:G.day+d,f});
G.strike=function(a,cell,kind){ // kind: air | missile | nuke
  const A=N_(a), b=M.owner[cell], B=N_(b); if(!A.wars.has(b)) return {ok:false,msg:'Savaşta olmadığınız ülkeye saldıramazsınız.'};
  const tA=G.techMod(A), tB=G.techMod(B);
  if(kind==='air'){ if(A.u.ucak<10&&A.u.drone<20) return {ok:false,msg:'Yetersiz hava gücü (10 uçak veya 20 SİHA).'}; if((A.cooldown.air||0)>G.day) return {ok:false,msg:'Filo yeniden hazırlanıyor.'};
    A.cooldown.air=G.day+6; const pw=(A.u.ucak*320*(1+tA.air)+A.u.drone*95)*0.035*(1+tA.strike); const shield=1/(1+B.u.hs*0.01+B.u.ucak*0.002); const dmg=pw*shield;
    Render.jet(A.capital,cell,a); G.schedule(1,()=>{G.applyLosses(B,dmg,G.power(B)); A.u.ucak*=0.985; A.u.drone*=0.97; Render.boom(cell,1.2); if(a===G.player) UI.toast(`Hava saldırısı: düşman gücü -${fmt(dmg)}`,'ok','jet-fighter');});
    return {ok:true}; }
  if(kind==='missile'){ const n=Math.min(A.u.fuze,10); if(n<1) return {ok:false,msg:'Füze stoğunuz yok.'}; A.u.fuze-=n;
    const dmg=n*900*(1+tA.strike)*(1-(tB.mshield||0)*(A.techs.has('t_hyper')?0.3:1))/(1+B.u.hs*0.004);
    Render.missile(A.capital,cell,a,n); G.schedule(1,()=>{G.applyLosses(B,dmg,G.power(B)); B.econ*=0.998; Render.boom(cell,1.6); if(a===G.player) UI.toast(`${n} füze hedefi vurdu: düşman gücü -${fmt(dmg)}`,'ok','missile-pod');});
    return {ok:true}; }
  if(kind==='nuke'){ if(A.u.nukleer<1) return {ok:false,msg:'Nükleer başlığınız yok.'}; A.u.nukleer-=1; A.nukesUsed++;
    Render.missile(A.capital,cell,a,1,true);
    G.schedule(2,()=>{ Render.nuke(cell); const cs=[cell]; const seen=new Set(cs); for(let r=0;r<4;r++){ const nx=[]; cs.forEach(c=>{for(let k=0;k<6;k++){const j=M.nb[c*6+k];if(j>=0&&!seen.has(j)){seen.add(j);nx.push(j);}}}); cs.push(...nx); }
      seen.forEach(c=>{M.rad[c]=Math.min(1,M.rad[c]+0.9);Render.cellChanged(c);}); G.radCells.push(...seen);
      G.applyLosses(B,G.power(B)*0.25,G.power(B)); B.pop*=0.97; B.econ*=0.9; B.stability-=20; G.tension=100;
      G.nations.forEach(n=>{ if(n.alive&&n.id!==a) G.addRel(n.id,a,-45,false); });
      const city=M.cityByCell[cell]?CITIES[M.cityByCell[cell][0]][0]:B.name;
      News.add('nuke',`NÜKLEER SALDIRI: ${A.name}, ${city}'i vurdu`,`İnsanlık tarihinin karanlık günü. ${city} üzerinde mantar bulutu yükseldi. Dünya liderleri ${A.name}'i lanetliyor; radyasyon bölgeyi yaşanmaz kıldı.`,'ev_nuke',[a,b]);
      if(a===G.player) G.unlock('a_nuke');
      // retaliation
      if(B.u.nukleer>0 && b!==G.player && rnd()<0.8){ G.schedule(3,()=>{ if(N_(b).alive&&A.alive&&A.capital>=0){ G.strike(b,A.capital,'nuke'); } }); }
      recount(); });
    return {ok:true}; }
};
function recount(){ G.recount(); }

// ---------- ECONOMY / DAILY ----------
G.dailyEcon=function(n){
  const t=G.techMod(n), gv=GD.GOVS[n.gov];
  n.gdp=n.gdpBase*n.econ*G.eraScale; n.pop=n.popBase*(G.scenario.era?Math.max(0.05,G.eraScale*3):1)*(n.popMul||1);
  const peace=n.wars.size===0;
  let incMul=1+t.inc+n.bld.fabrika*0.012+n.bld.santral*0.02+(peace&&n.policies.has('p_tour')?0.04:0)-(n.policies.has('p_tour')&&!peace?0.04:0);
  const trade=n.trade.size*0.012*(1+t.trade)*(1+n.bld.liman*0.08);
  const sancPen=Math.min(0.4,[...G.nations].reduce((s,x)=>s+(x.alive&&x.sanc.has(n.id)?Math.min(0.08,x.gdp/Math.max(1,n.gdp)*0.02):0),0))*(1-t.sanction);
  const taxEff=0.07*(n.tax/0.2)*(1+gv.tax*3);
  const oilInc=n.oil*G.oilPrice*0.5*(1+n.bld.rafineri*0.15)*(G.scenario.era?0.2:1);
  n.income=n.gdp*1000/365*taxEff*(incMul+trade-sancPen)+oilInc;
  const cf=G.costFactor(n), u=n.u;
  let up=0; for(const k in GD.UNITS) up+=u[k]*GD.UNITS[k].up; up*=Math.max(0.12,cf)*0.5*(1-t.upkeep); if(n.policies.has('p_merc')) up*=1.25; if(G.scenario.era&&G.scenario.era<1800) up*=0.3;
  const bldUp=Object.keys(n.bld).reduce((s,k)=>s+n.bld[k]*GD.BUILDINGS[k].cost*0.0004,0);
  const debtInt=n.debt*0.00018*(1-t.debt);
  n.expense=up+bldUp+debtInt; n.upkeep=up;
  n.net=n.income-n.expense; n.money+=n.net;
  if(n.money<0){ if(n.id===G.player){ n.approval-=0.15; n.stability-=0.1; if(G.day%15===0) UI.toast('Hazine eksiye düştü! Ordu maaşları ödenemiyor.','danger','wallet'); } const f=0.004; for(const k in u) if(k!=='nukleer') u[k]*=(1-f); }
  // growth (yearly growth applied daily)
  let g=0.022+(n.bld.fabrika*0.0015)+(peace?0.005:-0.01*Math.min(3,n.wars.size))-(n.tax-0.2)*0.05-(n.inflation-3)*0.002-sancPen*0.1+(n.policies.has('p_free')?0.006:0);
  n.growth=g; n.econ*=1+g/365; n.econ=clamp(n.econ,0.2,6);
  n.inflation+= (3-n.inflation)*0.003;
  // manpower
  n.mpMax=Math.round(n.pop*0.02*(1+t.mp+(n.bld.kisla*0.05))*(1+gv.recruit));
  n.manpower=Math.min(n.mpMax,n.manpower+n.mpMax*0.0012*(1+n.bld.kisla*0.05));
  // research
  if(!G.scenario.era||G.scenario.era>=1900){ n.rp=Math.sqrt(Math.max(1,n.gdp))*0.055*(1+t.res+gv.research+n.bld.universite*0.06)*(n.id===G.player?[1.3,1,0.9,0.8][G.settings.difficulty]:1); }
  else n.rp=Math.sqrt(Math.max(1,n.gdp*50))*0.02*(1+n.bld.universite*0.06);
  n.research+=n.rp;
  if(n.researching){ const tt=GD.TECHS.find(x=>x[0]===n.researching); const c=G.techCost(n,tt); if(n.research>=c){ n.research-=c; n.techs.add(tt[0]); n._tm=null; if(n.id===G.player){ UI.toast(`Araştırma tamamlandı: ${tt[1]}`,'ok',tt[5]); Sfx.play('tech'); News.add('tech',`${n.name} bilim dünyasında: ${tt[1]} geliştirildi`,`${n.name} araştırmacıları ${tt[1]} projesini başarıyla tamamladı. ${tt[6]}.`,'ev_tech',[n.id]); if(n.techs.size>=10)G.unlock('a_tech10'); if(n.techs.size>=30)G.unlock('a_tech30'); if(tt[0]==='s_mars'){G.unlock('a_mars'); UI.gameOver(true,'Bilim Zaferi: Mars\'ta ilk koloni kuruldu!');} } n.researching=null; if(n.id!==G.player||n.autoResearch) G.aiPickTech(n); } }
  // morale/approval/stability
  n.weary=Math.max(0,n.weary*0.997-(peace?0.05:0));
  const unpop=n.unpopAlly||0;
  let appT=55+gv.approvalBase+(t.appr||0)+n.bld.hastane*0.5+n.bld.medya*0.35-(n.tax-0.2)*90-n.weary*1.2-unpop+g*250+n.appMod-(n.money<0?10:0)-(n.inflation-3)*1.2+(n.cells<n.startCells*0.6?-10:0)+(n.cells>n.startCells*1.3?6:0);
  if(n.horde) appT=100;
  n.approval+=(clamp(appT,0,100)-n.approval)*0.02; n.approval=clamp(n.approval,0,100);
  let stT=60+gv.stability+(t.stab||0)+(n.approval-50)*0.4-n.weary*0.5-n.occCells/Math.max(1,n.cells)*30*(1-(t.unrest||0))+n.stabMod;
  n.stability+=(clamp(stT,0,100)-n.stability)*0.02; n.stability=clamp(n.stability,0,100);
  n.appMod*=0.995; n.stabMod*=0.995;
  n.morale=clamp(0.7+n.stability/250+n.approval/400-n.weary/200,0.5,1.25)*(n.money<0?0.85:1);
  if(n.debt>0&&n.money>n.debt*0.2&&n.autoRepay){}
};
G.oilPrice=80;

G.tick=function(){
  G.day++;
  // scheduled
  if(G.queue.length){ const due=G.queue.filter(q=>q.at<=G.day); G.queue=G.queue.filter(q=>q.at>G.day); due.forEach(q=>{try{q.f();}catch(e){console.error(e);}}); }
  G.combatDay();
  const alive=G.nations.filter(n=>n.alive);
  for(const n of alive) G.dailyEcon(n);
  if(G.day%5===0) G.recount();
  for(const n of alive){ if(n.id!==G.player && G.day>=n.ai.next){ AI.think(n); n.ai.next=G.day+6+((rnd()*8)|0); } }
  if(G.player>=0 && N_(G.player).alive) Events.daily();
  Events.world();
  if(G.day%30===0){ G.monthly(); }
  if(G.day%7===0){ G.relDrift(); G.integrate(); }
  G.tension=clamp(G.tension+(G.wars.length*0.004)-0.05,0,100);
  G.oilPrice=clamp(G.oilPrice+(rnd()-0.5)*1.2+(G.tension-40)*0.004,35,180);
  if(G.day%10===0) G.checkWin();
  G.emit('tick');
};
G.monthly=function(){
  const P=N_(G.player);
  G.hist.push({d:G.day,gdp:P.gdp,army:G.power(P),cells:P.cells,appr:P.approval,money:P.money});
  if(G.hist.length>400) G.hist.shift();
  G.nations.forEach(n=>{ if(n.alive){ n.hist.push(n.cells); if(n.hist.length>60)n.hist.shift(); } });
  // rebellions in occupied lands
  G.rebellions();
  // pockets
  G.pockets();
  // UN resolution occasionally
  if(!G.un && rnd()<0.12 && G.wars.length) UN.propose();
  // elections
  if(P.gov==='demokrasi' && G.day%1460===0) Events.election();
  if(G.day>=3650) G.unlock('a_survive');
  if(P.money>=50000) G.unlock('a_rich'); if(P.u.piyade>=2e6) G.unlock('a_army'); if(P.approval>=90) G.unlock('a_popular');
  const share=P.cells/M.N; if(share>=0.05)G.unlock('a_10p'); if(share>=0.15)G.unlock('a_25p'); if(share>=0.35)G.unlock('a_50p');
};
G.relDrift=function(){ const NN=G.NN; for(let i=0;i<G.rel.length;i++){ G.rel[i]+=(G.relBase[i]-G.rel[i])*0.01; }
  // propaganda tech
  const P=N_(G.player); if(P&&G.techMod(P).prop) G.nations.forEach(n=>{if(n.alive&&n.id!==P.id)G.addRel(n.id,P.id,0.4,false);});
  if(P&&P.policies.has('p_isolation')) G.nations.forEach(n=>{if(n.alive&&n.id!==P.id)G.addRel(n.id,P.id,-0.2,false);});
};
G.integrate=function(){
  for(let i=0;i<M.N;i++){ const o=M.owner[i], c=M.core[i]; if(o===c){ if(M.rad[i]>0){M.rad[i]=Math.max(0,M.rad[i]-0.002);} continue; }
    const O=N_(o); if(O.wars.has(c)&&N_(c).alive) continue; const t=G.techMod(O);
    M.integ[i]+=7/(900*(1-(t.unrest||0)*0.5)); if(M.integ[i]>=1){ M.core[i]=o; M.integ[i]=1; Render.cellChanged(i); } }
};
G.rebellions=function(){
  for(const n of G.nations){ if(!n.alive||n.occCells<3||n.horde) continue; const t=G.techMod(n);
    const risk=(n.occCells/Math.max(1,n.cells))*(1-(n.stability/100))*0.35*(1-(t.unrest||0))*(n.policies.has('p_martial')?0.4:1);
    if(rnd()<risk){ // pick an occupied cell with low integration
      let seed=-1; for(let k=0;k<40;k++){const i=(rnd()*M.N)|0; if(M.owner[i]===n.id&&M.core[i]!==n.id&&M.integ[i]<0.7){seed=i;break;}}
      if(seed<0) continue; const coreId=M.core[seed]; const C=N_(coreId);
      const cluster=[seed]; const seen=new Set(cluster); for(let q=0;q<cluster.length&&cluster.length<14;q++){const c=cluster[q];for(let k=0;k<6;k++){const j=M.nb[c*6+k];if(j>=0&&!seen.has(j)&&M.owner[j]===n.id&&M.core[j]===coreId){seen.add(j);cluster.push(j);}}}
      const revive=!C.alive; cluster.forEach(c=>G.setOwner(c,coreId,true));
      if(revive){ C.alive=true; C.u.piyade=Math.round(n.u.piyade*0.04+5000); C.u.tank=10; C.money=300; C.approval=80; C.stability=50; C.capital=seed; C.morale=1.1; C.color=C.color||nationColor(C); }
      G.startWar(coreId,n.id,true); G._frontDirty=true;
      const city=M.cityByCell[seed]?CITIES[M.cityByCell[seed][0]][0]:'işgal bölgesi';
      News.add('unrest',`${city}'de ayaklanma: ${C.name} direnişçileri kontrolü ele aldı`,`İşgal altındaki ${city} çevresinde silahlı direniş ${n.name} güçlerini geri püskürttü.${revive?' '+C.name+' yeniden bağımsızlık ilan etti.':''}`,'ev_protest',[n.id,coreId]);
      if(n.id===G.player) UI.toast(`${city}'de isyan! ${C.name} direnişi ${cluster.length} bölgeyi aldı.`,'danger','fist');
    } }
};
G.pockets=function(){
  for(const w of G.wars){ for(const [a,b] of [[w.a,w.b],[w.b,w.a]]){ const B=N_(b); if(!B.alive||B.capital<0) continue;
    // BFS from capital over B cells; cells not reached that are surrounded by A => surrender gradually
    if(B.cells>4000) continue;
    const reach=new Uint8Array(M.N); const q=[B.capital]; reach[B.capital]=1;
    while(q.length){const c=q.pop();for(let k=0;k<6;k++){const j=M.nb[c*6+k];if(j>=0&&!reach[j]&&M.owner[j]===b){reach[j]=1;q.push(j);}}}
    let n=0; for(let i=0;i<M.N&&n<30;i++){ if(M.owner[i]===b&&!reach[i]){ let touchA=false,coast=M.coast[i]; for(let k=0;k<6;k++){const j=M.nb[i*6+k];if(j>=0&&M.owner[j]===a)touchA=true;} if(touchA&&!coast&&rnd()<0.5){G.setOwner(i,a);n++;} } }
    if(n) G._frontDirty=true; } }
};
G.checkWin=function(){
  const P=N_(G.player); if(!P||!P.alive) return;
  const share=P.cells/M.N*100; const goal=G.opts.winShare||60;
  if(share>=goal && !G._won){ G._won=true; UI.gameOver(true,`Dünya Hakimiyeti: Karaların %${share.toFixed(0)}'i bayrağınız altında!`); }
  if(G.opts.surviveYears && G.day>=G.opts.surviveYears*365 && !G._won){ G._won=true; UI.gameOver(true,`${G.opts.surviveYears} yıl boyunca ayakta kaldınız!`); }
  const others=G.nations.filter(n=>n.alive&&n.id!==G.player&&!P.puppets.has(n.id)&&!P.allies.has(n.id));
  if(G.scenario.hordeWar && !N_(G.byCode[G.scenario.hordeWar]).alive && !G._won){ G._won=true; UI.gameOver(true,'İnsanlık kurtuldu! Tehdit tamamen yok edildi.'); }
  if(!others.length && !G._won){ G._won=true; UI.gameOver(true,'Son ayakta kalan sizsiniz!'); }
};
G.unlock=function(id){ if(G.achievements.has(id)) return; G.achievements.add(id); const a=GD.ACHIEVEMENTS.find(x=>x[0]===id); if(a){ UI.achievement(a); } };

// ---------- PLAYER ACTIONS ----------
const Act={};
Act.recruit=function(k,times=1){ const P=N_(G.player),U=GD.UNITS[k]; if(U.req&&!P.techs.has(U.req)) return UI.toast('Önce gerekli teknolojiyi araştırın.','warn','padlock');
  const cost=G.unitCost(P,k)*times, mp=U.mp*times; if(P.money<cost) return UI.toast('Yetersiz hazine: '+fmtM(cost)+' gerekli','danger','wallet'); if(P.manpower<mp) return UI.toast('Yetersiz insan gücü','danger','person');
  P.money-=cost; P.manpower-=mp; G.schedule(k==='piyade'?7:k==='gemi'||k==='denizalti'?40:k==='nukleer'?60:15,()=>{P.u[k]+=U.batch*times; UI.toast(`${U.n} hizmete girdi (+${fmt(U.batch*times)} ${U.unit})`,'ok',U.icon);});
  UI.toast(`${U.n} eğitimi başladı`,'info',U.icon); Sfx.play('click'); UI.refresh(); };
Act.build=function(k){ const P=N_(G.player),B=GD.BUILDINGS[k]; if(P.bld[k]>=B.max) return UI.toast('Maksimum seviyeye ulaşıldı','warn','padlock'); const c=G.bldCost(P,k); if(P.money<c) return UI.toast('Yetersiz hazine: '+fmtM(c),'danger','wallet'); P.money-=c; UI.toast(`${B.n} inşaatı başladı (30 gün)`,'info',B.icon); G.schedule(30,()=>{P.bld[k]++;UI.toast(`${B.n} tamamlandı`,'ok',B.icon);}); UI.refresh(); };
Act.research=function(id){ const P=N_(G.player); P.researching=id; UI.toast('Araştırma başladı: '+GD.TECHS.find(t=>t[0]===id)[1],'info','test-tubes'); UI.refresh(); };
Act.policy=function(id){ const P=N_(G.player); if(P.policies.has(id)){P.policies.delete(id);P.stabMod-=3;} else { if(P.policies.size>=8) return UI.toast('En fazla 8 politika aktif olabilir','warn','scales'); P.policies.add(id); P.stabMod-=2; if(id==='p_censor')G.nations.forEach(n=>{if(n.alive&&n.gov==='demokrasi')G.addRel(n.id,P.id,-5,false);}); }
  P._tm=null; UI.refresh(); };
Act.tax=v=>{N_(G.player).tax=v;};
Act.loan=function(){ const P=N_(G.player); const amt=Math.round(P.gdp*1000*0.02); if(P.debt>P.gdp*1000*0.5) return UI.toast('IMF yeni kredi vermeyi reddetti','danger','bank'); P.money+=amt; P.debt+=amt*1.15; P.appMod-=3; UI.toast(`IMF kredisi alındı: +${fmtM(amt)}`,'ok','bank'); News.add('eco',`${P.name} IMF ile ${fmtM(amt)} kredi anlaşması imzaladı`,'Muhalefet anlaşmanın ağır koşullarını eleştiriyor.','ev_economy',[P.id]); UI.refresh(); };
Act.repay=function(){ const P=N_(G.player); const amt=Math.min(P.debt,P.money); if(amt<=0) return; P.money-=amt; P.debt-=amt; UI.toast('Borç ödendi: '+fmtM(amt),'ok','pay-money'); UI.refresh(); };
Act.print=function(){ const P=N_(G.player); const amt=Math.round(P.gdp*1000*0.01); P.money+=amt; P.inflation+=4; P.econ*=0.985; P.appMod-=4; UI.toast(`Merkez bankası para bastı: +${fmtM(amt)} — enflasyon yükseliyor`,'warn','banknote'); News.add('eco',`${P.name}'de para basma kararı: Enflasyon alarmı`,'Ekonomistler fiyatların hızla yükseleceği uyarısında bulundu.','ev_economy',[P.id]); UI.refresh(); };
Act.declare=function(t){ const P=N_(G.player),T=N_(t); if(G.truce(P.id,t)) return UI.toast('Ateşkes anlaşması sürüyor','warn','peace-dove'); if(G.allied(P.id,t)){ P.allies.delete(t); T.allies.delete(P.id); for(const c of P.coal){const co=G.coalitions[c]; if(co&&co.members.has(t)){co.members.delete(P.id);P.coal.delete(c);UI.toast(co.name+' üyeliğiniz sona erdi','warn','broken-shield');}} }
  G.startWar(P.id,t,false); P.appMod+=(G.rel_(P.id,t)<-50?4:-6); UI.refresh(); };
Act.peace=function(t,type){ const P=N_(G.player),T=N_(t); const ws=G.warScore(P.id,t); let acc=0.5+ws/80-(T.aggr-0.5)*0.3+T.weary/40; if(type==='white') acc+=0.15; if(type==='annex') acc=(T.capital<0||T.cells<T.startCells*0.25)?0.9:ws>60?0.4:0.02; if(T.horde) acc=0;
  if(rnd()<acc){ G.endWar(P.id,t,type); G.stats.peaceCount++; G.unlock('a_peace'); UI.toast(`${T.name} barışı kabul etti`,'ok','peace-dove'); News.add('dip',`${P.name} ile ${T.name} arasında barış imzalandı`,type==='white'?'Taraflar savaş öncesi sınırlara döndü.':type==='annex'?`${T.name} tamamen ${P.name}'e ilhak edildi.`:'Mevcut cephe hatları yeni sınır olarak kabul edildi.','ev_diplomacy',[P.id,t]); return true; }
  UI.toast(`${T.name} barış teklifini reddetti`,'danger','thumb-down'); G.addRel(t,P.id,-3); return false; };
G.warScore=function(a,b){ const A=N_(a),B=N_(b); let occA=0,occB=0; for(let i=0;i<M.N;i++){ if(M.owner[i]===a&&M.core[i]===b) occA++; else if(M.owner[i]===b&&M.core[i]===a) occB++; }
  const w=G.wars.find(x=>(x.a===a&&x.b===b)||(x.a===b&&x.b===a)); const cas=w?(w.a===a?(w.casB-w.casA):(w.casA-w.casB)):0;
  return clamp((occA/Math.max(1,B.startCells)-occB/Math.max(1,A.startCells))*150+cas/Math.max(1,G.power(A)+G.power(B))*40,-100,100); };
Act.ally=function(t){ const P=N_(G.player),T=N_(t); const r=G.rel_(t,P.id); const pw=G.power(P)/Math.max(1,G.power(T)); let acc=(r-25)/60+Math.min(0.3,pw*0.1)-(T.wars.size&&![...T.wars].some(w=>P.wars.has(w))?0.1:0);
  if(rnd()<acc){ G.makeAlliance(P.id,t); UI.toast(`${T.name} ile ittifak kuruldu`,'ok','shaking-hands'); G.unlock('a_ally'); return true; } UI.toast(`${T.name} ittifak teklifini reddetti`,'danger','thumb-down'); G.addRel(t,P.id,-2); return false; };
G.makeAlliance=function(a,b){ const A=N_(a),B=N_(b); A.allies.add(b); B.allies.add(a); G.addRel(a,b,25);
  News.add('dip',`${A.name} ve ${B.name} askeri ittifak kurdu`,`İki ülke ortak savunma anlaşması imzaladı. Bölgedeki dengeler değişiyor.`,'ev_diplomacy',[a,b]);
  // rival reactions
  const NN=G.NN; let angered=[];
  G.nations.forEach(n=>{ if(!n.alive||n.id===a||n.id===b) return; const rb=G.rel[n.id*NN+b], ra=G.rel[n.id*NN+a];
    if(rb<-35){ const d=Math.min(55,-rb*0.6); G.addRel(n.id,a,-d,false); G.rel[a*NN+n.id]=clamp(G.rel[a*NN+n.id]-d*0.5,-100,100); angered.push(n); }
    if(ra<-35){ const d=Math.min(55,-ra*0.6); G.addRel(n.id,b,-d,false); } });
  // domestic reaction
  [a,b].forEach((x,i)=>{ const X=N_(x), Y=N_(i?a:b); let pen=0;
    const ry=G.nations.filter(n=>n.alive&&n.religion===X.religion&&n.id!==x&&n.id!==Y.id); const avg=ry.length?ry.reduce((s,n)=>s+G.rel_(n.id,Y.id),0)/ry.length:0;
    if(avg<-20) pen=Math.min(25,-avg*0.35); if(G.relBase[x*NN+Y.id]<-30) pen+=10;
    if(pen>3){ X.unpopAlly=(X.unpopAlly||0)+pen; X.appMod-=pen*0.5;
      if(x===G.player){ News.add('protest',`${X.capName||'Başkent'}'te ${Y.name} ittifakına karşı büyük protesto`,`On binlerce kişi "${Y.name} ile ittifaka hayır" sloganlarıyla meydanları doldurdu. Halk desteği sert düştü.`,'ev_protest',[x]); Render.pulseCity(X.capital,'protest'); UI.toast(`Halk ${Y.name} ittifakını protesto ediyor! Destek -${pen.toFixed(0)}`,'danger','shouting'); } } });
  if(a===G.player||b===G.player){ const hostile=angered.filter(n=>G.rel_(n.id,G.player)<-60).slice(0,6); if(hostile.length) UI.toast(`${hostile.map(n=>n.name).slice(0,4).join(', ')}${hostile.length>4?'...':''} bu ittifaka öfkeli`,'warn','angry');
    // hostile nations may declare
    hostile.forEach(n=>{ if(rnd()<0.25*G.scenario.aggr+0.1 && G.power(n)>G.power(N_(G.player))*0.5 && G.reach(n.id,G.player)) G.schedule(5+((rnd()*20)|0),()=>{ if(n.alive&&!n.wars.has(G.player)&&G.rel_(n.id,G.player)<-55) G.startWar(n.id,G.player,false,`${n.name}, ${N_(a===G.player?b:a).name} ile kurulan ittifakı gerekçe göstererek savaş ilan etti.`); }); }); }
};
G.reach=function(a,b){ if(!G.neigh) G.computeNeighbors(); if(G.neigh[a]?.has(b)) return true; return N_(a).coastal&&N_(b).coastal&&N_(a).u.gemi>=4; };
Act.breakAlly=function(t){ const P=N_(G.player); P.allies.delete(t); N_(t).allies.delete(P.id); G.addRel(t,P.id,-30); UI.toast('İttifak bozuldu','warn','broken-shield'); };
Act.trade=function(t){ const P=N_(G.player),T=N_(t); if(P.trade.has(t)){P.trade.delete(t);T.trade.delete(P.id);G.addRel(t,P.id,-10);return UI.toast('Ticaret anlaşması iptal edildi','warn','trade');} if(G.rel_(t,P.id)>-10&&rnd()<0.5+G.rel_(t,P.id)/100){P.trade.add(t);T.trade.add(P.id);G.addRel(t,P.id,8);UI.toast(`${T.name} ile ticaret anlaşması imzalandı`,'ok','trade');}else UI.toast(`${T.name} ticaret anlaşmasını reddetti`,'danger','thumb-down'); };
Act.pact=function(t){ const P=N_(G.player),T=N_(t); if(rnd()<0.4+G.rel_(t,P.id)/120+(G.power(P)>G.power(T)?0.2:0)){P.pacts.add(t);T.pacts.add(P.id);G.truces[Math.min(P.id,t)+'_'+Math.max(P.id,t)]=G.day+730;G.addRel(t,P.id,10);UI.toast(`${T.name} ile 2 yıllık saldırmazlık paktı`,'ok','contract');}else UI.toast('Pakt reddedildi','danger','thumb-down'); };
Act.aid=function(t){ const P=N_(G.player); const amt=Math.max(50,Math.round(P.income*10)); if(P.money<amt) return UI.toast('Yetersiz hazine','danger','wallet'); P.money-=amt; N_(t).money+=amt; G.addRel(t,P.id,Math.min(25,6+amt/Math.max(10,N_(t).income*3))); UI.toast(`${N_(t).name}'e ${fmtM(amt)} yardım gönderildi`,'ok','receive-money'); };
Act.sanction=function(t){ const P=N_(G.player); if(P.sanc.has(t)){P.sanc.delete(t);G.addRel(t,P.id,10);return UI.toast('Yaptırımlar kaldırıldı','info','scales');} P.sanc.add(t); P.trade.delete(t); N_(t).trade.delete(P.id); G.addRel(t,P.id,-25); UI.toast(`${N_(t).name}'e ekonomik yaptırım uygulandı`,'warn','scales'); News.add('dip',`${P.name}'den ${N_(t).name}'e yaptırım`,'Ekonomik yaptırım paketi ticaret ve finans sektörlerini hedef alıyor.','ev_economy',[P.id,t]); };
Act.insult=function(t){ const P=N_(G.player); G.addRel(t,P.id,-15); P.appMod+=G.rel_(P.id,t)<-30?2:-1; UI.toast(`${N_(t).name} kınandı`,'info','megaphone'); News.add('dip',`${P.name} liderinden ${N_(t).name}'e sert sözler`,'Diplomatik gerilim tırmanıyor, büyükelçiler dışişlerine çağrıldı.','ev_diplomacy',[P.id,t]); };
Act.guarantee=function(t){ const P=N_(G.player); if(P.guarantees.has(t)){P.guarantees.delete(t);return UI.toast('Garanti geri çekildi','info','shield');} P.guarantees.add(t); G.addRel(t,P.id,15); UI.toast(`${N_(t).name}'in bağımsızlığı garanti altına alındı`,'ok','shield'); };
Act.vassal=function(t){ const P=N_(G.player),T=N_(t); const ratio=G.power(P)/Math.max(1,G.power(T)+[...G.alliesOf(t)].reduce((s,x)=>s+G.power(N_(x))*0.5,0)); const acc=(ratio-4)/8+G.rel_(t,P.id)/200;
  if(rnd()<acc){ P.puppets.add(t); T.overlord=P.id; T.allies.add(P.id); P.allies.add(t); G.unlock('a_vassal'); UI.toast(`${T.name} kukla devletiniz oldu`,'ok','chess-king'); News.add('dip',`${T.name}, ${P.name}'in himayesine girdi`,'Ülke dış politikasını ve ordusunu hamisine bağladı.','ev_diplomacy',[P.id,t]); } else { G.addRel(t,P.id,-25); UI.toast(`${T.name} talebinizi reddetti ve öfkeli`,'danger','thumb-down'); } };
Act.demand=function(t){ const P=N_(G.player),T=N_(t); const ratio=G.power(P)/Math.max(1,G.power(T)); let border=[]; for(let i=0;i<M.N;i++){ if(M.owner[i]===t){ for(let k=0;k<6;k++){const j=M.nb[i*6+k]; if(j>=0&&M.owner[j]===P.id){border.push(i);break;}} } }
  if(!border.length) return UI.toast('Ortak sınırınız yok','warn','treasure-map');
  if(rnd()<(ratio-3)/6){ border.slice(0,Math.max(1,Math.round(border.length*0.4))).forEach(c=>G.setOwner(c,P.id,true)); G.addRel(t,P.id,-40); P.appMod+=5; G._frontDirty=true; UI.toast(`${T.name} sınır bölgelerini teslim etti!`,'ok','treasure-map'); News.add('dip',`${T.name} baskı karşısında geri adım attı`,`${P.name}'in ültimatomu sonrası sınır bölgeleri el değiştirdi.`,'ev_diplomacy',[P.id,t]); }
  else { G.addRel(t,P.id,-30); UI.toast(`${T.name} ültimatomu reddetti`,'danger','thumb-down'); if(rnd()<0.3) G.startWar(t,P.id,false,`${T.name}, ${P.name}'in toprak talebine savaşla karşılık verdi.`); } };
Act.release=function(t){ // liberate occupied core nation
  const P=N_(G.player),T=N_(t); let n=0; for(let i=0;i<M.N;i++) if(M.owner[i]===P.id&&M.core[i]===t){G.setOwner(i,t,true);n++;}
  if(!n) return; if(!T.alive){T.alive=true;T.u.piyade=20000;T.money=500;T.approval=70;T.stability=50;T.color=T.color||nationColor(T);for(let i=0;i<M.N;i++)if(M.owner[i]===t){T.capital=i;break;}}
  T.overlord=P.id; P.puppets.add(t); T.allies.add(P.id); P.allies.add(t); G.addRel(t,P.id,60); G._frontDirty=true; UI.toast(`${T.name} kukla devlet olarak serbest bırakıldı`,'ok','dove'); };
Act.spy=function(t,op){ const P=N_(G.player),T=N_(t); const o=GD.SPY_OPS.find(x=>x[0]===op); if(o[6]&&!P.techs.has(o[6])) return UI.toast('Gerekli teknoloji: Siber Ordu','warn','padlock');
  const cost=o[3]; if(P.money<cost) return UI.toast('Yetersiz hazine','danger','wallet'); if((P.cooldown['spy'+t]||0)>G.day) return UI.toast('Ajan ağı yeniden kuruluyor','warn','hourglass');
  P.money-=cost; P.cooldown['spy'+t]=G.day+10;
  const tP=G.techMod(P), tT=G.techMod(T); const ch=clamp(o[4]+tP.spy+P.bld.istihbarat*0.06-(tT.counter||0)-T.bld.istihbarat*0.04,0.05,0.95);
  if(rnd()<ch){ G.stats.spyOk++; if(G.stats.spyOk>=5) G.unlock('a_spy');
    if(op==='o_intel'){ P.intel.add(t); P.research+=Math.min(60,T.rp*8); UI.toast(`Casusluk başarılı: ${T.name} sırları ele geçirildi`,'ok','binoculars'); }
    if(op==='o_sabot'){ G.applyLosses(T,G.power(T)*0.05,G.power(T)); T.econ*=0.99; UI.toast('Sabotaj başarılı','ok','explosion-rays'); News.add('unrest',`${T.name}'de gizemli patlamalar`,'Askeri depolarda çıkan yangınların sabotaj olduğu düşünülüyor.','ev_terror',[t]); }
    if(op==='o_cyber'){ const s=Math.min(T.money*0.15,2000); T.money-=s; P.money+=s*0.6; T.research*=0.8; UI.toast(`Siber saldırı: ${fmtM(s*0.6)} ele geçirildi`,'ok','cyber-eye'); News.add('tech',`${T.name} devasa siber saldırıyla sarsıldı`,'Bankacılık sistemleri saatlerce çöktü.','ev_tech',[t]); }
    if(op==='o_unrest'){ T.stability-=15; T.approval-=12; UI.toast(`${T.name}'de karışıklık çıkarıldı`,'ok','fist'); News.add('protest',`${T.name}'de sokaklar karıştı`,'Hükümet karşıtı gösteriler şiddete dönüştü.','ev_protest',[t]); }
    if(op==='o_elect'){ G.addRel(t,P.id,30); UI.toast(`${T.name}'de size dost aday kazandı`,'ok','vote'); }
    if(op==='o_coup'){ if(T.stability>55&&rnd()<0.5){ UI.toast('Darbe girişimi bastırıldı ama izler gizlendi','warn','hood'); } else { T.gov=P.gov; G.relBase[t*G.NN+P.id]=60; G.rel[t*G.NN+P.id]=80; G.rel[P.id*G.NN+t]=70; T.wars.forEach(w=>{ if(w===P.id) G.endWar(P.id,t,'status'); }); T.stability=30; G.unlock('a_coup'); UI.toast(`${T.name}'de darbe! Yeni yönetim size sadık.`,'ok','hood'); News.add('unrest',`${T.name}'de askeri darbe`,'Ordu yönetime el koydu; yeni rejim dış politikada keskin bir dönüş sinyali verdi.','ev_protest',[t]); } }
    if(op==='o_smear'){ G.nations.forEach(n=>{if(n.alive&&n.id!==t)G.addRel(n.id,t,-6,false);}); UI.toast(`${T.name} uluslararası arenada itibar kaybetti`,'ok','megaphone'); }
  } else { G.addRel(t,P.id,-30); P.appMod-=3; UI.toast(`Operasyon başarısız! Ajanlarımız ${T.name}'de yakalandı`,'danger','handcuffs'); News.add('dip',`${T.name}'de ${P.name} casusları yakalandı`,'Skandal diplomatik krize dönüştü.','ev_diplomacy',[P.id,t]); }
  UI.refresh(); };
Act.coalitionCreate=function(name,flagKey){ const P=N_(G.player); const id='C'+G.day+'_'+((rnd()*1e4)|0); const c=G.addCoalition(id,name,flagKey||P.flag,'askeri',P.color,[],P.id); G.unlock('a_coal'); News.add('dip',`${P.name} öncülüğünde yeni ittifak: ${name}`,'Kuruluş bildirgesi ortak savunma ve ekonomik işbirliğini öngörüyor.','ev_diplomacy',[P.id]); return c; };
Act.coalitionInvite=function(cid,t){ const c=G.coalitions[cid],T=N_(t); const avg=[...c.members].reduce((s,m)=>s+G.rel_(t,m),0)/Math.max(1,c.members.size); if(rnd()<(avg-10)/60){ c.members.add(t); T.coal.add(cid); UI.toast(`${T.name}, ${c.name}'e katıldı`,'ok','team-upgrade'); c.members.forEach(m=>{if(m!==t)G.addRel(m,t,15);}); return true;} UI.toast(`${T.name} daveti reddetti`,'danger','thumb-down'); return false; };
Act.coalitionJoin=function(cid){ const P=N_(G.player),c=G.coalitions[cid]; const avg=[...c.members].reduce((s,m)=>s+G.rel_(m,P.id),0)/Math.max(1,c.members.size); const anyWar=[...c.members].some(m=>P.wars.has(m));
  if(anyWar) return UI.toast('Üyelerle savaştasınız','danger','crossed-swords'); if(rnd()<(avg+5)/50){ c.members.add(P.id); P.coal.add(cid); c.members.forEach(m=>{if(m!==P.id)G.addRel(m,P.id,15);}); UI.toast(`${c.name} üyeliğiniz onaylandı`,'ok','team-upgrade'); News.add('dip',`${P.name}, ${c.name}'e katıldı`,'Genişleme kararı oy çokluğuyla alındı.','ev_diplomacy',[P.id]);
    // rivals of coalition react
    G.nations.forEach(n=>{ if(!n.alive||c.members.has(n.id)) return; const av=[...c.members].reduce((s,m)=>s+G.rel_(n.id,m),0)/c.members.size; if(av<-30) G.addRel(n.id,P.id,-20,false); });
    return true; } UI.toast(`${c.name} başvurunuzu reddetti`,'danger','thumb-down'); return false; };
Act.coalitionLeave=function(cid){ const P=N_(G.player),c=G.coalitions[cid]; c.members.delete(P.id); P.coal.delete(cid); c.members.forEach(m=>G.addRel(m,P.id,-15)); UI.toast(`${c.name}'den ayrıldınız`,'warn','exit-door'); if(!c.members.size) delete G.coalitions[cid]; };

// ---------- AI ----------
const AI={};
AI.think=function(n){
  if(!n.alive) return; const sc=G.scenario; const P=G.player;
  // economy: recruit or build
  const pw=G.power(n); const threat=[...n.wars].reduce((s,w)=>s+G.power(N_(w)),0);
  const reserve=n.income*15;
  if(n.money>reserve && n.net>0){
    const spend=(n.money-reserve)*0.6; const r=rnd();
    if(threat>0 || r<0.55){ // military
      const opts=['piyade','piyade','tank','topcu','ucak','heli']; if(n.techs.has('t_drone')) opts.push('drone','drone'); if(n.coastal&&rnd()<0.25) opts.push('gemi'); if(rnd()<0.1) opts.push('fuze','hs');
      const k=pick(opts); const U=GD.UNITS[k]; const c=G.unitCost(n,k); const times=Math.max(1,Math.min(6,Math.floor(spend/c)));
      if(n.money>c*times && n.manpower>U.mp*times && n.net>U.up*U.batch*times*G.costFactor(n)*0.5){ n.money-=c*times; n.manpower-=U.mp*times; n.u[k]+=U.batch*times; }
    } else { const ks=Object.keys(GD.BUILDINGS); const k=pick(ks); const c=G.bldCost(n,k); if(n.money>c && n.bld[k]<GD.BUILDINGS[k].max){ n.money-=c; n.bld[k]++; } }
  }
  if(n.net<0 && n.money<n.income*5){ for(const k of ['piyade','tank','topcu']) n.u[k]*=0.97; if(n.tax<0.3) n.tax+=0.01; }
  if(!n.researching) AI.pickTech(n);
  if(n.debt>0&&n.money>n.debt){n.money-=n.debt;n.debt=0;}
  // peace
  for(const e of [...n.wars]){ const E=N_(e); if(!E.alive){n.wars.delete(e);continue;}
    const ws=G.warScore(n.id,e); const dur=G.day-(n.warStart[e]||0);
    if(e!==P && dur>120 && !n.horde && !E.horde){ if((ws<-25&&rnd()<0.3)||(n.weary>40&&rnd()<0.2)||(Math.abs(ws)<5&&dur>500&&rnd()<0.15)){ const accept=G.warScore(e,n.id)<20||E.weary>30||rnd()<0.3; if(accept){ G.endWar(n.id,e,ws<-40?'status':'status'); News.add('dip',`${n.name} ile ${E.name} ateşkes imzaladı`,'Taraflar mevcut cephe hatlarında çatışmayı durdurdu.','ev_diplomacy',[n.id,e]); } } }
    if(e===P && dur>150 && ws<-30 && rnd()<0.12 && !n.horde) UI.peaceOffer(n.id);
    if(!n.horde && E.capital<0) { G.endWar(n.id,e,'annex'); }
    if(!n.horde && E.cells<E.startCells*0.12 && e!==P && rnd()<0.3){ G.endWar(n.id,e,'annex'); News.add('war',`${E.name} teslim oldu`,`${n.name} ülkenin tamamını ilhak etti.`,'ev_war',[n.id,e]); }
    if(e===P && n.cells<n.startCells*0.2 && rnd()<0.25 && !n.horde) UI.surrenderOffer(n.id);
  }
  // war declaration
  const aggr=n.aggr*sc.aggr*(n.horde?3:1)*(n.policies.has('p_expans')?1.3:1);
  if(n.wars.size<(n.horde?99:2) && rnd()<aggr*(n.horde?0.35:0.09) && n.approval>25 && G.day>(n.horde?5:40)){
    const ns=G.neigh?.[n.id]; if(ns&&ns.size){ const cands=[...ns].filter(x=>N_(x).alive&&!n.wars.has(x)&&!G.allied(n.id,x)&&!G.truce(n.id,x)&&!n.puppets.has(x)&&n.overlord!==x);
      let best=null,bs=0; for(const c of cands){ const C=N_(c); const r=G.rel_(n.id,c); const def=G.power(C)+[...G.alliesOf(c)].reduce((s,x)=>s+(N_(x).alive?G.power(N_(x))*0.35:0),0)+ (N_(c).guarantees?0:0);
        let gu=0; G.nations.forEach(g=>{ if(g.alive&&g.guarantees.has(c)) gu+=G.power(g)*0.4; });
        const ratio=pw/Math.max(1,def+gu); let s=(ratio-1.6)*0.5+(-r-35)/40+(C.wars.size?0.4:0)+(C.stability<30?0.3:0);
        if(c===P){ s+=(G.settings.difficulty-1)*0.15; if(N_(P).policies.has('p_nukedoc')&&N_(P).u.nukleer>0) s-=0.8; if(G.day<60) s-=1; }
        if(n.horde) s=ratio*0.5+1; if(s>bs){bs=s;best=c;} }
      if(best!=null && bs>(n.horde?0.3:0.65)){ const B=N_(best);
        const reason=G.rel_(n.id,best)<-70?`${n.name}, uzun süredir gerilimin tırmandığı ${B.name}'e karşı askeri harekat başlattı.`:`${n.name}, "güvenlik tehditleri" gerekçesiyle ${B.name} sınırını geçti.`;
        G.startWar(n.id,best,false,reason); if(best===P) UI.toast(`${n.name} SİZE SAVAŞ İLAN ETTİ!`,'danger','crossed-swords'); } } }
  // naval invasion
  for(const e of n.wars){ const w=G.wars.find(x=>(x.a===n.id&&x.b===e)||(x.b===n.id&&x.a===e)); if(w&&!w.contact&&n.u.gemi>=4&&G.day-n.ai.lastNaval>60&&rnd()<0.3){ // find enemy coastal cell
      let tgt=-1,bd=1e12; const cap=n.capital; for(let k=0;k<300;k++){const i=(rnd()*M.N)|0; if(M.owner[i]===e&&M.coast[i]){const d=(M.x[i]-M.x[cap])**2+(M.y[i]-M.y[cap])**2;if(d<bd){bd=d;tgt=i;}}}
      if(tgt>=0 && Math.sqrt(bd)<1600){ n.ai.lastNaval=G.day; const r=G.navalInvasion(n.id,tgt); } } }
  // strikes
  if(n.wars.size && rnd()<0.15){ const e=pick([...n.wars]); const E=N_(e); if(E.capital>=0 && n.u.fuze>=5 && rnd()<0.5) G.strike(n.id,E.capital,'missile'); else if(n.u.ucak>20 && rnd()<0.4){ const f=G.fronts[e+'_'+n.id]; if(f&&f.size){ G.strike(n.id,[...f][0],'air'); } } }
  // alliances
  if(rnd()<0.08 && !n.horde){ const cands=G.nations.filter(x=>x.alive&&x.id!==n.id&&x.id!==P&&!n.allies.has(x.id)&&G.rel_(n.id,x.id)>65&&!n.wars.has(x.id)); if(cands.length){ const x=pick(cands); if(G.rel_(x.id,n.id)>60){ n.allies.add(x.id); x.allies.add(n.id); if(G.power(n)+G.power(x)>2e5) News.add('dip',`${n.name} ve ${x.name} ittifak kurdu`,'İki başkent ortak savunma anlaşmasını onayladı.','ev_diplomacy',[n.id,x.id]); } } }
  // AI asks player for alliance / trade
  if(P>=0 && rnd()<0.012 && G.rel_(n.id,P)>55 && !n.allies.has(P) && !n.wars.has(P)) UI.aiProposal(n.id,'ally');
  if(P>=0 && rnd()<0.01 && G.rel_(n.id,P)>20 && !n.trade.has(P) && !n.wars.has(P)) UI.aiProposal(n.id,'trade');
  if(P>=0 && rnd()<0.006 && G.rel_(n.id,P)<-40 && !n.wars.has(P) && G.power(n)>G.power(N_(P))*1.5 && G.neigh?.[n.id]?.has(P)) UI.aiProposal(n.id,'ultimatum');
  // opportunistic: help allies at war
  if(!n.horde) n.allies.forEach(a=>{ N_(a).wars.forEach(e=>{ if(!n.wars.has(e)&&!G.allied(n.id,e)&&rnd()<0.04) { G.startWar(n.id,e,true); News.add('war',`${n.name}, müttefiki ${N_(a).name}'in yanında savaşa girdi`,'','ev_war',[n.id,e]); if(e===P) UI.toast(`${n.name} size savaş ilan etti!`,'danger','crossed-swords'); } }); });
  // priority front toward weakest
  n.priority={};
  // stance
  if(n.tax>0.32) n.tax-=0.01; if(n.approval<35 && n.tax>0.12) n.tax-=0.01;
};
AI.pickTech=function(n){ const av=GD.TECHS.filter(t=>!n.techs.has(t[0])&&t[4].every(r=>n.techs.has(r))&&t[0]!=='s_mars'&&(t[0]!=='t_nuke'||n.aggr>0.6||GD.NUKES[n.code])); if(av.length){ av.sort((a,b)=>a[3]-b[3]); n.researching=(rnd()<0.6?av[0]:pick(av))[0]; } };
G.aiPickTech=AI.pickTech;

// ---------- UN ----------
const UN={};
UN.propose=function(){ const w=pick(G.wars); if(!w) return; const A=N_(w.a),B=N_(w.b); const agg=A; const types=[['ceasefire',`${A.name} ile ${B.name} arasında derhal ateşkes`],['sanction',`${agg.name}'e uluslararası yaptırım`]]; const t=pick(types);
  G.un={type:t[0],text:t[1],a:w.a,b:w.b,end:G.day+20,votes:{}}; News.add('dip','BM Güvenlik Konseyi olağanüstü toplandı',`Gündem: "${t[1]}". Oylama 20 gün içinde yapılacak.`,'ev_diplomacy',[w.a,w.b]);
  if(G.player>=0) UI.unVote(); G.schedule(20,UN.resolve); };
UN.resolve=function(){ const u=G.un; if(!u) return; let yes=0,no=0; G.nations.forEach(n=>{ if(!n.alive||n.cells<20) return; let v; if(n.id===G.player) v=u.votes[n.id]; if(v==null){ const ra=G.rel_(n.id,u.a); v=ra<0?'yes':(rnd()<0.4?'yes':'no'); if(n.id===u.a) v='no'; } const wgt=Math.sqrt(n.gdp); if(v==='yes')yes+=wgt;else if(v==='no')no+=wgt; });
  const pass=yes>no; const P=G.player; const pv=u.votes[P];
  if(pass){ if(u.type==='sanction') G.nations.forEach(n=>{ if(n.alive&&n.id!==u.a&&G.rel_(n.id,u.a)<20&&n.id!==P) n.sanc.add(u.a); }); if(u.type==='ceasefire'){ const A=N_(u.a); if(A.wars.has(u.b) && u.a!==P && u.b!==P) G.endWar(u.a,u.b,'status'); A.weary+=10; } }
  if(pv && ((pv==='yes')===pass)){ G.stats.unWins++; if(G.stats.unWins>=3) G.unlock('a_un'); }
  News.add('dip',`BM kararı ${pass?'KABUL EDİLDİ':'REDDEDİLDİ'}: ${u.text}`,`Oylama sonucu: ${pass?'çoğunluk destek verdi':'öneri yeterli destek bulamadı'}.`,'ev_diplomacy',[u.a,u.b]); G.un=null; };
