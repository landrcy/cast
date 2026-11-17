'use strict';
// First-person dock looking out over the water. Drawn at native pixel size, integer-scaled.

const BAYER4 = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[13,7,15,5]];

const Scene = {
  W:320, H:200, scale:3, hy:76, dockY:0,
  buf:null, g:null, cv:null, cg:null,
  t:0, rm:false,
  clouds:[], birds:[], seaweed:[], bubbles:[], splashes:[], ripples:[], bottles:[],
  sun:{x:0,y:0}, moon:{x:0,y:0},
  tip:{x:0,y:0},
  shake:0,
  pal:null
};

function resizeScene(){
  const cv=document.getElementById('cv');
  const ww=window.innerWidth, wh=window.innerHeight;
  let scale=3;
  if(ww<700 || wh<560) scale=2;
  if(ww>=1440 && wh>=860) scale=4;
  let W=Math.ceil(ww/scale), H=Math.ceil(wh/scale);
  if(W<200){ scale=Math.max(1, Math.floor(ww/200)); W=Math.ceil(ww/scale); H=Math.ceil(wh/scale); }
  Scene.W=W; Scene.H=H; Scene.scale=scale;
  Scene.hy = Math.floor(H * (H>W*1.15 ? 0.29 : 0.38));
  Scene.dockY = Math.floor(H * (H>W*1.15 ? 0.62 : 0.70));
  Scene.uiPad = Math.ceil((H>W*1.15 ? 68 : 52) / scale);
  if(!Scene.buf || Scene.buf.width!==W || Scene.buf.height!==H){
    Scene.buf=document.createElement('canvas'); Scene.buf.width=W; Scene.buf.height=H;
    Scene.g=Scene.buf.getContext('2d'); Scene.g.imageSmoothingEnabled=false;
  }
  cv.width=W; cv.height=H;
  cv.style.width=(W*scale)+'px'; cv.style.height=(H*scale)+'px';
  cv.style.left=Math.floor((ww-W*scale)/2)+'px';
  cv.style.top=Math.floor((wh-H*scale)/2)+'px';
  Scene.cv=cv; Scene.cg=cv.getContext('2d'); Scene.cg.imageSmoothingEnabled=false;
  seedDecor();
}

function seedDecor(){
  const W=Scene.W, H=Scene.H, hy=Scene.hy, rnd=mulberry32(1201);
  Scene.clouds=[];
  for(let i=0;i<5;i++) Scene.clouds.push({x:rnd()*W, y:6+rnd()*(hy-22), s:ART.clouds[i%ART.clouds.length], v:0.08+rnd()*0.12, f:i});
  Scene.birds=[];
  for(let i=0;i<3;i++) Scene.birds.push({x:rnd()*W, y:10+rnd()*(hy-28), v:0.25+rnd()*0.35, z:0.7+rnd()*0.5, fr:0, delay:rnd()*200});
  // no surface seaweed (looked like floating sticks). Kelp is omitted on this surface view.
  Scene.seaweed=[];
  Scene.bubbles=[];
  Scene.bottles=[];
}

