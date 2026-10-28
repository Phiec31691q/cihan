// ============ SOUND (WebAudio synth) ============
'use strict';
const Sfx={ ctx:null, master:null, mus:null, last:{} };
Sfx.init=function(){ if(Sfx.ctx) return; try{ const C=window.AudioContext||window.webkitAudioContext; Sfx.ctx=new C(); Sfx.master=Sfx.ctx.createGain(); Sfx.master.gain.value=0.5; Sfx.master.connect(Sfx.ctx.destination);
  Sfx.musG=Sfx.ctx.createGain(); Sfx.musG.gain.value=0; Sfx.musG.connect(Sfx.master);
  const n=Sfx.ctx.sampleRate*2, b=Sfx.ctx.createBuffer(1,n,Sfx.ctx.sampleRate), d=b.getChannelData(0); for(let i=0;i<n;i++) d[i]=Math.random()*2-1; Sfx.noise=b;
  Sfx.music(); }catch(e){} };
Sfx.resume=()=>{ Sfx.init(); if(Sfx.ctx&&Sfx.ctx.state==='suspended') Sfx.ctx.resume(); };
function env(g,t,a,d,v){ g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(v,t+a); g.gain.exponentialRampToValueAtTime(0.0001,t+a+d); }
Sfx.tone=function(f,dur,type='sine',v=0.2,when=0,slide){ const c=Sfx.ctx,t=c.currentTime+when; const o=c.createOscillator(),g=c.createGain(); o.type=type; o.frequency.setValueAtTime(f,t); if(slide) o.frequency.exponentialRampToValueAtTime(slide,t+dur); env(g,t,0.01,dur,v); o.connect(g); g.connect(Sfx.master); o.start(t); o.stop(t+dur+0.05); };
Sfx.nz=function(dur,v=0.3,f=1200,q=1,when=0,type='lowpass',f2){ const c=Sfx.ctx,t=c.currentTime+when; const s=c.createBufferSource(); s.buffer=Sfx.noise; const fl=c.createBiquadFilter(); fl.type=type; fl.frequency.setValueAtTime(f,t); if(f2) fl.frequency.exponentialRampToValueAtTime(f2,t+dur); fl.Q.value=q; const g=c.createGain(); env(g,t,0.005,dur,v); s.connect(fl); fl.connect(g); g.connect(Sfx.master); s.start(t,Math.random()); s.stop(t+dur+0.1); };
Sfx.play=function(k){ if(!G.settings.sound) return; Sfx.init(); if(!Sfx.ctx||Sfx.ctx.state!=='running') return; const now=performance.now(); if(Sfx.last[k]&&now-Sfx.last[k]<({gun:90,boom:120,click:40}[k]||200)) return; Sfx.last[k]=now;
  switch(k){
    case 'click': Sfx.tone(1800,0.03,'square',0.04); Sfx.tone(900,0.04,'sine',0.05,0.01); break;
    case 'hover': Sfx.tone(2400,0.02,'sine',0.015); break;
    case 'open': Sfx.nz(0.18,0.06,3000,0.7,0,'bandpass',800); break;
    case 'ok': Sfx.tone(660,0.12,'triangle',0.12); Sfx.tone(990,0.18,'triangle',0.1,0.08); break;
    case 'bad': Sfx.tone(220,0.25,'sawtooth',0.06,0,140); Sfx.tone(180,0.3,'square',0.04,0.05); break;
    case 'warn': Sfx.tone(520,0.1,'square',0.05); Sfx.tone(520,0.1,'square',0.05,0.16); break;
    case 'tech': [523,659,784,1047].forEach((f,i)=>Sfx.tone(f,0.35,'triangle',0.09,i*0.08)); break;
    case 'ach': [392,523,659,784,1047].forEach((f,i)=>Sfx.tone(f,0.5,'triangle',0.08,i*0.07)); Sfx.tone(1568,0.8,'sine',0.04,0.35); break;
    case 'war': Sfx.tone(98,1.2,'sawtooth',0.12,0,92); Sfx.tone(147,1.0,'sawtooth',0.08,0.1); Sfx.nz(1.4,0.18,180,1,0,'lowpass'); [0,0.35,0.6].forEach(w=>Sfx.nz(0.25,0.35,120,2,w)); break;
    case 'gun': Sfx.nz(0.06,0.08,2500,1,0,'bandpass'); Sfx.nz(0.05,0.05,1800,1,0.07,'bandpass'); break;
    case 'boom': Sfx.nz(0.9,0.4,400,1,0,'lowpass',60); Sfx.tone(70,0.6,'sine',0.25,0,30); break;
    case 'nuke': Sfx.nz(4,0.6,600,0.7,0,'lowpass',40); Sfx.tone(45,3.5,'sine',0.4,0,20); Sfx.nz(0.4,0.5,5000,0.5,0,'highpass'); break;
    case 'launch': Sfx.nz(1.2,0.12,300,1,0,'bandpass',2500); break;
    case 'jet': Sfx.nz(1.5,0.1,4000,0.6,0,'bandpass',500); break;
    case 'news': for(let i=0;i<6;i++) Sfx.tone(1400+Math.random()*300,0.02,'square',0.025,i*0.06); break;
    case 'event': Sfx.tone(440,0.5,'triangle',0.08); Sfx.tone(554,0.5,'triangle',0.06,0.12); Sfx.tone(659,0.7,'triangle',0.06,0.24); break;
    case 'coin': Sfx.tone(1318,0.08,'square',0.04); Sfx.tone(1760,0.15,'square',0.04,0.06); break;
  } };
