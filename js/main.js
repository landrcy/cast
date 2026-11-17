'use strict';

let MODE='title'; // title | play
const Input={down:false, x:0, y:0, id:null, steer:null};

function pointerOnCanvas(e){
  const t=e.target;
  if(t.closest && (t.closest('#dock')||t.closest('#panels')||t.closest('#p-admin')||t.closest('#title')||t.closest('#howto')||t.closest('#catch')||t.closest('#hud'))) return false;
  return true;
}

function bindInput(){
  const cv=document.getElementById('cv');
  const down=e=>{
    if(MODE!=='play') return;
    if(e.target.closest && e.target.closest('#howto.show, #catch.show, .panel.on, #dock, #p-admin.on, .admin-modal.on')) return;
    if(UI.open && e.target.closest && e.target.closest('#panels')) return;
    // close panels if tapping the scene
    if(UI.open && pointerOnCanvas(e) && e.target===cv){ UI.close(); return; }
    Input.down=true; Input.id=e.pointerId;
    const r=cv.getBoundingClientRect();
    Input.x=(e.clientX-r.left)/r.width; Input.y=(e.clientY-r.top)/r.height;
    if(Play.phase==='bite'){ tryHook(); return; }
    if(Play.phase==='fight'){ updateSteer(e); return; }
    if(Play.phase==='wait'){ reelIn(false); return; }
    if(Play.phase==='idle') startCharge();
  };
  const move=e=>{
    if(!Input.down) return;
    if(Play.phase==='fight') updateSteer(e);
  };
  const up=e=>{
    if(!Input.down) return;
    Input.down=false; Input.steer=null; Play._steer=null;
    if(Play.phase==='charge') releaseCharge();
  };
  window.addEventListener('pointerdown', down);
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
  cv.addEventListener('contextmenu', e=>e.preventDefault());

  window.addEventListener('keydown', e=>{
    if(ADMIN.isTyping(e)) return;
    if(e.code==='KeyL'){ e.preventDefault(); ADMIN.toggle(); return; }
    if(e.code==='Escape'){
      e.preventDefault();
      if(ADMIN.open) ADMIN.close();
      else if(UI.open) UI.close();
      return;
    }
    if(MODE!=='play') return;
    if(e.code==='Space' || e.code==='Enter'){
      e.preventDefault();
      if(Play.phase==='bite') tryHook();
      else if(Play.phase==='idle' && !Input.down){ Input.down=true; startCharge(); }
      return;
    }
    if(Play.phase==='fight'){
      if(e.code==='ArrowLeft'||e.code==='KeyA'){ Play._steer=-1; e.preventDefault(); }
      if(e.code==='ArrowRight'||e.code==='KeyD'){ Play._steer=1; e.preventDefault(); }
    }
  });
  window.addEventListener('keyup', e=>{
    if(e.code==='Space'||e.code==='Enter'){
      if(Play.phase==='charge') releaseCharge();
      Input.down=false;
    }
    if(e.code==='ArrowLeft'||e.code==='KeyA'||e.code==='ArrowRight'||e.code==='KeyD'){
      if(Play._steer) Play._steer=null;
    }
  });
}

function updateSteer(e){
  const bar=document.getElementById('f-bar');
  const r=bar.getBoundingClientRect();
  let t=(e.clientX-r.left)/r.width;
  if(t<0||t>1){
    // also allow dragging anywhere on the lower half of the screen
    const cv=document.getElementById('cv');
    const cr=cv.getBoundingClientRect();
    t=(e.clientX-cr.left)/cr.width;
  }
  t=clamp(t,0,1);
  // steer toward the pointer rather than snapping (feels better)
  Play._steer = clamp((t-Play.mark)*6, -1.5, 1.5);
  Play.mark = clamp(Play.mark + (t-Play.mark)*0.45, 0, 1);
}

let last=0;
function frame(ts){
  const dt=Math.min(0.05, (ts-last)/1000 || 0.016);
  last=ts;
  tickScene(dt, sceneState());
  if(MODE==='play') tickGame(dt);
  renderScene(sceneState());
  UI.tick(false);
  requestAnimationFrame(frame);
}

