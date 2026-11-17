'use strict';

const SAVE_KEY='cast-save-v1';
const DAY_LEN=360; // seconds for a full day/night cycle
const CREEL_MAX=12;

const G = {
  money:0, up:{rod:0,line:0,bait:0,boat:0},
  unlocked:['sea'], water:'sea',
  log:{}, creel:[],
  tod:0.40, // mid-morning
  caught:0, tut:0,
  best:0, sold:0
};

const Play = {
  phase:'idle', // idle charge cast wait bite fight catch snap travel
  power:0, charging:false,
  bob:null, lineTo:null,
  waitT:0, biteIn:0, hookT:0,
  hooked:null, weight:0, value:0,
  mark:0.5, zone:0.5, zoneW:0.22, zvel:0,
  prog:0, ten:0, bend:0,
  pose:'idle',
  flyFish:null,
  forceId:null, forceRar:-1,
  travelT:0, travelTo:null,
  hint:'', flash:0
};

function fresh(){
  G.money=0; G.up={rod:0,line:0,bait:0,boat:0};
  G.unlocked=['sea']; G.water='sea';
  G.log={}; G.creel=[]; G.tod=0.40; G.caught=0; G.tut=0; G.best=0; G.sold=0;
  G.xp=0; G.level=0; G.sp=0; G.skills={};
}
function save(){
  try{ localStorage.setItem(SAVE_KEY, JSON.stringify({v:1, G, t:Date.now()})); }catch(e){}
}
function load(){
  try{
    const r=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');
    if(!r||!r.G) return false;
    const g=r.G;
    G.money=Math.max(0,+g.money||0);
    G.up={rod:0,line:0,bait:0,boat:0};
    if(g.up){ for(const k of Object.keys(G.up)) G.up[k]=clamp((+g.up[k]||0)|0, 0, UPG[k].max); }
    G.unlocked=Array.isArray(g.unlocked)? g.unlocked.filter(id=>WATERS.some(w=>w.id===id)) : ['sea'];
    if(!G.unlocked.includes('sea')) G.unlocked.unshift('sea');
    G.water=WATERS.some(w=>w.id===g.water && G.unlocked.includes(g.water))?g.water:'sea';
    G.log=(g.log&&typeof g.log==='object')?g.log:{};
    G.xp=Math.max(0,+g.xp||0);
    G.level=Math.max(0,+g.level||0);
    G.sp=Math.max(0,+g.sp||0);
    G.skills=(g.skills&&typeof g.skills==='object')?g.skills:{};
    const cap=typeof creelMax==='function'?Math.max(creelMax(),12):20;
    G.creel=Array.isArray(g.creel)?g.creel.filter(x=>FISH_BY[x.id]&&x.w>0).slice(0,cap):[];
    G.tod=isFinite(+g.tod)?((+g.tod)%1+1)%1:0.40;
    G.caught=Math.max(0,+g.caught||0);
    G.tut=+g.tut||0;
    G.best=Math.max(0,+g.best||0);
    G.sold=Math.max(0,+g.sold||0);
    // grandfather waters already unlocked on older saves
    return true;
  }catch(e){ return false; }
}

function resetPlay(){
  Play.phase='idle'; Play.power=0; Play.charging=false;
  Play.bob=null; Play.lineTo=null; Play.hooked=null;
  Play.prog=0; Play.ten=0; Play.bend=0; Play.pose='idle';
  Play.flyFish=null; Play.flash=0;
}

function canCast(){ return MODE==='play' && (Play.phase==='idle' || Play.phase==='wait') && !UI.open && !document.getElementById('catch').classList.contains('show'); }

function startCharge(){
  if(Play.phase==='wait'){ reelIn(false); return; }
  if(Play.phase!=='idle') return;
  Play.phase='charge'; Play.charging=true; Play.power=0; Play.pose='charge';
  UI.hint('');
}
function releaseCharge(){
  if(Play.phase!=='charge') return;
  Play.charging=false;
  const p=Math.max(0.12, Play.power);
  beginCast(p, 0);
}
function beginCast(power, aimX){
  const maxP=rodPowerNow();
  const used=clamp(power,0.12,1)*maxP;
  // accuracy: better rod = less random aim
  const spread=(0.55 - G.up.rod*0.05);
  const aim=(aimX||0) + (Math.random()*2-1)*spread*0.35;
  const land=landingPoint(used, clamp(aim,-1,1));
  Play.phase='cast'; Play.pose='cast'; Play.power=0;
  Play._cast={t:0, dur: Scene.rm?0.15:0.55, from:{x:Scene.tip.x, y:Scene.tip.y}, to:land, p:used};
  Play.lineTo={x:Scene.tip.x, y:Scene.tip.y};
  Play.bob=null;
}

