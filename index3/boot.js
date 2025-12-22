// ./assets/index3/boot.js
(function () {
  if (window.__Index3BootReady) return; window.__Index3BootReady = true;

  const $ = (sel) => document.querySelector(sel);
  const log = (...a) => { try { console.log("[index3]", ...a); } catch(_){} };
  const warn = (...a) => { try { console.warn("[index3]", ...a); } catch(_){} };
  function docResolve(path){ try { return new URL(path, document.baseURI).toString(); } catch(_) { return path; } }

  // Loader UI
  const Loader = (() => {
    const box = () => $("#loading-box"), text = () => $("#loading-text"), fill = () => $("#loading-fill");
    let done=0,total=0, queue=[];
    function show(){ const b=box(); if (b) b.style.display="flex"; }
    function hide(){ const b=box(); if (b) b.style.display="none"; }
    function label(s){ const t=text(); if (t) t.textContent=s||""; }
    function draw(){ const f=fill(); if (!f) return; const p = total? (done/total) : 0; f.style.width=(p*100).toFixed(1)+"%"; }
    function add(lbl,fn){ queue.push({lbl,fn}); total=queue.length; }
    async function run(){ show(); draw(); for(const s of queue){ label(s.lbl); draw(); try{ await s.fn(); }catch(e){ warn("step failed:", s.lbl, e); } done++; draw(); } label("Finalizing…"); draw(); await new Promise(r=>setTimeout(r,120)); hide(); }
    function reset(){ queue.length=0; done=0; total=0; draw(); }
    return { add, run, reset, show, hide, label };
  })();

  // State
  let engine, scene, camera, light;

  // Helpers
  function toRad(d){ return d*Math.PI/180; }
  function localToWorld(v, def){
    const s=(def?.scale ?? 1), yaw=toRad(def?.rotationY ?? 0);
    const cos=Math.cos(yaw), sin=Math.sin(yaw);
    const x=(v?.x??0)*s, y=(v?.y??0)*s, z=(v?.z??0)*s;
    const xr=x*cos - z*sin, zr=x*sin + z*cos;
    return new BABYLON.Vector3((def?.offset?.x??0)+xr, (def?.offset?.y??0)+y, (def?.offset?.z??0)+zr);
  }

  async function fetchJSON(url){
    try{
      const r=await fetch(docResolve(url), {cache:"no-store"});
      if (!r.ok) throw new Error(r.status+" "+r.statusText);
      return await r.json();
    }catch(e){ warn("fetchJSON fail:", url, e); return null; }
  }

  // Manifest
  let MAPS = [];
  async function loadManifest(){
    const j = await fetchJSON("./assets/models/map/maps.json");
    if (Array.isArray(j)) MAPS = j;
    else if (j && Array.isArray(j.maps)) MAPS = j.maps;
    if (!MAPS.length && window.INDEX3?.MAPS_MANIFEST_FALLBACK) MAPS = INDEX3.MAPS_MANIFEST_FALLBACK.slice();

    const sel = $("#map-select");
    if (sel){
      sel.innerHTML = MAPS.length ? MAPS.map((m,i)=>`<option value="${i}">${m.title || m.file}</option>`).join("") : `<option value="-1">(no maps)</option>`;
      try{
        const saved = localStorage.getItem("selectedMapIndex");
        sel.value = (saved && MAPS[+saved]) ? saved : "0";
      }catch(_){ sel.value = "0"; }
      sel.onchange = ()=>{ try { localStorage.setItem("selectedMapIndex", sel.value); } catch(_){} };
    }
    log("Manifest:", MAPS);
  }
  function getSelected(){ const sel=$("#map-select"); const i = Math.max(0, Math.min(MAPS.length-1, parseInt(sel?.value||"0",10)||0)); return MAPS[i]; }

  // Engine+scene
  async function prepareEngineScene(){
    const canvas = document.getElementById("renderCanvas");
    engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer:true, stencil:true });
    scene = new BABYLON.Scene(engine);
    scene.collisionsEnabled = true;
    scene.gravity = new BABYLON.Vector3(0, -0.35, 0);

    // Camera (first-person)
    camera = new BABYLON.UniversalCamera("playerCam", new BABYLON.Vector3(0, 1.8, 0), scene);
    camera.minZ = 0.1;
    camera.applyGravity = true;
    camera.checkCollisions = true;
    camera.ellipsoid = new BABYLON.Vector3(0.35, 0.9, 0.35);
    camera.ellipsoidOffset = new BABYLON.Vector3(0, 0.4, 0);

    camera.inputs.clear();
    camera.inputs.addMouse();     // natural mouse
    camera.inputs.addKeyboard();  // WASD + arrows
    camera.angularSensibility = 1200;
    camera.speed = 0.6;

    light = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.45;

    engine.runRenderLoop(()=> scene.render());
    window.addEventListener("resize", ()=> engine.resize());

    if (window.INDEX3?.attachXYZHud) INDEX3.attachXYZHud(scene);
  }

  // Map defs registry
  function getMapDefFor(defName){
    if (!defName) return null;
    return (window.MAP_DEFS && window.MAP_DEFS[defName]) ? window.MAP_DEFS[defName] : null;
  }

  async function loadMapDef(chosen){
    const file = chosen?.file || "Abandoned_House.glb";
    const baseNoExt = file.replace(/\.[^.]+$/, "");
    const candidates = [];
    if (chosen?.def) candidates.push(`./assets/models/map/${chosen.def}`);
    candidates.push(`./assets/models/map/${baseNoExt}.js`);
    candidates.push(`./assets/models/map/${baseNoExt}.config.js`);

    for (const c of candidates){
      const ok = await new Promise(res=>{
        const s=document.createElement("script");
        s.src=docResolve(c)+`?v=${Date.now()}`;
        s.async=true; s.onload=()=>res(true); s.onerror=()=>res(false); document.head.appendChild(s);
      });
      if (ok && window.MAP_DEF && MAP_DEF.spawn) { log("Loaded external MAP_DEF:", c, MAP_DEF); return window.MAP_DEF; }
    }

    // Registered?
    const reg = getMapDefFor(chosen?.def);
    if (reg) { window.MAP_DEF = reg; log("Using registered MAP_DEF:", chosen.def, reg); return reg; }

    // Synthesize minimal
    warn("No MAP_DEF found; synthesizing.");
    window.MAP_DEF = { title:file, file, scale:1, rotationY:0, offset:{x:0,y:0,z:0}, spawn:{x:0,y:1.8,z:0} };
    return window.MAP_DEF;
  }

  async function importMapGLB(chosen){
    const file = chosen?.file || "Abandoned_House.glb";
    try{
      const res = await BABYLON.SceneLoader.ImportMeshAsync("", "./assets/models/map/", file, scene);
      res.meshes.forEach(m=>{ try{ m.checkCollisions = true; m.receiveShadows = true; }catch(_){} });
      log("Map imported:", file, "meshes:", res.meshes.length);
      // If nothing renders, at least we keep a ground
      if (!res.meshes.length) {
        const g = BABYLON.MeshBuilder.CreateGround("fallback", {width:200, height:200}, scene);
        g.checkCollisions = true;
      }
    }catch(e){
      warn("Map import failed; creating fallback ground.", e);
      const g = BABYLON.MeshBuilder.CreateGround("fallback", {width:200, height:200}, scene);
      g.checkCollisions = true;
    }
  }

  function enforceSpawn(){
    const def = window.MAP_DEF || {};
    const ws = def.vanZone?.spawn ? localToWorld(def.vanZone.spawn, def) :
               def.spawn ? localToWorld(def.spawn, def) :
               new BABYLON.Vector3(0,1.8,0);
    camera.position.copyFrom(ws);
    camera.setTarget(ws.add(new BABYLON.Vector3(0,1,2)));
    log("Spawn WS:", ws.toString());
  }

  function enablePointerLock(){
    const canvas = document.getElementById("renderCanvas");
    if (!canvas || !canvas.requestPointerLock) return;
    canvas.addEventListener("click", ()=>{
      if (document.pointerLockElement !== canvas){
        try{ canvas.requestPointerLock(); }catch(_) {}
      }
    });
    document.addEventListener("pointerlockchange", ()=>{
      if (document.pointerLockElement !== canvas){
        try { (window.toast || (m=>console.log(m)))("Click the view to lock mouse"); } catch(_) {}
      }
    });
  }

  // Start flow
  let started = false;
  async function startGame(e){
    e?.preventDefault?.();
    if (started) return;
    started = true;

    const title=$("#title-screen"); if (title) title.style.display="none";

    Loader.reset();
    Loader.add("Loading map list…", loadManifest);
    Loader.add("Preparing engine…", prepareEngineScene);
    Loader.add("Loading selected map…", async ()=>{
      const chosen = getSelected();
      log("Selected:", chosen);
      await loadMapDef(chosen);
      await importMapGLB(chosen);
    });
    Loader.add("Enforcing spawn…", async ()=> enforceSpawn());
    Loader.add("Pointer lock…", async ()=> enablePointerLock());
    Loader.add("Inventory UI…", async ()=> window.INDEX3?.initInventoryUI && INDEX3.initInventoryUI());
    Loader.add("Sounds…", async ()=> window.INDEX3?.Sound && INDEX3.Sound.load(scene));

    await Loader.run();

    try{ INDEX3.Sound.playAmb(); }catch(_){}
    try{ document.getElementById("renderCanvas").focus(); }catch(_){}
  }

  (function wire(){
    const btn=$("#start-button"); if (btn) btn.addEventListener("click", startGame, {passive:false});
    document.addEventListener("keydown",(e)=>{ if(!started && (e.key==="Enter"||e.code==="Space")){ e.preventDefault(); startGame(e); }},{passive:false});
    window.addEventListener("DOMContentLoaded", ()=> { loadManifest().catch(()=>{}); });
  })();
})();
