'use strict';
// Distinct, hand-pixeled fish. Native size 96x56 (2x the old sprites). No glow overlays.
// Epic/Legendary/Mythic get 4 subtle animation frames (fins, lure, flicker, morph).

const FISH_W=96, FISH_H=56;
const FISH_SPR={};
const FISH_BIG={};

function bandColor(pal, nx, ny){
  const light = -nx*0.28 - ny*0.65 + 0.12;
  let i = light>0.42?3: light>0.08?2: light>-0.28?1:0;
  if(ny>0.52 && pal[6]) return mixBand(pal[6], pal[Math.max(i,2)], 0.4);
  return pal[i];
}
function patCol(f, pal, c, nx, ny, x, y, W, H){
  return patternColor(f.art.pat, pal, c, {nx,ny,d:nx*nx+ny*ny}, x, y, W, H, f);
}
function fillOval(s,cx,cy,rx,ry,colFn){
  const x0=Math.floor(cx-rx), x1=Math.ceil(cx+rx), y0=Math.floor(cy-ry), y1=Math.ceil(cy+ry);
  for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
    const nx=(x-cx)/rx, ny=(y-cy)/ry;
    if(nx*nx+ny*ny<=1) P(s,x,y,colFn(nx,ny,x,y));
  }
}
function fillDiamond(s,cx,cy,rx,ry,colFn){
  const x0=Math.floor(cx-rx), x1=Math.ceil(cx+rx), y0=Math.floor(cy-ry), y1=Math.ceil(cy+ry);
  for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
    const nx=(x-cx)/rx, ny=(y-cy)/ry;
    if(Math.abs(nx)+Math.abs(ny)<=1) P(s,x,y,colFn(nx,ny,x,y));
  }
}
function fillCirc(s,cx,cy,r,c){
  for(let y=-r;y<=r;y++) for(let x=-r;x<=r;x++) if(x*x+y*y<=r*r) P(s,cx+x,cy+y,c);
}
function eyeAt(s,x,y,sil,pal){
  if(sil){ P(s,x,y,pal[0]); P(s,x+1,y,pal[0]); return; }
  P(s,x,y,'#f4f4f0'); P(s,x+1,y,'#f4f4f0');
  P(s,x,y+1, pal[5]||'#081018'); P(s,x+1,y+1, pal[5]||'#081018');
  P(s,x,y,'#ffffff');
}

function paintFish(f, opts){
  opts=opts||{};
  const W=opts.w||FISH_W, H=opts.h||FISH_H, sil=!!opts.sil, sc=opts.scale||1, frame=opts.frame||0;
  const s=sc===1? mk(W,H) : mk(W*sc,H*sc);
  if(sc!==1){
    const base=paintFish(f,{w:W,h:H,sil,frame,scale:1});
    s.g.imageSmoothingEnabled=false;
    s.g.drawImage(base,0,0,s.w,s.h);
    return s.c;
  }
  const pal= sil? ['#0a1520','#0a1520','#0a1520','#0a1520','#0a1520','#000000','#0a1520'] : f.art.pal;
  const body=f.art.body||'stock';
  const colFn=(nx,ny,x,y)=>{
    let c=bandColor(pal,nx,ny);
    if(!sil) c=patCol(f,pal,c,nx,ny,x,y,W,H);
    return c;
  };
  const drawers={
    slim:drawStd, torp:drawStd, stock:drawStd, perch:drawPerch, long:drawStd,
    puffer:drawPuffer, sunfish:drawSunfish, angel:drawAngel, tang:drawTang,
    ray:drawRay, eel:drawEel, serpent:drawEel, cat:drawCat, carp:drawCarp, koi:drawKoi,
    maw:drawMaw, angler:drawAngler, jelly:drawJelly, bottle:drawBottle, bottlecarry:drawBearer,
    sail:drawSail, marlin:drawMarlin, pike:drawPike, viper:drawViper, dragon:drawDragon,
    blob:drawBlob, flame:drawFlame, bonewhale:drawBoneWhale, flat:drawFlat
  };
  (drawers[body]||drawStd)(s,f,pal,colFn,sil,frame,W,H);
  if(!sil && f.rar>=3 && f.art.extra) { /* extras already in family drawers */ }
  outlineSprite(s, sil?'#050a10':'#0a0810');
  return s.c;
}

