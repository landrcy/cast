'use strict';

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hash2(x,y,s){let h=(x*374761393+y*668265263+(s||0)*1442695041)|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296;}
function lerp(a,b,t){return a+(b-a)*t;}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function pick(a,rnd){return a[Math.floor((rnd||Math.random)()*a.length)];}

const RAR = [
  {n:'COMMON',    c:'#b8b2a4', m:1,    b:1,      g:0},
  {n:'UNCOMMON',  c:'#5fd068', m:2,    b:0.28,   g:0.5},
  {n:'RARE',      c:'#3f8cff', m:4.5,  b:0.08,   g:0.95},
  {n:'EPIC',      c:'#b34dff', m:11,   b:0.018,  g:1.4},
  {n:'LEGENDARY', c:'#ffb31a', m:32,   b:0.0035, g:1.9},
  {n:'MYTHIC',    c:'#ff3b3b', m:140,  b:0.0005, g:2.4}
];

const WATERS = [
  {id:'sea',   n:'THE SEA',      tag:'SEA OF THOUGHT',  boat:0, cost:0,     dock:'wood',
   blurb:'A bright open ocean. Sun on turquoise water, bottles sometimes drifting past.'},
  {id:'lake',  n:'GLASS LAKE',  tag:'FRESHWATER',      boat:1, cost:180,   dock:'wood',
   blurb:'A calm glass-clear lake. Green shallows, quiet mornings, heavy bass at dusk.'},
  {id:'abyss', n:'THE ABYSS',    tag:'OPEN DEEP',       boat:2, cost:900,   dock:'boat',
   blurb:'Far past the shelf. Dark water, lantern fish, and things that hunt the lamps.'},
  {id:'void',  n:'VOID POND',    tag:'THE RIFT',        boat:3, cost:4000,  dock:'stone',
   blurb:'A still black pond that is deeper than it is wide. Stars sit on the surface.'},
  {id:'ember', n:'EMBER POOL',   tag:'THE RIFT-EDGE',   boat:4, cost:14000, dock:'stone',
   blurb:'A stone shelf over molten water. Only a charged line will hold here.'}
];

