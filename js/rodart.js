'use strict';
// 13 named rods, each with a unique silhouette. Vertical display sprite, handle at the bottom.

const ROD_SPR={};
function paintRod(rod, opts){
  opts=opts||{};
  const W=opts.w||48, H=opts.h||128, frame=opts.frame||0;
  const s=mk(W,H);
  const sh=rod.shaft, hd=rod.handle, ac=rod.accent, shape=rod.shape||'classic';
  const cx=Math.floor(W/2);
  const drawers={crook:rodCrook, cane:rodCane, classic:rodClassic, coral:rodCoral, heavy:rodHeavy,
    bone:rodBone, crystal:rodCrystal, storm:rodStorm, lava:rodLava, void:rodVoid, ell:rodEll};
  (drawers[shape]||rodClassic)(s, rod, cx, W, H, frame);
  outlineSprite(s, '#0a0810');
  return s.c;
}
function rodSpr(rod, frame){
  const k=rod.id+'/f'+((frame||0)|0);
  return ROD_SPR[k]||(ROD_SPR[k]=paintRod(rod,{frame:frame||0}));
}

function shaftLine(s, cx, y0, y1, thickFn, colFn){
  for(let y=y0;y>=y1;y--){
    const t=(y-y1)/Math.max(1,y0-y1);
    const thick=thickFn(t,y);
    const c=colFn(t,y);
    const x0=cx-Math.floor((thick-1)/2);
    R(s,x0,y,thick,1,c);
  }
}
function drawHandle(s, rod, cx, hy, hw){
  const hd=rod.handle, hh=16;
  for(let y=0;y<hh;y++){
    const c=y<2||y>hh-3?hd[0]: (y%5===0?hd[0]:hd[1]);
    R(s, cx-Math.floor(hw/2), hy+y, hw, 1, c);
    P(s, cx+Math.floor(hw/2)-1, hy+y, hd[0]);
  }
  if(rod.wrap){ for(let k=0;k<3;k++) R(s, cx-Math.floor(hw/2), hy+3+k*4, hw, 1, rod.wrap); }
}
function drawReel(s, rod, rx, ry){
  if(!rod.reel || rod.reel==='none') return;
  const pal={
    cork:['#6a4a20','#b08a50','#e0c080'],
    brass:['#6a4a10','#c4a060','#f0e0a0'],
    silver:['#3a4a50','#8aa0b0','#e0e8f0'],
    iron:['#1a1c20','#5a6068','#b0b8c0'],
    gold:['#6a4a08','#e0b020','#fff0a0'],
    shell:['#6a3038','#c07070','#f0c0b8'],
    bone:['#4a4030','#c8b898','#efe4c8'],
    crystal:['#1a3048','#80d0f0','#e8ffff'],
    ember:['#4a0c00','#ff7a10','#ffe68a'],
    void:['#14001e','#8f2fd6','#5ff6ff'],
    dark:['#101018','#3a4a68','#8a9ab8']
  }[rod.reel]||['#2a3038','#5a6870','#a0b0b8'];
  R(s, rx, ry, 9, 9, pal[1]);
  R(s, rx+1, ry+1, 7, 7, pal[0]);
  P(s, rx+4, ry+4, pal[2]);
  R(s, rx+8, ry+3, 3, 3, pal[2]);
  P(s, rx, ry, pal[2]);
}

function rodCrook(s, rod, cx, W, H){
  // crooked driftwood branch, no reel, twine
  const hy=H-18;
  drawHandle(s, rod, cx, hy, 6);
  let x=cx, y=hy-1;
  for(let i=0;i<H-28;i++){
    if(i===20||i===45||i===70) x += (i===45?-1:1);
    const c= rod.shaft[(i%11===0)?0: (i%3?2:1)];
    R(s, x-1, y-i, i<8?3:2, 1, c);
    if(i%9===0) P(s, x-2, y-i, rod.shaft[0]); // knot
    P(s, x-1, y-i, rod.shaft[3]);
  }
  // twine wraps
  for(let k=0;k<5;k++) R(s, cx-2, hy-8-k*14, 5, 1, '#6a4a28');
  P(s, x, y-(H-28), '#8a6a40');
}

function rodCane(s, rod, cx, W, H){
  const hy=H-18;
  drawHandle(s, rod, cx, hy, 6);
  drawReel(s, rod, cx+3, hy+4);
  shaftLine(s, cx, hy-1, 8, t=>t>0.85?3:2, (t,y)=>{
    if(((hy-y)%9)===0) return rod.shaft[0]; // cane joints
    return rod.shaft[t>0.5?1:2];
  });
  P(s, cx, 7, rod.shaft[3]); P(s, cx, 6, rod.shaft[3]);
}