function drawTailStd(s, kind, cx, cy, pal, longish){
  drawTail((x,y,c)=>P(s,x,y,c), kind, cx, cy, pal, longish);
}

function drawStd(s,f,pal,colFn,sil,frame,W,H){
  const body=f.art.body;
  const cx=W*0.50, cy=H*0.52;
  const rw= body==='slim'?W*0.30: body==='torp'?W*0.34: body==='long'?W*0.38: W*0.30;
  const rh= body==='slim'?H*0.16: body==='torp'?H*0.18: body==='long'?H*0.14: H*0.22;
  // tail
  drawTailStd(s, f.art.tail||'fork', Math.floor(cx-rw-2), Math.floor(cy), pal, body==='long');
  // dorsal
  if(f.art.dor && f.art.dor!=='none'){
    const flutter = (f.rar>=3 && !sil) ? Math.round(Math.sin(frame*1.2)) : 0;
    drawDorsal((x,y,c)=>P(s,x,y,c), f.art.dor, Math.floor(cx), Math.floor(cy-rh)+flutter, pal, f.art.extra==='sail');
  }
  fillOval(s,cx,cy,rw,rh,colFn);
  // pec fin
  const pf= (f.rar>=3 && !sil)? frame%2:0;
  for(let i=0;i<8;i++) for(let j=0;j<4;j++){
    if(j>2 && i>5) continue;
    P(s, Math.floor(cx)+j, Math.floor(cy)+i-2+pf, j===0?pal[4]||pal[1]:pal[2]);
  }
  if(f.art.extra==='jaw' || f.art.extra==='snout' || f.art.extra==='spear'){
    drawExtras((x,y,c)=>P(s,x,y,c), f.art.extra, W, H, pal, f, frame);
  }
  if(f.art.extra==='glowdot' && !sil){
    const ax=Math.floor(cx+rw-2), ay=Math.floor(cy-rh-2);
    P(s,ax,ay, pal[4]||pal[3]); P(s,ax+1,ay,'#fff4c0'); P(s,ax,ay+1,pal[4]||pal[3]);
  }
  eyeAt(s, Math.floor(cx+rw*0.45), Math.floor(cy-rh*0.25), sil, pal);
}

function drawPerch(s,f,pal,colFn,sil,frame,W,H){
  drawTailStd(s, 'spade', 16, 30, pal);
  // tall spiny dorsal
  const flutter=!sil && f.rar>=3 ? (frame%2):0;
  for(let i=0;i<16;i++){
    const hh = 6+((i%2)?8:4)+flutter;
    for(let j=0;j<hh;j++) P(s, 36+i, 22-j, j>hh-2?pal[3]:pal[4]||pal[1]);
  }
  fillOval(s, 50, 32, 28, 16, colFn);
  // anal fin
  for(let i=0;i<8;i++) for(let j=0;j<4;j++) P(s,44+i,40+j, pal[1]);
  eyeAt(s, 66, 26, sil, pal);
}

function drawPuffer(s,f,pal,colFn,sil,frame,W,H){
  const inflate = (!sil && (frame%4)===3)? 3:0;
  const r=18+inflate;
  drawTailStd(s, 'round', 22, 30, pal);
  fillOval(s, 52, 30, r+2, r, colFn);
  // spikes
  const spikes=12;
  for(let i=0;i<spikes;i++){
    const a=i/spikes*Math.PI*2 + 0.2;
    const x=52+Math.cos(a)*(r+1), y=30+Math.sin(a)*(r-1);
    const x2=52+Math.cos(a)*(r+4+inflate), y2=30+Math.sin(a)*(r+3+inflate);
    const c=pal[0];
    P(s,Math.round(x2),Math.round(y2),c);
    P(s,Math.round((x+x2)/2),Math.round((y+y2)/2),pal[1]);
  }
  eyeAt(s, 60, 24, sil, pal);
  // little pout
  P(s,68,32,pal[0]); P(s,69,32,pal[0]);
}

function drawSunfish(s,f,pal,colFn,sil,frame,W,H){
  // panfish: almost circular, long dorsal + anal making a tall diamond
  for(let i=0;i<14;i++){
    const hh=Math.round(10*Math.sin(i/14*Math.PI));
    for(let j=0;j<hh;j++) P(s,40+i,22-j, pal[4]||pal[1]);
    for(let j=0;j<hh-2;j++) P(s,40+i,42+j, pal[1]);
  }
  drawTailStd(s, 'round', 20, 32, pal);
  fillOval(s, 52, 32, 22, 16, colFn);
  // ear flap
  fillOval(s, 62, 30, 4, 6, ()=>pal[4]||pal[0]);
  eyeAt(s, 64, 26, sil, pal);
}

