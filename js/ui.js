'use strict';
const $=s=>document.querySelector(s);
const UI = {
  open:null, logTab:'all', logSel:null, shown:0,
  init(){
    document.querySelectorAll('[data-panel]').forEach(b=>b.addEventListener('click',()=>UI.toggle(b.dataset.panel)));
    $('#panels').addEventListener('click', UI.click);
    $('#gotit').addEventListener('click', ()=>{ $('#howto').classList.remove('show'); G.tut=1; save(); UI.hint('HOLD TO CAST'); });
    $('#play').addEventListener('click', ()=>UI.start(false));
    $('#newg').addEventListener('click', ()=>UI.start(true));
    const catchEl=$('#catch');
    catchEl.addEventListener('click', e=>{
      const b=e.target.closest('[data-act]'); if(!b) return;
      if(b.dataset.act==='sell'){ sellCaught(Play.value); afterCatch(); UI.toast('Sold for <b>'+fmt(Play.value)+'</b>.', 1400); }
      else afterCatch();
    });
  },
  start(freshSave){
    if(freshSave){ if(!confirm('Start a new game? This replaces your save.')) return; fresh(); save(); }
    $('#title').classList.add('out');
    document.body.classList.add('playing');
    MODE='play';
    if(!G.tut) setTimeout(()=>$('#howto').classList.add('show'), 400);
    else UI.hint('HOLD TO CAST');
    UI.tick(true);
    if(G.money>0||G.caught>0) $('#newg').hidden=false;
  },
  toggle(name){
    if(MODE!=='play') return;
    if(UI.open===name){ UI.close(); return; }
    UI.open=name;
    document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('on', p.id==='p-'+name));
    document.querySelectorAll('[data-panel]').forEach(b=>b.classList.toggle('act', b.dataset.panel===name));
    UI.render();
  },
  close(){
    UI.open=null;
    document.querySelectorAll('.panel').forEach(p=>p.classList.remove('on'));
    document.querySelectorAll('[data-panel]').forEach(b=>b.classList.remove('act'));
  },
  closeBtn(n){ const hd=document.querySelector('#p-'+n+' header'); if(hd&&!hd.querySelector('.x')) hd.insertAdjacentHTML('beforeend','<button class="x" data-act="close" aria-label="Close panel">&times;</button>'); },
  render(){
    if(!UI.open) return;
    ({creel:UI.rCreel, shop:UI.rShop, log:UI.rLog, map:UI.rMap, skills:UI.rSkills, admin:ADMIN.render})[UI.open]();
  },
  click(e){
    const b=e.target.closest('[data-act]'); if(!b) return;
    const act=b.dataset.act;
    if(act==='close') return UI.close();
    if(act==='sellone') sellOne(+b.dataset.i);
    if(act==='sellall') sellAll();
    if(act==='buy') buyUp(b.dataset.k);
    if(act==='go') travelTo(b.dataset.id);
    if(act==='tab'){ UI.logTab=b.dataset.tab; UI.render(); }
    if(act==='log'){ UI.logSel=b.dataset.id; UI.render(); }
    if(act==='skill'){ UI.pickSkill(b.dataset.id); }
    if(act==='unlock'){ UI.buySkill(b.dataset.id); }
  },
  rCreel(){
    const p=$('#p-creel');
    let h=`<header><h2>CREEL</h2><span>${G.creel.length}/${creelMax()}</span></header>`;
    if(!G.creel.length) h+=`<p class="hint">Nothing in the creel yet. Land a fish and it will sit here until you sell it.</p>`;
    else {
      h+=`<button class="buy wide" data-act="sellall">SELL ALL <b>${fmt(G.creel.reduce((a,it)=>a+it.val,0))}</b></button><div class="clist">`;
      G.creel.forEach((it,i)=>{
        const f=FISH_BY[it.id];
        h+=`<div class="row"><canvas width="96" height="56" data-fish="${f.id}"></canvas><div><b>${f.name}</b><small style="color:${RAR[f.rar].c}">${RAR[f.rar].n} · ${fmtKg(it.w)}</small></div>
          <button class="buy" data-act="sellone" data-i="${i}">${fmt(it.val)}</button></div>`;
      });
      h+=`</div>`;
    }
    p.innerHTML=h; UI.closeBtn('creel'); UI.paintIcons(p);
  },
  rShop(){
    const p=$('#p-shop');
    const cap=rodCap();
    let h=`<header><h2>SHOP</h2><span>${fmt(G.money)}</span></header>
      <p class="hint">A better rod casts farther and hooks longer. Line holds the fight. Bait shortens the wait and improves luck. Top rods and new waters unlock on the SKILLS tree.</p>`;
    Object.keys(UPG).forEach(k=>{
      const u=UPG[k], L=G.up[k], mx=L>=u.max, c=mx?0:u.cost(L);
      const gated=k==='rod' && !mx && L+1>cap;
      const extra=k==='rod'?' · '+(rodByLevel(L).name):k==='boat'?' · '+(UPG.boat.d(L)): '';
      const note=gated?'Unlock '+rodGateName(cap)+' on the skill tree to buy the next rod.': (u.d(L)+(mx?'':' → '+u.d(L+1)));
      const thumb=k==='rod'?`<canvas class="rodth" width="40" height="120" data-rod="${rodByLevel(L).id}"></canvas>`:'';
      h+=`<div class="row">${thumb}<div><b>${u.n}${extra}</b> <span class="pips">${'▮'.repeat(L)}<s>${'▮'.repeat(u.max-L)}</s></span>
        <small>${note}</small></div>
        <button class="buy" data-act="buy" data-k="${k}" ${mx||gated||G.money<c?'disabled':''}>${mx?'MAX':gated?'LOCKED':fmt(c)}</button></div>`;
    });
    p.innerHTML=h; UI.closeBtn('shop'); UI.paintRods(p);
  },
  rLog(){
    const p=$('#p-log');
    const seen=FISH.filter(f=>G.log[f.id]).length;
    const tab=UI.logTab||'all';
    const list=tab==='all'?FISH:FISH.filter(f=>f.water===tab);
    let h=`<header><h2>LOG</h2><span>${seen}/${FISH.length}</span></header>
      <div class="tabs">`;
    h+=`<button data-act="tab" data-tab="all" class="${tab==='all'?'act':''}">ALL</button>`;
    WATERS.forEach(w=>{ h+=`<button data-act="tab" data-tab="${w.id}" class="${tab===w.id?'act':''}">${w.n}</button>`; });
    h+=`</div><div class="logg">`;
    list.forEach(f=>{
      const rec=G.log[f.id], on=!!rec;
      h+=`<div class="logc ${on?'on':''}" data-act="log" data-id="${f.id}" ${on?`style="border-color:${RAR[f.rar].c}"`:''}>
        <canvas width="96" height="56" data-fish="${f.id}" data-sil="${on?0:1}"></canvas>
        <b>${on?f.name:'???'}</b>
        ${on?`<span class="n">${rec.n} · ${fmtKg(rec.best)}</span>`:''}
      </div>`;
    });
    h+=`</div>`;
    const sel=FISH_BY[UI.logSel]|| (tab==='all'?null:null);
    const show=FISH_BY[UI.logSel];
    if(show){
      const rec=G.log[show.id];
      h+=`<div class="log-d">${rec?`<b>${show.name}</b> · <span style="color:${RAR[show.rar].c}">${RAR[show.rar].n}</span><br>
        ${WATERS.find(w=>w.id===show.water).n} · ${show.tod==='any'?'ANY HOUR':show.tod.toUpperCase()}<br>
        Caught ${rec.n} · best ${fmtKg(rec.best)} · sells about ${fmt(show.val)}`
        :`<b>???</b><br>An unseen fish of the ${WATERS.find(w=>w.id===show.water).n.toLowerCase()}.`}</div>`;
    } else h+=`<div class="log-d">Tap a silhouette to read it. Unseen fish stay as shadows until you land one.</div>`;
    p.innerHTML=h; UI.closeBtn('log'); UI.paintIcons(p);
  },
  rMap(){
    const p=$('#p-map');
    let h=`<header><h2>WATERS</h2><span>${G.unlocked.length}/${WATERS.length}</span></header>
      <p class="hint">Unlock farther waters on the SKILLS tree, under VOYAGER. Each one holds its own fish.</p>`;
    WATERS.forEach(w=>{
      const need=waterSkill(w.id);
      const skillOk=!need || need==='root' || hasSkill(need);
      const open=G.unlocked.includes(w.id) || skillOk;
      const here=G.water===w.id;
      const needName=need && SKILL_BY[need]?SKILL_BY[need].n:'';
      h+=`<div class="wcard ${here?'here':''} ${open?'':'locked'}" ${open?`data-act="go" data-id="${w.id}"`:''}>
        <canvas class="wswatch" width="44" height="28" data-water="${w.id}"></canvas>
        <div><b>${w.n}</b><i>${w.tag}${here?' · YOU ARE HERE':open?'':' · UNLOCK '+needName+' ON THE TREE'}</i>
        <i>${w.blurb}</i></div></div>`;
    });
    p.innerHTML=h; UI.closeBtn('map'); UI.paintWaters(p);
  },
  rSkills(){
    const p=$('#p-skills');
    const need=xpToNext(G.level||0);
    const pct=Math.round(Math.min(1,(G.xp||0)/need)*100);
    let h=`<header><h2>SKILLS</h2><span>LV ${G.level||0} · ${G.sp||0} SP</span></header>
      <div class="xpbar"><i style="width:${pct}%"></i></div>
      <div class="xplabel">${G.xp||0} / ${need} XP TO LV ${(G.level||0)+1}</div>
      <p class="hint">Catch fish to earn XP. Each level grants a skill point. Spend points to open a branch.</p>
      <div class="stree">`;
    const cols=['angler','line','lure','voyage'];
    cols.forEach(br=>{
      const meta=BRANCH[br];
      const nodes=SKILLS.filter(s=>s.branch===br);
      const maxR=Math.max(...nodes.map(s=>s.row));
      h+=`<div class="scol" style="--br:${meta.c}"><h3>${meta.n}</h3><div class="sgrid">`;
      for(let r=0;r<=maxR;r++){
        const row=nodes.filter(s=>s.row===r).sort((a,b)=>a.col-b.col);
        h+=`<div class="srow">`;
        row.forEach(s=>{
          const st=skillState(s);
          const pop=UI._pop===s.id?' pop':'';
          const sel=UI.skillSel===s.id?' sel':'';
          h+=`<button class="snode ${st}${pop}${sel}" data-act="skill" data-id="${s.id}" style="--br:${meta.c}"><b>${s.n}</b><small>${st==='owned'?'OWNED':s.cost+' SP'}</small></button>`;
        });
        h+=`</div>`;
      }
      h+=`</div></div>`;
    });
    h+=`</div>`;
    const s=SKILL_BY[UI.skillSel];
    if(s && s.id!=='root'){
      const st=skillState(s);
      h+=`<div class="sdetail"><b style="color:${(BRANCH[s.branch]||{}).c||'#ffd23a'}">${s.n}</b> · ${st.toUpperCase()}<br>${s.d}`;
      if(st==='available') h+=`<button class="buy wide" data-act="unlock" data-id="${s.id}">UNLOCK · ${s.cost} SP</button>`;
      else if(st==='wait') h+=`<div class="meta">Need ${s.cost} skill point${s.cost>1?'s':''}.</div>`;
      else if(st==='locked') h+=`<div class="meta">Unlock the skills above this one first.</div>`;
      h+=`</div>`;
    } else h+=`<div class="sdetail">Tap a skill to read it. Gold nodes are ready to buy. Dim nodes are still locked.</div>`;
    p.innerHTML=h; UI.closeBtn('skills');
  },
  pickSkill(id){
    UI.skillSel=id;
    UI.render();
  },
  buySkill(id){
    const s=SKILL_BY[id]; if(!s) return;
    if(unlockSkill(id)){
      UI.skillSel=id;
      UI._pop=id;
      UI.toast('Unlocked <b>'+s.n+'</b>.', 1600);
      UI.render();
      clearTimeout(UI._popT);
      UI._popT=setTimeout(()=>{ UI._pop=null; if(UI.open==='skills') UI.render(); }, 580);
    } else UI.render();
  },
  paintIcons(root){
    root.querySelectorAll('canvas[data-fish]').forEach(c=>{
      const f=FISH_BY[c.dataset.fish]; if(!f) return;
      const sil=c.dataset.sil==='1';
      const g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.clearRect(0,0,c.width,c.height);
      g.drawImage(fishSpr(f,sil),0,0);
    });
  },
  paintRods(root){
    root.querySelectorAll('canvas[data-rod]').forEach(c=>{
      const rod=RODS.find(r=>r.id===c.dataset.rod); if(!rod) return;
      const spr=rodSpr(rod);
      const g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.clearRect(0,0,c.width,c.height);
      const sc=Math.min(c.width/spr.width, c.height/spr.height);
      const tw=Math.max(1,Math.round(spr.width*sc)), th=Math.max(1,Math.round(spr.height*sc));
      g.drawImage(spr, Math.floor((c.width-tw)/2), Math.floor((c.height-th)/2), tw, th);
    });
  },
  paintWaters(root){
    root.querySelectorAll('canvas[data-water]').forEach(c=>{
      const g=c.getContext('2d'); g.imageSmoothingEnabled=false;
      const pal=skyWaterPal(c.dataset.water, 0.45);
      const sk=pal.sky, wt=pal.water;
      g.fillStyle=sk[sk.length-1]; g.fillRect(0,0,44,10);
      g.fillStyle=pal.horizon; g.fillRect(0,10,44,2);
      g.fillStyle=wt[Math.min(2,wt.length-1)]; g.fillRect(0,12,44,16);
      g.fillStyle=wt[0]; g.fillRect(0,22,44,6);
    });
  },
  showFight(on){
    const el=$('#fight-ui');
    el.hidden=!on;
  },
  tickFight(inZ){
    const z=Play.zone, w=Play.zoneW, m=Play.mark;
    const zone=$('#f-zone'), mark=$('#f-mark'), prog=$('#f-prog'), ten=$('#f-ten'), wrap=ten.parentElement;
    zone.style.left=((z-w/2)*100)+'%';
    zone.style.width=(w*100)+'%';
    mark.style.left=(m*100)+'%';
    prog.style.width=(Play.prog*100)+'%';
    const tmax=tenMaxNow();
    ten.style.width=(clamp(Play.ten/tmax,0,1)*100)+'%';
    wrap.classList.toggle('hot', Play.ten/tmax>0.7);
    $('#f-tip').textContent = inZ? 'HOLD THE ZONE' : 'THE FISH IS RUNNING';
  },
  showCatch(f,w,val,first,full,xp,leveled){
    const el=$('#catch');
    el.hidden=false;
    el.classList.toggle('mythic', f.rar===5);
    el.classList.toggle('legendary', f.rar===4);
    const spr=fishBig(f,0);
    const mul=f.rar>=5?1:2;
    const dw=spr.width*mul, dh=spr.height*mul;
    const padX=f.rar>=5?32: f.rar>=4?24:18;
    const padY=f.rar>=5?24: f.rar>=4?18:14;
    const cw=Math.max(f.rar>=5?280:192, dw+padX*2);
    const ch=Math.max(f.rar>=5?180:112, dh+padY*2);
    el.innerHTML=`<div class="card">
      ${first?'<div class="new">NEW LOG ENTRY</div>':''}
      <canvas id="catch-cv" width="${cw}" height="${ch}"></canvas>
      <h2>${f.name}</h2>
      <div class="rar" style="color:${RAR[f.rar].c}">${RAR[f.rar].n}</div>
      <div class="meta">${fmtKg(w)} · worth <b>${fmt(val)}</b> · +${xp||0} XP${leveled?' · LEVEL UP':''}${full?'<br>The creel is full, so this one must be sold.':''}</div>
      <div class="btns">
        <button class="buy" data-act="sell">SELL ${fmt(val)}</button>
        ${full?'':'<button class="buy tier" data-act="keep">KEEP</button>'}
      </div>
    </div>`;
    const paint=fr=>{
      const cv=$('#catch-cv'); if(!cv) return;
      const g=cv.getContext('2d'); g.imageSmoothingEnabled=false;
      g.clearRect(0,0,cv.width,cv.height);
      g.fillStyle='#041018'; g.fillRect(0,0,cv.width,cv.height);
      const img=fishBig(f, fr||0);
      const mul=f.rar>=5?1:2;
      const dw=img.width*mul, dh=img.height*mul;
      const x=Math.floor((cv.width-dw)/2), y=Math.floor((cv.height-dh)/2);
      g.drawImage(img,x,y,dw,dh);
    };
    paint(0);
    clearInterval(UI._cf);
    if(f.rar>=5 && !(Scene&&Scene.rm)){
      let pulse=0;
      UI._cf=setInterval(()=>{
        const cv=$('#catch-cv'); if(!cv) return;
        paint(0);
        const g=cv.getContext('2d');
        pulse=(pulse+1)%24;
        const a=0.10+0.10*Math.abs(Math.sin(pulse/24*Math.PI*2));
        g.fillStyle='rgba(255,210,58,'+a.toFixed(3)+')';
        g.fillRect(0,0,cv.width,2); g.fillRect(0,cv.height-2,cv.width,2);
        g.fillRect(0,0,2,cv.height); g.fillRect(cv.width-2,0,2,cv.height);
      }, 80);
    }
    requestAnimationFrame(()=>el.classList.add('show'));
  },
  hint(msg){
    const el=$('#hint');
    Play.hint=msg||'';
    if(!msg){ el.classList.remove('on'); el.textContent=''; return; }
    el.innerHTML=msg; el.classList.add('on');
  },
  toast(msg, ms){
    const el=$('#toast');
    el.innerHTML=msg; el.classList.add('on');
    clearTimeout(UI._tt);
    UI._tt=setTimeout(()=>el.classList.remove('on'), ms||2000);
  },
  moneyUp(){
    const el=$('#money'); el.classList.remove('up'); void el.offsetWidth; el.classList.add('up');
  },
  tick(force){
    if(MODE!=='play' && !force) return;
    if(force || Math.abs(G.money-UI.shown)>0.5){ UI.shown=G.money; $('#money').textContent=fmt(G.money); }
    const w=WATERS.find(x=>x.id===G.water);
    $('#water').textContent=w?w.n:'THE SEA';
    $('#tod').textContent=todName(G.tod);
    $('#caught').textContent=G.caught;
    const lv=$('#level'); if(lv) lv.textContent=String(G.level||0);
    const pow=$('#power');
    if(Play.phase==='charge'){ pow.classList.add('on'); $('#power-fill').style.height=(Play.power*100)+'%'; }
    else pow.classList.remove('on');
  }
};
