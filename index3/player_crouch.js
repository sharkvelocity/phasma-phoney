
// ./assets/index3/player_crouch.js — v1.0
// Keeps current camera height as CROUCH height, and sets STAND height to 2x that.
// Toggle crouch with the Z key. Smoothly lerps camera Y. Updates ellipsoid if present.
(function(){
  "use strict";
  const S = {
    ready:false, s:null, c:null,
    crouchH: null, standH: null, targetH: null,
    isCrouched: true,
    lerpSpeed: 10.0 // higher = snappier
  };
  const SCENE  = ()=> window.scene || BABYLON.Engine?.LastCreatedScene;
  const CAMERA = ()=> window.camera || (SCENE() && SCENE().activeCamera);
  function applyHeight(y){
    const c=S.c; if (!c) return;
    // local Y works both with/without parent
    c.position.y = y;
    // Try to keep collider in sync if the project uses it
    try{
      if (c.ellipsoid){
        // ellipsoid.y is half-height-ish; pick a safe ratio
        c.ellipsoid.y = Math.max(0.5, y * 0.55);
      }
      if (c.ellipsoidOffset){
        c.ellipsoidOffset.y = (c.ellipsoid?.y || 0) * 0.6;
      }
    }catch{}
  }
  function init(){
    if (S.ready) return;
    S.s = SCENE(); S.c = CAMERA(); if (!S.s || !S.c) return;
    // Current height becomes crouch height
    const base = S.c.position?.y ?? 1.0;
    S.crouchH = base;
    // Standing height is double
    const mult = window.PLAYER_STAND_MULT || 2.0;
    S.standH = mult * base;
    // Start crouched (per request)
    S.targetH = S.crouchH;
    S.isCrouched = true;
    applyHeight(S.targetH);
    // Toggle with Z
    window.addEventListener('keydown', (e)=>{
      if (e.repeat) return;
      if (e.code === 'KeyZ' || e.key === 'z' || e.key === 'Z'){
        toggle();
      }
    });
    // Smooth update
    S.s.onBeforeRenderObservable.add(()=>{
      const dt = (S.s.getEngine().getDeltaTime?.()||16.6)/1000;
      const y = S.c.position.y;
      const k = Math.min(1, dt * S.lerpSpeed);
      const ny = y + (S.targetH - y) * k;
      applyHeight(ny);
    });
    // Export small API
    window.PLAYER = Object.assign(window.PLAYER||{}, {
      crouchHeight: S.crouchH,
      standHeight: S.standH,
      isCrouched: ()=>S.isCrouched,
      toggleCrouch: toggle,
      setStandMultiplier: (m)=>{
        if (m > 1){ S.standH = m * S.crouchH; if (!S.isCrouched) S.targetH = S.standH; }
      }
    });
    S.ready = true;
    console.log('[player_crouch] ready', { crouch: S.crouchH, stand: S.standH });
  }
  function toggle(force){
    if (force === true){ S.isCrouched = true;  S.targetH = S.crouchH; return; }
    if (force === false){ S.isCrouched = false; S.targetH = S.standH; return; }
    S.isCrouched = !S.isCrouched;
    S.targetH = S.isCrouched ? S.crouchH : S.standH;
  }
  const boot = setInterval(()=>{ try{ if (SCENE() && CAMERA()){ clearInterval(boot); init(); } }catch{} }, 150);
})();