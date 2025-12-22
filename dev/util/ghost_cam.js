// ./assets/dev/util/ghost_cam.js — v1.2
// Picture-in-picture camera that shows what the ghost sees (or over-shoulder).
// Independent of ghost visibility/alpha and resilient to scene/camera resets.

(function(){
  "use strict";
  if (window.GHOST_CAM && window.GHOST_CAM.__v === "1.2") return;

  const SCENE  = ()=> window.scene || BABYLON.Engine?.LastCreatedScene;
  const MAIN   = ()=> window.camera || SCENE()?.activeCamera;
  const v3     = (x,y,z)=> new BABYLON.Vector3(x,y,z);
  const toast  = (m,ms=900)=> (window.toast? window.toast(m,ms) : console.log("[ghost-cam]", m));

  const ST = {
    s: null,
    cam: null,
    enabled: false,
    mode: "pov", // "pov" | "over"
    vp: { x:0.77, y:0.70, w:0.22, h:0.28 }, // bottom-right PIP
    obs: null,
    keepAliveObs: null
  };

  function ghostRoot(){
    // Prefer the dev-selected root; otherwise use whatever the runtime created
    if (window.PREFERRED_GHOST_ROOT && !window.PREFERRED_GHOST_ROOT.isDisposed?.()) return window.PREFERRED_GHOST_ROOT;
    // Try to infer from ghostCtrl state
    try{
      const gs = window.ghostCtrl?.getState?.();
      // We don't get the node directly, so search for a transform named GhostRoot*
      const s = SCENE(); if (!s) return null;
      const roots = s.transformNodes?.filter(n=>/^GhostRoot/i.test(n.name)) || [];
      return roots.length ? roots[0] : null;
    }catch{ return null; }
  }

  function ensureCamera(){
    const s = ST.s = SCENE(); if (!s) return null;
    // Reuse if alive
    if (ST.cam && !ST.cam.isDisposed()) return ST.cam;

    const main = MAIN();
    const cam = new BABYLON.FreeCamera("GhostPIP", v3(0,1.6,0), s, true);
    cam.minZ = 0.05;
    cam.maxZ = 2000;
    cam.fov  = 0.9;
    cam.layerMask = main?.layerMask ?? 0x0FFFFFFF;
    cam.viewport = new BABYLON.Viewport(ST.vp.x, ST.vp.y, ST.vp.w, ST.vp.h);
    cam.attachControl?.(false); // no input
    cam.inputs?.clear?.();      // make sure user cannot move this cam
    cam.getViewMatrix();        // warm up

    ST.cam = cam;
    return cam;
  }

  function enable(){
    const s = SCENE(); const main = MAIN();
    if (!s || !main) return;

    const cam = ensureCamera();
    if (!cam) return;

    // Make it a true PIP: activeCameras includes both
    const list = (s.activeCameras && s.activeCameras.length)
      ? s.activeCameras.slice()
      : [main];

    // Remove duplicates then append our cam
    const uniq = [];
    list.forEach(c=> { if (c && !uniq.includes(c)) uniq.push(c); });
    if (!uniq.includes(cam)) uniq.push(cam);

    s.activeCameras = uniq;

    // Keep viewport where we want it
    cam.viewport = new BABYLON.Viewport(ST.vp.x, ST.vp.y, ST.vp.w, ST.vp.h);

    if (!ST.obs){
      ST.obs = s.onBeforeRenderObservable.add(update);
    }
    if (!ST.keepAliveObs){
      // If something resets activeCameras, put ours back in on the next frame
      ST.keepAliveObs = s.onAfterRenderObservable.add(()=>{
        if (!s.activeCameras || s.activeCameras.length === 0){
          const m = MAIN(); if (m) s.activeCameras = [m];
        }
        if (s.activeCameras && !s.activeCameras.includes(ST.cam)){
          const arr = s.activeCameras.slice(); arr.push(ST.cam); s.activeCameras = arr;
        }
      });
    }

    ST.enabled = true;
    toast("Ghost Cam: ON");
  }

  function disable(){
    const s = SCENE(); if (!s) return;
    if (ST.obs){ s.onBeforeRenderObservable.remove(ST.obs); ST.obs = null; }
    if (ST.keepAliveObs){ s.onAfterRenderObservable.remove(ST.keepAliveObs); ST.keepAliveObs = null; }
    // Remove our camera from activeCameras but keep main
    if (s.activeCameras && ST.cam){
      s.activeCameras = s.activeCameras.filter(c=> c && c !== ST.cam);
    }
    ST.enabled = false;
    toast("Ghost Cam: OFF");
  }

  function toggle(){ ST.enabled ? disable() : enable(); }

  function setMode(m){
    ST.mode = (m === "over") ? "over" : "pov";
    toast("Ghost Cam mode: " + ST.mode.toUpperCase());
  }

  function cycleMode(){
    setMode(ST.mode === "pov" ? "over" : "pov");
  }

  function update(){
    const s = ST.s || SCENE(); if (!s) return;
    const cam = ST.cam || ensureCamera(); if (!cam) return;
    const root = ghostRoot(); if (!root) return;

    // Position/orient based on mode
    if (ST.mode === "pov"){
      // POV at ~eye height, a bit forward from root center
      const up = root.up || BABYLON.Axis.Y;
      const headOffset = v3(0, 1.6, 0); // relative to ghost origin
      // derive forward from root's rotation; we assume Y-rotation for heading
      const ry = root.rotationQuaternion ? BABYLON.Quaternion.FromRotationMatrix(root.getWorldMatrix()).toEulerAngles().y
                                         : (root.rotation?.y || 0);
      const fwd = v3(Math.sin(ry), 0, Math.cos(ry));
      const pos = root.getAbsolutePosition().add(headOffset).add(fwd.scale(0.05)); // tiny nose offset
      cam.position.copyFrom(pos);
      // look toward where the ghost is moving/looking
      const target = pos.add(fwd);
      cam.setTarget(target, true);
      cam.upVector.copyFrom(up);
    } else {
      // Over-shoulder: a little behind and above the ghost
      const ry = root.rotationQuaternion ? BABYLON.Quaternion.FromRotationMatrix(root.getWorldMatrix()).toEulerAngles().y
                                         : (root.rotation?.y || 0);
      const back = v3(-Math.sin(ry), 0, -Math.cos(ry));
      const pos = root.getAbsolutePosition()
        .add(back.scale(1.2))   // behind
        .add(v3(0, 1.8, 0));    // above
      cam.position.copyFrom(pos);
      const look = root.getAbsolutePosition().add(v3(0, 1.4, 0));
      cam.setTarget(look, true);
    }

    // Maintain viewport & layer mask in case main camera changed
    const main = MAIN();
    cam.layerMask = main?.layerMask ?? cam.layerMask;
    cam.viewport = new BABYLON.Viewport(ST.vp.x, ST.vp.y, ST.vp.w, ST.vp.h);
  }

  // Hotkeys
  window.addEventListener("keydown", (e)=>{
    if (e.altKey && (e.code === "KeyC" || e.key === "c" || e.key === "C")){
      if (e.shiftKey) cycleMode();
      else toggle();
    }
  });

  // Minimal API
  window.GHOST_CAM = {
    __v: "1.2",
    enable, disable, toggle, setMode, cycleMode,
    setViewport(x, y, w, h){
      ST.vp = { x, y, w, h };
      if (ST.cam) ST.cam.viewport = new BABYLON.Viewport(x, y, w, h);
    }
  };

  // Lazy boot: wait until scene exists, then create cam (disabled by default)
  const boot = setInterval(()=>{
    try{
      if (SCENE() && MAIN()){
        clearInterval(boot);
        ensureCamera(); // create but keep disabled until user toggles
      }
    }catch{}
  }, 150);
})();
