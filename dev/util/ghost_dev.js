// ./assets/index3/ghost_dev.js — v1.4
// Dev panel for ghost model, teleport, scale, dev-visible (forces runtime to keep it shown),
// and barrier drawing with save/load/export. Works with ghost_movement.js v1.6+.
(function(){
  "use strict";

  // ---------- Config ----------
  const BASE = (window.GHOST_BASE_URL || './assets/models/ghosts/').replace(/\/?$/, '/');
  const FILES = (window.GHOST_FILE_LIST && window.GHOST_FILE_LIST.length)
    ? window.GHOST_FILE_LIST.slice()
    : ['ghost1.glb','ghost2.glb','ghost3.glb','ghost4.glb','ghost5.glb'];

  const STORE_KEY = 'GHOST_DEV_SAVE_V1';

  // ---------- Shortcuts ----------
  const SCENE  = ()=> window.scene || BABYLON.Engine?.LastCreatedScene;
  const CAMERA = ()=> window.camera || SCENE()?.activeCamera;
  const v3     = (x,y,z)=> new BABYLON.Vector3(x,y,z);
  const toast  = (m,ms=1200)=> (window.toast? window.toast(m,ms) : console.log('[ghost-dev]', m));

  // ---------- State ----------
  const ST = {
    ui:null,
    selector:null,
    scaleInput:null,
    visBtn:null,
    teleportBtn:null,
    barrierBtn:null,
    exportBtn:null, importBtn:null, saveBtn:null, loadBtn:null, clearBtn:null, undoBtn:null,

    open:false,
    devVisible:false,

    // barrier
    barrierMode:false,
    barrierPts:[],   // [{x,y,z}, ...] active chain (for snapping)
    segments:[],     // [{a:{x,y,z}, b:{x,y,z}}]
    lines:[],        // helper meshes
    pointerObs:null,

    // loaded model info
    currentFile:null,
    lastScale: 1
  };

  // ---------- Dev-visible (define BEFORE wiring to ensure hoisting) ----------
  function setDevVisible(on){
    ST.devVisible = !!on;
    // Global override that ghost_movement.js (v1.5+) respects
    window.GHOST_DEV_FORCE_VISIBLE = ST.devVisible;

    // Immediate feedback on dev-selected root
    try{
      const r = window.PREFERRED_GHOST_ROOT;
      if (r){
        const stack=[r];
        while (stack.length){
          const n=stack.pop();
          try{
            if (n.material && typeof n.material.alpha==='number') n.material.alpha = ST.devVisible ? 1 : 0;
            if ('visibility' in n) n.visibility = ST.devVisible ? 1 : 0;
            if ('isVisible' in n)  n.isVisible  = !!ST.devVisible;
          }catch{}
          n.getChildren?.().forEach(ch=> stack.push(ch));
        }
      }
    }catch{}
    if (ST.visBtn) ST.visBtn.textContent = ST.devVisible ? 'Visible ✓' : 'Visible';
  }
  function toggleDevVisible(){ setDevVisible(!ST.devVisible); }

  // ---------- Scale (hoisted) ----------
  function onScaleInput(){
    if (!ST.scaleInput) return;
    const v = parseFloat(ST.scaleInput.value)||1;
    ST.lastScale = v;
    updateScaleLabel(v);
    try{ window.ghostCtrl?.setGhostScale?.(v); }catch{}
    const r = window.PREFERRED_GHOST_ROOT; if (r){ try{ r.scaling.set(v,v,v); }catch{} }
    window.PREFERRED_GHOST_SCALE = v;
  }
  function updateScaleLabel(v){
    if (!ST.ui) return;
    const t = ST.ui.querySelector('#gd-scalev'); if (t) t.textContent = (Math.round(v*100)/100).toFixed(2);
  }

  // ---------- Teleport fallback (if runtime not ready) ----------
  function teleportFallback(){
    const s=SCENE(), c=CAMERA(), r=window.PREFERRED_GHOST_ROOT;
    if (!s || !c || !r) return;
    const ray=c.getForwardRay(60);
    let p=c.position.add(ray.direction.scale(2.8));
    const down=new BABYLON.Ray(p.add(v3(0,6,0)), v3(0,-1,0), 60);
    const hit=s.pickWithRay(down, m=> m && m.isPickable!==false);
    if (hit?.hit) p = hit.pickedPoint;
    r.position.copyFrom(p);
  }

  // ---------- Loader (hoisted) ----------
  async function loadGhostByFile(fileName){
    const s = SCENE();
    if (!s){ toast('Scene not ready'); return; }
    const file = String(fileName||FILES[0]);

    // HEAD check for quick 404 feedback
    try{
      const ok = await fetch(BASE+file, { method:'HEAD', cache:'no-store' }).then(r=>r.ok).catch(()=>false);
      if (!ok){ toast('❌ Not found: '+file, 2000); console.warn('[ghost-dev] 404', BASE+file); return; }
    }catch{}

    // Dispose previous dev root
    try{ if (window.PREFERRED_GHOST_ROOT && !window.PREFERRED_GHOST_ROOT.isDisposed?.()) window.PREFERRED_GHOST_ROOT.dispose(); }catch{}

    console.log('[ghost-dev] importing', BASE, file);
    let result;
    try{
      result = await BABYLON.SceneLoader.ImportMeshAsync(null, BASE, file, s);
    }catch(err){
      toast('❌ Import failed'); console.error('[ghost-dev] import error', err); return;
    }

    const root = new BABYLON.TransformNode('GhostRoot_dev_'+Date.now().toString(36), s);
    const imported = result.meshes.filter(m=> m && m !== s.meshes[0]);
    imported.forEach(m=>{
      try{ m.setEnabled(true); m.isVisible = true; }catch{}
      try{ m.isPickable = true; m.alwaysSelectAsActiveMesh = true; }catch{}
      if (!m.parent) m.parent = root;
    });

    // Auto-scale to ~1.8m tall
    let min=new BABYLON.Vector3(+Infinity,+Infinity,+Infinity);
    let max=new BABYLON.Vector3(-Infinity,-Infinity,-Infinity);
    imported.forEach(m=>{
      try{ const bb=m.getBoundingInfo?.().boundingBox; if (bb){ min=BABYLON.Vector3.Minimize(min,bb.minimumWorld); max=BABYLON.Vector3.Maximize(max,bb.maximumWorld); } }catch{}
    });
    const height=Math.max(0.001, max.y-min.y);
    const targetH=1.8;
    const scale=targetH/height;
    root.scaling.set(scale,scale,scale);
    ST.lastScale = scale;
    if (ST.scaleInput){ ST.scaleInput.value = String(scale); updateScaleLabel(scale); }

    // Place in front of camera
    const c=CAMERA();
    if (c){
      const f=c.getForwardRay(8);
      let p=c.position.add(f.direction.scale(2.5));
      const down=new BABYLON.Ray(p.add(v3(0,6,0)), v3(0,-1,0), 60);
      const hit=s.pickWithRay(down, m=> m && m.isPickable!==false);
      if (hit?.hit) p = hit.pickedPoint;
      root.position.copyFrom(p);
      try{ root.rotationQuaternion=null; root.rotation.y=Math.atan2(f.direction.x, f.direction.z); }catch{}
    }

    // Hand off to runtime
    window.PREFERRED_GHOST_ROOT = root;
    window.PREFERRED_GHOST_MODEL_NAME = file;
    window.PREFERRED_GHOST_SCALE = scale;
    ST.currentFile = file;

    try{
      if (window.ghostCtrl?.randomizeGhost) ghostCtrl.randomizeGhost();
      window.teleportGhostToLook?.(2.5);
    }catch{}

    // If the toggle is on, force visible now
    if (ST.devVisible) setDevVisible(true);

    toast('✅ Loaded '+file);
  }

  // ---------- Barrier tools (hoisted) ----------
  function toggleBarrierMode(){
    ST.barrierMode = !ST.barrierMode;
    if (ST.barrierBtn) ST.barrierBtn.textContent = 'Barrier: ' + (ST.barrierMode ? 'On' : 'Off');
    ensurePointerHook();
    toast(ST.barrierMode ? 'Barrier mode ON' : 'Barrier mode OFF');
  }
  function ensurePointerHook(){
    const s = SCENE(); if (!s) return;
    if (!ST.pointerObs){
      ST.pointerObs = s.onPointerObservable.add((info)=>{
        if (!ST.barrierMode) return;
        if (info.type !== BABYLON.PointerEventTypes.POINTERDOWN) return;
        const e = info.event;
        if (e.button !== 0) return; // left click only

        const pick = s.pick(s.pointerX, s.pointerY, m=> m && m.isPickable !== false);
        if (!pick?.hit || !pick.pickedPoint) return;
        const p = pick.pickedPoint.clone();

        const last = ST.barrierPts.length ? ST.barrierPts[ST.barrierPts.length-1] : null;
        if (!last){
          ST.barrierPts.push(p);
          drawPointMarker(p);
        } else {
          addSegment(last, p);
          ST.barrierPts.push(p);
        }
      });
    }
  }
  function removePointerHook(){
    const s = SCENE(); if (!s || !ST.pointerObs) return;
    s.onPointerObservable.remove(ST.pointerObs);
    ST.pointerObs = null;
  }
  function addSegment(a, b){
    const s = SCENE(); if (!s) return;
    const seg = { a:{x:a.x,y:a.y,z:a.z}, b:{x:b.x,y:b.y,z:b.z} };
    ST.segments.push(seg);
    const line = BABYLON.MeshBuilder.CreateLines('GhostBarrierLine', { points:[ v3(a.x,a.y,a.z), v3(b.x,b.y,b.z) ] }, s);
    line.color = new BABYLON.Color3(0.1, 1.0, 0.8);
    line.alwaysSelectAsActiveMesh = true;
    line.isPickable = false;
    ST.lines.push(line);
  }
  function drawPointMarker(p){
    const s=SCENE(); if (!s) return;
    const m = BABYLON.MeshBuilder.CreateSphere('GBpt',{diameter:0.06, segments:8}, s);
    m.position.copyFrom(p);
    const mat = new BABYLON.StandardMaterial('GBptMat', s);
    mat.emissiveColor = new BABYLON.Color3(0.1, 1.0, 0.8);
    m.material = mat;
    m.isPickable = false;
    ST.lines.push(m);
  }
  function undoLastSegment(){
    if (!ST.segments.length) return;
    ST.segments.pop();
    const m1 = ST.lines.pop(); try{ m1.dispose(); }catch{}
    const m2 = ST.lines.pop(); try{ m2.dispose(); }catch{}
    ST.barrierPts.pop();
  }
  function clearAllSegments(){
    ST.segments.length = 0;
    ST.barrierPts.length = 0;
    while (ST.lines.length){ try{ ST.lines.pop().dispose(); }catch{} }
  }
  function segSegIntersect(a, b, c, d){
    const ax=a.x, az=a.z, bx=b.x, bz=b.z, cx=c.x, cz=c.z, dx=d.x, dz=d.z;
    const abx = bx-ax, abz = bz-az, cdx = dx-cx, cdz = dz-cz;
    const denom = abx*cdz - abz*cdx;
    if (Math.abs(denom) < 1e-6) return false;
    const acx = cx-ax, acz = cz-az;
    const t = (acx*cdz - acz*cdx) / denom;
    const u = (acx*abz - acz*abx) / denom;
    return t>=0 && t<=1 && u>=0 && u<=1;
  }
  // Public: used by ghost_movement.js
  window.ghostDev_isBlockedRay = function(a, b){
    if (!ST.segments.length) return false;
    try{
      for (let i=0;i<ST.segments.length;i++){
        const s = ST.segments[i];
        if (segSegIntersect(a, b, s.a, s.b)) return true;
      }
    }catch{}
    return false;
  };

  // ---------- Save / Load (hoisted) ----------
  function captureState(){
    return {
      file: ST.currentFile || ST.selector?.value || null,
      scale: ST.lastScale || 1,
      segments: ST.segments.map(s=>({ a:{x:s.a.x,y:s.a.y,z:s.a.z}, b:{x:s.b.x,y:s.b.y,z:s.b.z} }))
    };
  }
  function applyState(data){
    if (!data) return;
    clearAllSegments();
    // restore barriers
    (data.segments||[]).forEach(s=>{
      addSegment(s.a, s.b);
      ST.barrierPts.push(v3(s.b.x, s.b.y, s.b.z));
    });
    // restore ghost
    if (data.file){
      if (ST.selector) ST.selector.value = data.file;
      loadGhostByFile(data.file).then(()=>{
        const sc = data.scale || 1;
        if (ST.scaleInput){ ST.scaleInput.value = String(sc); onScaleInput(); }
      });
    } else if (typeof data.scale === 'number'){
      if (ST.scaleInput){ ST.scaleInput.value = String(data.scale); onScaleInput(); }
    }
  }
  function saveLocal(){
    const obj = captureState();
    try{ localStorage.setItem(STORE_KEY, JSON.stringify(obj)); toast('Saved locally'); }catch(e){ console.warn(e); toast('Save failed'); }
  }
  function loadLocal(){
    try{
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) { toast('No local save'); return; }
      const obj = JSON.parse(raw);
      applyState(obj);
      toast('Loaded from local');
    }catch(e){ console.warn(e); toast('Load failed'); }
  }
  function exportJSON(){
    const data = JSON.stringify(captureState(), null, 2);
    const blob = new Blob([data], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ghost_layout.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=> URL.revokeObjectURL(url), 0);
  }
  function importJSON(){
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'application/json';
    inp.onchange = ()=>{
      const f = inp.files?.[0]; if (!f) return;
      const r = new FileReader();
      r.onload = ()=> {
        try{ applyState(JSON.parse(String(r.result))); toast('Imported'); }
        catch(e){ console.warn(e); toast('Import failed'); }
      };
      r.readAsText(f);
    };
    inp.click();
  }

  // ---------- Panel UI (build after functions so handlers are hoisted) ----------
  function buildUI(){
    if (ST.ui) return ST.ui;

    const wrap = document.createElement('div');
    wrap.id = 'ghostdev-panel';
    Object.assign(wrap.style, {
      position:'fixed', right:'14px', bottom:'14px', width:'360px',
      maxHeight:'72vh', overflow:'auto', background:'#111',
      color:'#ddd', border:'1px solid #333', borderRadius:'10px',
      padding:'10px', font:'12px/1.4 monospace', zIndex:9999, display:'none',
      boxShadow:'0 6px 24px rgba(0,0,0,0.6)'
    });
    wrap.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <div style="font-weight:bold;color:#9ff">Ghost Dev</div>
        <button id="gd-close" style="border:1px solid #333;background:#181818;color:#ddd;padding:4px 8px;border-radius:6px;cursor:pointer">Close</button>
      </div>

      <div style="display:flex;gap:6px;align-items:center;margin:8px 0">
        <select id="gd-files" style="flex:1; padding:4px; background:#0b0b0b; color:#9ff; border:1px solid #244; border-radius:6px"></select>
        <button id="gd-load" style="border:1px solid #244;background:#0b0b0b;color:#9ff;padding:6px 10px;border-radius:8px;cursor:pointer">Load</button>
      </div>

      <div style="display:flex;gap:6px;align-items:center;margin:8px 0">
        <button id="gd-tele"  title="Alt+G" style="flex:1;border:1px solid #244;background:#0b0b0b;color:#9ff;padding:6px 10px;border-radius:8px;cursor:pointer">Teleport to Look</button>
        <button id="gd-vis"   title="Alt+V" style="flex:0 0 84px;border:1px solid #244;background:#0b0b0b;color:#9ff;padding:6px 10px;border-radius:8px;cursor:pointer">Visible</button>
      </div>

      <div style="margin:8px 0">
        <div style="color:#9ff;margin-bottom:4px">Scale: <span id="gd-scalev">1.00</span>×</div>
        <input id="gd-scale" type="range" min="0.1" max="5" step="0.01" value="1" style="width:100%">
      </div>

      <div style="margin:10px 0;border-top:1px solid #222;padding-top:8px">
        <div style="color:#9ff;margin-bottom:6px">Barriers (click to add points, segments snap end-to-end)</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button id="gd-bar"  title="Alt+B" style="border:1px solid #244;background:#0b0b0b;color:#9f9;padding:6px 10px;border-radius:8px;cursor:pointer">Barrier: Off</button>
          <button id="gd-undo" title="Z (in mode)" style="border:1px solid #244;background:#0b0b0b;color:#ddd;padding:6px 10px;border-radius:8px;cursor:pointer">Undo Seg</button>
          <button id="gd-clear" style="border:1px solid #244;background:#0b0b0b;color:#f88;padding:6px 10px;border-radius:8px;cursor:pointer">Clear</button>
        </div>
      </div>

      <div style="margin:10px 0;border-top:1px solid #222;padding-top:8px">
        <div style="color:#9ff;margin-bottom:6px">Save / Load</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button id="gd-save"  style="border:1px solid #244;background:#0b0b0b;color:#9ff;padding:6px 10px;border-radius:8px;cursor:pointer">Save (local)</button>
          <button id="gd-load2" style="border:1px solid #244;background:#0b0b0b;color:#9ff;padding:6px 10px;border-radius:8px;cursor:pointer">Load (local)</button>
          <button id="gd-export" style="border:1px solid #244;background:#0b0b0b;color:#9ff;padding:6px 10px;border-radius:8px;cursor:pointer">Export JSON</button>
          <button id="gd-import" style="border:1px solid #244;background:#0b0b0b;color:#9ff;padding:6px 10px;border-radius:8px;cursor:pointer">Import JSON</button>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);

    // Fill files
    const sel = wrap.querySelector('#gd-files');
    FILES.forEach(f=>{ const o=document.createElement('option'); o.value=f; o.textContent=f; sel.appendChild(o); });

    // Wire refs
    ST.ui = wrap;
    ST.selector   = sel;
    ST.scaleInput = wrap.querySelector('#gd-scale');
    ST.visBtn     = wrap.querySelector('#gd-vis');
    ST.teleportBtn= wrap.querySelector('#gd-tele');
    ST.barrierBtn = wrap.querySelector('#gd-bar');
    ST.undoBtn    = wrap.querySelector('#gd-undo');
    ST.clearBtn   = wrap.querySelector('#gd-clear');
    ST.saveBtn    = wrap.querySelector('#gd-save');
    ST.loadBtn    = wrap.querySelector('#gd-load2');
    ST.exportBtn  = wrap.querySelector('#gd-export');
    ST.importBtn  = wrap.querySelector('#gd-import');

    // Buttons (handlers are hoisted functions defined above)
    wrap.querySelector('#gd-close').onclick = closePanel;
    wrap.querySelector('#gd-load').onclick  = ()=> loadGhostByFile(ST.selector.value);
    ST.teleportBtn.onclick = ()=> (window.teleportGhostToLook ? teleportGhostToLook(2.8) : teleportFallback());
    ST.visBtn.onclick      = toggleDevVisible;
    ST.scaleInput.oninput  = onScaleInput;
    ST.barrierBtn.onclick  = toggleBarrierMode;
    ST.undoBtn.onclick     = undoLastSegment;
    ST.clearBtn.onclick    = clearAllSegments;
    ST.saveBtn.onclick     = saveLocal;
    ST.loadBtn.onclick     = loadLocal;
    ST.exportBtn.onclick   = exportJSON;
    ST.importBtn.onclick   = importJSON;

    // Hotkeys
    window.addEventListener('keydown', (e)=>{
      if (e.altKey && (e.code==='KeyH' || e.key==='h' || e.key==='H')) { togglePanel(); }
      else if (e.altKey && (e.code==='KeyG' || e.key==='g' || e.key==='G')) { window.teleportGhostToLook?.(2.8); }
      else if (e.altKey && (e.code==='KeyV' || e.key==='v' || e.key==='V')) { toggleDevVisible(); }
      else if (e.altKey && (e.code==='KeyB' || e.key==='b' || e.key==='B')) { toggleBarrierMode(); }
      else if (ST.barrierMode && (e.key==='z' || e.key==='Z')) { undoLastSegment(); }
    });

    updateScaleLabel(1);
    return wrap;
  }

  // ---------- Panel open/close ----------
  function openPanel(){
    buildUI();
    ST.ui.style.display = 'block';
    ST.open = true;
    ensurePointerHook();
    // Optional: auto-show when panel opens (comment out if you prefer manual toggle only)
    // setDevVisible(true);
  }
  function closePanel(){
    if (!ST.ui) return;
    ST.ui.style.display = 'none';
    ST.open = false;
    removePointerHook();
    // Optional: auto-hide when panel closes
    // setDevVisible(false);
  }
  function togglePanel(){ (ST.open?closePanel:openPanel)(); }

  // ---------- Public API ----------
  window.GHOST_DEV = {
    open: openPanel,
    close: closePanel,
    toggle: togglePanel,
    load: loadGhostByFile,
    getState: ()=> ({ ...captureState(), devVisible: ST.devVisible }),
    setVisible: setDevVisible,
    barrierAdd: addSegment,
    barrierClear: clearAllSegments
  };

  // Create UI immediately (kept hidden until Alt+H or manual open)
  buildUI();

})();
