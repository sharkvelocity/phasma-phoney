// ./assets/index3/builder_view_lock.js — v2.5
// Aerial Lock + Spawn Pad + Player Preview + Walls Tool + FLOORS (Basement & Upper Levels)
// • Top-down “Aerial Lock”: zoom only (no pan/tilt/rotate).
// • Wall Tool: click-drag to place walls (snap to grid & endpoints), Box mode for 4-wall rectangle,
//   edit by clicking a wall to drag its nearest endpoint, Undo/Redo/Reset.
// • FLOORS: levels …, -1 (Basement), 0 (Ground), 1..N (Upper). Active level selector, per-level visibility,
//   “Add Floor” (upper), “Add Basement” auto-mirrors Ground footprint (size) + creates 4 perimeter walls.
// • Walls carry {level, y} so they render on their floor. Pointer plane follows active level Y.
// • Export injects: { spawn, walls:[...], floors:{ rise, list:[{index,y,name,visible,footprint?}] } }
// • Import restores floors + walls + spawn.
//
// Hotkeys:
//   Alt+T      — (reserved) dev tools toggle pass-through (no-op here)
//   Tab        — toggle Wall Tool
//   Esc        — cancel current draw/edit
//   Shift      — chain segments from last endpoint
//   U / Ctrl+Z — Undo
//   Y / Ctrl+Y / Ctrl+Shift+Z — Redo
//
// Drop into builder.html:
//   <script src="./assets/index3/builder_view_lock.js?v=2.5"></script>

