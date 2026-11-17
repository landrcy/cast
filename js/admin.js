'use strict';
// ================= ADMIN PANEL (press L; on phones long-press the TIME stat) =================
const ADMIN = {
  speed:1, xluck:0, rconf:false,
  isTyping(e){ const t=e.target; return t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT'||t.isContentEditable); },
  toggle(){ if(MODE!=='play') return; UI.toggle('admin'); },
  opt(list, sel, getv, getn){ return list.map((it,i)=>{ const v=getv?getv(it,i):i, n=getn?getn(it,i):it; return `<option value="${v}"${String(v)===String(sel)?' selected':''}>${n}</option>`; }).join(''); },
  render(){
    const RN=RAR.map(x=>x.n);
    let h=`<header><h2>ADMIN</h2><span>L TO CLOSE</span></header>
    <h3>CASH <small class="adm-v">${fmt(G.money)}</small></h3>
    <div class="adm-r"><button class="buy" data-adm="cash" data-v="100">+100</button><button class="buy" data-adm="cash" data-v="1000">+1K</button><button class="buy" data-adm="cash" data-v="100000">+100K</button></div>
    <div class="adm-r"><input id="adm-cash" type="number" min="0" step="1" placeholder="amount" inputmode="numeric"><button class="buy" data-adm="cashadd">ADD</button><button class="buy" data-adm="cashset">SET</button></div>
    <h3>TIME OF DAY <small class="adm-v" id="adm-todn">${todName(G.tod)}</small></h3>
    <input id="adm-tod" class="adm-sl" type="range" min="0" max="1" step="0.01" value="${G.tod}">
    <div class="adm-r"><button class="buy" data-adm="tod" data-v="0.26">DAWN</button><button class="buy" data-adm="tod" data-v="0.45">DAY</button><button class="buy" data-adm="tod" data-v="0.74">DUSK</button><button class="buy" data-adm="tod" data-v="0.90">NIGHT</button></div>
    <h3>LUCK BONUS <small class="adm-v" id="adm-lv">+${ADMIN.xluck.toFixed(2)}</small></h3>
    <input id="adm-luck" class="adm-sl" type="range" min="0" max="5" step="0.1" value="${ADMIN.xluck}">
    <h3>SKILLS <small class="adm-v">LV ${G.level||0} · ${G.sp||0} SP · ${G.xp||0} XP</small></h3>
    <div class="adm-r"><button class="buy" data-adm="xp" data-v="50">+50 XP</button><button class="buy" data-adm="xp" data-v="400">+400 XP</button><button class="buy" data-adm="sp" data-v="1">+1 SP</button><button class="buy" data-adm="sp" data-v="5">+5 SP</button></div>
    <div class="adm-r"><button class="buy wide" data-adm="allskills">UNLOCK ALL SKILLS</button></div>
    <h3>WATERS</h3>
    <div class="adm-r"><button class="buy wide" data-adm="unlockw">UNLOCK ALL WATERS + MAX BOAT</button></div>
    <div class="adm-r"><select id="adm-water">${ADMIN.opt(WATERS, G.water, w=>w.id, w=>w.n)}</select><button class="buy" data-adm="gow">GO</button></div>
    <h3>NEXT CATCH</h3>
    <div class="adm-r"><select id="adm-fr"><option value="-1">RARITY: NORMAL ROLL</option>${RN.map((n,i)=>`<option value="${i}"${Play.forceRar===i?' selected':''}>RARITY: ${n}</option>`).join('')}</select></div>
    <div class="adm-r"><select id="adm-ff"><option value="">FISH: NORMAL ROLL</option>${FISH.map(f=>`<option value="${f.id}"${Play.forceId===f.id?' selected':''}>${f.name}</option>`).join('')}</select></div>
    <div class="adm-r"><button class="buy wide" data-adm="bite">FORCE A BITE</button></div>
    <h3>UPGRADES</h3>
    <div class="adm-r"><button class="buy wide" data-adm="maxup">MAX ALL UPGRADES</button></div>
    <h3>LOG</h3>
    <div class="adm-r"><button class="buy wide" data-adm="unlocklog">UNLOCK ALL LOG ENTRIES</button></div>
    <h3>GAME SPEED</h3>
    <div class="adm-r">${[1,2,5,10].map(v=>`<button class="buy ${ADMIN.speed===v?'tier':''}" data-adm="speed" data-v="${v}">${v}X</button>`).join('')}</div>
    <h3>SAVE</h3>
    <div class="adm-r"><button class="buy wide" data-adm="save">SAVE NOW</button></div>
    <div class="adm-r"><button class="buy wide adm-red" data-adm="reset">${ADMIN.rconf?'CLICK AGAIN TO CONFIRM RESET':'RESET SAVE'}</button></div>`;
    $('#p-admin').innerHTML=h;
    UI.closeBtn('admin');
  },
  done(msg){ save(); UI.render(); UI.tick(true); if(msg) UI.toast(msg, 1400); },
  cashAmt(){ const v=+$('#adm-cash').value; return isFinite(v)?Math.max(0,Math.floor(v)):0; },
  click(e){
    const b=e.target.closest('[data-adm]'); if(!b) return;
    const a=b.dataset.adm;
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
    if(a==='unlockw'){
      G.up.boat=UPG.boat.max;
      WATERS.forEach(w=>{ if(!G.unlocked.includes(w.id)) G.unlocked.push(w.id); });
      ['v1','v2','v3','v4'].forEach(id=>{ G.skills=G.skills||{}; G.skills[id]=1; });
      return ADMIN.done('All waters unlocked.');
    }
    if(a==='gow'){ const id=$('#adm-water').value; if(!G.unlocked.includes(id)) G.unlocked.push(id); travelTo(id); return ADMIN.done(); }
    if(a==='bite'){
      if(Play.phase==='idle'){ // drop a mid-range bobber then bite
        const land=landingPoint(0.55, 0); Play.bob={x:land.x,y:land.y,sc:land.sc,u:land.u,z:land.z,ph:0,under:false}; }
      if(Play.phase==='wait'||Play.phase==='idle'||Play.phase==='charge'){ Play.charging=false; startBite(); }
      else UI.toast('Already in a catch.', 1200);
      return;
    }
    if(a==='maxup'){
      Object.keys(UPG).forEach(k=>G.up[k]=UPG[k].max);
      WATERS.forEach(w=>{ if(!G.unlocked.includes(w.id)) G.unlocked.push(w.id); });
      G.skills=G.skills||{};
      SKILLS.forEach(s=>{ if(!s.auto) G.skills[s.id]=1; });
      return ADMIN.done('Upgrades maxed.');
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
      fresh(); save(); resetPlay(); ADMIN.rconf=false; ADMIN.speed=1; ADMIN.xluck=0;
      return ADMIN.done('Save reset. A backup was kept.');
    }
  },
  change(e){
    const t=e.target;
    if(t.id==='adm-tod'){ G.tod=+t.value; const n=$('#adm-todn'); if(n) n.textContent=todName(G.tod); UI.tick(true); if(e.type==='change') save(); }
    if(t.id==='adm-luck'){ ADMIN.xluck=clamp(+t.value,0,5); const l=$('#adm-lv'); if(l) l.textContent='+'+ADMIN.xluck.toFixed(2); }
    if(t.id==='adm-fr' && e.type==='change') Play.forceRar=+$('#adm-fr').value;
    if(t.id==='adm-ff' && e.type==='change') Play.forceId=$('#adm-ff').value||null;
  },
  init(){
    const pn=$('#p-admin');
    pn.addEventListener('click', ADMIN.click);
    pn.addEventListener('input', ADMIN.change);
    pn.addEventListener('change', ADMIN.change);
    // hidden mobile entry: hold the TIME stat for a second
    const lk=$('#time-stat'); let tm=null;
    lk.style.pointerEvents='auto'; lk.style.touchAction='none'; lk.style.webkitTouchCallout='none';
    lk.addEventListener('pointerdown',()=>{ clearTimeout(tm); tm=setTimeout(()=>{ tm=null; ADMIN.toggle(); },900); });
    ['pointerup','pointerleave','pointercancel'].forEach(ev=>lk.addEventListener(ev,()=>{ clearTimeout(tm); tm=null; }));
    lk.addEventListener('contextmenu',e=>e.preventDefault());
  }
};
