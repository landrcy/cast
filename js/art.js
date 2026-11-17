'use strict';
// All art is drawn at native pixel size, then scaled by an integer factor. No blur, no glow.

function mk(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingEnabled=false;return {c,g,w,h};}
function rgb(h){h=h.replace('#',''); if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2]; return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
function hex(r,g,b){return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,v|0)).toString(16).padStart(2,'0')).join('');}
function mix(a,b,t){const A=rgb(a),B=rgb(b);return hex(A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t,A[2]+(B[2]-A[2])*t);}
function P(s,x,y,c){x=x|0;y=y|0; if(x<0||y<0||x>=s.w||y>=s.h) return; s.g.fillStyle=c; s.g.fillRect(x,y,1,1);}
function R(s,x,y,w,h,c){s.g.fillStyle=c; s.g.fillRect(x|0,y|0,w,h);}
function outlineSprite(s,col){
  const g=s.g, d=g.getImageData(0,0,s.w,s.h), n=new Uint8ClampedArray(d.data), W=s.w, H=s.h;
  const A=(x,y)=> (x<0||y<0||x>=W||y>=H)?0:d.data[(y*W+x)*4+3];
  const C=rgb(col);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    if(A(x,y)>0) continue;
    if(A(x-1,y)||A(x+1,y)||A(x,y-1)||A(x,y+1)){
      const k=(y*W+x)*4; n[k]=C[0];n[k+1]=C[1];n[k+2]=C[2];n[k+3]=255;
    }
  }
  d.data.set(n); g.putImageData(d,0,0);
}

// body shape: returns 0 outside, or a [nx,ny,inside] where nx,ny are -1..1 in the body
function bodyMask(kind, x,y,w,h){
  const cx=w*0.46, cy=h*0.52;
  let rw, rh, ox=0, oy=0;
  switch(kind){
    case 'slim':  rw=w*0.38; rh=h*0.22; break;
    case 'torp':  rw=w*0.40; rh=h*0.24; break;
    case 'stock': rw=w*0.36; rh=h*0.30; break;
    case 'perch': rw=w*0.34; rh=h*0.32; break;
    case 'round': rw=w*0.32; rh=h*0.34; break;
    case 'tall':  rw=w*0.28; rh=h*0.38; break;
    case 'flat':  rw=w*0.36; rh=h*0.28; break;
    case 'long':  rw=w*0.42; rh=h*0.20; break;
    case 'eel':   rw=w*0.44; rh=h*0.16; break;
    case 'ray':   rw=w*0.40; rh=h*0.16; oy=2; break;
    default:      rw=w*0.36; rh=h*0.26;
  }
  const nx=(x-cx-ox)/rw, ny=(y-cy-oy)/rh;
  const d=nx*nx+ny*ny;
  if(kind==='ray'){
    // diamond / kite wings
    const wx=Math.abs((x-cx)/ (w*0.48));
    const wy=Math.abs((y-cy)/(h*0.42));
    if(wx+wy>1.0 && !((x-cx)*(x-cx)/(rw*rw)+(y-cy)*(y-cy)/(rh*rh)<1)) return null;
    return {nx:(x-cx)/(w*0.48), ny:(y-cy)/(h*0.42), d:wx+wy, cx, cy};
  }
  if(d>1) return null;
  return {nx, ny, d, cx, cy};
}

