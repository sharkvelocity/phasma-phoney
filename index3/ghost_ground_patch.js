// ghost_ground_patch.js — v2.0
// Universal "ground cover" helper for PhasmaPhoney.
// - Works in the Builder **and** in the Game (index3).
// - Creates/updates a large wooden floor under your house so the ghost can raycast to valid ground.
// - Registers this floor as a "ground hint" for ghost movement.
//
// Usage (Builder & Game):
//   GhostGroundPatch.run({ margin: 1.0, y: 0.01, name: 'HouseBase_Wood' });
//
// Builder convenience: automatically adds a "Cover Base" button to the project bar.
//
// Public API:
//   GhostGroundPatch.run(opts?)
//   GhostGroundPatch.measure()
//   GhostGroundPatch.ensureButton()
//   GhostGroundPatch.setMaterial({ color?: '#b8860b', textureUrl?: '...jpg' })
//   GhostGroundPatch.__v  -> '2.0'
//
(function(){
  'use strict';
  if (window.GhostGroundPatch && window.GhostGroundPatch.__v === '2.0') return;

  const DEF = {
    name: 'HouseBase_Wood',
    margin: 1.0,
    y: 0.01,
    color: '#8b6b2b',     // wood-ish fallback
    textureUrl: null      // optional: provide your own texture
  };

  const API = {
    __v: '2.0',
    run,
    measure,
    ensureButton,
    setMaterial
  };
  window.GhostGroundPatch = API;

  function sceneReady(){ return window.scene && window.BABYLON; }
  function toast(msg){
    try { if (window.Builder?.toast) return Builder.toast(msg); } catch {}
    console.log('[GhostGroundPatch]', msg);
  }

  // ---- Measure extents from all relevant meshes ----
  function measure(){
    if (!sceneReady()) return null;
    const s = window.scene;
    let min = new BABYLON.Vector3(+Infinity,+Infinity,+Infinity);
    let max = new BABYLON.Vector3(-Infinity,-Infinity,-Infinity);
    let found = false;
    s.meshes.forEach(m=>{
      try{
        // Consider all builder floors/walls and any ghost blockers as "house content"
        const tag = m.metadata?.builder?.type;
        if (tag==='floor' || tag==='wall' || m.metadata?.isGhostBlocker){
          const bb = m.getBoundingInfo().boundingBox;
          min = BABYLON.Vector3.Minimize(min, bb.minimumWorld);
          max = BABYLON.Vector3.Maximize(max, bb.maximumWorld);
          found = true;
        }
      }catch{}
    });
    if (!found) return null;
    return { min, max, sizeX: (max.x-min.x), sizeZ: (max.z-min.z), cx: (min.x+max.x)/2, cz: (min.z+max.z)/2 };
  }

  // ---- Optional material setup (color or texture) ----
  function setMaterial(opts={}){
    if (!sceneReady()) return null;
    const s = window.scene;
    const color = opts.color || DEF.color;
    const textureUrl = opts.textureUrl || DEF.textureUrl;
    const name = 'Mat_'+(opts.name || DEF.name);
    let mat = s.getMaterialByName(name);
    if (!mat){
      mat = new BABYLON.StandardMaterial(name, s);
      mat.specularColor = new BABYLON.Color3(0.1,0.1,0.1);
    }
    if (textureUrl){
      try { mat.diffuseTexture?.dispose(); } catch {}
      mat.diffuseTexture = new BABYLON.Texture(textureUrl, s, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
      mat.diffuseTexture.uScale = 6;
      mat.diffuseTexture.vScale = 6;
    } else {
      const col = BABYLON.Color3.FromHexString(color);
      mat.diffuseColor = col;
    }
    return mat;
  }

  // ---- Main create/update ----
  function run(opts={}){
    if (!sceneReady()) return null;
    const s = window.scene;
    const name   = opts.name   || DEF.name;
    const margin = (opts.margin ?? DEF.margin);
    const y      = (opts.y ?? DEF.y);

    const M = measure();
    if (!M) { alert('Cover Base: No floors/walls found. Build something first.'); return null; }

    const sizeX = M.sizeX + margin*2;
    const sizeZ = M.sizeZ + margin*2;
    const cx = M.cx, cz = M.cz;

    // Replace existing if present
    let floor = s.getMeshByName(name);
    if (floor) { try{ floor.dispose(false,true); }catch{} }

    floor = BABYLON.MeshBuilder.CreateGround(name, { width: sizeX, height: sizeZ, subdivisions: 2 }, s);
    floor.position.set(cx, y, cz);
    floor.checkCollisions = true;
    floor.isPickable = true;

    const mat = setMaterial({ name, color: opts.color, textureUrl: opts.textureUrl });
    floor.material = mat;

    floor.metadata = floor.metadata || {};
    floor.metadata.builder = Object.assign({}, floor.metadata.builder, { type:'floor', size:[sizeX,sizeZ], floorIndex:0 });

    // Register as ground so ghost code hugs it
    try{
      if (typeof window.registerGroundRoots === 'function'){
        window.registerGroundRoots([ new RegExp('^'+name+'$'), /^StartPad_Wood$/, /^Ground_Main$/ ]);
      } else {
        const hints = window.GROUND_NAME_HINTS || [];
        hints.push(new RegExp('^'+name+'$')); hints.push(/^StartPad_Wood$/); hints.push(/^Ground_Main$/);
        window.GROUND_NAME_HINTS = hints;
      }
    }catch{}

    toast(`Ground covered: ${name} ${sizeX.toFixed(1)}×${sizeZ.toFixed(1)}`);
    return floor;
  }

  // ---- Builder convenience button ----
  function ensureButton(){
    if (!sceneReady()) return;
    const bar = document.getElementById('project-bar');
    if (!bar) return;
    if (document.getElementById('btn-cover-base')) return;
    const b = document.createElement('button');
    b.id = 'btn-cover-base';
    b.className = 'btn';
    b.textContent = 'Cover Base';
    b.title = 'Create/Update a large wooden floor under the house (ghost ground)';
    // Insert before download if present
    const before = document.getElementById('proj-download') || bar.lastElementChild;
    bar.insertBefore(b, before);
    b.onclick = ()=> run({});
  }

  // Auto-wire in Builder if present
  (function boot(){
    const tick = setInterval(()=>{
      try{
        if (sceneReady()){
          ensureButton();
          clearInterval(tick);
        }
      }catch{}
    }, 200);
    setTimeout(()=> clearInterval(tick), 8000);
  })();
})();