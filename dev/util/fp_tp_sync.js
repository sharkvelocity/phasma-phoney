/* fp_tp_sync.js — single-rig FP/TP with no rubberbanding
   - Camera inputs cleared; we own mouse look + WASD
   - rigRoot -> yaw -> head ; camera attaches to head (FP) or trails (TP)
   - Toggle view: V ; Shift+V cycles TP distance
*/
(function(){
  if (window.__FP_TP_SYNC_V2__) return; window.__FP_TP_SYNC_V2__ = true;

  const log  = (...a)=>{ try{ console.log("[fp/tp v2]", ...a);}catch(_){} };
  const warn = (...a)=>{ try{ console.warn("[fp/tp v2]", ...a);}catch(_){} };
  const toRad = d => d * Math.PI / 180;
  const clamp = (v,min,max)=> Math.max(min, Math.min(max,v));

  const S = {
    rigRoot:null, yaw:null, head:null, body:null,
    mode:"fp",
    tpIdx:1, tpDists:[2.6,3.6,4.8,6.0],
    yaw:0, pitch:0,
    keys:{}, speed:2.8, sprint:1.7, jump:0, velY:0,
    gravity:-9.8, grounded:true,
    running:false
  };

  function scene(){ return window.scene || (BABYLON.Engine && BABYLON.Engine.LastCreatedScene) || null; }
  function cam(){ const s=scene(); return s && s.activeCamera; }

  function ensureRig(s){
    if (S.rigRoot) return;
    const c = cam();
    const start = (window.PP?.cfg?.spawnWS?.clone?.()) || (c?.position?.clone?.()) || new BABYLON.Vector3(0,1.8,0);

    const rigRoot = new BABYLON.TransformNode("rigRoot", s);
    rigRoot.position.copyFrom(start);

    const yaw = new BABYLON.TransformNode("rigYaw", s);
    yaw.parent = rigRoot;

    const head = new BABYLON.TransformNode("rigHead", s);
    head.parent = yaw;
    head.position.set(0, 1.6, 0);

    // Auto-attach player mesh if present
    const body = s.getMeshByName("player_capsule") || s.getMeshByName("player") || null;
    if (body) body.parent = yaw;

    S.rigRoot=rigRoot; S.yawNode=yaw; S.head=head; S.body=body;

    // derive yaw/pitch from existing camera once
    if (c?.rotation){
      S.pitch = c.rotation.x||0;
      S.yaw   = c.rotation.y||0;
    }
    yaw.rotation.y = S.yaw;
  }

  function clearCameraInputs(s){
    const c = cam(); if (!c) return;
    try{ c.inputs.clear(); }catch(_){}
    c.checkCollisions = true;
    c.applyGravity = false;   // we simulate on rig
    c.inertia = 0;
    c.parent = null; // we’ll set parent per mode
  }

  function attachFP(s){
    const c=cam(); if(!c) return;
    c.parent = S.head;
    c.position.set(0,0,0);
    c.rotation.set(0,0,0);  // IMPORTANT: camera local rot is zero in FP
    c.fov = 0.9;
    S.mode="fp";
  }

  function attachTP(s){
    const c=cam(); if(!c) return;
    c.parent = null;
    const d = S.tpDists[S.tpIdx]||3.6;
    const headWS = S.head.getAbsolutePosition();
    const yaw=S.yaw, cos=Math.cos(yaw), sin=Math.sin(yaw);
    const back = new BABYLON.Vector3(-sin*d, 0.25, -cos*d);
    const pos = headWS.add(back);
    c.position.copyFrom(pos);
    c.setTarget(headWS);
    c.fov=0.9;
    S.mode="tp";
  }

  function toggleView(s, cycleOnly){
    if (S.mode==="tp" && cycleOnly){ S.tpIdx=(S.tpIdx+1)%S.tpDists.length; attachTP(s); return; }
    if (S.mode==="fp") attachTP(s); else attachFP(s);
  }

  function hookPointer(s){
    const eng = s.getEngine();
    const canvas = eng.getInputElement() || eng.getRenderingCanvas();
    s.onPointerObservable.add((pi)=>{
      if (pi.type !== BABYLON.PointerEventTypes.POINTERMOVE) return;
      if (document.pointerLockElement !== canvas) return;
      const ev = pi.event;
      const dx = ev.movementX||0, dy = ev.movementY||0;
      const sensX = 0.0027, sensY = 0.0022;
      S.yaw   += dx * sensX;
      S.pitch  = clamp(S.pitch + dy * sensY, -toRad(89), toRad(89));
      S.yaw = (S.yaw + Math.PI*2)%(Math.PI*2);
    });
  }

  function hookKeys(s){
    window.addEventListener("keydown",(e)=>{
      const k=e.code;
      if (k==="KeyV"){ toggleView(s, e.shiftKey); e.preventDefault(); return; }
      if (k==="ShiftLeft"||k==="ShiftRight"){ S.keys.shift=true; }
      S.keys[k]=true;
    }, {passive:false});
    window.addEventListener("keyup",(e)=>{
      const k=e.code;
      if (k==="ShiftLeft"||k==="ShiftRight"){ S.keys.shift=false; }
      S.keys[k]=false;
    }, {passive:true});
  }

  function moveRig(dt){
    // yaw-facing basis
    const yaw=S.yaw, cos=Math.cos(yaw), sin=Math.sin(yaw);
    const fwd = new BABYLON.Vector3(-sin, 0, -cos);
    const right= new BABYLON.Vector3(cos, 0, -sin);

    let x=0, z=0;
    if (S.keys["KeyW"]) z += 1;
    if (S.keys["KeyS"]) z -= 1;
    if (S.keys["KeyD"]) x += 1;
    if (S.keys["KeyA"]) x -= 1;

    let spd = S.speed * (S.keys.shift ? S.sprint : 1);
    const dir = new BABYLON.Vector3(0,0,0);
    if (x) dir.addInPlace(right.scale(x));
    if (z) dir.addInPlace(fwd.scale(z));
    if (dir.lengthSquared()>0.0001) dir.normalize();

    const move = dir.scale(spd*dt);
    S.rigRoot.position.addInPlace(move);

    // simple gravity
    if (!S.grounded){
      S.velY += S.gravity * dt;
    }
    S.rigRoot.position.y += S.velY * dt;
    if (S.rigRoot.position.y <= 0.22){ // cheap ground clamp; adapt to map if you have a floor checker
      S.rigRoot.position.y = 0.22;
      S.velY = 0; S.grounded = true;
    }
  }

  function applyRigToNodes(){
    S.yawNodeDirty = true;
    S.yawNode.rotation.y = S.yaw;
    // head carries pitch
    S.head.rotation.x = S.pitch;

    // Place camera from rig
    const c=cam(); if(!c) return;
    if (S.mode==="fp"){
      if (c.parent !== S.head) attachFP(scene());
      // keep local 0 rot; world view comes from head
      c.rotation.set(0,0,0);
      c.position.set(0,0,0);
    } else {
      if (c.parent) c.parent=null;
      const d=S.tpDists[S.tpIdx]||3.6;
      const headWS=S.head.getAbsolutePosition();
      const yaw=S.yaw, cos=Math.cos(yaw), sin=Math.sin(yaw);
      const back=new BABYLON.Vector3(-sin*d, 0.25, -cos*d);
      const pos=headWS.add(back);
      c.position.copyFrom(pos);
      c.setTarget(headWS);
    }
  }

  function loop(){
    const s=scene(); if(!s||!cam()) { setTimeout(loop,120); return; }
    if (!S.running){
      S.running=true;
      ensureRig(s);
      clearCameraInputs(s);
      hookPointer(s);
      hookKeys(s);
      attachFP(s); // default FP
      log("online (FP default)");
    }
    const dt = Math.min(0.05, s.getEngine().getDeltaTime()/1000);
    moveRig(dt);
    applyRigToNodes();
    requestAnimationFrame(loop);
  }
  loop();
})();