function paintFish(f, opts){
  opts=opts||{};
  const W=opts.w||48, H=opts.h||28, flip=!!opts.flip, sil=!!opts.sil, sc=opts.scale||1;
  const s=mk(W*sc, H*sc);
  const pal=f.art.pal, a=f.art;
  const col=sil? ['#0a1520','#0a1520','#0a1520','#0a1520','#0a1520','#000000','#0a1520'] : pal;
  const face = flip?1:-1; // drawn facing right by default; flip mirrors x
  const SX=x=> (flip? (W-1-x):x)*sc;
  const SY=y=> y*sc;
  const pxl=(x,y,c)=>{ for(let j=0;j<sc;j++) for(let i=0;i<sc;i++) P(s,SX(x)+i,SY(y)+j,c); };

  // tail
  const tcx=6, tcy=Math.floor(H*0.52);
  drawTail(pxl, a.tail, tcx, tcy, col, a.body==='eel'||a.body==='long');

  // dorsal / anal
  if(a.dor && a.dor!=='none'){
    const dx=Math.floor(W*0.48), dy=Math.floor(H*0.22);
    drawDorsal(pxl, a.dor, dx, dy, col, a.extra==='sail');
    // anal fin
    for(let i=0;i<5;i++) pxl(dx-1+i, H-8+(i%2), i<2?col[1]:col[2]);
  }

  // pec fin
  for(let i=0;i<6;i++) for(let j=0;j<3;j++){
    if(j>1 && i>4) continue;
    pxl(Math.floor(W*0.52)+j, Math.floor(H*0.58)+i-2, j===0?col[4]:col[2]);
  }

  // body
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const m=bodyMask(a.body,x,y,W,H);
    if(!m) continue;
    // light from top-left, 4 hard bands
    const light = -m.nx*0.25 - m.ny*0.7 + 0.15;
    let band = light>0.45?3: light>0.12?2: light>-0.25?1:0;
    // belly
    if(m.ny>0.35) band=Math.max(band, m.ny>0.6?6:2);
    let c = col[band]||col[1];
    if(m.ny>0.55 && col[6]) c= mixBand(col[6], c, 0.35);

    if(!sil) c=patternColor(a.pat, pal, c, m, x, y, W, H, f);
    // rim shade
    if(m.d>0.82) c=col[0];
    pxl(x,y,c);
  }

  // extras that sit on the body
  if(!sil) drawExtras(pxl, a.extra, W, H, pal, f, 0);

  // eye
  const ex=Math.floor(W*0.72), ey=Math.floor(H*0.42);
  pxl(ex,ey, sil?col[0]:'#f4f4f0');
  pxl(ex+1,ey, sil?col[0]:'#f4f4f0');
  pxl(ex,ey+1, sil?col[0]:(pal[5]||'#081018'));
  pxl(ex+1,ey+1, sil?col[0]:(pal[5]||'#081018'));
  if(!sil) pxl(ex,ey, '#ffffff');

  // gill line
  pxl(Math.floor(W*0.64), Math.floor(H*0.46), col[0]);
  pxl(Math.floor(W*0.64), Math.floor(H*0.50), col[0]);
  pxl(Math.floor(W*0.64), Math.floor(H*0.54), col[0]);

  outlineSprite(s, sil?'#050a10':'#0a0810');
  return s.c;
}

function mixBand(a,b,t){ // snap to nearer color rather than blending (keeps hard bands)
  return t<0.5?a:b;
}

function patternColor(pat, pal, c, m, x, y, W, H, f){
  const u=m.nx, v=m.ny;
  switch(pat){
    case 'bars':
      if(((y + Math.floor(x*0.15))%5)<2) return pal[0];
      break;
    case 'bands':
      if((Math.floor(x/3)%2)===0) return pal[0];
      break;
    case 'stripes':
    case 'tiger':
      if(((Math.floor(x*0.7+y*0.2))%4)===0) return pal[0];
      break;
    case 'spots':{
      const h=hash2(Math.floor(x/3),Math.floor(y/3), f.i+9);
      if(h<0.18) return pal[0];
      if(h<0.22) return pal[3];
      break;}
    case 'saddle':
      if(x>W*0.35 && x<W*0.6 && v<0.1) return pal[0];
      break;
    case 'scales':
      if(((x+Math.floor(y/2)*2)%4===0) && (y%2===0)) return pal[0];
      break;
    case 'silver':
      if((x+y)%7===0) return pal[3];
      break;
    case 'script':
      if(((x*3+y*5)%9)===0) return pal[4];
      break;
    case 'aurora':
      if(v<-0.1){ if((x+y)%5===0) return pal[4]; if(v<-0.4) return pal[3]; }
      break;
    case 'glass':
      if(m.d<0.25) return pal[3];
      if((x+y)%6===0) return pal[3];
      break;
    case 'koi':
      if(hash2(Math.floor(x/4),Math.floor(y/3), f.i+3)<0.35) return pal[0];
      if(hash2(Math.floor(x/5),Math.floor(y/4), f.i+7)<0.15) return pal[3];
      break;
    case 'chain':
      if(((x+Math.floor(y/2))%5)<1) return pal[0];
      break;
    case 'mottle':
      if(hash2(x,y,f.i)<0.22) return pal[0];
      break;
    case 'stars':
      if(hash2(x,y,f.i+2)<0.08) return pal[3];
      break;
    case 'irid':
      if((x+y*2)%8<2) return pal[4]||pal[3];
      break;
    case 'rings':
      if((Math.floor(x/4)%2)===0 && Math.abs(v)<0.5) return pal[0];
      break;
    case 'scar':
      if(Math.abs(y-H*0.4-Math.floor(x*0.15))<1 && x>W*0.3 && x<W*0.7) return pal[0];
      break;
    case 'glitch':
      if((y%5===0) && hash2(x,y,f.i)<0.5) return pal[4]||pal[3];
      if(hash2(Math.floor(x/2),y,f.i)<0.08) return pal[3];
      break;
  }
  return c;
}

