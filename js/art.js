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
// Framed above the UI. The rod recedes INTO the scene toward the dock end, not across the screen.
function drawHands(s, pose, power, bend, tipOut){
  const W=s.w, H=s.h;
  const g=s.g;
  const SK=['#5a2e1c','#8a4a28','#c47848','#e8b080'];
  const SL=['#1a2a38','#2a4058','#4a6880'];
  const rod=(typeof G!=='undefined' && typeof rodByLevel==='function') ? rodByLevel(G.up.rod) : null;
  const WD=rod? rod.shaft : ['#3a2410','#5a3820','#8a5a30','#c4a06a'];
  const MT=['#2a3038','#5a6870','#a0b0b8'];
  const AC=rod? rod.accent : '#c4a06a';
  const pad= (typeof Scene!=='undefined' && Scene.uiPad) ? Scene.uiPad : 0;
  const ground=H-pad-1;
  const dockY=(typeof Scene!=='undefined' && Scene.dockY) ? Scene.dockY : Math.floor(H*0.70);

  // left hand, larger, sitting just above the UI
  const lx=Math.floor(W*0.30), ly=ground-20;
  // forearm / sleeve coming up from the bottom
  R(s, lx-10, ly+2, 12, ground-(ly+2)+1, SL[1]);
  R(s, lx-10, ly+2, 12, 3, SL[2]);
  R(s, lx-10, ground-2, 12, 3, SL[0]);
  // palm
  R(s, lx-2, ly, 16, 12, SK[2]);
  R(s, lx-2, ly, 16, 3, SK[3]);
  R(s, lx-2, ly+9, 16, 3, SK[1]);
  // fingers toward the center, slightly curled
  [[14,1,7,5],[20,3,6,4],[25,5,5,4],[29,7,4,3]].forEach(([x,y,w,h],i)=>{
    R(s, lx+x, ly+y, w, h, SK[i===0?2:2]);
    P(s, lx+x, ly+y, SK[3]);
    R(s, lx+x, ly+y+h-1, w, 1, SK[0]);
  });
  // thumb
  R(s, lx+8, ly-3, 5, 5, SK[2]); P(s, lx+8, ly-3, SK[3]);

  // right hand + reel, slightly right of center
  const hx=Math.floor(W*0.58), hy=ground-18;
  R(s, hx+4, hy+4, 14, ground-(hy+4)+1, SL[1]);
  R(s, hx+4, hy+4, 14, 3, SL[2]);
  R(s, hx+4, ground-2, 14, 3, SL[0]);
  // fist around the grip
  R(s, hx-4, hy, 14, 12, SK[2]);
  R(s, hx-4, hy, 14, 3, SK[3]);
  R(s, hx-4, hy+9, 14, 3, SK[1]);
  R(s, hx+8, hy-2, 6, 6, SK[2]); // thumb over the rod
  P(s, hx+8, hy-2, SK[3]);

  // reel, bigger and fully on-screen
  const rx=hx-2, ry=hy+8;
  R(s, rx, ry, 9, 9, MT[1]);
  R(s, rx+1, ry+1, 7, 7, MT[0]);
  P(s, rx+4, ry+4, MT[2]);
  R(s, rx+8, ry+2, 3, 3, MT[2]);
  if(rod && rod.accent) P(s, rx+4, ry+3, rod.accent);

  // rod recedes toward the far dock, tapering (into the scene)
  // grip is at (hx+2, hy-1). Idle tip sits just past the dock end, slightly right of center.
  let tipTarget={x:Math.floor(W*0.54), y:dockY-6};
  if(pose==='charge'){
    const p=power||0;
    tipTarget={x:Math.floor(lerp(W*0.54, W*0.78, p)), y:Math.floor(lerp(dockY-6, ground-28, p))};
  } else if(pose==='cast'){
    const p=power||0;
    tipTarget={x:Math.floor(lerp(W*0.78, W*0.52, p)), y:Math.floor(lerp(ground-28, dockY-18, p))};
  } else if((pose==='fight'||pose==='idle') && tipOut){
    // only ease the TIP toward the bobber; keep the grip planted so the rod doesn't slash the frame
    tipTarget={x:Math.round(lerp(tipTarget.x, tipOut.x, 0.55)), y:Math.round(lerp(tipTarget.y, tipOut.y, 0.45))};
    // clamp so the rod stays mostly over the dock / near water
    tipTarget.y=Math.max(dockY-28, Math.min(tipTarget.y, ground-24));
  }
  const gx=hx+2, gy=hy-1;
  const n=Math.max(8, Math.hypot(tipTarget.x-gx, tipTarget.y-gy)|0);
  let tip={x:gx,y:gy};
  for(let i=0;i<=n;i++){
    const u=i/n;
    // slight fight bend
    const bendAmt=(pose==='fight'?(bend||0):0)*Math.sin(u*Math.PI)*10;
    const x=Math.round(gx+(tipTarget.x-gx)*u + bendAmt);
    const y=Math.round(gy+(tipTarget.y-gy)*u);
    const thick = u<0.12?4: u<0.28?3: u<0.6?2:1;
    const c= u<0.15?WD[1]: u<0.2?MT[1]: WD[u>0.85?3:2];
    R(s, x-Math.floor((thick-1)/2), y, thick, 1, c);
    if(thick>1) P(s, x-Math.floor((thick-1)/2), y, WD[3]);
    if(Math.abs(u-0.22)<0.01||Math.abs(u-0.4)<0.01||Math.abs(u-0.62)<0.01){
      P(s, x-2, y, AC); P(s, x+1, y, MT[2]);
    }
    tip={x,y};
  }
  // grip wrap over the fist
  R(s, gx-1, gy, 4, 3, WD[0]);

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
