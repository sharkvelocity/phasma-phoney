/* =======================================================================
   PhasmaPhoney – Builder Tool (Sims-like)
   File: ./assets/index3/builder_tool.js
   Version: 1.9 (history-integrated)
   Requires: BABYLON, scene (top-down orthographic recommended)
   Exposes: window.Builder with public API (see bottom)
   -----------------------------------------------------------------------
   Highlights
   - Modes: select / floor / wall / room / place / stairs
   - Grid snap & step, “Y floor” plane
   - Floors (CreateGround), Walls (Box along a->b) w/ isGhostBlocker
   - Copy/Paste Room (floor + size, material), apply material to selection
   - Persistent selection highlight
   - Real Undo/Redo/Reset snapshots (Ctrl+Z / Ctrl+Shift+Z or Ctrl+Y)
   - Right-side panel glue (optional IDs; wired if present):
       #rp-undo #rp-redo #rp-reset
       #rp-copy-room #rp-paste-room
       #rp-apply  (apply material)
       #rp-pick   (material select dropdown or palette)
       #rp-room   (toggle Room mode)
       #rp-wall   (toggle Wall mode)
       #rp-finish (finish drawing)
       #rp-cancel (cancel drawing)
       #rp-grid   (checkbox), #rp-step (number), #rp-y (number)
   - Safe fallbacks if glue elements aren’t present
   ======================================================================= */