// palettes per water + time of day, hard-banded
function skyWaterPal(water, tod){
  const name=todName(tod);
  const isN=name==='NIGHT', isDawn=name==='DAWN', isDusk=name==='DUSK';
  let sky, waterCols, horizon, sun=true, warm=0;
  if(water==='sea' || !water){
    if(isN){ sky=['#02021a','#050530','#0a0a48','#12125a']; waterCols=['#021830','#032848','#043860','#0a4a78','#186090']; horizon='#3a6a90'; sun=false; }
    else if(isDawn){ sky=['#1a1040','#3a2868','#c07080','#f0c090','#ffe8c0']; waterCols=['#0a3858','#0e5878','#1a80a0','#3ab0c0','#80d0d0']; horizon='#f0c8a0'; warm=0.5; }
    else if(isDusk){ sky=['#1a1038','#4a1858','#c05040','#f09060','#ffd090']; waterCols=['#0a2848','#123858','#1a5880','#2a80a0','#58b0b8']; horizon='#f0a070'; warm=0.6; }
    else { sky=['#90E0EF','#ADE8F4','#CAF0F8','#E8FAFF']; waterCols=['#0077B6','#0096C7','#00B4D8','#48CAE4','#90E0EF','#CAF0F8']; horizon='#E8FAFF'; }
  } else if(water==='lake'){
    if(isN){ sky=['#061018','#0c1c28','#143040']; waterCols=['#0a2018','#123828','#1a5040','#2a6858']; horizon='#3a7060'; sun=false; }
    else if(isDawn||isDusk){ sky=['#203048','#c08070','#f0d0a0']; waterCols=['#0a3830','#165848','#2a7860','#4a9a78']; horizon='#f0c8a0'; warm=0.4; }
    else { sky=['#9ad0e8','#b8e0f0','#d0eef8']; waterCols=['#0e5a4a','#1a7a62','#2a9a78','#58c09a','#90d8b8']; horizon='#d8f4e8'; }
  } else if(water==='abyss'){
    if(isN){ sky=['#01010a','#060814','#0a1020']; waterCols=['#02040c','#061020','#0a1a30','#102840']; horizon='#1a3048'; sun=false; }
    else { sky=['#1a2838','#2a4058','#3a5878']; waterCols=['#041020','#0a2038','#123050','#1a4870','#286088']; horizon='#4a80a0'; }
  } else if(water==='void'){
    sky=['#020010','#08041c','#10082c','#1a0a40'];
    waterCols=['#040010','#0c0420','#1a0840','#2c1060','#3c1880'];
    horizon=isN?'#5a30a0':'#6a48c0'; sun=false;
  } else if(water==='ember'){
    if(isN){ sky=['#0a0404','#1a0808','#2a0c0c']; waterCols=['#140404','#2a0808','#4a1008','#7a2008','#b03808']; horizon='#c05010'; sun=false; }
    else { sky=['#2a0c08','#5a2010','#a04018','#e07830']; waterCols=['#1a0604','#3a0c08','#6a1808','#a02808','#e05010']; horizon='#ff9030'; warm=0.7; }
  }
  return {sky, water:waterCols, horizon, sun, warm, night:isN, dawn:isDawn, dusk:isDusk, name};
}

function fillBanded(g, y0, y1, x0, x1, cols){
  const n=cols.length, h=y1-y0;
  for(let y=y0;y<y1;y++){
    const t=(y-y0)/Math.max(1,h);
    const f=t*(n-1), i=Math.floor(f), frac=f-i;
    const thresh=BAYER4[y&3][0 /* filled below */];
    // pick color with bayer dither between adjacent bands
    const b=BAYER4[y&3][(x0)&3]; // will recompute per x
    // faster: whole-line color with x dither
    for(let x=x0;x<x1;x++){
      const bay=BAYER4[y&3][x&3]/16;
      const c = frac>bay ? cols[Math.min(n-1,i+1)] : cols[i];
      g.fillStyle=c; g.fillRect(x,y,1,1);
    }
  }
}
// faster banded fill using imageData when painting a full frame
function putBand(img, W, x, y, c){
  const [r,g,b]=c, k=(y*W+x)*4; img.data[k]=r; img.data[k+1]=g; img.data[k+2]=b; img.data[k+3]=255;
}

function parsePals(p){ return p.map(rgb); }

function dockHalf(y){
  const {W,H,hy,dockY}=Scene;
  const y0=dockY, y1=H+8;
  const t=clamp((y-y0)/(y1-y0),0,1);
  // perspective: width grows faster near the camera
  const p=t*t*(3-2*t); // smoothstep, then bias
  const near=W*0.62, far=Math.max(10, W*0.07);
  return lerp(far, near, t*t*0.35 + t*0.65)/2;
}

function waveAt(x, y, t, water){
  // small *vertical* displacement in pixels for crest lines only — never used to pick big color wedges
  const {hy,H}=Scene;
  const d=clamp((y-hy)/Math.max(1,H-hy),0,1);
  const calm=(water==='lake'||water==='void')?0.5: water==='abyss'?1.2: water==='ember'?0.8:1;
  const amp=calm*(0.5+d*2.0);
  const wl=16+d*34;
  return Math.sin(x/wl + t*1.35)*amp + Math.sin(x/(wl*0.55) - t*1.05)*amp*0.3;
}