function applyDemo(){
  const q=new URLSearchParams(location.search);
  if(!q.has('demo')) return;
  const kind=q.get('demo')||'1';
  // a mid-game save so screenshots look lived-in
  G.money=kind==='max'?50000:420;
  G.up.rod=kind==='max'?12:2; G.up.line=kind==='max'?8:2; G.up.bait=kind==='max'?8:1; G.up.boat=kind==='max'?4:1;
  G.unlocked=['sea','lake'];
  G.skills={}; G.xp=20; G.level=8; G.sp=3;
  ['a1','a2','a3','a4','l1','l2','u1','v1'].forEach(id=>G.skills[id]=1);
  if(kind==='max' || kind==='skills'){
    if(kind==='max'){
      SKILLS.forEach(s=>{ if(!s.auto) G.skills[s.id]=1; });
      G.level=19; G.sp=2; G.xp=40;
      G.unlocked=WATERS.map(w=>w.id);
    }
  }
  G.tod = kind==='night'?0.90 : kind==='dusk'?0.74 : 0.42;
  G.tut=1; G.caught=11;
  const seed=['minnow','sardine','perch','guppy','kelpbas','tang','shiner','sunfish','catfish','lperch','ctrout'];
  seed.forEach(id=>{ const f=FISH_BY[id]; if(f) G.log[id]={n:1+((Math.random()*4)|0), best:lerp(f.w[0],f.w[1],0.4+Math.random()*0.5)}; });
  if(kind==='log' || kind==='max'){
    FISH.filter(f=>f.rar<=2).forEach(f=>{ G.log[f.id]=G.log[f.id]||{n:1,best:(f.w[0]+f.w[1])/2}; });
  }
  G.creel=[{id:'perch',w:1.1,val:fishValue(FISH_BY.perch,1.1)},{id:'tang',w:0.9,val:fishValue(FISH_BY.tang,0.9)}];
  MODE='play'; document.body.classList.add('playing'); $('#title').classList.add('out');
  if(kind==='log'){ setTimeout(()=>UI.toggle('log'), 200); }
  if(kind==='shop'){ setTimeout(()=>UI.toggle('shop'), 200); }
  if(kind==='map'){ setTimeout(()=>UI.toggle('map'), 200); }
  if(kind==='skills' || kind==='tree'){ setTimeout(()=>UI.toggle('skills'), 200); }
  if(kind==='fight' || kind==='reel'){
    const f=FISH_BY.marlin; Play.hooked=f; Play.weight=14; Play.value=fishValue(f,14);
    const land=landingPoint(0.7, 0.1);
    Play.bob={x:land.x,y:land.y,sc:land.sc,u:land.u,z:land.z,ph:0,under:false};
    startFight();
  }
  if(kind==='catch' || kind==='mythic'){
    const f=FISH_BY[kind==='mythic'?'firstbot':'aurora'];
    const w=kind==='mythic'?42:18;
    Play.hooked=f; Play.weight=w; Play.value=fishValue(f,w); Play.phase='catch';
    const xp=catchXP(f,w);
    setTimeout(()=>UI.showCatch(f,w,Play.value,true,false,xp,false), 300);
  }
  UI.tick(true);
}

function paintTitleLogo(){
  const cv=document.getElementById('logo-cv'); if(!cv) return;
  const logo=paintLogo({scale:8});
  cv.width=logo.width; cv.height=logo.height;
  const g=cv.getContext('2d'); g.imageSmoothingEnabled=false; g.drawImage(logo,0,0);
}

function startGameLoop(){
  buildArt();
  paintTitleLogo();
  const had=load();
  if(had && (G.money>0||G.caught>0||G.tut)) $('#newg').hidden=false;
  resizeScene();
  window.addEventListener('resize', resizeScene);
  UI.init(); ADMIN.init(); bindInput();
  applyDemo();
  setInterval(()=>{ if(MODE==='play') save(); }, 20000);
  last=performance.now();
  requestAnimationFrame(frame);
}

function boot(){
  Scene.rm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  if(window.matchMedia){
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', ev=>{ Scene.rm=ev.matches; });
  }
  loadPxArt().then(startGameLoop).catch(err=>{
    console.error(err);
    startGameLoop();
  });
}

boot();
