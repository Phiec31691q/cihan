// Mobil / dokunmatik katmanı: düzen sınıfları, tam ekran, yön kilidi, dokunuş koruması, çevrimdışı önbellek
const Mobile = { touch:false, inFrame:false };
try { Mobile.inFrame = window.self !== window.top; } catch(e){ Mobile.inFrame = true; }
Mobile.coarse = () => (window.matchMedia && matchMedia('(pointer:coarse)').matches) || ('ontouchstart' in window && navigator.maxTouchPoints > 0);

// ---- düzen ----
Mobile.layout = function(){
  const b = document.body, W = innerWidth, H = innerHeight;
  Mobile.touch = Mobile.coarse();
  b.classList.toggle('compact', H <= 600 || W <= 1000);
  b.classList.toggle('tiny', H <= 380 || W <= 720);
  b.classList.toggle('touch', Mobile.touch);
  b.classList.toggle('portrait', H > W && (Mobile.touch || W < 700));
  document.documentElement.style.setProperty('--vh', H + 'px');
  if (window.Render && Render.cv) Render.resize();
};
addEventListener('resize', Mobile.layout);
addEventListener('orientationchange', () => setTimeout(Mobile.layout, 250));
if (window.visualViewport) visualViewport.addEventListener('resize', Mobile.layout);

// ---- uygulama modu: tam ekran ve yatay kilit, manifest (display: fullscreen, orientation: landscape) ve Android paketi tarafından sağlanır ----
Mobile.native = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
Mobile.isStandalone = () => Mobile.native() || (window.matchMedia && (matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches)) || navigator.standalone === true;
Mobile.lockLandscape = function(){ try { const o = screen.orientation; if (o && o.lock && Mobile.isStandalone()) o.lock('landscape').catch(() => {}); } catch(e) {} };
addEventListener('pointerup', () => { if (!Mobile._lk) { Mobile._lk = true; Mobile.lockLandscape(); } }, true);

// ---- dokunuş koruması: parmak basılıyken yeniden çizilen düğmeler kaybolmasın ----
Mobile.holdIn = null;
addEventListener('pointerdown', e => {
  const t = e.target.closest && e.target.closest('#topbar,#card,#warbar');
  Mobile.holdIn = t ? t.id : null;
  if (e.pointerType !== 'mouse') { document.body.classList.add('touchmode'); const tip = document.getElementById('tip'); if (tip) tip.classList.add('hidden'); }
  else document.body.classList.remove('touchmode');
}, true);
const _relHold = () => { Mobile.holdIn = null; };
addEventListener('pointerup', () => setTimeout(_relHold, 0), true);
addEventListener('pointercancel', _relHold, true);

(function patchUI(){
  const _top = UI.refreshTop;
  UI.refreshTop = function(){
    if (Mobile.holdIn === 'topbar' || Mobile.holdIn === 'warbar') return;
    _top.apply(this, arguments);
  };
  const _card = UI.showCard;
  UI.showCard = function(id, fly){
    if (!fly && Mobile.holdIn === 'card' && id === UI.cardId) return;
    const r = _card.apply(this, arguments);
    document.body.classList.toggle('card-open', UI.cardId >= 0);
    return r;
  };
  const _hide = UI.hideCard;
  UI.hideCard = function(){ const r = _hide.apply(this, arguments); document.body.classList.remove('card-open'); return r; };
  const _op = UI.openPanel;
  UI.openPanel = function(p){ const r = _op.apply(this, arguments); document.body.classList.toggle('panel-open', !!UI.panel); document.body.classList.toggle('panel-wide', UI.panel === 'tech'); return r; };
  const _bm = UI.buildMenu;
  UI.buildMenu = function(){
    _bm.apply(this, arguments);
    const f = document.getElementById('menufoot');
    if (f) f.textContent = 'Sürüm 1.2.0 · 250+ ülke · ' + GD.SCENARIOS.length + ' temel senaryo · Çevrimdışı oynanır';
  };
})();

// ---- tarayıcı hareketlerini engelle ----
document.addEventListener('contextmenu', e => { if (!e.target.closest('input')) e.preventDefault(); });
['gesturestart','gesturechange','gestureend'].forEach(t => document.addEventListener(t, e => e.preventDefault(), { passive:false }));
document.addEventListener('touchmove', e => { if (e.touches.length > 1 && !e.target.closest('#map')) e.preventDefault(); }, { passive:false });
document.addEventListener('dblclick', e => { if (!e.target.closest('#map')) e.preventDefault(); });

// ---- çevrimdışı önbellek (yalnızca https ve uygulama modunda) ----
Mobile.registerSW = function(){
  try {
    if (!('serviceWorker' in navigator) || location.protocol !== 'https:' || Mobile.inFrame || Mobile.native()) return;
    navigator.serviceWorker.register('sw.js').catch(() => {});
  } catch(e) {}
};

Mobile.layout();
addEventListener('load', () => { Mobile.layout(); Mobile.registerSW(); });

// ---- Android geri tuşu (uygulama modunda): pencereyi/paneli kapat, yoksa duraklatma menüsü ----
Mobile.backInit = function(){
  if (Mobile.inFrame || !Mobile.isStandalone()) return;
  try { history.pushState({ ron:1 }, ''); } catch(e) { return; }
  addEventListener('popstate', () => {
    try { history.pushState({ ron:1 }, ''); } catch(e) {}
    const ms = document.querySelectorAll('#modals .mwrap');
    if (ms.length) { const w = ms[ms.length - 1]; if (!w.dataset.lock && w.close) w.close(); return; }
    if (UI.panel) { UI.openPanel(null); return; }
    if (UI.cardId >= 0) { UI.hideCard(); return; }
    if (UI.mode === 'game') { UI.pauseMenu(); return; }
    if (UI.mode === 'pick') { const b = document.getElementById('pickBack'); if (b) b.click(); return; }
    if (UI.mode === 'scen') { const b = document.getElementById('scenBack'); if (b) b.click(); return; }
  });
};
addEventListener('load', Mobile.backInit);
