'use strict';
// Generated-then-converted pixel art. Replaces the old code-drawn fish, rods, logo, and hands.

const PXART = { fish:{}, rods:{}, logo:null, hands:null, ready:false };
const PX_VER = '7';

function pxUrl(path){ return path + '?v=' + PX_VER; }

function loadImage(src){
  return new Promise((res, rej)=>{
    const im=new Image();
    im.onload=()=>res(im);
    im.onerror=()=>rej(new Error('missing art '+src));
    im.src=src;
  });
}

function loadPxArt(){
  const jobs=[];
  FISH.forEach(f=>{
    jobs.push(loadImage(pxUrl('art/fish/'+f.id+'.png')).then(im=>{ PXART.fish[f.id]=im; }));
  });
  RODS.forEach(r=>{
    jobs.push(loadImage(pxUrl('art/rods/'+r.id+'.png')).then(im=>{ PXART.rods[r.id]=im; }));
  });
  jobs.push(loadImage(pxUrl('art/logo.png')).then(im=>{ PXART.logo=im; }));
  jobs.push(loadImage(pxUrl('art/hands.png')).then(im=>{ PXART.hands=im; }));
  return Promise.all(jobs).then(()=>{ PXART.ready=true; });
}

function makeSil(img){
  const c=document.createElement('canvas');
  c.width=img.width; c.height=img.height;
  const g=c.getContext('2d');
  g.imageSmoothingEnabled=false;
  g.drawImage(img,0,0);
  const d=g.getImageData(0,0,c.width,c.height), px=d.data;
  for(let i=0;i<px.length;i+=4){
    if(px[i+3]>24){ px[i]=8; px[i+1]=14; px[i+2]=26; px[i+3]=255; }
    else px[i+3]=0;
  }
  g.putImageData(d,0,0);
  return c;
}

function fitInto(img, dw, dh){
  const c=document.createElement('canvas');
  c.width=dw; c.height=dh;
  const g=c.getContext('2d');
  g.imageSmoothingEnabled=false;
  const sc=Math.min(dw/img.width, dh/img.height);
  const isc=Math.floor(sc+1e-6);
  const use=(isc>=1 && isc*img.width<=dw && isc*img.height<=dh && (sc-isc)<0.25)? isc : sc;
  const tw=Math.max(1, Math.round(img.width*use));
  const th=Math.max(1, Math.round(img.height*use));
  g.drawImage(img, Math.floor((dw-tw)/2), Math.floor((dh-th)/2), tw, th);
  return c;
}

function fishSpr(f, sil, frame){
  const fr=sil?0:((frame||0)|0);
  const k=f.id+'/'+(sil?'s':'c')+'/f'+fr;
  if(FISH_SPR[k]) return FISH_SPR[k];
  const img=PXART.fish[f.id];
  if(!img){
    const blank=document.createElement('canvas'); blank.width=FISH_W; blank.height=FISH_H;
    return FISH_SPR[k]=blank;
  }
  const src=sil?makeSil(img):img;
  return FISH_SPR[k]=fitInto(src, FISH_W, FISH_H);
}

function fishBig(f, frame){
  const fr=(frame||0)|0;
  const k=f.id+'/b'+fr;
  if(FISH_BIG[k]) return FISH_BIG[k];
  const img=PXART.fish[f.id];
  if(!img){
    const blank=document.createElement('canvas'); blank.width=64; blank.height=32;
    return FISH_BIG[k]=blank;
  }
  // native converted sprite — commons stay ~64, mythics stay 256+
  const c=document.createElement('canvas');
  c.width=img.width; c.height=img.height;
  const g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.drawImage(img,0,0);
  return FISH_BIG[k]=c;
}

function fishFrames(f){ return 1; }

function paintRod(rod, opts){
  const img=PXART.rods[rod.id];
  if(!img){
    const c=document.createElement('canvas'); c.width=32; c.height=128; return c;
  }
  if(opts && (opts.w||opts.h)){
    const w=opts.w||Math.round(img.width*(opts.h/img.height));
    const h=opts.h||Math.round(img.height*(opts.w/img.width));
    const c=document.createElement('canvas'); c.width=w; c.height=h;
    const g=c.getContext('2d'); g.imageSmoothingEnabled=false;
    g.drawImage(img,0,0,w,h);
    return c;
  }
  return img;
}

