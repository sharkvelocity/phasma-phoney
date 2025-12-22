/* ./assets/dev/tools/dots_system.js
   DOTS Projector — Babylon laser-pointer w/ split-dot effect (GPU-thin-instances)
   - Item icon remains a PNG at ./assets/icons/dots.png (unchanged elsewhere)
   - This module only handles the in-world effect

   API:
     PP.tools.dots.init()
     PP.tools.dots.enable(true|false)
     PP.tools.dots.setEmitter(nodeOrMesh)     // usually the held DOTS item transform
     PP.tools.dots.setSplit({ count, spreadDeg })
     PP.tools.dots.setColor({ r,g,b, alpha }) // floats 0..1
     PP.tools.dots.setMaxDist(meters)
     PP.tools.dots.dispose()
*/

(function(){
  "use strict";
  window.PP = window.PP || {};
  PP.tools = PP.tools || {};
  const V3 = BABYLON.Vector3, Q = BABYLON.Quaternion, M = BABYLON.Matrix;

  const CFG = {
    MAX_DOTS: 520,          // pool size
    RAYS_PER_TICK: 200,     // rays per update (distributed)
    TICK_MS: 90,            // update frequency
    CONE_DEG: 28,           // half-angle for main cone
    SPLIT_COUNT: 9,         // sub-rays around main beam per batch
    SPLIT_SPREAD_DEG: 12,   // spread for split effect (cone around forward)
    DOT_SIZE: 0.055,        // diameter
    MAX_DIST: 18,
    COLOR: new BABYLON.Color3(0.35,1.0,0.8),
    ALPHA: 0.95,
    EMISSIVE_BOOST: 1.0,
    NORMAL_OFFSET: 0.0015,  // lift off surface to avoid z-fight
  };

  const S = {
    scn: null,
    enabled: false,
    emitter: null,    // TransformNode/Mesh giving origin+forward
    mat: null,
    unit: null,       // base plane (disabled), thin instanced
    matrices: null,   // Float32Array for thin instances
    used: 0,
    timer: null,
    lastCam: null,
    // runtime config (mutable)
    coneDeg: CFG.CONE_DEG,
    splitCount: CFG.SPLIT_COUNT,
    splitSpreadDeg: CFG.SPLIT_SPREAD_DEG,
    maxDist: CFG.MAX_DIST,
    color: CFG.COLOR.clone(),
    alpha: CFG.ALPHA
  };

  function scene(){ return window.SCENE || BABYLON.Engine?.LastCreatedScene || null; }

  function ensureMaterial(){
    if (S.mat && !S.mat.isDisposed()) return S.mat;
    const sc = S.scn || scene(); if (!sc) return null;
    const mat = new BABYLON.StandardMaterial("dots_mat", sc);
    mat.disableLighting = true;
    mat.emissiveColor = S.color.scale(CFG.EMISSIVE_BOOST);
    mat.alpha = S.alpha;
    mat.backFaceCulling = false;
    S.mat = mat;
    return mat;
  }

  function ensureMesh(){
    if (S.unit && !S.unit.isDisposed()) return S.unit;
    const sc = S.scn || scene(); if (!sc) return null;

    const unit = BABYLON.MeshBuilder.CreatePlane("dots_unit", { size: CFG.DOT_SIZE }, sc);
    unit.material = ensureMaterial();
    unit.setEnabled(false);
    unit.thinInstanceEnablePicking = false;

    // Preallocate thin instance buffer
    S.matrices = new Float32Array(16 * CFG.MAX_DOTS);
    // Initialize with identity so GPU buffer is valid even when unused
    for (let i=0;i<CFG.MAX_DOTS;i++){
      M.Identity().copyToArray(S.matrices, i*16);
    }
    unit.thinInstanceSetBuffer("matrix", S.matrices, 16, true);
    S.unit = unit;
    return unit;
  }

  function setColor(col){ // {r,g,b,alpha}
    if (col){
      if (typeof col.r === "number") S.color.r = col.r;
      if (typeof col.g === "number") S.color.g = col.g;
      if (typeof col.b === "number") S.color.b = col.b;
      if (typeof col.alpha === "number") S.alpha = col.alpha;
    }
    if (S.mat && !S.mat.isDisposed()){
      S.mat.emissiveColor = S.color.scale(CFG.EMISSIVE_BOOST);
      S.mat.alpha = S.alpha;
    }
  }

  function setMaxDist(m){ if (typeof m === "number" && m>0) S.maxDist = m; }

  function setSplit(o){
    if (!o) return;
    if (typeof o.count === "number") S.splitCount = Math.max(0, Math.floor(o.count));
    if (typeof o.spreadDeg === "number") S.splitSpreadDeg = Math.max(0, o.spreadDeg);
  }

  function setEmitter(node){ S.emitter = node || null; }

  function randomInCone(forward, up, deg){
    // uniform over cone angle deg (half-angle)
    const theta = BABYLON.Angle.FromDegrees(deg).radians();
    const u = Math.random();
    const v = Math.random();
    const cosTheta = 1 - u*(1 - Math.cos(theta));
    const sinTheta = Math.sqrt(1 - cosTheta*cosTheta);
    const phi = 2*Math.PI*v;

    // build orthonormal basis
    const f = forward.normalizeToNew();
    const w = up && up.length() > 0.001 ? up.normalizeToNew() : V3.Up();
    const t = V3.Cross(w, f).normalizeToNew();
    const b = V3.Cross(f, t).normalizeToNew();

    // direction = rotate from forward by (theta, phi)
    return new V3(
      t.x * (Math.cos(phi)*sinTheta) + b.x * (Math.sin(phi)*sinTheta) + f.x * cosTheta,
      t.y * (Math.cos(phi)*sinTheta) + b.y * (Math.sin(phi)*sinTheta) + f.y * cosTheta,
      t.z * (Math.cos(phi)*sinTheta) + b.z * (Math.sin(phi)*sinTheta) + f.z * cosTheta
    ).normalize();
  }

  function raycast(origin, dir){
    const sc = S.scn; if (!sc) return null;
    const ray = new BABYLON.Ray(origin, dir, S.maxDist);
    const hit = sc.pickWithRay(ray, m=>{
      if (!m) return false;
      // ignore non-pickable and invisible helpers
      if (m.isPickable === false) return false;
      const n = (m.name||"").toLowerCase();
      if (/player_capsule|player|camera|dot_unit|dots_unit/.test(n)) return false;
      return true;
    });
    return (hit && hit.hit && hit.pickedPoint) ? hit : null;
  }

  function placeDot(idx, pos, faceTo){
    // orient dot to face camera (billboard) for consistent size/visibility
    const cam = S.scn.activeCamera || S.lastCam || null;
    let rotQ;
    if (cam){
      const toCam = cam.globalPosition.subtract(pos).normalize();
      rotQ = Q.FromLookDirectionLH(toCam, V3.Up());
      S.lastCam = cam;
    } else {
      rotQ = Q.Identity();
    }
    const mat = M.Compose(V3.One(), rotQ, pos);
    mat.copyToArray(S.matrices, idx*16);
  }

  function tick(){
    if (!S.enabled || !S.emitter || !S.scn || !S.unit) return;

    const em = S.emitter;
    const origin = em.getAbsolutePosition ? em.getAbsolutePosition() : (em.position || V3.Zero());
    // forward from emitter
    let fwd = V3.Forward();
    if (em.getDirection) {
      try { fwd = em.getDirection(V3.Forward()); } catch {}
    } else if (em.rotationQuaternion) {
      fwd = V3.TransformNormal(V3.Forward(), em.rotationQuaternion.toRotationMatrix());
    }

    const up = V3.Up();
    const raysThisTick = S.splitCount > 0 ? Math.ceil(CFG.RAYS_PER_TICK / (S.splitCount+1)) : CFG.RAYS_PER_TICK;

    let placed = 0;
    function castRay(dir){
      const hit = raycast(origin, dir);
      if (!hit) return;
      const p = hit.pickedPoint.add(hit.getNormal(true).scale(CFG.NORMAL_OFFSET));
      const idx = S.used % CFG.MAX_DOTS;
      placeDot(idx, p);
      S.used++;
      placed++;
    }

    // main cone rays
    for (let i=0;i<raysThisTick;i++){
      const d = randomInCone(fwd, up, S.coneDeg);
      castRay(d);
    }
    // split effect: additional rays around forward within spread
    for (let s=0; s<S.splitCount; s++){
      for (let i=0;i<Math.max(1, Math.floor(raysThisTick/6)); i++){
        const d = randomInCone(fwd, up, S.splitSpreadDeg);
        castRay(d);
      }
    }

    if (placed>0){
      S.unit.thinInstanceBufferUpdated("matrix");
    }
  }

  function start(){
    stop();
    S.timer = setInterval(tick, CFG.TICK_MS);
    // keep a render-observer to refresh camera reference
    S.scn.onBeforeRenderObservable.add(_keepCamRef);
  }
  function stop(){
    if (S.timer){ clearInterval(S.timer); S.timer = null; }
    try { S.scn.onBeforeRenderObservable.removeCallback(_keepCamRef); } catch {}
  }
  function _keepCamRef(){ S.lastCam = S.scn.activeCamera || S.lastCam; }

  function clearDots(){
    if (!S.unit || !S.matrices) return;
    for (let i=0;i<CFG.MAX_DOTS;i++) M.Identity().copyToArray(S.matrices, i*16);
    S.unit.thinInstanceBufferUpdated("matrix");
    S.used = 0;
  }

  function enable(on){
    S.enabled = !!on;
    if (S.enabled){ start(); } else { stop(); clearDots(); }
  }

  function init(){
    S.scn = scene();
    ensureMaterial();
    ensureMesh();
    // default color each init (if changed previously)
    setColor({ r:S.color.r, g:S.color.g, b:S.color.b, alpha:S.alpha });
  }

  function dispose(){
    stop();
    if (S.unit){ S.unit.dispose(); S.unit = null; }
    if (S.mat){ S.mat.dispose(); S.mat = null; }
    S.matrices = null;
  }

  PP.tools.dots = {
    init, enable, dispose,
    setEmitter, setSplit, setColor, setMaxDist
  };
})();