function drawTail(pxl, kind, cx, cy, col, longish){
  const back=col[1], mid=col[2], hi=col[3], edge=col[0];
  if(kind==='fork' || kind==='lunate'){
    const spread=kind==='lunate'?5:6;
    for(let i=0;i<9;i++){
      const y1=cy-spread+Math.floor(i*0.2), y2=cy+spread-Math.floor(i*0.2);
      pxl(cx-i, y1+(kind==='lunate'?1:0), i<2?hi:i<5?mid:back);
      pxl(cx-i, y2-(kind==='lunate'?1:0), i<2?hi:i<5?mid:back);
      if(i>2){ pxl(cx-i, y1+1, mid); pxl(cx-i, y2-1, mid); }
    }
    pxl(cx,cy,mid);
  } else if(kind==='round' || kind==='spade' || kind==='square'){
    const w=kind==='square'?7:8, h=kind==='spade'?5:6;
    for(let y=-h;y<=h;y++) for(let x=0;x<w;x++){
      const ok=kind==='square'? true : (x*x*0.35+(y*y)/(h*h)<1.1);
      if(!ok) continue;
      if(kind==='spade' && x>4 && Math.abs(y)<2) continue;
      pxl(cx-x, cy+y, x<2?hi:x<5?mid:back);
    }
  } else if(kind==='ribbon' || kind==='whip'){
    const len=kind==='whip'?14:11;
    for(let i=0;i<len;i++){
      const y=cy+Math.round(Math.sin(i*0.5)*2);
      pxl(cx-i, y, i<3?hi:i<7?mid:back);
      if(kind==='ribbon'){ pxl(cx-i, y-1, i%2?mid:edge); pxl(cx-i, y+1, back); }
    }
  }
}

function drawDorsal(pxl, kind, x, y, col, sail){
  const h=sail?10:(kind==='sail'?8:kind==='spine'?7:5);
  const w=sail?16:(kind==='sail'?10:8);
  for(let i=0;i<w;i++){
    const hh = kind==='spine' ? ((i%2)?h:h-3) : Math.max(1, Math.round(h * Math.sin((i/w)*Math.PI)));
    for(let j=0;j<hh;j++) pxl(x-Math.floor(w*0.4)+i, y-j, j>hh-2?col[3]:j>hh/2?col[2]:col[4]||col[1]);
  }
}