// tod: 'any' | 'day' | 'night' | 'dawn' | 'dusk'
// w: weight range in kg. fight is a multiplier on top of rarity.
// art fields drive the pixel painter in art.js — every fish is unique.
const FISH = [
  // —— THE SEA ——
  {id:'minnow',   name:'TIDE MINNOW',      water:'sea',   rar:0, val:5,   w:[0.1,0.4],  tod:'any',  fight:0.7, art:{body:'slim',  tail:'fork',  dor:'short', pal:['#1a4a5c','#2a7a8c','#4ec4d4','#d8f8ff','#1a4a5c','#082028','#e8f8f0'], pat:'none'}},
  {id:'sardine',  name:'SURF SARDINE',     water:'sea',   rar:0, val:6,   w:[0.2,0.7],  tod:'day',  fight:0.75,art:{body:'slim',  tail:'fork',  dor:'short', pal:['#3a4a58','#8aa0b0','#d0dce8','#ffffff','#5a6a78','#1a2028','#f0f4f8'], pat:'silver'}},
  {id:'perch',    name:'TEAL PERCH',       water:'sea',   rar:0, val:8,   w:[0.4,1.4],  tod:'any',  fight:0.9, art:{body:'perch', tail:'spade', dor:'sail',  pal:['#0a4a48','#1a8a80','#3ec8b8','#c8fff4','#0a4a48','#041818','#e0fff4'], pat:'bars'}},
  {id:'guppy',    name:'BOTTLE GUPPY',     water:'sea',   rar:0, val:7,   w:[0.15,0.5], tod:'any',  fight:0.65,art:{body:'puffer', tail:'round', dor:'short', pal:['#5a3a12','#b07a28','#e8b85a','#ffe8a8','#8a5a1a','#2a1808','#fff0c8'], pat:'spots'}},
  {id:'kelpbas',  name:'KELP BASS',        water:'sea',   rar:1, val:18,  w:[0.8,2.8],  tod:'day',  fight:1.0, art:{body:'stock', tail:'spade', dor:'sail',  pal:['#14381c','#2a6a30','#5aa848','#c8e878','#1a4820','#081008','#d8f0b0'], pat:'saddle'}},
  {id:'tang',     name:'SUNBEAM TANG',     water:'sea',   rar:1, val:22,  w:[0.5,1.6],  tod:'day',  fight:1.05,art:{body:'tang',  tail:'lunate',dor:'spine', pal:['#0c3a80','#1a6ae0','#3cb0ff','#c8f0ff','#f0c020','#081828','#e8ffff'], pat:'none', extra:'scalpel'}},
  {id:'trout',    name:'CORAL TROUT',      water:'sea',   rar:1, val:24,  w:[1.0,3.5],  tod:'any',  fight:1.1, art:{body:'stock', tail:'fork',  dor:'sail',  pal:['#6a2018','#c44830','#f07850','#ffd0a8','#8a3020','#2a0c08','#ffe8d0'], pat:'spots'}},
  {id:'mackerel', name:'DUSK MACKEREL',    water:'sea',   rar:1, val:20,  w:[0.7,2.4],  tod:'dusk', fight:1.05,art:{body:'torp',  tail:'fork',  dor:'short', pal:['#0a2838','#1a5870','#3a98b0','#c0e8f4','#082028','#041018','#e0f4f8'], pat:'tiger'}},
  {id:'snapper',  name:'GILDED SNAPPER',   water:'sea',   rar:2, val:55,  w:[1.5,4.5],  tod:'day',  fight:1.2, art:{body:'stock', tail:'spade', dor:'sail',  pal:['#5a3a08','#c49018','#f0c430','#fff0a0','#8a6010','#2a1a04','#fff8d0'], pat:'scales'}},
  {id:'angel',    name:'PRISM ANGEL',      water:'sea',   rar:2, val:64,  w:[0.6,1.8],  tod:'day',  fight:1.15,art:{body:'angel',  tail:'round', dor:'sail',  pal:['#3a1060','#7a30c0','#c070ff','#f0d0ff','#f0b020','#180828','#fff0ff'], pat:'bands', extra:'fan'}},
  {id:'thought',  name:'THOUGHTFIN',       water:'sea',   rar:2, val:70,  w:[0.8,2.2],  tod:'night',fight:1.2, art:{body:'slim',  tail:'ribbon',dor:'short', pal:['#123050','#2a6088','#68b0d8','#d0f0ff','#c8a060','#081828','#f0f8ff'], pat:'script'}},
  {id:'marlin',   name:'AZURE MARLIN',     water:'sea',   rar:3, val:220, w:[8,28],     tod:'day',  fight:1.45,art:{body:'marlin',  tail:'lunate',dor:'sail',  pal:['#082848','#0a58a0','#2a98e8','#b0e0ff','#082040','#041020','#e8f8ff'], pat:'none', extra:'spear'}},
  {id:'bearer',   name:'MESSAGE BEARER',   water:'sea',   rar:3, val:260, w:[1.2,3.0],  tod:'any',  fight:1.3, art:{body:'bottlecarry', tail:'round', dor:'short', pal:['#3a4a38','#6a8a60','#a0c888','#e8f8d0','#8a6a38','#182018','#f4ffe8'], pat:'none', extra:'bottle'}},
  {id:'aurora',   name:'AURORA SAILFISH',  water:'sea',   rar:4, val:900, w:[10,32],    tod:'dawn', fight:1.7, art:{body:'sail',  tail:'lunate',dor:'sail',  pal:['#081830','#1a4068','#3a80c0','#80e0ff','#f090c0','#040c18','#f0ffff'], pat:'aurora', extra:'sail'}},
  {id:'firstbot', name:'THE FIRST BOTTLE', water:'sea',   rar:5, val:5200,w:[2.0,5.0],  tod:'night',fight:1.9, art:{body:'bottle', tail:'fork',  dor:'short', pal:['#1a3040','#3a7088','#80c8d8','#e0f8ff','#c8a060','#081018','#ffffff'], pat:'glass', extra:'bottle'}},

  // —— GLASS LAKE ——
  {id:'shiner',   name:'COPPER SHINER',    water:'lake',  rar:0, val:5,   w:[0.1,0.4],  tod:'any',  fight:0.7, art:{body:'slim',  tail:'fork',  dor:'short', pal:['#4a2a10','#8a5020','#d08838','#ffd0a0','#6a3810','#201008','#ffe8c8'], pat:'none'}},
  {id:'sunfish',  name:'POND SUNFISH',     water:'lake',  rar:0, val:7,   w:[0.3,0.9],  tod:'day',  fight:0.8, art:{body:'sunfish',  tail:'round', dor:'sail',  pal:['#2a4810','#5a8820','#b0c040','#f0f090','#c05018','#142008','#f8f8c8'], pat:'bars'}},
  {id:'catfish',  name:'CATTAIL CATFISH',  water:'lake',  rar:0, val:9,   w:[0.8,3.2],  tod:'night',fight:0.95,art:{body:'cat', tail:'square',dor:'short', pal:['#2a2418','#4a4030','#7a6e58','#c8b898','#3a3428','#100c08','#e0d8c0'], pat:'none', extra:'whisker'}},
  {id:'lperch',   name:'LAKE PERCH',       water:'lake',  rar:1, val:16,  w:[0.5,1.8],  tod:'any',  fight:1.0, art:{body:'perch', tail:'spade', dor:'sail',  pal:['#4a2a10','#8a5a18','#d0a030','#ffe0a0','#3a5a20','#181008','#fff0c8'], pat:'bars'}},
  {id:'ctrout',   name:'GLASS TROUT',     water:'lake',  rar:1, val:22,  w:[0.8,2.6],  tod:'dawn', fight:1.1, art:{body:'torp',  tail:'fork',  dor:'short', pal:['#0a3828','#1a6848','#3aa878','#c0f0d0','#8a3a18','#081810','#e8fff0'], pat:'spots'}},
  {id:'pike',     name:'PAINTED PIKE',     water:'lake',  rar:2, val:60,  w:[2.0,7.0],  tod:'dusk', fight:1.35,art:{body:'pike',  tail:'fork',  dor:'short', pal:['#1a3820','#3a6840','#78a060','#d8e8b8','#2a4828','#0c180c','#f0f8d8'], pat:'chain', extra:'snout'}},
  {id:'gcarp',    name:'GOLDEN CARP',      water:'lake',  rar:2, val:72,  w:[1.5,5.0],  tod:'day',  fight:1.15,art:{body:'carp', tail:'fork',  dor:'sail',  pal:['#6a3a08','#c87810','#f0b020','#ffe088','#8a5010','#2a1804','#fff4c0'], pat:'scales'}},
  {id:'koi',      name:'MAYOR\'S KOI',     water:'lake',  rar:3, val:240, w:[2.0,6.5],  tod:'day',  fight:1.25,art:{body:'koi', tail:'ribbon',dor:'sail',  pal:['#6a1010','#e03020','#f8f0e8','#ffffff','#e03020','#200808','#fff8f0'], pat:'koi'}},
  {id:'ccatch',   name:'CROWN BASS',  water:'lake',  rar:4, val:980, w:[4.0,12],   tod:'dusk', fight:1.65,art:{body:'stock', tail:'spade', dor:'sail',  pal:['#1a3010','#3a6020','#78a038','#d8e878','#2a4018','#0c1408','#f0f8c8'], pat:'saddle', extra:'jaw'}},
  {id:'serpent',  name:'LAKE SERPENT',     water:'lake',  rar:5, val:5600,w:[18,48],    tod:'night',fight:2.0, art:{body:'serpent',   tail:'ribbon',dor:'none',  pal:['#0c2018','#1a4838','#3a7860','#88c8a8','#143028','#040c08','#d0f0e0'], pat:'rings', extra:'crest'}},

  // —— THE ABYSS ——
  {id:'smelt',    name:'BLACK SMELT',      water:'abyss', rar:0, val:8,   w:[0.2,0.8],  tod:'any',  fight:0.8, art:{body:'slim',  tail:'fork',  dor:'short', pal:['#0c1018','#1a2438','#3a4a68','#8a9ab8','#141828','#04060c','#c8d0e0'], pat:'none'}},
  {id:'lanch',    name:'LANTERN ANCHOVY',  water:'abyss', rar:0, val:10,  w:[0.15,0.5], tod:'night',fight:0.75,art:{body:'slim',  tail:'fork',  dor:'short', pal:['#101820','#203040','#3a5870','#80c0d8','#f0d060','#080c10','#e0f0f8'], pat:'none', extra:'glowdot'}},
  {id:'viper',    name:'VIPERFISH',        water:'abyss', rar:1, val:28,  w:[0.6,2.0],  tod:'night',fight:1.25,art:{body:'viper',  tail:'round', dor:'spine', pal:['#101018','#282838','#505068','#a0a0b8','#d0d0e0','#08080c','#e8e8f0'], pat:'none', extra:'fangs'}},
  {id:'gulper',   name:'GULPER',           water:'abyss', rar:1, val:32,  w:[1.0,4.0],  tod:'any',  fight:1.15,art:{body:'maw', tail:'whip',  dor:'none',  pal:['#14101c','#2a2438','#4a4460','#8a84a0','#1c1828','#08080c','#d0cce0'], pat:'none', extra:'maw'}},
  {id:'geel',     name:'GHOST EEL',        water:'abyss', rar:2, val:80,  w:[1.5,6.0],  tod:'night',fight:1.3, art:{body:'eel',   tail:'ribbon',dor:'none',  pal:['#1a2430','#3a5068','#80a0b8','#d0e8f4','#2a3848','#0c1014','#f0f8ff'], pat:'none'}},
  {id:'acod',     name:'ABYSS COD',        water:'abyss', rar:2, val:74,  w:[2.0,8.0],  tod:'any',  fight:1.25,art:{body:'stock', tail:'spade', dor:'sail',  pal:['#101828','#203050','#3a5880','#88a8d0','#182038','#080c14','#d8e8f8'], pat:'mottle'}},
  {id:'angler',   name:'ANGLER KING',      water:'abyss', rar:3, val:280, w:[3.0,11],   tod:'night',fight:1.5, art:{body:'angler', tail:'round', dor:'spine', pal:['#181420','#30283c','#58506a','#a098b0','#f0d060','#0c0a10','#e8e0f0'], pat:'none', extra:'angler'}},
  {id:'dragon',   name:'ABYSSAL DRAGONFISH',water:'abyss',rar:4, val:1100,w:[5.0,16],   tod:'night',fight:1.75,art:{body:'dragon',  tail:'fork',  dor:'spine', pal:['#140c18','#301828','#682040','#d04060','#f0b070','#080408','#f8d0d8'], pat:'none', extra:'fangs'}},
  {id:'palelev',  name:'THE PALE LEVIATHAN',water:'abyss',rar:5, val:6400,w:[30,90],    tod:'night',fight:2.1, art:{body:'bonewhale',  tail:'lunate',dor:'sail',  pal:['#202830','#506070','#a0b0c0','#e8f0f8','#c8d8e0','#0c1014','#ffffff'], pat:'scar', extra:'jaw'}},

  // —— VOID POND ——
  {id:'starmin',  name:'STAR MINNOW',      water:'void',  rar:0, val:9,   w:[0.1,0.35], tod:'any',  fight:0.7, art:{body:'slim',  tail:'fork',  dor:'short', pal:['#1a1040','#3a28a0','#7860e0','#d0c8ff','#f0e080','#0c0820','#f8f0ff'], pat:'stars'}},
  {id:'shade',    name:'SHADE JELLY',      water:'void',  rar:0, val:11,  w:[0.2,0.6],  tod:'night',fight:0.75,art:{body:'jelly', tail:'round', dor:'short', pal:['#0c0c14','#24243a','#484868','#9090b0','#2a2a40','#06060c','#d0d0e8'], pat:'none'}},
  {id:'rtetra',   name:'RIFT TETRA',       water:'void',  rar:1, val:30,  w:[0.3,1.0],  tod:'any',  fight:1.0, art:{body:'slim',  tail:'fork',  dor:'short', pal:['#2a0850','#6a20a8','#b050e8','#e8b0ff','#20c0e0','#140428','#f8e0ff'], pat:'irid'}},
  {id:'echo',     name:'ECHO EEL',         water:'void',  rar:1, val:34,  w:[1.0,4.0],  tod:'any',  fight:1.15,art:{body:'eel',   tail:'ribbon',dor:'none',  pal:['#101028','#282860','#4848a0','#8888e0','#202048','#080810','#d0d0ff'], pat:'rings'}},
  {id:'vglass',   name:'VOIDGLASS FISH',   water:'void',  rar:2, val:88,  w:[0.8,2.4],  tod:'night',fight:1.2, art:{body:'flat',  tail:'lunate',dor:'short', pal:['#14001e','#3c0a5c','#8f2fd6','#eab0ff','#5ff6ff','#080010','#fff0ff'], pat:'glass'}},
  {id:'evray',    name:'EVENT RAY',        water:'void',  rar:3, val:300, w:[2.5,9.0],  tod:'any',  fight:1.4, art:{body:'ray',   tail:'whip',  dor:'none',  pal:['#100818','#301840','#6830a0','#c070ff','#20e0ff','#080410','#f0e0ff'], pat:'irid'}},
  {id:'sinkoi',   name:'SINGULARITY KOI',  water:'void',  rar:4, val:1200,w:[2.0,6.0],  tod:'night',fight:1.7, art:{body:'koi', tail:'ribbon',dor:'sail',  pal:['#000000','#1a1028','#5ff6ff','#ffffff','#ff5cf0','#000000','#e0ffff'], pat:'koi', extra:'core'}},
  {id:'unshaped', name:'THE UNSHAPED',     water:'void',  rar:5, val:7200,w:[6,20],     tod:'night',fight:2.15,art:{body:'blob',   tail:'ribbon',dor:'none',  pal:['#080610','#1a1028','#4a2870','#a060e0','#5ff6ff','#040308','#f0e0ff'], pat:'glitch', extra:'core'}},

  // —— EMBER POOL ——
  {id:'ashgoby',  name:'ASH GOBY',         water:'ember', rar:0, val:10,  w:[0.2,0.7],  tod:'any',  fight:0.85,art:{body:'stock', tail:'round', dor:'short', pal:['#2a1a14','#4a3028','#7a5848','#c0a090','#3a2820','#140c08','#e8d0c0'], pat:'mottle'}},
  {id:'esmelt',   name:'EMBER SMELT',      water:'ember', rar:0, val:12,  w:[0.2,0.8],  tod:'day',  fight:0.8, art:{body:'slim',  tail:'fork',  dor:'short', pal:['#3a1008','#8a2810','#e05018','#ffb040','#6a1c0c','#180804','#ffe0a0'], pat:'none'}},
  {id:'loach',    name:'LAVA LOACH',       water:'ember', rar:1, val:34,  w:[0.6,2.2],  tod:'any',  fight:1.1, art:{body:'eel',   tail:'round', dor:'none',  pal:['#2a1410','#5a2a18','#a04820','#e88830','#3a1c14','#140808','#ffd080'], pat:'bands'}},
  {id:'coalsc',   name:'COALSCALE',        water:'ember', rar:1, val:36,  w:[0.8,2.8],  tod:'any',  fight:1.1, art:{body:'stock', tail:'spade', dor:'sail',  pal:['#141414','#2a2a2a','#4a4a4a','#8a8a8a','#1a1a1a','#080808','#d0d0d0'], pat:'scales'}},
  {id:'ekoi',     name:'EMBERITE KOI',     water:'ember', rar:2, val:96,  w:[1.4,4.5],  tod:'day',  fight:1.25,art:{body:'koi', tail:'ribbon',dor:'sail',  pal:['#4a0c00','#b03000','#ff7a10','#ffe68a','#b03000','#1a0400','#fff4c0'], pat:'koi'}},
  {id:'meel',     name:'MAGMA EEL',        water:'ember', rar:3, val:320, w:[2.5,9.0],  tod:'any',  fight:1.5, art:{body:'eel',   tail:'ribbon',dor:'none',  pal:['#120706','#4a1408','#b03000','#ff7a10','#ffe68a','#080202','#ffd080'], pat:'bands', extra:'crest'}},
  {id:'phoenix',  name:'PHOENIX KOI',      water:'ember', rar:4, val:1400,w:[2.5,7.0],  tod:'dawn', fight:1.8, art:{body:'koi', tail:'ribbon',dor:'sail',  pal:['#4a0800','#e02810','#ff8020','#ffe080','#fff8d0','#1a0400','#fff8e0'], pat:'koi', extra:'fan'}},
  {id:'flame',    name:'THE FIRST FLAME',  water:'ember', rar:5, val:8000,w:[8,24],     tod:'dusk', fight:2.2, art:{body:'flame',  tail:'lunate',dor:'sail',  pal:['#1a0600','#6a1400','#e03800','#ff8010','#ffe68a','#0c0200','#fff0c0'], pat:'none', extra:'sail'}}
];

