// salt_system.js
// Disturbable salt lines that: (1) always play 3 step sounds when disturbed,
// (2) spawn UV footprints only if the ghost has UV evidence,
// (3) do NOTHING for Wraiths (they don't disturb the salt).

(function(){
  'use strict';
  if (window.SaltSystemV2) return;

  const SCENE = ()=> window.scene || BABYLON.Engine?.LastCreatedScene;

  // ---------------- Audio ----------------
  const StepAudio = (function(){
    let s1=null, s2=null, s3=null;
    const tried = { s1:false, s2:false, s3:false };

    function tryLoad(nameBase){
      const s = SCENE(); if (!s) return null;
      // try mp3 then wav
      try { return new BABYLON.Sound(nameBase, `./assets/audio/${nameBase}.mp3`, s, null, {
        spatialSound:true, autoplay:false, loop:false, volume:0.9, refDistance:2, rolloffFactor:1.2, maxDistance:25
      }); } catch(_) {}
      try { return new BABYLON.Sound(nameBase, `./assets/audio/${nameBase}.wav`, s, null, {
        spatialSound:true, autoplay:false, loop:false, volume:0.9, refDistance:2, rolloffFactor:1.2, maxDistance:25
      }); } catch(_) {}
      return null;
    }

    function ensureOne(which){
      const s = SCENE(); if (!s) return null;
      if (which===1 && !s1 && !tried.s1){ s1 = tryLoad('step1'); tried.s1=true; }
      if (which===2 && !s2 && !tried.s2){ s2 = tryLoad('step2'); tried.s2=true; }
      if (which===3 && !s3 && !tried.s3){ s3 = tryLoad('step3'); tried.s3=true; }
      return which===1 ? s1 : which===2 ? s2 : s3;
    }

    function setPosAndPlay(sound, pos){
      try { sound?.setPosition?.(pos); sound?.stop?.(); sound?.play?.(); } catch(_) {}
    }

    return {
      playTripletAt(pos){
        const a = ensureOne(1), b = ensureOne(2), c = ensureOne(3);
        // fallback: if any missing, just skip it gracefully
        setPosAndPlay(a, pos);
        setTimeout(()=> setPosAndPlay(b, pos), 230);
        setTimeout(()=> setPosAndPlay(c, pos), 480);
      }
    };
  })();

  // ---------------- Helpers ----------------
  function say(msg){ try{ toast?.(msg); }catch(_){ console.log('[Salt]', msg); } }

  function ghostType(){
    try { return (window.ghost?.type || '').toLowerCase(); } catch(_) { return ''; }
  }

  function ghostHasUvEvidence(){
    try {
      if (typeof window.ghostHasEvidence !== 'function') return true; // permissive fallback
      // Check several common keys
      return (
        ghostHasEvidence('uv') ||
        ghostHasEvidence('fingerprints') ||
        ghostHasEvidence('prints') ||
        ghostHasEvidence('ultraviolet')
      );
    } catch(_) { return true; }
  }

  function aimPoint(maxDist=3.8){
    const s=SCENE(); const cam = s?.activeCamera;
    if (!cam) return new BABYLON.Vector3(0,0,0);
    const ray = cam.getForwardRay(maxDist);
    const pick = s.pickWithRay(ray, m=>m && m.isPickable!==false);
    if (pick?.hit) return pick.pickedPoint.clone();
    const ahead = cam.position.add(ray.direction.scale(Math.min(maxDist, 3.5)));
    ahead.y = 0.02; return ahead;
  }

  // ---------------- Salt placement ----------------
  const SALT_LINES = [];
  function placeSaltLine(){
    const s=SCENE(); if (!s) return;
    const center = aimPoint(3.8);
    const fwd = s.activeCamera.getForwardRay().direction;
    const yaw = Math.atan2(fwd.z, fwd.x);
    const half = 0.60;
    const a = new BABYLON.Vector3(center.x - Math.cos(yaw)*half, 0.01, center.z - Math.sin(yaw)*half);
    const b = new BABYLON.Vector3(center.x + Math.cos(yaw)*half, 0.01, center.z + Math.sin(yaw)*half);
    const mesh = BABYLON.MeshBuilder.CreateTube('salt_line', {path:[a,b], radius:0.05, tessellation:4}, s);
    const mat = new BABYLON.StandardMaterial('salt_mat', s);
    mat.diffuseColor = new BABYLON.Color3(0.95,0.95,0.95);
    mat.specularColor = new BABYLON.Color3(0.2,0.2,0.2);
    mat.emissiveColor = new BABYLON.Color3(0.05,0.05,0.05);
    mat.alpha = 0.9;
    mesh.material = mat;
    const mid = new BABYLON.Vector3((a.x+b.x)/2, 0.02, (a.z+b.z)/2);
    SALT_LINES.push({mesh, a, b, mid, disturbed:false, mat, yaw});
    say('Salt line placed');
  }

  // ---------------- Disturbance detection ----------------
  let lastGhostPos = null;

  function pointToSegDistanceXZ(p, a, b){
    const apx = p.x - a.x, apz = p.z - a.z;
    const abx = b.x - a.x, abz = b.z - a.z;
    const ab2 = abx*abx + abz*abz + 1e-9;
    const t = Math.max(0, Math.min(1, (apx*abx + apz*abz)/ab2));
    const projx = a.x + abx*t, projz = a.z + abz*t;
    const dx = p.x - projx, dz = p.z - projz;
    return Math.sqrt(dx*dx + dz*dz);
  }

  function disturbCheck(ghostPos){
    // Wraith: does not disturb the salt at all → return early
    if (ghostType() === 'wraith') return;

    for (const s of SALT_LINES){
      if (s.disturbed) continue;
      const d = pointToSegDistanceXZ(ghostPos, s.a, s.b);
      if (d < 0.18){
        // Mark disturbed
        s.disturbed = true;

        // 1) ALWAYS play the three step sounds
        StepAudio.playTripletAt(s.mid);

        // 2) Spawn UV footprints only if ghost has UV evidence
        if (ghostHasUvEvidence()){
          try {
            const dirYaw = (function(){
              if (lastGhostPos){
                const dx = ghostPos.x - lastGhostPos.x, dz = ghostPos.z - lastGhostPos.z;
                if (dx*dx + dz*dz > 1e-4) return Math.atan2(dx, dz); // face along movement
              }
              return s.yaw; // fallback: along the salt line orientation
            })();
            // two pairs to make it feel like walking through
            UVPrints.addStepPair(s.mid, dirYaw);
            const step2 = s.mid.add(new BABYLON.Vector3(Math.sin(dirYaw), 0, Math.cos(dirYaw)).scale(0.45));
            UVPrints.addStepPair(step2, dirYaw);
          } catch(_){}
        }
      }
    }
  }

  function attachLoop(){
    const s=SCENE(); if (!s){ setTimeout(attachLoop, 120); return; }
    const eng=s.getEngine?.()||BABYLON.Engine?.LastCreatedEngine;
    s.onBeforeRenderObservable.add(()=>{
      try{
        const gpos = (window.ghost?.position || window.ghost?.mesh?.position || BABYLON.Vector3.Zero());
        disturbCheck(gpos);
        lastGhostPos = gpos.clone?.() || gpos;
      }catch(_){}
    });
  }
  attachLoop();

  // Expose API
  window.SaltSystemV2 = { place: placeSaltLine };
  window.placeSalt = placeSaltLine; // convenience
})();