(function(){
  "use strict";

  // -------------- Shortcuts --------------
  const S = ()=> window.scene;
  const E = ()=> window.engine;
  const v3 = (x,y,z)=> new BABYLON.Vector3(x,y,z);
  const C3 = (r,g,b)=> new BABYLON.Color3(r,g,b);
  const clamp = (v,a,b)=> Math.max(a, Math.min(b, v));
  const now = ()=> performance.now()/1000;

  // -------------- State --------------
  const ST = {
    enabled: false,
    mode: 'select',              // 'select'|'floor'|'wall'|'room'|'place'|'stairs'
    grid: { snap: true, step: 0.5 },
    y: 0,                        // build plane height
    sel: null,                   // selected mesh
    selHL: null,                 // selection highlight (Edges renderer)
    drawing: { active:false, a:null, b:null, ghost:null, kind:null },
    copyRoomData: null,          // { size:[w,h], matKey?:string }
    defaultMats: { floor:'#b99557', wall:'#d6dce6' }, // material keys (fallback colors)
    _lastPointerW: null,         // last world point (x,z) for drag updates
  };

  // -------------- Materials (pluggable) --------------
  // You can replace these with a real texture library later.
  const Materials = {
    _cache: new Map(),
    _mkStd(name, colorHex){
      const mat = new BABYLON.StandardMaterial(name, S());
      const hex = (colorHex||'#cccccc').replace('#','');
      const r=parseInt(hex.slice(0,2),16)/255, g=parseInt(hex.slice(2,4),16)/255, b=parseInt(hex.slice(4,6),16)/255;
      mat.diffuseColor = new C3(r,g,b);
      mat.specularColor = new C3(0.08,0.08,0.08);
      return mat;
    },
    get(key, forName){
      // If a global Materials library is present, prefer that.
      try{
        if (window.Materials && typeof window.Materials.makeMaterialForKey === 'function'){
          return window.Materials.makeMaterialForKey(key, S(), forName||('Mat_'+key));
        }
      }catch{}
      // fallback: flat color
      const k = key || '#cccccc';
      const id = (forName||('Mat_'+k))+'__cache';
      if (!this._cache.has(id)) this._cache.set(id, this._mkStd(id, k));
      return this._cache.get(id);
    }
  };

  // -------------- Helpers --------------
  function snapVal(v){
    if (!ST.grid.snap) return v;
    const s = ST.grid.step||0.5;
    return Math.round(v/s)*s;
  }
  function snapV3XZ(p){
    const out = p.clone();
    out.x = snapVal(out.x);
    out.z = snapVal(out.z);
    return out;
  }
  function pickGroundPoint(evt){
    const sc = S(); if (!sc) return null;
    const cam = sc.activeCamera;
    if (!cam) return null;

    // cast ray against an infinite plane at y = ST.y
    const ray = sc.createPickingRay(evt.offsetX, evt.offsetY, BABYLON.Matrix.Identity(), cam);
    const plane = BABYLON.Plane.FromPositionAndNormal(v3(0,ST.y,0), v3(0,1,0));
    const t = BABYLON.Vector3.Dot(plane.normal, plane.normal.scale(plane.d).negate().add(ray.origin)) /
              BABYLON.Vector3.Dot(plane.normal, ray.direction);
    const pt = ray.origin.add(ray.direction.scale(t));
    return ST.grid.snap ? snapV3XZ(pt) : pt;
  }

  function setMode(m){
    if (ST.mode === m) return;
    cancelDrawing();
    ST.mode = m;
  }

  function selectMesh(m){
    if (ST.selHL){
      try{ ST.selHL.dispose(); }catch{}
      ST.selHL = null;
    }
    ST.sel = m || null;
    if (m){
      try{ m.enableEdgesRendering(); m.edgesWidth = 3.0; m.edgesColor = new BABYLON.Color4(0,1,1,0.9); ST.selHL = m; }catch{}
    }
    updateRightPanelInfo();
  }

  function makeFloor(center, sizeX, sizeZ, matKey){
    const sc = S();
    const mesh = BABYLON.MeshBuilder.CreateGround('Floor_'+Date.now().toString(36), { width:Math.abs(sizeX), height:Math.abs(sizeZ) }, sc);
    mesh.position.copyFrom(center.clone());
    mesh.position.y = ST.y + 0.01;
    mesh.isPickable = true;
    mesh.checkCollisions = true;
    mesh.material = Materials.get(matKey || ST.defaultMats.floor, 'Mat_Floor_'+mesh.id);
    mesh.metadata = { builder:{ type:'floor', size:[Math.abs(sizeX), Math.abs(sizeZ)], floorIndex: Math.round(ST.y) } };
    return mesh;
  }

  function makeWall(a, b, h=3, t=0.18, matKey){
    const sc = S();
    const len = BABYLON.Vector3.Distance(a,b);
    if (len < 0.01) return null;
    const wall = BABYLON.MeshBuilder.CreateBox('Wall_'+Date.now().toString(36), { width:len, depth:t, height:h }, sc);
    const mid = a.add(b).scale(0.5);
    wall.position.copyFrom(mid);
    wall.position.y = ST.y + h/2;
    wall.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
    wall.checkCollisions = true; wall.isPickable = true;
    wall.material = Materials.get(matKey || ST.defaultMats.wall, 'Mat_Wall_'+wall.id);
    wall.metadata = { builder:{ type:'wall', floorIndex: Math.round(ST.y), a:{x:a.x,y:ST.y,z:a.z}, b:{x:b.x,y:ST.y,z:b.z}, h, t }, isGhostBlocker:true };
    return wall;
  }

  function makeRoomFromRect(a, b, wallT=0.18, h=3, floorMatKey, wallMatKey){
    // axis-aligned rectangle walls + one floor
    const minX = Math.min(a.x, b.x), maxX = Math.max(a.x, b.x);
    const minZ = Math.min(a.z, b.z), maxZ = Math.max(a.z, b.z);
    const W = maxX - minX, D = maxZ - minZ;
    const cx = (minX+maxX)/2, cz = (minZ+maxZ)/2;

    const floor = makeFloor(v3(cx, ST.y, cz), W, D, floorMatKey);
    const w1a = v3(minX, ST.y, minZ), w1b = v3(maxX, ST.y, minZ);
    const w2a = v3(maxX, ST.y, minZ), w2b = v3(maxX, ST.y, maxZ);
    const w3a = v3(maxX, ST.y, maxZ), w3b = v3(minX, ST.y, maxZ);
    const w4a = v3(minX, ST.y, maxZ), w4b = v3(minX, ST.y, minZ);

    const walls = [
      makeWall(w1a, w1b, h, wallT, wallMatKey),
      makeWall(w2a, w2b, h, wallT, wallMatKey),
      makeWall(w3a, w3b, h, wallT, wallMatKey),
      makeWall(w4a, w4b, h, wallT, wallMatKey),
    ];
    return { floor, walls:walls.filter(Boolean) };
  }

  function cancelDrawing(){
    ST.drawing.active = false;
    ST.drawing.a = ST.drawing.b = null;
    if (ST.drawing.ghost){ try{ ST.drawing.ghost.dispose(); }catch{} ST.drawing.ghost = null; }
    ST.drawing.kind = null;
  }

  function startGhostRect(a){
    const sc = S();
    const ghost = BABYLON.MeshBuilder.CreateGround('GhostRect', { width:0.001, height:0.001 }, sc);
    ghost.position.copyFrom(a.clone());
    ghost.position.y = ST.y + 0.02;
    const mat = new BABYLON.StandardMaterial('Mat_GhostRect', sc);
    mat.diffuseColor = new C3(1,1,1);
    mat.alpha = 0.25;
    ghost.material = mat;
    ghost.isPickable = false; ghost.checkCollisions = false;
    return ghost;
  }

  function updateGhostRect(a,b){
    const g = ST.drawing.ghost; if (!g) return;
    const minX = Math.min(a.x, b.x), maxX = Math.max(a.x, b.x);
    const minZ = Math.min(a.z, b.z), maxZ = Math.max(a.z, b.z);
    const W = Math.max(0.05, maxX - minX), D = Math.max(0.05, maxZ - minZ);
    g.dispose();
    const sc = S();
    const ghost = BABYLON.MeshBuilder.CreateGround('GhostRect', { width:W, height:D }, sc);
    ghost.position.set((minX+maxX)/2, ST.y + 0.02, (minZ+maxZ)/2);
    const mat = new BABYLON.StandardMaterial('Mat_GhostRect', sc);
    mat.diffuseColor = new C3(1,1,1); mat.alpha = 0.25;
    ghost.material = mat; ghost.isPickable = false;
    ST.drawing.ghost = ghost;
  }

  function beginEdit(){
    if (Builder.beginEdit) Builder.beginEdit(); // proxied to history patch
  }

  // -------------- Pointer Wiring --------------
  function onPointerDown(evt, pick){
    if (!ST.enabled) return;
    if (!pick) pick = pickGroundPoint(evt);
    if (!pick) return;

    if (ST.mode === 'select'){
      // hit-test meshes at pointer
      const hit = S().pick(evt.offsetX, evt.offsetY, (m)=> !!m && !!m.metadata && !!m.metadata.builder);
      if (hit && hit.hit && hit.pickedMesh){
        selectMesh(hit.pickedMesh);
      } else {
        selectMesh(null);
      }
      return;
    }

    if (ST.mode === 'floor' || ST.mode === 'room'){
      ST.drawing.active = true;
      ST.drawing.kind = ST.mode;
      ST.drawing.a = pick.clone();
      ST.drawing.b = pick.clone();
      ST.drawing.ghost = startGhostRect(pick);
      beginEdit();
      return;
    }

    if (ST.mode === 'wall'){
      // click A, then click B
      if (!ST.drawing.active){
        ST.drawing.active = true; ST.drawing.kind = 'wall';
        ST.drawing.a = pick.clone(); ST.drawing.b = pick.clone();
        beginEdit();
      } else {
        ST.drawing.b = pick.clone();
        makeWall(ST.drawing.a, ST.drawing.b, 3, 0.18, ST.defaultMats.wall);
        if (Builder.commit) Builder.commit('wall');
        cancelDrawing();
      }
      return;
    }

    // 'place' and 'stairs' would start placement here (omitted for brevity)
  }

  function onPointerMove(evt){
    if (!ST.enabled) return;
    if (!ST.drawing.active) return;
    const pick = pickGroundPoint(evt); if (!pick) return;
    ST._lastPointerW = pick.clone();

    if (ST.drawing.kind === 'floor' || ST.drawing.kind === 'room'){
      ST.drawing.b = pick.clone();
      updateGhostRect(ST.drawing.a, ST.drawing.b);
      return;
    }
    if (ST.drawing.kind === 'wall'){
      ST.drawing.b = pick.clone();
      // preview line? (for simplicity we skip dynamic line; the ghost rect is for room/floor only)
      return;
    }
  }

  function onPointerUp(evt){
    if (!ST.enabled) return;
    if (!ST.drawing.active) return;
    const pick = ST._lastPointerW || pickGroundPoint(evt);
    if (!pick) return;

    if (ST.drawing.kind === 'floor'){
      const a = ST.drawing.a, b = pick.clone();
      const minX = Math.min(a.x, b.x), maxX = Math.max(a.x, b.x);
      const minZ = Math.min(a.z, b.z), maxZ = Math.max(a.z, b.z);
      const W = Math.max(0.05, maxX - minX), D = Math.max(0.05, maxZ - minZ);
      const cx = (minX+maxX)/2, cz = (minZ+maxZ)/2;
      makeFloor(v3(cx, ST.y, cz), W, D, ST.defaultMats.floor);
      if (Builder.commit) Builder.commit('floor');
      cancelDrawing();
      return;
    }

    if (ST.drawing.kind === 'room'){
      const a = ST.drawing.a, b = pick.clone();
      makeRoomFromRect(a,b,0.18,3, ST.defaultMats.floor, ST.defaultMats.wall);
      if (Builder.commit) Builder.commit('room');
      cancelDrawing();
      return;
    }
  }

  // -------------- Export / Import --------------
  function exportJSON(){
    const sc = S();
    const out = { floors:[], walls:[], props:[], spawn:{} };

    sc.meshes.forEach(m=>{
      const tag = m?.metadata?.builder?.type;
      if (!tag) return;
      if (tag === 'floor'){
        const sz = m.metadata.builder.size || [m.getBoundingInfo().boundingBox.extendSizeWorld.x*2, m.getBoundingInfo().boundingBox.extendSizeWorld.z*2];
        out.floors.push({
          name: m.name,
          pos:  [m.position.x, m.position.y, m.position.z],
          size: sz,
          floorIndex: (m.metadata.builder.floorIndex|0)||0,
          mat: m.material?.name || null
        });
      }
      else if (tag === 'wall'){
        let a = m.metadata.builder.a, b = m.metadata.builder.b, h=m.metadata.builder.h, t=m.metadata.builder.t;
        if (!a || !b){
          const wm = m.getWorldMatrix();
          const half = (m.getBoundingInfo().boundingBox.extendSize.x)*m.scaling.x;
          const p1 = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(-half, 0, 0), wm);
          const p2 = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3( half, 0, 0), wm);
          a = {x:p1.x,y:ST.y,z:p1.z};
          b = {x:p2.x,y:ST.y,z:p2.z};
          h = m.getBoundingInfo().boundingBox.extendSizeWorld.y*2;
          t = m.getBoundingInfo().boundingBox.extendSizeWorld.z*2;
        }
        out.walls.push({
          name:m.name, a, b, h, t,
          floorIndex: (m.metadata.builder.floorIndex|0)||0,
          mat: m.material?.name || null
        });
      }
      else if (tag === 'prop'){
        out.props.push({
          name: m.name, kind: m.metadata.builder.kind||'prop',
          pos: [m.position.x, m.position.y, m.position.z],
          rot: [m.rotation.x||0, m.rotation.y||0, m.rotation.z||0],
          scl: [m.scaling.x||1, m.scaling.y||1, m.scaling.z||1],
          floorIndex: (m.metadata.builder.floorIndex|0)||0,
          mat: m.material?.name || null
        });
      }
    });

    const sp = sc.getTransformNodeByName('Spawn_Player'); if (sp) out.spawn.player = [sp.position.x, sp.position.y, sp.position.z];
    const sv = sc.getTransformNodeByName('Spawn_Van');    if (sv) out.spawn.van    = [sv.position.x, sv.position.y, sv.position.z];

    return out;
  }

  function clearScene(preserveVan){
    const sc = S(); if (!sc) return;
    sc.meshes.slice().forEach(m=>{
      if (m.name==='Ground_Main' || m.name==='StartPad_Wood') return;
      if (preserveVan && (m.name.startsWith('Van_') || m.metadata?.storage)) return;
      if (m.metadata?.builder?.type) try{ m.dispose(false,true);}catch{}
    });
    sc.transformNodes?.slice()?.forEach?.(n=>{
      if (/^Spawn_/.test(n.name)) return;
      if (n.metadata?.builder?.type === 'stairs'){ try{ n.dispose(false,true);}catch{} }
    });
  }

  function importJSON(obj, opts={}){
    clearScene(opts.preserveVan);
    const floors = obj?.floors||[], walls = obj?.walls||[], props = obj?.props||[];

    floors.forEach(F=>{
      const m = makeFloor(BABYLON.Vector3.FromArray(F.pos||[0,ST.y,0]), F.size?.[0]||2, F.size?.[1]||2, F.mat || ST.defaultMats.floor);
      if (F.name) m.name = F.name;
    });
    walls.forEach(W=>{
      const a=v3(W.a.x,W.a.y,W.a.z), b=v3(W.b.x,W.b.y,W.b.z);
      const w = makeWall(a,b, W.h||3, W.t||0.18, W.mat || ST.defaultMats.wall);
      if (W.name && w) w.name = W.name;
    });
    props.forEach(P=>{
      const sc = S();
      const b = BABYLON.MeshBuilder.CreateBox(P.name||('PROP_'+Date.now().toString(36)), {size:1}, sc);
      b.position = BABYLON.Vector3.FromArray(P.pos||[0,0.5,0]);
      if (P.rot) b.rotation = BABYLON.Vector3.FromArray(P.rot);
      if (P.scl) b.scaling = BABYLON.Vector3.FromArray(P.scl);
      b.checkCollisions = true; b.isPickable = true;
      b.material = Materials.get(P.mat||'#8b6b3d', 'Mat_'+(P.mat||'prop'));
      b.metadata = { builder:{ type:'prop', floorIndex:(P.floorIndex|0)||0 } };
    });

    if (obj.spawn){
      const sc=S();
      let sp = sc.getTransformNodeByName('Spawn_Player')||new BABYLON.TransformNode('Spawn_Player', sc);
      let sv = sc.getTransformNodeByName('Spawn_Van')   ||new BABYLON.TransformNode('Spawn_Van', sc);
      if (obj.spawn.player) sp.position = BABYLON.Vector3.FromArray(obj.spawn.player);
      if (obj.spawn.van)    sv.position = BABYLON.Vector3.FromArray(obj.spawn.van);
    }
  }

  // -------------- History (real Undo/Redo/Reset) --------------
  const Hist = {
    stack: [], index: -1, max: 60, anchor: null,
    snapshot(){
      return {
        data: exportJSON(),
        y: ST.y,
        defaults: {...ST.defaultMats},
        sel: ST.sel ? ST.sel.name : null
      };
    },
    hash(snap){ return JSON.stringify(snap.data); },
    push(reason){
      const snap = this.snapshot();
      const h = this.hash(snap);
      const cur = this.stack[this.index];
      if (cur && cur.hash===h) return; // no change
      if (this.index < this.stack.length-1) this.stack.splice(this.index+1); // drop redo tail
      this.stack.push({ snap, hash:h, reason: reason||'' });
      if (this.stack.length > this.max) this.stack.shift();
      this.index = this.stack.length-1;
      this.updateButtons();
    },
    restore(idx){
      if (idx < 0 || idx >= this.stack.length) return;
      const { snap } = this.stack[idx];
      ST.y = snap.y||0;
      ST.defaultMats = {...(snap.defaults||ST.defaultMats)};
      importJSON(snap.data, { preserveVan: true });
      // reselect if named
      if (snap.sel){
        const m = S().getMeshByName(snap.sel);
        selectMesh(m || null);
      } else selectMesh(null);
    },
    undo(){ if (!this.canUndo()) return; this.index--; this.restore(this.index); this.updateButtons(); },
    redo(){ if (!this.canRedo()) return; this.index++; this.restore(this.index); this.updateButtons(); },
    canUndo(){ return this.index > 0; },
    canRedo(){ return this.index >=0 && this.index < this.stack.length-1; },
    beginEdit(){ this.anchor = this.snapshot(); },
    resetEdit(){
      if (!this.anchor) return;
      ST.y = this.anchor.y||0;
      ST.defaultMats = {...(this.anchor.defaults||ST.defaultMats)};
      importJSON(this.anchor.data, { preserveVan:true });
      if (this.anchor.sel){
        const m = S().getMeshByName(this.anchor.sel); selectMesh(m||null);
      } else selectMesh(null);
    },
    updateButtons(){
      const u = document.getElementById('rp-undo');
      const r = document.getElementById('rp-redo');
      if (u){ u.disabled = !this.canUndo(); u.style.opacity = this.canUndo()?'1':'0.5'; }
      if (r){ r.disabled = !this.canRedo(); r.style.opacity = this.canRedo()?'1':'0.5'; }
      // top toolbar generic buttons labelled "Undo" / "Redo"
      Array.from(document.querySelectorAll('button')).forEach(btn=>{
        const t=(btn.textContent||'').trim().toLowerCase();
        if (t==='undo') btn.disabled = !this.canUndo();
        if (t==='redo') btn.disabled = !this.canRedo();
      });
    }
  };

  // -------------- Right panel glue (optional) --------------
  function updateRightPanelInfo(){
    // If you have fields to show selection / size, wire them here.
    // Kept minimal so it doesn’t fight your existing layout.
  }
  function wireRightPanel(){
    const $ = sel => document.querySelector(sel);

    const btnUndo = $('#rp-undo');
    const btnRedo = $('#rp-redo');
    const btnReset= $('#rp-reset');
    const btnCopy = $('#rp-copy-room');
    const btnPaste= $('#rp-paste-room');
    const btnApply= $('#rp-apply');
    const pickMat = $('#rp-pick'); // could be <select> or your palette
    const chkGrid = $('#rp-grid');
    const numStep = $('#rp-step');
    const numY    = $('#rp-y');
    const btnRoom = $('#rp-room');
    const btnWall = $('#rp-wall');
    const btnFinish = $('#rp-finish');
    const btnCancel = $('#rp-cancel');

    if (btnUndo) btnUndo.onclick = ()=> Builder.undo();
    if (btnRedo) btnRedo.onclick = ()=> Builder.redo();
    if (btnReset)btnReset.onclick= ()=> Builder.resetSelectionEdits();

    if (btnCopy) btnCopy.onclick = ()=> Builder.copyRoom();
    if (btnPaste)btnPaste.onclick= ()=> { Builder.pasteRoom(); Builder.commit('paste room'); };

    if (btnApply && pickMat){
      btnApply.onclick = ()=>{
        const key = (pickMat.value || pickMat.dataset.key || '#cccccc');
        Builder.applyMatToSelection(key);
        Builder.commit('apply material');
      };
    }
    if (chkGrid) chkGrid.onchange = ()=> Builder.setGridSnap(chkGrid.checked, ST.grid.step);
    if (numStep) numStep.onchange = ()=> Builder.setGridSnap(ST.grid.snap, parseFloat(numStep.value)||0.5);
    if (numY)    numY.onchange    = ()=> Builder.setY(parseFloat(numY.value)||0);

    if (btnRoom) btnRoom.onclick = ()=> setMode('room');
    if (btnWall) btnWall.onclick = ()=> setMode('wall');
    if (btnFinish) btnFinish.onclick = ()=> { if (ST.drawing.active){ onPointerUp({}); } };
    if (btnCancel) btnCancel.onclick = ()=> cancelDrawing();
  }

  // -------------- Keyboard --------------
  window.addEventListener('keydown', (e)=>{
    if (!ST.enabled) return;

    // modes
    if (!e.ctrlKey && !e.altKey){
      if (e.key==='s' || e.key==='S'){ setMode('select'); }
      if (e.key==='f' || e.key==='F'){ setMode('floor'); }
      if (e.key==='w' || e.key==='W'){ setMode('wall'); }
      if (e.key==='r' || e.key==='R'){ setMode('room'); }
      if (e.key==='p' || e.key==='P'){ setMode('place'); }
    }

    // delete selection
    if (e.key==='Delete' && ST.sel){
      try{ ST.sel.dispose(false,true);}catch{}
      selectMesh(null);
      if (Builder.commit) Builder.commit('delete');
    }

    // undo/redo
    if (e.ctrlKey && !e.shiftKey && (e.key==='z' || e.code==='KeyZ')) { e.preventDefault(); Builder.undo(); }
    if ((e.ctrlKey && e.shiftKey && (e.key==='z'||e.code==='KeyZ')) || (e.ctrlKey && (e.key==='y'||e.code==='KeyY'))){
      e.preventDefault(); Builder.redo();
    }
  }, {capture:true});

  // -------------- Public API --------------
  const Builder = {
    enable(){
      if (ST.enabled) return;
      ST.enabled = true;
      const sc = S(), cvs = sc.getEngine().getRenderingCanvas();
      sc.onPointerObservable.add((pi)=>{
        const ev = pi.event||{};
        if (pi.type === BABYLON.PointerEventTypes.POINTERDOWN) onPointerDown(ev);
        else if (pi.type === BABYLON.PointerEventTypes.POINTERMOVE) onPointerMove(ev);
        else if (pi.type === BABYLON.PointerEventTypes.POINTERUP) onPointerUp(ev);
      }, BABYLON.PointerEventTypes.POINTERDOWN|BABYLON.PointerEventTypes.POINTERMOVE|BABYLON.PointerEventTypes.POINTERUP);
      // initial history snapshot
      setTimeout(()=> Hist.push('init'), 50);
      // right-side panel glue (if present)
      setTimeout(wireRightPanel, 0);
    },
    disable(){ ST.enabled = false; },

    // grid
    setGrid(opts){ ST.grid.snap = !!opts.snap; ST.grid.step = +opts.step||0.5; },
    setGridSnap(on, step){ ST.grid.snap = !!on; ST.grid.step = +step||ST.grid.step; },
    // y plane
    setY(y){ ST.y = +y||0; const n=document.getElementById('rp-y'); if (n) n.value = ST.y; },
    getY(){ return ST.y; },

    // selection
    select(m){ selectMesh(m); },
    getSelection(){ return ST.sel ? { name:ST.sel.name } : null; },

    // default material keys
    setDefaultMat(kind, key){
      if (kind==='floor') ST.defaultMats.floor = key;
      if (kind==='wall')  ST.defaultMats.wall  = key;
    },

    // apply to selection
    applyMatToSelection(key){
      if (!ST.sel) return;
      ST.sel.material = Materials.get(key, 'Mat_'+key);
      // store "key" in material name to persist in JSON
      try{ ST.sel.material.name = key; }catch{}
    },

    // room copy/paste
    copyRoom(){
      const m = ST.sel;
      if (!m || m.metadata?.builder?.type!=='floor') return;
      const size = m.metadata.builder.size || [m.getBoundingInfo().boundingBox.extendSizeWorld.x*2, m.getBoundingInfo().boundingBox.extendSizeWorld.z*2];
      ST.copyRoomData = { size:[size[0], size[1]], matKey: (m.material?.name||ST.defaultMats.floor) };
    },
    pasteRoom(){
      const data = ST.copyRoomData; if (!data) return;
      const p = ST._lastPointerW || v3(0, ST.y, 0);
      makeFloor(v3(p.x, ST.y, p.z), data.size[0], data.size[1], data.matKey);
    },

    // exporting
    export(){ return exportJSON(); },
    import(obj){ return importJSON(obj, { preserveVan:true }); },

    // history
    commit(reason){ Hist.push(reason); },
    undo(){ Hist.undo(); },
    redo(){ Hist.redo(); },
    beginEdit(){ Hist.beginEdit(); },
    resetSelectionEdits(){ Hist.resetEdit(); },

    // tiny helpers you may call from outside UI
    makeRoomRect(a,b){ return makeRoomFromRect(a,b,0.18,3, ST.defaultMats.floor, ST.defaultMats.wall); },
  };
  window.Builder = Builder;

})();