const FISH_BY = Object.create(null);
FISH.forEach((f,i)=>{ f.i=i; FISH_BY[f.id]=f; });

const UPG = {
  rod:  {n:'ROD',  max:12, cost:L=>Math.round(40*Math.pow(2.05,L)),
         d:L=>`cast x${(0.62+0.035*L).toFixed(2)} · hook ${(0.90+0.06*L).toFixed(2)}s · zone +${L}`},
  line: {n:'LINE', max:8, cost:L=>Math.round(35*Math.pow(2.2,L)),
         d:L=>`tension ${Math.round(48+L*8)} · snap resist +${L}`},
  bait: {n:'BAIT', max:8, cost:L=>Math.round(30*Math.pow(2.25,L)),
         d:L=>`wait ${waitRange(L)[0].toFixed(1)}–${waitRange(L)[1].toFixed(1)}s · luck +${(0.12*L).toFixed(2)}`},
  boat: {n:'BOAT', max:4, cost:L=>[180,900,4000,14000][L],
         d:L=>['tied to the dock','rowboat','skiff','rift hull','ember keel'][L]}
};

function rodPower(L){ return 0.62 + 0.035*L; }       // max cast distance 0-1
function hookWin(L){ return 0.90 + 0.06*L; }
function zoneBonus(L){ return L * 0.01; }
function tenMax(L){ return 48 + L*8; }
function waitRange(L){
  // starter bites in about 2–6s; better bait tightens the window
  const lo=Math.max(1.5, 2.0 - L*0.06);
  const hi=Math.max(lo+1.2, 6.0 - L*0.30);
  return [lo, hi];
}
const FIGHT_SEC=[4.2, 5.2, 7.0, 9.0, 11.5, 13.5];
function luckFromBait(L){ return 0.12*L; }