function tickCast(dt){
  const c=Play._cast; if(!c) return;
  c.t+=dt; const u=clamp(c.t/c.dur,0,1);
  const e=u*(2-u); // ease out
  const x=lerp(c.from.x, c.to.x, e);
  // arc up then down
  const midY=Math.min(c.from.y, c.to.y) - 30*(1-c.to.u);
  const y = u<0.5 ? lerp(c.from.y, midY, u/0.5) : lerp(midY, c.to.y, (u-0.5)/0.5);
  Play.lineTo={x,y};
  Play.pose='cast'; Play.power=u;
  if(u>=1){
    Play.bob={x:c.to.x, y:c.to.y, sc:c.to.sc, u:c.to.u, z:c.to.z, ph:Math.random()*6, under:false};
    Play.lineTo=null; Play._cast=null;
    addRipple(c.to.x, c.to.y, 0.8); addSplash(c.to.x, c.to.y, 6, 0.6);
    beginWait();
  }
}

function beginWait(){
  Play.phase='wait'; Play.pose='idle'; Play.power=0;
  const [a,b]=waitRange(G.up.bait);
  const m=waitMulNow();
  Play.biteIn=a*m+Math.random()*((b-a)*m);
  Play.waitT=0;
  UI.hint('WATCH THE BOBBER · TAP TO REEL IN');
}

function tickWait(dt){
  Play.waitT+=dt; Play.biteIn-=dt;
  if(Play.bob){
    // occasional nibble
    if(!Play.bob._nib && Play.biteIn<0.8 && Play.biteIn>0.15 && Math.random()<0.4){
      Play.bob._nib=true; Play.bob.under=true;
      addRipple(Play.bob.x, Play.bob.y, 0.5);
      setTimeout(()=>{ if(Play.phase==='wait' && Play.bob) Play.bob.under=false; }, 140);
    }
  }
  if(Play.biteIn<=0) startBite();
}

function startBite(){
  const f=rollFish();
  if(!f){ // nothing took it — recast window later
    Play.biteIn=2+Math.random()*3;
    return;
  }
  Play.hooked=f.fish; Play.weight=f.w; Play.value=f.val;
  Play.phase='bite'; Play.hookT=hookWinNow();
  if(Play.bob){ Play.bob.under=true; addRipple(Play.bob.x, Play.bob.y, 1.1); addSplash(Play.bob.x, Play.bob.y, 10, 0.9); }
  punch(2);
  UI.hint('TAP TO HOOK!');
}

function tryHook(){
  if(Play.phase!=='bite') return;
  startFight();
}
function missHook(){
  if(Play.phase!=='bite') return;
  UI.toast('It got away.', 1400);
  Play.hooked=null; Play.bob=null; Play.lineTo=null;
  Play.phase='idle'; Play.pose='idle';
  UI.hint('HOLD TO CAST');
}

function rollFish(){
  if(Play.forceId && FISH_BY[Play.forceId]){
    const f=FISH_BY[Play.forceId]; Play.forceId=null;
    const w=lerp(f.w[0], f.w[1], Math.random());
    return {fish:f, w, val:fishValue(f,w)};
  }
  const luck=luckNow();
  const far=Play.bob? Play.bob.u : 0.3;
  let rar = Play.forceRar>=0? Play.forceRar : rollRarity(luck, far, Math.random);
  Play.forceRar=-1;
  const pool=FISH.filter(f=>f.water===G.water);
  // try this rarity, then walk down if empty
  let cand=[];
  for(let r=rar;r>=0 && !cand.length;r--){
    cand=pool.filter(f=>f.rar===r && todMatch(f.tod, G.tod)>0.05);
  }
  if(!cand.length) cand=pool.filter(f=>f.rar===0);
  if(!cand.length) return null;
  // weight by tod match
  const weights=cand.map(f=>{
    let w=todMatch(f.tod, G.tod);
    if(hasSkill('u3') && f.tod==='night') w*=2.6;
    return w;
  });
  const sum=weights.reduce((a,b)=>a+b,0);
  let r=Math.random()*sum, pick=cand[0];
  for(let i=0;i<cand.length;i++){ r-=weights[i]; if(r<=0){ pick=cand[i]; break; } }
  const t=Math.random();
  // slightly bigger fish farther out
  const w=lerp(pick.w[0], pick.w[1], Math.pow(t, 1-far*0.3));
  return {fish:pick, w, val:fishValue(pick,w)};
}

