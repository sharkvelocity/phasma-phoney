// movement_rig_clean.js
// First-person WASD + optional third-person toggle (V). Pointer lock + touch support.
// No placeholders; safe guards so it runs even if loaded before scene exists.

(function(){
  'use strict';
  if (window.__MovementRigReady) return; window.__MovementRigReady = true;

  // --- Config ---
  const SPAWN = new BABYLON.Vector3(0, 1.8, 0);
  const SPEED_WALK = 1.8, SPEED_RUN = 3.2;
  const STEP_UP_MAX = 0.45;
  const LOOK_SENS = 0.0025;
  const TP_DISTANCE = 3.6;

  const K = {fw:0,bk:0,lt:0,rt:0,up:0,dn:0,run:false};
  let pointerLocked = false;

  const canvas = () => document.getElementById('renderCanvas') || document.querySelector('canvas');

  function S(){ return window.scene || BABYLON.Engine?.LastCreatedScene || (window.ENGINE && ENGINE.scenes && ENGINE.scenes[0]) || null; }
  function isArc(cam){ return !!(cam && cam.alpha!==undefined && cam.beta!==undefined && cam.radius!==undefined); }
  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

  // --- Keyboard ---
  function keyMap(e){
    const k=(e.key||'').toLowerCase(), c=e.code||'';
    if (c==='KeyW'||k==='w'||c==='ArrowUp') return 'fw';
    if (c==='KeyS'||k==='s'||c==='ArrowDown') return 'bk';
    if (c==='KeyA'||k==='a'||c==='ArrowLeft') return 'lt';
    if (c==='KeyD'||k==='d'||c==='ArrowRight') return 'rt';
    if (c==='ShiftLeft'||c==='ShiftRight'||k==='shift') return 'run';
    if (c==='KeyV'||k==='v') return 'toggleView';
    return null;
  }
  function onKD(e){
    const tag = keyMap(e);
    if (!tag) return;
    if (tag==='toggleView'){ e.preventDefault(); toggleView(); return; }
    if (tag==='run'){ K.run=true; e.preventDefault(); return; }
    if (tag==='fw'){ K.fw=1; e.preventDefault(); }
    if (tag==='bk'){ K.bk=1; e.preventDefault(); }
    if (tag==='lt'){ K.lt=1; e.preventDefault(); }
    if (tag==='rt'){ K.rt=1; e.preventDefault(); }
  }
  function onKU(e){
    const tag = keyMap(e);
    if (!tag) return;
    if (tag==='run'){ K.run=false; e.preventDefault(); return; }
    if (tag==='fw'){ K.fw=0; e.preventDefault(); }
    if (tag==='bk'){ K.bk=0; e.preventDefault(); }
    if (tag==='lt'){ K.lt=0; e.preventDefault(); }
    if (tag==='rt'){ K.rt=0; e.preventDefault(); }
  }
  window.addEventListener('keydown', onKD, true);
  window.addEventListener('keyup',   onKU, true);

  // --- Pointer lock + mouse look ---
  (function bindMouse(){
    const c = canvas(); if (!c) return;
    function lock(){ try{ c.requestPointerLock && c.requestPointerLock(); }catch(_){ } }
    c.addEventListener('click', lock);
    document.addEventListener('pointerlockchange', ()=>{
      pointerLocked = (document.pointerLockElement === c);
    }, true);
    window.addEventListener('mousemove', ev=>{
      try{
        const s=S(); const cam=s?.activeCamera; if (!cam || isArc(cam)) return;
        if (!pointerLocked) return;
        const dx = ev.movementX||0, dy = ev.movementY||0;
        cam.cameraRotation = cam.cameraRotation || new BABYLON.Vector2(0,0);
        cam.cameraRotation.y += -dx*LOOK_SENS;
        cam.cameraRotation.x += -dy*LOOK_SENS;
        cam.rotation = cam.rotation || new BABYLON.Vector3(0,0,0);
        // apply to Free/Universal camera
        cam.rotation.y = (cam.rotation.y||0) + -dx*LOOK_SENS;
        const minPitch = -Math.PI/2 + 0.15, maxPitch = Math.PI/2 - 0.15;
        cam.rotation.x = clamp((cam.rotation.x||0) + -dy*LOOK_SENS, minPitch, maxPitch);
      }catch(_){}
    }, true);
  })();

  // --- Rig creation ---
  function ensureRig(s){
    if (!s.__playerBody){
      const body = BABYLON.MeshBuilder.CreateCapsule('player_capsule',{height:1.8,radius:0.35,tessellation:8,capSubdivisions:4},s);
      body.checkCollisions=true; body.visibility=0; body.isPickable=false;
      body.position = SPAWN.clone();
      s.__playerBody = body;
    }
    if (!s.__playerRig){
      const rig = new BABYLON.TransformNode('PlayerRig', s);
      rig.parent = s.__playerBody; s.__playerRig = rig;
    }
    let fps = s.getCameraByName && s.getCameraByName('FPCam');
    if (!fps){
      fps = new BABYLON.UniversalCamera('FPCam', new BABYLON.Vector3(0,1.6,0), s);
      fps.parent = s.__playerRig; fps.minZ=0.1; fps.speed=0; fps.inertia=0; fps.angularSensibility=4000;
      try{ fps.attachControl(canvas(), true); }catch(_){}
      s.cameras && s.cameras.indexOf(fps)===-1 && s.cameras.push(fps);
    }
    let arc = s.getCameraByName && s.getCameraByName('TPCam');
    if (!arc){
      arc = new BABYLON.ArcRotateCamera('TPCam', -Math.PI/2, 1.2, TP_DISTANCE, s.__playerBody.position.clone(), s);
      arc.lowerBetaLimit=0.3; arc.upperBetaLimit=1.45; arc.lowerRadiusLimit=2.4; arc.upperRadiusLimit=7.5; arc.wheelPrecision=60;
      try{ arc.attachControl(canvas(), true); }catch(_){}
      s.cameras && s.cameras.indexOf(arc)===-1 && s.cameras.push(arc);
    }
    arc.lockedTarget = s.__playerBody;
    arc.radius = clamp(arc.radius||TP_DISTANCE, 3.0, 6.0);
    arc.alpha = -Math.PI/2; arc.beta = 1.2;
    return {fps, arc};
  }

  function fwd(cam){ try{ const v=cam.getDirection(BABYLON.Axis.Z); v.y=0; v.normalize(); return v; }catch(_){ return new BABYLON.Vector3(0,0,1); } }
  function right(cam){ try{ const v=cam.getDirection(BABYLON.Axis.X); v.y=0; v.normalize(); return v; }catch(_){ return new BABYLON.Vector3(1,0,0); } }

  function attachLoop(s){
    if (s.__movementLoop) return; s.__movementLoop = true;
    s.onBeforeRenderObservable.add(function(){
      const cam=s.activeCamera; if(!cam) return;
      const body=s.__playerBody; if(!body) return;

      // sync FPS cam node with Babylon rotation scheme
      if (!isArc(cam)){
        const rot = cam.rotation || new BABYLON.Vector3(0,0,0);
        const cr = cam.cameraRotation || new BABYLON.Vector2(0,0);
        rot.y += cr.y; rot.x += cr.x; cam.cameraRotation = new BABYLON.Vector2(0,0);
        const minPitch = -Math.PI/2 + 0.15, maxPitch = Math.PI/2 - 0.15;
        rot.x = clamp(rot.x, minPitch, maxPitch);
        cam.rotation = rot;
      }

      // compose movement
      const z = (K.fw?1:0) + (K.bk?-1:0);
      const x = (K.rt?1:0) + (K.lt?-1:0);
      let v=new BABYLON.Vector3(0,0,0);
      const fw=fwd(cam), rt=right(cam);
      if (z!==0) v.addInPlace(fw.scale(z));
      if (x!==0) v.addInPlace(rt.scale(x));
      const len=v.length();
      if (len>0){
        v.scaleInPlace(1/len);
        const eng=s.getEngine&&s.getEngine()||window.ENGINE;
        const dt=((eng&&eng.getDeltaTime)?eng.getDeltaTime():16.7)/1000;
        const sp=(K.run?SPEED_RUN:SPEED_WALK)*dt;
        const d=v.scale(sp);

        // step-up probe
        const next = body.position.add(d);
        const probe = next.add(new BABYLON.Vector3(0, STEP_UP_MAX, 0));
        let patchedY = null;
        try{
          const ray = new BABYLON.Ray(probe, new BABYLON.Vector3(0,-1,0), STEP_UP_MAX+0.65);
          const hit = s.pickWithRay(ray, m=>m && m.isPickable!==false);
          if (hit?.hit && hit.pickedPoint){
            const y = hit.pickedPoint.y + 1.0;
            const dy = y - body.position.y;
            if (dy <= STEP_UP_MAX) patchedY = y;
          }
        }catch(_){}
        if (patchedY !== null){
          const delta = next.subtract(body.position); delta.y = 0;
          body.moveWithCollisions ? body.moveWithCollisions(delta) : body.position.addInPlace(delta);
          body.position.y = patchedY;
        } else {
          try{ body.moveWithCollisions ? body.moveWithCollisions(d) : body.position.addInPlace(d); }catch(_){}
        }
      }

      // keep FPS camera node riding the body
      try{
        const fps = s.getCameraByName('FPCam');
        if (fps) { fps.parent = s.__playerRig; s.__playerRig.parent = s.__playerBody; }
      }catch(_){}

      // expose
      if (!window.camera) window.camera = s.activeCamera;
      if (window.camera && !isArc(window.camera)){ window.camera.position = s.__playerRig.getAbsolutePosition().add(new BABYLON.Vector3(0,0,0)); }
    });
  }

  function toggleView(){
    const s=S(); if(!s) return;
    const {fps,arc} = ensureRig(s); if (!fps||!arc) return;
    if (isArc(s.activeCamera)){
      s.activeCamera = fps; try{ fps.attachControl(canvas(), true); }catch(_){}
    } else {
      arc.lockedTarget = s.__playerBody;
      arc.radius = clamp(arc.radius||TP_DISTANCE, 3.0, 6.0);
      arc.alpha = -Math.PI/2; arc.beta = 1.2;
      s.activeCamera = arc; try{ arc.attachControl(canvas(), true); }catch(_){}
    }
    window.camera = s.activeCamera;
  }
  window.toggleThirdPerson = toggleView;

  function whenReady(cb){ (function tick(){ const s=S(); if (s && s.activeCamera){ try{ cb(s); }catch(_){ } return; } requestAnimationFrame(tick); })(); }
  whenReady(function(s){
    const cams = ensureRig(s);
    s.activeCamera = cams.fps; window.camera = cams.fps;
    s.__playerBody.position = SPAWN.clone();
    attachLoop(s);
  });
})();