function fmt(n){
  n = Math.floor(n);
  if(n < 10000) return '$'+n;
  const u=['K','M','B','T']; let i=-1;
  while(n>=1000 && i<u.length-1){ n/=1000; i++; }
  return '$'+(n<100?n.toFixed(1):Math.floor(n))+u[i];
}
function fmtKg(w){ return (w<1?w.toFixed(2):w<10?w.toFixed(1):Math.round(w))+' KG'; }

function todName(t){
  t=((t%1)+1)%1;
  if(t>=0.22 && t<0.30) return 'DAWN';
  if(t>=0.30 && t<0.70) return 'DAY';
  if(t>=0.70 && t<0.80) return 'DUSK';
  return 'NIGHT';
}
function todMatch(need, t){
  if(!need || need==='any') return 1;
  const n=todName(t);
  if(need===n.toLowerCase()) return 1;
  // adjacent windows still bite, just less often
  if(need==='day' && (n==='DAWN'||n==='DUSK')) return 0.45;
  if(need==='night' && (n==='DAWN'||n==='DUSK')) return 0.45;
  if(need==='dawn' && (n==='DAY'||n==='NIGHT')) return 0.15;
  if(need==='dusk' && (n==='DAY'||n==='NIGHT')) return 0.15;
  return 0.04;
}