function rodClassic(s, rod, cx, W, H){
  const hy=H-18;
  drawHandle(s, rod, cx, hy, 7);
  drawReel(s, rod, cx+4, hy+4);
  shaftLine(s, cx, hy-1, 8, t=>t>0.88?3: t>0.3?2:1, (t,y)=>{
    if(rod.wrap && y>hy-8 && y<hy-2) return rod.wrap;
    if(((hy-y)%12)===0) return rod.shaft[3];
    return rod.shaft[t>0.7?1:2];
  });
  // guides
  [0.25,0.45,0.65,0.82].forEach(p=>{
    const y=Math.round(lerp(8, hy-1, p));
    P(s, cx-2, y, rod.accent); P(s, cx+2, y, rod.accent); P(s, cx-2, y-1, rod.accent);
  });
  P(s, cx, 7, rod.accent);
}

function rodCoral(s, rod, cx, W, H){
  const hy=H-18, sh=rod.shaft;
  drawHandle(s, rod, cx, hy, 7);
  drawReel(s, rod, cx+4, hy+4);
  // organic tapering trunk with side branches
  shaftLine(s, cx, hy-1, 10, t=>t>0.8?4: t>0.4?3:2, (t,y)=>sh[t>0.6?1:2]);
  const branches=[[-1,30,10], [1,48,12], [-1,66,8], [1,22,7]];
  branches.forEach(([dir,off,len])=>{
    const y0=hy-off;
    for(let i=0;i<len;i++){
      const x=cx+dir*(2+Math.floor(i*0.7)), y=y0-Math.floor(i*0.8);
      P(s,x,y, sh[i>len-3?3:2]); P(s,x,y-1, sh[1]);
      if(i===len-1){ P(s,x+dir,y-1, sh[3]); P(s,x,y-2, sh[3]); } // polyp tip
    }
  });
  // polyps at the tip
  P(s, cx, 8, sh[3]); P(s, cx-1, 7, sh[3]); P(s, cx+1, 7, sh[3]); P(s, cx, 6, rod.accent);
}

function rodHeavy(s, rod, cx, W, H){
  const hy=H-18;
  drawHandle(s, rod, cx, hy, 8);
  drawReel(s, rod, cx+5, hy+3);
  // thick iron shaft, squared
  shaftLine(s, cx, hy-1, 8, t=>t>0.7?5: t>0.3?4:3, (t,y)=>{
    if(((hy-y)%8)===0) return rod.shaft[3];
    return rod.shaft[1];
  });
  // reinforced hoops
  [16,40,70].forEach(off=>{ R(s, cx-3, hy-off, 7, 2, rod.shaft[3]); });
  // spear tip
  P(s, cx, 7, '#e8eef0'); P(s, cx, 6, '#e8eef0'); P(s, cx, 5, '#e8eef0'); P(s, cx-1, 7, rod.shaft[3]); P(s, cx+1, 7, rod.shaft[3]);
}

function rodBone(s, rod, cx, W, H){
  const hy=H-18, sh=rod.shaft;
  drawHandle(s, rod, cx, hy, 7);
  drawReel(s, rod, cx+4, hy+4);
  // stacked vertebrae
  for(let i=0;i<16;i++){
    const y=hy-6-i*6;
    if(y<8) break;
    const w=4-(i>12?1:0);
    R(s, cx-w, y, w*2+1, 3, sh[1]);
    R(s, cx-w-2, y+1, 2, 1, sh[2]); // process
    R(s, cx+w+1, y+1, 2, 1, sh[2]);
    P(s, cx, y+1, sh[3]);
    R(s, cx-1, y-2, 3, 2, sh[0]); // disc
  }
  // skull tip
  R(s, cx-3, 4, 7, 6, sh[2]);
  P(s, cx-2, 6, '#1a1410'); P(s, cx+2, 6, '#1a1410');
  P(s, cx, 4, sh[3]);
}

function rodCrystal(s, rod, cx, W, H){
  const hy=H-18, sh=rod.shaft;
  drawHandle(s, rod, cx, hy, 7);
  drawReel(s, rod, cx+4, hy+4);
  // faceted shaft: hex-ish, hard facet edges
  for(let y=hy-1;y>=10;y--){
    const t=(hy-y)/(hy-10);
    const w=t<0.15?3: t<0.7?2:1;
    // left facet dark, right facet light
    if(w>=2){ P(s, cx-w, y, sh[0]); P(s, cx-w+1, y, sh[1]); }
    P(s, cx, y, sh[2]);
    if(w>=2){ P(s, cx+1, y, sh[3]); if(w>=3) P(s, cx+2, y, sh[2]); }
    if(((hy-y)%7)===0){ R(s, cx-w-1, y, (w*2+3), 1, sh[3]); } // facet joint
  }
  // crystal tip: diamond
  P(s, cx, 4, sh[3]); P(s, cx-1, 5, sh[2]); P(s, cx, 5, '#ffffff'); P(s, cx+1, 5, sh[2]);
  P(s, cx-2, 6, sh[1]); P(s, cx, 6, sh[3]); P(s, cx+2, 6, sh[1]);
  P(s, cx-1, 7, sh[2]); P(s, cx, 7, sh[3]); P(s, cx+1, 7, sh[2]);
  P(s, cx, 8, sh[2]);
}