/* ---- Storage registration (Salt item) ---- */
(function(){
  if (!window.registerItem) return;
  registerItem({
    id: "salt",
    name: "Salt",
    icon: "./assets/icons/salt.png",
    defaultCharges: 3,
    onEquip(){ /* place with 'C' below or call window.placeSalt() */ }
  });

  // Keep belt charges in sync whenever player places salt
  (function wrapPlaceSalt(){
    const orig = window.placeSalt;
    window.placeSalt = function(){
      const r = orig?.();
      try{
        const slot = window.activeItemSlot || 1;
        if (window.inventory?.slots?.[slot] === "Salt"){
          const cur = window.inventory.slotCharges?.[slot];
          if (isFinite(cur)) window.inventory.slotCharges[slot] = Math.max(0, (cur||0) - 1);
          window.rebuildBelt?.();
        }
      }catch(_){}
      return r;
    };
  })();

  // Optional hotkey: C to place salt when equipped
  if (!window.__SALT_keybound){
    window.__SALT_keybound = true;
    window.addEventListener("keydown", (e)=>{
      if ((e.key === "c" || e.key === "C") && window.inventory){
        const slot = window.activeItemSlot || 1;
        if (window.inventory.slots?.[slot] === "Salt"){
          try{ window.placeSalt?.(); }catch(_){}
        }
      }
    });
  }
})();
