// File: assets/dev/ui/van_ui.js
// Van Inventory overlay + proximity + HUD button injection
// Syncs with inventory_system.js via pp:* events
(function(){
  "use strict";
  if (window.__PP_VAN_UI_V4__) return;
  window.__PP_VAN_UI_V4__ = true;

  const PP = window.PP || (window.PP = {});
  const ICON = id => `./assets/icons/${id}.png`;

  const UI = {
    root: null,
    panel: null,
    grid: null,
    slotsBar: null,
    closeBtn: null,
    hint: null,
    selectedSlot: 1,
    van: {},
    loadout: { items:[null,null,null] },
    open: false,
    btn: null,
    inVan: false
  };

  // --- DOM helpers ---
  const el = (tag, cls, parent) => {
    const e = document.createElement(tag);
    if(cls) e.className = cls;
    if(parent) parent.appendChild(e);
    return e;
  };
  const $ = s => document.querySelector(s);

  // --- Styles ---
  const ensureStyles = () => {
    if(document.getElementById('van-ui-css')) return;
    const style = el('style'); style.id='van-ui-css';
    style.textContent = `
#van-ui{position:fixed; inset:0; display:none; z-index:11000; background:rgba(0,0,0,0.85); color:#bfe; font-family:monospace;}
#van-ui .panel{position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:min(940px,92vw); max-height:80vh; overflow:auto; border:1px solid #066; background:#071118; border-radius:10px; padding:14px; box-shadow:0 0 40px rgba(0,255,255,0.15);}
#van-ui h2{margin:6px 0 12px; color:#9ef;}
#van-ui .grid{display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:10px;}
#van-ui .cell{border:1px solid #0aa; border-radius:8px; background:rgba(0,20,20,0.5); padding:8px; display:flex; gap:8px; align-items:center; cursor:pointer;}
#van-ui .cell.disabled{opacity:0.35; cursor:not-allowed;}
#van-ui .cell img{width:48px; height:48px; object-fit:contain; image-rendering:crisp-edges;}
#van-ui .cell .name{flex:1;}
#van-ui .cell .qty{color:#8df; font-size:12px;}
#van-ui .slots{display:flex; gap:10px; margin:12px 0 8px;}
#van-ui .slotPick{flex:1; border:1px solid #066; background:#0a141a; color:#bfe; padding:8px; border-radius:8px; cursor:pointer; text-align:center;}
#van-ui .slotPick.active{outline:2px solid #0ff; box-shadow:0 0 10px rgba(0,255,255,0.35) inset;}
#van-ui .bar{display:flex; justify-content:space-between; align-items:center; gap:12px; margin:8px 0 2px;}
#van-ui .hint{color:#9bd; font-size:12px; opacity:0.9;}
#van-btn, #van-fab{border:1px solid #066; background:#0a141a; color:#9ef; padding:6px 10px; border-radius:10px; cursor:pointer;}
#van-btn.hidden, #van-fab.hidden{display:none !important;}
#van-fab{position:fixed; right:14px; bottom:78px; z-index:9000;}
`;
    document.head.appendChild(style);
  };

  // --- UI Mount ---
  const mount = () => {
    ensureStyles();
    if(!UI.root){
      UI.root = el('div','van-ui',document.body);
      UI.panel = el('div','panel',UI.root);

      const bar = el('div','bar',UI.panel);
      el('div','',bar).textContent = 'Van Inventory';
      UI.hint = el('div','hint',bar);
      UI.hint.textContent = 'Pick a slot (1–3), then click an item to equip. (V to toggle)';
      UI.closeBtn = el('button','close',bar);
      UI.closeBtn.textContent='Close';
      UI.closeBtn.onclick = close;

      UI.slotsBar = el('div','slots',UI.panel);
      for(let i=1;i<=3;i++){
        const b = el('button','slotPick',UI.slotsBar);
        b.textContent=`Slot ${i}`;
        b.dataset.slot=i;
        b.onclick=()=> selectSlot(i);
        if(i===UI.selectedSlot) b.classList.add('active');
      }

      UI.grid = el('div','grid',UI.panel);
    }
    injectButton();
    render();
  };

  // --- Render ---
  const render = () => {
    // Slots
    UI.slotsBar.querySelectorAll('.slotPick').forEach(b=>{
      b.classList.toggle('active', parseInt(b.dataset.slot,10)===UI.selectedSlot);
    });

    // Grid
    UI.grid.innerHTML='';
    Object.keys(UI.van).sort().forEach(id=>{
      const qty = UI.van[id]|0;
      const cell = el('div','cell',UI.grid);
      if(qty<=0) cell.classList.add('disabled');
      const img = el('img','',cell); img.src = ICON(id); img.alt=id;
      el('div','name',cell).textContent = id.replace(/_/g,' ');
      el('div','qty',cell).textContent = `x${qty}`;
      if(qty>0) cell.onclick=()=> window.dispatchEvent(new CustomEvent('pp:van:exchange-slot',{detail:{slot:UI.selectedSlot,item:id}}));
    });

    UI.root.style.display = UI.open ? 'block' : 'none';
    if(UI.btn) UI.btn.classList.toggle('hidden', !UI.inVan);
  };

  const selectSlot = slot => { UI.selectedSlot = Math.max(1,Math.min(3,slot|0)); render(); };
  const open = () => { UI.open=true; mount(); window.dispatchEvent(new CustomEvent('pp:van:request-inventory')); render(); };
  const close = () => { UI.open=false; render(); };
  const toggle = () => UI.open?close():open();

  window.VAN_UI = { open, close, toggle, isOpen:()=>UI.open };

  // --- Inventory events ---
  window.addEventListener('pp:van:inventory-updated', e=>{ UI.van=e.detail?.inventory||{}; if(UI.open) render(); });
  window.addEventListener('pp:van:loadout-changed', e=>{ UI.loadout=e.detail?.loadout||{items:[null,null,null]}; if(UI.open) render(); });

  // --- HUD button injection ---
  const injectButton = () => {
    if(UI.btn && UI.btn.isConnected) return;
    const bar = $('#action-bar');
    const b = el('button', '', bar||document.body);
    b.id = bar?'van-btn':'van-fab';
    b.textContent='Van';
    b.onclick=toggle;
    b.classList.add('hidden');
    UI.btn=b;
  };

  // --- Keybind ---
  window.addEventListener('keydown', e=>{ if(e.code==='KeyV'){ e.preventDefault(); toggle(); } }, true);

  // --- Proximity detection ---
  const getScene = ()=> window.SCENE || (window.ENGINE?.scenes?.[0]) || null;
  const pointInPolygon2D = (x,z,poly)=>{ let inside=false; for(let i=0,j=poly.length-1;i<poly.length;j=i++){ const xi=poly[i].x, zi=poly[i].z, xj=poly[j].x, zj=poly[j].z; if(((zi>z)!==(zj>z))&&(x<(xj-xi)*(z-zi)/((zj-zi)||1e-9)+xi)) inside=!inside;} return inside;};
  const vanAnchor = ()=>{
    const md=window.MAP_DEF||{};
    if(Array.isArray(md.vanZone)&&md.vanZone.length>=3) return {type:'poly', poly:md.vanZone.map(p=>({x:+p.x||0,z:+p.z||0}))};
    const s=getScene();
    const node = s?.getTransformNodeByName?.('Van_Spawn') || s?.getNodeByName?.('Van_Spawn');
    if(node && node.getAbsolutePosition){ const p=node.getAbsolutePosition(); return {type:'point',x:p.x,z:p.z,r:6}; }
    if(md.spawn) return {type:'point',x:+(md.spawn.x||0),z:+(md.spawn.z||0),r:6};
    return {type:'point',x:0,z:0,r:6};
  };
  const isInVan = pos => { const a=vanAnchor(); if(a.type==='poly') return pointInPolygon2D(pos.x,pos.z,a.poly); const dx=pos.x-a.x, dz=pos.z-a.z; return (dx*dx+dz*dz)<=(a.r*a.r); };
  const proximityTick = ()=>{
    const s=getScene(), cam=s?.activeCamera;
    if(cam?.position){
      const near=isInVan(cam.position);
      if(near!==UI.inVan){
        UI.inVan=near;
        if(UI.btn) UI.btn.classList.toggle('hidden', !UI.inVan);
        if(UI.inVan){
          try{ const t=$('#toast'); if(t){ t.textContent='Press V or click Van to manage loadout'; t.style.display='block'; setTimeout(()=>t.style.display='none',1600); } }catch{}
        }
      }
    }
    setTimeout(proximityTick,300);
  };

  // --- Bootstrap ---
  const bootstrap = ()=>{
    mount();
    proximityTick();
  };
  if(document.readyState!=='loading') setTimeout(bootstrap,0);
  else document.addEventListener('DOMContentLoaded', bootstrap);
  window.addEventListener('pp:start', bootstrap, {once:true});

})();