function drawAngel(s,f,pal,colFn,sil,frame,W,H){
  // very tall disc, triangular dorsal and anal
  const flutter=!sil?(frame%2):0;
  // dorsal triangle
  for(let j=0;j<22;j++){
    const w=Math.max(1, 16-j);
    for(let i=0;i<w;i++) P(s, 44+i-Math.floor(w/4), 24-j+flutter, j<3?pal[3]: (i<2?pal[4]||pal[2]:pal[1]));
  }
  // anal triangle
  for(let j=0;j<16;j++){
    const w=Math.max(1, 12-j);
    for(let i=0;i<w;i++) P(s, 46+i, 36+j, pal[1]);
  }
  drawTailStd(s, 'round', 18, 30, pal);
  fillOval(s, 50, 30, 16, 20, colFn);
  // trailing filaments
  if(!sil) for(let i=0;i<10;i++) P(s, 18-i, 28+Math.round(Math.sin((i+frame)*0.8)*2), pal[4]||pal[2]);
  eyeAt(s, 60, 26, sil, pal);
}

function drawTang(s,f,pal,colFn,sil,frame,W,H){
  drawTailStd(s, 'lunate', 16, 30, pal);
  // tall-ish oval + scalpel spine on tail peduncle
  fillOval(s, 50, 30, 28, 14, colFn);
  // dorsal ridge
  for(let i=0;i<20;i++) P(s, 36+i, 18-((i>6&&i<14)?2:0), pal[4]||pal[1]);
  // surgeon scalpel
  P(s, 28, 36, pal[3]); P(s, 27, 37, pal[4]||pal[3]); P(s, 26, 38, pal[3]);
  P(s, 28, 37, pal[3]);
  eyeAt(s, 68, 26, sil, pal);
}

function drawRay(s,f,pal,colFn,sil,frame,W,H){
  const flap=!sil? Math.round(Math.sin(frame*1.1)*2):0;
  // wide kite wings
  fillDiamond(s, 46, 28+flap, 42, 16, colFn);
  // body ridge
  fillOval(s, 46, 28, 16, 6, colFn);
  // whip tail
  for(let i=0;i<28;i++){
    const y=28+Math.round(Math.sin((i+frame)*0.4)*2);
    P(s, 70+i, y, i>20?pal[0]:pal[1]);
    if(i%5===0) P(s, 70+i, y-1, pal[4]||pal[3]);
  }
  eyeAt(s, 56, 26, sil, pal);
}

function drawEel(s,f,pal,colFn,sil,frame,W,H){
  const serpent=f.art.body==='serpent';
  const amp=serpent?7:4;
  const thick=serpent?7:5;
  const waves=serpent?2.2:1.6;
  // ribbon of overlapping circles along a sine
  for(let i=6;i<W-6;i++){
    const t=i/(W-12);
    const y=H*0.52 + Math.sin(t*Math.PI*waves + frame*0.6)*amp;
    const r=Math.max(2, Math.round(thick*(1-Math.abs(t-0.45)*1.1)));
    const nx=(t-0.5)*2, ny=0;
    for(let yy=-r;yy<=r;yy++) for(let xx=-r;xx<=r;xx++){
      if(xx*xx+yy*yy<=r*r){
        let c=colFn(nx, yy/r, i+xx, Math.round(y)+yy);
        if(Math.abs(yy)===r) c=pal[0];
        P(s,i+xx,Math.round(y)+yy,c);
      }
    }
  }
  // head bump
  fillOval(s, W-18, H*0.52 + Math.sin(1*Math.PI*waves + frame*0.6)*amp*0.3, 8, 6, colFn);
  eyeAt(s, W-14, Math.round(H*0.52)-2, sil, pal);
  if(f.art.extra==='crest' && !sil){
    for(let i=20;i<60;i+=3){
      const t=i/(W-12);
      const y=H*0.52 + Math.sin(t*Math.PI*waves + frame*0.6)*amp - 8;
      P(s,i,Math.round(y), pal[3]); P(s,i,Math.round(y)-1, pal[2]);
    }
  }
  // open mouth
  P(s, W-10, Math.round(H*0.52)+2, pal[0]);
}

