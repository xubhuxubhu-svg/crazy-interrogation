/* 瘋狂審訊室・連線對戰伺服器：房間、快速配對、回合計時，判定邏輯和前端共用 engine.js */
const path=require('path');
const http=require('http');
const express=require('express');
const {Server}=require('socket.io');
const Engine=require('./public/engine.js');

const PORT=process.env.PORT||3000;
const TURN_MS=75000;          // 每次發言的時間限制
const app=express();
app.use(express.static(path.join(__dirname,'public')));
app.get('/health',(req,res)=>res.send('ok'));
const server=http.createServer(app);
const io=new Server(server,{cors:{origin:'*'}});

const rooms=new Map();
let queue=[];
const other=r=>r==='inter'?'suspect':'inter';
function newCode(){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let c;do{c=Array.from({length:4},()=>A[Math.floor(Math.random()*A.length)]).join('');}while(rooms.has(c));return c;}
function roomOf(sock){return sock.data.room?rooms.get(sock.data.room):null;}

function makeRoom(caseId,limit){
 const r={code:newCode(),caseId:Engine.byId(caseId).id,limit:[10,20,30].includes(limit)?limit:20,seats:{inter:null,suspect:null},looks:{inter:'dog',suspect:'comic'},state:null,pending:null,timer:null,created:Date.now()};
 rooms.set(r.code,r); return r;
}
function seat(r,sock,role,look){
 r.seats[role]=sock.id; if(look) r.looks[role]=look;
 sock.join(r.code); sock.data.room=r.code; sock.data.role=role;
}
function begin(r){
 r.state=Engine.newGame(r.caseId,r.limit);
 for(const role of ['inter','suspect']) io.to(r.seats[role]).emit('start',{role,state:r.state,looks:r.looks,code:r.code});
 arm(r,'inter');
}
function arm(r,who){
 clearTimeout(r.timer); r.deadline=Date.now()+TURN_MS;
 r.timer=setTimeout(()=>{
  if(!rooms.has(r.code)||!r.state||r.state.end) return;
  if(who==='inter'&&!r.pending){ ask(r,Engine.aiQuestion(r.state)); }
  else if(who==='suspect'&&r.pending){ answer(r,''); }
 },TURN_MS);
}
function ask(r,q){
 r.pending=q; arm(r,'suspect');
 io.to(r.code).emit('question',{q,deadline:r.deadline});
}
function answer(r,text){
 const q=r.pending; if(!q) return;
 r.pending=null;
 const res=Engine.resolve(r.state,q,String(text||'').slice(0,200));
 if(!r.state.end) arm(r,'inter'); else clearTimeout(r.timer);
 io.to(r.code).emit('turn',{res,state:r.state,deadline:r.state.end?0:r.deadline});
 if(r.state.end) setTimeout(()=>close(r),60000);
}
function close(r){clearTimeout(r.timer);rooms.delete(r.code);}
function leave(sock){
 queue=queue.filter(q=>q.sock.id!==sock.id);
 const r=roomOf(sock); if(!r) return;
 sock.leave(r.code); sock.data.room=null;
 if(r.state&&!r.state.end) sock.to(r.code).emit('opponentLeft',{state:r.state,pending:r.pending});
 close(r);
}

io.on('connection',sock=>{
 sock.on('create',(o,cb)=>{
  leave(sock); o=o||{};
  const role=o.role==='suspect'?'suspect':'inter', r=makeRoom(o.caseId,o.limit);
  seat(r,sock,role,o.look);
  cb&&cb({ok:true,code:r.code,role});
 });
 sock.on('join',(o,cb)=>{
  const r=rooms.get(String((o&&o.code)||'').toUpperCase());
  if(!r) return cb&&cb({ok:false,msg:'找不到這個房間，請確認房號。'});
  const free=['inter','suspect'].find(k=>!r.seats[k]);
  if(!free||r.state) return cb&&cb({ok:false,msg:'這個房間已經開始了。'});
  seat(r,sock,free,o&&o.look);
  cb&&cb({ok:true,role:free,code:r.code});
  begin(r);
 });
 sock.on('quick',o=>{
  leave(sock); o=o||{};
  const want=o.role==='suspect'?'suspect':'inter';
  const i=queue.findIndex(q=>q.sock.connected&&q.want!==want);
  const j=i>=0?i:queue.findIndex(q=>q.sock.connected);
  if(j>=0){
   const mate=queue.splice(j,1)[0];
   const r=makeRoom(mate.o.caseId,mate.o.limit);
   const mateRole=mate.want, myRole=other(mateRole);
   seat(r,mate.sock,mateRole,mate.o.look); seat(r,sock,myRole,o.look);
   begin(r);
  } else queue.push({sock,o,want});
 });
 sock.on('cancelQuick',()=>{queue=queue.filter(q=>q.sock.id!==sock.id);});
 sock.on('ask',o=>{
  const r=roomOf(sock); if(!r||!r.state||r.state.end||sock.data.role!=='inter'||r.pending) return;
  const text=String((o&&o.text)||'').slice(0,200);
  ask(r,Engine.parseQuestion(r.state,text,o&&o.evidId));
 });
 sock.on('answer',o=>{
  const r=roomOf(sock); if(!r||!r.state||r.state.end||sock.data.role!=='suspect'||!r.pending) return;
  answer(r,o&&o.text);
 });
 sock.on('leave',()=>leave(sock));
 sock.on('disconnect',()=>leave(sock));
});

setInterval(()=>{const now=Date.now();for(const r of rooms.values()) if(now-r.created>3*3600*1000) close(r);},600000);
server.listen(PORT,()=>console.log('瘋狂審訊室伺服器啟動，埠號 '+PORT));
