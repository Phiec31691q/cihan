// ============ RENDERER ============
'use strict';
const Render={ cam:{x:2048,y:1100,z:0.4}, mode:'political', sel:-1, hover:-1, fx:[], tokens:[], anims:[], pulses:[], t:0, shake:0, ready:false };
const IconImg={};
function iconImage(name,color){ const k=name+color; if(IconImg[k]) return IconImg[k]; const body=(ICONS[name]||ICONS['cog']).replace(/currentColor/g,color);
  const img=new Image(); img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${body}</svg>`); IconImg[k]=img; return img; }

Render.init=async function(canvas){
  const R=Render; R.cv=canvas; R.ctx=canvas.getContext('2d');
  R.terrain=await loadImg('img/terrain.jpg');
  R.atlas=await loadImg(FLAGS.src);
  const ac=document.createElement('canvas'); ac.width=R.atlas.width; ac.height=R.atlas.height; const actx=ac.getContext('2d'); actx.drawImage(R.atlas,0,0);
  R.atlasW=ac.width; R.atlasData=actx.getImageData(0,0,ac.width,ac.height).data;
  // pixmap
  const bin=Uint8Array.from(atob(PIXMAP.b64),c=>c.charCodeAt(0));
  const ds=new Blob([bin]).stream().pipeThrough(new DecompressionStream('deflate'));
  const buf=await new Response(ds).arrayBuffer(); R.pix=new Uint16Array(buf);
  R.LW=PIXMAP.w; R.LH=PIXMAP.h; R.sc=PIXMAP.sc;
  // CSR
  const N=M.N, cnt=new Int32Array(N+1); const pix=R.pix; const L=pix.length;
  for(let p=0;p<L;p++){ const v=pix[p]; if(v) cnt[v]++; }
  const start=new Int32Array(N+1); let s=0; for(let i=0;i<N;i++){ start[i]=s; s+=cnt[i+1]; } start[N]=s;
  const list=new Int32Array(s); const fill=start.slice(0,N);
  for(let p=0;p<L;p++){ const v=pix[p]; if(v){ list[fill[v-1]++]=p; } }
  R.cStart=start; R.cList=list;
  R.layer=document.createElement('canvas'); R.layer.width=R.LW; R.layer.height=R.LH; R.lctx=R.layer.getContext('2d');
  R.img=R.lctx.createImageData(R.LW,R.LH); R.data=R.img.data;
  R.anchor=new Float32Array(N*3); R.dirty=new Map(); R.dr=null; R.labels=[];
  R.borderPath=new Path2D(WORLD.borders);
  R.ready=true;
  R.resize(); addEventListener('resize',()=>R.resize());
};
function loadImg(src){ return new Promise((res,rej)=>{ const i=new Image(); i.crossOrigin='anonymous'; i.onload=()=>res(i); i.onerror=rej; i.src=src; }); }
Render.resize=function(){ const R=Render; const d=Math.min(2,devicePixelRatio||1); R.dpr=d; R.cv.width=innerWidth*d; R.cv.height=innerHeight*d; R.cv.style.width=innerWidth+'px'; R.cv.style.height=innerHeight+'px'; R.clampCam(); };
Render.clampCam=function(){ const c=Render.cam; const minZ=Math.max(innerWidth/M.W, innerHeight/M.H)*0.98; c.z=clamp(c.z,minZ,14); const hw=innerWidth/2/c.z, hh=innerHeight/2/c.z; c.x=clamp(c.x,hw,M.W-hw); c.y=clamp(c.y,hh,M.H-hh); };
Render.w2s=(x,y)=>{const c=Render.cam;return [(x-c.x)*c.z+innerWidth/2,(y-c.y)*c.z+innerHeight/2];};
Render.s2w=(x,y)=>{const c=Render.cam;return [(x-innerWidth/2)/c.z+c.x,(y-innerHeight/2)/c.z+c.y];};
Render.flyTo=function(x,y,z,dur=900){ const c=Render.cam; const s={x:c.x,y:c.y,z:c.z}, t0=performance.now(); Render.fly={s,e:{x,y,z:z||c.z},t0,dur}; };

// ---------- LAYER PIXELS ----------
Render.fillColor=function(ci,o){ // returns [r,g,b,a, flagMode]
  const mode=Render.mode, n=G.nations[o];
  if(mode==='political') return null;
  if(mode==='terrain') return [0,0,0,0];
  if(mode==='diplo'){ if(o===G.player) return [230,190,80,170]; const r=G.rel_(G.player,o); if(G.atWar(G.player,o)) return [200,30,30,190]; if(G.allied(G.player,o)) return [40,120,230,170]; const t=(r+100)/200; return [Math.round(220*(1-t)+40*t),Math.round(60*(1-t)+180*t),60,150]; }
  if(mode==='alliance'){ for(const c of n.coal){ const co=G.coalitions[c]; if(co&&co.type==='askeri') return [...co.color,170]; } for(const c of n.coal){ const co=G.coalitions[c]; if(co) return [...co.color,120]; } return [90,90,90,60]; }
  if(mode==='econ'){ const v=Math.log10(1+M.cGdp[ci]*1000*n.econ*G.eraScale)/4; const t=clamp(v,0,1); return [Math.round(40+215*t),Math.round(60+150*t*t),Math.round(110*(1-t)),170]; }
  if(mode==='religion'){ const r=GD.RELIGIONS[n.religion]; return [...r.c,165]; }
  if(mode==='power'){ const p=G.power(n); const t=clamp(Math.log10(1+p)/7,0,1); return [Math.round(60+190*t),Math.round(60*(1-t)+30),Math.round(140*(1-t)+40),170]; }
  if(mode==='stab'){ const t=n.stability/100; return [Math.round(220*(1-t)+40*t),Math.round(50*(1-t)+180*t),60,160]; }
  return [128,128,128,120];
};
Render.renderCell=function(ci){
  const R=Render; const o=M.owner[ci]; const n=G.nations[o]; const data=R.data, pix=R.pix, LW=R.LW;
  const s=R.cStart[ci], e=R.cStart[ci+1]; if(s===e) return;
  const fc=Render.fillColor(ci,o);
  const fi=FLAGS.idx[n.flag]??FLAGS.idx.NONE; const fx0=(fi%FLAGS.cols)*FLAGS.fw, fy0=((fi/FLAGS.cols)|0)*FLAGS.fh; const ad=R.atlasData, AW=R.atlasW;
  const ox=R.anchor[ci*3], oy=R.anchor[ci*3+1], k=R.anchor[ci*3+2]||1;
  const A=Math.round(G.settings.flagAlpha*255*(o===Render.sel?1.18:1));
  const occ=M.core[ci]!==o&&M.integ[ci]<1; const rad=M.rad[ci];
  const wars=n.wars; const isP=o===G.player, isS=o===Render.sel;
  const br=n.color?n.color:[60,60,60];
  let minx=1e9,miny=1e9,maxx=-1,maxy=-1;
  for(let q=s;q<e;q++){ const p=R.cList[q]; const px=p%LW, py=(p/LW)|0;
    if(px<minx)minx=px; if(px>maxx)maxx=px; if(py<miny)miny=py; if(py>maxy)maxy=py;
    // border test
    let bo=-2; // -2 none, -1 coast, else neighbor owner
    const nbs=[p-1,p+1,p-LW,p+LW];
    for(let t=0;t<4;t++){ const q2=nbs[t]; if(q2<0||q2>=pix.length){continue;} const v=pix[q2]; if(!v){ if(bo===-2) bo=-1; continue; } const oo=M.owner[v-1]; if(oo!==o){ bo=oo; break; } }
    const di=p*4;
    if(bo>=0){ // political border
      if(wars.has(bo)){ data[di]=255;data[di+1]=60;data[di+2]=30;data[di+3]=255; }
      else if(isS){ data[di]=255;data[di+1]=255;data[di+2]=255;data[di+3]=255; }
      else if(isP){ data[di]=245;data[di+1]=200;data[di+2]=80;data[di+3]=255; }
      else { data[di]=br[0]*0.3;data[di+1]=br[1]*0.3;data[di+2]=br[2]*0.3;data[di+3]=235; }
      continue; }
    let r,g,b,a;
    if(fc){ r=fc[0];g=fc[1];b=fc[2];a=fc[3]; if(isS) a=Math.min(255,a+50); }
    else if(k>1.6){ let fx=(px-ox)/k-0.5, fy=(py-oy)/k-0.5; const FW1=FLAGS.fw-1, FH1=FLAGS.fh-1; fx=fx<0?0:fx>FW1?FW1:fx; fy=fy<0?0:fy>FH1?FH1:fy;
      const x0=fx|0, y0=fy|0, x1=x0<FW1?x0+1:x0, y1=y0<FH1?y0+1:y0, tx=fx-x0, ty=fy-y0;
      const a00=((fy0+y0)*AW+fx0+x0)*4, a10=((fy0+y0)*AW+fx0+x1)*4, a01=((fy0+y1)*AW+fx0+x0)*4, a11=((fy0+y1)*AW+fx0+x1)*4;
      const w00=(1-tx)*(1-ty), w10=tx*(1-ty), w01=(1-tx)*ty, w11=tx*ty;
      r=ad[a00]*w00+ad[a10]*w10+ad[a01]*w01+ad[a11]*w11; g=ad[a00+1]*w00+ad[a10+1]*w10+ad[a01+1]*w01+ad[a11+1]*w11; b=ad[a00+2]*w00+ad[a10+2]*w10+ad[a01+2]*w01+ad[a11+2]*w11; a=A>255?255:A; }
    else { let fxp=((px-ox)/k)|0, fyp=((py-oy)/k)|0; fxp=fxp<0?0:fxp>=FLAGS.fw?FLAGS.fw-1:fxp; fyp=fyp<0?0:fyp>=FLAGS.fh?FLAGS.fh-1:fyp;
      const ai=((fy0+fyp)*AW+fx0+fxp)*4; r=ad[ai];g=ad[ai+1];b=ad[ai+2];a=A>255?255:A; }
    if(bo===-1){ r*=0.55;g*=0.55;b*=0.55;a=Math.max(a,200); }
    if(occ && (((px+py)>>2)&1)){ r*=0.62;g*=0.62;b*=0.62; a=Math.min(255,a+20); }
    if(rad>0){ const t=rad*0.75; r=r*(1-t)+170*t; g=g*(1-t)+220*t; b=b*(1-t)+20*t; a=Math.max(a,200); }
    data[di]=r;data[di+1]=g;data[di+2]=b;data[di+3]=a;
  }
  if(maxx>=0){ const d=R.dr; if(!d) R.dr=[minx,miny,maxx,maxy]; else { if(minx<d[0])d[0]=minx; if(miny<d[1])d[1]=miny; if(maxx>d[2])d[2]=maxx; if(maxy>d[3])d[3]=maxy; } }
};
Render.cellChanged=function(ci){ if(!Render.ready) return; const R=Render; const o=M.owner[ci];
  // anchor from same-owner neighbor
  for(let k=0;k<6;k++){ const j=M.nb[ci*6+k]; if(j>=0&&M.owner[j]===o&&R.anchor[j*3+2]>0){ R.anchor[ci*3]=R.anchor[j*3];R.anchor[ci*3+1]=R.anchor[j*3+1];R.anchor[ci*3+2]=R.anchor[j*3+2]; break; } }
  R.renderCell(ci); for(let k=0;k<6;k++){ const j=M.nb[ci*6+k]; if(j>=0) R.renderCell(j); }
  R.markNation(o,500); };
Render.markNation=function(id,delay=0){ const R=Render; const now=performance.now(); const n=G.nations[id]; const d=delay+(n?Math.min(4000,n.cells*0.12):0); if(!R.dirty.has(id)) R.dirty.set(id,now+d); };
Render.nationBordersDirty=id=>Render.markNation(id,0);
Render.renderAll=function(){ const R=Render; R.data.fill(0); const ids=new Set(); G.nations.forEach(n=>{if(n.alive||n.cells>0) ids.add(n.id);}); R.recomputeNations(ids); R.dirty.clear(); R.dr=[0,0,R.LW-1,R.LH-1]; };
Render.recomputeNations=function(ids){
  const R=Render; const lists={}; ids.forEach(id=>lists[id]=[]);
  for(let i=0;i<M.N;i++){ const l=lists[M.owner[i]]; if(l) l.push(i); }
  const sc=R.sc, FW=FLAGS.fw, FH=FLAGS.fh; const seen=R._seen||(R._seen=new Int32Array(M.N)); R._stamp=(R._stamp||0)+1; const st=R._stamp;
  for(const id in lists){ const cells=lists[id]; const n=G.nations[id]; let best=null;
    for(const c0 of cells){ if(seen[c0]===st) continue; const comp=[c0]; seen[c0]=st; let minx=1e9,miny=1e9,maxx=-1e9,maxy=-1e9,sx=0,sy=0;
      for(let q=0;q<comp.length;q++){ const c=comp[q]; const x=M.x[c],y=M.y[c]; sx+=x;sy+=y; if(x<minx)minx=x;if(x>maxx)maxx=x;if(y<miny)miny=y;if(y>maxy)maxy=y;
        for(let k=0;k<6;k++){ const j=M.nb[c*6+k]; if(j>=0&&seen[j]!==st&&M.owner[j]==id){ seen[j]=st; comp.push(j);} } }
      const bw=(maxx-minx+M.hw*1.2)*sc, bh=(maxy-miny+M.rh*1.6)*sc; const k=Math.max(bw/FW,bh/FH); const cx=(minx+maxx)/2*sc, cy=(miny+maxy)/2*sc;
      const ox=cx-FW*k/2, oy=cy-FH*k/2; for(const c of comp){ R.anchor[c*3]=ox;R.anchor[c*3+1]=oy;R.anchor[c*3+2]=k; }
      if(!best||comp.length>best.n) best={n:comp.length,x:sx/comp.length,y:sy/comp.length,w:maxx-minx,h:maxy-miny,minx,maxx,miny,maxy};
    }
    if(n){ n.label=best; }
    for(const c of cells) R.renderCell(c);
  }
};
Render.processDirty=function(){ const R=Render; if(!R.dirty.size) return; const now=performance.now(); const ids=new Set(); let budget=0;
  for(const [id,t] of R.dirty){ if(t<=now){ ids.add(id); budget+=G.nations[id].cells; R.dirty.delete(id); if(budget>12000) break; } }
  if(ids.size) R.recomputeNations(ids); };
Render.select=function(id){ const old=Render.sel; Render.sel=id; if(old>=0) Render.recomputeNations(new Set([old])); if(id>=0) Render.recomputeNations(new Set([id])); };
Render.setMode=function(m){ Render.mode=m; Render.renderAll(); };

// ---------- FX ----------
Render.captureFx=function(ci,a,b){ const R=Render; if(R.fx.length>260) R.fx.splice(0,40); R.fx.push({type:'cap',x:M.x[ci],y:M.y[ci],o:a,t0:R.t}); if(Math.random()<0.25) R.fx.push({type:'dust',x:M.x[ci],y:M.y[ci],t0:R.t}); if(a===G.player||b===G.player){ if(Math.random()<0.3) Sfx.play('gun'); } };
Render.boom=function(ci,s=1){ const R=Render; R.fx.push({type:'boom',x:M.x[ci],y:M.y[ci],s,t0:R.t}); for(let i=0;i<8;i++) R.fx.push({type:'boom',x:M.x[ci]+(Math.random()-0.5)*M.R*5*s,y:M.y[ci]+(Math.random()-0.5)*M.R*5*s,s:s*0.5,t0:R.t+Math.random()*0.6}); Sfx.play('boom'); };
Render.nuke=function(ci){ const R=Render; R.fx.push({type:'nuke',x:M.x[ci],y:M.y[ci],t0:R.t}); R.shake=1.2; R.flash=1; Sfx.play('nuke'); };
Render.ship=function(o,t,days,id){ Render.anims.push({type:'ship',x1:M.x[o],y1:M.y[o],x2:M.x[t],y2:M.y[t],d0:G.day+G.frac,days,id}); };
Render.jet=function(o,t,id){ if(o<0) return; Render.anims.push({type:'jet',x1:M.x[o],y1:M.y[o],x2:M.x[t],y2:M.y[t],d0:G.day+G.frac,days:1,id}); Sfx.play('jet'); };
Render.missile=function(o,t,id,n,nuke){ if(o<0) return; for(let i=0;i<Math.min(n,6);i++) Render.anims.push({type:'missile',nuke,x1:M.x[o]+(Math.random()-0.5)*10,y1:M.y[o]+(Math.random()-0.5)*10,x2:M.x[t]+(Math.random()-0.5)*(nuke?0:18),y2:M.y[t]+(Math.random()-0.5)*(nuke?0:18),d0:G.day+G.frac+i*0.08,days:nuke?2:1,id}); Sfx.play('launch'); };
Render.pulseCity=function(ci,kind){ if(ci==null||ci<0) return; Render.pulses.push({x:M.x[ci],y:M.y[ci],kind,t0:Render.t}); };

Render.buildTokens=function(){ const R=Render; const toks=[];
  for(const w of G.wars){ if(!w.contact) continue; const f=G.fronts[w.a+'_'+w.b]; if(!f) continue; const arr=[...f]; const step=Math.max(1,Math.floor(arr.length/70));
    for(let i=(Math.random()*step)|0;i<arr.length;i+=step){ const c=arr[i]; let j=-1; for(let k=0;k<6;k++){const q=M.nb[c*6+k]; if(q>=0&&M.owner[q]===w.b){j=q;break;}} if(j<0) continue;
      toks.push({a:w.a,b:w.b,x1:M.x[c],y1:M.y[c],x2:M.x[j],y2:M.y[j],ph:Math.random()*6.28,r:w.ratio||0.5}); } }
  R.tokens=toks; };

// ---------- DRAW ----------
Render.drawFlag=function(ctx,key,x,y,w,h,alpha=1,pole=true){ const R=Render; const fi=FLAGS.idx[key]??FLAGS.idx.NONE; const sx=(fi%FLAGS.cols)*FLAGS.fw, sy=((fi/FLAGS.cols)|0)*FLAGS.fh;
  ctx.globalAlpha=alpha; if(pole){ ctx.fillStyle='#1b1d22'; ctx.fillRect(x-1,y-h*0.15,1.6,h*1.65); }
  ctx.fillStyle='rgba(0,0,0,.55)'; ctx.fillRect(x+0.5,y+0.5,w+1,h+1);
  ctx.drawImage(R.atlas,sx,sy,FLAGS.fw,FLAGS.fh,x,y,w,h); ctx.strokeStyle='rgba(0,0,0,.7)'; ctx.lineWidth=0.8; ctx.strokeRect(x,y,w,h); ctx.globalAlpha=1; };
Render.frame=function(dt){
  const R=Render; if(!R.ready) return; R.t+=dt; const ctx=R.ctx, c=R.cam, d=R.dpr;
  if(R.fly){ const f=R.fly; const t=clamp((performance.now()-f.t0)/f.dur,0,1); const e=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2; c.x=f.s.x+(f.e.x-f.s.x)*e; c.y=f.s.y+(f.e.y-f.s.y)*e; c.z=f.s.z+(f.e.z-f.s.z)*e; R.clampCam(); if(t>=1) R.fly=null; }
  R.processDirty();
  if(R.dr){ const [a,b,x2,y2]=R.dr; R.lctx.putImageData(R.img,0,0,a,b,x2-a+1,y2-b+1); R.dr=null; }
  ctx.setTransform(d,0,0,d,0,0);
  ctx.fillStyle='#0b1626'; ctx.fillRect(0,0,innerWidth,innerHeight);
  let sx=0,sy=0; if(R.shake>0){ R.shake-=dt; sx=(Math.random()-0.5)*14*R.shake; sy=(Math.random()-0.5)*14*R.shake; }
  ctx.setTransform(d*c.z,0,0,d*c.z,d*(innerWidth/2-c.x*c.z+sx),d*(innerHeight/2-c.y*c.z+sy));
  ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality=c.z>2?'high':'medium';
  ctx.drawImage(R.terrain,0,0,M.W,M.H);
  ctx.drawImage(R.layer,0,0,M.W,M.H);
  if(G.settings.borders && c.z>1.1){ ctx.globalAlpha=clamp((c.z-1.1)/2,0,0.45); ctx.strokeStyle='#0d0f14'; ctx.lineWidth=0.6/c.z*1.4; ctx.stroke(R.borderPath); ctx.globalAlpha=1; }
  // target marker
  const P=G.nations[G.player];
  ctx.setTransform(d,0,0,d,d*sx,d*sy);
  const vx0=-40, vy0=-40, vx1=innerWidth+40, vy1=innerHeight+40;
  // cities
  if(G.settings.cities && c.z>1.0){ ctx.font='600 11px "Barlow Semi Condensed",sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle';
    for(const ct of CITIES){ const big=ct[4]>1500000||ct[5]; if(!big&&c.z<2.4) continue; if(!ct[5]&&ct[4]<500000&&c.z<4) continue; const [x,y]=R.w2s(ct[1],ct[2]); if(x<vx0||x>vx1||y<vy0||y>vy1) continue;
      const own=M.owner[ct[3]]; const isCap=G.nations[own]&&G.nations[own].capital===ct[3];
      if(isCap){ ctx.drawImage(iconImage('castle','#f2d488'),x-7,y-7,14,14); } else { ctx.fillStyle='#f3efe4'; ctx.strokeStyle='#111'; ctx.lineWidth=1; ctx.beginPath(); ctx.rect(x-2.5,y-2.5,5,5); ctx.fill(); ctx.stroke(); }
      if(c.z>1.8&&(big||c.z>3.5)){ ctx.lineWidth=3; ctx.strokeStyle='rgba(8,10,14,.85)'; ctx.strokeText(ct[0],x+8,y); ctx.fillStyle=isCap?'#f6dc9a':'#ece8dc'; ctx.fillText(ct[0],x+8,y); } } }
  // front tokens
  if(G.settings.tokens && R.tokens.length){ const fw=clamp(9+c.z*2.2,10,22), fh=fw*0.66; const buck=new Set(); const bs=Math.max(fw*1.1,14);
    for(const tk of R.tokens){ const [x1,y1]=R.w2s(tk.x1,tk.y1), [x2,y2]=R.w2s(tk.x2,tk.y2); if(x1<vx0||x1>vx1||y1<vy0||y1>vy1) continue; if(!G.nations[tk.a]||!G.nations[tk.b]) continue; const key=((x1/bs)|0)+','+((y1/bs)|0); if(buck.has(key)) continue; buck.add(key);
      let dx=x2-x1, dy=y2-y1; const dl=Math.hypot(dx,dy)||1; const minD=fw*1.25; if(dl<minD){ const m=minD/dl; const mx=(x1+x2)/2,my=(y1+y2)/2; dx*=m; dy*=m; }
      const mx=(x1+x2)/2,my=(y1+y2)/2; const ux=dx/Math.hypot(dx,dy), uy=dy/Math.hypot(dx,dy);
      const ph=R.t*7+tk.ph; const la=(Math.sin(ph)*0.5+0.5)*(0.5+tk.r)*fw*0.35, lb=(Math.sin(ph+Math.PI)*0.5+0.5)*(1.5-tk.r)*fw*0.35;
      const ax=mx-ux*(fw*0.75)+ux*la, ay=my-uy*(fw*0.75)+uy*la, bx=mx+ux*(fw*0.75)-ux*lb, by=my+uy*(fw*0.75)-uy*lb;
      R.drawFlag(ctx,G.nations[tk.a].flag,ax-fw/2,ay-fh,fw,fh); R.drawFlag(ctx,G.nations[tk.b].flag,bx-fw/2,by-fh,fw,fh);
      if(Math.sin(ph*1.7)>0.82){ ctx.fillStyle='rgba(255,220,120,.95)'; ctx.beginPath(); ctx.arc(mx+(Math.random()-0.5)*fw*0.5,my-fh*0.6+(Math.random()-0.5)*fh*0.6,1.5+Math.random()*2,0,6.28); ctx.fill(); }
      if(Math.random()<0.02){ R.fx.push({type:'spark',x:(tk.x1+tk.x2)/2,y:(tk.y1+tk.y2)/2,t0:R.t}); }
    } }
  // fx
  const keep=[];
  for(const f of R.fx){ const age=R.t-f.t0; if(age<0){keep.push(f);continue;} const [x,y]=R.w2s(f.x,f.y);
    if(f.type==='cap'){ if(age>2.2||!G.nations[f.o]) continue; keep.push(f); if(x<vx0||x>vx1||y<vy0||y>vy1) continue; const s=age<0.25?age/0.25*1.25:age<0.4?1.25-(age-0.25)/0.15*0.25:1; const a=age>1.6?1-(age-1.6)/0.6:1; const fw=clamp(8+c.z*2,9,20)*s; R.drawFlag(ctx,G.nations[f.o].flag,x-fw/2,y-fw*0.66-4,fw,fw*0.66,a); }
    else if(f.type==='dust'){ if(age>1.2) continue; keep.push(f); ctx.globalAlpha=0.5*(1-age/1.2); ctx.fillStyle='#c8b89a'; ctx.beginPath(); ctx.arc(x,y,4+age*14,0,6.28); ctx.fill(); ctx.globalAlpha=1; }
    else if(f.type==='spark'){ if(age>0.5) continue; keep.push(f); ctx.globalAlpha=1-age/0.5; ctx.fillStyle='#ffb347'; for(let i=0;i<4;i++){ ctx.fillRect(x+Math.cos(i*1.6+f.t0)*age*30,y+Math.sin(i*1.6+f.t0)*age*30-6,2,2); } ctx.globalAlpha=1; }
    else if(f.type==='boom'){ if(age>1.4) continue; keep.push(f); const r=(6+age*40)*f.s*clamp(c.z,0.6,2.5); const g=ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,`rgba(255,240,180,${1-age/1.4})`); g.addColorStop(0.4,`rgba(255,120,30,${0.8*(1-age/1.4)})`); g.addColorStop(1,'rgba(60,30,20,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,6.28); ctx.fill(); }
    else if(f.type==='nuke'){ if(age>9) continue; keep.push(f); const zr=clamp(c.z,0.5,4); const r=(20+age*30)*zr; ctx.globalAlpha=Math.max(0,1-age/9); const g=ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,'rgba(255,255,230,1)'); g.addColorStop(0.3,'rgba(255,170,40,.9)'); g.addColorStop(0.7,'rgba(160,40,10,.5)'); g.addColorStop(1,'rgba(40,10,5,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,6.28); ctx.fill();
      ctx.strokeStyle=`rgba(255,230,200,${Math.max(0,0.8-age/4)})`; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(x,y,age*90*zr,0,6.28); ctx.stroke(); // mushroom
      const mh=Math.min(age,3)/3; ctx.fillStyle='rgba(120,90,70,.85)'; ctx.fillRect(x-4*zr,y-60*zr*mh,8*zr,60*zr*mh); const cg=ctx.createRadialGradient(x,y-60*zr*mh,0,x,y-60*zr*mh,26*zr*mh+1); cg.addColorStop(0,'rgba(255,200,120,.95)'); cg.addColorStop(1,'rgba(90,60,50,.2)'); ctx.fillStyle=cg; ctx.beginPath(); ctx.ellipse(x,y-60*zr*mh,30*zr*mh+1,18*zr*mh+1,0,0,6.28); ctx.fill(); ctx.globalAlpha=1; }
  }
  R.fx=keep;
  // anims (ships / jets / missiles)
  const now=G.day+G.frac; const ka=[];
  for(const a of R.anims){ const p=(now-a.d0)/a.days; if(p>1.02) continue; ka.push(a); if(p<0) continue; const x=a.x1+(a.x2-a.x1)*p, y=a.y1+(a.y2-a.y1)*p; const [sx2,sy2]=R.w2s(x,y);
    if(a.type==='ship'){ const [ax,ay]=R.w2s(a.x1,a.y1),[bx,by]=R.w2s(a.x2,a.y2); ctx.setLineDash([4,5]); ctx.strokeStyle='rgba(180,220,255,.6)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.stroke(); ctx.setLineDash([]);
      ctx.drawImage(iconImage('battleship','#e8edf2'),sx2-13,sy2-13,26,26); R.drawFlag(ctx,G.nations[a.id].flag,sx2+6,sy2-22,14,9); }
    else if(a.type==='jet'){ const ang=Math.atan2(a.y2-a.y1,a.x2-a.x1); ctx.save(); ctx.translate(sx2,sy2); ctx.rotate(ang+Math.PI/4); ctx.drawImage(iconImage('jet-fighter','#dfe6ee'),-12,-12,24,24); ctx.restore(); }
    else if(a.type==='missile'){ const h=Math.sin(p*Math.PI)*(a.nuke?160:80); const [tx,ty]=[sx2,sy2-h*clamp(c.z,0.5,2)]; ctx.strokeStyle=a.nuke?'rgba(255,90,60,.8)':'rgba(255,220,160,.7)'; ctx.lineWidth=a.nuke?2.5:1.5; ctx.beginPath(); for(let q=Math.max(0,p-0.25);q<=p;q+=0.02){ const xx=a.x1+(a.x2-a.x1)*q, yy=a.y1+(a.y2-a.y1)*q; const [u,v]=R.w2s(xx,yy); const hh=Math.sin(q*Math.PI)*(a.nuke?160:80)*clamp(c.z,0.5,2); if(q===Math.max(0,p-0.25))ctx.moveTo(u,v-hh); else ctx.lineTo(u,v-hh);} ctx.stroke(); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(tx,ty,a.nuke?3.5:2,0,6.28); ctx.fill(); }
  }
  R.anims=ka;
  // city pulses
  const kp=[];
  for(const p of R.pulses){ const age=R.t-p.t0; if(age>10) continue; kp.push(p); const [x,y]=R.w2s(p.x,p.y); const ph=(age%1.6)/1.6;
    const col={protest:'230,60,50',quake:'200,140,70',flood:'70,150,240',fire:'255,120,30',terror:'255,40,40'}[p.kind]||'255,255,255';
    ctx.strokeStyle=`rgba(${col},${1-ph})`; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(x,y,6+ph*34,0,6.28); ctx.stroke();
    const ic={protest:'shouting',quake:'earth-crack',flood:'flood',fire:'wildfires',terror:'explosion-rays'}[p.kind]||'info'; const bob=Math.sin(age*5)*3;
    ctx.fillStyle='rgba(15,17,22,.85)'; ctx.beginPath(); ctx.arc(x,y-26+bob,13,0,6.28); ctx.fill(); ctx.strokeStyle=`rgb(${col})`; ctx.lineWidth=1.5; ctx.stroke(); ctx.drawImage(iconImage(ic,`rgb(${col})`),x-9,y-35+bob,18,18); }
  R.pulses=kp;
  // labels
  if(G.settings.labels){ ctx.textAlign='center'; ctx.textBaseline='middle';
    for(const n of G.nations){ if(!n.alive||!n.label) continue; const L=n.label; let fs=Math.sqrt(L.n)*M.R*0.42*c.z; const nm=n.name.toLocaleUpperCase('tr'); const maxW=Math.max(L.w,M.R*3)*c.z*0.9; fs=Math.min(fs, maxW/(nm.length*0.62)); if(fs<9) continue; fs=Math.min(fs,46);
      const [x,y]=R.w2s(L.x,L.y); if(x<-200||x>innerWidth+200||y<-50||y>innerHeight+50) continue;
      ctx.font=`700 ${fs.toFixed(1)}px "Cinzel","Barlow Semi Condensed",serif`; if('letterSpacing' in ctx) ctx.letterSpacing=(fs*0.12).toFixed(1)+'px';
      ctx.lineWidth=Math.max(2,fs*0.16); ctx.strokeStyle='rgba(6,8,12,.78)'; ctx.lineJoin='round'; ctx.strokeText(nm,x,y); ctx.fillStyle=n.id===G.player?'#ffe2a0':'rgba(245,242,232,.94)'; ctx.fillText(nm,x,y); }
    if('letterSpacing' in ctx) ctx.letterSpacing='0px'; }
  // player target marker
  if(P&&P.target){ const [x,y]=R.w2s(P.target.x,P.target.y); const pu=(Math.sin(R.t*4)+1)/2; ctx.drawImage(iconImage('crosshair','#ff5a3c'),x-14-pu*3,y-14-pu*3,28+pu*6,28+pu*6); }
  // selected capital marker
  if(R.sel>=0){ const n=G.nations[R.sel]; if(n&&n.capital>=0){ const [x,y]=R.w2s(M.x[n.capital],M.y[n.capital]); ctx.strokeStyle='rgba(255,255,255,.8)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(x,y,10+Math.sin(R.t*3)*2,0,6.28); ctx.stroke(); } }
  if(R.flash>0){ ctx.fillStyle=`rgba(255,250,235,${R.flash})`; ctx.fillRect(0,0,innerWidth,innerHeight); R.flash-=dt*0.6; }
};
// minimap
Render.drawMini=function(cv){ const R=Render; if(!R.ready) return; const x=cv.getContext('2d'); const w=cv.width,h=cv.height; x.drawImage(R.terrain,0,0,w,h); x.drawImage(R.layer,0,0,w,h); const c=R.cam; const vw=innerWidth/c.z, vh=innerHeight/c.z; x.strokeStyle='#f2d488'; x.lineWidth=1.5; x.strokeRect((c.x-vw/2)/M.W*w,(c.y-vh/2)/M.H*h,vw/M.W*w,vh/M.H*h); };