function renderScene(state){
  const {W,H,hy,dockY,g,buf,t,rm}=Scene;
  const water=state.water||'sea';
  const tod=state.tod||0.45;
  const pal=skyWaterPal(water, tod);
  Scene.pal=pal;
  const img=g.createImageData(W,H);
  const skyC=parsePals(pal.sky), watC=parsePals(pal.water);
  const horC=rgb(pal.horizon);

  // sun / moon position
  const dayT = ((tod-0.22)+1)%1; // 0 at dawn, 0.48 dusk, etc. not used exactly
  const name=pal.name;
  let sunX, sunY, moonX, moonY;
  if(name==='DAWN'){ sunX=Math.floor(W*0.18); sunY=hy-8; }
  else if(name==='DUSK'){ sunX=Math.floor(W*0.82); sunY=hy-10; }
  else if(name==='DAY'){ sunX=Math.floor(W*0.72); sunY=Math.floor(hy*0.28); }
  else { sunX=Math.floor(W*0.72); sunY=Math.floor(hy*0.32); }
  moonX=Math.floor(W*0.28); moonY=Math.floor(hy*0.30);
  Scene.sun={x:sunX,y:sunY}; Scene.moon={x:moonX,y:moonY};

  // SKY
  for(let y=0;y<hy;y++){
    const tt=y/Math.max(1,hy);
    const f=tt*(skyC.length-1), i=Math.floor(f), frac=f-i;
    for(let x=0;x<W;x++){
      const bay=BAYER4[y&3][x&3]/16;
      const c = frac>bay ? skyC[Math.min(skyC.length-1,i+1)] : skyC[i];
      putBand(img,W,x,y,c);
    }
  }

  // stars (night + void always)
  if(pal.night || water==='void'){
    for(let i=0;i<80;i++){
      const x=(hash2(i,3,11)*W)|0, y=(hash2(i,7,13)*hy)|0;
      if(y>=hy-2) continue;
      const tw=rm?1: (0.4+0.6*((Math.sin(t*2+i)+1)*0.5));
      if(tw>0.55 || hash2(i,1,2)>0.7) putBand(img,W,x,y,[220,230,255]);
    }
  }

  // sun or moon disc (hard bands, no halo)
  if(pal.sun && !pal.night){
    const cols = pal.warm? [[255,244,192],[255,220,120],[240,160,60]] : [[255,250,230],[255,240,180],[255,220,100]];
    const R= name==='DAY'?7:6;
    for(let y=-R;y<=R;y++) for(let x=-R;x<=R;x++){
      const d=x*x+y*y; if(d>R*R) continue;
      const c=d<(R-2)*(R-2)?cols[0]:d<(R-1)*(R-1)?cols[1]:cols[2];
      const px=sunX+x, py=sunY+y;
      if(py>=0&&py<hy&&px>=0&&px<W) putBand(img,W,px,py,c);
    }
  } else if(pal.night || water==='void'){
    const R=6;
    for(let y=-R;y<=R;y++) for(let x=-R;x<=R;x++){
      const d=x*x+y*y; if(d>R*R) continue;
      // crescent-ish shade on the right
      const c= x>2? [160,170,200] : d<(R-2)*(R-2)?[240,244,255]:[200,210,230];
      const px=moonX+x, py=moonY+y;
      if(py>=0&&py<hy&&px>=0&&px<W) putBand(img,W,px,py,c);
    }
  }

  // short sun ticks only, immediately under the disc — no long diagonal wedges, no vertical shaft in the sky
  if(pal.sun && !pal.night && water!=='ember'){
    const rayCol= pal.warm? [255,230,190]: [220,246,255];
    const maxS=8;
    for(let k=-1;k<=1;k++){
      const dirx=k*0.22;
      for(let s=7;s<7+maxS;s++){
        const px=(sunX+dirx*s)|0, py=(sunY+s)|0;
        if(py<0||py>=hy||px<0||px>=W) continue;
        if(BAYER4[py&3][px&3]/16 > 0.55) continue;
        putBand(img,W,px,py,rayCol);
      }
    }
  }

  g.putImageData(img,0,0);

  // clouds (drawn after sky)
  if(water!=='void' && water!=='ember'){
    Scene.clouds.forEach(c=>{
      g.drawImage(c.s, Math.round(c.x), Math.round(c.y));
    });
  }

  // distant land / features on the horizon
  drawHorizonFeatures(g, W, hy, water, pal);

  // WATER surface: calm perspective gradient + horizontal wave crests + a sun column. No diagonal caustics, no stray streaks.
  const img2=g.getImageData(0,hy-1,W,H-(hy-1));
  const off=hy-1;
  const wcols=watC;
  for(let y=hy-1;y<H;y++){
    const d=clamp((y-(hy-1))/Math.max(1,H-hy),0,1);
    const depth = water==='void'? 0.25+d*0.45 : 0.12+d*0.72;
    const f=depth*(wcols.length-1), i0=Math.floor(f), frac=f-i0;
    for(let x=0;x<W;x++){
      const bay=BAYER4[y&3][x&3]/16;
      let c = frac>bay ? wcols[Math.min(wcols.length-1,i0+1)] : wcols[i0];
      const k=((y-off)*W+x)*4;
      img2.data[k]=c[0]; img2.data[k+1]=c[1]; img2.data[k+2]=c[2]; img2.data[k+3]=255;
    }
    if(y===hy){
      for(let x=0;x<W;x++){
        const k=((y-off)*W+x)*4;
        img2.data[k]=horC[0]; img2.data[k+1]=horC[1]; img2.data[k+2]=horC[2]; img2.data[k+3]=255;
      }
    }
  }
  // horizontal wave crest lines (perspective: larger and more spaced near the camera)
  const nWaves = water==='void'?6: water==='lake'?8:10;
  const spark= pal.warm? [255,236,200] : [232,252,255];
  const hi= wcols[Math.min(wcols.length-1, wcols.length-2)];
  for(let i=0;i<nWaves;i++){
    const u=i/(nWaves-1);
    const baseY=hy+4 + Math.pow(u,1.2)*(H-hy-8);
    const amp=rm?0: (0.6+u*2.4)*(water==='lake'||water==='void'?0.5:1);
    const wl=18+u*40;
    for(let x=0;x<W;x++){
      const y=Math.round(baseY + Math.sin(x/wl + t*1.3 + i*0.7)*amp);
      if(y<=hy || y>=H) continue;
      const k=((y-off)*W+x)*4;
      img2.data[k]=hi[0]; img2.data[k+1]=hi[1]; img2.data[k+2]=hi[2]; img2.data[k+3]=255;
      // sparse 1px sparkles on the crest, not a glow
      if(!rm && hash2(x, i, ((t*5)|0))<0.06){
        img2.data[k]=spark[0]; img2.data[k+1]=spark[1]; img2.data[k+2]=spark[2];
      }
    }
  }
  // sun / moon shimmer: sparse sparkles in a soft column under the body only, never a solid vertical line, never on the dock
  if((pal.sun && !pal.night) || pal.night || water==='void'){
    const mx= (pal.night||water==='void') ? Scene.moon.x : Scene.sun.x;
    const warm=pal.warm;
    const dockTop= (typeof Scene!=='undefined' && Scene.dockY) ? Scene.dockY : Math.floor(H*0.70);
    const mid=W/2;
    for(let y=hy+1;y<H;y++){
      const d=clamp((y-hy)/Math.max(1,H-hy),0,1);
      // dock trapezoid grows toward the camera — skip those x
      const u=clamp((y-dockTop)/Math.max(1,H-dockTop),0,1);
      const dockHalf = y<dockTop ? 0 : (6 + u*u*(mid*0.72));
      const half=1.2+d*4;
      for(let x=Math.floor(mx-half); x<=Math.ceil(mx+half); x++){
        if(x<0||x>=W) continue;
        if(y>=dockTop && Math.abs(x-mid)<dockHalf) continue;
        const ad=Math.abs(x-mx)/half;
        // mostly skip so it reads as sparkles, not a white pillar or 1px line
        if(hash2(x, y, ((t*6)|0)) < 0.72+ad*0.25) continue;
        if((x+y+(t|0))%3!==0) continue;
        const k=((y-off)*W+x)*4;
        const lift=warm? [36,22,8]: [20,30,34];
        img2.data[k]  =Math.min(255, img2.data[k]  +Math.round(lift[0]*(1-ad)));
        img2.data[k+1]=Math.min(255, img2.data[k+1]+Math.round(lift[1]*(1-ad)));
        img2.data[k+2]=Math.min(255, img2.data[k+2]+Math.round(lift[2]*(1-ad)));
      }
    }
  }
  g.putImageData(img2,0,hy-1);

  // no surface seaweed

  // bottles drifting on the sea (Sea of Thought flavor)
  if(water==='sea') drawBottles(g, state);

  // ripples (under bobber / splashes)
  Scene.ripples.forEach(r=>{
    g.fillStyle= pal.night? '#8ab0c8' : '#e8f8ff';
    const rad=r.r|0;
    for(let a=0;a<16;a++){
      const ang=a/16*Math.PI*2;
      const x=(r.x+Math.cos(ang)*rad)|0, y=(r.y+Math.sin(ang)*rad*0.35)|0;
      if(x>=0&&y>=hy&&x<W&&y<H) g.fillRect(x,y,1,1);
    }
  });

  // dock / boat
  drawDock(g, water, pal, state);

  // birds
  if(water!=='void' && water!=='ember'){
    const gull=ART.gull;
    Scene.birds.forEach(b=>{
      if(b.y>=hy-4) return;
      const fr = rm?0: ((t*3+b.fr)|0)%2;
      g.drawImage(gull[fr], Math.round(b.x), Math.round(b.y));
    });
  }

  // bobber + line + splash (world, before hands)
  if(state.bob){
    const b=state.bob;
    const bv = rm?0: Math.sin(t*4.2 + b.ph)* (b.under?0.2:1.1);
    const bx=Math.round(b.x), by=Math.round(b.y + bv + (b.under?2:0));
    // line is drawn after we know the rod tip; placeholder here, drawn later
    Scene._bobDraw={bx,by,sc:b.sc, under:b.under};
  } else Scene._bobDraw=null;

  // splashes / droplets
  Scene.splashes.forEach(p=>{
    g.fillStyle=p.c||'#e8f8ff';
    g.fillRect(p.x|0, p.y|0, 1, 1);
    if(p.s>1) g.fillRect((p.x|0)+1, p.y|0, 1, 1);
  });

  // surface fish during a fight
  if(state.phase==='fight' && state.bob && state.hooked){
    drawSurfaceFish(g, state);
  }

  // lantern on the dock at night
  if(pal.night && ART.lantern){
    const lx=Math.floor(W*0.5 - dockHalf(H-30) + 8);
    const ly=H-36;
    g.drawImage(ART.lantern, lx, ly);
  }

  // hands + rod (foreground)
  const pose=state.pose||'idle';
  const tipAim = state.bob? {x:state.bob.x, y:state.bob.y} : null;
  const tip=drawHands({g,w:W,h:H}, pose, state.power||0, state.bend||0, tipAim);
  Scene.tip=tip;

  // fishing line from tip to bobber (or flying lure)
  if(state.lineTo){
    drawLine(g, tip.x, tip.y, state.lineTo.x, state.lineTo.y, state.phase==='fight');
  } else if(Scene._bobDraw){
    drawLine(g, tip.x, tip.y, Scene._bobDraw.bx, Scene._bobDraw.by, state.phase==='fight');
    drawBobber({g}, Scene._bobDraw.bx, Scene._bobDraw.by, Scene._bobDraw.sc, Scene._bobDraw.under);
  }

  // flying fish toward camera on catch
  if(state.flyFish){
    const ff=state.flyFish;
    const spr=fishBig(ff.f);
    const sc=ff.sc;
    const dw=Math.max(8, Math.round(spr.width*sc)), dh=Math.max(5, Math.round(spr.height*sc));
    g.imageSmoothingEnabled=false;
    g.drawImage(spr, ff.x-dw/2, ff.y-dh/2, dw, dh);
  }

  // blit to the on-page canvas, with optional punch shake
  const cg=Scene.cg;
  cg.clearRect(0,0,W,H);
  let ox=0, oy=0;
  if(Scene.shake>0 && !rm){ ox=(hash2((t*60)|0,1,9)-0.5)*Scene.shake*2; oy=(hash2((t*60)|0,2,9)-0.5)*Scene.shake*2; }
  cg.drawImage(buf, ox|0, oy|0);
}

