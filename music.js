/* 瘋狂審訊室・背景音樂：全部在瀏覽器即時合成，沒有任何音樂檔案，不會有版權問題。
   三種曲風會隨嫌犯壓力（緊張度 0～1）一層一層加重，破防、勝負時有專屬收尾音效。 */
(function(root){
const STYLES={
 oppress:{name:'壓抑對峙'},   // 低頻嗡鳴、呼吸般的脈動、時鐘滴答、偶爾的金屬刮擦
 advance:{name:'步步進逼'},   // 不和諧的悶音鋼琴、斷奏弦樂、越來越快的低音脈動
 nordic:{name:'北歐冷調'}     // 大提琴長音、遠處心跳、冰冷的合成質感
};
const N=m=>440*Math.pow(2,(m-69)/12); // 音名編號換成頻率
let ac=null, out=null, duck=null, verb=null, running=false, style='oppress', tension=0, timer=null, layers={}, next={}, vol=0.5;

function makeImpulse(sec){
 const len=Math.floor(ac.sampleRate*sec), b=ac.createBuffer(2,len,ac.sampleRate);
 for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6);}
 return b;
}
function init(ctx){
 if(ac) return; ac=ctx;
 out=ac.createGain(); out.gain.value=0;
 duck=ac.createGain(); duck.gain.value=1;
 const comp=ac.createDynamicsCompressor(); comp.threshold.value=-18; comp.ratio.value=3;
 verb=ac.createConvolver(); verb.buffer=makeImpulse(3.2);
 const wet=ac.createGain(); wet.gain.value=0.45;
 verb.connect(wet); wet.connect(out);
 out.connect(duck); duck.connect(comp); comp.connect(ac.destination);
}
function bus(gain,toVerb){const g=ac.createGain();g.gain.value=gain;g.connect(out);if(toVerb){const s=ac.createGain();s.gain.value=toVerb;g.connect(s);s.connect(verb);}return g;}

/* ---------- 持續音層 ---------- */
function drone(){
 const g=bus(0,0.3), f=ac.createBiquadFilter(); f.type='lowpass'; f.frequency.value=180; f.Q.value=6; f.connect(g);
 const oscs=[[N(33),'sawtooth',0],[N(33),'sawtooth',7],[N(40),'triangle',-5],[N(21),'sine',0]].map(([fr,ty,dt])=>{
  const o=ac.createOscillator();o.type=ty;o.frequency.value=fr;o.detune.value=dt;const og=ac.createGain();og.gain.value=ty==='sine'?0.5:0.18;o.connect(og);og.connect(f);o.start();return o;});
 const lfo=ac.createOscillator(), lg=ac.createGain(); lfo.frequency.value=0.13; lg.gain.value=0.35; lfo.connect(lg); const breath=ac.createGain(); breath.gain.value=0.65; lg.connect(breath.gain);
 g.disconnect(); f.disconnect(); f.connect(breath); breath.connect(g); lfo.start();
 const s=ac.createGain(); s.gain.value=0.3; g.connect(s); s.connect(verb); g.connect(out);
 return {g,f,stop(){oscs.forEach(o=>o.stop());lfo.stop();}};
}
function cello(){
 const g=bus(0,0.5), f=ac.createBiquadFilter(); f.type='lowpass'; f.frequency.value=700; f.Q.value=1; f.connect(g);
 const o=ac.createOscillator(); o.type='sawtooth'; o.frequency.value=N(38);
 const o2=ac.createOscillator(); o2.type='sawtooth'; o2.frequency.value=N(38); o2.detune.value=8;
 const vib=ac.createOscillator(), vg=ac.createGain(); vib.frequency.value=5; vg.gain.value=4; vib.connect(vg); vg.connect(o.frequency); vg.connect(o2.frequency);
 const sw=ac.createGain(); sw.gain.value=0.25; o.connect(sw); o2.connect(sw); sw.connect(f);
 o.start(); o2.start(); vib.start();
 return {g,f,osc:[o,o2],sw,stop(){o.stop();o2.stop();vib.stop();}};
}
function texture(){
 const len=ac.sampleRate*2, b=ac.createBuffer(1,len,ac.sampleRate), d=b.getChannelData(0);
 for(let i=0;i<len;i++) d[i]=Math.random()*2-1;
 const src=ac.createBufferSource(); src.buffer=b; src.loop=true;
 const f=ac.createBiquadFilter(); f.type='bandpass'; f.frequency.value=3200; f.Q.value=8;
 const g=bus(0,0.6); src.connect(f); f.connect(g); src.start();
 return {g,f,stop(){src.stop();}};
}

