/* 瘋狂審訊室・角色繪製引擎：人類三種畫風＋六種動物，嫌犯與審問官共用同一套表情骨架 */
(function(root){
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ramp=(p,a,b)=>clamp((p-a)/(b-a),0,1);
const lerp=(a,b,k)=>a+(b-a)*k;
const f=n=>Math.round(n*10)/10;
const rnd=i=>{const x=Math.sin(i*12.9898)*43758.5453;return x-Math.floor(x);};
const reduce=typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches;

const HUMAN={
 comic:{wall:'#efdcae',wall2:'#e2c98f',bgLine:'#d6b468',mirror:'#3c4a52',frame:'#15130f',clock:'#fff6df',table:'#6e4f33',tableTop:'#a07a52',
  ol:'#15130f',ow:3,skin:'#f6c9a0',shade:'#eaae82',hair:'#1f1d22',browC:'#15130f',shirt:'#3d6fb6',collar:'#2b5592',
  hx:200,hy:148,rx:58,ry:68,eyeDx:22,eyeDy:-2,eyeR:12.5,pupil:3.4,browGap:19,browL:24,browW:5,mouthY:42,mouthW:28,noseY:16,
  handR:15,shoulderW:80,shoulderY:236,neckW:30,earY:4,earR:12,armW:24,sweatC:'#9fd3f0',sweatS:7,cup:'#fffdf5',cupBand:'#d9483b',folder:'#e7c46a',
  cone:'#fff3c4',coneO:0.2,lampShade:'#2f6b4f',fxFill:'#ffffff',fxStroke:'#15130f',fxSW:5,tearW:6,font:900,board:'#b98b55'},
 chibi:{wall:'#e7e1f6',wall2:'#d9d0f0',bgLine:'#cfc4ee',mirror:'#8d86b8',frame:'#5a3d33',clock:'#ffffff',table:'#b77a4b',tableTop:'#dda574',
  ol:'#5a3d33',ow:2.6,skin:'#ffe0c7',shade:'#f6c8a6',hair:'#6b4a3a',browC:'#6b4a3a',shirt:'#f08a5d',collar:'#d86d40',
  hx:200,hy:156,rx:86,ry:80,eyeDx:31,eyeDy:14,eyeR:12.5,pupil:3,browGap:24,browL:18,browW:4,mouthY:44,mouthW:20,noseY:30,
  handR:14,shoulderW:56,shoulderY:246,neckW:24,earY:14,earR:13,armW:20,sweatC:'#8fd0f2',sweatS:8,cup:'#ffffff',cupBand:'#f08a5d',folder:'#9fd3c0',
  cone:'#ffffff',coneO:0.18,lampShade:'#f2b6c6',fxFill:'#ffffff',fxStroke:'#6b4a3a',fxSW:5,tearW:7,font:900,board:'#e0b48a'},
 real:{wall:'#3a3f46',wall2:'#30343a',bgLine:'#444a52',mirror:'#1d2328',frame:'#22262b',clock:'#d9d4c8',table:'#2e2a26',tableTop:'#4b453e',
  ol:'#3e2c22',ow:1.2,skin:'#c9a183',shade:'#a97e60',hair:'#262120',browC:'#2a2320',shirt:'#5a646e',collar:'#e6e2da',
  hx:200,hy:146,rx:50,ry:64,eyeDx:19,eyeDy:-3,eyeR:8.5,pupil:3,browGap:12,browL:21,browW:3.6,mouthY:39,mouthW:22,noseY:16,
  handR:12,shoulderW:90,shoulderY:236,neckW:30,earY:2,earR:10,armW:26,sweatC:'#dbe7ee',sweatS:4.5,cup:'#d8d3c8',cupBand:'#8a4a3a',folder:'#b49a64',
  cone:'#ffd894',coneO:0.12,lampShade:'#1e2226',fxFill:'#e9e2d0',fxStroke:'#1a1d21',fxSW:3,tearW:3.5,font:700,board:'#5a4a38'}
};
const ANIMALS={
 fox:{name:'狐狸',fur:'#e8833a',dark:'#c4642a',muzzle:'#fff4e6',ear:'pointy',inner:'#3a2a22',nose:'#2a1d18'},
 raccoon:{name:'浣熊',fur:'#9097a1',dark:'#6b717b',muzzle:'#eef0f2',ear:'round',inner:'#5b6068',mask:'#2b2d33',nose:'#1d1e22',whisk:true},
 cat:{name:'貓咪',fur:'#f0a54a',dark:'#d4842c',muzzle:'#fff5e8',ear:'tri',inner:'#f5b5a8',stripes:true,nose:'#e07a7a',whisk:true},
 dog:{name:'柴犬',fur:'#e0a15c',dark:'#c27f3a',muzzle:'#fff8ee',ear:'tri',inner:'#f6d6b8',nose:'#2a1d18'},
 bear:{name:'熊',fur:'#8a5a3b',dark:'#6d452c',muzzle:'#d8b08c',ear:'round',inner:'#c89a74',nose:'#2a1d18'},
 rabbit:{name:'兔子',fur:'#f4f1ee',dark:'#ddd6d0',muzzle:'#ffffff',ear:'long',inner:'#f5b5c2',nose:'#e88a9a',whisk:true}
};
const LOOKS=[{id:'comic',name:'漫畫風'},{id:'chibi',name:'可愛Q版'},{id:'real',name:'寫實風'},{id:'fox',name:'狐狸'},{id:'raccoon',name:'浣熊'},{id:'cat',name:'貓咪'},{id:'dog',name:'柴犬'},{id:'bear',name:'熊'},{id:'rabbit',name:'兔子'}];

function buildS(id,role){
 let S;
 if(HUMAN[id]) S=Object.assign({},HUMAN[id],{kind:id});
 else {
  const A=ANIMALS[id]||ANIMALS.fox;
  S=Object.assign({},HUMAN.comic,{kind:'animal',animal:id,A,skin:A.fur,shade:A.dark,hair:A.fur,browC:'#2a1d18',ol:'#2a1d18',
   rx:62,ry:58,hy:152,eyeDx:22,eyeDy:-8,eyeR:11,browGap:15,mouthY:34,mouthW:20,earY:0,shirt:'#5b6f8c',collar:'#465a76'});
 }
 S.role=role;
 if(role==='inter'){
  S.shirt=S.kind==='real'?'#d8d6cf':'#ecebe4'; S.collar='#ffffff'; S.tie=S.kind==='chibi'?'#3d6fb6':'#b8322f';
  if(S.kind!=='animal'){S.hair=S.kind==='real'?'#3a2c22':'#3b2a20';S.neat=true;}
 }
 return S;
}

/* ---------- 嫌犯：由壓力值算出所有部件參數 ---------- */
function baseState(P){
 return {P,stage:0,brow:0,raise:0,open:1,pupil:1,gx:0,gy:0,sweat:0,trem:0,red:0,tearWell:false,headDY:0,tilt:0,mouth:'flat',pose:'table',fx:null,
  shake:0,flash:0,blinkP:3.4,lampSwing:0,cupJump:0,eyeMode:'normal',blush:0,veins:false,shadow:0,streams:false,scale:1,big2:1,k:0,flicker:false,slamDown:false,gloom:0,sparkle:false};
}
function suspectState(P,mode,t,talking){
 const s=P>=90?9:Math.floor(P/10), st=baseState(P);
 Object.assign(st,{stage:s,brow:ramp(P,15,70),raise:(1-ramp(P,0,20))*7,open:0.6+0.4*ramp(P,5,40)+0.25*ramp(P,70,88),
  pupil:1-0.45*ramp(P,55,88),sweat:clamp(Math.floor((P-26)/9),0,7),trem:ramp(P,40,88)*2.2,red:ramp(P,62,85),
  tearWell:s===7,headDY:s===0?-8:(s>=3?4:0),tilt:s===0?-5:0,blush:ramp(P,55,85),gloom:ramp(P,50,100)});
 switch(s){
  case 0: st.mouth='smirk';st.pose='behindHead'; if(t%5<1.1){st.gy=-0.9;st.gx=0.3;} break;
  case 1: { const sigh=t%4<0.9; st.mouth=sigh?'o':'flat';st.pose='tap'; if(sigh) st.fx={text:'唉～',x:292,y:118,size:22,rot:-8}; if(t%6>3.5){st.gx=0.9;st.gy=-0.6;} break; }
  case 2: st.mouth='frown';st.pose='crossed';st.gx=-0.75;st.gy=0.2; break;
  case 3: { const g=t%3.2<0.5; st.mouth=g?'tight':'frown';st.pose='clasp';st.gx=Math.sin(t*1.3)*0.6; if(g) st.fx={text:'咕嘟',x:290,y:214,size:18,rot:6}; break; }
  case 4: st.mouth='wavy';st.pose=(t%3.6<1.3)?'wipe':'clasp';st.gx=Math.sin(t*2.2)*0.7; break;
  case 5: st.mouth='wavy';st.pose='fidget';st.blinkP=0.75;st.gx=Math.sign(Math.sin(t*3.1))*0.8;st.gy=Math.sin(t*1.7)*0.4; break;
  case 6: st.mouth='o';st.pose='scratch';st.gy=0.5;st.gx=-0.3; break;
  case 7: st.mouth='wavyOpen';st.pose='shaky';st.gy=0.7; break;
  case 8: slamCycle(st,t,2.6); break;
  case 9: breakdown(st,t,mode); break;
 }
 finish(st,t,talking);
 return st;
}
function slamCycle(st,t,len){
 const c=(t%len)/len; st.brow=-0.6;
 if(c<0.33){st.pose='raise';st.k=c/0.33;st.mouth='shout';st.veins=true;}
 else if(c<0.7){st.pose='slam';st.mouth='shout';st.veins=true;st.fx={text:'砰！',x:300,y:250,size:40,rot:-10};
  st.shake=c<0.42?6:ramp(0.7-c,0,0.28)*4;st.cupJump=c<0.42?1:0;st.lampSwing=c<0.42?1:1-(c-0.42)/0.28;}
 else {st.pose='slam';st.mouth='flat';st.gy=0.4;st.brow=0.6;}
}
function breakdown(st,t,mode){
 st.sweat=6;
 if(mode==='cry'){
  Object.assign(st,{eyeMode:'squeeze',brow:1.4,mouth:'wail',pose:'face',streams:true,headDY:14+Math.abs(Math.sin(t*5))*5,trem:0.6,tilt:Math.sin(t*5)*2,blush:1});
  if(t%2<1) st.fx={text:'嗚嗚……',x:300,y:108,size:24,rot:8};
 } else if(mode==='hyst'){
  Object.assign(st,{eyeMode:'wide',open:1.4,pupil:0.35,brow:1.3,mouth:'scream',pose:'hair',trem:4.5,shake:2.5,flash:0.16+0.1*Math.sin(t*14),blush:1});
  st.fx={text:'啊啊啊——！',x:298,y:95,size:30,rot:-12,jit:true};
 } else if(mode==='mad'){
  Object.assign(st,{eyeMode:'mad',open:1.35,pupil:0.3,big2:1.25,brow:-0.3,raise:9,mouth:'grin',pose:'spread',trem:0.4,tilt:Math.sin(t*1.1)*14,shadow:0.45,sweat:0,blush:0,headDY:2,flicker:true});
  st.fx={text:(t%1.2<0.6)?'哈哈哈哈':'呵呵呵……',x:312,y:104+Math.sin(t*3)*6,size:24,rot:10};
 } else {
  Object.assign(st,{eyeMode:'angry',open:1.2,pupil:0.5,brow:-1.2,mouth:'shout',pose:'fists',veins:true,scale:1.08,headDY:10,trem:1.5});
  const c=(t%1.8)/1.8;
  if(c<0.12){st.shake=7;st.cupJump=1;st.lampSwing=1;st.slamDown=true;st.fx={text:'碰！！',x:300,y:256,size:44,rot:-8};}
  else {st.lampSwing=Math.max(0,1-(c-0.12)*3);st.fx={text:'是我又怎樣！',x:290,y:95,size:26,rot:-6};}
 }
}
function finish(st,t,talking){
 if(st.eyeMode==='normal'){ const ph=(t+0.7)%st.blinkP; if(ph<0.13) st.open=0; }
 if(talking&&['flat','frown','smirk','tight','wavy'].includes(st.mouth)) st.mouth='talk';
}

/* ---------- 審問官：由怒氣值與局勢算出參數 ---------- */
const INTER_STAGES=[
 {id:'calm',name:'冷靜',desc:'翻著筆記，從容記錄'},
 {id:'focus',name:'專注',desc:'身體前傾，緊盯嫌犯'},
 {id:'smug',name:'胸有成竹',desc:'抱胸冷笑，勝券在握'},
 {id:'impatient',name:'不耐煩',desc:'手指敲桌、嘆氣'},
 {id:'annoyed',name:'惱怒',desc:'皺眉，指著嫌犯質問'},
 {id:'furious',name:'火大',desc:'拍桌大吼'},
 {id:'rage',name:'暴怒',desc:'雙拳搥桌、青筋暴起'},
 {id:'win',name:'破案得意',desc:'握拳慶祝'},
 {id:'lose',name:'挫敗',desc:'扶額嘆氣'}
];
function interStageIdx(m,flag){
 if(flag==='win') return 7; if(flag==='lose') return 8;
 if(flag==='smug'&&m<45) return 2;
 return m<15?0:m<30?1:m<50?3:m<70?4:m<85?5:6;
}
function interState(m,flag,t,talking){
 const st=baseState(m), idx=interStageIdx(m,flag); st.stage=idx; st.sweat=0;
 switch(INTER_STAGES[idx].id){
  case 'calm': st.mouth='flat';st.pose='notes';st.brow=0.1;st.open=0.9;st.gy=(t%5<3.5)?0.6:0;st.gx=-0.2; break;
  case 'focus': st.mouth='flat';st.pose='lean';st.brow=-0.2;st.gx=-0.75;st.headDY=6;st.scale=1.04; break;
  case 'smug': st.mouth='smirk';st.pose='crossed';st.raise=7;st.open=0.72;st.gx=-0.6; break;
  case 'impatient': { const sigh=t%4<0.9; st.mouth=sigh?'o':'frown';st.pose='tap';st.brow=0.3;st.gy=sigh?-0.7:0;st.gx=-0.4; if(sigh) st.fx={text:'唉……',x:300,y:118,size:22,rot:-8}; break; }
  case 'annoyed': st.mouth=(t%2.4<1.2)?'shout':'frown';st.pose='point';st.brow=-0.8;st.gx=-0.85;st.trem=0.4; break;
  case 'furious': slamCycle(st,t,2.4); st.gx=-0.7; st.trem=1; if(st.fx) st.fx.text='說實話！'; break;
  case 'rage': Object.assign(st,{eyeMode:'angry',open:1.2,pupil:0.5,brow:-1.2,mouth:'shout',pose:'fists',veins:true,scale:1.06,headDY:8,trem:2.2,shake:1.2,gx:-0.6});
   st.fx={text:'給我說實話！',x:290,y:92,size:26,rot:-6}; break;
  case 'win': Object.assign(st,{eyeMode:'happy',mouth:'smile',pose:'cheer',brow:-0.1,sparkle:true,headDY:-4}); st.fx={text:'破案！',x:300,y:96,size:34,rot:-8}; break;
  case 'lose': Object.assign(st,{mouth:'wavy',pose:'facepalm',brow:1.1,gloom:1,headDY:10,gy:0.8,open:0.7}); st.fx=(t%3<1.5)?{text:'唉……',x:300,y:118,size:22,rot:8}:null; break;
 }
 if(idx===4) st.blush=0.4;
 finish(st,t,talking);
 return st;
}

/* ---------- 繪製 ---------- */
function room(S,st,t){
 let o=`<rect width="400" height="360" fill="${S.wall}"/><rect y="200" width="400" height="160" fill="${S.wall2}"/>`;
 if(S.role==='inter'){
  o+=`<rect x="14" y="36" width="112" height="104" rx="3" fill="${S.board}" stroke="${S.frame}" stroke-width="${Math.max(3,S.ow+1)}"/>`;
  const pins=[[30,50,34,26],[74,46,38,30],[40,92,30,34],[84,94,32,28]];
  pins.forEach((p,i)=>{o+=`<rect x="${p[0]}" y="${p[1]}" width="${p[2]}" height="${p[3]}" fill="${i%2?'#f4efe3':'#fffaf0'}" stroke="${S.frame}" stroke-width="1"/><circle cx="${p[0]+p[2]/2}" cy="${p[1]+3}" r="2.5" fill="#d9483b"/>`;});
  o+=`<path d="M47 53 L93 49 L55 95 L100 97" stroke="#d9483b" stroke-width="1.5" fill="none"/>`;
 } else {
  o+=`<rect x="16" y="40" width="96" height="118" rx="3" fill="${S.mirror}" stroke="${S.frame}" stroke-width="${Math.max(3,S.ow+1)}"/>`;
  o+=`<path d="M34 150 L92 48 M54 150 L104 62" stroke="#ffffff" stroke-width="5" opacity="0.1"/>`;
 }
 o+=`<circle cx="344" cy="66" r="22" fill="${S.clock}" stroke="${S.frame}" stroke-width="${Math.max(2.5,S.ow)}"/>`;
 const sa=((t*6)%360)*Math.PI/180, ma=((t*0.4)%360)*Math.PI/180+1;
 o+=`<line x1="344" y1="66" x2="${f(344+Math.sin(ma)*12)}" y2="${f(66-Math.cos(ma)*12)}" stroke="${S.frame}" stroke-width="3" stroke-linecap="round"/>`;
 o+=`<line x1="344" y1="66" x2="${f(344+Math.sin(sa)*17)}" y2="${f(66-Math.cos(sa)*17)}" stroke="#d9483b" stroke-width="1.5"/>`;
 if(S.kind==='comic'||S.kind==='animal'){
  const I=clamp(ramp(st.P,35,85)+(st.stage===9&&S.role!=='inter'?1:0),0,1);
  if(I>0){ const sp=st.stage===9?14:4;
   for(let i=0;i<30;i++){const a=i/30*Math.PI*2+0.05*(i%3);const r1=118+((i*37+Math.floor(t*sp))%5)*14;
    o+=`<line x1="${f(200+Math.cos(a)*r1)}" y1="${f(150+Math.sin(a)*r1)}" x2="${f(200+Math.cos(a)*340)}" y2="${f(150+Math.sin(a)*340)}" stroke="${S.bgLine}" stroke-width="${2+(i%3)*1.5}" opacity="${f(I)}"/>`;}
  }
 }
 if(S.kind==='chibi'){
  if(st.gloom>0) for(let i=0;i<9;i++){const x=112+i*22;o+=`<line x1="${x}" y1="58" x2="${x}" y2="${100+((i*13)%5)*12}" stroke="#8d7fc4" stroke-width="2.5" stroke-linecap="round" opacity="${f(st.gloom*0.7)}"/>`;}
  else for(let i=0;i<5;i++){const x=60+i*72, y=190+Math.sin(t*1.5+i)*6; o+=`<circle cx="${x}" cy="${f(y)}" r="${4+i%3}" fill="#cfc4ee"/>`;}
 } else if(st.gloom>0.5&&S.role==='inter'){
  for(let i=0;i<7;i++){const x=130+i*24;o+=`<line x1="${x}" y1="60" x2="${x}" y2="${96+((i*13)%5)*10}" stroke="#6a6aa0" stroke-width="2" opacity="${f(st.gloom*0.5)}"/>`;}
 }
 return o;
}

function body(S,st,hx){
 const w=S.shoulderW, y0=S.shoulderY, ny=S.hy+st.headDY+S.ry*0.72;
 let o=`<rect x="${hx-S.neckW/2}" y="${f(ny)}" width="${S.neckW}" height="${f(Math.max(10,y0-ny+12))}" fill="${S.skin}" stroke="${S.ol}" stroke-width="${S.ow}"/>`;
 if(S.kind==='real') o+=`<rect x="${hx-S.neckW/2}" y="${f(ny)}" width="${S.neckW}" height="14" fill="${S.shade}" opacity="0.6"/>`;
 o+=`<path d="M${hx-w-28} 360 L${hx-w-14} ${y0+22} Q${hx-w+4} ${y0} ${hx-28} ${y0-6} L${hx+28} ${y0-6} Q${hx+w-4} ${y0} ${hx+w+14} ${y0+22} L${hx+w+28} 360 Z" fill="${S.shirt}" stroke="${S.ol}" stroke-width="${S.ow}"/>`;
 o+=`<path d="M${hx-22} ${y0-6} L${hx} ${y0+18} L${hx+22} ${y0-6} Z" fill="${S.tie?S.shirt:S.skin}" stroke="${S.ol}" stroke-width="${S.ow}"/>`;
 if(S.tie) o+=`<path d="M${hx-6} ${y0+6} L${hx+6} ${y0+6} L${hx+9} ${y0+44} L${hx} ${y0+54} L${hx-9} ${y0+44} Z" fill="${S.tie}" stroke="${S.ol}" stroke-width="${S.ow}" stroke-linejoin="round"/><path d="M${hx-7} ${y0-2} L${hx+7} ${y0-2} L${hx+5} ${y0+8} L${hx-5} ${y0+8} Z" fill="${S.tie}" stroke="${S.ol}" stroke-width="${S.ow}"/>`;
 o+=`<path d="M${hx-26} ${y0-7} L${hx-4} ${y0+20} L${hx-30} ${y0+14} Z M${hx+26} ${y0-7} L${hx+4} ${y0+20} L${hx+30} ${y0+14} Z" fill="${S.collar}" stroke="${S.ol}" stroke-width="${S.ow}" stroke-linejoin="round"/>`;
 if(S.role==='inter'){const bx=hx-w*0.55, by=y0+24; o+=`<path d="M${bx} ${by-9} L${bx+8} ${by-5} L${bx+7} ${by+4} L${bx} ${by+9} L${bx-7} ${by+4} L${bx-8} ${by-5} Z" fill="#e4b443" stroke="${S.ol}" stroke-width="${Math.max(1.2,S.ow*0.6)}"/><circle cx="${bx}" cy="${by}" r="2.5" fill="#b8322f"/>`;}
 else if(S.kind==='chibi') o+=`<rect x="${hx+18}" y="${y0+22}" width="32" height="16" rx="3" fill="#fff" stroke="${S.ol}" stroke-width="2"/><text x="${hx+34}" y="${y0+34}" font-size="11" font-weight="700" text-anchor="middle" fill="${S.ol}" font-family="'Noto Sans TC',sans-serif">0918</text>`;
 return o;
}

function eye(S,st,cx,cy,side,t){
 const R=S.eyeR*(side>0?st.big2:1), o=st.open, gx=st.gx, gy=st.gy, real=S.kind==='real';
 if(st.eyeMode==='squeeze'){
  const k=R*0.9, d=side<0?`M${f(cx-k)} ${f(cy-k*0.6)} L${f(cx+k*0.6)} ${f(cy)} L${f(cx-k)} ${f(cy+k*0.6)}`:`M${f(cx+k)} ${f(cy-k*0.6)} L${f(cx-k*0.6)} ${f(cy)} L${f(cx+k)} ${f(cy+k*0.6)}`;
  return `<path d="${d}" fill="none" stroke="${S.browC}" stroke-width="${Math.max(2.5,S.browW*0.8)}" stroke-linecap="round" stroke-linejoin="round"/>`;
 }
 if(st.eyeMode==='happy') return `<path d="M${f(cx-R)} ${f(cy+3)} Q${cx} ${f(cy-R*1.1)} ${f(cx+R)} ${f(cy+3)}" fill="none" stroke="${S.browC}" stroke-width="${Math.max(2.5,S.browW*0.8)}" stroke-linecap="round"/>`;
 if(st.eyeMode==='mad'&&S.kind==='chibi'){
  let d=`M${cx} ${cy}`;
  for(let a=0.3;a<4*Math.PI;a+=0.3){const r=a/(4*Math.PI)*R*1.05;d+=` L${f(cx+Math.cos(a+t*4*side)*r)} ${f(cy+Math.sin(a+t*4*side)*r)}`;}
  return `<circle cx="${cx}" cy="${cy}" r="${f(R*1.15)}" fill="#fff" stroke="${S.ol}" stroke-width="${S.ow}"/><path d="${d}" fill="none" stroke="#2a2030" stroke-width="2.2"/>`;
 }
 if(o<0.12) return `<path d="M${f(cx-R)} ${cy} Q${cx} ${f(cy+R*0.45)} ${f(cx+R)} ${cy}" fill="none" stroke="${S.browC}" stroke-width="${real?2:S.ow+0.6}" stroke-linecap="round"/>`;
 const ry=(real?R*0.62:R*1.15)*Math.max(1,o), cover=clamp(1-o,0,1);
 let s='';
 if(S.kind==='chibi'&&st.eyeMode==='normal'){
  s+=`<ellipse cx="${cx}" cy="${cy}" rx="${f(R)}" ry="${f(ry)}" fill="#2a2030"/>`;
  const px=cx+gx*R*0.25, py=cy+gy*ry*0.25;
  s+=`<circle cx="${f(px+R*0.3)}" cy="${f(py-ry*0.35)}" r="${f(R*0.36)}" fill="#fff"/><circle cx="${f(px-R*0.3)}" cy="${f(py+ry*0.35)}" r="${f(R*0.16)}" fill="#fff"/>`;
  if(st.red>0.3) s+=`<path d="M${f(cx-R*0.7)} ${f(cy+ry*0.55)} Q${cx} ${f(cy+ry*0.95)} ${f(cx+R*0.7)} ${f(cy+ry*0.55)}" stroke="#bfe6ff" stroke-width="2.5" fill="none" opacity="${f(st.red)}"/>`;
 } else if(real){
  const tear=st.red>0.4;
  s+=`<path d="M${f(cx-R)} ${cy} Q${cx} ${f(cy-ry*1.2)} ${f(cx+R)} ${cy} Q${cx} ${f(cy+ry)} ${f(cx-R)} ${cy} Z" fill="${tear?'#f0dad2':'#eee8dd'}" stroke="${tear?'#b4554a':S.ol}" stroke-width="1"/>`;
  const ir=R*0.44, px=cx+gx*R*0.4, py=cy+gy*ry*0.3;
  s+=`<circle cx="${f(px)}" cy="${f(py)}" r="${f(ir)}" fill="#4a3324"/><circle cx="${f(px)}" cy="${f(py)}" r="${f(ir*0.5*st.pupil+0.4)}" fill="#111"/><circle cx="${f(px+ir*0.35)}" cy="${f(py-ir*0.35)}" r="1" fill="#fff"/>`;
  s+=`<path d="M${f(cx-R*0.8)} ${f(cy+ry*1.15)} Q${cx} ${f(cy+ry*1.7)} ${f(cx+R*0.8)} ${f(cy+ry*1.15)}" stroke="${S.shade}" stroke-width="1.2" fill="none" opacity="${f(0.4+ramp(st.P,30,80)*0.6)}"/>`;
 } else {
  s+=`<ellipse cx="${cx}" cy="${cy}" rx="${f(R)}" ry="${f(ry)}" fill="#fff" stroke="${S.ol}" stroke-width="${S.ow}"/>`;
  const pr=S.pupil*st.pupil*(S.kind==='chibi'?1.15:1), px=cx+gx*R*0.45, py=cy+gy*ry*0.45;
  s+=`<circle cx="${f(px)}" cy="${f(py)}" r="${f(pr)}" fill="#111"/>`;
  if(st.red>0.3) s+=`<path d="M${f(cx-R+2)} ${cy+2} l5 -1 M${f(cx+R-2)} ${cy-1} l-5 2 M${f(cx-R+3)} ${cy-3} l4 1" stroke="#d9483b" stroke-width="1.3" opacity="${f(st.red)}"/>`;
 }
 if(cover>0.02){
  const top=cy-ry*(real?1.2:1)-2, h=ry*2.1, lid=top+cover*h*0.88+2;
  s+=`<path d="M${f(cx-R-3)} ${f(top-8)} L${f(cx+R+3)} ${f(top-8)} L${f(cx+R+3)} ${f(lid)} L${f(cx-R-3)} ${f(lid)} Z" fill="${st.lidC||S.skin}"/>`;
  s+=`<path d="M${f(cx-R-1)} ${f(lid+1)} Q${cx} ${f(lid-1)} ${f(cx+R+1)} ${f(lid+1)}" stroke="${S.browC}" stroke-width="${real?1.6:S.ow+0.5}" stroke-linecap="round" fill="none"/>`;
 }
 return s;
}

function mouth(S,st,t,hx,my){
 const W=S.mouthW, dark='#4a1616', sw=Math.max(2,S.ow);
 const L=`stroke="${S.ol}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"`;
 switch(st.mouth){
  case 'smirk': return `<path d="M${hx-W/2} ${my+1} Q${hx+2} ${my+6} ${hx+W/2} ${my-7}" fill="none" ${L}/>`;
  case 'flat': return `<path d="M${hx-W/2} ${my} Q${hx} ${my+2} ${hx+W/2} ${my+1}" fill="none" ${L}/>`;
  case 'frown': return `<path d="M${hx-W/2} ${my+5} Q${hx} ${my-4} ${hx+W/2} ${my+5}" fill="none" ${L}/>`;
  case 'tight': return `<path d="M${f(hx-W*0.3)} ${my+1} L${f(hx+W*0.3)} ${my+1}" fill="none" ${L}/>`;
  case 'talk': { const ry=W*(0.05+0.17*Math.abs(Math.sin(t*14))*(0.6+0.4*Math.abs(Math.sin(t*5.3)))); return `<ellipse cx="${hx}" cy="${f(my+2)}" rx="${f(W*0.3)}" ry="${f(Math.max(1.5,ry))}" fill="${dark}" ${L}/>`; }
  case 'wavy': { let d=''; for(let i=0;i<=8;i++){const x=hx-W/2+W*i/8, y=my+2+Math.sin(i*2.2+t*26)*2.4; d+=(i?' L':'M')+f(x)+' '+f(y);} return `<path d="${d}" fill="none" ${L}/>`; }
  case 'o': return `<ellipse cx="${hx}" cy="${my+3}" rx="${f(W*0.17)}" ry="${f(W*0.22)}" fill="${dark}" ${L}/>`;
  case 'wavyOpen': { let d=''; for(let i=0;i<=8;i++){const x=hx-W/2+W*i/8, y=my+Math.sin(i*2.2+t*26)*2; d+=(i?' L':'M')+f(x)+' '+f(y);} d+=` Q${hx} ${f(my+W*0.5)} ${hx-W/2} ${my} Z`; return `<path d="${d}" fill="${dark}" ${L}/>`; }
  case 'shout': { const a=W*0.62, top=my-4, bot=my+W*0.85+Math.sin(t*30)*2;
   return `<path d="M${f(hx-a)} ${top} Q${hx} ${top-8} ${f(hx+a)} ${top} Q${f(hx+a*0.8)} ${f(bot)} ${hx} ${f(bot)} Q${f(hx-a*0.8)} ${f(bot)} ${f(hx-a)} ${top} Z" fill="${dark}" ${L}/>`+
    `<path d="M${f(hx-a*0.8)} ${top+1} Q${hx} ${top-5} ${f(hx+a*0.8)} ${top+1} L${f(hx+a*0.7)} ${top+6} Q${hx} ${top+1} ${f(hx-a*0.7)} ${top+6} Z" fill="#fff"/>`+
    `<ellipse cx="${hx}" cy="${f(bot-5)}" rx="${f(a*0.5)}" ry="4" fill="#d9625a"/>`; }
  case 'smile': { const a=W*0.6; return `<path d="M${f(hx-a)} ${my-2} Q${hx} ${my-5} ${f(hx+a)} ${my-2} Q${f(hx+a*0.75)} ${f(my+W*0.6)} ${hx} ${f(my+W*0.62)} Q${f(hx-a*0.75)} ${f(my+W*0.6)} ${f(hx-a)} ${my-2} Z" fill="${dark}" ${L}/><ellipse cx="${hx}" cy="${f(my+W*0.42)}" rx="${f(a*0.45)}" ry="3.5" fill="#d9625a"/>`; }
  case 'scream': { const ry=W*(0.72+0.08*Math.sin(t*30)); return `<ellipse cx="${hx}" cy="${f(my+ry*0.55)}" rx="${f(W*0.42)}" ry="${f(ry)}" fill="${dark}" ${L}/><ellipse cx="${hx}" cy="${f(my+ry*1.2)}" rx="${f(W*0.25)}" ry="4" fill="#d9625a"/>`; }
  case 'grin': { const a=W*1.05; let s=`<path d="M${f(hx-a)} ${my-8} Q${hx} ${f(my+W*0.95)} ${f(hx+a)} ${my-8} Q${hx} ${f(my+W*0.35)} ${f(hx-a)} ${my-8} Z" fill="#f2ede2" ${L}/>`;
   for(let i=-3;i<=3;i++){const x=hx+i*a/4.2, k=1-(i/4)*(i/4); s+=`<line x1="${f(x)}" y1="${f(my+W*0.2*k)}" x2="${f(x)}" y2="${f(my+W*0.46*k)}" stroke="${S.ol}" stroke-width="1.3"/>`;} return s; }
  case 'wail': { const a=W*0.6, wb=Math.sin(t*10)*2; return `<path d="M${f(hx-a)} ${my+8} Q${hx} ${f(my-10+wb)} ${f(hx+a)} ${my+8} Q${hx} ${f(my+W*0.6)} ${f(hx-a)} ${my+8} Z" fill="${dark}" ${L}/><ellipse cx="${hx}" cy="${f(my+W*0.38)}" rx="${f(a*0.45)}" ry="3.5" fill="#d9625a"/>`; }
 }
 return '';
}

function drop(x,y,s,fill,stroke,sw,op){
 return `<path d="M${f(x)} ${f(y-s)} Q${f(x+s*0.9)} ${f(y+s*0.4)} ${f(x)} ${f(y+s*0.9)} Q${f(x-s*0.9)} ${f(y+s*0.4)} ${f(x)} ${f(y-s)} Z" fill="${fill}" ${stroke?`stroke="${stroke}" stroke-width="${sw}"`:''} opacity="${f(op)}"/>`;
}
const SWEAT=[[-1.05,-0.25],[1.04,-0.4],[0.78,-0.78],[-0.72,-0.74],[1.12,0.12],[-1.12,0.08],[0.3,-0.98]];

function hair(S,st,hx,hy,t,messy){
 const rx=S.rx, ry=S.ry, P2=(a,b)=>`${f(hx+a*rx)} ${f(hy+b*ry)}`;
 if(S.neat){
  const d=`M${P2(-1.04,-0.05)} Q${P2(-1.1,-1.15)} ${P2(0,-1.12)} Q${P2(1.12,-1.1)} ${P2(1.04,-0.05)} Q${P2(0.95,-0.5)} ${P2(0.5,-0.62)} Q${P2(-0.05,-0.72)} ${P2(-0.35,-0.5)} Q${P2(-0.7,-0.6)} ${P2(-1.04,-0.05)} Z`;
  return `<path d="${d}" fill="${S.hair}" ${S.kind==='real'?'':`stroke="${S.ol}" stroke-width="${S.ow}"`} stroke-linejoin="round"/><path d="M${P2(-0.35,-0.52)} Q${P2(-0.2,-0.9)} ${P2(0.1,-1.08)}" stroke="#5a4636" stroke-width="2" fill="none"/>`;
 }
 if(S.kind==='comic'){
  const pts=[[-1.06,-0.05],[-1.0,-0.62],[-0.82,-0.7],[-0.78,-1.12],[-0.52,-0.92],[-0.4,-1.3],[-0.14,-1.0],[0.06,-1.36],[0.22,-1.0],[0.46,-1.28],[0.56,-0.92],[0.86,-1.08],[0.84,-0.72],[1.02,-0.64],[1.06,-0.05]];
  let d='M'+pts.map((p,i)=>{let b=p[1]; if(messy&&b<-0.9) b=b*1.15+Math.sin(t*20+i)*0.05; return P2(p[0],b);}).join(' L');
  d+=` L${P2(0.92,-0.25)} Q${P2(0.5,-0.72)} ${P2(0.1,-0.6)} L${P2(-0.15,-0.4)} L${P2(-0.3,-0.66)} Q${P2(-0.7,-0.7)} ${P2(-0.92,-0.25)} Z`;
  return `<path d="${d}" fill="${S.hair}" stroke="${S.ol}" stroke-width="${S.ow}" stroke-linejoin="round"/><path d="M${P2(-0.5,-0.95)} L${P2(-0.35,-0.8)} M${P2(0.3,-1.0)} L${P2(0.42,-0.86)}" stroke="#4a4752" stroke-width="3" stroke-linecap="round"/>`;
 }
 if(S.kind==='chibi'){
  const d=`M${P2(-1.02,0.1)} Q${P2(-1.08,-1.05)} ${P2(0,-1.08)} Q${P2(1.08,-1.05)} ${P2(1.02,0.1)} Q${P2(0.9,-0.35)} ${P2(0.55,-0.45)} Q${P2(0.4,-0.25)} ${P2(0.2,-0.42)} Q${P2(0,-0.22)} ${P2(-0.22,-0.42)} Q${P2(-0.45,-0.22)} ${P2(-0.6,-0.45)} Q${P2(-0.92,-0.35)} ${P2(-1.02,0.1)} Z`;
  const droop=ramp(st.P,30,90);
  const ah=`M${P2(0.02,-1.06)} Q${P2(0.2,lerp(-1.42,-1.05,droop))} ${P2(lerp(0.36,0.3,droop),lerp(-1.22,-0.9,droop))}`;
  return `<path d="${ah}" fill="none" stroke="${S.ol}" stroke-width="7" stroke-linecap="round"/><path d="${ah}" fill="none" stroke="${S.hair}" stroke-width="4" stroke-linecap="round"/>`+
   `<path d="${d}" fill="${S.hair}" stroke="${S.ol}" stroke-width="${S.ow}" stroke-linejoin="round"/><path d="M${P2(-0.55,-0.85)} Q${P2(-0.3,-0.98)} ${P2(-0.05,-0.92)}" stroke="#8a6450" stroke-width="4" fill="none" stroke-linecap="round"/>`;
 }
 const d=`M${P2(-1.02,-0.1)} Q${P2(-1.05,-1.12)} ${P2(0.05,-1.1)} Q${P2(1.08,-1.05)} ${P2(1.0,-0.1)} Q${P2(0.92,-0.55)} ${P2(0.55,-0.68)} Q${P2(-0.1,-0.75)} ${P2(-0.55,-0.6)} Q${P2(-0.9,-0.45)} ${P2(-1.02,-0.1)} Z`;
 let s=`<path d="${d}" fill="${S.hair}"/><path d="M${P2(-0.6,-0.95)} Q${P2(-0.1,-1.05)} ${P2(0.5,-0.9)} M${P2(-0.4,-0.82)} Q${P2(0.1,-0.9)} ${P2(0.7,-0.75)}" stroke="#3d3532" stroke-width="1.2" fill="none"/>`;
 if(messy) s+=`<path d="M${P2(-0.2,-1.08)} Q${P2(-0.4,-1.4)} ${P2(-0.6,-1.25)} M${P2(0.3,-1.06)} Q${P2(0.5,-1.45)} ${P2(0.7,-1.2)}" stroke="${S.hair}" stroke-width="2.5" fill="none"/>`;
 return s;
}

function animalEars(S,st,hx,hy){
 const A=S.A, rx=S.rx, ry=S.ry, sw=S.ow;
 let o='';
 for(const sd of [-1,1]){
  if(A.ear==='pointy'||A.ear==='tri'){
   const tall=A.ear==='pointy'?1.5:1.32;
   const bx1=hx+sd*rx*0.9, by1=hy-ry*0.3, tx=hx+sd*rx*0.66, ty=hy-ry*tall, bx2=hx+sd*rx*0.18, by2=hy-ry*0.86;
   o+=`<path d="M${f(bx1)} ${f(by1)} L${f(tx)} ${f(ty)} L${f(bx2)} ${f(by2)} Z" fill="${A.fur}" stroke="${S.ol}" stroke-width="${sw}" stroke-linejoin="round"/>`;
   o+=`<path d="M${f(lerp(bx1,tx,0.35))} ${f(lerp(by1,ty,0.35))} L${f(tx)} ${f(ty+4)} L${f(lerp(bx2,tx,0.35))} ${f(lerp(by2,ty,0.35))} Z" fill="${A.inner}"/>`;
  } else if(A.ear==='round'){
   o+=`<circle cx="${f(hx+sd*rx*0.72)}" cy="${f(hy-ry*0.82)}" r="${f(rx*0.34)}" fill="${A.fur}" stroke="${S.ol}" stroke-width="${sw}"/><circle cx="${f(hx+sd*rx*0.72)}" cy="${f(hy-ry*0.82)}" r="${f(rx*0.18)}" fill="${A.inner}"/>`;
  } else {
   const droop=ramp(st.P,30,90)*55+(st.stage===9?20:0), bx=hx+sd*rx*0.35, by=hy-ry*0.75;
   o+=`<g transform="rotate(${f(sd*(8+droop))} ${f(bx)} ${f(by)})"><ellipse cx="${f(bx)}" cy="${f(by-40)}" rx="15" ry="44" fill="${A.fur}" stroke="${S.ol}" stroke-width="${sw}"/><ellipse cx="${f(bx)}" cy="${f(by-38)}" rx="7" ry="32" fill="${A.inner}"/></g>`;
  }
 }
 return o;
}
function animalFace(S,st,hx,hy){
 const A=S.A, rx=S.rx, ry=S.ry;
 let o='';
 if(A.mask) for(const sd of [-1,1]) o+=`<ellipse cx="${f(hx+sd*S.eyeDx*1.05)}" cy="${f(hy+S.eyeDy+2)}" rx="${f(S.eyeR*1.9)}" ry="${f(S.eyeR*1.35)}" fill="${A.mask}" transform="rotate(${sd*-12} ${f(hx+sd*S.eyeDx)} ${hy+S.eyeDy})"/>`;
 if(S.animal==='fox') o+=`<path d="M${f(hx-rx)} ${f(hy+ry*0.05)} Q${f(hx-rx*0.5)} ${f(hy+ry*0.15)} ${hx} ${f(hy+ry*0.05)} Q${f(hx+rx*0.5)} ${f(hy+ry*0.15)} ${f(hx+rx)} ${f(hy+ry*0.05)} Q${f(hx+rx*0.7)} ${f(hy+ry*0.95)} ${hx} ${f(hy+ry)} Q${f(hx-rx*0.7)} ${f(hy+ry*0.95)} ${f(hx-rx)} ${f(hy+ry*0.05)} Z" fill="${A.muzzle}"/>`;
 else o+=`<ellipse cx="${hx}" cy="${f(hy+ry*0.45)}" rx="${f(rx*0.5)}" ry="${f(ry*0.36)}" fill="${A.muzzle}" stroke="${S.ol}" stroke-width="${S.ow*0.6}"/>`;
 if(A.stripes) o+=`<path d="M${hx} ${f(hy-ry*0.95)} L${hx} ${f(hy-ry*0.65)} M${hx-12} ${f(hy-ry*0.9)} L${hx-9} ${f(hy-ry*0.66)} M${hx+12} ${f(hy-ry*0.9)} L${hx+9} ${f(hy-ry*0.66)}" stroke="${A.dark}" stroke-width="4" stroke-linecap="round"/>`;
 o+=`<ellipse cx="${hx}" cy="${f(hy+ry*0.26)}" rx="7" ry="5" fill="${A.nose}"/>`;
 if(A.whisk) for(const sd of [-1,1]) o+=`<path d="M${hx+sd*20} ${f(hy+ry*0.4)} l${sd*24} -4 M${hx+sd*20} ${f(hy+ry*0.48)} l${sd*26} 3" stroke="${S.ol}" stroke-width="1.4" stroke-linecap="round"/>`;
 return o;
}

function head(S,st,t,hx,hy,mode){
 const rx=S.rx, ry=S.ry, real=S.kind==='real', animal=S.kind==='animal';
 let o='';
 if(animal) o+=animalEars(S,st,hx,hy);
 else for(const sd of [-1,1]) o+=`<ellipse cx="${hx+sd*(rx-3)}" cy="${hy+S.earY}" rx="${f(S.earR*0.7)}" ry="${S.earR}" fill="${S.skin}" stroke="${S.ol}" stroke-width="${S.ow}"/>`;
 if(S.kind==='chibi'||animal) o+=`<ellipse cx="${hx}" cy="${hy}" rx="${rx}" ry="${ry}" fill="${S.skin}" stroke="${S.ol}" stroke-width="${S.ow}"/>`;
 else {
  const chin=real?1.05:1.08;
  o+=`<path d="M${hx-rx} ${hy-10} Q${hx-rx} ${hy-ry} ${hx} ${hy-ry} Q${hx+rx} ${hy-ry} ${hx+rx} ${hy-10} Q${hx+rx-2} ${f(hy+ry*0.55)} ${f(hx+rx*0.45)} ${f(hy+ry*0.85)} Q${hx} ${f(hy+ry*chin)} ${f(hx-rx*0.45)} ${f(hy+ry*0.85)} Q${hx-rx+2} ${f(hy+ry*0.55)} ${hx-rx} ${hy-10} Z" fill="${S.skin}" stroke="${S.ol}" stroke-width="${S.ow}"/>`;
  o+=`<path d="M${f(hx+rx*0.35)} ${f(hy-ry*0.8)} Q${hx+rx} ${f(hy-ry*0.4)} ${f(hx+rx*0.96)} ${f(hy+ry*0.1)} Q${f(hx+rx*0.75)} ${f(hy+ry*0.8)} ${f(hx+rx*0.2)} ${f(hy+ry*0.96)} Q${f(hx+rx*0.7)} ${f(hy+ry*0.3)} ${f(hx+rx*0.35)} ${f(hy-ry*0.8)} Z" fill="${S.shade}" opacity="${real?0.75:0.9}"/>`;
 }
 if(animal) o+=animalFace(S,st,hx,hy);
 if(st.veins) o+=`<ellipse cx="${hx}" cy="${f(hy+ry*0.1)}" rx="${f(rx*0.9)}" ry="${f(ry*0.85)}" fill="#e0452f" opacity="0.16"/>`;
 if(real&&S.role!=='inter') for(let i=0;i<80;i++){const a=Math.PI*(0.18+rnd(i)*0.64), r=0.62+rnd(i+99)*0.36; o+=`<circle cx="${f(hx+Math.cos(a)*rx*r)}" cy="${f(hy+8+Math.sin(a)*ry*r*0.95)}" r="0.9" fill="#6b5040" opacity="0.5"/>`;}
 if(!animal) o+=hair(S,st,hx,hy,t,st.stage===9&&mode==='hyst');
 if(st.shadow) o+=`<path d="M${hx-rx-4} ${hy+6} Q${hx-rx} ${hy-ry-4} ${hx} ${hy-ry-6} Q${hx+rx} ${hy-ry-4} ${hx+rx+4} ${hy+6} Z" fill="#0b0712" opacity="${st.shadow}"/>`;
 for(const sd of [-1,1]){
  const ex=hx+sd*S.eyeDx, ey=hy+S.eyeDy;
  const by=ey-S.browGap-(sd>0?st.raise:0)-(st.open>1?(st.open-1)*10:0), Lb=S.browL, a=st.brow*Lb*0.32;
  o+=`<path d="M${f(ex-sd*Lb/2)} ${f(by-a)} Q${ex} ${f(by-3-a*0.2)} ${f(ex+sd*Lb/2)} ${f(by+a*0.6)}" fill="none" stroke="${S.browC}" stroke-width="${S.browW}" stroke-linecap="round"/>`;
 }
 if(animal&&S.A.mask) st.lidC=S.A.mask;
 for(const sd of [-1,1]) o+=eye(S,st,hx+sd*S.eyeDx,hy+S.eyeDy,sd,t);
 st.lidC=null;
 if(S.kind==='comic') o+=`<path d="M${hx-2} ${hy+6} L${hx-8} ${hy+24} L${hx+2} ${hy+25}" fill="none" stroke="${S.ol}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`;
 else if(S.kind==='chibi') o+=`<ellipse cx="${hx}" cy="${hy+S.noseY}" rx="3" ry="2" fill="#e9a98a"/>`;
 else if(real) o+=`<path d="M${hx-2} ${hy+2} Q${hx-4} ${hy+16} ${hx-8} ${hy+21} Q${hx} ${hy+26} ${hx+8} ${hy+21}" fill="none" stroke="${S.ol}" stroke-width="1.3" stroke-linecap="round"/><path d="M${hx+3} ${hy+4} Q${hx+6} ${hy+16} ${hx+8} ${hy+20}" stroke="${S.shade}" stroke-width="2" fill="none"/>`;
 if(real&&st.P>40) o+=`<path d="M${hx-12} ${hy+24} Q${hx-16} ${hy+32} ${hx-14} ${hy+40} M${hx+12} ${hy+24} Q${hx+16} ${hy+32} ${hx+14} ${hy+40}" stroke="${S.shade}" stroke-width="1.2" fill="none" opacity="${f(ramp(st.P,40,80))}"/>`;
 if(S.kind==='chibi') for(const sd of [-1,1]) o+=`<ellipse cx="${hx+sd*rx*0.58}" cy="${hy+S.mouthY-6}" rx="12" ry="6" fill="#ffb3c1" opacity="${f(0.55+st.blush*0.4)}"/>`;
 else if((S.kind==='comic'||animal)&&st.blush>0.3) for(const sd of [-1,1]){const cx=hx+sd*rx*0.58, cy=hy+(animal?14:20); o+=`<path d="M${cx-8} ${cy+4} l5 -7 M${cx-2} ${cy+4} l5 -7 M${cx+4} ${cy+4} l5 -7" stroke="#e0705a" stroke-width="2.5" stroke-linecap="round" opacity="${f(st.blush)}"/>`;}
 else if(real&&st.blush>0) for(const sd of [-1,1]) o+=`<ellipse cx="${hx+sd*rx*0.55}" cy="${hy+18}" rx="11" ry="7" fill="#c8604c" opacity="${f(st.blush*0.28)}"/>`;
 o+=mouth(S,st,t,hx,hy+S.mouthY);
 if(st.veins){const x=hx+rx*0.5, y=hy-ry*0.52, k=real?1:1.5;
  o+=`<path d="M${f(x-6*k)} ${f(y-2*k)} Q${f(x-2*k)} ${f(y-2*k)} ${f(x-2*k)} ${f(y-6*k)} M${f(x+2*k)} ${f(y-6*k)} Q${f(x+2*k)} ${f(y-2*k)} ${f(x+6*k)} ${f(y-2*k)} M${f(x+6*k)} ${f(y+2*k)} Q${f(x+2*k)} ${f(y+2*k)} ${f(x+2*k)} ${f(y+6*k)} M${f(x-2*k)} ${f(y+6*k)} Q${f(x-2*k)} ${f(y+2*k)} ${f(x-6*k)} ${f(y+2*k)}" stroke="#d23a2a" stroke-width="${real?2:3}" fill="none" stroke-linecap="round"/>`;}
 const tearC=real?'#cfe3ef':'#7cc4ee';
 if(st.streams) for(const sd of [-1,1]){const ex=hx+sd*S.eyeDx, ey=hy+S.eyeDy, w=Math.sin(t*8+sd)*3;
  o+=`<path d="M${ex} ${ey+5} Q${f(ex+sd*8+w)} ${f(hy+ry*0.45)} ${f(ex+sd*4)} ${f(hy+ry*0.95)}" stroke="${tearC}" stroke-width="${S.tearW}" fill="none" stroke-linecap="round" opacity="0.9"/>`;
  const ph=(t*1.6+(sd>0?0.5:0))%1; o+=drop(ex+sd*4,hy+ry*0.95+ph*40,S.sweatS*0.7,tearC,null,0,1-ph);}
 if(st.tearWell) for(const sd of [-1,1]){const ex=hx+sd*S.eyeDx, ey=hy+S.eyeDy, ph=(t*0.5+(sd>0?0.5:0))%1;
  o+=drop(ex+sd*S.eyeR*0.6,ey+S.eyeR*0.9+ph*18,S.sweatS*0.55,tearC,real?null:S.ol,1.2,ph<0.8?1:(1-ph)*5);}
 for(let i=0;i<st.sweat;i++){const [a,b]=SWEAT[i], ph=(t*0.55+i*0.37)%1, s=S.sweatS*(0.85+((i*7)%3)*0.15)*Math.min(1,ph*8);
  o+=drop(hx+a*rx,hy+b*ry+ph*22,s,S.sweatC,real?null:S.ol,S.kind==='chibi'?1.8:2,(1-ph*0.7)*(real?0.85:1));}
 return o;
}

function table(S,st,t){
 let o=`<rect x="-10" y="282" width="420" height="50" fill="${S.tableTop}" stroke="${S.ol}" stroke-width="${S.ow}"/>`;
 o+=`<rect x="-10" y="330" width="420" height="40" fill="${S.table}" stroke="${S.ol}" stroke-width="${S.ow}"/>`;
 const rattle=st.P>=40?Math.sin(t*55)*ramp(st.P,40,80)*1.6:0, jump=st.cupJump?-12:0;
 if(S.role==='inter'){
  o+=`<g transform="rotate(4 ${S.hx+70} 306)"><rect x="${S.hx+44}" y="292" width="54" height="34" rx="2" fill="#fbf7ea" stroke="${S.ol}" stroke-width="${S.ow}"/><path d="M${S.hx+50} 302 h40 M${S.hx+50} 309 h34 M${S.hx+50} 316 h38" stroke="#9aa3b2" stroke-width="1.5"/></g>`;
  const cx=82+rattle, cy=312+jump;
  o+=`<rect x="${f(cx-12)}" y="${f(cy-26)}" width="24" height="26" rx="3" fill="#3f5f8f" stroke="${S.ol}" stroke-width="${S.ow}"/><path d="M${f(cx+12)} ${f(cy-20)} q9 0 9 8 q0 8 -9 8" fill="none" stroke="${S.ol}" stroke-width="${Math.max(2,S.ow)}"/>`;
  if(Math.sin(t*2)>0) o+=`<path d="M${f(cx-4)} ${f(cy-32)} q-4 -6 0 -12 M${f(cx+4)} ${f(cy-32)} q-4 -6 0 -12" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.5"/>`;
 } else {
  o+=`<g transform="rotate(-6 74 312)"><rect x="40" y="294" width="68" height="34" rx="2" fill="${S.folder}" stroke="${S.ol}" stroke-width="${S.ow}"/><rect x="40" y="290" width="24" height="6" rx="1" fill="${S.folder}" stroke="${S.ol}" stroke-width="${S.ow}"/></g>`;
  const cx=322+rattle, cy=312+jump;
  o+=`<path d="M${f(cx-13)} ${f(cy-32)} L${f(cx+13)} ${f(cy-32)} L${f(cx+10)} ${cy} L${f(cx-10)} ${cy} Z" fill="${S.cup}" stroke="${S.ol}" stroke-width="${S.ow}" stroke-linejoin="round"/>`;
  o+=`<path d="M${f(cx-12)} ${f(cy-25)} L${f(cx+12)} ${f(cy-25)}" stroke="${S.cupBand}" stroke-width="4"/>`;
 }
 return o;
}

function limb(S,a,e,h){
 const d=`M${f(a.x)} ${f(a.y)} L${f(e.x)} ${f(e.y)} L${f(h.x)} ${f(h.y)}`;
 return `<path d="${d}" fill="none" stroke="${S.ol}" stroke-width="${S.armW+S.ow*2}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${S.shirt}" stroke-width="${S.armW}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
function handG(S,h,fist,side,point){
 const r=S.handR;
 let s='';
 if(point) s+=`<rect x="${f(h.x-r-16)}" y="${f(h.y-5)}" width="22" height="9" rx="4.5" fill="${S.skin}" stroke="${S.ol}" stroke-width="${S.ow}"/>`;
 s+=`<ellipse cx="${f(h.x)}" cy="${f(h.y)}" rx="${r}" ry="${f(r*0.88)}" fill="${S.skin}" stroke="${S.ol}" stroke-width="${S.ow}"/>`;
 if(fist||point) for(let k=0;k<3;k++) s+=`<path d="M${f(h.x-r*0.5+k*r*0.5)} ${f(h.y-r*0.55)} l0 ${f(r*0.45)}" stroke="${S.ol}" stroke-width="${Math.max(1.2,S.ow*0.6)}" stroke-linecap="round"/>`;
 else s+=`<ellipse cx="${f(h.x-side*r*0.75)}" cy="${f(h.y-r*0.2)}" rx="${f(r*0.38)}" ry="${f(r*0.28)}" fill="${S.skin}" stroke="${S.ol}" stroke-width="${S.ow*0.8}"/>`;
 if(S.kind==='real') s+=`<path d="M${f(h.x-r*0.4)} ${f(h.y+r*0.5)} Q${f(h.x)} ${f(h.y+r*0.8)} ${f(h.x+r*0.4)} ${f(h.y+r*0.5)}" stroke="${S.shade}" stroke-width="1.5" fill="none"/>`;
 return s;
}
function arms(S,st,t,hx,hy){
 const w=S.shoulderW, sy=S.shoulderY+16, Lx=hx-w+8, Rx=hx+w-8, ty=306, rx=S.rx, ry=S.ry;
 const V=(x,y)=>({x,y}); let L,R,Le,Re,Lf=false,Rf=false,Lp=false;
 switch(st.pose){
  case 'behindHead': L=V(hx-rx*0.85,hy-ry*0.15);R=V(hx+rx*0.85,hy-ry*0.15);Le=V(hx-rx-48,hy+12);Re=V(hx+rx+48,hy+12);break;
  case 'tap': L=V(hx-70,ty);R=V(hx+68,ty-Math.abs(Math.sin(t*11))*9);break;
  case 'crossed': L=V(hx+34,sy+22);R=V(hx-34,sy+28);Le=V(Lx-6,sy+36);Re=V(Rx+6,sy+42);break;
  case 'clasp': L=V(hx-13+Math.sin(t*4)*2,ty);R=V(hx+13-Math.sin(t*4)*2,ty);break;
  case 'wipe': L=V(hx-60,ty);R=V(hx+rx*0.3+Math.sin(t*9)*10,hy-ry*0.55);Re=V(Rx+34,sy+30);break;
  case 'fidget': L=V(hx-50+Math.sin(t*3.3)*14,ty+Math.sin(t*5)*3);R=V(hx+50+Math.sin(t*2.7+1)*14,ty);break;
  case 'scratch': L=V(hx-62,ty);R=V(hx+rx*0.55+Math.cos(t*10)*5,hy-ry*0.82+Math.sin(t*10)*5);Re=V(Rx+44,hy+34);break;
  case 'shaky': {const j=()=>(Math.random()-0.5)*3; L=V(hx-46+j(),ty+j());R=V(hx+46+j(),ty+j());break;}
  case 'raise': L=V(hx-66,ty);R=V(lerp(hx+72,hx+98,st.k),lerp(ty,168,Math.sin(st.k*Math.PI/2)));Re=V(Rx+40,lerp(sy+40,sy+6,st.k));Rf=true;break;
  case 'slam': L=V(hx-66,ty);R=V(hx+72,ty);Rf=true;break;
  case 'face': L=V(hx-rx*0.62,hy+ry*0.45);R=V(hx+rx*0.62,hy+ry*0.45);Le=V(Lx-12,sy+48);Re=V(Rx+12,sy+48);break;
  case 'hair': {const j=Math.sin(t*22)*4; L=V(hx-rx*0.8+j,hy-ry*0.7);R=V(hx+rx*0.8-j,hy-ry*0.7);Le=V(Lx-42,hy+22);Re=V(Rx+42,hy+22);break;}
  case 'spread': L=V(hx-118,ty+2);R=V(hx+118,ty+2);Le=V(Lx-30,sy+30);Re=V(Rx+30,sy+30);break;
  case 'fists': {const d=st.slamDown?6:0; L=V(hx-64,ty+d);R=V(hx+64,ty+d);Lf=Rf=true;Le=V(Lx-24,sy+28);Re=V(Rx+24,sy+28);break;}
  case 'notes': L=V(hx-52,ty);R=V(hx+64+Math.sin(t*7)*8,ty-2+Math.abs(Math.sin(t*14))*2);break;
  case 'lean': L=V(hx-76,ty-2);R=V(hx+76,ty-2);Le=V(Lx-30,sy+24);Re=V(Rx+30,sy+24);break;
  case 'point': L=V(hx-128+Math.sin(t*6)*4,hy+70);Le=V(Lx-30,sy+6);R=V(hx+60,ty);Lp=true;break;
  case 'cheer': L=V(hx-58,ty);{const b=Math.abs(Math.sin(t*6))*10; R=V(hx+rx+30,hy-52-b);Re=V(Rx+44,sy-14);}Rf=true;break;
  case 'facepalm': L=V(hx-58,ty);R=V(hx+rx*0.1,hy-ry*0.12);Re=V(Rx+14,sy+28);break;
  default: L=V(hx-60,ty);R=V(hx+60,ty);
 }
 Le=Le||V(Lx-22,sy+40); Re=Re||V(Rx+22,sy+40);
 let pen='';
 if(st.pose==='notes') pen=`<line x1="${f(R.x-4)}" y1="${f(R.y-6)}" x2="${f(R.x-14)}" y2="${f(R.y+8)}" stroke="#20242a" stroke-width="3" stroke-linecap="round"/>`;
 return limb(S,V(Lx,sy),Le,L)+handG(S,L,Lf,-1,Lp)+limb(S,V(Rx,sy),Re,R)+handG(S,R,Rf,1,false)+pen;
}

function effects(S,st,t,mirror){
 let o='';
 const lx=200+Math.sin(t*1.3)*2+Math.sin(t*9)*16*st.lampSwing;
 const fl=st.flicker?((Math.sin(t*37)>0.6||Math.random()<0.08)?0.25:1):1;
 o+=`<polygon points="${f(lx-18)},46 ${f(lx+18)},46 372,300 28,300" fill="${S.cone}" opacity="${f(S.coneO*fl)}"/>`;
 o+=`<line x1="200" y1="0" x2="${f(lx)}" y2="30" stroke="${S.frame}" stroke-width="2"/>`;
 o+=`<path d="M${f(lx-24)} 48 L${f(lx-9)} 28 L${f(lx+9)} 28 L${f(lx+24)} 48 Z" fill="${S.lampShade}" stroke="${S.ol}" stroke-width="${S.ow}" stroke-linejoin="round"/>`;
 o+=`<ellipse cx="${f(lx)}" cy="49" rx="10" ry="4" fill="#fff6c8" opacity="${fl}"/>`;
 if(S.kind==='real') o+=`<rect x="-40" y="-40" width="480" height="440" fill="none" stroke="#000" stroke-width="${f(80+70*ramp(st.P,40,100))}" opacity="0.4"/>`;
 if(st.sparkle) for(let i=0;i<6;i++){const a=t*1.5+i*1.05, x=200+Math.cos(a)*120, y=140+Math.sin(a)*70, s=6+3*Math.sin(t*6+i);
  o+=`<path d="M${f(x)} ${f(y-s)} L${f(x+s*0.3)} ${f(y-s*0.3)} L${f(x+s)} ${f(y)} L${f(x+s*0.3)} ${f(y+s*0.3)} L${f(x)} ${f(y+s)} L${f(x-s*0.3)} ${f(y+s*0.3)} L${f(x-s)} ${f(y)} L${f(x-s*0.3)} ${f(y-s*0.3)} Z" fill="#ffd34d" stroke="${S.ol}" stroke-width="1"/>`;}
 if(st.fx){
  const F=st.fx, k=S.kind==='real'?0.8:1, j=F.jit?6:0, jx=(Math.random()-0.5)*j, jy=(Math.random()-0.5)*j, x=mirror?400-F.x:F.x, rot=mirror?-F.rot:F.rot;
  o+=`<text x="${f(x+jx)}" y="${f(F.y+jy)}" font-size="${f(F.size*k)}" font-weight="${S.font}" text-anchor="middle" transform="rotate(${rot} ${f(x)} ${f(F.y)})" fill="${S.fxFill}" stroke="${S.fxStroke}" stroke-width="${S.fxSW}" stroke-linejoin="round" paint-order="stroke" font-family="'Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif" opacity="${S.kind==='real'?0.85:1}">${F.text}</text>`;
 }
 return o;
}

/* 把一個角色畫進 svg。role: 'suspect' | 'inter'（審問官面向右邊的嫌犯，所以左右翻轉） */
function render(svg,S,st,t,mode){
 const hx=S.hx, hy=S.hy+st.headDY, mirror=S.role==='inter';
 const sh=reduce?st.shake*0.3:st.shake, sx=sh?(Math.random()-0.5)*2*sh:0, sy=sh?(Math.random()-0.5)*2*sh:0;
 const tr=reduce?st.trem*0.3:st.trem, tx=Math.sin(t*47)*tr, ty=Math.cos(t*39)*tr*0.7;
 const armSvg=arms(S,st,t,hx,hy);
 let o=`<g transform="translate(${f(sx)} ${f(sy)})">`+room(S,st,t);
 o+=mirror?`<g transform="translate(400 0) scale(-1 1)">`:'<g>';
 o+=body(S,st,hx);
 if(st.pose==='behindHead') o+=armSvg;
 o+=`<g transform="translate(${f(tx)} ${f(ty)}) rotate(${f(st.tilt)} ${hx} ${hy+S.ry}) translate(${hx} ${hy}) scale(${st.scale}) translate(${-hx} ${-hy})">`+head(S,st,t,hx,hy,mode)+`</g>`;
 o+=table(S,st,t);
 if(st.pose!=='behindHead') o+=armSvg;
 o+='</g>'+effects(S,st,t,mirror)+'</g>';
 if(st.flash) o+=`<rect width="400" height="360" fill="#ff2a1a" opacity="${f(clamp(st.flash,0,0.4))}"/>`;
 svg.innerHTML=o;
}

const SUS_STAGES=[
 {name:'囂張挑釁',desc:'翹腳、雙手抱頭靠椅背、冷笑'},{name:'不耐煩',desc:'手指敲桌、偷看時鐘、嘆氣'},{name:'防備',desc:'雙手抱胸、眼神迴避'},
 {name:'不安',desc:'開始冒汗、吞口水'},{name:'緊張',desc:'擦汗、桌子跟著抖、說話結巴'},{name:'慌亂',desc:'頻繁眨眼、眼神亂飄'},
 {name:'動搖',desc:'抓頭、聲音變小'},{name:'崩潰邊緣',desc:'手發抖、眼眶泛紅'},{name:'情緒失控',desc:'舉拳拍桌大吼'},{name:'破防',desc:'撐不住了'}
];
const BREAK_NAMES={cry:'痛哭崩潰',hyst:'歇斯底里',mad:'陰沉癲狂',roar:'崩潰咆哮'};

root.Render={render,buildS,suspectState,interState,interStageIdx,INTER_STAGES,SUS_STAGES,BREAK_NAMES,LOOKS,ANIMALS};
})(typeof window!=='undefined'?window:globalThis);