function rarityOdds(luck, far){
  const d = (far||0)*1.4;
  const w = RAR.map(r => r.b*Math.exp(r.g*(d+luck)));
  const s = w.reduce((a,b)=>a+b,0);
  return w.map(x=>x/s);
}
function rollRarity(luck, far, rnd){
  const o=rarityOdds(luck, far); let r=(rnd||Math.random)(), i=0;
  for(;i<o.length-1;i++){ if(r<o[i]) return i; r-=o[i]; }
  return i;
}


// Named rods, one per upgrade level. id is stable so art tweaks can be requested by name.
const RODS = [
  {id:'driftwood',   name:'DRIFTWOOD',      lv:0,  shaft:['#3a2a18','#5a4028','#8a6840','#c4a06a'], handle:['#2a1c10','#4a3020'], wrap:null,          reel:'none',    tip:'twine',    accent:'#6a4a28', shape:'crook'},
  {id:'reedcane',    name:'REED CANE',      lv:1,  shaft:['#5a4a18','#8a7a30','#c4b058','#e8d888'], handle:['#5a3a18','#a07a48'], wrap:'#6a5028',     reel:'cork',    tip:'plain',    accent:'#d8c070', shape:'cane'},
  {id:'harborspar',  name:'HARBOR SPAR',    lv:2,  shaft:['#3a2414','#6a3c20','#8a5230','#c48a58'], handle:['#2a1a10','#5a3a22'], wrap:'#4a2a14',     reel:'brass',   tip:'guides',   accent:'#c4a060', shape:'classic'},
  {id:'tealcaster',  name:'TEALCASTER',     lv:3,  shaft:['#0a3a48','#126a78','#1a98a0','#7ad0d4'], handle:['#1a2a30','#3a4a50'], wrap:'#0a5860',     reel:'silver',  tip:'guides',   accent:'#48CAE4', shape:'classic'},
  {id:'coralspire',  name:'CORAL SPIRE',    lv:4,  shaft:['#6a2030','#c05060','#f08080','#ffd0c8'], handle:['#4a2830','#8a4850'], wrap:'#8a3040',     reel:'shell',   tip:'coral',    accent:'#ff90a0', shape:'coral'},
  {id:'ironback',    name:'IRONBACK',       lv:5,  shaft:['#1a1c20','#3a3e46','#6a727c','#b0b8c0'], handle:['#141414','#2a2a2a'], wrap:'#2a1a10',     reel:'iron',    tip:'spear',    accent:'#8a9098', shape:'heavy'},
  {id:'sunline',     name:'SUNLINE',        lv:6,  shaft:['#5a3a08','#c49018','#f0c430','#fff0a0'], handle:['#3a2410','#6a4a20'], wrap:'#7a5010',     reel:'gold',    tip:'guides',   accent:'#ffe08a', shape:'classic'},
  {id:'bonespine',   name:'BONE SPINE',     lv:7,  shaft:['#4a4030','#8a7a62','#c8b898','#efe4c8'], handle:['#3a3020','#6a5a40'], wrap:'#5a4a30',     reel:'bone',    tip:'bone',     accent:'#efe4c8', shape:'bone'},
  {id:'crystalline', name:'CRYSTALLINE',    lv:8,  shaft:['#1a3048','#3a70a0','#80d0f0','#e8ffff'], handle:['#0c1820','#2a4050'], wrap:'#1a4860',     reel:'crystal', tip:'crystal',  accent:'#e8ffff', shape:'crystal'},
  {id:'stormrod',    name:'STORM ROD',      lv:9,  shaft:['#1a1c28','#3a4060','#80a0d0','#e0f0ff'], handle:['#101018','#2a2a38'], wrap:'#202040',     reel:'iron',    tip:'prong',    accent:'#ffe066', shape:'storm'},
  {id:'lavaglass',   name:'LAVA GLASS',     lv:10, shaft:['#1a0600','#6a1400','#e03800','#ff8010'], handle:['#140804','#3a1c10'], wrap:'#4a0c00',     reel:'ember',   tip:'ember',    accent:'#ffe68a', shape:'lava'},
  {id:'voidshard',   name:'VOID SHARD',     lv:11, shaft:['#14001e','#3c0a5c','#8f2fd6','#eab0ff'], handle:['#080010','#1a0a28'], wrap:'#2a0850',     reel:'void',    tip:'crystal',  accent:'#5ff6ff', shape:'void'},
  {id:'cosmicl',     name:'COSMIC L',       lv:12, shaft:['#081830','#1a4068','#3a80c0','#80e0ff'], handle:['#040c18','#1a2840'], wrap:'#0a2038',     reel:'gold',    tip:'star',     accent:'#ffd23a', shape:'ell'}
];
function rodByLevel(L){ return RODS[clamp(L|0, 0, RODS.length-1)]; }

function fishValue(f, weight){
  const mid=(f.w[0]+f.w[1])/2;
  const scale = 0.7 + 0.6*(weight/mid);
  return Math.max(1, Math.round(f.val * scale));
}
