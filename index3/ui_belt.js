// ./assets/index3/ui_belt.js
(function(){
  window.PP = window.PP || {}; PP.cfg = PP.cfg || {}; PP.state = PP.state || {};

  // Toast
  window.toast = function(msg, ms){
    const t = document.getElementById('toast'); if (!t) return;
    t.textContent = msg; t.style.display='block';
    setTimeout(()=>{ t.style.display='none'; }, ms||1400);
  };

  // Storage
  PP.storage = PP.storage || (function(){
    const K_INV='pp_inventory_v1', K_FLAGS='pp_flags_v1';
    function get(k,d){ try{return JSON.parse(localStorage.getItem(k)) ?? d;}catch(_){return d;} }
    function set(k,v){ localStorage.setItem(k, JSON.stringify(v)); return v; }
    return {
      saveInventory: inv => set(K_INV, inv),
      loadInventory: () => get(K_INV, {slots:[], equipped:0}),
      getFlag: (k,d=false)=>{ const f=get(K_FLAGS,{}); return (k in f)?f[k]:d; },
      setFlag: (k,v)=>{ const f=get(K_FLAGS,{}); f[k]=v; set(K_FLAGS,f); }
    };
  })();

  // Item defs
  const ITEM_DEFS = [
    {id:'emf',     name:'EMF Reader', icon:'./assets/icons/emf.png'},
    {id:'spirit',  name:'Spirit Box', icon:'./assets/icons/spirit.png'},
    {id:'uv',      name:'UV Light',   icon:'./assets/icons/uv.png'},
    {id:'cam',     name:'Photo Cam',  icon:'./assets/icons/camera.png'},
    {id:'salt',    name:'Salt',       icon:'./assets/icons/salt.png'},
    {id:'lighter', name:'Lighter',    icon:'./assets/icons/lighter.png'},
    {id:'notebook',name:'Notebook',   icon:'./assets/icons/notebook.png'}
  ];
  window.INDEX3 = window.INDEX3 || {};
  INDEX3.ITEM_DEFS = ITEM_DEFS;

  // Storage modal
  (function(){
    const storageEl = document.getElementById('storage');
    const grid = document.getElementById('storeGrid');
    const confirmBtn = document.getElementById('storeConfirm');
    if (!storageEl || !grid || !confirmBtn) return;

    let selected = new Set(PP.storage.loadInventory().slots);
    function rebuildGrid(){
      grid.innerHTML='';
      INDEX3.ITEM_DEFS.forEach(it=>{
        const cell=document.createElement('div');
        cell.className='it'+(selected.has(it.id)?' sel':'');
        cell.style.cssText='padding:8px;border:1px solid #1a2a3c;border-radius:10px;background:#0e1622;cursor:pointer;text-align:center';
        cell.innerHTML = (it.icon?`<img src="${it.icon}" style="display:block;margin:0 auto 6px;max-width:48px;max-height:48px">`:'')
          + `<div style="font-size:12px">${it.name}</div>`;
        cell.onclick=()=>{
          if (selected.has(it.id)) { selected.delete(it.id); cell.classList.remove('sel'); }
          else { if (selected.size>=3) return; selected.add(it.id); cell.classList.add('sel'); }
        };
        grid.appendChild(cell);
      });
    }
    rebuildGrid();
    confirmBtn.onclick=()=>{
      const slots=[...selected];
      PP.storage.saveInventory({slots, equipped:0});
      INDEX3.buildBelt(slots);
      storageEl.style.display='none';
      toast("Loadout saved");
    };
    window.openStorage = function(){ rebuildGrid(); storageEl.style.display='flex'; };
  })();

  // Belt
  const itemBar = document.getElementById('itemBar');
  INDEX3.buildBelt = function(slots){
    if (!itemBar) return;
    itemBar.innerHTML='';
    (slots||[]).forEach((id,i)=>{
      const def = INDEX3.ITEM_DEFS.find(d=>d.id===id) || {name:id,icon:''};
      const el=document.createElement('div');
      el.className='slot'+(i===0?' active':'');
      el.innerHTML = def.icon?`<img src="${def.icon}" style="max-width:36px;max-height:36px;opacity:.9">`:`<span style="font-size:10px">${def.name}</span>`;
      el.onclick = ()=> INDEX3.setEquipped(i);
      itemBar.appendChild(el);
    });
  };
  INDEX3.setEquipped = function(i){
    const inv = PP.storage.loadInventory();
    inv.equipped = Math.max(0, Math.min(i, inv.slots.length-1));
    PP.storage.saveInventory(inv);
    if (itemBar){
      [...itemBar.children].forEach((el,idx)=> el.classList.toggle('active', idx===inv.equipped));
    }
  };
  function cycleSlot(dir){
    const inv = PP.storage.loadInventory();
    if (!inv.slots.length) return;
    inv.equipped = (inv.equipped + (dir>0?1:-1) + inv.slots.length) % inv.slots.length;
    PP.storage.saveInventory(inv);
    if (itemBar){
      [...itemBar.children].forEach((el,idx)=> el.classList.toggle('active', idx===inv.equipped));
    }
  }
  window.addEventListener('wheel',(e)=>{ if (e.deltaY>0) cycleSlot(+1); else cycleSlot(-1); }, {passive:true});

  // Expose a one-time init, called by boot after scene is ready
  INDEX3.initInventoryUI = function(){
    const inv = PP.storage.loadInventory();
    if (!inv.slots.length) { if (window.openStorage) openStorage(); }
    else { INDEX3.buildBelt(inv.slots); }
  };
})();
