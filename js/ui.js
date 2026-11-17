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
    ({creel:UI.rCreel, shop:UI.rShop, log:UI.rLog, map:UI.rMap, admin:ADMIN.render})[UI.open]();
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
  },
  rCreel(){
    const p=$('#p-creel');
    let h=`<header><h2>CREEL</h2><span>${G.creel.length}/${CREEL_MAX}</span></header>`;
    if(!G.creel.length) h+=`<p class="hint">Nothing in the creel yet. Land a fish and it will sit here until you sell it.</p>`;
    else {
      h+=`<button class="buy wide" data-act="sellall">SELL ALL <b>${fmt(G.creel.reduce((a,it)=>a+it.val,0))}</b></button><div class="clist">`;
      G.creel.forEach((it,i)=>{
        const f=FISH_BY[it.id];
        h+=`<div class="row"><canvas width="48" height="28" data-fish="${f.id}"></canvas><div><b>${f.name}</b><small style="color:${RAR[f.rar].c}">${RAR[f.rar].n} · ${fmtKg(it.w)}</small></div>
          <button class="buy" data-act="sellone" data-i="${i}">${fmt(it.val)}</button></div>`;
      });
      h+=`</div>`;
    }
    p.innerHTML=h; UI.closeBtn('creel'); UI.paintIcons(p);
  },
  rShop(){
    const p=$('#p-shop');
    let h=`<header><h2>SHOP</h2><span>${fmt(G.money)}</span></header>
      <p class="hint">A better rod casts farther and hooks longer. Line holds the fight. Bait shortens the wait and improves luck. The boat opens new waters.</p>`;
    Object.keys(UPG).forEach(k=>{
      const u=UPG[k], L=G.up[k], mx=L>=u.max, c=mx?0:u.cost(L);
      const extra=k==='rod'?' · '+(rodByLevel(L).name):k==='boat'?' · '+(UPG.boat.d(L).split('·')[0].trim()):'';
      h+=`<div class="row"><div><b>${u.n}${extra}</b> <span class="pips">${'▮'.repeat(L)}<s>${'▮'.repeat(u.max-L)}</s></span>
        <small>${u.d(L)}${mx?'':' → '+u.d(L+1)}</small></div>
        <button class="buy" data-act="buy" data-k="${k}" ${mx||G.money<c?'disabled':''}>${mx?'MAX':fmt(c)}</button></div>`;
    });
    p.innerHTML=h; UI.closeBtn('shop');
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
        <canvas width="48" height="28" data-fish="${f.id}" data-sil="${on?0:1}"></canvas>
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
      <p class="hint">Upgrade the boat in the shop to reach farther waters. Each one holds its own fish.</p>`;
    WATERS.forEach(w=>{
      const open=G.unlocked.includes(w.id), here=G.water===w.id, can=open || G.up.boat>=w.boat;
      h+=`<div class="wcard ${here?'here':''} ${open?'':'locked'}" ${can?`data-act="go" data-id="${w.id}"`:''}>
        <canvas class="wswatch" width="44" height="28" data-water="${w.id}"></canvas>
        <div><b>${w.n}</b><i>${w.tag}${here?' · YOU ARE HERE':open?'':' · '+(G.up.boat>=w.boat?fmt(w.cost)+' TO UNLOCK':'BOAT '+(w.boat))}</i>
        <i>${w.blurb}</i></div></div>`;
    });
    p.innerHTML=h; UI.closeBtn('map'); UI.paintWaters(p);
  },
  paintIcons(root){
    root.querySelectorAll('canvas[data-fish]').forEach(c=>{
      const f=FISH_BY[c.dataset.fish]; if(!f) return;
      const sil=c.dataset.sil==='1';
      const g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.clearRect(0,0,c.width,c.height);
      g.drawImage(fishSpr(f,sil),0,0);
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
    const tmax=tenMax(G.up.line);
    ten.style.width=(clamp(Play.ten/tmax,0,1)*100)+'%';
    wrap.classList.toggle('hot', Play.ten/tmax>0.7);
    $('#f-tip').textContent = inZ? 'HOLD THE ZONE' : 'THE FISH IS RUNNING';
  },
  showCatch(f,w,val,first,full){
    const el=$('#catch');
    el.hidden=false;
    el.innerHTML=`<div class="card">
      ${first?'<div class="new">NEW LOG ENTRY</div>':''}
      <canvas id="catch-cv" width="64" height="38"></canvas>
      <h2>${f.name}</h2>
      <div class="rar" style="color:${RAR[f.rar].c}">${RAR[f.rar].n}</div>
      <div class="meta">${fmtKg(w)} · worth <b>${fmt(val)}</b>${full?'<br>The creel is full, so this one must be sold.':''}</div>
      <div class="btns">
        <button class="buy" data-act="sell">SELL ${fmt(val)}</button>
        ${full?'':'<button class="buy tier" data-act="keep">KEEP</button>'}
      </div>
    </div>`;
    const cv=$('#catch-cv'), g=cv.getContext('2d'); g.imageSmoothingEnabled=false;
    g.drawImage(fishBig(f),0,0);
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
    const pow=$('#power');
    if(Play.phase==='charge'){ pow.classList.add('on'); $('#power-fill').style.height=(Play.power*100)+'%'; }
    else pow.classList.remove('on');
  }
};