function drawCat(s,f,pal,colFn,sil,frame,W,H){
  drawTailStd(s, 'square', 16, 32, pal);
  fillOval(s, 50, 32, 30, 14, colFn);
  // flat broad head
  fillOval(s, 72, 32, 14, 10, colFn);
  // whiskers
  for(let i=0;i<10;i++){
    P(s, 78+i, 34+Math.floor(i/4), pal[2]);
    P(s, 78+i, 28-Math.floor(i/4), pal[2]);
  }
  // barbels
  P(s, 80, 36, pal[1]); P(s, 81, 37, pal[1]);
  eyeAt(s, 76, 28, sil, pal);
}

function drawCarp(s,f,pal,colFn,sil,frame,W,H){
  drawTailStd(s, 'fork', 14, 30, pal);
  // deep-bodied, visible scale grid already in pat
  fillOval(s, 50, 30, 30, 18, colFn);
  // big flowing dorsal
  const fl=!sil?(frame%2):0;
  for(let i=0;i<18;i++){
    const hh=Math.round(8*Math.sin(i/18*Math.PI))+fl;
    for(let j=0;j<hh;j++) P(s, 38+i, 16-j, j>hh-2?pal[3]:pal[2]);
  }
  eyeAt(s, 70, 24, sil, pal);
}

function drawKoi(s,f,pal,colFn,sil,frame,W,H){
  // flowing ribbon tail
  const fl=frame*0.7;
  for(let i=0;i<22;i++){
    const y=30+Math.round(Math.sin(i*0.4+fl)*4);
    for(let j=-3;j<=3;j++) P(s, 4+i, y+j, Math.abs(j)>2?pal[0]: (i<6?pal[3]:pal[1]));
  }
  fillOval(s, 54, 30, 26, 16, colFn);
  // long dorsal
  for(let i=0;i<16;i++){
    const hh=5+Math.round(Math.sin(i/16*Math.PI)*4);
    for(let j=0;j<hh;j++) P(s, 42+i, 16-j + ((frame%2)&&!sil?1:0), pal[2]);
  }
  if(f.art.extra==='core' && !sil){
    fillCirc(s, 54, 30, 3, pal[4]||pal[3]);
    P(s, 54, 30, '#ffffff');
  }
  if(f.art.extra==='fan' && !sil){
    for(let i=0;i<14;i++){
      const hh=8+Math.round(Math.sin(i/14*Math.PI)*8);
      for(let j=0;j<hh;j++) P(s, 40+i, 14-j-(frame%2), j>hh-2?pal[3]:pal[2]);
    }
  }
  eyeAt(s, 70, 24, sil, pal);
}

function drawMaw(s,f,pal,colFn,sil,frame,W,H){
  // gulper: enormous jaw, tiny trailing body and whip
  const open = (!sil && frame%4>1)? 4:2;
  // tiny body
  fillOval(s, 28, 30, 12, 6, colFn);
  for(let i=0;i<24;i++) P(s, 8+i, 30+Math.round(Math.sin(i*0.5+frame)*2), pal[1]);
  // huge hinged jaw
  for(let y=-10-open;y<=10+open;y++){
    for(let x=0;x<28-Math.abs(y)*0.6;x++){
      const inside = x>6 && Math.abs(y)<8+open;
      P(s, 48+x, 30+y, inside? (sil?pal[0]:'#1a1014') : colFn(x/28,y/12,48+x,30+y));
    }
  }
  // teeth
  if(!sil) for(let i=0;i<8;i++){
    P(s, 56+i*2, 30-open-6, pal[3]);
    P(s, 56+i*2, 30+open+6, pal[3]);
  }
  eyeAt(s, 58, 22-open, sil, pal);
}