function startFight(){
  const f=Play.hooked;
  Play.phase='fight'; Play.pose='fight';
  Play.prog=0; Play.ten=8; Play.bend=0.2;
  Play.mark=0.5; Play.zone=0.5;
  const hard = (RAR[f.rar].m/4) * f.fight * (0.85+0.3*(Play.weight/((f.w[0]+f.w[1])/2)));
  Play._fight={hard, t:0, yank:0, yankIn:0.4+Math.random()*0.6, dir:(Math.random()<0.5?-1:1)};
  Play.zoneW=clamp(0.26 - f.rar*0.025 + zoneBonusNow() - (hard-1)*0.02, 0.10, 0.34);
  Play.zvel=0;
  UI.hint('');
  UI.showFight(true);
  if(Play.bob){ addSplash(Play.bob.x, Play.bob.y, 14, 1.1); addRipple(Play.bob.x, Play.bob.y, 1.2); }
  punch(3);
}

function tickFight(dt){
  const F=Play._fight, f=Play.hooked;
  if(!F||!f) return;
  F.t+=dt;
  // zone wanders, yanks harder with rarity
  F.yankIn-=dt;
  if(F.yankIn<=0){
    F.dir=(Math.random()<0.5?-1:1);
    F.yank= (0.6+F.hard*0.5) * (0.7+Math.random()*0.8);
    F.yankIn=0.35+Math.random()*(1.1/Math.max(0.5,F.hard*0.5));
    if(Play.bob && Math.random()<0.7){ addSplash(Play.bob.x, Play.bob.y, 8, 0.8); addRipple(Play.bob.x, Play.bob.y, 0.6); }
    Play.bend=clamp(Play.bend+0.35,0,1);
  }
  F.yank*=Math.pow(0.12, dt);
  Play.zvel += F.dir*F.yank*dt*2.4;
  Play.zvel += (Math.sin(F.t*(1.2+F.hard))*0.4)*dt*F.hard;
  Play.zvel *= Math.pow(0.18, dt);
  Play.zone = clamp(Play.zone + Play.zvel*dt, Play.zoneW*0.5, 1-Play.zoneW*0.5);

  // marker: steered by input (Play._steer -1..1 or null). If none, slowly falls toward 0.5
  const steer=Play._steer;
  if(steer!=null){ Play.mark=clamp(Play.mark + steer*dt*1.55, 0, 1); }
  else { Play.mark=clamp(Play.mark + (0.5-Play.mark)*dt*0.6, 0, 1); }

  const inZ=Math.abs(Play.mark-Play.zone) <= Play.zoneW*0.5;
  const fillRate= (0.13 / Math.max(0.7, F.hard*0.7));
  if(inZ){ Play.prog=clamp(Play.prog+fillRate*dt,0,1); Play.ten=Math.max(0, Play.ten-dt*18*tenRecoverNow()); Play.bend=Math.max(0.1, Play.bend-dt*0.6); }
  else { Play.ten=clamp(Play.ten + dt*(16+F.hard*6), 0, 100); Play.bend=clamp(Play.bend+dt*0.5,0,1); }

  UI.tickFight(inZ);

  const tmax=tenMaxNow();
  if(Play.ten>=tmax){ snapLine(); return; }
  if(Play.prog>=1){ landFish(); return; }
}

function snapLine(){
  UI.showFight(false);
  Play.phase='snap';
  if(Play.bob) addSplash(Play.bob.x, Play.bob.y, 12, 1);
  punch(4);
  UI.toast('The line snapped.', 1800);
  Play.hooked=null; Play.bob=null; Play.lineTo=null; Play.pose='idle';
  setTimeout(()=>{ if(Play.phase==='snap'){ Play.phase='idle'; UI.hint('HOLD TO CAST'); } }, 700);
  save();
}

function landFish(){
  UI.showFight(false);
  const f=Play.hooked, w=Play.weight, val=Play.value;
  Play.phase='catch'; Play.pose='idle';
  // fly the fish toward the camera
  const from=Play.bob?{x:Play.bob.x,y:Play.bob.y}:{x:Scene.W/2,y:Scene.hy+20};
  Play.flyFish={f, x:from.x, y:from.y, sc:0.4, t:0};
  Play.bob=null; Play.lineTo=null;
  punch(2);
  const dur=Scene.rm?0.05:0.7;
  Play._flyDur=dur;
}

function tickFly(dt){
  const ff=Play.flyFish; if(!ff) return;
  ff.t+=dt; const u=clamp(ff.t/Play._flyDur,0,1);
  const e=u*u;
  ff.x=lerp(ff.x, Scene.W*0.5, 0.12+dt*2);
  ff.y=lerp(ff.y, Scene.H*0.55, 0.12+dt*2);
  ff.sc=lerp(0.4, 2.2, e);
  if(u>=1){ Play.flyFish=null; openCatch(); }
}