function rodSpr(rod, frame){
  const k=rod.id+'/f'+((frame||0)|0);
  return ROD_SPR[k]||(ROD_SPR[k]=paintRod(rod,{frame:frame||0}));
}

function paintLogo(opts){
  opts=opts||{};
  const img=PXART.logo;
  if(!img){
    const c=document.createElement('canvas'); c.width=240; c.height=78; return c;
  }
  // title used to request scale 8 of a tiny source; 2x of the 240px wordmark is a close on-screen match
  const sc = opts.scale && opts.scale>=8 ? 2 : Math.max(1, opts.scale||2);
  const c=document.createElement('canvas');
  c.width=img.width*sc; c.height=img.height*sc;
  const g=c.getContext('2d'); g.imageSmoothingEnabled=false;
  g.drawImage(img,0,0,c.width,c.height);
  return c;
}

const ROD_PX={};
function rodPixels(img, id){
  if(ROD_PX[id]) return ROD_PX[id];
  const c=document.createElement('canvas');
  c.width=img.width; c.height=img.height;
  const cg=c.getContext('2d'); cg.imageSmoothingEnabled=false; cg.drawImage(img,0,0);
  const d=cg.getImageData(0,0,c.width,c.height);
  // precompute opaque xmin/xmax per row so we can blit quickly
  const rows=new Array(c.height);
  for(let y=0;y<c.height;y++){
    let min=c.width, max=-1;
    const off=y*c.width*4;
    for(let x=0;x<c.width;x++){
      if(d.data[off+x*4+3]>16){ if(x<min) min=x; max=x; }
    }
    rows[y]={min,max};
  }
  return ROD_PX[id]={w:c.width,h:c.height,data:d.data,rows};
}

function drawRodAlong(g, img, id, gx, gy, tx, ty, bend){
  const px=rodPixels(img, id||img.src||'rod');
  const len=Math.max(8, Math.hypot(tx-gx, ty-gy));
  const steps=Math.max(px.h, Math.round(len));
  // perpendicular for width
  const dx=(tx-gx)/len, dy=(ty-gy)/len;
  const pxd=-dy, pyd=dx;
  for(let i=0;i<=steps;i++){
    const u=i/steps;
    const srcY=Math.min(px.h-1, Math.max(0, Math.round((1-u)*(px.h-1))));
    const row=px.rows[srcY];
    if(row.max<0) continue;
    const bAmt=(bend||0)*Math.sin(u*Math.PI)*10;
    const cx=gx+(tx-gx)*u + pxd*bAmt;
    const cy=gy+(ty-gy)*u + pyd*bAmt;
    // perspective taper: thicker at the grip, thinner at the tip
    const scaleW=0.40 + (1-u)*0.70;
    const mid=px.w/2;
    for(let sx=row.min; sx<=row.max; sx++){
      const a=px.data[(srcY*px.w+sx)*4+3];
      if(a<16) continue;
      const ox=Math.round(cx + (sx-mid)*scaleW*pxd);
      const oy=Math.round(cy + (sx-mid)*scaleW*pyd);
      // also step along the rod axis a bit? one pixel per step is enough
      g.fillStyle='rgba('+px.data[(srcY*px.w+sx)*4]+','+px.data[(srcY*px.w+sx)*4+1]+','+px.data[(srcY*px.w+sx)*4+2]+','+(a/255)+')';
      g.fillRect(ox,oy,1,1);
    }
  }
}

function cropHand(img, x0, x1){
  const w=Math.max(1, x1-x0), h=img.height;
  const c=document.createElement('canvas');
  c.width=w; c.height=h;
  const g=c.getContext('2d');
  g.imageSmoothingEnabled=false;
  g.drawImage(img, x0, 0, w, h, 0, 0, w, h);
  return c;
}

function splitHands(){
  if(PXART._handL || !PXART.hands) return;
  const him=PXART.hands;
  // empty-grip sprite: gap columns ~115–142 on a 260-wide image
  const split=128;
  PXART._handL=cropHand(him, 0, split);
  PXART._handR=cropHand(him, split, him.width);
}