function drawHorizonFeatures(g, W, hy, water, pal){
  if(water==='lake'){
    // distant tree line
    g.fillStyle= pal.night?'#0a1810':'#1a3a28';
    for(let x=0;x<W;x++){
      const h=2+((hash2(x,4,21)*5)|0);
      if(hash2(x,2,8)>0.35) g.fillRect(x, hy-h, 1, h);
    }
    // a couple of taller pines
    for(let i=0;i<6;i++){
      const x=((hash2(i,9,3))*W)|0, h=6+i%4;
      for(let k=0;k<h;k++) g.fillRect(x-(h-k)/3, hy-h+k, Math.max(1,(h-k)*0.6), 1);
    }
  } else if(water==='sea' && !pal.night){
    // a tiny far sail, sometimes
    const x=Math.floor(W*0.22);
    g.fillStyle='#e8f0f4'; g.fillRect(x, hy-7, 1, 7); g.fillRect(x+1, hy-6, 3, 4);
    g.fillStyle='#2a3040'; g.fillRect(x-3, hy-1, 7, 2);
  } else if(water==='ember'){
    // jagged far rim
    g.fillStyle='#2a0c08';
    for(let x=0;x<W;x++){ const h=1+((hash2(x,6,4)*6)|0); g.fillRect(x, hy-h, 1, h); }
  } else if(water==='void'){
    // faint far spires
    g.fillStyle='#1a0a30';
    for(let i=0;i<5;i++){ const x=Math.floor(W*(0.15+i*0.18)); g.fillRect(x, hy-8-(i%3)*3, 2, 11+(i%3)*3); }
  }
}