// generative ambient score
Sfx.music=function(){ const c=Sfx.ctx; const prog=[[57,60,64,69],[53,57,60,65],[55,59,62,67],[52,55,59,64],[50,53,57,62],[53,57,60,64]]; let step=0;
  const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=900; lp.Q.value=0.5; const rv=c.createConvolver(); const len=c.sampleRate*3, ir=c.createBuffer(2,len,c.sampleRate); for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3);} rv.buffer=ir;
  const wet=c.createGain(); wet.gain.value=0.6; lp.connect(Sfx.musG); lp.connect(rv); rv.connect(wet); wet.connect(Sfx.musG);
  const mtof=m=>440*Math.pow(2,(m-69)/12);
  function chord(){ if(!Sfx.ctx) return; const t=c.currentTime; const ch=prog[step%prog.length]; step++; const war=G.player>=0&&G.nations[G.player]&&G.nations[G.player].wars.size>0;
    ch.forEach((m,i)=>{ [-6,6].forEach(dt=>{ const o=c.createOscillator(),g=c.createGain(); o.type=i===0?'triangle':'sawtooth'; o.frequency.value=mtof(m-(i===0?12:0)); o.detune.value=dt; g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(i===0?0.05:0.018,t+2.2); g.gain.linearRampToValueAtTime(0,t+8.5); o.connect(g); g.connect(lp); o.start(t); o.stop(t+9); }); });
    // melody notes
    for(let k=0;k<3;k++){ if(Math.random()<0.6){ const m=ch[(Math.random()*4)|0]+12; const o=c.createOscillator(),g=c.createGain(); o.type='sine'; o.frequency.value=mtof(m); const tt=t+1+k*2.2; g.gain.setValueAtTime(0,tt); g.gain.linearRampToValueAtTime(0.03,tt+0.4); g.gain.linearRampToValueAtTime(0,tt+2.4); o.connect(g); g.connect(lp); o.start(tt); o.stop(tt+2.6);} }
    // war drums
    if(war){ for(let k=0;k<8;k++){ const tt=t+k*1.0+(k%2?0.5:0); const o=c.createOscillator(),g=c.createGain(); o.type='sine'; o.frequency.setValueAtTime(90,tt); o.frequency.exponentialRampToValueAtTime(45,tt+0.4); g.gain.setValueAtTime(0.0001,tt); g.gain.exponentialRampToValueAtTime(k%4===0?0.22:0.1,tt+0.01); g.gain.exponentialRampToValueAtTime(0.0001,tt+0.6); o.connect(g); g.connect(Sfx.musG); o.start(tt); o.stop(tt+0.7);} }
    setTimeout(chord,8000); }
  chord(); Sfx.setMusic(G.settings.music); };
Sfx.setMusic=on=>{ if(!Sfx.ctx) return; Sfx.musG.gain.setTargetAtTime(on?0.55:0,Sfx.ctx.currentTime,0.8); };