function drawExtras(pxl, extra, W, H, pal, f, frame){
  if(!extra) return;
  const cx=Math.floor(W*0.5), cy=Math.floor(H*0.5);
  if(extra==='spear' || extra==='snout' || extra==='jaw'){
    const y=Math.floor(H*0.50);
    for(let i=0;i<(extra==='spear'?12:7);i++) pxl(W-8+i, y-(i>8?1:0), i<3?pal[2]:pal[3]);
    if(extra==='jaw'){ pxl(W-6,y+2,pal[0]); pxl(W-5,y+3,pal[3]); pxl(W-7,y+2,pal[0]); }
    if(extra==='snout'){ pxl(W-5,y+1,pal[1]); pxl(W-4,y+1,pal[1]); }
  }
  if(extra==='whisker'){
    for(let i=0;i<8;i++){ pxl(W-10+i, Math.floor(H*0.56)+Math.floor(i/3), pal[2]); pxl(W-10+i, Math.floor(H*0.48)-Math.floor(i/3), pal[2]); }
  }
  if(extra==='fangs'){
    pxl(W-8, Math.floor(H*0.52)+2, pal[3]); pxl(W-7, Math.floor(H*0.52)+3, pal[3]);
    pxl(W-8, Math.floor(H*0.48)-2, pal[3]); pxl(W-7, Math.floor(H*0.48)-3, pal[3]);
  }
  if(extra==='maw'){
    for(let y=-4;y<=5;y++) for(let x=0;x<6;x++) if(x+Math.abs(y)*0.4<5) pxl(W-12+x, Math.floor(H*0.52)+y, x<2?pal[0]:'#1a1014');
  }
  if(extra==='angler' || extra==='glowdot'){
    const ax=W-6, ay=Math.floor(H*0.18);
    if(extra==='angler'){ for(let i=0;i<7;i++) pxl(W-12+i, ay+2-Math.abs(i-3), pal[2]); }
    pxl(ax,ay, pal[4]||pal[3]); pxl(ax+1,ay, '#fff4c0'); pxl(ax,ay+1, pal[4]||pal[3]);
  }
  if(extra==='bottle'){
    // tiny corked bottle on the back
    const bx=Math.floor(W*0.48), by=Math.floor(H*0.22);
    for(let y=0;y<7;y++) for(let x=0;x<5;x++) pxl(bx+x,by+y, (x===0||x===4||y===6)? '#6a4a28' : (y===0?'#8a5a20':'#8ec8d4'));
    pxl(bx+2,by-1,'#6a3a18'); pxl(bx+1,by+3,'#d8e8c8');
  }
  if(extra==='fan' || extra==='sail' || extra==='crest'){
    const h=extra==='sail'?12:8;
    for(let i=0;i<(extra==='sail'?18:10);i++){
      const hh=Math.max(1, Math.round(h*Math.sin((i/(extra==='sail'?18:10))*Math.PI)));
      for(let j=0;j<hh;j++) pxl(Math.floor(W*0.34)+i, Math.floor(H*0.18)-j, j>hh-2?pal[3]:pal[4]||pal[2]);
    }
  }
  if(extra==='scalpel'){
    pxl(Math.floor(W*0.42), Math.floor(H*0.72), pal[4]||pal[3]);
    pxl(Math.floor(W*0.42)-1, Math.floor(H*0.73), pal[3]);
    pxl(Math.floor(W*0.42)-2, Math.floor(H*0.74), pal[3]);
  }
  if(extra==='core'){
    const x=Math.floor(W*0.50), y=Math.floor(H*0.50);
    pxl(x,y, pal[4]||pal[3]); pxl(x+1,y,'#ffffff'); pxl(x,y-1,pal[3]); pxl(x,y+1,pal[3]);
  }
}

const FISH_SPR={}, FISH_SIL={}, FISH_BIG={};
function fishSpr(f, sil){
  const k=f.id+(sil?'/s':'');
  const cache=sil?FISH_SIL:FISH_SPR;
  return cache[k]||(cache[k]=paintFish(f,{w:48,h:28,sil:!!sil}));
}
function fishBig(f){
  return FISH_BIG[f.id]||(FISH_BIG[f.id]=paintFish(f,{w:64,h:38,scale:1}));
}

// —— bobber (red / white, classic) ——
function drawBobber(s, x, y, sc, under){
  // sc is pixel size of the bobber (2-6)
  const g=s.g||s;
  const colors= under? ['#6a1010','#a02020','#d0d8e0','#8a1010'] : ['#a01818','#e03830','#f0f4f8','#ffffff'];
  const r=Math.max(2, sc|0);
  for(let j=-r;j<=r;j++) for(let i=-r;i<=r;i++){
    if(i*i+j*j>r*r) continue;
    const top=j<0;
    let c=top?colors[2]:colors[0];
    if(top && i+j<-r*0.4) c=colors[3];
    if(!top && i+j>r*0.3) c=colors[1];
    if(i*i+j*j>(r-0.6)*(r-0.6) && !top) c=colors[0];
    g.fillStyle=c; g.fillRect(x+i, y+j, 1, 1);
  }
  // stem
  g.fillStyle='#3a2a18'; g.fillRect(x, y-r-2, 1, 2);
  g.fillStyle='#6a4a20'; g.fillRect(x, y-r-3, 1, 1);
}