function rodStorm(s, rod, cx, W, H){
  const hy=H-18, sh=rod.shaft, frame=0; // static bolt pose on the sheet; FP can animate later
  drawHandle(s, rod, cx, hy, 7);
  drawReel(s, rod, cx+4, hy+4);
  // metal rod
  shaftLine(s, cx, hy-1, 10, t=>t>0.85?3:2, (t,y)=>sh[((hy-y)%10===0)?3:1]);
  // pronged lightning tip
  P(s, cx, 6, rod.accent); P(s, cx-2, 7, rod.accent); P(s, cx+2, 7, rod.accent);
  P(s, cx, 5, '#fff4c0'); P(s, cx-3, 8, sh[3]); P(s, cx+3, 8, sh[3]);
  // crackling pixel arcs (hard pixels, no glow)
  const bolts=[[-6,20, -3,28, -7,34], [6,18, 8,26, 5,32], [-5,50, -8,58, -4,64], [7,55, 10,62, 6,70]];
  bolts.forEach(pts=>{
    for(let i=0;i<pts.length;i+=2){
      const x=cx+pts[i], y=hy-pts[i+1];
      P(s,x,y, rod.accent);
      if(i+2<pts.length){
        const x2=cx+pts[i+2], y2=hy-pts[i+3];
        P(s, Math.round((x+x2)/2), Math.round((y+y2)/2), '#fff4c0');
      }
    }
  });
}

function rodLava(s, rod, cx, W, H){
  const hy=H-18, sh=rod.shaft;
  drawHandle(s, rod, cx, hy, 7);
  drawReel(s, rod, cx+4, hy+4);
  shaftLine(s, cx, hy-1, 10, t=>t>0.8?4: t>0.4?3:2, (t,y)=>{
    if(((hy-y)%7)===0) return rod.accent;
    return sh[t>0.6?1:2];
  });
  // drips
  [[-2,24],[2,38],[-1,56],[1,80]].forEach(([dx,off])=>{
    P(s, cx+dx, hy-off, sh[3]);
    P(s, cx+dx, hy-off+1, sh[2]);
    P(s, cx+dx, hy-off+2, sh[1]);
  });
  // ember tip
  P(s, cx, 7, '#ff8010'); P(s, cx, 6, '#ffe68a'); P(s, cx-1, 7, '#e03800'); P(s, cx+1, 7, '#e03800'); P(s, cx, 5, '#fff4c0');
}

function rodVoid(s, rod, cx, W, H){
  const hy=H-18, sh=rod.shaft;
  drawHandle(s, rod, cx, hy, 7);
  drawReel(s, rod, cx+4, hy+4);
  // broken shaft with gaps, floating fragments
  shaftLine(s, cx, hy-1, 10, t=>t>0.85?3:2, (t,y)=>sh[t>0.5?1:2]);
  // carve gaps
  [20,42,68].forEach(off=>{
    for(let k=0;k<4;k++){ P(s, cx, hy-off-k, '#00000000'); R(s, cx-2, hy-off-k, 5, 1, '#000000'); }
    // actually punch with dark bg so outline still works — leave a hole by not painting, fill with magenta then... 
    // we'll paint fragments around the gap instead of true holes
  });
  // floating shards around the shaft
  const shards=[[-8,22], [9,30], [-7,48], [10,56], [-9,74], [8,82], [-6,100], [7,16]];
  shards.forEach(([dx,off],i)=>{
    const x=cx+dx, y=hy-off;
    P(s,x,y, sh[2]); P(s,x+1,y, sh[3]); P(s,x,y+1, sh[1]);
    if(i%2===0) P(s,x-1,y, rod.accent);
  });
  P(s, cx, 7, rod.accent); P(s, cx, 6, '#ffffff'); P(s, cx-1, 7, sh[3]); P(s, cx+1, 7, sh[3]);
}

function rodEll(s, rod, cx, W, H){
  // Cosmic L: the shaft is a literal L, star-flecked, gold reel
  const hy=H-18, sh=rod.shaft;
  drawHandle(s, rod, cx-6, hy, 7);
  drawReel(s, rod, cx-2, hy+4);
  // vertical bar of the L (left of center)
  const vx=cx-6;
  shaftLine(s, vx, hy-1, 16, t=>t>0.85?4:3, (t,y)=>{
    if(((hy-y)%5)===0) return rod.accent;
    return sh[2];
  });
  // highlight
  for(let y=hy-1;y>=16;y--) P(s, vx-1, y, sh[3]);
  // horizontal arm of the L at the top
  for(let x=vx;x<=vx+20;x++){
    R(s, x, 16, 1, 4, sh[2]);
    P(s, x, 16, sh[3]);
    P(s, x, 19, sh[0]);
  }
  // star tip on the arm
  const tx=vx+20, ty=17;
  P(s, tx+2, ty, rod.accent); P(s, tx+3, ty-1, rod.accent); P(s, tx+3, ty, '#fff4c0');
  P(s, tx+3, ty+1, rod.accent); P(s, tx+4, ty, rod.accent);
  // a few hard star pixels along the shaft (not a glow)
  [[vx+4,40],[vx-4,60],[vx+5,84],[vx+12,14]].forEach(([x,off])=>{
    P(s,x,hy-off, rod.accent); P(s,x,hy-off-1,'#fff4c0');
  });
}