(function(){
  "use strict";
  if (window.BuilderViewLock?.__v === '2.5') return;

  // ---------- helpers ----------
  const SCENE = ()=> window.scene || BABYLON.Engine?.LastCreatedScene;
  const ENG   = ()=> SCENE()?.getEngine?.();
  const CANVAS= ()=> ENG()?.getRenderingCanvas();
  const v2    = (x,z)=> new BABYLON.Vector2(x,z);
  const v3    = (x,y,z)=> new BABYLON.Vector3(x,y,z);
  const clamp = (v,a,b)=> Math.max(a, Math.min(b,v));
  const rad   = d=> d*Math.PI/180;

  // ========== STATE ==========
  const ST = {
    s:null,

    // Camera lock
    cTop:null, pointerInput:null, aerialLocked:true, aerialSnap:null,

    // Player preview
    playerOn:false, playerRoot:null, playerCapsule:null, playerCam:null,
    playerYStanding:1.7, playerYCrouch:1.1, isCrouch:false,
    playerSpeed:3.0, playerSprint:5.0, pressed:Object.create(null), moveObs:null,

    // Spawn
    spawn:null, spawnYaw:0,

    // Floors
    floorRise: 3.0,
    levels: new Map(),          // idx -> { index, name, y, visible, floorMesh?, footprint? }
    activeLevel: 0,             // 0 = Ground
    levelUIBuilt:false,

    // Walls
    walls: [],                  // { mesh, p1:{x,z}, p2:{x,z}, y, height, thickness, level }
    wallMat:null,
    gridSize: 0.5,
    snapToGrid: true,
    snapToEnds: true,
    wallHeight: 2.6,
    wallThick:  0.16,

    // Wall tool
    toolActive:false,
    boxMode:false,
    drawing:false,
    editing:null,               // { wall, anchorIsP1 }
    anchor:null,                // Vector2 on active level plane
    ghostMesh:null,
    anchorViz:null,

    // Undo/Redo
    undo:[], redo:[], sessionStart:null,

    // once
    _handlers:false, _ui:false, _importWrapped:false, _eventsHooked:false
  };

  // ---------- Camera (top-down lock) ----------
  function ensureArcTopCamera(){
    ST.s = SCENE(); if (!ST.s) return null;
    let cam = ST.s.activeCamera;
    if (!(cam instanceof BABYLON.ArcRotateCamera)){
      cam = new BABYLON.ArcRotateCamera("BuildCam", 0, 0.001, 25, v3(0,0,0), ST.s);
      cam.attachControl(CANVAS(), true);
      ST.s.activeCamera = cam;
    }
    ST.cTop = cam;
    ST.pointerInput = cam.inputs.attached.pointers || cam.inputs.getInput("ArcRotateCameraPointersInput");
    if (!ST.pointerInput){
      cam.inputs.add(new BABYLON.ArcRotateCameraPointersInput());
      ST.pointerInput = cam.inputs.attached.pointers;
    }
    return cam;
  }
  function snapshotCam(cam){
    return {
      alpha:cam.alpha, beta:cam.beta, radius:cam.radius, target:cam.target.clone(),
      lowerAlphaLimit:cam.lowerAlphaLimit, upperAlphaLimit:cam.upperAlphaLimit,
      lowerBetaLimit:cam.lowerBetaLimit,   upperBetaLimit:cam.upperBetaLimit,
      panningSensibility:cam.panningSensibility,
      inertia:cam.inertia,
      wheelPrecision:cam.wheelPrecision,
      pinchDeltaPercentage: ST.pointerInput?.pinchDeltaPercentage,
      asActive: ST.s?.activeCamera===cam
    };
  }
  function restoreCam(cam, snap){
    if (!snap) return;
    Object.assign(cam,{
      alpha:snap.alpha, beta:snap.beta, radius:snap.radius, inertia:snap.inertia,
      lowerAlphaLimit:snap.lowerAlphaLimit, upperAlphaLimit:snap.upperAlphaLimit,
      lowerBetaLimit:snap.lowerBetaLimit,   upperBetaLimit:snap.upperBetaLimit,
      panningSensibility:snap.panningSensibility, wheelPrecision:snap.wheelPrecision
    });
    cam.setTarget(snap.target);
    if (ST.pointerInput) ST.pointerInput.pinchDeltaPercentage = snap.pinchDeltaPercentage;
    if (snap.asActive) ST.s.activeCamera = cam;
  }
  function lockAerial(){
    const cam = ensureArcTopCamera(); if (!cam) return;
    ST.aerialSnap = snapshotCam(cam);
    cam.alpha=0; cam.beta=0.001;
    cam.lowerAlphaLimit=0; cam.upperAlphaLimit=0;
    cam.lowerBetaLimit=0;  cam.upperBetaLimit=0.001;
    cam.panningSensibility=0;
    cam.wheelPrecision=50;
    if (ST.pointerInput){
      ST.pointerInput.pinchDeltaPercentage=0.01;
      ST.pointerInput.angularSensibilityX=1e12;
      ST.pointerInput.angularSensibilityY=1e12;
    }
    cam.inertia=0;
    ST.s.cameraToUseForPointers = cam;
  }
  function unlockAerial(){
    if (!ST.cTop || !ST.aerialSnap) return;
    restoreCam(ST.cTop, ST.aerialSnap);
    ST.aerialSnap = null;
  }
  function setAerial(on){
    ST.aerialLocked = !!on;
    if (!SCENE()) return;
    if (ST.aerialLocked) lockAerial(); else unlockAerial();
    const cb = document.getElementById('aerial-lock-cb'); if (cb) cb.checked = ST.aerialLocked;
  }

  // ---------- Floors ----------
  function levelY(idx){ return idx * ST.floorRise; }
  function ensureLevel(idx, name){
    if (ST.levels.has(idx)) return ST.levels.get(idx);
    const L = { index: idx, name: name|| (idx===0?'Ground':(idx<0?'Basement':'Floor '+(idx+1))), y: levelY(idx), visible:true, floorMesh:null, footprint:null };
    ST.levels.set(idx, L);
    renderLevelsUI();
    return L;
  }
  function setActiveLevel(idx){
    ensureLevel(idx);
    ST.activeLevel = idx;
    const sel = document.getElementById('level-select');
    if (sel){ sel.value = String(idx); }
    // slide anchor viz & ghost to this level
    if (ST.anchorViz) ST.anchorViz.position.y = levelY(idx)+0.02;
    if (ST.ghostMesh){
      const dy = levelY(idx) + ST.wallHeight/2;
      ST.ghostMesh.position.y = dy;
    }
  }
  function setLevelVisible(idx, on){
    const L = ensureLevel(idx);
    L.visible = !!on;
    // show/hide walls of this level
    ST.walls.forEach(w=>{ if (w.level===idx) w.mesh.setEnabled(on); });
    // show/hide floor plane if any
    if (L.floorMesh) L.floorMesh.setEnabled(on);
    renderLevelsUI();
  }
  function highestUpper(){ let m=0; ST.levels.forEach(L=>{ if (L.index>m) m=L.index; }); return m; }
  function addUpperFloor(){
    const idx = highestUpper()+1;
    const L = ensureLevel(idx);
    // optional: create a thin floor plane for preview
    ensureLevelFloorPlane(L, autoGroundRect()||{minX:-2, maxX:2, minZ:-2, maxZ:2}, 0.02);
    setActiveLevel(idx);
  }
  function addBasementAuto(){
    const L = ensureLevel(-1, 'Basement');
    const rect = autoGroundRect() || {minX:-4, maxX:4, minZ:-3, maxZ:3};
    // Remember footprint
    L.footprint = rect;
    // Floor plane
    ensureLevelFloorPlane(L, rect, 0.02);
    // Create perimeter walls (same size as ground footprint)
    const p1 = v2(rect.minX, rect.minZ), p2 = v2(rect.maxX, rect.maxZ);
    createBoxWallsAtLevel(-1, p1, p2);
    setLevelVisible(-1, true);
    renderLevelsUI();
  }
  function ensureLevelFloorPlane(L, rect, thickness=0.02){
    try{ L.floorMesh?.dispose(); }catch{}
    const w = (rect.maxX-rect.minX)||0.01, d=(rect.maxZ-rect.minZ)||0.01;
    const mesh = BABYLON.MeshBuilder.CreateGround('Floor_'+L.name, {width:w, height:d}, ST.s);
    mesh.position.set((rect.minX+rect.maxX)/2, L.y + 0.001, (rect.minZ+rect.maxZ)/2);
    mesh.checkCollisions = true; mesh.isPickable = true;
    mesh.metadata = mesh.metadata || {};
    mesh.metadata.builder = { type:'floor', level:L.index };
    const mat = new BABYLON.StandardMaterial('Mat_Floor_'+L.name, ST.s);
    mat.diffuseColor  = new BABYLON.Color3(0.35,0.32,0.28);
    mat.specularColor = new BABYLON.Color3(0.05,0.05,0.05);
    mesh.material = mat;
    L.floorMesh = mesh;
    return mesh;
  }
  function autoGroundRect(){
    // bounding rect of level 0 walls (or floor mesh footprint if present)
    const G = ensureLevel(0);
    if (G.footprint) return G.footprint;
    let minX= Infinity, maxX=-Infinity, minZ= Infinity, maxZ=-Infinity;
    let count=0;
    ST.walls.forEach(w=>{
      if (w.level!==0) return;
      minX = Math.min(minX, w.p1.x, w.p2.x);
      maxX = Math.max(maxX, w.p1.x, w.p2.x);
      minZ = Math.min(minZ, w.p1.z, w.p2.z);
      maxZ = Math.max(maxZ, w.p1.z, w.p2.z);
      count++;
    });
    if (count>0) {
      const rect = {minX, maxX, minZ, maxZ};
      G.footprint = rect;
      return rect;
    }
    // if a floor mesh exists, infer from its bounds
    if (G.floorMesh){
      const bb = G.floorMesh.getBoundingInfo().boundingBox;
      return {
        minX: bb.minimumWorld.x, maxX: bb.maximumWorld.x,
        minZ: bb.minimumWorld.z, maxZ: bb.maximumWorld.z
      };
    }
    return null;
  }
  function renderLevelsUI(){
    const list = document.getElementById('levels-list');
    const sel  = document.getElementById('level-select');
    if (!list || !sel) return;

    // rebuild select
    sel.innerHTML = '';
    Array.from(ST.levels.values()).sort((a,b)=> a.index-b.index).forEach(L=>{
      const opt = document.createElement('option');
      opt.value = String(L.index);
      opt.textContent = `${L.index===-1?'Basement':(L.index===0?'Ground':'Floor '+(L.index+1))} (${L.index})`;
      sel.appendChild(opt);
    });
    sel.value = String(ST.activeLevel);

    // rebuild list rows
    list.innerHTML = '';
    Array.from(ST.levels.values()).sort((a,b)=> a.index-b.index).forEach(L=>{
      const row = document.createElement('div');
      row.className = 'lvl-row';
      row.innerHTML = `
        <label class="switch">
          <input type="checkbox" ${L.visible?'checked':''} data-idx="${L.index}">
          <span>${L.index===-1?'Basement':(L.index===0?'Ground':'Floor '+(L.index+1))}</span>
        </label>
        <button class="btn btn-small" data-sel="${L.index}">Select</button>
      `;
      list.appendChild(row);
    });

    // wire
    list.querySelectorAll('input[type="checkbox"]').forEach(cb=>{
      cb.onchange = e=> setLevelVisible(parseInt(e.target.getAttribute('data-idx')), e.target.checked);
    });
    list.querySelectorAll('button[data-sel]').forEach(b=>{
      b.onclick = e=> setActiveLevel(parseInt(b.getAttribute('data-sel')));
    });
  }

  // ---------- Spawn Pad (kept minimal) ----------
  function ensureSpawnPad(){
    const s = SCENE(); if (!s) return null;
    const existing = ['StartPad_Wood','StartPad','Spawn','SpawnPad','Start']
      .map(n=> s.getMeshByName(n)).find(Boolean);
    if (existing){ ST.spawn=existing; return existing; }
    const pad = BABYLON.MeshBuilder.CreateGround('StartPad_Wood',{width:1.2, height:1.2}, s);
    pad.position.set(0, 0.01, 0);
    pad.checkCollisions = true; pad.isPickable=true;
    const mat = new BABYLON.StandardMaterial('Mat_SpawnPad', s);
    mat.diffuseColor = new BABYLON.Color3(0.55,0.42,0.22);
    mat.specularColor= new BABYLON.Color3(0.05,0.05,0.05);
    pad.material = mat;
    ST.spawn = pad;
    return pad;
  }
  function serializeSpawn(){
    ensureSpawnPad();
    if (!ST.spawn) return null;
    ST.spawnYaw = ((ST.spawn.rotation?.y||0) * 180/Math.PI + 360) % 360;
    return {
      name: ST.spawn.name || 'StartPad_Wood',
      pos: { x:+ST.spawn.position.x.toFixed(4), y:+ST.spawn.position.y.toFixed(4), z:+ST.spawn.position.z.toFixed(4) },
      yaw: +(ST.spawnYaw.toFixed(2))
    };
  }
  function applySpawnFromJSON(json){
    try{
      const data = (json && json.spawn) ? json.spawn : json;
      if (!data) return false;
      ensureSpawnPad();
      if (ST.spawn){
        const p = data.pos||{};
        if (isFinite(p.x)) ST.spawn.position.x=+p.x;
        if (isFinite(p.y)) ST.spawn.position.y=+p.y;
        if (isFinite(p.z)) ST.spawn.position.z=+p.z;
        const yaw = (data.yaw||0); ST.spawn.rotation.y = rad(yaw); ST.spawnYaw=yaw;
      }
      return true;
    }catch{ return false; }
  }

  // ---------- Walls ----------
  function ensureWallMaterial(){
    if (ST.wallMat && !ST.wallMat.isDisposed()) return ST.wallMat;
    const mat = new BABYLON.StandardMaterial('Mat_Wall', ST.s);
    mat.diffuseColor = new BABYLON.Color3(0.82, 0.82, 0.86);
    mat.specularColor= new BABYLON.Color3(0.05, 0.05, 0.05);
    return (ST.wallMat=mat);
  }
  function makeWall(p1, p2, level, height, thick){
    const y = levelY(level);
    const s = ST.s;
    const L = Math.max(0.001, Math.hypot(p2.x-p1.x, p2.z-p1.z));
    const cx = (p1.x+p2.x)/2, cz=(p1.z+p2.z)/2;
    const yaw = Math.atan2(p2.x-p1.x, p2.z-p1.z);
    const mesh = BABYLON.MeshBuilder.CreateBox('Wall',{width:thick, height, depth:L}, s);
    mesh.material = ensureWallMaterial();
    mesh.position.set(cx, y + height/2, cz);
    mesh.rotation.y = yaw;
    mesh.checkCollisions = true;
    mesh.isPickable = true;
    mesh.metadata = mesh.metadata || {};
    mesh.metadata.builder = { type:'wall', level };
    return mesh;
  }
  function updateGhost(p1, p2, level, height, thick){
    const y = levelY(level);
    const L = Math.max(0.001, Math.hypot(p2.x-p1.x, p2.z-p1.z));
    const cx = (p1.x+p2.x)/2, cz=(p1.z+p2.z)/2;
    const yaw = Math.atan2(p2.x-p1.x, p2.z-p1.z);
    if (!ST.ghostMesh || ST.ghostMesh.isDisposed()){
      ST.ghostMesh = BABYLON.MeshBuilder.CreateBox('WallGhost',{width:thick, height, depth:L}, ST.s);
      const mat = new BABYLON.StandardMaterial('Mat_WallGhost', ST.s);
      mat.emissiveColor = new BABYLON.Color3(0.2,0.9,1.0);
      mat.alpha = 0.5;
      ST.ghostMesh.material = mat;
      ST.ghostMesh.isPickable=false;
    } else {
      ST.ghostMesh.dispose();
      ST.ghostMesh = BABYLON.MeshBuilder.CreateBox('WallGhost',{width:thick, height, depth:L}, ST.s);
      const mat = new BABYLON.StandardMaterial('Mat_WallGhost', ST.s);
      mat.emissiveColor = new BABYLON.Color3(0.2,0.9,1.0);
      mat.alpha = 0.5; ST.ghostMesh.material = mat; ST.ghostMesh.isPickable=false;
    }
    ST.ghostMesh.position.set(cx, y + height/2, cz);
    ST.ghostMesh.rotation.y = yaw;
  }
  function clearGhost(){ try{ ST.ghostMesh?.dispose(); }catch{} ST.ghostMesh=null; }

  // pointer → active level plane
  function pointerToActivePlane(clientX, clientY){
    const s = ST.s; if (!s) return null;
    const rect = CANVAS().getBoundingClientRect();
    const x = clientX - rect.left, y = clientY - rect.top;
    const ray = s.createPickingRay(x, y, BABYLON.Matrix.Identity(), ST.cTop || s.activeCamera, false);
    const plane = new BABYLON.Plane(0,1,0,-levelY(ST.activeLevel));
    const dist = ray.intersectsPlane(plane);
    if (dist===null) return null;
    const hit = ray.origin.add(ray.direction.scale(dist));
    return v2(hit.x, hit.z);
  }
  function snapV2(p){
    let x=p.x, z=p.y;
    if (ST.snapToGrid){
      const g = ST.gridSize;
      x = Math.round(x/g)*g;
      z = Math.round(z/g)*g;
    }
    if (ST.snapToEnds && ST.walls.length){
      const tol = ST.gridSize*0.65;
      let best=null, bd=1e9;
      ST.walls.forEach(w=>{
        if (w.level!==ST.activeLevel) return;
        const pts=[w.p1,w.p2];
        for (const pt of pts){
          const d = Math.hypot(pt.x-x, pt.z-z);
          if (d<bd && d<=tol){ bd=d; best=pt; }
        }
      });
      if (best){ x=best.x; z=best.z; }
    }
    return v2(x,z);
  }

  function commitWall(p1, p2){
    if (p1.x===p2.x && p1.z===p2.z) return;
    pushUndo();
    const level = ST.activeLevel;
    const w = {
      p1:{x:p1.x, z:p1.z},
      p2:{x:p2.x, z:p2.z},
      y: levelY(level),
      height: ST.wallHeight,
      thickness: ST.wallThick,
      level,
      mesh:null
    };
    w.mesh = makeWall(w.p1, w.p2, w.level, w.height, w.thickness);
    w.mesh.setEnabled(ensureLevel(level).visible);
    ST.walls.push(w);
    if (level===0){ ensureLevel(0).footprint = autoGroundRect(); }
  }
  function createBoxWallsAtLevel(level, a, b){
    const mn = v2(Math.min(a.x,b.x), Math.min(a.z,b.z));
    const mx = v2(Math.max(a.x,b.x), Math.max(a.z,b.z));
    const corners = [ v2(mn.x,mn.y), v2(mx.x,mn.y), v2(mx.x,mx.y), v2(mn.x,mx.y) ];
    [[0,1],[1,2],[2,3],[3,0]].forEach(([i,j])=>{
      const p=corners[i], q=corners[j];
      const w = {
        p1:{x:p.x,z:p.y}, p2:{x:q.x,z:q.y},
        y: levelY(level), height:ST.wallHeight, thickness:ST.wallThick,
        level, mesh:null
      };
      w.mesh = makeWall(w.p1, w.p2, w.level, w.height, w.thickness);
      w.mesh.setEnabled(ensureLevel(level).visible);
      ST.walls.push(w);
    });
    if (level===0){ ensureLevel(0).footprint = {minX:mn.x,maxX:mx.x,minZ:mn.y,maxZ:mx.y}; }
  }

  function commitBox(p1, p2){
    const moved = Math.hypot(p2.x-p1.x, p2.z-p1.z);
    if (moved<=0.01) return;
    pushUndo();
    createBoxWallsAtLevel(ST.activeLevel, p1, p2);
  }

  // edit
  function pickWallAt(clientX, clientY){
    const s=ST.s, rect=CANVAS().getBoundingClientRect();
    const rx=clientX-rect.left, ry=clientY-rect.top;
    const pick = s.pick(rx, ry, m=> m?.metadata?.builder?.type==='wall');
    if (pick?.hit){
      const mesh = pick.pickedMesh;
      const w = ST.walls.find(w=> w.mesh===mesh) || null;
      return (w && w.level===ST.activeLevel) ? w : null;
    }
    return null;
  }
  function beginEdit(wall, clientX, clientY){
    if (!wall) return;
    ST.sessionStart = ST.sessionStart || JSON.stringify(serializeWalls());
    pushUndo();
    const p = pointerToActivePlane(clientX, clientY) || v2(wall.p2.x, wall.p2.z);
    const d1 = Math.hypot(p.x-wall.p1.x, p.y-wall.p1.z);
    const d2 = Math.hypot(p.x-wall.p2.x, p.y-wall.p2.z);
    ST.editing = { wall, anchorIsP1: d2<d1 };
    ST.anchor  = ST.editing.anchorIsP1 ? v2(wall.p2.x, wall.p2.z) : v2(wall.p1.x, wall.p1.z);
    ensureAnchorViz().position.set(ST.anchor.x, levelY(ST.activeLevel)+0.02, ST.anchor.y);
    ST.drawing = true;
  }
  function applyEdit(to){
    const ed = ST.editing; if (!ed) return;
    const w = ed.wall;
    if (ed.anchorIsP1){ w.p1.x = to.x; w.p1.z = to.y; } else { w.p2.x=to.x; w.p2.z=to.y; }
    try{ w.mesh.dispose(); }catch{}
    w.mesh = makeWall(w.p1, w.p2, w.level, w.height, w.thickness);
    w.mesh.setEnabled(ensureLevel(w.level).visible);
  }

  // anchor viz
  function ensureAnchorViz(){
    if (ST.anchorViz && !ST.anchorViz.isDisposed()) return ST.anchorViz;
    const s = ST.s;
    const m = BABYLON.MeshBuilder.CreateDisc('AnchorViz', {radius:0.12, tessellation:24}, s);
    const mat = new BABYLON.StandardMaterial('Mat_AnchorViz', s);
    mat.emissiveColor = new BABYLON.Color3(0.1,1,0.8);
    mat.diffuseColor  = new BABYLON.Color3(0.1,0.7,0.7);
    mat.alpha = 0.95;
    m.material = mat; m.rotation.x = Math.PI/2; m.position.y = levelY(ST.activeLevel)+0.02; m.isPickable=false;
    ST.anchorViz = m; return m;
  }

  // input flow
  function onPointerDown(ev){
    if (!ST.aerialLocked || !ST.toolActive) return;
    if (!ST.drawing){
      const w = pickWallAt(ev.clientX, ev.clientY);
      if (w){ beginEdit(w, ev.clientX, ev.clientY); ev.preventDefault(); return; }
    }
    const p = pointerToActivePlane(ev.clientX, ev.clientY); if (!p) return;
    ST.drawing = true;
    ST.anchor  = snapV2(p);
    ensureAnchorViz().position.set(ST.anchor.x, levelY(ST.activeLevel)+0.02, ST.anchor.y);
    ev.preventDefault();
  }
  function onPointerMove(ev){
    if (!ST.aerialLocked || !ST.toolActive) return;
    if (!ST.drawing || !ST.anchor) return;
    const p = pointerToActivePlane(ev.clientX, ev.clientY); if (!p) return;
    const q = snapV2(p);
    updateGhost(v2(ST.anchor.x, ST.anchor.y), q, ST.activeLevel, ST.wallHeight, ST.wallThick);
  }
  function onPointerUp(ev){
    if (!ST.aerialLocked || !ST.toolActive) return;
    if (!ST.drawing || !ST.anchor) return;
    const p = pointerToActivePlane(ev.clientX, ev.clientY); if (!p){ cancelDraw(); return; }
    const q = snapV2(p);
    if (ST.editing){
      applyEdit(q);
    } else if (ST.boxMode){
      commitBox(v2(ST.anchor.x, ST.anchor.y), q);
    } else {
      commitWall(v2(ST.anchor.x, ST.anchor.y), q);
    }
    if (ev.shiftKey && !ST.editing){
      ST.anchor = q; ensureAnchorViz().position.set(q.x, levelY(ST.activeLevel)+0.02, q.y);
    } else {
      ST.drawing=false; ST.editing=null; ST.anchor=null; try{ ST.anchorViz?.dispose(); }catch{} ST.anchorViz=null;
    }
    clearGhost();
  }
  function cancelDraw(){
    ST.drawing=false; ST.editing=null; ST.anchor=null; clearGhost();
    try{ ST.anchorViz?.dispose(); }catch{} ST.anchorViz=null;
  }

  // undo/redo
  function serializeWalls(){
    return ST.walls.map(w=>({
      p1:{x:+w.p1.x.toFixed(4), z:+w.p1.z.toFixed(4)},
      p2:{x:+w.p2.x.toFixed(4), z:+w.p2.z.toFixed(4)},
      y:+w.y.toFixed(4), height:+w.height.toFixed(3), thickness:+w.thickness.toFixed(3),
      level:w.level
    }));
  }
  function disposeWalls(){ ST.walls.forEach(w=>{ try{ w.mesh.dispose(); }catch{} }); ST.walls=[]; }
  function rebuildWalls(arr){
    disposeWalls();
    if (!Array.isArray(arr)) return;
    arr.forEach(d=>{
      ensureLevel(d.level ?? 0);
      const w = {
        p1:{x:d.p1.x, z:d.p1.z}, p2:{x:d.p2.x, z:d.p2.z},
        y: d.y ?? levelY(d.level??0), height:d.height ?? ST.wallHeight, thickness:d.thickness ?? ST.wallThick,
        level: d.level ?? 0, mesh:null
      };
      w.mesh = makeWall(w.p1,w.p2,w.level,w.height,w.thickness);
      w.mesh.setEnabled(ensureLevel(w.level).visible);
      ST.walls.push(w);
    });
  }
  function pushUndo(){ ST.undo.push(JSON.stringify(serializeWalls())); ST.redo.length=0; }
  function undo(){ if (!ST.undo.length) return; ST.redo.push(JSON.stringify(serializeWalls())); rebuildWalls(JSON.parse(ST.undo.pop())); }
  function redo(){ if (!ST.redo.length) return; ST.undo.push(JSON.stringify(serializeWalls())); rebuildWalls(JSON.parse(ST.redo.pop())); }
  function resetSession(){ if (!ST.sessionStart) return; rebuildWalls(JSON.parse(ST.sessionStart)); ST.undo.length=0; ST.redo.length=0; }

  // ---------- UI ----------
  function ensureWallUI(){
    if (ST._ui) return; ST._ui = true;
    const css = document.createElement('style');
    css.textContent = `
      #builder-wall-panel{
        position:fixed; right:10px; top:10px; z-index:8000;
        background:rgba(0,0,0,0.6); border:1px solid #066; border-radius:10px;
        padding:10px; width:300px; color:#cfe; font:12px/1.4 monospace;
      }
      #builder-wall-panel .row{ display:flex; align-items:center; justify-content:space-between; gap:8px; margin:6px 0; }
      #builder-wall-panel input[type="number"]{ width:84px; background:#000; color:#9ff; border:1px solid #066; border-radius:6px; padding:4px 6px; }
      #builder-wall-panel .btn{ background:#111; color:#9ff; border:1px solid #066; border-radius:6px; padding:6px 10px; cursor:pointer; }
      #builder-wall-panel .btn:active{ transform:translateY(1px); }
      #builder-wall-panel .switch{ display:inline-flex; align-items:center; gap:6px; }
      #levels-list .lvl-row{ display:flex; align-items:center; justify-content:space-between; gap:8px; margin:4px 0; }
      .btn-small{ padding:4px 8px; font-size:11px; }
      select#level-select { width: 120px; background:#000; color:#9ff; border:1px solid #066; border-radius:6px; padding:4px; }
    `;
    document.head.appendChild(css);

    const panel = document.createElement('div');
    panel.id = 'builder-wall-panel';
    panel.innerHTML = `
      <div style="font-weight:bold;color:#9ff;margin-bottom:6px;">Builder – Floors & Walls</div>

      <div class="row">
        <label class="switch"><input id="aerial-lock-cb" type="checkbox" checked> Aerial Lock</label>
        <label class="switch"><input id="wall-tool-cb" type="checkbox"> Wall Tool (Tab)</label>
      </div>

      <div class="row">
        <span>Active Level</span>
        <select id="level-select"></select>
      </div>
      <div id="levels-list"></div>
      <div class="row" style="justify-content:flex-start; gap:8px;">
        <button id="btn-add-floor" class="btn">+ Add Floor</button>
        <button id="btn-add-basement" class="btn">+ Basement (Auto)</button>
      </div>

      <hr style="border-color:#044; opacity:0.6;">

      <div class="row"><label class="switch"><input id="box-mode-cb" type="checkbox"> Box (4-wall) drag</label></div>
      <div class="row">
        <span>Thickness</span><input id="wall-thick" type="number" step="0.02" min="0.04" value="${ST.wallThick}">
      </div>
      <div class="row">
        <span>Height</span><input id="wall-height" type="number" step="0.1" min="0.5" value="${ST.wallHeight}">
      </div>
      <div class="row"><label class="switch"><input id="snap-grid-cb" type="checkbox" checked> Snap to grid</label>
        <input id="grid-size" type="number" step="0.1" min="0.1" value="${ST.gridSize}"></div>
      <div class="row"><label class="switch"><input id="snap-ends-cb" type="checkbox" checked> Snap to endpoints</label></div>

      <div class="row" style="justify-content:flex-start; gap:8px;">
        <button id="btn-undo" class="btn">Undo</button>
        <button id="btn-redo" class="btn">Redo</button>
        <button id="btn-reset" class="btn">Reset</button>
        <button id="btn-clear" class="btn" title="Delete all walls">Clear</button>
      </div>
    `;
    document.body.appendChild(panel);

    // Wire
    const $ = id=> document.getElementById(id);
    $('#aerial-lock-cb').onchange = e=> setAerial(!!e.target.checked);
    $('#wall-tool-cb').onchange  = e=> { ST.sessionStart = JSON.stringify(serializeWalls()); setTool(!!e.target.checked); };
    $('#level-select').onchange  = e=> setActiveLevel(parseInt(e.target.value));
    $('#btn-add-floor').onclick  = ()=> addUpperFloor();
    $('#btn-add-basement').onclick = ()=> addBasementAuto();

    $('#box-mode-cb').onchange  = e=> ST.boxMode = !!e.target.checked;
    $('#wall-thick').onchange   = e=> ST.wallThick = clamp(+e.target.value||ST.wallThick, 0.04, 1.0);
    $('#wall-height').onchange  = e=> ST.wallHeight= clamp(+e.target.value||ST.wallHeight, 0.5, 10);
    $('#snap-grid-cb').onchange = e=> ST.snapToGrid = !!e.target.checked;
    $('#grid-size').onchange    = e=> ST.gridSize   = clamp(+e.target.value||ST.gridSize, 0.1, 5);
    $('#snap-ends-cb').onchange = e=> ST.snapToEnds = !!e.target.checked;

    $('#btn-undo').onclick = ()=> undo();
    $('#btn-redo').onclick = ()=> redo();
    $('#btn-reset').onclick= ()=> resetSession();
    $('#btn-clear').onclick= ()=> { pushUndo(); disposeWalls(); };

    // initialize floors UI
    ensureLevel(0); // Ground
    renderLevelsUI();
    setActiveLevel(0);
  }
  function setTool(on){
    ST.toolActive = !!on;
    const cb = document.getElementById('wall-tool-cb'); if (cb) cb.checked = ST.toolActive;
    if (ST.toolActive){
      ST.sessionStart = JSON.stringify(serializeWalls());
    } else {
      cancelDraw();
    }
  }

  // ---------- Keyboard & pointer ----------
  function keyHandler(e){
    if (e.code==='Tab'){ e.preventDefault(); setTool(!ST.toolActive); return; }
    if ((e.ctrlKey||e.metaKey) && !e.shiftKey && (e.key==='z'||e.key==='Z')){ e.preventDefault(); undo(); return; }
    if ((e.ctrlKey||e.metaKey) && (e.key==='y'||e.key==='Y')){ e.preventDefault(); redo(); return; }
    if ((e.ctrlKey||e.metaKey) && e.shiftKey && (e.key==='z'||e.key==='Z')){ e.preventDefault(); redo(); return; }
    if (e.key==='u'||e.key==='U') undo();
    if (e.key==='y'||e.key==='Y') redo();
    if (e.key==='Escape'){ cancelDraw(); }
  }
  function attachHandlers(){
    if (ST._handlers) return; ST._handlers=true;
    const s = ST.s;
    s.onPointerObservable.add(pi=>{
      if (pi.type===BABYLON.PointerEventTypes.POINTERDOWN) onPointerDown(pi.event);
      if (pi.type===BABYLON.PointerEventTypes.POINTERMOVE) onPointerMove(pi.event);
      if (pi.type===BABYLON.PointerEventTypes.POINTERUP)   onPointerUp(pi.event);
    });
    window.addEventListener('keydown', keyHandler, true);
  }

  // ---------- Export / Import ----------
  function exportFloors(){
    const list = Array.from(ST.levels.values()).map(L=>{
      const out = { index:L.index, name:L.name, y:L.y, visible:!!L.visible };
      if (L.footprint) out.footprint = Object.assign({}, L.footprint);
      return out;
    }).sort((a,b)=> a.index-b.index);
    return { rise: ST.floorRise, list };
  }
  function applyFloorsFromJSON(json){
    if (!json || !json.floors) { ensureLevel(0); renderLevelsUI(); setActiveLevel(0); return; }
    const info = json.floors;
    if (typeof info.rise === 'number' && isFinite(info.rise)) ST.floorRise = info.rise;
    ST.levels.clear();
    (info.list||[]).forEach(L=>{
      const lvl = ensureLevel(L.index, L.name);
      lvl.y = levelY(L.index);
      lvl.visible = (L.visible!==false);
      lvl.footprint = L.footprint || lvl.footprint || null;
      if (lvl.footprint) ensureLevelFloorPlane(lvl, lvl.footprint, 0.02);
      setLevelVisible(L.index, lvl.visible);
    });
    if (!ST.levels.has(0)) ensureLevel(0);
    renderLevelsUI();
    setActiveLevel(0);
  }
  function injectIntoExport(obj){
    obj.spawn = serializeSpawn();
    obj.walls = serializeWalls();
    obj.floors= exportFloors();
    return obj;
  }
  function wrapExportIfPresent(){
    if (!window.Builder) return;
    const B = window.Builder;
    if (typeof B.exportToJSON==='function' && !B.exportToJSON.__floors){
      const orig = B.exportToJSON.bind(B);
      B.exportToJSON = function(...args){
        const out = orig(...args);
        try{ injectIntoExport(out); }catch{}
        return out;
      };
      B.exportToJSON.__floors = true;
    }
  }
  function wrapImportsIfPresent(){
    if (ST._importWrapped || !window.Builder) return;
    const B = window.Builder;
    const wrap=(key)=>{
      if (typeof B[key] !== 'function' || B[key].__floors) return;
      const orig = B[key].bind(B);
      B[key] = function(...args){
        const rv = orig(...args);
        const payload = args.find(a=> a && typeof a==='object');
        setTimeout(()=>{
          applyFloorsFromJSON(payload||B.project||{});
          rebuildWalls((payload&&payload.walls)||[]);
          applySpawnFromJSON(payload||{});
        },0);
        return rv;
      };
      B[key].__floors = true;
    };
    ['importFromJSON','loadFromJSON','loadProject','setProject','openProject'].forEach(wrap);
    ST._importWrapped = true;
  }
  function hookLoadedEvents(){
    if (ST._eventsHooked) return; ST._eventsHooked=true;
    const apply = e=>{
      const detail = (e && e.detail) || e || null;
      const src = (detail && typeof detail==='object') ? detail : (window.Builder?.project||null);
      if (!src) return;
      applyFloorsFromJSON(src);
      rebuildWalls(src.walls||[]);
      applySpawnFromJSON(src);
    };
    ['builder:loaded','builder:project:loaded','project:loaded','builder:imported'].forEach(evt=>{
      window.addEventListener(evt, apply, true);
      document.addEventListener(evt, apply, true);
    });
  }

  // ---------- Boot ----------
  const boot = setInterval(()=>{
    try{
      if (!SCENE()) return;
      ensureArcTopCamera();
      setAerial(true);
      ensureSpawnPad();
      ensureWallUI();
      attachHandlers();
      wrapExportIfPresent();
      wrapImportsIfPresent();
      hookLoadedEvents();
      clearInterval(boot);
    }catch{}
  }, 120);

  // ---------- Public API ----------
  window.BuilderViewLock = {
    __v:'2.5',
    setAerial,
    // floors
    ensureLevel, setActiveLevel, addUpperFloor, addBasementAuto, setLevelVisible,
    // walls
    setWallTool:(on)=>setTool(on),
    serializeWalls, rebuildWalls, undo, redo, resetSession,
    exportFloors, applyFloorsFromJSON
  };

})();