// —— first-person hands + rod ——
// Drawn into the scene buffer in pixel space. pose: 'idle'|'charge'|'cast'|'fight'
function drawHands(s, pose, power, bend, tipOut){
  const W=s.w, H=s.h;
  const g=s.g;
  // skin / sleeve / wood palettes (hard bands)
  const SK=['#5a2e1c','#8a4a28','#c47848','#e8b080'];
  const SL=['#1a2a38','#2a4058','#4a6880'];
  const rod=(typeof G!=='undefined' && typeof rodByLevel==='function') ? rodByLevel(G.up.rod) : null;
  const WD=rod? rod.shaft : ['#3a2410','#5a3820','#8a5a30','#c4a06a'];
  const MT=['#2a3038','#5a6870','#a0b0b8'];
  const AC=rod? rod.accent : '#c4a06a';

  // right forearm + hand (rod hand) sits lower-right; left hand lower-center
  const baseY=H-1;
  // left hand (fore)
  const lx=Math.floor(W*0.34);
  const ly=baseY-8;
  // fingers
  [[0,0,6,5],[7,1,4,4],[11,2,3,3],[14,3,3,3]].forEach(([x,y,w,h],i)=>{
    R(s,lx+x,ly+y,w,h,SK[i===0?1:2]);
    P(s,lx+x,ly+y,SK[3]);
    R(s,lx+x,ly+y+h-1,w,1,SK[0]);
  });
  // sleeve cuff
  R(s,lx-6,ly+1,7,7,SL[1]); R(s,lx-6,ly+1,7,2,SL[2]); R(s,lx-6,ly+6,7,2,SL[0]);

  // right hand + rod
  const charge = pose==='charge'? power : 0;
  const swing  = pose==='cast'? power : 0; // 0 just released .. 1 follow-through
  // rod angle in "pixels up/right"
  let ang;
  if(pose==='charge') ang = -0.15 - charge*0.85;          // pulled back over the shoulder
  else if(pose==='cast') ang = -1.0 + swing*1.55;         // swing forward
  else if(pose==='fight') ang = -0.55 - (bend||0)*0.45;   // bent toward the fish
  else ang = -0.62;                                       // idle, tipped toward the water

  const hx=Math.floor(W*0.62), hy=baseY-10;
  // grip
  R(s,hx-2,hy,8,6,SK[2]); R(s,hx-2,hy,8,2,SK[3]); R(s,hx-1,hy+5,6,2,SK[1]);
  R(s,hx+6,hy+1,4,4,SK[2]); // thumb
  R(s,hx-8,hy+1,7,7,SL[1]); R(s,hx-8,hy+1,7,2,SL[2]);

  // rod as a stepped pixel line from the grip toward the water
  const len=Math.floor(H*0.62);
  const tipWant = tipOut; // {x,y} if the line is out, bias the tip that way a little
  let dx=Math.cos(ang), dy=Math.sin(ang);
  if(tipWant && pose!=='charge' && pose!=='cast'){
    const vx=tipWant.x-(hx+2), vy=tipWant.y-(hy);
    const m=Math.hypot(vx,vy)||1;
    dx=lerp(dx, vx/m, 0.65); dy=lerp(dy, vy/m, 0.65);
    const mm=Math.hypot(dx,dy)||1; dx/=mm; dy/=mm;
  }
  let x=hx+3, y=hy-1;
  let tip={x:x, y:y};
  for(let i=0;i<len;i++){
    x+=dx; y+=dy;
    // slight bend toward the fish during a fight
    if(pose==='fight' && bend){ dy += bend*0.012; const m=Math.hypot(dx,dy)||1; dx/=m; dy/=m; }
    const ix=Math.round(x), iy=Math.round(y);
    if(iy<0||ix<0||ix>=W) break;
    const thick = i<8?2:1;
    const c = i<10?WD[1]: i<14?MT[1]: WD[i%5===0?3:2];
    R(s,ix,iy,thick,1,c);
    if(i<8) P(s,ix,iy,WD[3]);
    // line guides
    if(i===12||i===22||i===34){ P(s,ix,iy-1,MT[2]); P(s,ix+1,iy,MT[1]); }
    tip={x:ix,y:iy};
    if(iy < Math.floor(H*0.42)) break;
  }
  // reel on the rod butt
  R(s,hx+1,hy+4,5,5,MT[1]); P(s,hx+2,hy+5,MT[2]); P(s,hx+3,hy+6,MT[0]); R(s,hx+5,hy+5,2,2,MT[2]);

  return tip;
}

