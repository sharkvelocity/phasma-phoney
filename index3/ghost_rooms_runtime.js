// ghost_rooms_runtime.js v1.2 — Room-aware, adjacency-limited, personality-weighted roaming
// Works with ghost_movement.js v1.7+ via window.pickRoamTargetOverride()
// Exposes: ghostCtrl.setRooms(rooms), ghostCtrl.setCurrentRoomByName(name)
(function(){
  "use strict";
  const S = ()=> window.scene || window.SCENE || BABYLON.Engine?.LastCreatedScene;

  // ---------- geometry helpers ----------
  function pointInPolyXZ(pt, poly){
    let c=false, x=pt.x, z=pt.z;
    for (let i=0, j=poly.length-1; i<poly.length; j=i++){
      const pi=poly[i], pj=poly[j];
      const inter = ((pi.z>z)!==(pj.z>z)) && (x < (pj.x - pi.x)*(z - pi.z)/((pj.z - pi.z)||1e-9) + pi.x);
      if (inter) c=!c;
    }
    return c;
  }
  function randomPointInPoly(poly, maxTries=40){
    let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
    for (const p of poly){ minX=Math.min(minX,p.x); maxX=Math.max(maxX,p.x); minZ=Math.min(minZ,p.z); maxZ=Math.max(maxZ,p.z); }
    for (let i=0;i<maxTries;i++){
      const x=minX+Math.random()*(maxX-minX), z=minZ+Math.random()*(maxZ-minZ);
      if (pointInPolyXZ({x,z}, poly)) return {x,z};
    }
    // centroid fallback
    const c=poly.reduce((a,p)=>({x:a.x+p.x,z:a.z+p.z}),{x:0,z:0});
    return { x:c.x/poly.length, z:c.z/poly.length };
  }
  function centroid(poly){
    let A=0,cx=0,cz=0, n=poly.length;
    for (let i=0;i<n;i++){
      const p=poly[i], q=poly[(i+1)%n];
      const f = p.x*q.z - q.x*p.z;
      A+=f; cx+=(p.x+q.x)*f; cz+=(p.z+q.z)*f;
    }
    A*=0.5;
    if (Math.abs(A)<1e-6){
      const a=poly.reduce((k,p)=>({x:k.x+p.x,z:k.z+p.z}),{x:0,z:0});
      return {x:a.x/poly.length, z:a.z/poly.length};
    }
    return {x:cx/(6*A), z:cz/(6*A)};
  }
  function polyEdgeSegments(poly){
    const segs=[]; for(let i=0;i<poly.length;i++){
      const a=poly[i], b=poly[(i+1)%poly.length]; segs.push([a,b]);
    } return segs;
  }
  function segmentOverlapLen(a1,a2,b1,b2, thresh=0.25){
    // XZ overlap length by projecting roughly parallel edges; quick heuristic
    const ax=a2.x-a1.x, az=a2.z-a1.z, bx=b2.x-b1.x, bz=b2.z-b1.z;
    const aLen=Math.hypot(ax,az), bLen=Math.hypot(bx,bz);
    if (aLen<thresh||bLen<thresh) return 0;
    // direction similarity
    const dot=(ax*bx+az*bz)/(aLen*bLen);
    if (Math.abs(dot)<0.92) return 0; // not parallel enough
    // Sample midpoints & distances
    const amid={x:(a1.x+a2.x)/2, z:(a1.z+a2.z)/2};
    const bmid={x:(b1.x+b2.x)/2, z:(b1.z+b2.z)/2};
    const dist=Math.hypot(amid.x-bmid.x, amid.z-bmid.z);
    if (dist>0.6) return 0;
    // If parallel & close, treat as door/shared boundary; use min length
    return Math.min(aLen,bLen);
  }

  // ---------- runtime room state ----------
  const RT = {
    rooms: [],         // [{id,name,y,polygon:[{x,z}], __centroid, __light, __fires }]
    adj: new Map(),    // roomId -> Set(roomId)
    current: null,     // current room index
    lastSwitchT: 0,    // secs
    minSwitchGap: 6.0, // don't hop rooms faster than this
    debug: false
  };

  // ---------- scene sampling (lights / fire sources / player) ----------
  function roomCentroid(i){ return (RT.rooms[i].__centroid ||= centroid(RT.rooms[i].polygon)); }
  function roomLightLevel(i){
    const r=RT.rooms[i]; if (r.__light!==undefined) return r.__light;
    const sc=S(); const c=roomCentroid(i);
    let sum=0, count=0;
    for (const L of (sc?.lights||[])){
      try{
        const p=L.getAbsolutePosition?.()||L.position; if (!p) continue;
        const d=Math.hypot(p.x-c.x,p.z-c.z);
        const reach = 12; // heuristic reach
        if (d<=reach){ sum += (L.intensity||1) * (1 - d/reach); count++; }
      }catch{}
    }
    r.__light = Math.max(0, Math.min(1, count? (sum/Math.max(1,count))*0.9 : 0));
    return r.__light;
  }
  function roomHasFire(i){
    const r=RT.rooms[i]; if (r.__fires!==undefined) return r.__fires;
    const sc=S(); let any=false;
    const nameRx=/candle|fire|campfire|fireplace|brazier|incense|bonfire|smudge|lighter/i;
    for (const m of (sc?.meshes||[])){
      try{
        const on = m?.metadata?.isFireOn || m?.metadata?.isCandleLit || nameRx.test(m.name||"");
        if (!on) continue;
        if (pointInPolyXZ(m.getAbsolutePosition?.()||m.position, r.polygon)){ any=true; break; }
      }catch{}
    }
    r.__fires = any;
    return any;
  }
  function playerPos(){
    const sc=S();
    return sc?.activeCamera?.position || sc?.__playerBody?.position || (sc&&sc.getMeshByName&&sc.getMeshByName('player_capsule')?.position) || null;
  }
  function playerRoomIdx(){
    const p=playerPos(); if (!p) return -1;
    for (let i=0;i<RT.rooms.length;i++){
      if (pointInPolyXZ({x:p.x,z:p.z}, RT.rooms[i].polygon)) return i;
    }
    return -1;
  }

  // ---------- build adjacency from polygons ----------
  function buildAdjacency(){
    RT.adj.clear();
    const N=RT.rooms.length;
    const edges = Array.from({length:N}, (_,i)=> polyEdgeSegments(RT.rooms[i].polygon));
    for (let i=0;i<N;i++){
      for (let j=i+1;j<N;j++){
        let shared=0;
        for (const [a1,a2] of edges[i]){
          for (const [b1,b2] of edges[j]){
            shared = Math.max(shared, segmentOverlapLen(a1,a2,b1,b2));
            if (shared>0.5) break;
          }
          if (shared>0.5) break;
        }
        if (shared>0.5){
          (RT.adj.get(i) || RT.adj.set(i,new Set()).get(i)).add(j);
          (RT.adj.get(j) || RT.adj.set(j,new Set()).get(j)).add(i);
        }
      }
    }
  }

  // ---------- personality scoring ----------
  function ghostKey(){ return window.currentGhostKey || Object.keys(window.GHOSTS||{})[0] || "Spirit"; }

  function scoreRoomTransition(fromIdx, toIdx){
    const key = ghostKey();
    const now = performance.now()/1000;

    // Block rapid hopping
    if (now - RT.lastSwitchT < RT.minSwitchGap && toIdx!==fromIdx) return 0.0001;

    // Must be adjacent unless same room (fallback if no adj graph)
    const neighbors = RT.adj.get(fromIdx);
    if (toIdx!==fromIdx && neighbors && !neighbors.has(toIdx)) return 0.0001;

    // Base
    let s = (toIdx===fromIdx) ? 1.2 : 1.0;

    // Light level & fire presence
    const light = roomLightLevel(toIdx);
    const fire  = roomHasFire(toIdx);
    const pIdx  = playerRoomIdx();

    // Personality modifiers
    switch (key){
      case 'Goryo':
        // stays put, minimal wandering to adjacents
        if (toIdx===fromIdx) s *= 3.0; else s *= 0.05;
        break;
      case 'Mare':
        // avoids lit rooms, prefers dark
        s *= (1.4 - Math.min(1, light + 0.05));   // light 1.0 -> 0.35x, dark ~1.35x
        break;
      case 'Onryo':
        // avoids rooms with active fire
        if (fire) s *= 0.1;
        break;
      case 'Shade':
        // avoids player’s current room & generally stays quieter near players
        if (toIdx===pIdx) s *= 0.25;
        break;
      case 'Banshee':
      case 'Phantom':
        // gravitates toward players (room and its neighbors)
        if (toIdx===pIdx) s *= 1.8;
        else if (pIdx>=0 && RT.adj.get(pIdx)?.has(toIdx)) s *= 1.3;
        break;
      case 'Hantu':
        // likes breaker-off / cool, but here use light proxy (darker = cooler vibe)
        s *= (1.1 - 0.3*light);
        break;
      case 'Thaye':
        // starts active near players then calms (approximate with time-decay)
        if (pIdx===toIdx){
          const t = now/120; s *= (1.6 * Math.exp(-0.3*t) + 0.7);
        }
        break;
      default:
        break;
    }

    return Math.max(0.00001, s);
  }

  function pickNextRoom(fromIdx){
    if (!RT.rooms.length) return fromIdx;
    // Consider staying or moving to one neighbor
    const cand = new Set([fromIdx]);
    const N = RT.rooms.length;
    const nb = RT.adj.get(fromIdx);
    if (nb && nb.size){ nb.forEach(i=> cand.add(i)); }
    else {
      // if no adjacency built (single room), allow any but prefer fromIdx
      for (let i=0;i<N;i++) cand.add(i);
    }
    let bestIdx = fromIdx, bestScore = -1;
    cand.forEach(i=>{
      const sc = scoreRoomTransition(fromIdx, i);
      // random tie-breaker
      const jitter = (Math.random()*0.2+0.9);
      const total = sc*jitter;
      if (total > bestScore){ bestScore=total; bestIdx=i; }
    });
    if (bestIdx!==fromIdx) RT.lastSwitchT = performance.now()/1000;
    return bestIdx;
  }

  // ---------- target provider (hook for ghost AI) ----------
  function provideTargetInsideCurrentRoom(){
    if (!RT.rooms.length) return null;
    const idx = (RT.current ?? 0);
    const r = RT.rooms[idx];
    const p = randomPointInPoly(r.polygon);
    return new BABYLON.Vector3(p.x, r.y, p.z);
  }

  // We’ll be called by the AI whenever it needs a new roam target.
  // Decide (maybe) to switch room, then produce a target within it.
  function pickRoamTargetOverride(){
    if (!RT.rooms.length) return null;
    if (RT.current===null){
      // pick the room containing the ghost (or closest centroid)
      try{
        const st = window.ghostCtrl?.getState?.();
        if (st?.pos){
          const pos = {x:st.pos.x, z:st.pos.z};
          let found=-1, best=-1, bd=Infinity;
          for (let i=0;i<RT.rooms.length;i++){
            const r=RT.rooms[i];
            if (pointInPolyXZ(pos, r.polygon)){ found=i; break; }
            const c=r.__centroid||roomCentroid(i);
            const d=(c.x-pos.x)**2 + (c.z-pos.z)**2;
            if (d<bd){ bd=d; best=i; }
          }
          RT.current = (found>=0?found:best>=0?best:0);
        } else { RT.current = 0; }
      } catch { RT.current = 0; }
    }
    // maybe hop to another room (personality-weighted)
    RT.current = pickNextRoom(RT.current);
    // return a point inside the (new) current room
    return provideTargetInsideCurrentRoom();
  }

  // ---------- ghostCtrl integration ----------
  function attachToGhost(){
    if (!window.ghostCtrl || typeof window.ghostCtrl!=='object') return false;

    if (!ghostCtrl.setRooms){
      ghostCtrl.setRooms = function(roomsArray){
        RT.rooms = Array.isArray(roomsArray)? roomsArray.slice() : [];
        RT.rooms.forEach(r=> r.__centroid = centroid(r.polygon));
        buildAdjacency();
        RT.current = 0;
        RT.lastSwitchT = 0;
      };
      ghostCtrl.setCurrentRoomByName = function(name){
        const idx = RT.rooms.findIndex(r=> r.name===name);
        if (idx>=0) RT.current = idx;
      };
      ghostCtrl.getCurrentRoom = ()=> (RT.current!=null? RT.rooms[RT.current] : null);
    }

    // Install the roam override hook the AI looks for
    window.pickRoamTargetOverride = pickRoamTargetOverride;

    // Optional debug HUD
    if (!window.__ghostRoomsHUD){
      const el = document.createElement('div');
      el.id = 'ghost-rooms-hud';
      el.style.cssText = 'position:fixed;right:12px;top:12px;z-index:6000;background:rgba(0,0,0,0.5);border:1px solid #066;padding:6px 8px;border-radius:6px;color:#9ef;font:12px monospace;display:none;';
      document.body.appendChild(el);
      window.__ghostRoomsHUD = el;
      setInterval(()=>{
        if (!RT.debug || RT.current==null) { el.style.display='none'; return; }
        const r = RT.rooms[RT.current];
        el.style.display='block';
        el.textContent = `Ghost Room: ${r?.name||'—'} | Light:${roomLightLevel(RT.current).toFixed(2)} | Fire:${roomHasFire(RT.current)?'Y':'N'}`;
      }, 300);
      window.toggleGhostRoomDebug = function(on){ RT.debug = (on!==undefined)? !!on : !RT.debug; };
    }
    return true;
  }

  // ---------- boot & auto-load ----------
  const boot = setInterval(()=>{
    if (attachToGhost()){
      clearInterval(boot);
      // Auto-bind rooms if a manifest is present
      const R = (window.MAP_MANIFEST && Array.isArray(window.MAP_MANIFEST.rooms) && window.MAP_MANIFEST.rooms)
             || (window.BUILDER_ROOMS_API && window.BUILDER_ROOMS_API.export && window.BUILDER_ROOMS_API.export());
      if (R && R.length) ghostCtrl.setRooms(R);
    }
  }, 120);
})();