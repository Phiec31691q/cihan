// Android paketi: kalıcı kayıt yuvaları (yalnızca uygulama içinde yüklenir)
(function(){
  const KEY = 'cihan_slots_v1';
  const st = window['local' + 'Storage'];
  const b64 = buf => { let s = ''; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
  const unb64 = str => Uint8Array.from(atob(str), c => c.charCodeAt(0));
  const gz = async str => b64(await new Response(new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
  const gunz = async str => await new Response(new Blob([unb64(str)]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  (async () => { for (const i of [1, 2, 3, 4]) { try { const raw = st.getItem(KEY + '_' + i); if (!raw) continue; const o = JSON.parse(raw); Save.slots[i] = { label: o.label, data: await gunz(o.z) }; } catch(e) {} } })();
  Save.persist = async function(){
    for (const i of [1, 2, 3, 4]) { const s = Save.slots[i]; if (!s || s._saved === s.data) continue;
      try { st.setItem(KEY + '_' + i, JSON.stringify({ label: s.label, z: await gz(s.data) })); s._saved = s.data; }
      catch(e) { UI.toast('Kayıt alanı dolu: eski bir yuvanın üzerine kaydedin', 'danger', 'cancel'); return false; } }
    return true;
  };
  const _sm = Save.saveMenu;
  Save.saveMenu = function(){
    _sm.apply(this, arguments);
    const w = [...document.querySelectorAll('#modals .mwrap')].pop(); if (!w) return;
    const note = w.querySelector('.note'); if (note) note.textContent = 'Kayıtlar cihazında kalıcı olarak saklanır.';
    const f = w.querySelector('#svFile'); if (f) f.remove();
    w.querySelectorAll('[data-s]').forEach(b => b.addEventListener('click', () => setTimeout(Save.persist, 0)));
  };
  // otomatik kayıt: her 90 oyun gününde bir (yuva 4)
  let lastAuto = -1;
  G.on && G.on('tick', () => {
    if (UI.mode !== 'game' || G.player < 0) return;
    if (G.day > 0 && G.day % 90 === 0 && G.day !== lastAuto) { lastAuto = G.day;
      try { const P = N_(G.player); Save.slots[4] = { data: Save.serialize(), label: 'Otomatik · ' + P.name + ' · ' + dateStr(G.day) }; Save.persist(); } catch(e) {}
    }
  });
  const _lm = Save.loadMenu;
  Save.loadMenu = function(){
    _lm.apply(this, arguments);
    const w = [...document.querySelectorAll('#modals .mwrap')].pop(); if (!w || !Save.slots[4]) return;
    const body = w.querySelector('.mbody'); const s = Save.slots[4];
    const d = document.createElement('div'); d.className = 'ucard';
    d.innerHTML = `<div class="ui">${ic('save')}</div><div><h4>Otomatik Kayıt</h4><p>${esc(s.label)}</p></div><div class="acts"><button class="btn sm gold">Yükle</button></div>`;
    d.querySelector('button').onclick = () => { document.querySelectorAll('.mwrap').forEach(x => x.remove()); try { Save.apply(s.data); } catch(e) { UI.toast('Kayıt yüklenemedi', 'danger', 'cancel'); } };
    body.prepend(d);
  };
  document.body.classList.add('native');
})();