// tiny pixel clouds (several variants)
function mkCloud(seed){
  const rnd=mulberry32(8000+seed);
  const w=20+Math.floor(rnd()*18), h=6+Math.floor(rnd()*5);
  const s=mk(w,h);
  const cols=['#e8f6ff','#f6fcff','#d0e8f4'];
  for(let i=0,n=4+Math.floor(rnd()*4);i<n;i++){
    const cx=3+Math.floor(rnd()*(w-6)), cy=2+Math.floor(rnd()*(h-3)), r=2+Math.floor(rnd()*3);
    for(let y=-r;y<=r;y++) for(let x=-r*2;x<=r*2;x++){
      if((x*x)/(r*r*3)+(y*y)/(r*r)<=1) P(s,cx+x,cy+y, y<0?cols[1]:cols[0]);
    }
  }
  // underside shade (hard band)
  for(let x=0;x<w;x++) for(let y=h-2;y<h;y++){
    const d=s.g.getImageData(x,y,1,1).data; if(d[3]>0) P(s,x,y,cols[2]);
  }
  return s.c;
}

function mkGull(){
  // 2 frames, 9x6
  const frames=[];
  const A=['...w.w...','..w.w.w..','.www.www.','w.......w','.........'];
  const B=['.........','w.......w','.www.www.','..w.w.w..','...w.w...'];
  [A,B].forEach(rows=>{
    const s=mk(9,5);
    rows.forEach((r,y)=>{ for(let x=0;x<r.length;x++) if(r[x]==='w') P(s,x,y,'#f4f8fc'); });
    P(s,4,2,'#2a3038');
    frames.push(s.c);
  });
  return frames;
}

function mkLantern(){
  const s=mk(7,14);
  R(s,2,0,3,3,'#3a2a18'); R(s,3,2,1,2,'#5a3a20');
  R(s,1,4,5,6,'#c47820'); R(s,2,5,3,4,'#f0c040'); P(s,3,6,'#fff4c0');
  R(s,2,10,3,2,'#3a2a18'); R(s,3,12,1,2,'#2a1c10');
  return s.c;
}

const ART = { clouds:[], gull:null, lantern:null, ready:false };
function buildArt(){
  if(ART.ready) return;
  ART.clouds=[0,1,2,3,4].map(mkCloud);
  ART.gull=mkGull();
  ART.lantern=mkLantern();
  // warm the fish caches a bit so the log doesn't hitch
  FISH.forEach(f=>{ fishSpr(f,false); fishSpr(f,true); });
  ART.ready=true;
}