/* ---------- 事件音 ---------- */
function env(g,t,a,peak,d){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+d);}
function tick(t,hi,amp){
 const b=ac.createBuffer(1,Math.floor(ac.sampleRate*0.03),ac.sampleRate), d=b.getChannelData(0);
 for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,4);
 const s=ac.createBufferSource(); s.buffer=b; const f=ac.createBiquadFilter(); f.type='bandpass'; f.frequency.value=hi?3400:2400; f.Q.value=12;
 const g=bus(amp,0.15); s.connect(f); f.connect(g); s.start(t);
}
function piano(t,midi,amp){
 const g=bus(0,0.55), f=ac.createBiquadFilter(); f.type='lowpass'; f.frequency.value=1400; f.connect(g);
 [[1,'triangle',1],[2,'sine',0.35],[3.01,'sine',0.12]].forEach(([m,ty,a])=>{const o=ac.createOscillator();o.type=ty;o.frequency.value=N(midi)*m;const og=ac.createGain();og.gain.value=a;o.connect(og);og.connect(f);o.start(t);o.stop(t+3);});
 env(g,t,0.008,amp,2.6);
}
function staccato(t,midi,amp){
 const g=bus(0,0.2), f=ac.createBiquadFilter(); f.type='bandpass'; f.frequency.value=N(midi)*3; f.Q.value=1.2; f.connect(g);
 [0,9].forEach(dt=>{const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=N(midi);o.detune.value=dt;o.connect(f);o.start(t);o.stop(t+0.2);});
 env(g,t,0.01,amp,0.14);
}
function screech(t,amp){
 const o=ac.createOscillator(); o.type='sine'; const f0=2000+Math.random()*2500;
 o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(f0*(Math.random()<0.5?0.7:1.3),t+1.6);
 const fm=ac.createOscillator(), fg=ac.createGain(); fm.frequency.value=37; fg.gain.value=60; fm.connect(fg); fg.connect(o.frequency);
 const g=bus(0,0.9); o.connect(g); env(g,t,0.4,amp,1.4); o.start(t); o.stop(t+2); fm.start(t); fm.stop(t+2);
}
function thump(t,amp){
 [0,0.16].forEach((dt,i)=>{const o=ac.createOscillator();o.type='sine';o.frequency.setValueAtTime(i?50:58,t+dt);o.frequency.exponentialRampToValueAtTime(32,t+dt+0.18);
  const g=bus(0,0.25);o.connect(g);env(g,t+dt,0.015,amp*(i?0.7:1),0.2);o.start(t+dt);o.stop(t+dt+0.3);});
}
function pulse(t,amp){
 const o=ac.createOscillator(); o.type='sawtooth'; o.frequency.value=N(33);
 const f=ac.createBiquadFilter(); f.type='lowpass'; f.frequency.setValueAtTime(900,t); f.frequency.exponentialRampToValueAtTime(120,t+0.25);
 const g=bus(0,0.1); o.connect(f); f.connect(g); env(g,t,0.01,amp,0.28); o.start(t); o.stop(t+0.35);
}

/* ---------- 排程：每 0.1 秒往前排未來 0.3 秒的音 ---------- */
const DISSONANT=[57,58,63,64,65,51,52];  // A、降B、降E、E、F 等不和諧音
const CELLO_LINE=[38,45,41,40,38,36];
let celloIdx=0, tickHi=false;
function schedule(){
 if(!running) return;
 const now=ac.currentTime, ahead=now+0.3, k=tension;
 const smooth=(p,v,tc)=>p.setTargetAtTime(v,now,tc||1.5);
 const w={oppress:style==='oppress'?1:0,advance:style==='advance'?1:0,nordic:style==='nordic'?1:0};
 // 進逼層：任何曲風在高壓時都會加進來
 const adv=Math.max(w.advance, k>0.55?(k-0.55)/0.45*0.8:0);
 if(layers.drone){ smooth(layers.drone.g.gain,(w.oppress*0.55+w.advance*0.4+w.nordic*0.25)*(0.6+k*0.6)); smooth(layers.drone.f.frequency,140+k*700); }
 if(layers.cello){ smooth(layers.cello.g.gain,w.nordic*(0.22+k*0.25)); }
 if(layers.tex){ smooth(layers.tex.g.gain,(w.nordic*0.035+w.oppress*0.02)*(0.5+k)); smooth(layers.tex.f.frequency,2600+k*3000); }
 // 時鐘：越緊張越快
 if(w.oppress||k<0.5){ const iv=1-0.5*k; next.tick=next.tick||now; while(next.tick<ahead){ if(next.tick>=now) tick(next.tick,tickHi=!tickHi,0.12*(w.oppress?1:0.5)); next.tick+=iv; } }
 // 金屬刮擦：偶爾出現，壓力越高越頻繁
 next.screech=next.screech||now+6; if(next.screech<ahead){ if(w.oppress||w.nordic) screech(next.screech,0.03+k*0.04); next.screech+=Math.max(4,14-k*10)+Math.random()*6; }
 // 悶音鋼琴
 next.piano=next.piano||now+2; if(next.piano<ahead){ if(adv>0.05) piano(next.piano,DISSONANT[Math.floor(Math.random()*DISSONANT.length)],0.09*adv+0.03*k); next.piano+=Math.max(0.7,3.2-k*2.4)*(0.7+Math.random()*0.6); }
 // 斷奏弦樂與低音脈動：拍子隨壓力加快
 const bpm=70+k*70, beat=60/bpm;
 next.beat=next.beat||now+1; let i=next.beatN||0;
 while(next.beat<ahead){ if(next.beat>=now){
   if(adv>0.2&&k>0.35){ staccato(next.beat,i%4===3?46:45,0.06*adv); if(i%2===0) staccato(next.beat+beat/2,45,0.035*adv); }
   if(adv>0.1&&i%2===0) pulse(next.beat,0.12*adv);
   if(w.nordic&&i%2===0) thump(next.beat,0.18+k*0.2);
  } next.beat+=beat; i++; }
 next.beatN=i;
 // 大提琴旋律慢慢換音
 if(layers.cello&&w.nordic){ next.cello=next.cello||now; if(next.cello<ahead){ celloIdx=(celloIdx+1)%CELLO_LINE.length; const fr=N(CELLO_LINE[celloIdx]);
   layers.cello.osc.forEach(o=>o.frequency.setTargetAtTime(fr,next.cello,0.4)); layers.cello.sw.gain.setTargetAtTime(0.1,next.cello,0.3); layers.cello.sw.gain.setTargetAtTime(0.3,next.cello+0.6,1.2); next.cello+=6-k*2; } }
}