function drawAngler(s,f,pal,colFn,sil,frame,W,H){
  drawTailStd(s, 'round', 16, 34, pal);
  // humped ugly head
  fillOval(s, 48, 34, 26, 14, colFn);
  fillOval(s, 64, 30, 16, 12, colFn);
  // teeth
  if(!sil){ P(s,74,36,pal[3]); P(s,76,37,pal[3]); P(s,72,36,pal[3]); P(s,74,32,pal[3]); }
  // lure on a stem, bobs
  const lx=80, ly=12 + (sil?0: Math.round(Math.sin(frame*1.3)*3));
  for(let i=0;i<16;i++){
    const t=i/16;
    const x=Math.round(68 + (lx-68)*t), y=Math.round(22 + (ly-22)*t*t);
    P(s,x,y,pal[2]);
  }
  if(!sil){
    fillCirc(s, lx, ly, 2, pal[4]||pal[3]);
    P(s,lx,ly,'#fff4c0');
  } else fillCirc(s, lx, ly, 2, pal[0]);
  // spines
  for(let i=0;i<6;i++) P(s, 40+i*3, 20-i%3, pal[1]);
  eyeAt(s, 68, 26, sil, pal);
}

function drawJelly(s,f,pal,colFn,sil,frame,W,H){
  const pulse = sil?0: (frame%4===0?2:frame%4===2?-1:0);
  // bell
  const ry=14+pulse, rx=22+Math.floor(pulse/2);
  for(let y=0;y<=ry;y++) for(let x=-rx;x<=rx;x++){
    const nx=x/rx, ny=(y-0)/ry;
    if(nx*nx + Math.pow((y)/ry, 1.4) <=1){
      const c=colFn(nx, ny-0.5, 48+x, 16+y);
      P(s, 48+x, 16+y, (y<3?pal[3]:c));
    }
  }
  // bell rim
  for(let x=-rx;x<=rx;x++) if((x*x)/(rx*rx)<1) P(s,48+x, 16+ry, pal[0]);
  // tentacles
  const n=7;
  for(let i=0;i<n;i++){
    const bx=48 + Math.round((i-(n-1)/2)*5);
    let x=bx, y=16+ry+1;
    for(let k=0;k<16;k++){
      x=bx + Math.round(Math.sin(k*0.5 + frame*0.7 + i)*2);
      y=16+ry+1+k;
      P(s,x,y, k>12?pal[0]:pal[2]);
      if(k%3===0) P(s,x+1,y, pal[1]);
    }
  }
  eyeAt(s, 44, 24, sil, pal);
  eyeAt(s, 52, 24, sil, pal);
}

function drawBottle(s,f,pal,colFn,sil,frame,W,H){
  // a living glass bottle with fins and a cork — unique silhouette
  const sway=!sil?Math.round(Math.sin(frame*0.8)*1):0;
  // cork
  for(let y=0;y<6;y++) for(let x=0;x<10;x++) P(s, 64+x, 8+y+sway, y<1||x===0||x===9? '#5a3a14': '#8a5a20');
  // neck
  for(let y=0;y<8;y++) for(let x=0;x<8;x++) P(s, 65+x, 14+y+sway, x===0||x===7? pal[0]: pal[2]);
  // body of bottle
  for(let y=0;y<28;y++){
    const wr=10+Math.min(4, Math.floor(y/3));
    for(let x=-wr;x<=wr;x++){
      const edge=Math.abs(x)===wr;
      let c=edge?pal[0]: colFn(x/wr, y/28-0.5, 70+x, 22+y);
      if(!sil && !edge && x<-2 && x>-6) c=pal[3]; // glass highlight
      P(s, 69+x, 22+y+sway, c);
    }
  }
  // note inside
  if(!sil){ for(let y=0;y<10;y++) for(let x=0;x<6;x++) P(s, 66+x, 30+y+sway, '#d8e8c8'); }
  // fins
  for(let i=0;i<10;i++){
    P(s, 58-i, 36+Math.floor(i/3)+sway, pal[2]);
    P(s, 58-i, 40+i+sway, pal[1]);
    P(s, 80+i, 36+Math.floor(i/3)+sway, pal[2]);
  }
  // little tail
  drawTailStd(s, 'fork', 48, 40+sway, pal);
  eyeAt(s, 74, 28+sway, sil, pal);
}

function drawBearer(s,f,pal,colFn,sil,frame,W,H){
  drawStd(s,f,pal,colFn,sil,frame,W,H);
  // a corked bottle strapped to the back
  const bx=44, by=12 + (sil?0:frame%2);
  for(let y=0;y<12;y++) for(let x=0;x<8;x++){
    const edge=x===0||x===7||y===11;
    P(s,bx+x,by+y, edge?'#6a4a28': (y===0?'#8a5a20': (sil?pal[0]:'#8ec8d4')));
  }
  P(s,bx+3,by-2,'#6a3a18'); P(s,bx+4,by-2,'#6a3a18');
  if(!sil) P(s,bx+3,by+5,'#d8e8c8');
}