// —— named rods (vertical display sprite, handle at the bottom) ——
const ROD_SPR = {};
function paintRod(rod, opts){
  opts=opts||{};
  const W=opts.w||32, H=opts.h||112;
  const s=mk(W,H);
  const sh=rod.shaft, hd=rod.handle, ac=rod.accent;
  const cx=Math.floor(W/2);
  // handle
  const hy=H-18, hh=16, hw=rod.reel==='none'?6:7;
  for(let y=0;y<hh;y++){
    const c = y<2||y>hh-3? hd[0] : (y%5===0? hd[0]:hd[1]);
    R(s, cx-Math.floor(hw/2), hy+y, hw, 1, c);
    if(y>1 && y<hh-2) P(s, cx-Math.floor(hw/2), hy+y, rod.handle[1]||hd[1]);
    P(s, cx+Math.floor(hw/2)-1, hy+y, hd[0]);
  }
  // cork / wrap rings on the handle
  if(rod.wrap){
    for(let k=0;k<3;k++) R(s, cx-Math.floor(hw/2), hy+3+k*4, hw, 1, rod.wrap);
  } else {
    // twine on driftwood
    for(let k=0;k<4;k++) P(s, cx-2+(k%3), hy+2+k*3, '#6a4a28');
  }
  // reel
  if(rod.reel && rod.reel!=='none'){
    const pal={
      cork:['#6a4a20','#b08a50','#e0c080'],
      brass:['#6a4a10','#c4a060','#f0e0a0'],
      silver:['#3a4a50','#8aa0b0','#e0e8f0'],
      iron:['#1a1c20','#5a6068','#b0b8c0'],
      gold:['#6a4a08','#e0b020','#fff0a0'],
      dark:['#101018','#3a4a68','#8a9ab8'],
      void:['#14001e','#8f2fd6','#5ff6ff'],
      ember:['#4a0c00','#ff7a10','#ffe68a']
    }[rod.reel]||['#2a3038','#5a6870','#a0b0b8'];
    const rx=cx+Math.floor(hw/2), ry=hy+5;
    R(s, rx, ry, 7, 7, pal[1]);
    R(s, rx+1, ry+1, 5, 5, pal[0]);
    P(s, rx+3, ry+3, pal[2]);
    R(s, rx+6, ry+2, 2, 3, pal[2]); // crank
    P(s, rx, ry, pal[2]);
  }
  // shaft: taper toward the tip
  const tipY=6, baseY=hy-1;
  for(let y=baseY; y>=tipY; y--){
    const t=(y-tipY)/(baseY-tipY); // 1 at handle, 0 at tip
    const thick = t>0.85?3: t>0.3?2:1;
    // hard bands along the length + a light edge
    const band = (Math.floor((baseY-y)/7)%2===0)?1:2;
    let c=sh[band];
    if(t>0.92) c=sh[0];
    if(t<0.08) c=sh[Math.min(sh.length-1,3)];
    // unique patterns
    if(rod.id==='driftwood' && hash2(cx,y,3)<0.12) c=sh[0]; // knots
    if(rod.id==='reedcane' && ((baseY-y)%6===0)) c=sh[0]; // cane joints
    if(rod.id==='ironback' && ((baseY-y)%8===0)) c=sh[3];
    if(rod.id==='sunline' && ((baseY-y)%10===0)) c=sh[3];
    if(rod.id==='riftwand' && ((baseY-y)%5===0)) c=ac;
    if(rod.id==='emberkeel' && ((baseY-y)%7===0)) c=ac;
    if(rod.id==='abysspine' && ((baseY-y)%9===0)) c=sh[0];
    const x0=cx-Math.floor((thick-1)/2);
    R(s, x0, y, thick, 1, c);
    if(thick>1) P(s, x0, y, sh[Math.min(sh.length-1,3)]); // highlight edge
  }
  // wrapping just above the handle
  if(rod.wrap){
    for(let i=0;i<5;i++) R(s, cx-2, hy-6+i, 5, 1, i%2?rod.wrap:sh[0]);
  }
  // line guides
  if(rod.tip==='guides' || rod.tip==='spear' || rod.lv>=2){
    const spots=[0.25,0.45,0.65,0.82];
    spots.forEach(p=>{
      const y=Math.round(lerp(tipY, baseY, p));
      P(s, cx-2, y, ac); P(s, cx+2, y, ac); P(s, cx-2, y-1, ac);
    });
  }
  // tips
  if(rod.tip==='twine'){
    P(s, cx, tipY-1, '#6a4a28'); P(s, cx, tipY-2, '#8a6a40');
  } else if(rod.tip==='plain'){
    P(s, cx, tipY-1, sh[3]);
  } else if(rod.tip==='spear'){
    P(s, cx, tipY-1, sh[3]); P(s, cx, tipY-2, '#e8eef0'); P(s, cx, tipY-3, '#e8eef0');
  } else if(rod.tip==='lantern'){
    P(s, cx, tipY-1, ac); P(s, cx-1, tipY-2, ac); P(s, cx, tipY-2, '#fff4c0'); P(s, cx+1, tipY-2, ac); P(s, cx, tipY-3, ac);
  } else if(rod.tip==='crystal'){
    P(s, cx, tipY-1, ac); P(s, cx, tipY-2, '#ffffff'); P(s, cx-1, tipY-2, ac); P(s, cx+1, tipY-2, ac); P(s, cx, tipY-3, ac);
  } else if(rod.tip==='ember'){
    P(s, cx, tipY-1, '#ff8010'); P(s, cx, tipY-2, '#ffe68a'); P(s, cx-1, tipY-1, '#e03800'); P(s, cx+1, tipY-1, '#e03800'); P(s, cx, tipY-3, '#fff4c0');
  } else {
    P(s, cx, tipY-1, ac);
  }
  // unique ornaments
  if(rod.id==='tealcaster'){
    // teal winding diamond
    P(s, cx, Math.floor(H*0.45), ac); P(s, cx-1, Math.floor(H*0.45)+1, ac); P(s, cx+1, Math.floor(H*0.45)+1, ac);
  }
  if(rod.id==='sunline'){
    // sun disc below the tip
    const y=tipY+8;
    P(s, cx-1, y, ac); P(s, cx, y-1, ac); P(s, cx, y, '#fff0a0'); P(s, cx+1, y, ac); P(s, cx, y+1, ac);
  }
  if(rod.id==='riftwand'){
    const y=Math.floor(H*0.4);
    P(s, cx, y, '#ffffff'); P(s, cx-1, y, ac); P(s, cx+1, y, ac);
  }
  outlineSprite(s, '#0a0810');
  return s.c;
}
function rodSpr(rod){ return ROD_SPR[rod.id]||(ROD_SPR[rod.id]=paintRod(rod)); }

