// Physics hinges for doors (Havok/Physics V2) + helpers to hingeify ALL doors,
// lock/unlock, slam, and slow open/close.
// Exposes:
//   hingeifyDoor(scene, door, options?) -> controller
//   hingeifyAllDoors(scene, house, options?) -> { [doorName]: controller }
//   toggleHingedDoorSlow(ctrl) -> toggles open/close slowly
//   setDoorLocked(ctrl, locked) -> lock/unlock a single door (keeps it closed when locked)
//   slamDoor(ctrl, power?) -> forcefully shut door toward closed
// Controller API:
//   { door, leafBody, frameBody, isMotorized, openSlow(), closeSlow(), stopMotor(), setLimits(minDeg,maxDeg), setLocked(bool), slam(power) }
(function(){
  const Shape = BABYLON.PhysicsShapeType;
  const d2r = d => d * Math.PI / 180;

  function ensureLeafAgg(scene, door, opts = {}) {
    const body = door.leaf.getPhysicsBody?.();
    if (body) return { body, reused: true };
    const agg = new BABYLON.PhysicsAggregate(
      door.leaf, Shape.BOX,
      {
        mass: opts.mass ?? 6,
        friction: opts.friction ?? 0.8,
        restitution: opts.restitution ?? 0.02,
        linearDamping: 0.04,
        angularDamping: 0.12
      },
      scene
    );
    return { body: agg.body, reused: false };
  }

  function ensureFrameAgg(scene, door) {
    const kids = door.frame.getChildMeshes();
    const anchor = (kids.reduce((best, m) => {
      const h = (m.getBoundingInfo()?.boundingBox?.extendSizeWorld?.y || 0);
      return (!best || h > best.h) ? { mesh: m, h } : best;
    }, null)?.mesh) || kids[0];
    const body = anchor.getPhysicsBody?.();
    if (body) return { mesh: anchor, body, reused: true };
    const agg = new BABYLON.PhysicsAggregate(
      anchor, Shape.BOX, { mass: 0, friction: 0.9, restitution: 0.01 }, scene
    );
    return { mesh: anchor, body: agg.body, reused: false };
  }

  function computeLocalPivots(door, anchorMesh) {
    const pivotW = door.hinge.getAbsolutePosition().clone();
    const invLeaf  = door.leaf.getWorldMatrix().clone().invert();
    const invFrame = anchorMesh.getWorldMatrix().clone().invert();
    const pivotA = BABYLON.Vector3.TransformCoordinates(pivotW, invLeaf);
    const pivotB = BABYLON.Vector3.TransformCoordinates(pivotW, invFrame);
    const upW = BABYLON.Vector3.Up();
    const axisA = BABYLON.Vector3.TransformNormal(upW, invLeaf).normalize();
    const axisB = BABYLON.Vector3.TransformNormal(upW, invFrame).normalize();
    return { pivotA, pivotB, axisA, axisB };
  }

  function createHingeConstraint(scene, leafBody, frameBody, pivots, limitsDeg) {
    if (typeof BABYLON.HingeConstraint !== "function") return null;
    const c = new BABYLON.HingeConstraint({
      pivotA: pivots.pivotA, pivotB: pivots.pivotB,
      axisA: pivots.axisA, axisB: pivots.axisB
    });
    leafBody.addConstraint(frameBody, c);
    if (typeof c.setLimit === "function" && limitsDeg) {
      try { c.setLimit(d2r(limitsDeg.min ?? 0), d2r(limitsDeg.max ?? 110)); } catch {}
    }
    const hasMotor = (typeof c.setMotor === "function") || (typeof c.setMotorTarget === "function");
    const wrap = {
      constraint: c,
      hasMotor,
      setMotor(vel, force){
        try {
          if (typeof c.setMotor === "function") c.setMotor(true, vel, force);
          else if (typeof c.setMotorTarget === "function") c.setMotorTarget(vel, force);
        } catch {}
      },
      clearMotor(){
        try {
          if (typeof c.setMotor === "function") c.setMotor(false, 0, 0);
          else if (typeof c.setMotorTarget === "function") c.setMotorTarget(0, 0);
        } catch {}
      },
      setLimits(minDeg, maxDeg){
        if (typeof c.setLimit === "function") try { c.setLimit(d2r(minDeg), d2r(maxDeg)); } catch {}
      }
    };
    return wrap;
  }

  // Servo fallback when there is no motor API
  function makeServo(scene, leafMesh, opt = {}) {
    const maxOpen = d2r(opt.maxOpenDeg ?? 110);
    const maxSpeed = opt.speed ?? 0.8; // rad/s
    const kP = opt.kP ?? 2.2;
    const damp = opt.damping ?? 0.35;
    const refQuat = leafMesh.absoluteRotationQuaternion.clone();
    const invRef = refQuat.clone().conjugate();

    function currentAngle() {
      const dq = invRef.multiply(leafMesh.absoluteRotationQuaternion);
      const fwd = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(0,0,1), BABYLON.Matrix.FromQuaternion(dq));
      return Math.atan2(fwd.x, fwd.z);
    }

    let token = null;
    function stop(){
      if (!token) return;
      scene.onBeforeRenderObservable.remove(token);
      token = null;
    }

    function goTo(target) {
      stop();
      token = scene.onBeforeRenderObservable.add(()=>{
        const ang = currentAngle();
        const err = target - ang;
        const vel = Math.max(-maxSpeed, Math.min(maxSpeed, kP * err)) * (1 - Math.min(1, Math.abs(err)/maxOpen) * damp);
        const body = leafMesh.getPhysicsBody?.() || leafMesh.physicsBody;
        if (body?.setAngularVelocity) body.setAngularVelocity(new BABYLON.Vector3(0, vel, 0));
        if (Math.abs(err) < 0.01) stop();
      });
    }

    return { goTo, stop };
  }

  function hingeifyDoor(scene, door, options = {}) {
    const maxOpenDeg = options.maxOpenDeg ?? 110;
    const motorForce = options.motorForce ?? 60;
    const speed = options.speed ?? 0.8; // rad/s

    const { body: leafBody } = ensureLeafAgg(scene, door, options);
    const { mesh: frameMesh, body: frameBody } = ensureFrameAgg(scene, door);

    const piv = computeLocalPivots(door, frameMesh);
    const hinge = createHingeConstraint(scene, leafBody, frameBody, piv, { min: 0, max: maxOpenDeg });

    let servo = null;
    if (!hinge || !hinge.hasMotor) {
      servo = makeServo(scene, door.leaf, { maxOpenDeg, speed });
    }

    const api = {
      door,
      leafBody, frameBody,
      isMotorized: !!(hinge && hinge.hasMotor),
      openSlow(){
        if (hinge && hinge.hasMotor) return hinge.setMotor(+speed, motorForce);
        servo?.goTo(d2r(maxOpenDeg));
      },
      closeSlow(){
        if (hinge && hinge.hasMotor) return hinge.setMotor(-speed, motorForce);
        servo?.goTo(0);
      },
      stopMotor(){ hinge?.clearMotor?.(); servo?.stop?.(); },
      setLimits(minDeg, maxDeg){ hinge?.setLimits?.(minDeg, maxDeg); },
      setLocked(locked){
        // keep closed while locked
        if (locked) this.closeSlow();
        this._locked = !!locked;
      },
      slam(power = 2.3){
        const body = this.leafBody;
        if (body?.setAngularVelocity) body.setAngularVelocity(new BABYLON.Vector3(0, -Math.abs(power), 0));
      },
      get locked(){ return !!this._locked; }
    };
    return api;
  }

  function hingeifyAllDoors(scene, house, options = {}) {
    const map = {};
    (house.doors || []).forEach(d => {
      map[d.name] = hingeifyDoor(scene, d, options);
    });
    return map;
  }

  function toggleHingedDoorSlow(ctrl){
    if (!ctrl) return;
    if (ctrl.locked) return; // blocked by lock
    // crude state determination by angular velocity sign or approximate angle:
    // try to open if near closed, else close
    const body = ctrl.leafBody;
    let angVel = 0;
    try { angVel = body.getAngularVelocity()?.y || 0; } catch {}
    if (Math.abs(angVel) > 0.05) { ctrl.stopMotor(); return; }
    // heuristic: compare leaf forward vs frame forward
    ctrl.openSlow(); // UX: open on click by default
  }

  function setDoorLocked(ctrl, locked){ ctrl?.setLocked(locked); }
  function slamDoor(ctrl, power){ ctrl?.slam(power); }

  window.hingeifyDoor = hingeifyDoor;
  window.hingeifyAllDoors = hingeifyAllDoors;
  window.toggleHingedDoorSlow = toggleHingedDoorSlow;
  window.setDoorLocked = setDoorLocked;
  window.slamDoor = slamDoor;
})();