function drawSeaweed(g, state){
  const t=Scene.t, rm=Scene.rm;
  Scene.seaweed.forEach(s=>{
    const dh=dockHalf(s.y);
    const mid=Scene.W/2;
    // hide stems that would sit under the dock top
    if(Math.abs(s.x-mid) < dh-2) return;
    const pal=s.pal;
    for(let i=0;i<s.h;i++){
      const sway=rm?0: Math.sin(t*1.4 + s.ph + i*0.18)* (1+i*0.12);
      const x=(s.x+sway)|0, y=(s.y-i)|0;
      g.fillStyle= i>s.h-3?pal[2]: i>s.h/2?pal[1]:pal[0];
      g.fillRect(x,y,1+(i<2?1:0),1);
      if(i%3===0) g.fillRect(x+((i%2)?1:-1), y, 1, 1);
    }
  });
}

function drawBottles(g, state){
  const {W,hy,dockY,t}=Scene;
  // two slow bottles on the surface, perspective-scaled
  for(let i=0;i<2;i++){
    const u=(t*0.015 + i*0.47)%1;
    const x= lerp(-8, W+8, u);
    const y= hy+ 10 + i*14 + Math.sin(t*1.2+i)*1.5;
    if(y>dockY-4) continue;
    const sc= i===0?2:3;
    // corked bottle, side view, tiny
    g.fillStyle='#c8a060'; g.fillRect(x, y-sc-1, sc, 1);          // cork
    g.fillStyle='#8ec8d4'; g.fillRect(x-1, y-sc, sc+2, sc+1);     // glass
    g.fillStyle='#6a8a90'; g.fillRect(x-1, y-sc, 1, sc+1);
    g.fillStyle='#d8e8c8'; g.fillRect(x, y-sc+1, 1, sc-1);        // note
  }
}

