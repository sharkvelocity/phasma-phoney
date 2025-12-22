// ./assets/index3/video_feed.js — v1.1
// In-scene video monitors fed by live cameras (player/ghost/custom).
// - Creates RenderTargetTexture per feed
// - Excludes its own screen meshes from the feed to avoid recursion
// - Ghost source will auto-follow the ghost if present
// - Simple helpers: create/attach/spawn, on/off, switch source
(function(){
  "use strict";

  const SCENE  = ()=> window.scene || BABYLON.Engine?.LastCreatedScene;
  const CAMERA = ()=> window.camera || SCENE()?.activeCamera;

  const FEEDS = new Map(); // id -> { rtt, cam, screenMeshes:Set, src, on, size, updater }
  const EXCLUDE_TAG = "video_feed_screen";

  const defaultOpts = {
    id: "feed1",
    source: "player",   // "player" | "ghost" | "custom"
    size: 1024,         // RTT size (power-of-two recommended)
    fov: null,          // override FOV for feed camera (radians)
    near: 0.1,
    far: 1000,
    nightVision: false, // tint green-ish
    grayscale: false,
  };

  function log(...a){ console.log("[video_feed]", ...a); }

  // --------- camera helpers ----------
  function findGhostRoot(){
    const s = SCENE(); if (!s) return null;
    // Preferred: ask ghostCtrl if it exposes a root; otherwise search by name
    try {
      if (window.ghostCtrl && s.getNodeByName) {
        // common naming used in our ghost runtime
        const root = s.meshes.find(m => /^GhostRoot/i.test(m.name)) || s.getNodeByName("GhostRoot");
        return root || null;
      }
    } catch {}
    // Fallback: best-effort name scan
    try {
      const match = s.meshes.find(m=> /ghostroot|ghost|phantom|entity/i.test(m.name));
      return match || null;
    }catch{}
    return null;
  }

  function makeFollowUpdater(feed){
    // Updates feed.cam to track chosen source (player/ghost/custom)
    const s = SCENE();
    return function(){
      const cam = feed.cam;
      if (!cam) return;

      if (feed.src === "player") {
        const pc = CAMERA(); if (!pc) return;
        // copy pose (not by reference) so the feed is a separate render viewpoint
        cam.position.copyFrom(pc.position);
        cam.rotation.copyFrom(pc.rotation || new BABYLON.Vector3());
        if (pc.rotationQuaternion) cam.rotationQuaternion = pc.rotationQuaternion.clone();
        if (feed.fov) cam.fov = feed.fov; else cam.fov = pc.fov;
      }
      else if (feed.src === "ghost") {
        const root = findGhostRoot();
        if (!root) return;
        // place camera at ghost eye height looking where the ghost is facing
        const pos = root.getAbsolutePosition ? root.getAbsolutePosition() : root.position;
        const eye  = new BABYLON.Vector3(pos.x, pos.y + 1.6, pos.z);
        // get forward direction
        let fwd = new BABYLON.Vector3(0,0,1);
        try { fwd = root.getDirection(BABYLON.Axis.Z); } catch {}
        const target = eye.add(fwd);
        cam.position.copyFrom(eye);
        cam.setTarget(target);
      }
      // "custom" cams are controlled externally
    };
  }

  function createFeed(opts={}){
    const s = SCENE(); if (!s) throw new Error("Scene not ready");
    const o = Object.assign({}, defaultOpts, opts);
    if (FEEDS.has(o.id)) return FEEDS.get(o.id);

    // camera
    const base = CAMERA() || new BABYLON.UniversalCamera("TmpCam", new BABYLON.Vector3(0,2,0), s);
    const cam  = new BABYLON.UniversalCamera("FeedCam_"+o.id, base.position.clone(), s);
    cam.minZ = o.near; cam.maxZ = o.far; cam.fov = o.fov || base.fov;
    cam.layerMask = 0x0FFFFFFF; // default

    // render target texture
    const rtt = new BABYLON.RenderTargetTexture("FeedRTT_"+o.id, o.size, s, false, true, BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
    rtt.activeCamera = cam;
    rtt.ignoreCameraViewport = true;
    rtt.refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ON_EACH_FRAME;
    rtt.clearColor = new BABYLON.Color4(0,0,0,1);

    // we maintain a renderList that excludes any screen meshes for this feed
    rtt.renderParticles = true;
    rtt.renderList = []; // filled just after we attach first screen, or on a timer
    s.customRenderTargets = s.customRenderTargets || [];
    s.customRenderTargets.push(rtt);

    // simple "monitor" material
    const mat = new BABYLON.StandardMaterial("FeedMat_"+o.id, s);
    mat.disableLighting = true;
    mat.emissiveTexture = rtt;     // show the camera output
    mat.emissiveTexture.level = 1.0;
    mat.backFaceCulling = false;

    if (o.nightVision) {
      // a cheap green tint; (for finer control, switch to PBR + imageProcessing)
      mat.emissiveColor = new BABYLON.Color3(0.55, 1.0, 0.55);
    } else if (o.grayscale) {
      // fake mono look by lowering saturation via colorCurves (approximation)
      try {
        mat.imageProcessingConfiguration = mat.imageProcessingConfiguration || new BABYLON.ImageProcessingConfiguration();
        mat.imageProcessingConfiguration.colorGradingEnabled = false;
        mat.imageProcessingConfiguration.contrast = 1.05;
        mat.imageProcessingConfiguration.exposure = 0.95;
      } catch {}
    }

    const feed = { id:o.id, rtt, cam, mat, src:o.source, on:true, size:o.size, screenMeshes:new Set(), updater:null, fov:o.fov };
    feed.updater = makeFollowUpdater(feed);
    s.onBeforeRenderObservable.add(feed.updater);

    FEEDS.set(o.id, feed);
    log("created", o.id, "source:", o.source);
    return feed;
  }

  function _rebuildRenderList(feed){
    const s = SCENE(); if (!s) return;
    // Everything except screen meshes for this feed.
    const all = s.meshes || [];
    feed.rtt.renderList.length = 0;
    for (const m of all){
      if (!m || m.isDisposed()) continue;
      if (feed.screenMeshes.has(m)) continue;
      feed.rtt.renderList.push(m);
    }
  }

  function attachToMesh(id, meshOrName, fit="cover"){
    const s = SCENE(); if (!s) throw new Error("Scene not ready");
    const feed = FEEDS.get(id) || createFeed({id});
    const mesh = (typeof meshOrName === "string") ? s.getMeshByName(meshOrName) : meshOrName;
    if (!mesh) { log("attachToMesh: mesh not found", meshOrName); return false; }

    // apply material
    mesh.metadata = mesh.metadata || {};
    mesh.metadata[EXCLUDE_TAG] = id;
    mesh.isPickable = mesh.isPickable ?? true;

    // Use a clone of material per mesh to allow per-screen tint later if needed
    const mat = feed.mat.clone("FeedMat_"+id+"_"+(mesh.name||mesh.id));
    mat.emissiveTexture = feed.rtt;
    mesh.material = mat;

    feed.screenMeshes.add(mesh);
    _rebuildRenderList(feed);

    // Optional "fit": if mesh has UVs you can leave it; for planes you can scale
    if (fit === "cover" && mesh.getBoundingInfo){
      // nothing to do — UVs handle cover; for parametric planes, user can scale mesh
    }
    log("attached", id, "->", mesh.name||mesh.id);
    return true;
  }

  function spawnScreenPlane(id, opts={}){
    const s = SCENE(); if (!s) throw new Error("Scene not ready");
    const feed = FEEDS.get(id) || createFeed({id});
    const w = opts.width  || 1.2;
    const h = opts.height || 0.8;
    const plane = BABYLON.MeshBuilder.CreatePlane("VideoScreen_"+id, {width:w, height:h, sideOrientation:BABYLON.Mesh.DOUBLESIDE}, s);
    plane.material = feed.mat.clone("FeedMat_"+id+"_plane");
    plane.material.emissiveTexture = feed.rtt;
    if (opts.parent) plane.parent = opts.parent;
    if (opts.position) plane.position.copyFrom(opts.position);
    if (opts.rotation) plane.rotation.copyFrom(opts.rotation);
    plane.metadata = plane.metadata || {};
    plane.metadata[EXCLUDE_TAG] = id;
    feed.screenMeshes.add(plane);
    _rebuildRenderList(feed);
    return plane;
  }

  function setOn(id, on){
    const f = FEEDS.get(id); if (!f) return false;
    f.on = !!on;
    f.rtt.refreshRate = f.on ? BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ON_EACH_FRAME
                             : BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
    return true;
  }

  function setSource(id, source/*'player'|'ghost'|'custom'*/, cameraForCustom){
    const f = FEEDS.get(id) || createFeed({id});
    f.src = source;
    if (source === "custom" && cameraForCustom){
      f.cam = cameraForCustom;
      f.rtt.activeCamera = f.cam;
    }
    return true;
  }

  function destroy(id){
    const f = FEEDS.get(id); if (!f) return;
    try {
      const s = SCENE();
      if (s && f.updater) s.onBeforeRenderObservable.removeCallback(f.updater);
      f.rtt.dispose();
      f.mat.dispose();
      for (const m of f.screenMeshes){
        if (!m.isDisposed() && m.material) { try{ m.material.dispose(); }catch{} }
      }
      FEEDS.delete(id);
    }catch(e){ log("destroy error", e); }
  }

  // ---------- convenience presets ----------
  function ensureOnBoard(boardMeshName="Pizarra_Pizarra_0", id="boardCam", source="player"){
    const s = SCENE();
    const feed = FEEDS.get(id) || createFeed({ id, source, size:1024 });
    attachToMesh(id, boardMeshName);
    return feed;
  }

  // Public API
  window.VideoFeed = {
    create: createFeed,            // ({id, source, size, fov, near, far, nightVision, grayscale})
    attachToMesh,                  // (id, meshOrName, fit?)
    spawnScreen: spawnScreenPlane, // (id, {width, height, position, rotation, parent})
    setOn,                         // (id, true|false)
    setSource,                     // (id, 'player'|'ghost'|'custom', cameraForCustom?)
    destroy,                       // (id)
    ensureOnBoard,                 // (meshName?, id?, source?)
    list(){ return Array.from(FEEDS.keys()); }
  };

  // Optional: auto-place a feed on a whiteboard if present
  const auto = setInterval(()=>{
    try{
      const s = SCENE(); if (!s) return;
      const guess = s.getMeshByName("Pizarra_Pizarra_0") || s.getMeshByName("Pizarra");
      if (guess){
        clearInterval(auto);
        if (!FEEDS.has("boardCam")){
          ensureOnBoard("Pizarra_Pizarra_0", "boardCam", "player");
          log("Auto-attached board feed to Pizarra_Pizarra_0");
        }
      }
    }catch{}
  }, 800);

})();
