// Physics helpers for your procedural house (Physics V2 Aggregates)
(function () {
  const Shape = BABYLON.PhysicsShapeType;

  function makeStatic(mesh, scene, shape = Shape.BOX, opts = {}) {
    return new BABYLON.PhysicsAggregate(
      mesh, shape,
      { mass: 0, friction: 0.9, restitution: 0.05, ...opts },
      scene
    );
  }

  function makeDynamic(mesh, scene, opts = {}) {
    const {
      mass = 2, friction = 0.6, restitution = 0.05,
      shape = Shape.BOX, linearDamping = 0.05, angularDamping = 0.1
    } = opts;
    return new BABYLON.PhysicsAggregate(
      mesh, shape,
      { mass, friction, restitution, linearDamping, angularDamping },
      scene
    );
  }

  function attachPhysicsToHouse(scene, house) {
    if (!scene.getPhysicsEngine()) {
      console.warn("[HousePhysics] Physics not enabled; call enableHavok(scene) first.");
      return;
    }
    // slabs
    (house.floors || []).forEach(f => makeStatic(f.slab, scene));
    // walls
    (house.walls || []).forEach(w => makeStatic(w, scene));
    // stairs
    (house.stairs || []).forEach(s => (s.steps || []).forEach(st => makeStatic(st, scene)));
    // door frames static; door leaf stays animated (no physics) for now
    (house.doors || []).forEach(d => d.frame.getChildMeshes().forEach(m => makeStatic(m, scene)));
    console.log("[HousePhysics] Attached physics to slabs, walls, stairs, frames.");
  }

  // Optional test prop
  function spawnCrate(scene, pos = new BABYLON.Vector3(1, 1.2, 2), size = 0.6) {
    const crate = BABYLON.MeshBuilder.CreateBox("crate", { size }, scene);
    crate.position.copyFrom(pos);
    makeDynamic(crate, scene, { mass: 3, friction: 0.9, restitution: 0.02 });
    return crate;
  }

  function throwForward(mesh, scene, camera, power = 10) {
    const body = mesh.getPhysicsBody?.() || mesh.physicsBody;
    if (!body) return;
    const dir = scene.activeCamera ? scene.activeCamera.getForwardRay().direction.normalize()
                                   : camera.getForwardRay().direction.normalize();
    body.applyImpulse(dir.scale(power), mesh.getAbsolutePosition());
  }

  window.makeStatic = makeStatic;
  window.makeDynamic = makeDynamic;
  window.attachPhysicsToHouse = attachPhysicsToHouse;
  window.spawnCrate = spawnCrate;
  window.throwForward = throwForward;
})();
