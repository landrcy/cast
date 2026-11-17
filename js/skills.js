'use strict';
// Branching skill tree. XP and skill points come from catches. Saved in G.

const BRANCH = {
  angler: {n:'ANGLER',  c:'#ffd23a'},
  line:   {n:'LINE',    c:'#3f8cff'},
  lure:   {n:'LURE',    c:'#5fd068'},
  voyage: {n:'VOYAGER', c:'#48CAE4'}
};

// col, row are layout slots inside each branch column
const SKILLS = [
  {id:'root', n:'FIRST CAST', branch:'root',   d:'You picked up a rod.', cost:0, req:[], auto:1, col:0, row:0},

  {id:'a1', n:'STEADY HAND',   branch:'angler', d:'Hook window +0.15s.',           cost:1, req:['root'], col:0, row:0},
  {id:'a2', n:'LONG CAST',     branch:'angler', d:'Casts reach farther.',          cost:1, req:['a1'],   col:0, row:1},
  {id:'a3', n:'WIDE ZONE',     branch:'angler', d:'The reel zone is broader.',     cost:1, req:['a1'],   col:1, row:1},
  {id:'a4', n:'RODWRIGHT',     branch:'angler', d:'Buy rods through Sunline.',     cost:1, req:['a2','a3'], need:'any', col:0, row:2},
  {id:'a5', n:'MASTER ANGLER', branch:'angler', d:'Buy rods through Crystalline.', cost:1, req:['a4'],   col:0, row:3},
  {id:'a6', n:'GRAND CAST',    branch:'angler', d:'Unlock every rod, including the Cosmic L.', cost:1, req:['a5'], col:0, row:4},

  {id:'l1', n:'TOUGH LINE',    branch:'line',   d:'Tension limit +12.',            cost:1, req:['root'], col:0, row:0},
  {id:'l2', n:'FLEX',          branch:'line',   d:'The line recovers faster in the zone.', cost:1, req:['l1'], col:0, row:1},
  {id:'l3', n:'IRON CORD',     branch:'line',   d:'Tension limit +20.',            cost:1, req:['l1'],   col:1, row:1},
  {id:'l4', n:'UNBREAKING',    branch:'line',   d:'The line almost never snaps.',  cost:1, req:['l2','l3'], need:'all', col:0, row:2},

  {id:'u1', n:'FRESH BAIT',    branch:'lure',   d:'Fish bite sooner.',             cost:1, req:['root'], col:0, row:0},
  {id:'u2', n:'LUCKY LURE',    branch:'lure',   d:'Luck +0.30.',                   cost:1, req:['u1'],   col:0, row:1},
  {id:'u3', n:'NIGHT EYES',    branch:'lure',   d:'Night fish take the hook more often.', cost:1, req:['u1'], col:1, row:1},
  {id:'u4', n:'MYTHIC SCENT',  branch:'lure',   d:'Luck +0.60. Rarer bites.',      cost:1, req:['u2','u3'], need:'all', col:0, row:2},

  {id:'v1', n:'LAKE MAP',      branch:'voyage', d:'Opens Glass Lake.',             cost:1, req:['root'], col:0, row:0, water:'lake'},
  {id:'v2', n:'DEEP PAPERS',   branch:'voyage', d:'Opens The Abyss.',              cost:1, req:['v1'],   col:0, row:1, water:'abyss'},
  {id:'v3', n:'RIFT KEY',      branch:'voyage', d:'Opens Void Pond.',              cost:1, req:['v2'],   col:0, row:2, water:'void'},
  {id:'v4', n:'EMBER WARRANT', branch:'voyage', d:'Opens Ember Pool.',             cost:1, req:['v3'],   col:0, row:3, water:'ember'},
  {id:'v5', n:'WIDE CREEL',    branch:'voyage', d:'Creel holds 20 fish.',          cost:1, req:['v1'],   col:1, row:1}
];
const SKILL_BY=Object.create(null);
SKILLS.forEach(s=>{ SKILL_BY[s.id]=s; });

const XP_BY_RAR=[8,16,32,70,160,400];
function catchXP(f,w){
  const mid=(f.w[0]+f.w[1])/2;
  return Math.max(1, Math.round(XP_BY_RAR[f.rar]*(0.85+0.3*(w/mid))));
}
function xpToNext(level){ return Math.round(28*Math.pow(1.28, level)); }

function hasSkill(id){ return id==='root' || !!(G.skills && G.skills[id]); }
function skillReady(s){
  if(hasSkill(s.id) || s.auto) return false;
  if(!s.req||!s.req.length) return true;
  if(s.need==='any') return s.req.some(hasSkill);
  return s.req.every(hasSkill);
}
function skillState(s){
  if(s.auto || hasSkill(s.id)) return 'owned';
  if(skillReady(s)) return G.sp>=s.cost ? 'available' : 'wait'; // ready but broke
  return 'locked';
}

function rodCap(){ return hasSkill('a6')?12: hasSkill('a5')?8: hasSkill('a4')?6: 3; }
function hookWinNow(){ return hookWin(G.up.rod) + (hasSkill('a1')?0.15:0); }
function rodPowerNow(){ return rodPower(G.up.rod) + (hasSkill('a2')?0.08:0); }
function zoneBonusNow(){ return zoneBonus(G.up.rod) + (hasSkill('a3')?0.03:0); }
function tenMaxNow(){ return tenMax(G.up.line) + (hasSkill('l1')?12:0) + (hasSkill('l3')?20:0) + (hasSkill('l4')?40:0); }
function tenRecoverNow(){ return hasSkill('l2')?1.6:1; }
function waitMulNow(){ return hasSkill('u1')?0.72:1; }
function luckNow(){ return luckFromBait(G.up.bait) + (hasSkill('u2')?0.30:0) + (hasSkill('u4')?0.60:0) + (ADMIN&&ADMIN.xluck||0); }
function creelMax(){ return hasSkill('v5')?20:12; }
function waterSkill(id){
  if(id==='sea') return 'root';
  return ({lake:'v1', abyss:'v2', void:'v3', ember:'v4'})[id];
}

function awardXP(n){
  G.xp=(G.xp||0)+n;
  let ups=0;
  while(G.xp>=xpToNext(G.level||0)){
    G.xp-=xpToNext(G.level||0);
    G.level=(G.level||0)+1;
    G.sp=(G.sp||0)+1;
    ups++;
  }
  if(ups) UI.toast('Level up! <b>LV '+(G.level)+'</b> · +'+ups+' skill point'+(ups>1?'s':''), 2200);
}

function unlockSkill(id){
  const s=SKILL_BY[id];
  if(!s || s.auto) return false;
  if(hasSkill(id)) return false;
  if(!skillReady(s)){ UI.toast('That skill is still locked.', 1400); return false; }
  if((G.sp||0)<s.cost){ UI.toast('Not enough skill points.', 1400); return false; }
  G.sp-=s.cost;
  G.skills=G.skills||{};
  G.skills[id]=1;
  if(s.water && !G.unlocked.includes(s.water)) G.unlocked.push(s.water);
  save();
  return true;
}