function drawDock(g, water, pal, state){
  const {W,H,hy,dockY}=Scene;
  const wood = water==='ember'||water==='void' || (WATERS.find(w=>w.id===water)||{}).dock==='stone'
    ? [['#1a1214','#2a1c1e','#3a2a2c','#5a4848'], ['#101018','#1c1c28','#2a2a3a','#4a4a5a']][water==='void'?1:0]
    : ['#3a2414','#5a3820','#7a5230','#c4a06a'];
  const seam='#1a1008';
  const y0=dockY, y1=H;
  // 1px horizontal plank seams in perspective
  if(!Scene._dockSeams || Scene._seamH!==H || Scene._seamDock!==dockY){
    const set=new Set();
    for(let k=1;k<28;k++){
      const u=k/28;
      const y=Math.round(y0 + (y1-y0)*(u*u)); // packed near the far end, open near the camera
      if(y>y0+2 && y<y1-2) set.add(y);
    }
    Scene._dockSeams=set; Scene._seamH=H; Scene._seamDock=dockY;
  }
  // planks receding from the camera
  for(let y=y0;y<y1;y++){
    const half=dockHalf(y);
    const x0=Math.floor(W/2-half), x1=Math.ceil(W/2+half);
    const t=(y-y0)/Math.max(1,y1-y0);
    const boards=7;
    for(let x=x0;x<=x1;x++){
      const u=(x-x0)/Math.max(1,x1-x0);
      const b=Math.min(boards-1, Math.floor(u*boards));
      const edge = Math.abs(u*boards-b)<0.08 || Math.abs(u*boards-(b+1))<0.08;
      // 1px cross-seams only, projected from even world depths (no thick bands)
      const cross = Scene._dockSeams && Scene._dockSeams.has(y);
      let c=wood[1+(hash2(b, (y/Math.max(1,(1-t)*8)|0), 4)>0.55?1:0)];
      if(hash2(x,y,2)>0.97) c=wood[0]; // knot / dent
      if(edge) c=wood[0];
      if(cross) c=seam;
      // top-left light band
      if(!edge && !cross && u<0.18) c=wood[Math.min(wood.length-1,2)];
      if(y===y0) c=wood[0];
      g.fillStyle=c; g.fillRect(x,y,1,1);
    }
    // dock edges
    g.fillStyle=wood[0]; g.fillRect(x0-1,y,1,1); g.fillRect(x1,y,1,1);
  }
  // far end cap (where dock meets the water)
  const half0=dockHalf(y0);
  g.fillStyle=wood[0];
  g.fillRect(Math.floor(W/2-half0)-1, y0-1, Math.ceil(half0*2)+2, 2);
  // pilings left/right, just off the near sides
  const pil=['#2a1a10','#4a3020','#6a4a30'];
  if((WATERS.find(w=>w.id===water)||{}).dock!=='boat'){
    [[0.5,-1,18],[0.72,1,14]].forEach(([ty,side,h])=>{
      const y=Math.floor(lerp(y0,H,ty));
      const x=Math.floor(W/2 + side*(dockHalf(y)+3));
      for(let i=0;i<h;i++){
        g.fillStyle=pil[i<2?2:i>h-3?0:1];
        g.fillRect(x, y-i, 3, 1);
      }
      // reflection
      g.fillStyle=pil[0];
      for(let i=0;i<6;i++) if((i+((Scene.t*2)|0))%2===0) g.fillRect(x, y+1+i, 3, 1);
    });
  } else {
    // boat gunwale instead of a long dock: a short deck + hull sides
    // (the "dock" planks already form the deck; add raised sides)
    for(let y=y0;y<H;y++){
      const half=dockHalf(y);
      g.fillStyle=wood[0];
      g.fillRect(Math.floor(W/2-half)-2, y, 2, 1);
      g.fillRect(Math.ceil(W/2+half), y, 2, 1);
    }
  }
}

