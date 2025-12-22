// ======================================================================
//  PhasmaPhoney GLUE PATCH
//  Injects Ghost Data + PS5 Controller + Ambient Audio Helpers
// ======================================================================

(function(){
  "use strict";

  // ==============================================================
  // Helpers
  // ==============================================================

  // Distance helper (currently unused)
  function near(a, b, t) {
    return Math.abs(a - b) < t;
  }

  // Convenience for scene/camera
  const SCENE  = () => window.scene || BABYLON.Engine?.LastCreatedScene;
  const CAMERA = () => window.camera || (SCENE() && SCENE().activeCamera);

  // Load external scripts safely
  async function loadScriptOnce(url) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${url}"]`)) {
        resolve(); return;
      }
      const s = document.createElement("script");
      s.src = url;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // ==============================================================
  // Ghost Data + PS5 Injection
  // ==============================================================

  async function injectGhostsAndPS5(){
    try {
      // Ghost Data
      await loadScriptOnce("./assets/dev/ghost/ghost_data.js");
      console.log("[GLUE] ghost_data.js injected");

      // PS5 Controller
      await loadScriptOnce("./assets/dev/ui/ps5_controller.js");
      console.log("[GLUE] ps5_controller.js injected");
    } catch (e) {
      console.error("Failed to inject Ghost/PS5 modules", e);
    }
  }

  // ==============================================================
  // Spirit Box Audio Manager
  // ==============================================================

  function SpiritBoxAudio(scene){
    const files = ["./assets/audio/spiritbox.mp3"];
    const sounds = files.map(f => new BABYLON.Sound("sb", f, scene, null, { loop: true, autoplay: false }));
    let current = null;

    return {
      play(){ 
        if (current) current.stop();
        current = sounds[0]; 
        current.play();
      },
      stop(){ 
        if (current) current.stop(); 
        current = null; 
      }
    };
  }

  // ==============================================================
  // EMF Audio Manager
  // ==============================================================

  function EMFAudio(scene){
    const files = ["./assets/audio/emf.mp3"];
    const sounds = files.map(f => new BABYLON.Sound("emf", f, scene, null, { loop: true, autoplay: false }));
    let current = null;

    return {
      play(){ 
        if (current) current.stop();
        current = sounds[0]; 
        current.play();
      },
      stop(){ 
        if (current) current.stop(); 
        current = null; 
      }
    };
  }

  // ==============================================================
  // Footstep Audio
  // ==============================================================

  function setupFootsteps(scene, camera){
    const stepFiles = ["./assets/audio/step1.wav", "./assets/audio/step2.wav"];
    const sounds = stepFiles.map(f => new BABYLON.Sound("step", f, scene, null, { loop: false, autoplay: false }));
    let lastPos = camera.position.clone();

    scene.onBeforeRenderObservable.add(() => {
      const pos = camera.position;
      const dist = BABYLON.Vector3.Distance(lastPos, pos);
      if (dist > 0.01) {
        const s = sounds[Math.floor(Math.random() * sounds.length)];
        s.play();
        lastPos.copyFrom(pos);
      }
    });
  }

  // ==============================================================
  // Safety Floor (prevents falling through void)
  // ==============================================================

  function addSafetyFloor(scene){
    const ground = BABYLON.MeshBuilder.CreateGround("safetyFloor", {
      width: 24,
      height: 24
    }, scene);
    ground.position.y = 0;
    ground.checkCollisions = true;
    console.log("[GLUE] Safety floor added");
  }

  // ==============================================================
  // Main Boot
  // ==============================================================

  async function run(){
    await injectGhostsAndPS5();

    const s = SCENE();
    const c = CAMERA();
    if (!s || !c){
      console.warn("[GLUE] Scene/camera not ready yet");
      return;
    }

    // Attach audio & floor
    window.SPIRITBOX = SpiritBoxAudio(s);
    window.EMF = EMFAudio(s);
    setupFootsteps(s, c);
    addSafetyFloor(s);

    console.log("[GLUE] Bootstrap complete");
  }

  // Bootstrap runner
  const boot = setInterval(() => {
    try {
      if (SCENE() && CAMERA()){
        clearInterval(boot);
        run();
      }
    } catch(e) { console.error(e); }
  }, 200);

})();
