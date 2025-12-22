// assets/index3/ghost_barrier.js
(function(){
  const S = {
    ready: false,
    segments: [],
    bounds: null,    // {minX,maxX,minZ,maxZ}
    line: null,
    walls: []
  };

  function computeBounds(segments){
    let minX= Infinity, maxX= -Infinity, minZ= Infinity, maxZ= -Infinity;
    for (const s of segments){
      for (const p of [s.a, s.b]){
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.z < minZ) minZ = p.z;
        if (p.z > maxZ) maxZ = p.z;
      }
    }
    return {minX, maxX, minZ, maxZ};
  }

  function makeLine(scene, segs, y=0){
    const pts = [];
    // assume segments form a loop; draw in a chain for visualization
    // we’ll sort them crudely into a loop
    const first = segs[0];
    let curr = first;
    const used = new Set();
    pts.push(new BABYLON.Vector3(curr.a.x, y, curr.a.z));
    pts.push(new BABYLON.Vector3(curr.b.x, y, curr.b.z));
    used.add(curr);

    while (used.size < segs.length){
      const last = curr.b;
      const next = segs.find(s => !used.has(s) && (
        (s.a.x===last.x && s.a.z===last.z) ||
        (s.b.x===last.x && s.b.z===last.z)
      ));
      if (!next) break;
      if (next.a.x===last.x && next.a.z===last.z){
        pts.push(new BABYLON.Vector3(next.b.x, y, next.b.z));
      } else {
        pts.push(new BABYLON.Vector3(next.a.x, y, next.a.z));
      }
      used.add(next);
      curr = next;
    }
    // close loop
    pts.push(pts[0].clone());
    const line = BABYLON.MeshBuilder.CreateLines("ghost_barrier_lines", { points: pts }, scene);
    line.isPickable = false;
    line.alpha = 0.8;
    // tint cyan
    const mat = new BABYLON.StandardMaterial("ghost_barrier_mat", scene);
    mat.emissiveColor = new BABYLON.Color3(0,1,1);
    line.material = mat;
    line.isVisible = !!(window.SHOW_GHOST_BARRIER_LINES);
    return line;
  }

  function makeWalls(scene, b, height=8, thickness=0.2){
    // Optional: thin invisible walls (helpful for thrown items)
    const walls = [];
    const w = (b.maxX - b.minX);
    const h = (b.maxZ - b.minZ);
    const y = height/2;

    const mk = (name, sx, sz, px, pz) => {
      const m = BABYLON.MeshBuilder.CreateBox(name, {width:sx, height:height, depth:sz}, scene);
      m.position.set(px, y, pz);
      m.visibility = 0; // invisible
      m.checkCollisions = true;
      walls.push(m);
      return m;
    };
    // top, bottom, left, right
    mk("gb_top",  w, thickness, (b.minX+b.maxX)/2, b.maxZ + thickness/2);
    mk("gb_bottom", w, thickness, (b.minX+b.maxX)/2, b.minZ - thickness/2);
    mk("gb_left",  thickness, h,  b.minX - thickness/2, (b.minZ+b.maxZ)/2);
    mk("gb_right", thickness, h,  b.maxX + thickness/2, (b.minZ+b.maxZ)/2);

    // If Havok is present, make them static bodies
    if (scene.getPhysicsEngine && scene.getPhysicsEngine()){
      try{
        const Physics = BABYLON.PhysicsBody || BABYLON.PhysicsImpostor; // v6 vs v5 API
        walls.forEach(m=>{
          if (BABYLON.PhysicsBody){
            m.physicsBody = new BABYLON.PhysicsBody(m, BABYLON.PhysicsMotionType.STATIC, false, scene);
          } else {
            m.physicsImpostor = new BABYLON.PhysicsImpostor(m, BABYLON.PhysicsImpostor.BoxImpostor, { mass:0, restitution:0.0 }, scene);
          }
        });
      }catch{}
    }

    return walls;
  }

  function clampInside(mesh, b, margin=0.01){
    const p = mesh.position;
    const nx = BABYLON.Scalar.Clamp(p.x, b.minX+margin, b.maxX-margin);
    const nz = BABYLON.Scalar.Clamp(p.z, b.minZ+margin, b.maxZ-margin);
    if (nx!==p.x || nz!==p.z){
      p.x = nx; p.z = nz;
      return true; // was clamped
    }
    return false;
  }

  async function load(scene){
    if (S.ready) return;
    const url = window.GHOST_BARRIER_URL || "./assets/index3/ghost_barrier.json";
    const data = await fetch(url).then(r=>r.json());
    const segs = (data && data.segments) || [];
    if (!segs.length) { console.warn("[ghost_barrier] no segments"); S.ready=true; return; }

    // optional offset
    const off = window.GHOST_BARRIER_OFFSET || {x:0,z:0};
    S.segments = segs.map(s=>({
      a: {x: s.a.x + off.x, y: (s.a.y||0), z: s.a.z + off.z},
      b: {x: s.b.x + off.x, y: (s.b.y||0), z: s.b.z + off.z},
    }));
    S.bounds = computeBounds(S.segments);

    // visuals + thin walls (optional but nice)
    S.line = makeLine(scene, S.segments, (S.segments[0]?.a?.y)||0);
    if (window.GHOST_BARRIER_WALLS !== false){
      S.walls = makeWalls(scene, S.bounds);
    }

    S.ready = true;
    console.log("[ghost_barrier] ready", S.bounds);
  }

  window.GhostBarrier = {
    ready: load,
    clamp: (mesh)=> S.bounds ? clampInside(mesh, S.bounds) : false,
    getBounds: ()=> S.bounds,
    setVisible: (v)=> { if (S.line) S.line.isVisible = !!v; },
  };
})();
