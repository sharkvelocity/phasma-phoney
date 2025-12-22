// builder_camera_fix.js v1.3 — top-down ORTHO + basement clamp + stable zoom
(function(){
  "use strict";
  const S = ()=> window.scene || window.SCENE || BABYLON.Engine?.LastCreatedScene;
  const C = ()=> S()?.activeCamera;
  const CLAMP = { margin: 0.01 };

  // Configure this before/anytime: window.BUILDER_BASEMENT_Y = -3;
  function getBasementY(){
    const v = (window.BUILDER_BASEMENT_Y ??
               (window.BUILDER_LEVELS && window.BUILDER_LEVELS.basementY));
    return (typeof v === 'number') ? v : -3; // sensible default if not set
  }

  function ensureTopDownOrtho(){
    const s = S(); if (!s) return setTimeout(ensureTopDownOrtho, 50);

    // Create/normalize to ArcRotateCamera in ORTHOGRAPHIC mode
    let cam = C();
    if (!(cam instanceof BABYLON.ArcRotateCamera)) {
      cam = new BABYLON.ArcRotateCamera("TopCam", 0, Math.PI/2, 60, BABYLON.Vector3.Zero(), s);
      s.activeCamera = cam;
      cam.attachControl(s.getEngine().getRenderingCanvas(), true);
    }

    // Top-down lock
    cam.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
    cam.alpha = 0;
    cam.beta  = Math.PI/2;
    cam.lowerBetaLimit = cam.upperBetaLimit = Math.PI/2; // no tilt
    cam.panningAxis = new BABYLON.Vector3(1, 0, 1);      // XZ only (no vertical pan)
    cam.panningSensibility = 250;
    cam.inertia = 0;

    // "Zoom" via radius scalar (used to size ortho frustum)
    cam.radius = Math.max(20, cam.radius || 60);
    cam.lowerRadiusLimit = 5;
    cam.upperRadiusLimit = 2000;

    // Broad clipping planes so nothing pops when zooming
    cam.minZ = 0.01;
    cam.maxZ = 100000;

    const canvas = s.getEngine().getRenderingCanvas();
    function applyOrthoFromRadius(){
      const aspect = Math.max(0.01, canvas.clientWidth / Math.max(1, canvas.clientHeight));
      const halfH = cam.radius;            // treat radius as half-height
      const halfW = halfH * aspect;
      cam.orthoLeft   = -halfW;
      cam.orthoRight  =  halfW;
      cam.orthoTop    =  halfH;
      cam.orthoBottom = -halfH;
    }

    function clampToBasement(){
      const minY = getBasementY() + CLAMP.margin;
      // Keep the camera target and actual position at/above the basement plane
      if (cam.target && cam.target.y < minY) {
        cam.target.y = minY;
        // Rebuild position from alpha/beta/radius relative to new target
        if (cam.rebuildAnglesAndRadius) cam.rebuildAnglesAndRadius();
      }
      if (cam.position && cam.position.y < minY) {
        cam.position.y = minY;
      }
    }

    // Initial sizing & clamp
    applyOrthoFromRadius();
    clampToBasement();

    // Keep ground/floor meshes always active so they never get culled
    try {
      (s.meshes||[]).forEach(m=>{
        if (!m || !m.name) return;
        if (/builder.*ground|ground|floor|base/i.test(m.name)) m.alwaysSelectAsActiveMesh = true;
        if (m.metadata && m.metadata.builderGround) m.alwaysSelectAsActiveMesh = true;
      });
    } catch {}

    // React to canvas size / camera updates
    s.onResizeObservable.add(applyOrthoFromRadius);
    cam.onViewMatrixChangedObservable.add(()=>{
      applyOrthoFromRadius();
      clampToBasement();
    });
    cam.onAfterCheckInputsObservable.add(()=>{
      // Clamp zoom range and re-apply ortho bounds
      if (cam.radius < cam.lowerRadiusLimit) cam.radius = cam.lowerRadiusLimit;
      if (cam.radius > cam.upperRadiusLimit) cam.radius = cam.upperRadiusLimit;
      applyOrthoFromRadius();
      clampToBasement();
    });

    // Extra safety: enforce clamp every frame
    s.onBeforeRenderObservable.add(clampToBasement);

    // Optional: gentle wheel scaling
    const canvasEl = s.getEngine().getRenderingCanvas();
    canvasEl.addEventListener('wheel', ()=>{
      // After Babylon processes wheel, our onAfterCheckInputs + onBeforeRender will clamp
      // so we don't need to preventDefault here.
    }, { passive:true });

    // Export handles so you can adjust later
    window.BUILDER_TOPDOWN_CAM = cam;
    window.setBasementLevel = function(y){
      window.BUILDER_BASEMENT_Y = +y || 0;
      clampToBasement();
    };
  }

  const boot = setInterval(()=>{
    if (S()) { clearInterval(boot); ensureTopDownOrtho(); }
  }, 50);
})();