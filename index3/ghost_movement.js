// ./assets/index3/ghost_movement.js — v2.3
// Room-aware roaming + personality behaviors + LOS/Hearing + Investigate + Barrier clamp + Deogen
//
// Public API (unchanged):
//   window.ghostCtrl.{init,startInvestigation,randomizeGhost,beginHunt,endHunt,triggerEvent,
//                     teleportGhostToLook,setGhostScale,setHomeRoomById,onSmudged,getState}
//   window.GHOST_RULES:{ canToggleBreaker, canToggleLight, canPerformEvent, canStepSalt,
//                        canShowDOTS, canStartHuntHere, canThrowEMF3, getTraits,
//                        eventWeight, breakerActionWeight, lightActionWeight, paraWhisperWeight }
//
// Optional globals used if present:
//   - window.GhostBarrier.clamp(mesh)
//   - window.PLAYER_STATE = { isRunning, isCrouched, noise? }
//   - GhostSense.pingElectronic(pos,str) / GhostSense.pingNoise(pos,loud)
//
(function(){
  "use strict";
  if (window.ghostCtrl && /^2\.3$/.test(window.ghostCtrl.__v||"")) return;

  const SCENE  = ()=> window.scene || BABYLON.Engine?.LastCreatedScene;
  const CAMERA = ()=> window.camera || SCENE()?.activeCamera;
  const toast  = (m,ms=900)=> (window.toast? window.toast(m,ms) : console.log('[ghost]', m));
  const clamp  = (v,min,max)=> Math.max(min, Math.min(max, v));
  const v3     = (x,y,z)=> new BABYLON.Vector3(x,y,z);
  const devForce = ()=> !!window.GHOST_DEV_FORCE_VISIBLE;

  // ---------- Traits ----------
  const TRAITS = {
    Goryo: { roomLock:true, goryoDotsVideoOnly:true, roamRadiusScale:0.6 },
    Mare:  { avoidLight:true,  avoidLightStrength: 1.4, lessActivityInLight:true },
    Onryo: { avoidFire:true,   avoidFireStrength: 1.8 },
    Wraith:{ ignoreSalt:true },
    Shade: { shyNearPlayer:true },
    Demon: { /* crucifix gating */ },
    Yurei: { smudgeRoomLockSec: 90 },
    Jinn:  { /* breaker gate below */ },
    Hantu: { /* breaker gate below */ },
    Oni:   { manifestOften:true },
    Phantom:{ wanderToPlayer:true },
    Banshee:{ wanderToPlayer:true, singOften:true, dotsChaseMarked:true },
    Thaye: { calmsNearPlayer:true },
    Deogen:{ omniscient:true } // special below
  };
  try{ if (window.GHOST_TRAITS && typeof window.GHOST_TRAITS === 'object'){ Object.assign(TRAITS, window.GHOST_TRAITS); } }catch{}

  // ---------- Config ----------
  const CFG = {
    // movement
    roamSpeed: 1.55,
    huntSpeed: 2.65,
    accelRate: 6.0,
    steerAngles: [15,-15,30,-30,45,-45,60,-60,90,-90,120,-120,150,-150,180],
    barrierLookahead: 1.6,
    blinkMin: 0.10, blinkMax: 0.28,
    eventCooldown: 7.5, eventChance: 0.35,
    roamTargetClose: 1.1,
    playerScareRadius: 6.5,
    sanityDrainPerMin: 2.5, sanityDrainProximity: 9, sanityDrainHunt: 22,
    minHuntCooldown: 35, maxHuntCooldown: 75, huntSanityThreshold: 50,
    lightFlickerRadius: 10, lightFlickerFactor: 0.35,
    randomSpawnDist: 8, killRadius: 1.25,
    groundFollow: true, groundRayUp: 3.0, groundRayDown: 8.0, footOffset: 0.02,
    maxStepUp: 0.60, maxStepDown: 0.80, groundSnapLerp: 14.0,
    // hazard scan
    lightScanRadius: 18,
    fireScanRadius: 16,
    hazardRefreshSec: 0.7,
    // pattern
    insetMargin: 0.9,
    // LOS / Hearing / Investigate
    FOV_DEG: 95,
    SIGHT_RANGE: 22,
    HEAR_RANGE_MAX: 16,
    HEAR_BASE_CHANCE: 0.18,     // baseline chance per second (scaled by loudness & distance)
    ELECTRONIC_DECAY_S: 4.0,    // how long electronic pings last
    INVESTIGATE_TIME_S: 6.0,    // time to search around last-known
    INVESTIGATE_WANDER: 2.5,    // small radius around last-known
    STUCK_SPEED_EPS: 0.02,      // below this average movement = stuck
    STUCK_TIME_S: 0.8,          // if stuck for this long, pick a fresh target
    // Deogen dials
    deogenFarSpeed: 4.2,
    deogenNearSpeed: 0.65,
    deogenNearDist: 2.2
  };

  // ---------- State ----------
  const ST = {
    __v:'2.3',
    ready:false, s:null, c:null,
    ghostRoot:null, modelName:null, ghostTypeKey:null,
    defaultVisibility:0, scale:1,
    mode:'idle', sanity:100,
    curSpeed:0, lastUpdateT:performance.now()/1000,
    lastEventT:0, nextHuntReadyT:0,
    isVisible:false, lastPosY:null,
    // rooms & barriers/layout
    layout:null, rooms:[], barriers:[], doorGaps:[],
    homeRoom:null, curRoom:null,
    patrol:[], patrolIdx:0, target:null, autoStarted:false,
    // hazards
    lastHazardScan:0, lightsCache:[], firesCache:[],
    // rule timers
    smudgedUntil:0,
    // characteristic timers
    nearPlayerTime:0,
    // perception
    lastKnown:null,            // Vector3 (last seen/heard/electronic)
    lastSeenAt:0,
    lastHeardAt:0,
    investigateUntil:0,
    // stuck detection
    _stuckTimer:0,
    _lastPos:null
  };

  // ---------- Optional Sense Bus ----------
  (function ensureSenseBus(){
    if (!window.GhostSense){
      const pings = []; // {pos:{x,y,z}, t:now, str}
      const noises= []; // {pos:{x,y,z}, t, loud}
      window.GhostSense = {
        pingElectronic(pos,str=1){ pings.push({pos:{x:pos.x,y:pos.y,z:pos.z}, t:performance.now()/1000, str:clamp(+str||1,0,5)}); },
        pingNoise(pos,loud=1){ noises.push({pos:{x:pos.x,y:pos.y,z:pos.z}, t:performance.now()/1000, loud:clamp(+loud||1,0,5)}); },
        _take(now){
          // clean + expose copies
          const pes = pings.filter(p=> now - p.t <= CFG.ELECTRONIC_DECAY_S);
          const nes = noises.filter(n=> now - n.t <= 3.0);
          // prune
          pings.length = 0; pes.forEach(p=>pings.push(p));
          noises.length= 0; nes.forEach(n=>noises.push(n));
          return { pings:pes.slice(), noises:nes.slice() };
        }
      };
    }
  })();

  // ---------- Public API ----------
  const API = {
    __v: ST.__v,
    init, startInvestigation, randomizeGhost,
    beginHunt, endHunt, triggerEvent,
    teleportGhostToLook, setGhostScale,
    setHomeRoomById, onSmudged,
    getState: ()=>({mode:ST.mode, type:ST.ghostTypeKey, model:ST.modelName,
      room:ST.curRoom?.id, sanity:ST.sanity, pos: ST.ghostRoot?.position && {x:+ST.ghostRoot.position.x.toFixed(2), y:+ST.ghostRoot.position.y.toFixed(2), z:+ST.ghostRoot.position.z.toFixed(2)}})
  };
  window.ghostCtrl = API;
  window.beginHunt = beginHunt; window.endHunt = endHunt;

  // ---------- Init ----------
  function init(){
    if (ST.ready) return;
    ST.s = SCENE(); ST.c = CAMERA(); if (!ST.s || !ST.c) return;
    ST.s.onBeforeRenderObservable.add(_tick);
    const btn = document.getElementById('start-button');
    if (btn) btn.addEventListener('click', ()=> startInvestigation());
    window.addEventListener('keydown',(e)=>{ if(e.altKey && (e.code==='KeyG'||e.key==='g'||e.key==='G')) teleportGhostToLook(2.8); });
    tryAutoGroundTagging();
    tryLoadLayout();
    publishRulesAPI();
    ST.ready = true; toast('Ghost ctrl v2.3 ready');
  }
  const boot = setInterval(()=>{ try{ if (SCENE() && CAMERA()){ clearInterval(boot); init(); } }catch{} }, 150);

  // ---------- Layout / Ground ----------
  function tryLoadLayout(){
    try{
      const L = window.GHOST_LAYOUT;
      if (!L) return;
      ST.layout = L;
      ST.rooms = Array.isArray(L.rooms) ? L.rooms.slice() : [];
      ST.barriers = Array.isArray(L.barriers) ? L.barriers.slice() : [];
      ST.doorGaps = Array.isArray(L.door_gaps) ? L.door_gaps.slice() : [];
    }catch{}
  }
  function tryAutoGroundTagging(){
    try{
      if (typeof window.registerGroundRoots === 'function'){
        window.registerGroundRoots([/^jailhouse\.w\./i]);
      }
    }catch{}
  }

  // ---------- Start / Randomize ----------
  function startInvestigation(){
    if (!ST.ghostRoot) randomizeGhost();
    bindHomeRoom();
    buildPatrolForRoom(ST.homeRoom);
    ST.target = ST.patrol[ST.patrolIdx] || ST.ghostRoot.position.clone();
    setMode('roam');
    ST.autoStarted = true;
  }
  function randomizeGhost(){
    pickRandomGhostType();
    pickRandomGhostModelOrFallback();
    placeGhostAheadOfCamera(CFG.randomSpawnDist);
    setGhostVisible(devForce());
    ST.nextHuntReadyT = (performance.now()/1000) + 45;
  }
  function pickRandomGhostType(){
    try{
      const keys = Object.keys(window.GHOSTS||{});
      ST.ghostTypeKey = keys.length ? keys[(Math.random()*keys.length)|0] : 'Spirit';
      window.currentGhostKey = ST.ghostTypeKey;
    }catch{ ST.ghostTypeKey = 'Spirit'; }
  }
  function traits(){ return TRAITS[ST.ghostTypeKey] || {}; }

  function pickRandomGhostModelOrFallback(){
    if (window.PREFERRED_GHOST_ROOT && !window.PREFERRED_GHOST_ROOT.isDisposed?.()){
      ST.ghostRoot = window.PREFERRED_GHOST_ROOT;
      ST.modelName = window.PREFERRED_GHOST_MODEL_NAME || ST.ghostRoot.name || "dev_ghost";
      ST.scale = window.PREFERRED_GHOST_SCALE || 1; try{ ST.ghostRoot.scaling.set(ST.scale, ST.scale, ST.scale); }catch{}
      ST.defaultVisibility = 0.0; return;
    }
    const s=SCENE();
    const names = (s?.meshes||[]).map(m=>m.name).filter(Boolean);
    const pri = names.filter(n=> /ghost|spirit|entity|phantom|apparition|armature|rig/i.test(n));
    const pool = pri.length?pri:names;
    for (let i=0;i<pool.length;i++){
      const name=pool[(Math.random()*pool.length)|0];
      const m=s.getMeshByName(name)||s.getNodeByName(name); if (!m) continue;
      if (/ground|floor|terrain|room|house|wall|plane|door|window|light|lamp|roof|stairs|sky|skybox/i.test(name)) continue;
      const root=new BABYLON.TransformNode('GhostRoot_'+Date.now().toString(36), s); m.parent=root;
      ST.ghostRoot=root; ST.modelName=name; ST.defaultVisibility=0.0; ST.scale=1; return;
    }
    const r=new BABYLON.TransformNode('GhostRoot', s);
    const body=BABYLON.MeshBuilder.CreateSphere('GhostBall',{diameter:0.45,segments:16}, s);
    const tail=BABYLON.MeshBuilder.CreateCylinder('GhostTail',{diameterTop:0.18,diameterBottom:0.4,height:0.8,tessellation:16}, s);
    body.parent=r; tail.parent=r; tail.position.y=-0.6;
    const mat=new BABYLON.StandardMaterial('GhostMat', s);
    mat.diffuseColor=new BABYLON.Color3(0.85,0.95,1.0); mat.emissiveColor=new BABYLON.Color3(0.2,0.4,0.5); mat.alpha=0.35;
    body.material=mat; tail.material=mat; ST.ghostRoot=r; ST.modelName='fallback_ghost'; ST.defaultVisibility=0.0; ST.scale=1;
  }

  function setGhostScale(sc){
    ST.scale = clamp(+sc||1, 0.1, 5);
    if (ST.ghostRoot) ST.ghostRoot.scaling.set(ST.scale, ST.scale, ST.scale);
    try{ ST.ghostRoot.metadata = ST.ghostRoot.metadata||{}; ST.ghostRoot.metadata.ghostScale = ST.scale; }catch{}
  }

  // ---------- Rooms & Patrol ----------
  function pointInPolyXZ(pt, poly){
    const x=pt.x, z=pt.z; let inside=false;
    for (let i=0, j=poly.length-1; i<poly.length; j=i++){
      const xi=poly[i][0], zi=poly[i][1], xj=poly[j][0], zj=poly[j][1];
      const intersect = ((zi>z)!==(zj>z)) && (x < (xj - xi) * (z - zi) / (zj - zi + 1e-6) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }
  function roomForPos(p){
    if (!ST.rooms?.length) return null;
    for (const r of ST.rooms){ if (r.poly && pointInPolyXZ(p, r.poly)) return r; }
    return null;
  }
  function bindHomeRoom(){
    if (!ST.rooms?.length || !ST.ghostRoot) return;
    const pos = ST.ghostRoot.position;
    let r = roomForPos(pos);
    if (!r){
      let best=null, bestD=1e9;
      for (const rm of ST.rooms){
        const c = rm.center || [0,0,0];
        const dx=c[0]-pos.x, dz=c[2]-pos.z, d=dx*dx+dz*dz;
        if (d<bestD){ bestD=d; best=rm; }
      }
      r = best;
    }
    ST.homeRoom = r; ST.curRoom  = r;
  }
  function insetRectPoly(poly, margin){
    const minx=poly[0][0], minz=poly[0][1], maxx=poly[2][0], maxz=poly[2][1];
    const scale = (traits().roamRadiusScale || 1);
    const m = margin * scale;
    return [
      [minx+m, minz+m],
      [maxx-m, minz+m],
      [maxx-m, maxz-m],
      [minx+m, maxz-m],
    ];
  }
  function buildPatrolForRoom(rm){
    ST.patrol = []; ST.patrolIdx = 0;
    if (!rm?.poly) return;
    const poly = insetRectPoly(rm.poly, CFG.insetMargin);
    const mids = [
      [(poly[0][0]+poly[1][0])*0.5, (poly[0][1]+poly[1][1])*0.5],
      [(poly[1][0]+poly[2][0])*0.5, (poly[1][1]+poly[2][1])*0.5],
      [(poly[2][0]+poly[3][0])*0.5, (poly[2][1]+poly[3][1])*0.5],
      [(poly[3][0]+poly[0][0])*0.5, (poly[3][1]+poly[0][1])*0.5],
    ];
    const seq = [poly[0], mids[0], poly[1], mids[1], poly[2], mids[2], poly[3], mids[3]];
    const y = (rm.floor_y ?? ST.ghostRoot.position.y);
    seq.forEach(([x,z])=> ST.patrol.push(v3(x, y, z)));
    ST.target = ST.patrol[0];
  }
  function maybeSwitchRoom(){
    const T = traits();
    if (T.roomLock) return;
    if (ST.ghostTypeKey==='Yurei' && performance.now()/1000 < ST.smudgedUntil) return;
    if (!ST.rooms?.length || !ST.curRoom) return;
    const curC = ST.curRoom.center || [0,0,0];
    let best=null, bestScore=-1e9;
    for (const rm of ST.rooms){
      if (rm===ST.curRoom) continue;
      const a = v3(curC[0], 0, curC[2]);
      const b = v3((rm.center||[0,0,0])[0], 0, (rm.center||[0,0,0])[2]);
      if (isBlockedByLayout(a,b)) continue;
      let score = -0.1 * dist2(a,b);
      if (T.avoidLight){ score += -illuminationAtPoint(b) * 2.0; }
      if (T.avoidFire){ score += -fireIntensityAtPoint(b) * 2.5; }
      score += Math.random()*0.5;
      if (score>bestScore){ bestScore=score; best=rm; }
    }
    if (best && bestScore > -1e6){
      ST.curRoom = best;
      buildPatrolForRoom(best);
      ST.patrolIdx = 0; ST.target = ST.patrol[0];
    }
  }

  // ---------- Hazards ----------
  function refreshHazards(){
    const now = performance.now()/1000;
    if (now - ST.lastHazardScan < CFG.hazardRefreshSec) return;
    ST.lastHazardScan = now;
    try{
      ST.lightsCache = (ST.s.lights||[]).filter(L=>{
        try{ return L.isEnabled?.() !== false && (L.intensity ?? 0) > 0.01; }catch{return false;}
      });
    }catch{ ST.lightsCache = []; }
    try{
      if (Array.isArray(window.ITEMS?.getActiveFires?.())){
        ST.firesCache = window.ITEMS.getActiveFires();
      } else {
        ST.firesCache = ST.s.meshes.filter(m=>{
          const n=(m.name||"").toLowerCase();
          const on = (m.metadata?.isOn === true || m.visibility>0.2 || m.isVisible===true);
          return on && (/candle|flame|fire|lighter|campfire|torch/.test(n) || m.metadata?.isFire === true);
        }).map(m=> m.getAbsolutePosition?.() || m.position).filter(Boolean).map(p=> ({x:p.x, y:p.y, z:p.z}));
      }
    }catch{ ST.firesCache=[]; }
  }
  function illuminationAtPoint(p){
    if (!ST.lightsCache?.length) return 0;
    let E = 0;
    for (const L of ST.lightsCache){
      try{
        const pos = L.getAbsolutePosition?.() || L.position; if (!pos) continue;
        const dx=p.x-pos.x, dy=(p.y||0)-pos.y, dz=p.z-pos.z;
        const d2 = dx*dx + dy*dy + dz*dz;
        if (d2 > CFG.lightScanRadius*CFG.lightScanRadius) continue;
        const I = (L.intensity ?? 1);
        E += I / Math.max(1, d2);
      }catch{}
    }
    return E;
  }
  function fireIntensityAtPoint(p){
    if (!ST.firesCache?.length) return 0;
    let F = 0;
    for (const q of ST.firesCache){
      const dx=p.x-q.x, dy=(p.y||0)-q.y, dz=p.z-q.z;
      const d2 = dx*dx+dy*dy+dz*dz;
      if (d2 > CFG.fireScanRadius*CFG.fireScanRadius) continue;
      F += 1 / Math.max(1, d2);
    }
    return F;
  }

  // ---------- Visibility & blink ----------
  function setGhostVisible(on){
    if (devForce()) on = true;
    ST.isVisible = !!on;
    const setNode=(node,vis)=>{
      if (!node) return;
      if (node.material && typeof node.material.alpha === 'number') node.material.alpha = vis ? 1 : 0.0;
      if ('visibility' in node) node.visibility = vis ? 1 : 0;
      if ('isVisible' in node)  node.isVisible  = !!vis;
    };
    if (ST.ghostRoot){
      const stack=[ST.ghostRoot];
      while (stack.length){ const n=stack.pop(); setNode(n,on); n.getChildren?.().forEach(ch=> stack.push(ch)); }
    }
    setCollisionsEnabled(ST.isVisible);
  }
  function blinkManifest(timeSec){
    if (devForce()) return;
    const dur = timeSec || (CFG.blinkMin + Math.random()*(CFG.blinkMax-CFG.blinkMin));
    setGhostVisible(true);
    setTimeout(()=> setGhostVisible(false), dur*1000);
    tryLightFlickerNear(ST.ghostRoot?.position, dur);
  }

  // ---------- Ground follow ----------
  function isGroundMesh(m){
    if (!m) return false;
    if (m === ST.ghostRoot || m.isDescendantOf?.(ST.ghostRoot)) return false;
    if (m.metadata?.isGround === true) return true;
    const name=(m.name||""), id=(m.id||"");
    const jailhouse = /(^|\/|_)jailhouse\.w\./i.test(name) || /(^|\/|_)jailhouse\.w\./i.test(id);
    if (jailhouse) return true;
    const n = name + " " + id;
    if (/(^|[^a-z])(floor|ground|tile|concrete|yard|hall|corridor|cell|block|lobby|entrance|stairs?)([^a-z]|$)/i.test(n)) return true;
    return m.isPickable !== false;
  }
  function groundYAtXZ(x, z, approxY){
    const s = ST.s || SCENE(); if (!s) return null;
    const from = new BABYLON.Vector3(x, (approxY ?? 2) + CFG.groundRayUp, z);
    const ray  = new BABYLON.Ray(from, v3(0,-1,0), CFG.groundRayUp + CFG.groundRayDown);
    const hit  = s.pickWithRay(ray, isGroundMesh, false);
    return (hit && hit.hit && hit.pickedPoint) ? hit.pickedPoint.y : null;
  }
  function snapY(pos, dt){
    if (!CFG.groundFollow) return;
    const gy = groundYAtXZ(pos.x, pos.z, ST.lastPosY ?? pos.y);
    if (gy == null) return;
    const targetY = gy + CFG.footOffset;
    let y = ST.lastPosY ?? pos.y;
    const dy = targetY - y;
    const maxUp   = CFG.maxStepUp   * dt * 8;
    const maxDown = CFG.maxStepDown * dt * 8;
    if (dy > 0)      y += Math.min(dy, maxUp);
    else if (dy < 0) y += Math.max(dy, -maxDown);
    const k = clamp(dt * CFG.groundSnapLerp, 0, 1);
    y = y + (targetY - y) * k;
    pos.y = y; ST.lastPosY = y;
  }

  function placeGhostAheadOfCamera(dist){
    const c = CAMERA(), s = SCENE(); if (!c || !s){ return; }
    if (!ST.ghostRoot) pickRandomGhostModelOrFallback();
    if (!ST.ghostRoot) return;
    const ray = c.getForwardRay(50);
    let p = c.position.add(ray.direction.scale(dist||CFG.randomSpawnDist));
    const gy = groundYAtXZ(p.x, p.z, p.y);
    p.y = (gy != null ? gy + CFG.footOffset : p.y);
    ST.ghostRoot.position.copyFrom(p);
  }
  function teleportGhostToLook(distance){
    const d = isFinite(+distance) ? +distance : 2.8;
    ST.s = SCENE(); ST.c = CAMERA();
    const s = ST.s, c = ST.c;
    if (!s || !c) { console.log('teleport: scene/camera not ready'); return; }
    if (!ST.ghostRoot){ randomizeGhost(); if (!ST.ghostRoot){ console.log('teleport: no ghost'); return; } }
    const root = ST.ghostRoot;
    const fRay = c.getForwardRay(60);
    const pickable = (m)=>{
      if (!m) return false;
      if (m === root || m.isDescendantOf?.(root)) return false;
      if (/sky|skybox/i.test(m.name||"")) return false;
      return m.isPickable !== false;
    };
    let target = null;
    const hit = s.pickWithRay(fRay, pickable, false);
    if (hit?.hit && hit.pickedPoint){
      target = hit.pickedPoint.subtract(fRay.direction.scale(0.35));
    } else {
      target = c.position.add(fRay.direction.scale(d));
    }
    const gy = groundYAtXZ(target.x, target.z, target.y);
    if (gy != null) target.y = gy + CFG.footOffset;
    root.position.copyFrom(target);
    try{ root.rotationQuaternion = null; root.rotation.y = Math.atan2(fRay.direction.x, fRay.direction.z); }catch{}
    if (devForce()) setGhostVisible(true);
    bindHomeRoom(); buildPatrolForRoom(ST.curRoom||ST.homeRoom);
  }
  window.teleportGhostToLook = teleportGhostToLook;

  // ---------- Barriers ----------
  function isBlockedByLayout(a, b){
    try{
      if (typeof window.ghostDev_isBlockedRay === 'function') return !!window.ghostDev_isBlockedRay(a,b);
      if (!ST.barriers?.length) return false;
      const A=[a.x,a.z], B=[b.x,b.z];
      for (const seg of ST.barriers){
        const U=[seg.a.x, seg.a.z], V=[seg.b.x, seg.b.z];
        if (segmentsIntersect(A,B,U,V)){
          if (ST.doorGaps?.length){
            if (gapCoversIntersection(A,B,U,V, ST.doorGaps)) continue;
          }
          return true;
        }
      }
      return false;
    }catch{ return false; }
  }
  function segmentsIntersect(A,B,C,D){
    const ccw=(P,Q,R)=> (R[1]-P[1])*(Q[0]-P[0]) > (Q[1]-P[1])*(R[0]-P[0]);
    return (ccw(A,C,D) !== ccw(B,C,D)) && (ccw(A,B,C) !== ccw(A,B,D));
  }
  function gapCoversIntersection(A,B,U,V, gaps){
    const mid=[ (U[0]+V[0])*0.5, (U[1]+V[1])*0.5 ];
    for (const g of gaps){
      const G=[g.a[0], g.a[1]], H=[g.b[0], g.b[1]];
      const d = Math.hypot( ((G[0]+H[0])*0.5)-mid[0], ((G[1]+H[1])*0.5)-mid[1] );
      if (d < 0.75) return true;
    }
    return false;
  }
  function isSegmentBlocked(a,b){
    try{
      if (typeof window.ghostDev_isBlockedRay === 'function') return !!window.ghostDev_isBlockedRay(a,b);
      if (isBlockedByLayout(a,b)) return true;
      const dir=b.subtract(a), len=dir.length(); if (len<=0.001) return false;
      const ray=new BABYLON.Ray(a, dir.normalize(), len);
      const hit=ST.s.pickWithRay(ray, m=> m && m.metadata?.isGhostBlocker===true);
      return !!(hit && hit.hit);
    }catch{ return false; }
  }

  function setCollisionsEnabled(enabled){
    const want = !!enabled && ST.mode==='hunt';
    const r = ST.ghostRoot; if (!r) return;
    const stack=[r];
    while (stack.length){
      const n=stack.pop();
      try{ if ('checkCollisions' in n) n.checkCollisions = want; }catch{}
      n.getChildren?.().forEach(ch=> stack.push(ch));
    }
  }

  // ---------- Perception ----------
  function canSeePlayer(){
    const p = ST.c?.position; const g = ST.ghostRoot; if (!p || !g) return false;
    const to = p.subtract(g.position);
    const dist = to.length();
    if (dist > CFG.SIGHT_RANGE) return false;
    if (isSegmentBlocked(g.position, p)) return false;
    // FOV check (use ghost forward = +Z by rotation.y)
    const yaw = (g.rotationQuaternion ? g.rotationQuaternion.toEulerAngles().y : g.rotation?.y) || 0;
    const fwd = v3(Math.sin(yaw), 0, Math.cos(yaw));
    const angle = Math.acos( clamp(BABYLON.Vector3.Dot(fwd.normalize(), to.normalize()), -1, 1) ) * 180/Math.PI;
    return angle <= (CFG.FOV_DEG * 0.5);
  }
  function chanceHearPlayer(dt){
    const p = ST.c?.position; const g = ST.ghostRoot; if (!p || !g) return false;
    const dx=g.position.x-p.x, dz=g.position.z-p.z;
    const dist = Math.sqrt(dx*dx+dz*dz);
    if (dist > CFG.HEAR_RANGE_MAX) return false;
    // Player noise estimate
    const PS = window.PLAYER_STATE || {};
    let noise = (typeof PS.noise === 'number') ? PS.noise : 0.45;
    if (PS.isRunning) noise *= 1.8;
    if (PS.isCrouched) noise *= 0.6;
    const falloff = clamp(1 - (dist / CFG.HEAR_RANGE_MAX), 0, 1);
    const perSec = CFG.HEAR_BASE_CHANCE * noise * falloff;
    return Math.random() < (perSec * dt);
  }
  function consumeSenseEvents(now){
    try{
      const ev = window.GhostSense?._take(now);
      return ev || {pings:[], noises:[]};
    }catch{ return {pings:[], noises:[]}; }
  }

  // ---------- Movement ----------
  function moveToward(target, targetSpeed, dt){
    const g=ST.ghostRoot; if (!g) return;
    const cur=g.position;
    let to=target.subtract(cur);
    let dist=to.length();
    if (dist < 1e-3) { ST.curSpeed = 0; return; }

    // smooth accelerate/decelerate (arrive)
    const arriveRadius = 1.2;
    const desired = (dist < arriveRadius) ? clamp(targetSpeed * (dist/arriveRadius), 0.25, targetSpeed) : targetSpeed;
    if (ST.curSpeed < desired) ST.curSpeed = Math.min(desired, ST.curSpeed + CFG.accelRate*dt);
    else if (ST.curSpeed > desired) ST.curSpeed = Math.max(desired, ST.curSpeed - CFG.accelRate*dt);

    let dir = to.scale(1/dist);

    // hazard repulsion
    refreshHazards();
    const T = traits();
    if (T.avoidLight && ST.lightsCache.length){
      const repel = hazardRepulsion(cur, ST.lightsCache.map(L=> L.getAbsolutePosition?.() || L.position), CFG.lightScanRadius);
      dir = dir.add(repel.scale(T.avoidLightStrength||1.2)).normalize();
    }
    if (T.avoidFire && ST.firesCache.length){
      const repel = hazardRepulsion(cur, ST.firesCache, CFG.fireScanRadius);
      dir = dir.add(repel.scale(T.avoidFireStrength||1.6)).normalize();
    }

    // layout avoidance
    const aheadA=cur;
    const aheadB=cur.add(dir.scale(CFG.barrierLookahead));
    if (isSegmentBlocked(aheadA,aheadB)){
      const yaw=Math.atan2(dir.x,dir.z);
      let steered=null;
      for (const deg of CFG.steerAngles){
        const ang=yaw + (deg*Math.PI/180), tryDir=v3(Math.sin(ang),0,Math.cos(ang));
        const b=cur.add(tryDir.scale(CFG.barrierLookahead));
        if (!isSegmentBlocked(cur,b)){ steered=tryDir; break; }
      }
      if (steered) dir=steered; else { ST.curSpeed = 0; return; }
    }

    const step = ST.curSpeed * dt;
    const next = cur.add(dir.scale(step));
    snapY(next, dt);
    g.position.copyFrom(next);
    try{ g.rotationQuaternion=null; g.rotation.y=Math.atan2(dir.x,dir.z); }catch{}

    // clamp to barrier (optional)
    try{ if (window.GhostBarrier?.clamp) window.GhostBarrier.clamp(g); }catch{}

    // stuck detection → pick new roam target
    const lp = ST._lastPos || cur;
    const moved = BABYLON.Vector3.DistanceSquared(lp, g.position);
    ST._lastPos = g.position.clone();
    if (moved < CFG.STUCK_SPEED_EPS*CFG.STUCK_SPEED_EPS) ST._stuckTimer += dt; else ST._stuckTimer = 0;
    if (ST._stuckTimer > CFG.STUCK_TIME_S && ST.mode!=='hunt'){
      ST._stuckTimer = 0;
      // sidestep 90° and move a little to break loops
      const yaw2 = (Math.random()<0.5?+1:-1) * 90 * Math.PI/180;
      const base = Math.atan2(dir.x,dir.z) + yaw2;
      const nudge = v3(Math.sin(base),0,Math.cos(base)).scale(2.5);
      ST.target = g.position.add(nudge);
    }
  }
  function hazardRepulsion(cur, points, radius){
    let R = v3(0,0,0);
    const r2 = radius*radius;
    for (const p of points){
      if (!p) continue;
      const px = (p.x ?? p[0]), py = (p.y ?? p[1] ?? cur.y), pz = (p.z ?? p[2]);
      const dx=cur.x-px, dy=(cur.y-py), dz=cur.z-pz;
      const d2 = dx*dx+dy*dy+dz*dz;
      if (d2 <= 1 || d2 > r2) continue;
      const inv = 1/Math.sqrt(d2);
      R.x += dx * inv / d2;
      R.z += dz * inv / d2;
    }
    const len = Math.hypot(R.x,R.z);
    return len>1e-6 ? R.scale(1/len) : v3(0,0,0);
  }

  function pickRoamTarget(){
    const T = traits();
    if ((T.wanderToPlayer) && Math.random() < 0.18 * tickScale()){
      const p = ST.c?.position?.clone && ST.c.position.clone();
      if (p && ST.curRoom && roomForPos(p)?.id === ST.curRoom.id){ return p; }
    }
    if (ST.ghostTypeKey==='Banshee' && isDOTSActive()){
      const pos = getMarkedPlayerPos() || ST.c?.position;
      if (pos){ return pos.clone ? pos.clone() : v3(pos.x,pos.y,pos.z); }
    }
    if (ST.patrol?.length){
      if (!ST.target || BABYLON.Vector3.Distance(ST.ghostRoot.position, ST.target) <= CFG.roamTargetClose){
        pickNextPatrolTarget();
      }
      return ST.target.clone();
    }
    // broad fallback
    let min=new BABYLON.Vector3(+Infinity,+Infinity,+Infinity), max=new BABYLON.Vector3(-Infinity,-Infinity,-Infinity);
    ST.s.meshes.forEach(m=>{ try{ const bb=m.getBoundingInfo?.().boundingBox; if (bb){ min=BABYLON.Vector3.Minimize(min,bb.minimumWorld); max=BABYLON.Vector3.Maximize(max,bb.maximumWorld); } }catch{} });
    for (let i=0;i<20;i++){
      const p=v3(min.x+Math.random()*(max.x-min.x), ST.ghostRoot?.position?.y||0, min.z+Math.random()*(max.z-min.z));
      const c=ST.ghostRoot?.position||p; if (!isSegmentBlocked(c,p)) return p;
    }
    return ST.ghostRoot?.position.clone()||v3(0,0,0);
  }
  function pickNextPatrolTarget(){
    const T = traits();
    if (!ST.patrol?.length){ ST.target = ST.ghostRoot.position.clone(); return; }
    if (T.avoidLight){
      const a = ST.patrol[(ST.patrolIdx+1)%ST.patrol.length];
      const b = ST.patrol[(ST.patrolIdx+2)%ST.patrol.length];
      const Ea = illuminationAtPoint(a), Eb = illuminationAtPoint(b);
      ST.patrolIdx = (Ea <= Eb) ? (ST.patrolIdx+1)%ST.patrol.length : (ST.patrolIdx+2)%ST.patrol.length;
      ST.target = ST.patrol[ST.patrolIdx]; return;
    }
    if (T.avoidFire){
      const a = ST.patrol[(ST.patrolIdx+1)%ST.patrol.length];
      const b = ST.patrol[(ST.patrolIdx+2)%ST.patrol.length];
      const Fa = fireIntensityAtPoint(a), Fb = fireIntensityAtPoint(b);
      ST.patrolIdx = (Fa <= Fb) ? (ST.patrolIdx+1)%ST.patrol.length : (ST.patrolIdx+2)%ST.patrol.length;
      ST.target = ST.patrol[ST.patrolIdx]; return;
    }
    ST.patrolIdx = (ST.patrolIdx+1)%ST.patrol.length;
    ST.target = ST.patrol[ST.patrolIdx];
  }

  // ---------- Sanity / Events / Hunts ----------
  function updateSanity(dt){
    ST.sanity -= (CFG.sanityDrainPerMin/60)*dt;
    const g=ST.ghostRoot?.position, p=ST.c?.position;
    let near=false;
    if (g && p){
      const dx=g.x-p.x, dz=g.z-p.z, dist=Math.sqrt(dx*dx+dz*dz);
      if (dist <= CFG.playerScareRadius){ ST.sanity -= (CFG.sanityDrainProximity/60)*dt; near=true; }
    }
    if (near) ST.nearPlayerTime += dt*1.0; else ST.nearPlayerTime = Math.max(0, ST.nearPlayerTime - dt*0.5);
    if (ST.mode==='hunt') ST.sanity -= (CFG.sanityDrainHunt/60)*dt;
    ST.sanity = clamp(ST.sanity,0,100);
    const el = document.getElementById('hud-sanity'); if (el) el.textContent = `${Math.round(ST.sanity)}%`
    const huntEl = document.getElementById('hud-hunt-state'); if (huntEl) huntEl.textContent = ST.mode==='hunt' ? 'HUNTING' : (ST.mode==='cooldown'?'Cooling':'Calm');
  }

  function chooseEventType(){
    const W = { blink:1, flicker:0.8, whisper:0.9, sing:0.3, airball:0.3, shadow:0.4 };
    const T = traits();
    if (ST.ghostTypeKey==='Oni'){ W.blink *= 1.8; W.shadow *= 1.6; }
    if (ST.ghostTypeKey==='Banshee'){ W.sing  *= 2.2; }
    if (ST.ghostTypeKey==='Shade'){ W.shadow *= 1.8; W.airball *= 1.6; W.blink *= 1.2; }
    if (ST.ghostTypeKey==='Myling'){ W.whisper*= 2.0; }
    if (ST.ghostTypeKey==='Mare'){ W.flicker*= 1.4; }
    const total = Object.values(W).reduce((a,b)=>a+b,0);
    let r = Math.random()*total;
    for (const k of Object.keys(W)){ r -= W[k]; if (r<=0) return k; }
    return 'blink';
  }

  function triggerEvent(type){
    if ((type==='mist'||type==='mistform') && ST.ghostTypeKey==='Oni') return;
    const t = type || chooseEventType();
    if (t==='blink'){ blinkManifest(); }
    else if (t==='flicker'){ tryLightFlickerNear(ST.ghostRoot?.position, 0.6 + Math.random()*0.6); }
    else if (t==='whisper'){ /* para mic-friendly */ }
    else if (t==='sing'){ /* Banshee singing */ }
    else if (t==='airball'){ /* Shade airball */ }
    else if (t==='shadow'){ /* shadow form */ }
  }

  function tryLightFlickerNear(pos, durSec){
    if (!pos || !ST.s) return;
    if (!ST.s.lights?.length) return;
    const saved = ST.s.lights.map(L=>({L,intensity:L.intensity}));
    const id = setInterval(()=>{ saved.forEach(x=> x.L.intensity = x.intensity*(0.85+Math.random()*CFG.lightFlickerFactor)); },40);
    setTimeout(()=>{ clearInterval(id); saved.forEach(x=> x.L.intensity=x.intensity); }, durSec*1000);
  }

  function beginHunt(){
    if (!ST.ghostRoot) return;
    const now=performance.now()/1000; if (now < ST.nextHuntReadyT) return;
    if (!rules_canStartHuntHere()) return;
    setMode('hunt');
    blinkManifest(0.4 + Math.random()*0.4);
    setCollisionsEnabled(ST.isVisible);
    // clear perception so we don't retain stale info from before hunt
    ST.lastKnown = null; ST.lastSeenAt = 0; ST.lastHeardAt = 0; ST.investigateUntil = 0;
  }
  function endHunt(){
    if (!ST.ghostRoot) return;
    setMode('cooldown');
    setGhostVisible(false);
    const now=performance.now()/1000;
    ST.nextHuntReadyT = now + (CFG.minHuntCooldown + Math.random()*(CFG.maxHuntCooldown - CFG.minHuntCooldown)); // fixed
  }
  function setMode(m){
    ST.mode=m;
    const el=document.getElementById('hud-hunt-state');
    if (el) el.textContent = (m==='hunt'?'HUNTING':(m==='cooldown'?'Cooling':'Calm'));
    setCollisionsEnabled(ST.isVisible);
  }
  function canKillPlayer(){
    if (ST.mode !== 'hunt') return false;
    const g = ST.ghostRoot?.position, p = ST.c?.position; if (!g || !p) return false;
    const dx=g.x-p.x, dz=g.z-p.z, dist=Math.sqrt(dx*dx+dz*dz);
    if (dist > CFG.killRadius) return false;
    if (isSegmentBlocked(g, p)) return false;
    return true;
  }
  function performKill(){
    try{ window.onPlayerKilled?.(); }catch{}
    console.log('You died.');
    endHunt();
  }

  // ---------- Rule helpers ----------
  function playerRoom(){ return ST.c ? roomForPos(ST.c.position) : null; }
  function dist2(a,b){ const dx=a.x-b.x, dz=a.z-b.z; return dx*dx + dz*dz; }

  function getCrucifixes(){
    try{
      if (Array.isArray(window.ITEMS?.getCrucifixes?.())) return window.ITEMS.getCrucifixes();
    }catch{}
    const out=[];
    (ST.s?.meshes||[]).forEach(m=>{
      const n=(m.name||"").toLowerCase();
      if (/crucifix|cruci/.test(n)){
        const p = m.getAbsolutePosition?.() || m.position;
        if (p) out.push({pos:{x:p.x,y:p.y,z:p.z}, tier:(m.metadata?.tier||2)});
      }
    });
    return out;
  }
  function nearAnyFire(pos, dist){
    refreshHazards();
    const r2 = dist*dist;
    for (const f of ST.firesCache){
      const dx=pos.x-f.x, dz=pos.z-f.z; if (dx*dx+dz*dz <= r2) return true;
    }
    return false;
  }
  function nearCrucifix(pos){
    const list = getCrucifixes();
    if (!list.length) return false;
    for (const c of list){
      const R = CFG.demonCrucifixRadii?.[c.tier||2] || 6.0;
      const dx=pos.x-(c.pos?.x||0), dz=pos.z-(c.pos?.z||0);
      const d2 = dx*dx+dz*dz;
      if (d2 <= R*R) return true;
    }
    return false;
  }
  function rules_canStartHuntHere(){
    const type = ST.ghostTypeKey;
    const pos = ST.ghostRoot?.position || v3(0,0,0);
    if (type==='Shade'){
      const pr = playerRoom();
      if (pr && ST.curRoom && pr.id === ST.curRoom.id){
        if (Math.random() < 0.9) return false;
      }
    }
    if (type==='Onryo'){ if (nearAnyFire(pos, 4.0)) return false; }
    if (type==='Demon'){ if (nearCrucifix(pos)) return false; }
    return true;
  }
  function onSmudged(){
    if (ST.ghostTypeKey==='Yurei'){
      ST.smudgedUntil = (performance.now()/1000) + (TRAITS.Yurei.smudgeRoomLockSec||90);
    }
  }

  // ---------- Event scheduling with tendencies ----------
  function activityScale(){
    let k = 1.0;
    const T = traits();
    if (T.lessActivityInLight && ST.curRoom){
      const center = {x:ST.curRoom.center?.[0]||ST.ghostRoot.position.x, y:ST.ghostRoot.position.y, z:ST.curRoom.center?.[2]||ST.ghostRoot.position.z};
      const E = illuminationAtPoint(center);
      if (E>0) k *= 0.5;
    }
    const near = ST.nearPlayerTime > 0.2;
    if (T.shyNearPlayer && near) k *= 0.35;
    if (ST.ghostTypeKey==='Thaye'){
      const half = 35;
      const decay = Math.pow(0.5, ST.nearPlayerTime / Math.max(half, 1));
      k *= decay;
    }
    if (ST.ghostTypeKey==='Oni'){ k *= 2.2; }
    return k;
  }
  function tickScale(){
    const now=performance.now()/1000, dt=Math.min(0.1, Math.max(0, now-ST.lastUpdateT||0.016));
    return Math.min(1, dt);
  }

  // ---------- Frame Tick ----------
  function _tick(){
    const now=performance.now()/1000, dt=Math.min(0.1, Math.max(0, now-ST.lastUpdateT)); ST.lastUpdateT=now;
    if (!ST.ghostRoot) return;

    if (!ST.autoStarted && ST.mode==='idle'){
      bindHomeRoom();
      buildPatrolForRoom(ST.curRoom||ST.homeRoom);
      ST.target = pickRoamTarget();
      setMode('roam');
      ST.autoStarted = true;
    }

    updateSanity(dt);

    // dynamic event chance
    const chance = CFG.eventChance * activityScale();
    if (now-ST.lastEventT>CFG.eventCooldown){
      ST.lastEventT=now;
      if (Math.random() < chance) triggerEvent();
    }

    if (ST.mode!=='hunt' && ST.sanity<=CFG.huntSanityThreshold && now>=ST.nextHuntReadyT){
      if (Math.random()<0.12) beginHunt();
    }

    // ------------- Perception update -------------
    const sense = consumeSenseEvents(now);
    const saw   = traits().omniscient ? true : canSeePlayer();
    const heard = traits().omniscient ? true : chanceHearPlayer(dt);
    let pingPos = null;
    if (sense.pings.length){
      let best = sense.pings[0]; // strongest = most recent * strength
      for (const p of sense.pings){ if (p.str >= (best.str||1) && p.t >= best.t) best = p; }
      pingPos = v3(best.pos.x, ST.ghostRoot.position.y, best.pos.z);
    }
    if (saw){
      ST.lastKnown = ST.c.position.clone();
      ST.lastSeenAt = now;
      ST.investigateUntil = now + CFG.INVESTIGATE_TIME_S;
    } else if (heard){
      ST.lastKnown = ST.c.position.clone();
      ST.lastHeardAt = now;
      ST.investigateUntil = now + CFG.INVESTIGATE_TIME_S * 0.75;
    } else if (pingPos){
      ST.lastKnown = pingPos;
      ST.investigateUntil = now + CFG.ELECTRONIC_DECAY_S;
    }

    // ------------- Behavior -------------
    if (ST.mode==='roam'){
      if (Math.random()<0.01) maybeSwitchRoom();
      const speed = (ST.ghostTypeKey==='Banshee' && isDOTSActive())
        ? CFG.roamSpeed * 1.15
        : CFG.roamSpeed;
      const t = pickRoamTarget();
      moveToward(t, speed, dt);

    } else if (ST.mode==='hunt'){
      let targetPos = null;
      let speed = CFG.huntSpeed;

      if (traits().omniscient){ // Deogen: always knows; fast far, slow near
        const p = ST.c?.position || ST.ghostRoot.position;
        const g = ST.ghostRoot.position;
        const d = Math.max(0.001, BABYLON.Vector3.Distance(p, g));
        const k = clamp((d - CFG.deogenNearDist)/ (8.0 - CFG.deogenNearDist), 0, 1); // 0 near → 1 far-ish
        speed = CFG.deogenNearSpeed + (CFG.deogenFarSpeed - CFG.deogenNearSpeed) * k;
        targetPos = p.clone();
      } else if (saw) {
        targetPos = ST.c.position.clone();
      } else if (ST.lastKnown && now <= ST.investigateUntil) {
        // investigate around last-known
        const jitter = v3(
          (Math.random()*2-1)*CFG.INVESTIGATE_WANDER,
          0,
          (Math.random()*2-1)*CFG.INVESTIGATE_WANDER
        );
        targetPos = ST.lastKnown.add(jitter);
      } else {
        // failed to reacquire → keep hunting but roam
        targetPos = pickRoamTarget();
      }

      moveToward(targetPos, speed, dt);

      if (!devForce() && Math.random()<0.03) blinkManifest(0.12+Math.random()*0.18);
      if (canKillPlayer()) performKill();
      if (ST.sanity<=0) endHunt();

    } else if (ST.mode==='cooldown'){
      const t = pickRoamTarget();
      moveToward(t, CFG.roamSpeed*0.65, dt);
      if (now>=ST.nextHuntReadyT - CFG.minHuntCooldown*0.5) setMode('roam');
    }
  }

  // ---------- Rules API ----------
  function publishRulesAPI(){
    window.GHOST_RULES = {
      getTraits: ()=> Object.assign({}, TRAITS[ST.ghostTypeKey]||{}),
      canToggleBreaker(action){ if (ST.ghostTypeKey==='Jinn' && action==='off') return false; if (ST.ghostTypeKey==='Hantu'&& action==='on') return false; return true; },
      canToggleLight(action){ if (ST.ghostTypeKey==='Mare' && action==='on') return false; return true; },
      canPerformEvent(type){ if ((type==='mist'||type==='mistform') && ST.ghostTypeKey==='Oni') return false; return true; },
      canStepSalt(){ return ST.ghostTypeKey!=='Wraith'; },
      canShowDOTS(ctx){
        if (ST.ghostTypeKey!=='Goryo') return true;
        const v = (ctx&&ctx.viewer)||'player';
        const inRoom = (ctx&&ctx.playerInRoom)!=null ? !!ctx.playerInRoom :
                       (!!playerRoom() && ST.curRoom && playerRoom().id===ST.curRoom.id);
        if (v==='video' && !inRoom) return true; else return false;
      },
      canStartHuntHere(){ return rules_canStartHuntHere(); },
      canThrowEMF3(){
        if (ST.ghostTypeKey!=='Shade') return true;
        const pr = playerRoom();
        return !(pr && ST.curRoom && pr.id===ST.curRoom.id);
      },
      eventWeight(type){
        let w = 1;
        if (ST.ghostTypeKey==='Oni' && (type==='blink'||type==='shadow')) w *= 1.8;
        if (ST.ghostTypeKey==='Banshee' && type==='sing') w *= 2.0;
        if (ST.ghostTypeKey==='Shade' && (type==='airball'||type==='shadow'||type==='blink')) w *= 1.4;
        if (ST.ghostTypeKey==='Myling' && type==='whisper') w *= 2.0;
        if (ST.ghostTypeKey==='Mare' && (type==='flicker')) w *= 1.3;
        if (ST.ghostTypeKey==='Mare' && ST.curRoom){
          const center = {x:ST.curRoom.center?.[0]||ST.ghostRoot.position.x, y:ST.ghostRoot.position.y, z:ST.curRoom.center?.[2]||ST.ghostRoot.position.z};
          const E = illuminationAtPoint(center); if (E>0) w *= 0.5;
        }
        if (ST.ghostTypeKey==='Shade' && ST.nearPlayerTime>0.2) w *= 0.35;
        if (ST.ghostTypeKey==='Thaye'){
          const half = 35;
          const decay = Math.pow(0.5, ST.nearPlayerTime / Math.max(half, 1));
          w *= decay;
        }
        return w;
      },
      breakerActionWeight(action){ let w=1; if (ST.ghostTypeKey==='Hantu' && action==='off') w*=2.0; return w; },
      lightActionWeight(action){ let w=1; if (ST.ghostTypeKey==='Mare' && action==='off') w*=2.0; return w; },
      paraWhisperWeight(){ return (ST.ghostTypeKey==='Myling') ? 2.2 : 1.0; }
    };
  }

  // ---------- DOTS helpers ----------
  function isDOTSActive(){
    try{
      if (window.DOTS?.isActive) return !!window.DOTS.isActive();
      if (window.DOTS_STATE!=null) return !!window.DOTS_STATE;
    }catch{}
    return false;
  }
  function getMarkedPlayerPos(){
    try{
      if (window.DOTS?.markedPlayerPosition) return window.DOTS.markedPlayerPosition();
      if (window.BANSHEE_MARKED_PLAYER_POS) return window.BANSHEE_MARKED_PLAYER_POS;
    }catch{}
    return null;
  }

  // ---------- Utils ----------
  function setHomeRoomById(id){
    const r = (ST.rooms||[]).find(x=> x.id===id) || (ST.rooms||[]).find(x=> x.name===id);
    if (!r) return false;
    ST.homeRoom = r; ST.curRoom = r; buildPatrolForRoom(r); ST.patrolIdx=0; ST.target = ST.patrol[0];
    return true;
  }

})();
