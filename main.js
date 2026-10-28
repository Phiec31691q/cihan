// ============ BOOT & MAIN LOOP ============
'use strict';
G.frac=0;
(async function boot(){
  document.documentElement.style.setProperty('--atlas',`url(${FLAGS.src})`);
  const bar=$('#bootbar'), msg=$('#bootmsg'), tip=$('#boottip');
  let ti=0; const tipT=setInterval(()=>{ tip.textContent=GD.TIPS[ti++%GD.TIPS.length]; },2600); tip.textContent=GD.TIPS[(Math.random()*GD.TIPS.length)|0];
  const step=async(p,m)=>{ bar.style.width=p+'%'; msg.textContent=m; await new Promise(r=>setTimeout(r,30)); };
  try{
    await step(8,'Dünya haritası hazırlanıyor…'); M.init();
    await step(30,'Arazi, bayraklar ve sınırlar yükleniyor…'); await Render.init($('#map'));
    await step(70,'Ülkeler ve ekonomiler oluşturuluyor…'); G.setup(GD.SCENARIOS[0],{}); Render.renderAll();
    await step(90,'Arayüz kuruluyor…'); UI.bindMap(); UI.buildMenu();
    G.on('tick',()=>{ if(UI.mode==='game') UI.refresh(); });
    await step(100,'Hazır');
  }catch(e){ console.error(e); msg.textContent='Yükleme hatası: '+e.message; return; }
  clearInterval(tipT);
  Render.flyTo(M.W*0.55,M.H*0.38,1.1,10);
  setTimeout(()=>{ UI.mode='menu'; UI.show('menu'); },250);
  requestAnimationFrame(loop);
})();

let _last=performance.now(), _acc=0, _tokT=0, _miniT=0, _menuPan=0;
const SPEEDS=[0,1.5,3,6,12,24];
function loop(now){
  let dt=(now-_last)/1000; _last=now; if(dt>0.1) dt=0.1;
  try{
    if(UI.mode==='game' && !G.paused && G.player>=0){
      _acc+=dt*SPEEDS[G.speed]; let n=0;
      while(_acc>=1 && n<3){ _acc-=1; G.tick(); n++; }
      if(_acc>1) _acc=1; G.frac=_acc;
    }
    _tokT+=dt; if(_tokT>0.5){ _tokT=0; Render.buildTokens(); }
    Render.frame(dt);
    if(UI.mode==='game'){ _miniT+=dt; if(_miniT>0.25){ _miniT=0; Render.drawMini($('#minicv')); }
      UI.tickerFrame(dt); UI.hoverFrame(); UI.keyPan(dt); }
  }catch(e){ console.error(e); }
  requestAnimationFrame(loop);
}