function drawLine(g, x0,y0,x1,y1, taut){
  // slightly slack catenary unless taut (fight)
  const mid=0.5, sag = taut?0: Math.min(10, Math.hypot(x1-x0,y1-y0)*0.08);
  g.fillStyle='#1a140e';
  const n=Math.max(8, Math.hypot(x1-x0,y1-y0)|0);
  let px=x0, py=y0;
  for(let i=1;i<=n;i++){
    const t=i/n;
    const x=x0+(x1-x0)*t;
    const y=y0+(y1-y0)*t + Math.sin(t*Math.PI)*sag;
    const ix=x|0, iy=y|0;
    if(ix!==(px|0) || iy!==(py|0)) g.fillRect(ix,iy,1,1);
    px=x; py=y;
  }
}

function drawSurfaceFish(g, state){
  const b=state.bob, f=state.hooked, t=Scene.t;
  if(!b||!f) return;
  const spr=fishSpr(f,false, Math.floor(t*4)%fishFrames(f));
  // fish breaks the surface at the bobber, rocking
  const sc=Math.max(0.35, b.sc/5);
  const dw=Math.max(10, spr.width*sc), dh=Math.max(6, spr.height*sc);
  const ang=Math.sin(t*8)*0.4;
  const x=b.x - dw*0.3, y=b.y - dh*0.35 + Math.sin(t*7)*1.5;
  g.imageSmoothingEnabled=false;
  g.drawImage(spr, x, y, dw, dh);
}