function drawHands(s, pose, power, bend, tipOut){
  const W=s.w, H=s.h, g=s.g;
  const pad=(typeof Scene!=='undefined' && Scene.uiPad)? Scene.uiPad : 0;
  const ground=H-pad-1;
  const dockY=(typeof Scene!=='undefined' && Scene.dockY)? Scene.dockY : Math.floor(H*0.70);
  splitHands();

  // plant each arm from the bottom edge, above the HTML dock (uiPad)
  const maxH=Math.max(32, Math.floor(H*0.26));
  function place(spr, side){
    if(!spr) return null;
    let h=maxH;
    let w=Math.round(spr.width*(h/spr.height));
    const maxW=Math.floor(W*0.34);
    if(w>maxW){ w=maxW; h=Math.round(spr.height*(w/spr.width)); }
    const x = side==='L' ? 1 : (W-w-1);
    const y = ground-h+2;
    return {spr,x,y,w,h};
  }
  const L=place(PXART._handL,'L');
  const R=place(PXART._handR,'R');

  // right-fist grip in the generated sprite (local ~0.37, 0.38 of the right crop)
  let gx, gy;
  if(R){
    gx=R.x + Math.floor(R.w*0.37);
    gy=R.y + Math.floor(R.h*0.38);
  } else {
    gx=Math.floor(W*0.78); gy=ground-18;
  }

  const isTitle=(typeof MODE!=='undefined' && MODE==='title');
  let tipTarget;
  if(isTitle){
    if(H>W*1.15){
      // tall phone: keep the shaft in the lower-right, well below CAST OFF
      tipTarget={x:Math.floor(W*0.80), y:Math.floor(H*0.70)};
    } else {
      // over the water to the right of the pier, below CAST OFF
      tipTarget={x:Math.floor(W*0.74), y:Math.min(Math.max(dockY+6, Math.floor(H*0.58)), Math.floor(H*0.62))};
    }
  } else {
    tipTarget={x:Math.floor(W*0.62), y:Math.max(14, dockY-18)};
  }
  if(!isTitle){
    if(pose==='charge'){
      const p=power||0;
      tipTarget={x:Math.floor(lerp(W*0.62, W*0.82, p)), y:Math.floor(lerp(dockY-20, ground-36, p))};
    } else if(pose==='cast'){
      const p=power||0;
      tipTarget={x:Math.floor(lerp(W*0.82, W*0.56, p)), y:Math.floor(lerp(ground-36, dockY-18, p))};
    } else if((pose==='fight'||pose==='idle') && tipOut){
      tipTarget={x:Math.round(lerp(tipTarget.x, tipOut.x, 0.40)), y:Math.round(lerp(tipTarget.y, tipOut.y, 0.40))};
      tipTarget.y=Math.max(dockY-36, Math.min(tipTarget.y, ground-28));
      tipTarget.x=Math.max(tipTarget.x, Math.floor(W*0.52));
    }
  }

  // extend slightly past the grip so the unique rod's own butt and reel show in the fist
  const dx=tipTarget.x-gx, dy=tipTarget.y-gy;
  const len=Math.hypot(dx,dy)||1;
  const back=Math.max(10, Math.floor(len*0.16));
  const gx0=Math.round(gx - dx/len*back);
  const gy0=Math.round(gy - dy/len*back);

  const maxLen=Math.floor(H*(isTitle?(H>W*1.15?0.26:0.40):(H>W*1.15?0.36:0.46)));
  let tx=tipTarget.x, ty=tipTarget.y;
  const rlen=Math.hypot(tx-gx0, ty-gy0)||1;
  if(rlen>maxLen){
    tx=Math.round(gx0+(tx-gx0)/rlen*maxLen);
    ty=Math.round(gy0+(ty-gy0)/rlen*maxLen);
  }

  const rod=(typeof G!=='undefined' && typeof rodByLevel==='function') ? rodByLevel(G.up.rod) : null;
  const rim=rod && PXART.rods[rod.id];
  if(rim){
    drawRodAlong(g, rim, rod.id, gx0, gy0, tx, ty, pose==='fight'?(bend||0):0);
  } else {
    g.strokeStyle='#c4a06a'; g.lineWidth=2;
    g.beginPath(); g.moveTo(gx0,gy0); g.lineTo(tx, ty); g.stroke();
  }

  g.imageSmoothingEnabled=false;
  if(L) g.drawImage(L.spr, L.x, L.y, L.w, L.h);
  if(R) g.drawImage(R.spr, R.x, R.y, R.w, R.h);
  return {x:tx, y:ty};
}
