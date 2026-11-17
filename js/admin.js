'use strict';
// Admin panel: press L (or Esc to close). On phones, long-press TIME in play, or the CAST logo on the title.

const ADMIN = {
  open:false, speed:1, xluck:0, rconf:false,
  isTyping(e){ const t=e.target; return t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT'||t.isContentEditable); },
  toggle(){
    if(ADMIN.open) ADMIN.close();
    else ADMIN.show();
  },
  show(){
    ADMIN.open=true;
    ADMIN.rconf=false;
    if(typeof UI!=='undefined' && UI.open) UI.close();
    document.body.classList.add('admin-open');
    const pn=$('#p-admin');
    pn.hidden=false;
    pn.classList.add('on');
    ADMIN.render();
  },
  close(){
    ADMIN.open=false;
    ADMIN.rconf=false;
    document.body.classList.remove('admin-open');
    const pn=$('#p-admin');
    if(pn){ pn.classList.remove('on'); pn.hidden=true; }
  },
  opt(list, sel, getv, getn){ return list.map((it,i)=>{ const v=getv?getv(it,i):it, n=getn?getn(it,i):it; return `<option value="${v}"${String(v)===String(sel)?' selected':''}>${n}</option>`; }).join(''); },
  fishOptions(){
    return WATERS.map(w=>{
      const rows=FISH.filter(f=>f.water===w.id).map(f=>{
        const sel=Play.forceId===f.id?' selected':'';
        return `<option value="${f.id}"${sel}>${f.name} · ${RAR[f.rar].n}</option>`;
      }).join('');
      return `<optgroup label="${w.n}">${rows}</optgroup>`;
    }).join('');
  },
  render(){
    const pn=$('#p-admin'); if(!pn) return;
    const rod= (typeof rodByLevel==='function') ? rodByLevel(G.up.rod) : null;
    pn.innerHTML=`<div class="admin-card">
      <header>
        <h2>ADMIN</h2>
        <span>L OR ESC TO CLOSE</span>
        <button class="x" data-adm="close" aria-label="Close admin">&times;</button>
      </header>
      <p class="hint">Cheats for testing. Works on the title and while fishing.</p>

      <h3>CASH <small class="adm-v">${fmt(G.money)}</small></h3>
      <div class="adm-r"><button class="buy" data-adm="cash" data-v="100">+100</button><button class="buy" data-adm="cash" data-v="1000">+1K</button><button class="buy" data-adm="cash" data-v="10000">+10K</button><button class="buy" data-adm="cash" data-v="100000">+100K</button></div>
      <div class="adm-r"><input id="adm-cash" type="number" min="0" step="1" placeholder="amount" inputmode="numeric"><button class="buy" data-adm="cashadd">ADD</button><button class="buy" data-adm="cashset">SET</button></div>

      <h3>XP &amp; SKILL POINTS <small class="adm-v">LV ${G.level||0} · ${G.sp||0} SP · ${G.xp||0} XP</small></h3>
      <div class="adm-r"><button class="buy" data-adm="xp" data-v="50">+50 XP</button><button class="buy" data-adm="xp" data-v="400">+400 XP</button><button class="buy" data-adm="xp" data-v="2000">+2K XP</button></div>
      <div class="adm-r"><button class="buy" data-adm="sp" data-v="1">+1 SP</button><button class="buy" data-adm="sp" data-v="5">+5 SP</button><button class="buy" data-adm="sp" data-v="20">+20 SP</button></div>

      <h3>UNLOCK</h3>
      <div class="adm-r"><button class="buy wide" data-adm="allskills">UNLOCK ALL SKILLS</button></div>
      <div class="adm-r"><button class="buy wide" data-adm="allrods">UNLOCK ALL RODS</button></div>
      <div class="adm-r"><button class="buy wide" data-adm="unlockw">UNLOCK ALL WATERS</button></div>
      <div class="adm-r"><button class="buy wide" data-adm="maxup">UNLOCK ALL + MAX UPGRADES</button></div>
      <div class="adm-r"><select id="adm-water">${ADMIN.opt(WATERS, G.water, w=>w.id, w=>w.n)}</select><button class="buy" data-adm="gow">GO</button></div>
      <p class="hint">Current rod: ${rod?rod.name:'—'}</p>

      <h3>HOOK A FISH</h3>
      <p class="hint">Pick any species, including mythics, and hook it now to test the catch reveal.</p>
      <div class="adm-r"><select id="adm-ff"><option value="">PICK A FISH</option>${ADMIN.fishOptions()}</select></div>
      <div class="adm-r"><button class="buy wide tier" data-adm="hook">HOOK THIS FISH</button></div>
      <div class="adm-r"><button class="buy wide" data-adm="bite">FORCE A BITE (NEXT CAST)</button></div>

      <h3>TIME OF DAY <small class="adm-v" id="adm-todn">${todName(G.tod)}</small></h3>
      <input id="adm-tod" class="adm-sl" type="range" min="0" max="1" step="0.01" value="${G.tod}">
      <div class="adm-r"><button class="buy" data-adm="tod" data-v="0.26">DAWN</button><button class="buy" data-adm="tod" data-v="0.45">DAY</button><button class="buy" data-adm="tod" data-v="0.74">DUSK</button><button class="buy" data-adm="tod" data-v="0.90">NIGHT</button></div>

      <h3>LUCK BONUS <small class="adm-v" id="adm-lv">+${ADMIN.xluck.toFixed(2)}</small></h3>
      <input id="adm-luck" class="adm-sl" type="range" min="0" max="5" step="0.1" value="${ADMIN.xluck}">

      <h3>LOG</h3>
      <div class="adm-r"><button class="buy wide" data-adm="unlocklog">UNLOCK ALL LOG ENTRIES</button></div>

      <h3>GAME SPEED</h3>
      <div class="adm-r">${[1,2,5,10].map(v=>`<button class="buy ${ADMIN.speed===v?'tier':''}" data-adm="speed" data-v="${v}">${v}X</button>`).join('')}</div>

      <h3>SAVE</h3>
      <div class="adm-r"><button class="buy wide" data-adm="save">SAVE NOW</button></div>
      <div class="adm-r"><button class="buy wide adm-red" data-adm="reset">${ADMIN.rconf?'CLICK AGAIN TO CONFIRM RESET':'RESET SAVE'}</button></div>
    </div>`;
  },
  done(msg){
    save();
    if(typeof UI!=='undefined'){ UI.render(); UI.tick(true); }
    if(ADMIN.open) ADMIN.render();
    if(msg) UI.toast(msg, 1400);
  },
  cashAmt(){ const el=$('#adm-cash'); const v=el?+el.value:0; return isFinite(v)?Math.max(0,Math.floor(v)):0; },
  ensurePlay(){
    if(MODE==='play') return;
    const title=$('#title'); if(title) title.classList.add('out');
    document.body.classList.add('playing');
    MODE='play';
    G.tut=1;
    if(typeof UI!=='undefined') UI.tick(true);
    const newg=$('#newg'); if(newg && (G.money>0||G.caught>0||G.tut)) newg.hidden=false;
  },
  hookNow(){
    const sel=$('#adm-ff');
    const id=sel && sel.value;
    if(!id || !FISH_BY[id]){ UI.toast('Pick a fish first.', 1400); return; }
    const f=FISH_BY[id];
    ADMIN.close();
    ADMIN.ensurePlay();
    if(typeof resetPlay==='function') resetPlay();
    const w=lerp(f.w[0], f.w[1], 0.65);
    const val=fishValue(f,w);
    Play.hooked=f; Play.weight=w; Play.value=val; Play.phase='catch';
    openCatch();
  },
  click(e){
    const b=e.target.closest('[data-adm]'); if(!b) return;
    const a=b.dataset.adm;
    if(a==='close'){ ADMIN.close(); return; }
    if(a!=='reset') ADMIN.rconf=false;
    if(a==='cash'){ G.money+=+b.dataset.v; return ADMIN.done('Cash added.'); }
    if(a==='cashadd'){ G.money+=ADMIN.cashAmt(); return ADMIN.done('Cash added.'); }
    if(a==='cashset'){ G.money=ADMIN.cashAmt(); return ADMIN.done('Cash set.'); }
    if(a==='tod'){ G.tod=+b.dataset.v; return ADMIN.done('Time set to '+todName(G.tod)+'.'); }
    if(a==='xp'){ awardXP(+b.dataset.v); return ADMIN.done('XP granted.'); }
    if(a==='sp'){ G.sp=(G.sp||0)+(+b.dataset.v); return ADMIN.done('Skill points added.'); }
    if(a==='allskills'){
      G.skills=G.skills||{};
      SKILLS.forEach(s=>{ if(!s.auto) G.skills[s.id]=1; if(s.water && !G.unlocked.includes(s.water)) G.unlocked.push(s.water); });
      return ADMIN.done('Skill tree unlocked.');
    }
    if(a==='allrods'){
      G.skills=G.skills||{};
      SKILLS.forEach(s=>{ if(s.branch==='angler' && !s.auto) G.skills[s.id]=1; });
      G.up.rod=UPG.rod.max;
      return ADMIN.done('All rods unlocked.');
    }
    if(a==='unlockw'){
      G.up.boat=UPG.boat.max;
      WATERS.forEach(w=>{ if(!G.unlocked.includes(w.id)) G.unlocked.push(w.id); });
      G.skills=G.skills||{};
      ['v1','v2','v3','v4'].forEach(id=>G.skills[id]=1);
      return ADMIN.done('All waters unlocked.');
    }
    if(a==='gow'){
      const id=$('#adm-water').value;
      if(!G.unlocked.includes(id)) G.unlocked.push(id);
      ADMIN.ensurePlay();
      travelTo(id);
      return ADMIN.done();
    }
    if(a==='hook'){ return ADMIN.hookNow(); }
    if(a==='bite'){
      ADMIN.ensurePlay();
      Play.forceId=$('#adm-ff') && $('#adm-ff').value || Play.forceId;
      if(Play.phase==='idle'){
        const land=landingPoint(0.55, 0);
        Play.bob={x:land.x,y:land.y,sc:land.sc,u:land.u,z:land.z,ph:0,under:false};
      }
      if(Play.phase==='wait'||Play.phase==='idle'||Play.phase==='charge'){ Play.charging=false; startBite(); ADMIN.close(); }
      else UI.toast('Already in a catch. Finish it, or hook a fish now.', 1600);
      return;
    }
    if(a==='maxup'){
      Object.keys(UPG).forEach(k=>G.up[k]=UPG[k].max);
      WATERS.forEach(w=>{ if(!G.unlocked.includes(w.id)) G.unlocked.push(w.id); });
      G.skills=G.skills||{};
      SKILLS.forEach(s=>{ if(!s.auto) G.skills[s.id]=1; });
      return ADMIN.done('Everything unlocked, upgrades maxed.');
    }
    if(a==='unlocklog'){
      FISH.forEach(f=>{ const rec=G.log[f.id]||{n:0,best:0}; rec.n=Math.max(rec.n,1); rec.best=Math.max(rec.best, (f.w[0]+f.w[1])/2); G.log[f.id]=rec; });
      G.caught=Math.max(G.caught, FISH.length); return ADMIN.done('Log filled.');
    }
    if(a==='speed'){ ADMIN.speed=+b.dataset.v; return ADMIN.done('Speed '+ADMIN.speed+'X.'); }
    if(a==='save'){ save(); return ADMIN.done('Saved.'); }
    if(a==='reset'){
      if(!ADMIN.rconf){ ADMIN.rconf=true; return ADMIN.render(); }
      try{ const cur=localStorage.getItem(SAVE_KEY); if(cur) localStorage.setItem(SAVE_KEY+'-bak', cur); }catch(e){}
      fresh(); save(); if(typeof resetPlay==='function') resetPlay();
      ADMIN.rconf=false; ADMIN.speed=1; ADMIN.xluck=0;
      const newg=$('#newg'); if(newg) newg.hidden=true;
      return ADMIN.done('Save reset. A backup was kept.');
    }
  },
  change(e){
    const t=e.target;
    if(t.id==='adm-tod'){ G.tod=+t.value; const n=$('#adm-todn'); if(n) n.textContent=todName(G.tod); if(typeof UI!=='undefined') UI.tick(true); if(e.type==='change') save(); }
    if(t.id==='adm-luck'){ ADMIN.xluck=clamp(+t.value,0,5); const l=$('#adm-lv'); if(l) l.textContent='+'+ADMIN.xluck.toFixed(2); }
    if(t.id==='adm-ff' && e.type==='change') Play.forceId=$('#adm-ff').value||null;
  },
  bindHold(el){
    if(!el) return;
    let tm=null;
    const start=e=>{
      if(e.button && e.button!==0) return;
      clearTimeout(tm);
      tm=setTimeout(()=>{ tm=null; ADMIN.toggle(); }, 900);
    };
    const cancel=()=>{ clearTimeout(tm); tm=null; };
    el.addEventListener('pointerdown', start);
    ['pointerup','pointerleave','pointercancel'].forEach(ev=>el.addEventListener(ev, cancel));
    el.addEventListener('contextmenu', ev=>ev.preventDefault());
  },
  init(){
    const pn=$('#p-admin');
    pn.addEventListener('click', e=>{
      if(e.target===pn) ADMIN.close();
      else ADMIN.click(e);
    });
    pn.addEventListener('input', ADMIN.change);
    pn.addEventListener('change', ADMIN.change);
    // mobile: long-press TIME (play HUD) or the title logo
    const time=$('#time-stat');
    if(time){ time.style.pointerEvents='auto'; time.style.touchAction='none'; time.style.webkitTouchCallout='none'; ADMIN.bindHold(time); }
    const logo=$('#logo');
    if(logo){ logo.style.touchAction='none'; logo.style.webkitTouchCallout='none'; ADMIN.bindHold(logo); }
  }
};