function drawSail(s,f,pal,colFn,sil,frame,W,H){
  // huge rippling sail, long bill, lunate tail
  const rip=!sil? Math.round(Math.sin(frame*1.1)):0;
  for(let i=0;i<40;i++){
    const hh=6+Math.round(18*Math.sin(i/40*Math.PI) + Math.sin(i*0.4+frame)*2);
    for(let j=0;j<hh;j++){
      const c=j>hh-2?pal[3]: (j>hh/2?(pal[4]||pal[2]):pal[1]);
      P(s, 28+i, 24-j+rip, c);
    }
  }
  drawTailStd(s, 'lunate', 12, 36, pal);
  fillOval(s, 50, 36, 32, 10, colFn);
  // bill
  for(let i=0;i<18;i++) P(s, 78+i, 36-(i>12?1:0), i<4?pal[2]:pal[3]);
  eyeAt(s, 72, 32, sil, pal);
}

function drawMarlin(s,f,pal,colFn,sil,frame,W,H){
  drawSail(s,f,pal,colFn,sil,frame,W,H);
}

function drawPike(s,f,pal,colFn,sil,frame,W,H){
  drawTailStd(s, 'fork', 10, 30, pal);
  fillOval(s, 46, 30, 34, 9, colFn);
  // duckbill snout
  for(let i=0;i<16;i++){
    const h=3-Math.floor(i/8);
    for(let j=-h;j<=h;j++) P(s, 78+i, 30+j, pal[i<4?2:1]);
  }
  if(!sil){ P(s,88,28,pal[3]); P(s,88,32,pal[3]); } // teeth hint
  eyeAt(s, 72, 26, sil, pal);
}

function drawViper(s,f,pal,colFn,sil,frame,W,H){
  // nightmarish: huge head, needle teeth, thin body
  for(let i=6;i<50;i++){
    const y=32+Math.round(Math.sin(i*0.2+frame*0.5)*3);
    const r=3;
    fillCirc(s,i,y,r, pal[1]);
    P(s,i,y-r, pal[0]);
  }
  const open=!sil && frame%3===0?3:1;
  fillOval(s, 64, 30, 18, 12, colFn);
  // jaws
  for(let i=0;i<14;i++){
    P(s, 76+i, 28-open, pal[2]);
    P(s, 76+i, 34+open, pal[1]);
    if(!sil && i%2===0){ P(s, 78+i, 29-open, pal[3]); P(s, 78+i, 33+open, pal[3]); }
  }
  eyeAt(s, 70, 24, sil, pal);
}

function drawDragon(s,f,pal,colFn,sil,frame,W,H){
  drawEel(s,f,pal,colFn,sil,frame,W,H);
  // extra spines and pectoral "wings"
  for(let i=0;i<12;i++){
    const y=18+i + (sil?0:frame%2);
    P(s, 50+i, y, pal[2]); P(s, 50+i, 44-i, pal[1]);
    P(s, 36+i, 16-Math.floor(i/2), pal[4]||pal[2]);
  }
}

function drawBlob(s,f,pal,colFn,sil,frame,W,H){
  // The Unshaped: shifting overlapping amoebas + orbiting shards
  const blobs=[
    [48,30,22,16],
    [36+Math.round(Math.sin(frame)*4), 26, 14, 12],
    [62, 34+Math.round(Math.cos(frame*0.9)*3), 14, 10],
    [50, 20, 10, 8]
  ];
  blobs.forEach(([cx,cy,rx,ry],i)=>{
    fillOval(s,cx,cy,rx,ry, (nx,ny,x,y)=>{
      let c=colFn(nx,ny,x,y);
      if(!sil && ((x+y+frame)%7===0)) c=pal[4]||pal[3];
      return c;
    });
  });
  // floating fragments
  for(let k=0;k<4;k++){
    const a=frame*0.7+k*1.6;
    const x=48+Math.round(Math.cos(a)*28), y=30+Math.round(Math.sin(a)*12);
    fillCirc(s,x,y, 2, pal[k%2?3:2]);
    if(!sil) P(s,x,y, pal[4]||pal[3]);
  }
  if(!sil){
    fillCirc(s, 50, 30, 3, pal[4]||pal[3]);
    P(s,50,30,'#ffffff');
  }
  eyeAt(s, 60, 24, sil, pal);
}

