// ./assets/index3/house_procedural.js
// Procedural 2-story house + basement with working door meshes for Babylon.js
// Public API:
//   const house = buildProceduralHouse(scene, options?)
//   enableDoorClickToggles(scene, house.doors, opts?)
//
// returns:
//   {
//     root,                     // TransformNode for whole house
//     floors: [{slab, y}],      // floor slabs
//     walls: [meshes...],       // all wall meshes
//     rooms: [{name, bounds}],  // simple metadata
//     stairs: [{root, steps}],
//     doors: [{root, leaf, frame, hinge, state, name}],
//     materials: {...}
//   }

(function () {
  // ---------- helpers ----------
  function deg2rad(d) { return d * Math.PI / 180; }
  function rad2deg(r) { return r * 180 / Math.PI; }

  // Make a basic PBR-like material fast
  function makeMat(scene, name, color3) {
    const mat = new BABYLON.StandardMaterial(name, scene);
    mat.diffuseColor = color3 || new BABYLON.Color3(0.85, 0.87, 0.92);
    mat.specularColor = new BABYLON.Color3(0.04, 0.04, 0.04);
    mat.backFaceCulling = true;
    return mat;
  }

  function setCollision(mesh, yes = true) {
    mesh.checkCollisions = !!yes;
    return mesh;
  }

  // Create a rectangular slab (floor/ceiling) as a thin box
  function createSlab(scene, name, w, d, t, y, mat, parent) {
    const slab = BABYLON.MeshBuilder.CreateBox(name, { width: w, depth: d, height: t }, scene);
    slab.position.y = y;
    slab.material = mat;
    if (parent) slab.parent = parent;
    setCollision(slab, true);
    return slab;
  }

  // Create a wall segment as a box (no CSG) sized to avoid door holes
  function createWallSegment(scene, name, length, height, thickness, pos, rotY, mat, parent) {
    const wall = BABYLON.MeshBuilder.CreateBox(name, {
      width: length,
      height: height,
      depth: thickness
    }, scene);
    wall.position.copyFrom(pos);
    wall.rotation.y = rotY || 0;
    wall.material = mat;
    if (parent) wall.parent = parent;
    setCollision(wall, true);
    return wall;
  }

  // Create a door set (frame + hinged leaf). Returns {root, frame, leaf, hinge, state}
  // axis: "X" (door plane extends along X, hinge at +/-X edge) or "Z"
  function createDoor(scene, name, width, height, thickness, axis, openAngleDeg, matFrame, matLeaf, parent) {
    const root = new BABYLON.TransformNode(name + "_root", scene);
    if (parent) root.parent = parent;

    // Frame (as a simple thin box above door + sides)
    const frameGroup = new BABYLON.TransformNode(name + "_frameRoot", scene);
    frameGroup.parent = root;

    const jambThickness = Math.max(thickness, 0.08);
    const headHeight = Math.max(thickness, 0.08);

    // Sides
    const sideLen = height;
    const sideDepth = jambThickness;
    const sideWide = jambThickness;
    const side1 = BABYLON.MeshBuilder.CreateBox(name + "_frameSideL", {
      width: sideWide,
      height: sideLen,
      depth: sideDepth
    }, scene);
    const side2 = side1.clone(name + "_frameSideR");

    // Head
    const head = BABYLON.MeshBuilder.CreateBox(name + "_frameHead", {
      width: axis === "X" ? width : jambThickness,
      height: headHeight,
      depth: axis === "X" ? jambThickness : width
    }, scene);

    // Position frame parts around (0,0,0) opening
    // We'll think of the opening centered at origin in the frameGroup local space
    side1.parent = frameGroup;
    side2.parent = frameGroup;
    head.parent = frameGroup;

    if (axis === "X") {
      side1.position.set(-width / 2 - sideWide / 2, height / 2, 0);
      side2.position.set(+width / 2 + sideWide / 2, height / 2, 0);
      head.position.set(0, height + headHeight / 2, 0);
    } else { // "Z"
      side1.position.set(0, height / 2, -width / 2 - sideWide / 2);
      side2.position.set(0, height / 2, +width / 2 + sideWide / 2);
      head.position.set(0, height + headHeight / 2, 0);
    }

    const frameMat = matFrame || makeMat(scene, name + "_frameMat", new BABYLON.Color3(0.75, 0.75, 0.78));
    side1.material = frameMat;
    side2.material = frameMat;
    head.material = frameMat;
    setCollision(side1, true);
    setCollision(side2, true);
    setCollision(head, true);

    // Leaf (the actual door)
    const leaf = BABYLON.MeshBuilder.CreateBox(name + "_leaf", {
      width: axis === "X" ? width : thickness,
      height: height,
      depth: axis === "X" ? thickness : width
    }, scene);

    const hinge = new BABYLON.TransformNode(name + "_hinge", scene);
    hinge.parent = root;

    // Place the leaf so its hinge edge aligns with hinge pivot
    if (axis === "X") {
      // leaf centered initially, shift so hinge at left edge (x = -width/2) meets hinge at origin
      leaf.position.x = + (width / 2);
    } else {
      leaf.position.z = + (width / 2);
    }
    leaf.position.y = height / 2;

    leaf.parent = hinge;

    const leafMat = matLeaf || makeMat(scene, name + "_leafMat", new BABYLON.Color3(0.58, 0.58, 0.60));
    leaf.material = leafMat;
    setCollision(leaf, true);

    // Default door state
    const state = {
      isOpen: false,
      openAngle: deg2rad(openAngleDeg || 90),
      axis: axis === "X" ? "y" : "y", // rotate around Y for both orientations
    };

    return { root, frame: frameGroup, leaf, hinge, state, name };
  }

  // Animate a door open/close
  function animateDoor(scene, door, open, seconds) {
    if (!door || !door.hinge) return;
    const fps = 60;
    const frames = Math.max(1, Math.floor((seconds || 0.25) * fps));

    const start = door.hinge.rotation.y;
    const target = open ? door.state.openAngle : 0;

    const anim = new BABYLON.Animation(
      door.name + "_doorSwing",
      "rotation.y",
      fps,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const keys = [
      { frame: 0, value: start },
      { frame: frames, value: target }
    ];
    anim.setKeys(keys);
    door.hinge.animations = [anim];

    scene.beginAnimation(door.hinge, 0, frames, false);
    door.state.isOpen = open;
  }

  // Create a straight staircase via stepped boxes
  function createStairs(scene, name, options, parent) {
    const {
      width = 1.2, totalRise = 3.0, totalRun = 3.6,
      riser = 0.18, tread = 0.28, thickness = 0.04,
      direction = new BABYLON.Vector3(0, 0, 1),
      startPosition = new BABYLON.Vector3(0, 0, 0),
    } = options || {};

    const root = new BABYLON.TransformNode(name + "_stairs", scene);
    if (parent) root.parent = parent;

    const steps = [];
    const stepCount = Math.max(1, Math.round(totalRise / riser));
    const actualRiser = totalRise / stepCount;
    const actualTread = totalRun / stepCount;

    const dirNorm = direction.normalize();

    for (let i = 0; i < stepCount; i++) {
      const step = BABYLON.MeshBuilder.CreateBox(name + "_step_" + i, {
        width: width,
        height: thickness,
        depth: actualTread
      }, scene);
      step.parent = root;
      // Position each step up and forward
      const upY = (i + 1) * actualRiser;
      const forwardOffset = (i + 0.5) * actualTread; // center of each step
      const offset = dirNorm.scale(forwardOffset);
      step.position = startPosition.add(new BABYLON.Vector3(offset.x, upY, offset.z));
      setCollision(step, true);
      steps.push(step);
    }

    const mat = makeMat(scene, name + "_stepMat", new BABYLON.Color3(0.75, 0.74, 0.72));
    steps.forEach(s => s.material = mat);

    return { root, steps };
  }

  // Build a rectangular ring of walls with optional doorway openings
  // openings: array of { wall: "N"|"S"|"E"|"W", offset: meters from wall center (right positive), width, height }
  function buildPerimeterWalls(scene, parent, opts) {
    const {
      name = "Walls",
      w = 12, d = 10, h = 3, t = 0.2, y = 0,
      mat
    } = opts;

    // Four walls: N (+z), S (-z), E (+x), W (-x)
    // We'll create walls by splitting segments around openings (no CSG).
    const walls = [];
    const wallMat = mat || makeMat(scene, name + "_mat", new BABYLON.Color3(0.88, 0.88, 0.92));

    function segmentsForWall(totalLen, openingsOnThisWall) {
      if (!openingsOnThisWall || openingsOnThisWall.length === 0) {
        return [{ cx: 0, half: totalLen / 2 }];
      }
      // Convert openings into gaps along the wall's local X axis (centered at 0)
      const gaps = openingsOnThisWall.map(o => ({ left: o.offset - o.width / 2, right: o.offset + o.width / 2 }))
        .sort((a, b) => a.left - b.left);

      const segs = [];
      let lastRight = -totalLen / 2;
      gaps.forEach(g => {
        const left = Math.max(g.left, -totalLen / 2);
        const right = Math.min(g.right, totalLen / 2);
        if (left > lastRight) {
          const halfLen = (left - lastRight) / 2;
          const cx = lastRight + halfLen;
          segs.push({ cx, half: halfLen });
        }
        lastRight = right;
      });
      // trailing segment
      if (lastRight < totalLen / 2) {
        const halfLen = (totalLen / 2 - lastRight) / 2;
        const cx = lastRight + halfLen;
        segs.push({ cx, half: halfLen });
      }
      return segs;
    }

    const openMap = { N: [], S: [], E: [], W: [] };
    (opts.openings || []).forEach(o => openMap[o.wall]?.push(o));

    // North wall (+z)
    const nSegs = segmentsForWall(w, openMap.N);
    nSegs.forEach((s, i) => {
      const seg = createWallSegment(scene, `${name}_N_${i}`, s.half * 2, h, t,
        new BABYLON.Vector3(s.cx, y + h / 2, d / 2), 0, wallMat, parent);
      walls.push(seg);
    });

    // South wall (-z)
    const sSegs = segmentsForWall(w, openMap.S);
    sSegs.forEach((s, i) => {
      const seg = createWallSegment(scene, `${name}_S_${i}`, s.half * 2, h, t,
        new BABYLON.Vector3(s.cx, y + h / 2, -d / 2), 0, wallMat, parent);
      walls.push(seg);
    });

    // East wall (+x) — rotate 90° and use length = d
    const eSegs = segmentsForWall(d, openMap.E);
    eSegs.forEach((s, i) => {
      const seg = createWallSegment(scene, `${name}_E_${i}`, s.half * 2, h, t,
        new BABYLON.Vector3(w / 2, y + h / 2, s.cx), Math.PI / 2, wallMat, parent);
      walls.push(seg);
    });

    // West wall (-x)
    const wSegs = segmentsForWall(d, openMap.W);
    wSegs.forEach((s, i) => {
      const seg = createWallSegment(scene, `${name}_W_${i}`, s.half * 2, h, t,
        new BABYLON.Vector3(-w / 2, y + h / 2, s.cx), Math.PI / 2, wallMat, parent);
      walls.push(seg);
    });

    return walls;
  }

  // Build inner partition wall (simple straight run) with optional door opening (we place door mesh instead of hole)
  function buildPartition(scene, parent, opts) {
    const {
      name = "Partition",
      start = new BABYLON.Vector3(0, 0, 0),
      end = new BABYLON.Vector3(4, 0, 0),
      height = 3, thickness = 0.16,
      mat
    } = opts;

    const run = end.subtract(start);
    const length = run.length();
    const rotY = Math.atan2(run.x, run.z); // direction
    const mid = BABYLON.Vector3.Center(start, end);
    const wall = createWallSegment(scene, name, length, height, thickness,
      new BABYLON.Vector3(mid.x, start.y + height / 2, mid.z), rotY, mat, parent);
    return wall;
  }

  // ---------- MAIN BUILDER ----------
  function buildProceduralHouse(scene, options) {
    const opts = Object.assign({
      rootName: "ProceduralHouse",
      // footprint
      width: 12, depth: 10,
      wallThickness: 0.2,
      floorHeight: 3.0,
      slabThickness: 0.18,
      basementDepth: 2.7,
      // door defaults
      doorWidth: 0.9, doorHeight: 2.0, doorThickness: 0.05,
    }, options || {});

    const root = new BABYLON.TransformNode(opts.rootName, scene);

    const materials = {
      floor: makeMat(scene, "mat_floor", new BABYLON.Color3(0.86, 0.86, 0.86)),
      wall: makeMat(scene, "mat_wall", new BABYLON.Color3(0.92, 0.93, 0.96)),
      exterior: makeMat(scene, "mat_ext", new BABYLON.Color3(0.82, 0.84, 0.90)),
      frame: makeMat(scene, "mat_frame", new BABYLON.Color3(0.72, 0.72, 0.76)),
      leaf: makeMat(scene, "mat_leaf", new BABYLON.Color3(0.60, 0.60, 0.64)),
      stair: makeMat(scene, "mat_stair", new BABYLON.Color3(0.75, 0.74, 0.72))
    };

    const floors = [];
    const walls = [];
    const rooms = [];
    const doors = [];
    const stairs = [];

    const W = opts.width;
    const D = opts.depth;
    const H = opts.floorHeight;
    const T = opts.wallThickness;
    const SLAB = opts.slabThickness;
    const BASE = opts.basementDepth;

    // --- SLABS (Basement floor, Ground floor slab, Second floor slab) ---
    const basementFloorY = -BASE;
    const groundFloorY = 0;
    const secondFloorY = H;
    const roofY = 2 * H;

    // Basement floor slab
    floors.push({ slab: createSlab(scene, "BasementFloor", W, D, SLAB, basementFloorY + SLAB / 2, materials.floor, root), y: basementFloorY });
    // Ground floor slab (acts as basement ceiling)
    floors.push({ slab: createSlab(scene, "GroundFloor", W, D, SLAB, groundFloorY + SLAB / 2, materials.floor, root), y: groundFloorY });
    // Second floor slab (acts as ground ceiling)
    floors.push({ slab: createSlab(scene, "SecondFloor", W, D, SLAB, secondFloorY + SLAB / 2, materials.floor, root), y: secondFloorY });
    // (Optional) simple roof slab
    floors.push({ slab: createSlab(scene, "Roof", W + 0.4, D + 0.4, SLAB, roofY + SLAB / 2, materials.floor, root), y: roofY });

    // --- EXTERIOR WALLS FOR EACH LEVEL (no CSG, split by exterior door openings) ---
    // Exterior front door on Ground (South wall center). Another back door on North.
    const extDoorW = Math.max(0.95, opts.doorWidth);
    const extDoorH = Math.max(2.1, opts.doorHeight);

    // Basement perimeter walls
    walls.push(...buildPerimeterWalls(scene, root, {
      name: "BasementWalls",
      w: W, d: D, h: H, t: T, y: basementFloorY,
      mat: materials.exterior,
      openings: [] // no exterior doors in basement
    }));

    // Ground floor perimeter walls — include front + back doors
    walls.push(...buildPerimeterWalls(scene, root, {
      name: "GroundWalls",
      w: W, d: D, h: H, t: T, y: groundFloorY,
      mat: materials.exterior,
      openings: [
        { wall: "S", offset: 0, width: extDoorW, height: extDoorH }, // front
        { wall: "N", offset: 0, width: extDoorW, height: extDoorH }  // back
      ]
    }));

    // Second floor perimeter walls (no exterior doors)
    walls.push(...buildPerimeterWalls(scene, root, {
      name: "SecondWalls",
      w: W, d: D, h: H, t: T, y: secondFloorY,
      mat: materials.exterior,
      openings: []
    }));

    // --- INTERIOR PARTITIONS (simple layout) ---
    // Ground: hallway along Z, two rooms left/right
    const partMat = materials.wall;

    // Ground hallway wall (splitting E/W)
    walls.push(buildPartition(scene, root, {
      name: "G_HallDivider",
      start: new BABYLON.Vector3(0, groundFloorY, -D / 2 + T),
      end:   new BABYLON.Vector3(0, groundFloorY,  D / 2 - T),
      height: H,
      thickness: T * 0.8,
      mat: partMat
    }));

    // Rooms metadata
    rooms.push({ name: "G_LeftRoom",  bounds: { xMin: -W/2 + T, xMax: 0 - T*0.4, zMin: -D/2 + T, zMax: D/2 - T } });
    rooms.push({ name: "G_RightRoom", bounds: { xMin: 0 + T*0.4,  xMax: W/2 - T,  zMin: -D/2 + T, zMax: D/2 - T } });
    rooms.push({ name: "G_Hall",      bounds: { xMin: -T*0.4,    xMax:  T*0.4,   zMin: -D/2 + T, zMax: D/2 - T } });

    // Second floor: similar split but with an extra small room
    walls.push(buildPartition(scene, root, {
      name: "S_HallDivider",
      start: new BABYLON.Vector3(0, secondFloorY, -D / 2 + T),
      end:   new BABYLON.Vector3(0, secondFloorY,  D / 2 - T),
      height: H,
      thickness: T * 0.8,
      mat: partMat
    }));

    walls.push(buildPartition(scene, root, {
      name: "S_ShortDivider",
      start: new BABYLON.Vector3(-W/4, secondFloorY, 0),
      end:   new BABYLON.Vector3(   0, secondFloorY, 0),
      height: H,
      thickness: T * 0.8,
      mat: partMat
    }));

    rooms.push({ name: "S_LeftRoom",   bounds: { xMin: -W/2 + T, xMax: 0 - T*0.4, zMin: -D/2 + T, zMax: D/2 - T } });
    rooms.push({ name: "S_RightRoom",  bounds: { xMin: 0 + T*0.4, xMax: W/2 - T,  zMin: -D/2 + T, zMax: D/2 - T } });
    rooms.push({ name: "S_SmallRoom",  bounds: { xMin: -W/2 + T, xMax: -W/4,     zMin: -T*0.8,   zMax:  T*0.8 } });

    // Basement split
    walls.push(buildPartition(scene, root, {
      name: "B_Split",
      start: new BABYLON.Vector3(0, basementFloorY, -D/2 + T),
      end:   new BABYLON.Vector3(0, basementFloorY,  D/2 - T),
      height: H,
      thickness: T * 0.8,
      mat: partMat
    }));
    rooms.push({ name: "B_Left", bounds: { xMin: -W/2 + T, xMax: 0 - T*0.4, zMin: -D/2 + T, zMax: D/2 - T } });
    rooms.push({ name: "B_Right",bounds: { xMin: 0 + T*0.4,  xMax: W/2 - T,  zMin: -D/2 + T, zMax: D/2 - T } });

    // --- STAIRS ---
    // Ground -> Second (going North from near South wall, right side)
    const stair1Pos = new BABYLON.Vector3(W/2 - 1.6, groundFloorY, -D/2 + 1.6);
    const upDir = new BABYLON.Vector3(0, 0, 1); // toward +Z
    const stair1 = createStairs(scene, "Stair_G_to_S", {
      width: 1.2, totalRise: H, totalRun: 3.6,
      riser: 0.18, tread: 0.28, thickness: 0.04,
      direction: upDir, startPosition: stair1Pos
    }, root);
    stair1.steps.forEach(s => s.material = materials.stair);
    stairs.push(stair1);

    // Ground -> Basement (going South from near North wall, left side)
    const stair2Pos = new BABYLON.Vector3(-W/2 + 1.6, basementFloorY, D/2 - 1.6);
    const downDir = new BABYLON.Vector3(0, 0, -1); // toward -Z (but we place at basement level for simplicity)
    const stair2 = createStairs(scene, "Stair_G_to_B", {
      width: 1.2, totalRise: H, totalRun: 3.6,
      riser: 0.18, tread: 0.28, thickness: 0.04,
      direction: downDir, startPosition: stair2Pos
    }, root);
    stair2.steps.forEach(s => s.material = materials.stair);
    stairs.push(stair2);

    // (Note: we didn’t cut slab holes; pathing is open above steps by simply not placing interior ceilings over stairs.
    // In a later pass you can refine slabs to leave rectangular voids where stairs are.)

    // --- DOORS ---
    // Exterior doors: South (front) at ground 0, North (back)
    function placeDoorAt(worldPos, axis /* "X" or "Z" */, floorY, name) {
      const d = createDoor(scene, name, extDoorW, extDoorH, opts.doorThickness, axis, 95, materials.frame, materials.leaf, root);
      d.root.position.set(worldPos.x, floorY, worldPos.z);

      // Position hinge at the edge of the wall thickness; leaf sits inside
      // For axis "Z" (door opening on a N/S wall), hinge is at local -x so rotate leaf around Y
      if (axis === "Z") {
        d.hinge.position = new BABYLON.Vector3(-extDoorW / 2, 0, 0);
        // orient leaf plane so its thin side aligns with wall
        d.leaf.rotation.y = Math.PI / 2;
      } else { // axis "X" (door on E/W wall)
        d.hinge.position = new BABYLON.Vector3(0, 0, -extDoorW / 2);
        // orient accordingly
        d.leaf.rotation.y = 0;
      }

      doors.push(d);
      return d;
    }

    // Front door (South wall center, axis Z)
    placeDoorAt(new BABYLON.Vector3(0, 0, -D/2 + T/2), "Z", groundFloorY, "Door_Front");
    // Back door (North wall center)
    placeDoorAt(new BABYLON.Vector3(0, 0,  D/2 - T/2), "Z", groundFloorY, "Door_Back");

    // Interior doors (ground): from hall to left/right rooms
    function placeInteriorDoorXZ(x, z, y, onNSWall, name) {
      const axis = onNSWall ? "Z" : "X";
      const d = createDoor(scene, name, opts.doorWidth, opts.doorHeight, opts.doorThickness, axis, 95, materials.frame, materials.leaf, root);
      d.root.position.set(x, y, z);

      if (axis === "Z") {
        d.hinge.position = new BABYLON.Vector3(-opts.doorWidth / 2, 0, 0);
        d.leaf.rotation.y = Math.PI / 2;
      } else {
        d.hinge.position = new BABYLON.Vector3(0, 0, -opts.doorWidth / 2);
        d.leaf.rotation.y = 0;
      }

      doors.push(d);
      return d;
    }

    // Ground: open from hall to each room midpoints
    placeInteriorDoorXZ(-T*0.6, 0, groundFloorY, true,  "Door_G_Left");
    placeInteriorDoorXZ( T*0.6, 0, groundFloorY, true,  "Door_G_Right");

    // Second: similar
    placeInteriorDoorXZ(-T*0.6, 0, secondFloorY, true,  "Door_S_Left");
    placeInteriorDoorXZ( T*0.6, 0, secondFloorY, true,  "Door_S_Right");
    // Small room door (on E/W short divider)
    placeInteriorDoorXZ(-W/8,  -T*0.6, secondFloorY, false, "Door_S_Small");

    // Basement doors (two rooms)
    placeInteriorDoorXZ(-T*0.6, 0, basementFloorY, true,  "Door_B_Left");
    placeInteriorDoorXZ( T*0.6, 0, basementFloorY, true,  "Door_B_Right");

    // Collision on frames/leaf already set; also make frames a tad thicker visually:
    doors.forEach(d => {
      d.frame.getChildMeshes().forEach(m => setCollision(m, true));
      d.leaf.isPickable = true;     // so ray picks the door leaf
      d.frame.isPickable = true;    // frame clickable too
      d.hinge.isPickable = false;
    });

    // Return bundle
    return {
      root,
      materials,
      floors,
      walls,
      rooms,
      stairs,
      doors,
      // small helpers:
      openDoor: (door, secs) => animateDoor(scene, door, true, secs),
      closeDoor: (door, secs) => animateDoor(scene, door, false, secs),
      setAllCollision: (on) => {
        floors.forEach(f => setCollision(f.slab, on));
        walls.forEach(w => setCollision(w, on));
        doors.forEach(d => { setCollision(d.leaf, on); d.frame.getChildMeshes().forEach(m => setCollision(m, on)); });
      }
    };
  }

  // Enable simple click-to-toggle for a list of doors
  function enableDoorClickToggles(scene, doors, opts) {
    const openSeconds = (opts && opts.openSeconds) || 0.25;
    const openAngleDeg = (opts && opts.openAngleDeg) || 95;

    doors.forEach(d => { d.state.openAngle = deg2rad(openAngleDeg); });

    const pickObserver = scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type !== BABYLON.PointerEventTypes.POINTERDOWN) return;
      const pick = scene.pick(scene.pointerX, scene.pointerY);
      if (!pick || !pick.hit || !pick.pickedMesh) return;

      // Find which door this mesh belongs to
      const mesh = pick.pickedMesh;
      const door = doors.find(d =>
        mesh === d.leaf ||
        mesh === d.frame ||
        (d.frame && d.frame.getChildMeshes().includes(mesh))
      );
      if (!door) return;

      animateDoor(scene, door, !door.state.isOpen, openSeconds);
    });
    return () => scene.onPointerObservable.remove(pickObserver);
  }

  // Expose to window
  window.buildProceduralHouse = buildProceduralHouse;
  window.enableDoorClickToggles = enableDoorClickToggles;
})();
