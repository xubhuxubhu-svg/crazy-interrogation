/* 瘋狂審訊室・介面與流程：選單、單人（對電腦）、連線對戰、語音、麥克風 */
(function(){
const $=id=>document.getElementById(id);
const E=window.Engine, R=window.Render;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ramp=(p,a,b)=>clamp((p-a)/(b-a),0,1);
const SC=['#5e9c7a','#72a46b','#8ea75e','#aaa452','#c79b45','#d68a3c','#dc753a','#de6238','#d94b3c','#c2364c'];
const IC=['#6f9fd0','#7fa8c8','#8fb07a','#c7a045','#d6823c','#d95f38','#c2364c','#e8a93a','#7a7f8c'];
const ROLE_NAME={inter:'審問官',suspect:'嫌犯'};

/* ---------- 存檔（只存在這台裝置） ---------- */
const store={get(k,d){try{const v=localStorage.getItem('interrogation.'+k);return v?JSON.parse(v):d;}catch(e){return d;}},
 set(k,v){try{localStorage.setItem('interrogation.'+k,JSON.stringify(v));}catch(e){}}};
const cfg=Object.assign({mode:'solo',role:'inter',caseId:'c1',limit:20,looks:{inter:'dog',suspect:'comic'}},store.get('cfg',{}));
cfg.mode='solo';
const music=Object.assign({on:true,style:'auto',vol:50},store.get('music',{}));
const saveCfg=()=>store.set('cfg',{role:cfg.role,caseId:cfg.caseId,limit:cfg.limit,looks:cfg.looks});

function toast(t){const el=$('toast');el.textContent=t;el.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(()=>el.hidden=true,3200);}
function show(id){for(const s of ['scrHome','scrSetup','scrLobby','scrGame']) $(s).hidden=s!==id; window.scrollTo(0,0);}

/* ---------- 語音 ---------- */
const hasTTS='speechSynthesis' in window;
let voiceOn=false, voices=[];
const VOICE={0:{r:0.95,p:0.85,v:1},1:{r:0.88,p:0.8,v:0.9},2:{r:1,p:0.9,v:0.9},3:{r:1.05,p:1,v:0.85},4:{r:1.15,p:1.05,v:0.9,stut:0.35},5:{r:1.35,p:1.12,v:1,stut:0.5},
 6:{r:0.8,p:0.95,v:0.55},7:{r:0.72,p:1.15,v:0.65,wob:0.18},8:{r:1.25,p:1.25,v:1},cry:{r:0.72,p:1.35,v:0.85,wob:0.25,sob:true},hyst:{r:1.5,p:1.7,v:1,wob:0.2},mad:{r:0.68,p:0.55,v:0.9},roar:{r:1.2,p:0.7,v:1}};
const IVOICE=[{r:1,p:0.9,v:0.9},{r:1,p:0.85,v:0.95},{r:0.9,p:0.8,v:0.95},{r:1.1,p:0.9,v:0.9},{r:1.15,p:0.95,v:1},{r:1.25,p:1,v:1},{r:1.3,p:1.05,v:1},{r:1.1,p:1.1,v:1},{r:0.85,p:0.8,v:0.7}];
function loadVoices(){
 if(!hasTTS) return;
 voices=speechSynthesis.getVoices().filter(v=>/^(zh|cmn|yue)/i.test(v.lang));
 const rank=v=>/TW|Hant/i.test(v.lang)?0:/HK/i.test(v.lang)?2:1;
 voices.sort((a,b)=>rank(a)-rank(b));
 for(const [id,pref] of [['voiceSus',0],['voiceInter',1]]){
  const sel=$(id), keep=sel.value; sel.innerHTML='';
  voices.forEach(v=>{const o=document.createElement('option');o.value=v.name;o.textContent=(id==='voiceSus'?'嫌犯：':'審問官：')+v.name.replace(/Microsoft |Google /,'')+'（'+(/TW/i.test(v.lang)?'台灣':/HK/i.test(v.lang)?'香港':'中國')+'）';sel.appendChild(o);});
  if(keep&&voices.some(v=>v.name===keep)) sel.value=keep; else if(voices[pref]) sel.value=voices[pref].name;
  sel.hidden=!voices.length;
 }
 if(voiceOn&&!voices.length) $('voiceNote').textContent='這個裝置沒有中文語音，請改用 Chrome 或 Edge 瀏覽器開啟。';
}
if(hasTTS){loadVoices(); speechSynthesis.addEventListener&&speechSynthesis.addEventListener('voiceschanged',loadVoices);}
function prep(text,c){let s=text.replace(/……+/g,'，').replace(/——/g,'，').replace(/～/g,'');
 if(c.stut) s=s.replace(/[一-龥]{2,}/g,w=>Math.random()<c.stut?w[0]+'，'+w:w);
 if(c.sob) s=s.replace(/，/g,'，嗚，'); return s;}
let speakSeq=0;
function speakTTS(text,who,c,done){
 const chunks=(prep(text,c).match(/[^，。！？、,]+[，。！？、,]*/g)||[]).filter(x=>x.replace(/[，。！？、,\s]/g,'').length);
 if(!chunks.length){done();return;}
 const v=voices.find(x=>x.name===$(who==='inter'?'voiceInter':'voiceSus').value)||voices[0];
 let left=chunks.length; const id=++speakSeq;
 chunks.forEach(ch=>{const u=new SpeechSynthesisUtterance(ch); if(v){u.voice=v;u.lang=v.lang;} else u.lang='zh-TW';
  const w=c.wob?(Math.random()-0.5)*2*c.wob:0; u.rate=clamp(c.r*(1+w*0.3),0.5,2); u.pitch=clamp(c.p+w,0,2); u.volume=c.v;
  u.onend=u.onerror=()=>{if(--left<=0&&id===speakSeq) done(); else if(left<=0) done();};
  speechSynthesis.speak(u);});
}
function toggleVoice(on){
 voiceOn=on; $('voiceBtn').setAttribute('aria-pressed',on); $('voiceBtn').textContent=on?'關閉語音與音效':'開啟語音與音效';
 if(on){audio();loadVoices();if(!hasTTS)$('voiceNote').textContent='這個瀏覽器不支援語音朗讀，音效仍可播放。';}
 else if(hasTTS) speechSynthesis.cancel();
}
$('voiceBtn').onclick=()=>toggleVoice(!voiceOn);

/* ---------- 背景音樂 ---------- */
function musicStyleFor(){
 if(music.style!=='auto') return music.style;
 const t=G?E.byId(G.st.caseId).suspect.type:'cry';
 return t==='mad'?'nordic':t==='roar'?'advance':'oppress';
}
function startMusic(){ if(!window.Music||!music.on||!G) return; const a=audio(); if(!a) return; Music.setVolume(music.vol/100); Music.start(a,musicStyleFor()); }
function stopMusic(f){ if(window.Music) Music.stop(f); }
function renderMusicUI(){
 $('musicBtn').setAttribute('aria-pressed',music.on); $('musicBtn').textContent=music.on?'關閉背景音樂':'開啟背景音樂';
 $('musicStyle').value=music.style; $('musicVol').value=music.vol;
}
$('musicBtn').onclick=()=>{ music.on=!music.on; store.set('music',music); renderMusicUI(); if(music.on&&G&&!G.st.end) startMusic(); else stopMusic(1); };
$('musicStyle').onchange=()=>{ music.style=$('musicStyle').value; store.set('music',music); if(window.Music) Music.setStyle(musicStyleFor()); };
$('musicVol').oninput=()=>{ music.vol=+$('musicVol').value; store.set('music',music); if(window.Music) Music.setVolume(music.vol/100); };
renderMusicUI();

/* ---------- 音效（即時合成） ---------- */
let ac=null;
function audio(){if(!ac){const C=window.AudioContext||window.webkitAudioContext;if(C)ac=new C();}if(ac&&ac.state==='suspended')ac.resume();return ac;}
function thud(){const a=ac;if(!a||!voiceOn)return;const t0=a.currentTime;const o=a.createOscillator(),g=a.createGain();o.type='sine';
 o.frequency.setValueAtTime(120,t0);o.frequency.exponentialRampToValueAtTime(38,t0+0.25);g.gain.setValueAtTime(0.9,t0);g.gain.exponentialRampToValueAtTime(0.001,t0+0.35);
 o.connect(g);g.connect(a.destination);o.start(t0);o.stop(t0+0.4);
 const b=a.createBuffer(1,Math.floor(a.sampleRate*0.15),a.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);
 const n=a.createBufferSource(),ng=a.createGain();n.buffer=b;ng.gain.value=0.35;n.connect(ng);ng.connect(a.destination);n.start(t0);}
function beat(k){const a=ac;if(!a||!voiceOn)return;const t0=a.currentTime;
 [0,0.13].forEach((dt,i)=>{const o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.value=i?48:56;
  g.gain.setValueAtTime(0.0001,t0+dt);g.gain.exponentialRampToValueAtTime(0.3*k*(i?0.7:1),t0+dt+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t0+dt+0.16);
  o.connect(g);g.connect(a.destination);o.start(t0+dt);o.stop(t0+dt+0.2);});}

/* ---------- 遊戲狀態 ---------- */
let G=null;           // 目前這一局
const talking={inter:false,suspect:false};
const bubbles={inter:{text:'……',t0:0,shown:''},suspect:{text:'……',t0:0,shown:''}};
let disp={P:5,mood:10};

function newSession(st,myRole,online,looks){
 G={st,myRole,online,looks:looks||cfg.looks,pendingQ:null,busy:false,deadline:0,S:{inter:R.buildS((looks||cfg.looks).inter,'inter'),suspect:R.buildS((looks||cfg.looks).suspect,'suspect')}};
 disp={P:st.P,mood:st.mood};
 bubbles.inter={text:'……',t0:0,shown:''}; bubbles.suspect={text:'……',t0:0,shown:''};
 $('log').innerHTML='';
 renderGameStatic(); renderSide(); setInput(false,'準備中');
 $('resultBox').hidden=true; show('scrGame');
}
const C=()=>E.byId(G.st.caseId);
function interName(){const l=G.looks.inter;return (R.ANIMALS[l]?R.ANIMALS[l].name:'')+'警官';}

function say(who,text){
 return new Promise(res=>{
  bubbles[who]={text:text||'……',t0:performance.now()/1000,shown:''};
  talking[who]=true; window.Music&&Music.setDuck(true);
  let finished=false; const done=()=>{if(finished)return;finished=true;talking[who]=false;if(!talking.inter&&!talking.suspect&&window.Music)Music.setDuck(false);res();};
  const silent=!text||/^[…\s.。]*$/.test(text);
  if(!voiceOn||!hasTTS||silent||!voices.length){setTimeout(done,Math.min(3200,600+(text||'').length*70));return;}
  let c;
  if(who==='suspect') c=G.st.end==='broke'?VOICE[G.st.breakMode]:VOICE[Math.min(8,Math.floor(G.st.P/10))];
  else c=IVOICE[R.interStageIdx(G.st.mood,interFlag())];
  speakTTS(text,who,c||VOICE[0],done);
  setTimeout(done,3000+text.length*380);
 });
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));

function interFlag(){
 if(!G) return null;
 if(G.st.end==='broke') return 'win';
 if(G.st.end==='held') return 'lose';
 return G.st.P>=60?'smug':null;
}

/* ---------- 輸入列 ---------- */
function setInput(on,text){
 $('askInput').disabled=$('sendBtn').disabled=$('micBtn').disabled=!on;
 $('turnText').textContent=text||'';
 if(on){ $('askInput').placeholder=G.myRole==='inter'?'輸入你要問的話，或按麥克風說話':'輸入你的回答，或按麥克風說話'; if(window.matchMedia('(pointer:fine)').matches) $('askInput').focus(); }
 document.querySelectorAll('#evid button').forEach(b=>b.disabled=!on||G.myRole!=='inter'||b.dataset.used==='1');
}
$('askForm').addEventListener('submit',e=>{e.preventDefault();const v=$('askInput').value.trim();if(!v)return;$('askInput').value='';submit(v,null);});

async function submit(text,evidId){
 if(!G||G.busy||G.st.end) return;
 G.busy=true; setInput(false,'');
 if(G.myRole==='inter'){
  const q=E.parseQuestion(G.st,text,evidId);
  if(G.online&&sock){ sock.emit('ask',{text,evidId}); G.busy=false; return; }
  await say('inter',q.text);
  const res=E.resolve(G.st,q,null);
  await applyTurn(q,res,null);
 } else {
  const q=G.pendingQ; if(!q){G.busy=false;return;}
  if(G.online&&sock){ sock.emit('answer',{text}); G.busy=false; return; }
  G.pendingQ=null;
  const res=E.resolve(G.st,q,text);
  await applyTurn(q,res,text);
 }
 G.busy=false;
}

async function applyTurn(q,res,humanAnswer){
 logLine('q',ROLE_NAME.inter+'：'+q.text,res.gain);
 const suspectSays=res.confession&&humanAnswer==null?res.confession:res.reply;
 renderSide();
 await say('suspect',suspectSays);
 logLine('a',C().suspect.name+'：'+suspectSays);
 res.notes.forEach(n=>logLine('sys',n));
 res.unlocked.forEach(id=>{const e=C().evidence.find(x=>x.id===id);logLine('sys','新證物：「'+e.name+'」');});
 if(G.myRole==='suspect'&&!G.online&&res.interLine){ await say('inter',res.interLine); }
 renderSide();
 if(G.st.end){ await finish(res); return; }
 nextStep();
}

function nextStep(){
 if(!G||G.st.end) return;
 if(G.online){ setInput(false,'等待對手…'); return; }
 if(G.myRole==='inter') setInput(true,'輪到你發問');
 else aiAsk();
}
async function aiAsk(){
 const q=E.aiQuestion(G.st); G.pendingQ=q;
 setInput(false,'審問官正在發問…');
 await say('inter',q.text);
 setInput(true,'輪到你回答');
}

async function finish(res){
 setInput(false,'審訊結束');
 const st=G.st;
 if(window.Music&&music.on){ stopMusic(st.end==='broke'?0.6:2.5); if(st.end==='broke') Music.sting(audio(),'break'); }
 if(st.end==='broke'){ if(G.myRole==='suspect'&&res.confession&&!G.online) await say('suspect',res.confession); logLine('sys','嫌犯崩潰認罪！'); }
 else { await say('suspect',C().fail); logLine('a',C().suspect.name+'：'+C().fail); logLine('sys','回合用完，嫌犯撐過了審訊。'); }
 await wait(2600);
 showResult();
}

function showResult(){
 const st=G.st, sc=E.score(st,G.myRole), win=sc.win, c=C();
 $('rStamp').textContent=win?'勝利':'落敗';
 $('rStamp').style.color=$('rStamp').style.borderColor=win?'var(--ok)':'var(--alarm)';
 $('rTitle').textContent=G.myRole==='inter'?(win?'破案成功！':'嫌犯撐過了審訊'):(win?'你撐過了審訊！':'你被問到崩潰了');
 $('rScore').textContent=sc.total;
 $('rRank').textContent=(G.myRole==='inter'?'稱號：':'判決：')+sc.title;
 $('rParts').innerHTML=sc.parts.map(p=>`<div class="part"><span>${p[0]}</span><div class="bar"><div style="width:${Math.round(p[1]/p[2]*100)}%;background:var(--lamp)"></div></div><span>${p[1]} / ${p[2]}</span></div>`).join('');
 $('rText').textContent=(st.end==='broke'?c.ending.win:c.ending.lose)+'　使用 '+(st.limit-st.rounds)+' / '+st.limit+' 回合，回合加成 ×'+sc.mul+'。';
 const key='best.'+st.caseId+'.'+G.myRole, best=store.get(key,null);
 if(!best||sc.total>best.total){store.set(key,{total:sc.total,title:sc.title});$('rBest').textContent=best?'新紀錄！之前最高 '+best.total+' 分。':'這是你在這個案件的第一筆紀錄。';}
 else $('rBest').textContent='你的最高紀錄：'+best.total+' 分（'+best.title+'）';
 if(window.Music&&music.on) Music.sting(audio(),win?'win':'lose');
 $('resultBox').hidden=false; $('rAgain').focus();
}
$('rAgain').onclick=()=>{ if(G&&G.online) leaveOnline(); startSolo(); };
$('rCases').onclick=()=>{ stopMusic(1); if(G&&G.online) leaveOnline(); openSetup(cfg.mode); };
$('rHome').onclick=()=>{ stopMusic(1); if(G&&G.online) leaveOnline(); G=null; show('scrHome'); };
$('leaveBtn').onclick=()=>{ stopMusic(1); if(G&&G.online) leaveOnline(); G=null; if(hasTTS) speechSynthesis.cancel(); show('scrHome'); };

/* ---------- 畫面資訊 ---------- */
function logLine(cls,text,gain){
 const p=document.createElement('p'); p.className=cls; p.textContent=text;
 if(gain!=null){const g=document.createElement('span');g.className='gain'+(gain<0?' down':'');g.textContent=(gain>=0?'+':'')+gain+' 壓力';p.appendChild(g);}
 $('log').appendChild(p); $('log').scrollTop=$('log').scrollHeight;
}
function renderGameStatic(){
 const c=C();
 $('gTitle').innerHTML='';
 const sm=document.createElement('small'); sm.textContent=(G.online?'連線對戰':'單人遊戲')+'・你是'+ROLE_NAME[G.myRole]+'・'+'★'.repeat(c.stars)+'☆'.repeat(5-c.stars);
 $('gTitle').appendChild(sm); $('gTitle').appendChild(document.createTextNode(c.title));
 $('nameSus').textContent=c.suspect.name; $('baName').textContent=c.suspect.name;
 $('nameInter').textContent=interName(); $('bqName').textContent=interName();
 $('youInter').hidden=G.myRole!=='inter'; $('youSus').hidden=G.myRole!=='suspect';
 const f=$('fileBox'); f.innerHTML='';
 const add=(tag,cls,html)=>{const el=document.createElement(tag);if(cls)el.className=cls;el.innerHTML=html;f.appendChild(el);};
 add('p','',c.brief);
 add('p','note',`嫌犯：${c.suspect.name}（${c.suspect.age}歲，${c.suspect.job}）・個性：${E.PERS[c.suspect.type].name}`);
 if(G.myRole==='suspect'){ add('div','secret','<b>你的秘密（只有你知道）</b>'+c.secret); add('div','secret','<b>你準備好的說詞</b>'+c.cover); }
}
function renderSide(){
 if(!G) return;
 const st=G.st, c=C(), h=E.hints(st,G.myRole), ul=$('hints'); ul.innerHTML='';
 if(h.length) h.forEach(t=>{const li=document.createElement('li');li.textContent=t;ul.appendChild(li);});
 else {const li=document.createElement('li');li.className='idle';li.textContent=G.myRole==='inter'?'連續兩回合沒有進展時，這裡會出現建議。':'壓力連續上升時，這裡會提醒你怎麼應對。';ul.appendChild(li);}
 const ev=$('evid'); ev.innerHTML='';
 const locked=c.evidence.filter(e=>!st.unlocked.includes(e.id)).length;
 if(G.myRole==='inter'){
  $('evidLabel').textContent='證物（點擊出示）';
  for(const e of c.evidence.filter(e=>st.unlocked.includes(e.id))){
   const b=document.createElement('button'); b.type='button'; b.className=st.used[e.id]?'done':''; b.dataset.used=st.used[e.id]?'1':'0';
   b.innerHTML=`<strong>${e.name}<em>${st.used[e.id]?'已出示':'可出示'}</em></strong><span>${e.desc}</span>`;
   b.onclick=()=>submit('',e.id); b.disabled=true; ev.appendChild(b);
  }
  if(locked){const d=document.createElement('div');d.className='locked';d.textContent='還有 '+locked+' 件證物尚未取得，會隨審訊進度出現。';ev.appendChild(d);}
 } else {
  $('evidLabel').textContent='警方出示過的證物';
  const shown=c.evidence.filter(e=>st.used[e.id]);
  for(const e of shown){const d=document.createElement('div');d.className='ev';d.innerHTML=`<strong>${e.name}</strong><span>${e.desc}</span>`;ev.appendChild(d);}
  const left=c.evidence.length-shown.length;
  if(left){const d=document.createElement('div');d.className='locked';d.textContent='警方手上可能還有 '+left+' 件你不知道的證物。';ev.appendChild(d);}
 }
 const frac=st.rounds/st.limit, tier=frac>=2/3?['充裕','#203a2a','#8be0a8','#6fbf8a']:frac>=1/3?['普通','#3a3016','#f0cf7a','#e8a93a']:['緊迫','#3e2020','#f19a8e','#d9483b'];
 $('roundNum').textContent=st.rounds; const tt=$('tierTag'); tt.textContent=tier[0]; tt.style.background=tier[1]; tt.style.color=tier[2];
 $('roundBar').style.width=Math.round(frac*100)+'%'; $('roundBar').style.background=tier[3];
}

/* ---------- 單人 ---------- */
async function startSolo(){
 if(!voiceOn) toggleVoice(true);
 const st=E.newGame(cfg.caseId,cfg.limit);
 newSession(st,cfg.role,false,cfg.looks); startMusic();
 logLine('sys','審訊開始。'+(cfg.role==='inter'?'你是審問官，讓嫌犯在 '+cfg.limit+' 回合內崩潰認罪。':'你是嫌犯，撐過 '+cfg.limit+' 回合不認罪就贏了。'));
 if(cfg.role==='inter'){ await say('suspect',C().open); logLine('a',C().suspect.name+'：'+C().open); setInput(true,'輪到你發問'); }
 else aiAsk();
}

/* ---------- 連線對戰 ---------- */
let sock=null, quickTimer=null, lobbyMode=null;
const onlineOK=()=>typeof window.io==='function';
function ensureSock(){
 if(sock) return sock;
 sock=window.io({transports:['websocket','polling']});
 sock.on('start',async m=>{
  clearInterval(quickTimer); if(!voiceOn) toggleVoice(true);
  newSession(m.state,m.role,true,m.looks); startMusic();
  logLine('sys','對手已加入！你是'+ROLE_NAME[m.role]+'。');
  await say('suspect',C().open); logLine('a',C().suspect.name+'：'+C().open);
  if(m.role==='inter') setInput(true,'輪到你發問'); else setInput(false,'等待審問官發問…');
 });
 sock.on('question',async m=>{
  if(!G||!G.online) return;
  G.pendingQ=m.q; G.deadline=m.deadline||0;
  await say('inter',m.q.text);
  if(G.myRole==='suspect') setInput(true,'輪到你回答'); else setInput(false,'等待嫌犯回答…');
 });
 sock.on('turn',async m=>{
  if(!G||!G.online) return;
  G.st=m.state; G.deadline=m.deadline||0; G.pendingQ=null;
  await applyTurn({text:m.res.q},m.res,m.res.reply);
  if(!G.st.end&&G.online) setInput(G.myRole==='inter',G.myRole==='inter'?'輪到你發問':'等待審問官發問…');
 });
 sock.on('opponentLeft',async m=>{
  if(!G||!G.online) return;
  toast('對手離線了，改由電腦接手繼續。');
  G.online=false; G.deadline=0; if(m.state) G.st=m.state;
  logLine('sys','對手離線，改由電腦接手。');
  if(G.st.end) return;
  if(G.myRole==='suspect'){ if(m.pending){G.pendingQ=m.pending; setInput(true,'輪到你回答');} else aiAsk(); }
  else { if(m.pending){const res=E.resolve(G.st,m.pending,null); await applyTurn(m.pending,res,null);} else setInput(true,'輪到你發問'); }
 });
 sock.on('connect_error',()=>{ if(!$('scrLobby').hidden){ $('lobbyText').textContent='連不上伺服器，改由電腦對戰吧。'; } });
 return sock;
}
function leaveOnline(){ if(sock){sock.emit('leave');} clearInterval(quickTimer); if(G) G.online=false; }
function lobby(title,text,code){
 $('lobbyTitle').textContent=title; $('lobbyText').textContent=text||'';
 $('lobbyCode').hidden=!code; $('lobbyCode').textContent=code||''; show('scrLobby');
}
$('quickBtn').onclick=()=>{
 if(!onlineOK()) return;
 audio(); ensureSock(); lobbyMode='quick';
 sock.emit('quick',{role:cfg.role,caseId:cfg.caseId,limit:cfg.limit,look:cfg.looks[cfg.role]});
 let left=20; lobby('尋找對手中…','還有 '+left+' 秒，找不到真人就改由電腦對戰。');
 clearInterval(quickTimer);
 quickTimer=setInterval(()=>{left--; $('lobbyText').textContent='還有 '+left+' 秒，找不到真人就改由電腦對戰。'; if(left<=0){clearInterval(quickTimer); sock.emit('cancelQuick'); toast('沒有找到真人對手，改由電腦對戰。'); startSolo();}},1000);
};
$('createBtn').onclick=()=>{
 if(!onlineOK()) return;
 audio(); ensureSock(); lobbyMode='room';
 sock.emit('create',{role:cfg.role,caseId:cfg.caseId,limit:cfg.limit,look:cfg.looks[cfg.role]},r=>{
  if(!r||!r.ok){toast('建立房間失敗，請再試一次。');return;}
  lobby('把房號告訴朋友','朋友在「連線對戰」輸入這個房號就能加入。你是'+ROLE_NAME[cfg.role]+'。',r.code);
 });
};
$('joinBtn').onclick=()=>{
 if(!onlineOK()) return;
 const code=$('joinCode').value.trim().toUpperCase(); if(code.length<4){toast('請輸入 4 碼房號。');return;}
 audio(); ensureSock();
 sock.emit('join',{code,look:null},r=>{ if(!r||!r.ok) toast(r&&r.msg?r.msg:'加入失敗。'); });
};
$('lobbyAI').onclick=()=>{ clearInterval(quickTimer); if(sock){sock.emit('cancelQuick');sock.emit('leave');} startSolo(); };
$('lobbyCancel').onclick=()=>{ clearInterval(quickTimer); if(sock){sock.emit('cancelQuick');sock.emit('leave');} openSetup('online'); };

/* ---------- 麥克風（台灣中文） ---------- */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let rec=null, listening=false;
function micMsg(t){$('micNote').textContent=t;$('micNote').hidden=!t;}
$('micBtn').onclick=()=>{
 if(!SR){micMsg('這個瀏覽器不支援語音輸入，請改用 Chrome、Edge 或 Safari，或先用打字。');return;}
 if(listening){rec.stop();return;}
 if(hasTTS) speechSynthesis.cancel();
 rec=new SR(); rec.lang='zh-TW'; rec.interimResults=true; rec.continuous=false;
 let finalText='';
 rec.onresult=e=>{let s='';for(let i=0;i<e.results.length;i++) s+=e.results[i][0].transcript; $('askInput').value=s; if(e.results[e.results.length-1].isFinal) finalText=s;};
 rec.onerror=e=>{
  if(e.error==='not-allowed'||e.error==='service-not-allowed') micMsg('麥克風被封鎖了。預覽頁面不能使用麥克風，把遊戲放到你自己的網站後就能用語音。現在請先用打字。');
  else if(e.error==='no-speech') micMsg('沒有聽到聲音，請再按一次麥克風說話。');
  else micMsg('語音辨識失敗，請再試一次或改用打字。');
 };
 rec.onend=()=>{listening=false;$('micBtn').classList.remove('on');$('micBtn').setAttribute('aria-label','語音輸入');
  if(finalText){$('askInput').value='';submit(finalText,null);}};
 try{rec.start();listening=true;$('micBtn').classList.add('on');$('micBtn').setAttribute('aria-label','停止收音');micMsg('');}
 catch(err){micMsg('無法啟動麥克風，請改用打字。');}
};

/* ---------- 設定畫面 ---------- */
function segButtons(box,items,cur,onPick){
 box.innerHTML='';
 for(const it of items){const b=document.createElement('button');b.type='button';b.textContent=it.name;b.setAttribute('aria-pressed',it.id===cur);
  b.onclick=()=>{onPick(it.id);for(const x of box.children)x.setAttribute('aria-pressed',x===b);};box.appendChild(b);}
}
function renderSetup(){
 const list=$('caseList'); list.innerHTML='';
 for(const c of E.CASES){
  const b=document.createElement('button'); b.type='button'; b.className='caseBtn'; b.setAttribute('aria-pressed',c.id===cfg.caseId);
  const bi=store.get('best.'+c.id+'.inter',null), bs=store.get('best.'+c.id+'.suspect',null);
  const rec=[bi?'審問官最高 '+bi.total+' 分（'+bi.title+'）':'',bs?'嫌犯最高 '+bs.total+' 分（'+bs.title+'）':''].filter(Boolean).join('・');
  b.innerHTML=`<strong>${c.title}</strong><span class="st" aria-label="難度${c.stars}星">${'★'.repeat(c.stars)}${'☆'.repeat(5-c.stars)}</span>
   <small>嫌犯 ${c.suspect.name}・${E.PERS[c.suspect.type].name}・當嫌犯的難度 ${'★'.repeat(6-c.stars)}${rec?'<br>'+rec:''}</small>`;
  b.onclick=()=>{cfg.caseId=c.id;saveCfg();for(const x of list.children)x.setAttribute('aria-pressed',x===b);};
  list.appendChild(b);
 }
 segButtons($('roleSeg'),[{id:'inter',name:'審問官'},{id:'suspect',name:'嫌犯'}],cfg.role,v=>{cfg.role=v;saveCfg();});
 segButtons($('limitSeg'),[{id:10,name:'短局 10 回合'},{id:20,name:'標準 20 回合'},{id:30,name:'長局 30 回合'}],cfg.limit,v=>{cfg.limit=v;saveCfg();});
 segButtons($('lookInter'),R.LOOKS,cfg.looks.inter,v=>{cfg.looks.inter=v;saveCfg();pv.inter=R.buildS(v,'inter');});
 segButtons($('lookSus'),R.LOOKS,cfg.looks.suspect,v=>{cfg.looks.suspect=v;saveCfg();pv.suspect=R.buildS(v,'suspect');});
 pv.inter=R.buildS(cfg.looks.inter,'inter'); pv.suspect=R.buildS(cfg.looks.suspect,'suspect');
}
const pv={inter:null,suspect:null};
function openSetup(mode){
 cfg.mode=mode; renderSetup();
 $('setupTitle').innerHTML=''; const sm=document.createElement('small'); sm.textContent='準備開庭'; $('setupTitle').appendChild(sm);
 $('setupTitle').appendChild(document.createTextNode(mode==='solo'?'單人遊戲':'連線對戰'));
 $('soloActions').hidden=mode!=='solo'; $('onlineActions').hidden=mode==='solo';
 const ok=onlineOK(); $('onlineWarn').hidden=ok; ['quickBtn','createBtn','joinBtn'].forEach(id=>$(id).disabled=!ok);
 show('scrSetup');
}
$('goSolo').onclick=()=>openSetup('solo');
$('goOnline').onclick=()=>openSetup('online');
$('setupBack').onclick=()=>show('scrHome');
$('startSolo').onclick=()=>startSolo();

/* ---------- 心電圖 ---------- */
const cv=$('ecg'), cx=cv.getContext('2d');
function sizeECG(){const r=cv.getBoundingClientRect(),d=window.devicePixelRatio||1;cv.width=Math.max(1,Math.round(r.width*d));cv.height=Math.max(1,Math.round(r.height*d));}
addEventListener('resize',sizeECG);
function ecgY(p){if(p<0.08)return Math.sin(p/0.08*Math.PI)*0.12;if(p<0.12)return 0;if(p<0.14)return -0.2*(p-0.12)/0.02;if(p<0.17)return -0.2+1.2*(p-0.14)/0.03;
 if(p<0.2)return 1-1.4*(p-0.17)/0.03;if(p<0.22)return -0.4+0.4*(p-0.2)/0.02;if(p<0.42)return 0;if(p<0.56)return Math.sin((p-0.42)/0.14*Math.PI)*0.25;return 0;}
let bpm=70;
function drawECG(t){
 const W=cv.width,H=cv.height,d=window.devicePixelRatio||1; if(W<4){sizeECG();return;}
 cx.clearRect(0,0,W,H); cx.strokeStyle='rgba(79,220,128,0.09)';cx.lineWidth=1;cx.beginPath();
 for(let x=0;x<W;x+=12*d){cx.moveTo(x,0);cx.lineTo(x,H);} for(let y=0;y<H;y+=12*d){cx.moveTo(0,y);cx.lineTo(W,y);} cx.stroke();
 cx.beginPath(); const sp=W/3;
 for(let x=0;x<=W;x+=2){const tt=t-(W-x)/sp, ph=((tt*bpm/60)%1+1)%1, y=H*0.62-ecgY(ph)*H*0.48; x?cx.lineTo(x,y):cx.moveTo(x,y);}
 cx.strokeStyle=bpm>150?'#ff6a5a':'#4fdc80'; cx.lineWidth=1.6*d; cx.stroke();
}

/* ---------- 主迴圈 ---------- */
const homeS={inter:R.buildS('dog','inter'),suspect:R.buildS('comic','suspect')};
let last=performance.now()/1000, prevJump=0, nextBeat=0, shownKey='';
function loop(now){
 const t=now/1000, dt=Math.min(0.1,t-last); last=t;
 if(!$('scrHome').hidden){
  const p=50+45*Math.sin(t*0.25);
  R.render($('homeInter'),homeS.inter,R.interState(clamp(p-10,0,100),p>60?'smug':null,t,false),t);
  R.render($('homeSus'),homeS.suspect,R.suspectState(clamp(p,0,89),'cry',t,false),t,'cry');
 } else if(!$('scrSetup').hidden&&pv.inter){
  const p=50+45*Math.sin(t*0.3);
  R.render($('pvInter'),pv.inter,R.interState(clamp(100-p,0,100),null,t,false),t);
  R.render($('pvSus'),pv.suspect,R.suspectState(clamp(p,0,89),'cry',t,false),t,'cry');
 } else if(G&&!$('scrGame').hidden){
  const st=G.st;
  disp.P+=(st.P-disp.P)*Math.min(1,dt*2.2); disp.mood+=(st.mood-disp.mood)*Math.min(1,dt*2.2);
  const flag=interFlag(), ss=R.suspectState(disp.P,st.breakMode,t,talking.suspect), is=R.interState(disp.mood,flag,t,talking.inter);
  R.render($('svgSus'),G.S.suspect,ss,t,st.breakMode); R.render($('svgInter'),G.S.inter,is,t);
  for(const who of ['inter','suspect']){const b=bubbles[who], n=Math.min(b.text.length,Math.floor((t-b.t0)*16)+1), s=b.text.slice(0,n);
   if(s!==b.shown){$(who==='inter'?'sayInter':'saySus').textContent=s;b.shown=s;}}
  const key=ss.stage+'|'+is.stage+'|'+Math.round(disp.P)+'|'+Math.round(disp.mood)+'|'+st.breakMode;
  if(key!==shownKey){shownKey=key;
   const ch=$('chipSus'); ch.textContent=ss.stage===9?'破防・'+R.BREAK_NAMES[st.breakMode]:R.SUS_STAGES[ss.stage].name; ch.style.background=SC[ss.stage]; ch.style.color=ss.stage>=8?'#fff':'#14100a';
   $('valSus').textContent='壓力 '+Math.round(disp.P)+'%'; $('barSus').style.width=Math.max(2,disp.P)+'%'; $('barSus').style.background=SC[ss.stage];
   const ci=$('chipInter'); ci.textContent=R.INTER_STAGES[is.stage].name; ci.style.background=IC[is.stage]; ci.style.color=is.stage===6?'#fff':'#0e1218';
   $('valInter').textContent='怒氣 '+Math.round(disp.mood)+'%'; $('barInter').style.width=Math.max(2,disp.mood)+'%'; $('barInter').style.background=IC[is.stage];
  }
  bpm=st.breakMode==='mad'&&st.end==='broke'?74:Math.round(64+disp.P*1.1+(ss.stage===9?22:0)); $('bpm').textContent=bpm;
  drawECG(t);
  if(window.Music) Music.setTension(disp.P/100);
  const jump=ss.cupJump||is.cupJump; if(jump&&!prevJump) thud(); prevJump=jump;
  if(voiceOn&&disp.P>=55&&t>=nextBeat){beat(0.4+0.6*ramp(disp.P,55,100));nextBeat=t+60/Math.max(40,bpm);}
  if(G.online&&G.deadline){const s=Math.max(0,Math.round((G.deadline-Date.now())/1000));$('timer').textContent=s+' 秒';} else $('timer').textContent='';
 }
 requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
})();
