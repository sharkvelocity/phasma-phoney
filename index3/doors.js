// ./assets/index3/doors.js
// Runtime helper for door configs authored in Dev Tools. Uses window.DOORS if present.

(function(){
  "use strict";

  function easingFromName(name){
    let e;
    switch(name){
      case 'CubicInOut': e = new BABYLON.CubicEase(); e.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT); break;
      case 'SineInOut':  e = new BABYLON.SineEase();  e.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT); break;
      case 'BackOut':    e = new BABYLON.BackEase();  e.setEasingMode(BABYLON.EasingFunction.EASEOUT); break;
      default:           e = null;
    }
    return e;
  }
  function ensureQuat(mesh){
    if (!mesh.rotationQuaternion){
      const e = mesh.rotation || new BABYLON.Vector3(0,0,0);
      mesh.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(e.x, e.y, e.z);
      mesh.rotation = new BABYLON.Vector3(0,0,0);
    }
  }
  function setPivotWorld(mesh, p){
    mesh.setPivotPoint(new BABYLON.Vector3(p.x,p.y,p.z), BABYLON.Space.WORLD);
  }

  // Registry
  window.DoorRuntime = window.DoorRuntime || { byName:{} };

  // Call after your GLB is appended
  window.applyDoorsConfig = function(scene, doors){
    (doors||window.DOORS||[]).forEach(d=>{
      const mesh = scene.getMeshByName(d.name) || scene.getNodeByName(d.name);
      if (!mesh) return;
      setPivotWorld(mesh, d.pivotWorld);
      ensureQuat(mesh);
      DoorRuntime.byName[d.name] = { open:false, mesh, cfg:d };
    });
  };

  window.toggleDoor = function(name, open){
    const ent = DoorRuntime.byName[name]; if (!ent) return;
    const { mesh, cfg } = ent;
    const deltaDeg = open ? cfg.openAngleDeg : -cfg.openAngleDeg;
    const axisVec = cfg.axis==='X'? BABYLON.Axis.X : cfg.axis==='Z'? BABYLON.Axis.Z : BABYLON.Axis.Y;
    const fps = 60, frames=60, secs=Math.max(0.05, cfg.durationMs/1000), speedRatio=1/secs;
    const q0 = mesh.rotationQuaternion.clone();
    const q1 = q0.multiply(BABYLON.Quaternion.RotationAxis(axisVec, BABYLON.Tools.ToRadians(deltaDeg)));
    const anim = new BABYLON.Animation('doorQ','rotationQuaternion',fps,BABYLON.Animation.ANIMATIONTYPE_QUATERNION,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    anim.setKeys([{frame:0,value:q0},{frame:frames,value:q1}]);
    const easing = easingFromName(cfg.easing); if (easing) anim.setEasingFunction(easing);
    const scene = mesh.getScene?.()||BABYLON.Engine.LastCreatedScene;
    const a = scene.beginDirectAnimation(mesh,[anim],0,frames,false,speedRatio);
    a.onAnimationEndObservable.add(()=>{ ent.open = !!open; });
  };

  // Convenience: E to toggle the nearest door (<= 2m)
  window.toggleNearestDoor = function(maxDist=2.0){
    const cam = window.camera, scene = cam?.getScene?.(); if (!cam||!scene) return;
    let best=null, bestD=1e9;
    for (const name in DoorRuntime.byName){
      const ent = DoorRuntime.byName[name];
      const pos = ent.mesh.getAbsolutePosition?.()||ent.mesh.position;
      const d = BABYLON.Vector3.Distance(cam.position, pos);
      if (d < bestD && d <= maxDist){ best=ent; bestD=d; }
    }
    if (best){ window.toggleDoor(best.mesh.name, !best.open); }
  };

  // Optional: bind key
  window.addEventListener('keydown', (e)=>{
    if (e.key === 'e' || e.key === 'E'){
      try{ window.toggleNearestDoor?.(); }catch(_){}
    }
  });

})();