function openCatch(){
  const f=Play.hooked, w=Play.weight, val=Play.value;
  const first=!G.log[f.id];
  const rec=G.log[f.id]||{n:0,best:0};
  rec.n++; rec.best=Math.max(rec.best, w);
  G.log[f.id]=rec;
  G.caught++;
  if(f.rar>G.best) G.best=f.rar;
  const full=G.creel.length>=creelMax();
  if(!full) G.creel.push({id:f.id, w, val});
  const xp=catchXP(f,w);
  const lv0=G.level||0;
  awardXP(xp);
  save();
  UI.showCatch(f, w, val, first, full, xp, (G.level||0)>lv0);
}

function afterCatch(){
  if(UI&&UI._cf) clearInterval(UI._cf);
  document.getElementById('catch').hidden=true;
  document.getElementById('catch').classList.remove('show');
  Play.hooked=null; Play.phase='idle'; Play.pose='idle';
  UI.hint('HOLD TO CAST');
  UI.render();
}

function sellOne(i){
  const it=G.creel[i]; if(!it) return;
  G.money+=it.val; G.sold+=it.val; G.creel.splice(i,1);
  UI.moneyUp(); save(); UI.render();
}
function sellAll(){
  if(!G.creel.length) return;
  let s=0; G.creel.forEach(it=>s+=it.val);
  G.money+=s; G.sold+=s; G.creel.length=0;
  UI.moneyUp(); save(); UI.render();
  UI.toast('Sold the catch for <b>'+fmt(s)+'</b>.', 1800);
}
function sellCaught(val){
  G.money+=val; G.sold+=val;
  // if it was added to the creel, pop the last
  if(G.creel.length) G.creel.pop();
  UI.moneyUp(); save();
}

function buyUp(k){
  const u=UPG[k], L=G.up[k];
  if(L>=u.max) return;
  if(k==='rod' && L+1>rodCap()){
    UI.toast('Unlock <b>'+rodGateName(rodCap())+'</b> on the skill tree first.', 2000);
    return;
  }
  const c=u.cost(L);
  if(G.money<c){ UI.toast('Not enough cash.', 1200); return; }
  G.money-=c; G.up[k]=L+1;
  save(); UI.render(); UI.toast(u.n+' upgraded.', 1200);
}

function rodGateName(cap){
  if(cap<6) return 'RODWRIGHT';
  if(cap<8) return 'MASTER ANGLER';
  return 'GRAND CAST';
}
function travelTo(id){
  const w=WATERS.find(x=>x.id===id); if(!w) return;
  const need=waterSkill(id);
  if(need && need!=='root' && !hasSkill(need) && !G.unlocked.includes(id)){
    UI.toast('Unlock this water on the <b>SKILLS</b> tree first.', 1800);
    return;
  }
  if(!G.unlocked.includes(id)){
    G.unlocked.push(id); save();
  }
  if(G.water===id){ UI.close(); return; }
  if(Play.phase!=='idle' && Play.phase!=='wait' && Play.phase!=='snap'){ UI.toast('Finish this cast first.', 1400); return; }
  resetPlay();
  Play.phase='travel'; Play.travelT=0; Play.travelTo=id;
  UI.close();
  UI.hint('HEADING TO '+w.n);
}

function tickTravel(dt){
  Play.travelT+=dt;
  const dur=Scene.rm?0.1:1.2;
  if(Play.travelT>=dur){
    G.water=Play.travelTo; Play.travelTo=null; Play.phase='idle'; Play.pose='idle';
    seedDecor(); save(); UI.tick(true);
    UI.hint('HOLD TO CAST');
    UI.toast('Arrived at <b>'+(WATERS.find(w=>w.id===G.water)||{}).n+'</b>.', 1600);
  }
}

function reelIn(empty){
  if(Play.phase!=='wait') return;
  Play.bob=null; Play.lineTo=null; Play.phase='idle'; Play.pose='idle';
  UI.hint('HOLD TO CAST');
}

function tickGame(dt){
  const speed=(ADMIN&&ADMIN.speed)||1;
  const d=dt*speed;
  // day/night — pause on title
  if(MODE==='play') G.tod = (G.tod + d/DAY_LEN)%1;

  switch(Play.phase){
    case 'charge':
      Play.power=clamp(Play.power+d/(Scene.rm?0.25:0.9), 0, 1);
      Play.pose='charge';
      break;
    case 'cast': tickCast(d); break;
    case 'wait': tickWait(d); break;
    case 'bite':
      Play.hookT-=d;
      if(Play.hookT<=0) missHook();
      break;
    case 'fight': tickFight(d); break;
    case 'catch': if(Play.flyFish) tickFly(d); break;
    case 'travel': tickTravel(d); break;
  }
  if(Play.flash>0) Play.flash-=d;
}

function sceneState(){
  return {
    water:G.water, tod:G.tod,
    phase:Play.phase, pose:Play.pose, power:Play.power, bend:Play.bend,
    bob:Play.bob, lineTo:Play.lineTo, hooked:Play.hooked, flyFish:Play.flyFish
  };
}