function tickScene(dt, state){
  const rm=Scene.rm, W=Scene.W;
  if(!rm) Scene.t += dt;
  else Scene.t += dt*0.15;
  if(Scene.shake>0) Scene.shake=Math.max(0, Scene.shake-dt*8);
  Scene.clouds.forEach(c=>{
    if(rm) return;
    c.x += c.v*dt*12;
    if(c.x>W+4) c.x=-c.s.width-4;
  });
  Scene.birds.forEach(b=>{
    if(rm) return;
    b.x += b.v*dt*20;
    b.y += Math.sin(Scene.t*1.2+b.delay)*0.02;
    if(b.x>W+8){ b.x=-10; b.y=8+Math.random()*(Scene.hy-24); }
  });
  // ripples expand and die
  Scene.ripples = Scene.ripples.filter(r=>{ r.r+=dt*12; r.life-=dt; return r.life>0; });
  Scene.splashes = Scene.splashes.filter(p=>{
    p.vy+=dt*40; p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt;
    return p.life>0 && p.y<Scene.H;
  });
}

function addRipple(x,y,life){
  Scene.ripples.push({x,y,r:1,life:life||0.9});
  if(Scene.ripples.length>8) Scene.ripples.shift();
}
function addSplash(x,y,n,power){
  n=n||8; power=power||1;
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI - Math.PI, sp=(20+Math.random()*40)*power;
    Scene.splashes.push({x,y, vx:Math.cos(a)*sp*0.4, vy:Math.sin(a)*sp-20*power, life:0.4+Math.random()*0.4, c: Math.random()>0.5?'#e8f8ff':'#c0e8f4', s:Math.random()>0.7?2:1});
  }
}
function punch(n){ Scene.shake=Math.max(Scene.shake, n||3); }

// map a cast power (0-1) and aim x (-1..1) onto the water with perspective
function landingPoint(power, aimX){
  const {W,H,hy,dockY}=Scene;
  // power 0 = just past the dock end (near, large), 1 = near the horizon (far, small)
  const nearY=dockY-6, farY=hy+8;
  // perspective: a linear power should not be a linear Y. farther distances pack near the horizon.
  const zNear=1, zFar=8;
  const z=lerp(zNear, zFar, clamp(power,0,1));
  const u=(z-zNear)/(zFar-zNear);
  // screen y from z (1/z)
  const y= lerp(nearY, farY, Math.pow(u, 0.65));
  const spread=lerp(W*0.22, W*0.08, u);
  const x= W/2 + (aimX||0)*spread;
  const sc=Math.max(2, Math.round(lerp(6, 2, u)));
  return {x, y, sc, z, u};
}