function start(ctx,st){
 init(ctx); if(running){setStyle(st);return;}
 running=true; style=st||style; next={}; celloIdx=0;
 layers={drone:drone(),cello:cello(),tex:texture()};
 out.gain.cancelScheduledValues(ac.currentTime); out.gain.setTargetAtTime(vol,ac.currentTime,1.2);
 clearInterval(timer); timer=setInterval(schedule,100); schedule();
}
function stop(fade){
 if(!running) return; running=false; clearInterval(timer);
 const t=ac.currentTime, L=layers; out.gain.setTargetAtTime(0,t,(fade||1.5)/3);
 setTimeout(()=>{for(const k in L) try{L[k].stop();}catch(e){}},(fade||1.5)*1000+300);
 layers={};
}
function setStyle(s){ if(STYLES[s]) style=s; }
function setTension(k){ tension=Math.max(0,Math.min(1,k)); }
function setVolume(v){ vol=v; if(running&&out) out.gain.setTargetAtTime(v,ac.currentTime,0.3); }
function setDuck(on){ if(duck) duck.gain.setTargetAtTime(on?0.45:1,ac.currentTime,0.25); }

/* 收尾音效：kind = 'break'（嫌犯破防）、'win'、'lose' */
function sting(ctx,kind){
 init(ctx); const t=ac.currentTime+0.05;
 const g0=ac.createGain(); g0.gain.value=vol*1.2; g0.connect(duck);
 const s=ac.createGain(); s.gain.value=0.6; g0.connect(s); s.connect(verb);
 const note=(m,ty,at,dur,amp,dest)=>{const o=ac.createOscillator();o.type=ty;o.frequency.value=N(m);const g=ac.createGain();o.connect(g);g.connect(dest||g0);env(g,at,0.02,amp,dur);o.start(at);o.stop(at+dur+0.1);};
 if(kind==='break'){
  const len=ac.sampleRate*2.2, b=ac.createBuffer(1,len,ac.sampleRate), d=b.getChannelData(0); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*(i/len);
  const n=ac.createBufferSource(); n.buffer=b; const f=ac.createBiquadFilter(); f.type='bandpass'; f.frequency.setValueAtTime(300,t); f.frequency.exponentialRampToValueAtTime(5000,t+2.1); f.Q.value=3;
  const ng=ac.createGain(); ng.gain.value=0.35; n.connect(f); f.connect(ng); ng.connect(g0); n.start(t);
  const o=ac.createOscillator(); o.type='sine'; o.frequency.setValueAtTime(70,t+2.2); o.frequency.exponentialRampToValueAtTime(28,t+3.4);
  const og=ac.createGain(); o.connect(og); og.connect(g0); env(og,t+2.2,0.01,0.9,1.6); o.start(t+2.2); o.stop(t+4);
  [45,46,51,57,58].forEach(m=>note(m,'sawtooth',t+2.2,2.4,0.05));
 } else if(kind==='win'){
  [45,52,57,61,64].forEach((m,i)=>note(m,'triangle',t+i*0.12,2.8,0.08));
  note(33,'sine',t,3,0.4);
 } else {
  [[57,0],[56,0.5],[55,1],[51,1.6]].forEach(([m,dt])=>note(m,'triangle',t+dt,1.6,0.08));
  note(27,'sine',t+1.6,3,0.35);
 }
}

root.Music={STYLES,start,stop,setStyle,setTension,setVolume,setDuck,sting,isRunning:()=>running};
})(typeof window!=='undefined'?window:globalThis);