function drawFlame(s,f,pal,colFn,sil,frame,W,H){
  // living fire: teardrop / flame silhouette, hard bands, flickering tip. No soft glow.
  const flick=sil?0:(frame%4);
  const tips=[[0,-2],[2,0],[-2,1],[1,-1]][flick];
  // flame body made of stacked tapering bands
  for(let y=0;y<44;y++){
    const t=y/44;
    const w=Math.round((1-t)*(1-t)*16 + (1-t)*6 + Math.sin(t*8+frame)* (sil?0:1.5));
    for(let x=-w;x<=w;x++){
      const nx=x/Math.max(1,w), ny=t*2-1;
      let c= pal[t<0.25?3: t<0.45?2: t<0.7?1:0];
      if(Math.abs(x)>w-1) c=pal[0];
      if(!sil && t<0.15 && Math.abs(x)<3) c=pal[3];
      if(!sil && t<0.08) c= pal[6]||'#fff0c0';
      P(s, 50+x + (t>0.7?tips[0]:0), 48-y + (t>0.8?tips[1]:0), sil?pal[0]:c);
    }
  }
  // a dark eye in the hotter core
  eyeAt(s, 52, 34, sil, pal);
  // ember crumbs (hard pixels, not sparkles/glow)
  if(!sil){
    P(s, 40, 16-flick, pal[3]); P(s, 62, 12, pal[2]); P(s, 48, 8, pal[3]);
  }
}

function drawBoneWhale(s,f,pal,colFn,sil,frame,W,H){
  // huge skeletal whale: massive body, rib gaps, skull head, flukes
  drawTailStd(s, 'lunate', 8, 30, pal);
  // fluke already from lunate; add a second fluke plate
  for(let i=0;i<12;i++){
    P(s, 8+i, 22-Math.floor(i/3), pal[2]);
    P(s, 8+i, 38+Math.floor(i/3), pal[1]);
  }
  // long body
  fillOval(s, 48, 30, 36, 14, colFn);
  // ribs: vertical gaps (show "inside")
  if(!sil){
    for(let i=0;i<7;i++){
      const x=30+i*6;
      for(let y=24;y<=36;y++){
        if((y+i)%2===0) P(s,x,y, pal[0]);
        else P(s,x,y, '#0c1014');
      }
    }
  } else {
    for(let i=0;i<7;i++) for(let y=24;y<=36;y++) if(y%2===0) P(s,30+i*6,y,pal[0]);
  }
  // skull-like head
  fillOval(s, 78, 28, 14, 10, colFn);
  // jaw
  for(let i=0;i<10;i++) P(s, 86+i, 32+(i>6?1:0), pal[2]);
  // eye socket (hollow)
  fillCirc(s, 80, 26, 3, sil?pal[0]:'#0c1014');
  P(s, 80, 26, sil?pal[0]:'#e8f0f8');
  // spout puffs (hard pixels, 2 frames)
  if(!sil && frame%2===0){ P(s, 78, 14, pal[3]); P(s, 79, 12, pal[3]); P(s, 77, 12, pal[2]); }
}

function drawFlat(s,f,pal,colFn,sil,frame,W,H){
  // flatfish / voidglass: very thin oval, both eyes on one side
  drawTailStd(s, 'lunate', 14, 30, pal);
  fillOval(s, 50, 30, 32, 10, colFn);
  eyeAt(s, 68, 26, sil, pal);
  eyeAt(s, 62, 24, sil, pal);
}

function fishSpr(f, sil, frame){
  const fr=sil?0:((frame||0)|0);
  const k=f.id+'/'+(sil?'s':'c')+'/f'+fr;
  return FISH_SPR[k]||(FISH_SPR[k]=paintFish(f,{w:FISH_W,h:FISH_H,sil:!!sil,frame:fr}));
}
function fishBig(f, frame){
  const fr=(frame||0)|0;
  const k=f.id+'/b'+fr;
  return FISH_BIG[k]||(FISH_BIG[k]=paintFish(f,{w:FISH_W,h:FISH_H,frame:fr,scale:2}));
}
function fishFrames(f){ return (f.rar>=3)?4:1; }