// —— CAST wordmark (pixel letters, hook on the C, bobber on the T) ——
function paintLogo(opts){
  opts=opts||{};
  const scale=opts.scale||6;
  // 5x7-ish custom letters, packed into a 67x16 source then scaled
  // letter maps are 11x14, 1-px gap, plus ornaments
  const C=[
    '..######...',
    '.########..',
    '###....##..',
    '##.........',
    '##.........',
    '##.........',
    '##.........',
    '##.........',
    '##.........',
    '###....##..',
    '.########..',
    '..######...',
    '........#..',
    '.......#.#.',
    '........#..',
    '...........',
  ];
  const A=[
    '....###....',
    '...#####...',
    '...##.##...',
    '..##...##..',
    '..##...##..',
    '.##.....##.',
    '.##.....##.',
    '.#########.',
    '###########',
    '##.......##',
    '##.......##',
    '##.......##',
    '##.......##',
    '...........',
    '...........',
    '...........',
  ];
  const S=[
    '..#######..',
    '.#########.',
    '###.....##.',
    '##.........',
    '###........',
    '.######....',
    '..#######..',
    '....#####..',
    '........##.',
    '........##.',
    '##.....###.',
    '.#########.',
    '..#######..',
    '...........',
    '...........',
    '...........',
  ];
  const T=[
    '###########',
    '###########',
    '....##.....',
    '....##.....',
    '....##.....',
    '....##.....',
    '....##.....',
    '....##.....',
    '....##.....',
    '....##.....',
    '....##.....',
    '....##.....',
    '....##.....',
    '.....#.....',
    '....#.#....',
    '...##.##...',
  ];
  const letters=[C,A,S,T];
  const lw=11, lh=16, gap=3;
  const srcW=4*lw+3*gap+2, srcH=lh+4;
  const src=mk(srcW, srcH);
  // colors: fill, light edge, navy outline is applied after
  const fill='#f4fbff', lite='#CAF0F8', mid='#48CAE4', deep='#023E8A';
  let ox=1;
  letters.forEach((L,li)=>{
    L.forEach((row,y)=>{
      for(let x=0;x<row.length;x++){
        if(row[x]!=='#') continue;
        const top=y<3, left=x<3;
        P(src, ox+x, 1+y, top||left?lite:fill);
      }
    });
    ox+=lw+gap;
  });
  // steel hook point on the C
  P(src, 9, 14, '#e8eef4'); P(src, 10, 13, '#c8d0dc');
  // red/white bobber hanging from the T
  const tx=1+3*(lw+gap)+5;
  P(src, tx, 16, '#e03830');
  P(src, tx-1, 16, '#c02020');
  P(src, tx+1, 16, '#c02020');
  P(src, tx, 17, '#f4f8fc');
  P(src, tx-1, 17, '#e0e8f0');
  P(src, tx+1, 17, '#e0e8f0');
  outlineSprite(src, deep);
  // scale integer
  const out=mk(srcW*scale, srcH*scale);
  out.g.imageSmoothingEnabled=false;
  out.g.drawImage(src.c, 0, 0, out.w, out.h);
  return out.c;
}
