// ./assets/index3/map.js — v3.0 (procedural)
// No GLB loading. Builds a collision-enabled base ground + optional boundary walls.
// Works with:
//  - Builder Tool (floors/walls you draw get collisions automatically)
//  - Ghost movement (registers ground names)
//  - Player gravity/collisions (camera ellipsoid set here)

(function(){
  "use strict";

  const S = {
    ready:false,
    ground:null,
    walls:[],
    options:{
      size: 80,            // meters (square)
      grid: true,          // draw a subtle grid on ground
      addPerimeterWalls: true,
      wallHeight: 3.0,
      wallThickness: 0.3,
      groundName: "Ground_Main",
      wallName: "Boundary",
      groundFriction: 0.8,
      groundRestitution: 0.0,
      groundColor: new BABYLON.Color3(0.12,0.14,0.15)
    }
  };

  const SCENE = ()=> window.scene || BABYLON.Engine?.LastCreatedScene;
  const v3    = (x,y,z)=> new BABYLON.Vector3(x,y,z);

  // Provide a register function if the rest of your stack expects it
  function ensureRegisterGroundRoots(){
    if (typeof window.registerGroundRoots === "function") return;
    window.registerGroundRoots = function(nameHints){
      // Minimal shim: just stash hints for other systems
      window.GROUND_NAME_HINTS = nameHints;
    };
  }

  function createGround(){
    const scene = SCENE(); if (!scene) return null;

    // Scene collisions + gravity
    scene.collisionsEnabled = true;
    scene.gravity = new BABYLON.Vector3(0, -0.6, 0); // gentle gravity; adjust as you like

    // Camera collision setup (keeps your crouch code working)
    const cam = scene.activeCamera || window.camera;
    if (cam){
      cam.checkCollisions = true;
      cam.applyGravity = true;
      // Ellipsoid roughly human-size; crouch script will change Y camera height only
      cam.ellipsoid = new BABYLON.Vector3(0.35, 0.9, 0.35);
      cam.ellipsoidOffset = new BABYLON.Vector3(0, 0.9, 0);
    }

    // Base ground
    const g = BABYLON.MeshBuilder.CreateGround(
      S.options.groundName,
      { width:S.options.size, height:S.options.size, subdivisions: 2 },
      scene
    );
    g.position.y = 0;
    g.checkCollisions = true;
    g.isPickable = true;

    // Simple standard material with optional grid
    const m = new BABYLON.StandardMaterial("Mat_"+S.options.groundName, scene);
    m.diffuseColor  = S.options.groundColor.clone();
    m.specularColor = new BABYLON.Color3(0.02,0.02,0.02);
    if (S.options.grid){
      const tex = new BABYLON.DynamicTexture('GroundGridTex', {width:1024, height:1024}, scene, false);
      const ctx = tex.getContext();
      ctx.fillStyle = 'rgb(15,18,20)'; ctx.fillRect(0,0,1024,1024);
      const step = 64; // grid spacing on texture
      for (let x=0; x<=1024; x+=step){
        const major = (x%(step*4)===0);
        ctx.fillStyle = major ? 'rgba(0,255,255,0.24)' : 'rgba(0,255,255,0.10)';
        ctx.fillRect(x, 0, 1, 1024);
        ctx.fillRect(0, x, 1024, 1);
      }
      tex.update();
      m.diffuseTexture = tex;
      m.diffuseTexture.uScale = S.options.size/10;
      m.diffuseTexture.vScale = S.options.size/10;
    }
    g.material = m;

    // Physics-like friction/rest (for if you later enable a physics engine)
    try{ g.physicsImpostor = new BABYLON.PhysicsImpostor(g, BABYLON.PhysicsImpostor.BoxImpostor, { mass:0, friction:S.options.groundFriction, restitution:S.options.groundRestitution }, scene); }catch{}

    // Register ground name hints for other systems (ghost drop, etc.)
    ensureRegisterGroundRoots();
    window.registerGroundRoots([ new RegExp("^"+S.options.groundName+"$") ]);

    return g;
  }

  function createPerimeterWalls(){
    const scene = SCENE(); if (!scene) return [];
    const half = S.options.size/2;
    const h    = S.options.wallHeight;
    const t    = S.options.wallThickness;
    const walls = [];

    function make(name, w, d, pos, rotY){
      const wall = BABYLON.MeshBuilder.CreateBox(name, { width:w, depth:d, height:h }, scene);
      wall.position.copyFrom(pos);
      if (rotY) wall.rotation.y = rotY;
      wall.checkCollisions = true;
      wall.isPickable = true;

      const mat = new BABYLON.StandardMaterial("Mat_"+name, scene);
      mat.diffuseColor  = new BABYLON.Color3(0.7,0.72,0.75);
      mat.specularColor = new BABYLON.Color3(0.05,0.05,0.05);
      wall.material = mat;

      // Ghost pathing blocker
      wall.metadata = wall.metadata || {};
      wall.metadata.isGhostBlocker = true;
      wall.metadata.builder = { type:'wall', floorIndex: 0 };

      walls.push(wall);
      return wall;
    }

    // North (top)
    make(S.options.wallName+"_N", S.options.size, t,   v3(0, h/2, -half), 0);
    // South (bottom)
    make(S.options.wallName+"_S", S.options.size, t,   v3(0, h/2,  half), 0);
    // West (left)
    make(S.options.wallName+"_W", t,   S.options.size, v3(-half, h/2, 0), 0);
    // East (right)
    make(S.options.wallName+"_E", t,   S.options.size, v3( half, h/2, 0), 0);

    return walls;
  }

  function lightIfMissing(){
    const scene = SCENE(); if (!scene) return;
    if (!scene.lights || scene.lights.length===0){
      const hemi = new BABYLON.HemisphericLight("Base_Hemi", new BABYLON.Vector3(0.2,1,0.2), scene);
      hemi.intensity = 0.8;
    }
  }

  function setup(){
    if (S.ready) return;
    const scene = SCENE(); if (!scene) return;

    lightIfMissing();
    S.ground = createGround();
    S.walls  = S.options.addPerimeterWalls ? createPerimeterWalls() : [];

    // Place the player roughly centered + slightly above ground to settle
    const cam = scene.activeCamera || window.camera;
    if (cam){
      cam.setTarget(v3(0,0,0));
      if (cam.position.y < 0.1) cam.position.y = 1.6;
      cam.position.x = 0; cam.position.z = S.options.size*0.35;
    }

    S.ready = true;

    // Expose small API for quick edits
    window.World = {
      get ground(){ return S.ground; },
      get walls(){ return S.walls.slice(); },
      resize(newSize){
        const s = Math.max(10, +newSize||S.options.size);
        S.options.size = s;
        // Rebuild ground + walls
        if (S.ground){ S.ground.dispose(false,true); S.ground=null; }
        S.walls.forEach(w=> w.dispose(false,true));
        S.walls.length = 0;
        S.ground = createGround();
        if (S.options.addPerimeterWalls) S.walls = createPerimeterWalls();
      },
      setWalls(on){
        S.options.addPerimeterWalls = !!on;
        S.walls.forEach(w=> w.dispose(false,true)); S.walls.length = 0;
        if (S.options.addPerimeterWalls) S.walls = createPerimeterWalls();
      },
      center(){ return v3(0,0,0); },
      size(){ return S.options.size; }
    };
  }

  // Boot when scene exists
  const boot = setInterval(()=>{
    try{
      if (SCENE()){
        clearInterval(boot);
        setup();
      }
    }catch{}
  }, 120);

})();
