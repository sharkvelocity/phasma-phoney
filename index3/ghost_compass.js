// ./assets/index3/ghost_compass.js
// Tiny red compass that points to the ghost; shows distance.
(function(){
  "use strict";
  const S = ()=> window.scene || window.SCENE || BABYLON.Engine?.LastCreatedScene;
  const C = ()=> (S() && (S().activeCamera || window.camera)) || null;

  // DOM
  function ensureUI(){
    if (document.getElementById("ghost-compass")) return;
    const wrap = document.createElement("div");
    wrap.id = "ghost-compass";
    wrap.innerHTML = `
      <div class="gc-dial">
        <div class="gc-arrow"></div>
      </div>
      <div class="gc-text"><span id="gc-dist">--</span>m</div>
    `;
    document.body.appendChild(wrap);
    const css = document.createElement("style");
    css.textContent = `
      #ghost-compass{
        position:fixed; top:10px; left:50%; transform:translateX(-50%);
        display:flex; align-items:center; gap:8px; z-index:7000;
        pointer-events:none; user-select:none;
        filter: drop-shadow(0 0 6px rgba(255,0,0,0.35));
      }
      #ghost-compass .gc-dial{
        width:28px; height:28px; border:2px solid #c22; border-radius:50%;
        background:rgba(0,0,0,0.55); position:relative;
      }
      #ghost-compass .gc-arrow{
        position:absolute; left:50%; top:50%;
        width:0; height:0; transform-origin:50% 80%;
        border-left:5px solid transparent;
        border-right:5px solid transparent;
        border-bottom:10px solid #f33; /* red needle */
        transform:translate(-50%,-75%) rotate(0deg);
      }
      #ghost-compass .gc-text{
        font:12px/1.2 monospace; color:#faa;
        background:rgba(0,0,0,0.45); border:1px solid #733;
        padding:2px 6px; border-radius:6px;
      }
    `;
    document.head.appendChild(css);
  }

  function deg(rad){ return rad * 180/Math.PI; }
  function bearingToGhost(cam, ghostPos){
    // cam forward yaw
    const f = cam.getForwardRay(1).direction;
    const yaw = Math.atan2(f.x, f.z); // world yaw

    // vector cam->ghost on XZ
    const dx = ghostPos.x - cam.position.x;
    const dz = ghostPos.z - cam.position.z;
    const ang = Math.atan2(dx, dz);   // absolute bearing

    // relative angle (turn needle so 0 = forward)
    let d = ang - yaw;
    while (d >  Math.PI) d -= Math.PI*2;
    while (d < -Math.PI) d += Math.PI*2;
    return d;
  }

  function getGhostPos(){
    try{
      // Preferred: ghostCtrl API we shipped earlier
      if (window.ghostCtrl && typeof window.ghostCtrl.getState === "function"){
        const st = window.ghostCtrl.getState();
        if (st && st.pos) return new BABYLON.Vector3(st.pos.x, st.pos.y, st.pos.z);
      }
    }catch{}
    // Fallback: find a node named like GhostRoot
    const s = S();
    const root = s && s.getNodeByName && (s.getNodeByName(/^GhostRoot/i) || s.getNodeByName("GhostRoot"));
    return root && root.position ? root.position.clone() : null;
  }

  function setup(){
    ensureUI();
    const s = S(); if (!s) return setTimeout(setup, 100);
    const arrow = document.querySelector("#ghost-compass .gc-arrow");
    const distL = document.getElementById("gc-dist");
    const wrap  = document.getElementById("ghost-compass");

    s.onBeforeRenderObservable.add(()=>{
      const cam = C();
      const gp  = getGhostPos();
      if (!cam || !gp){
        wrap.style.display = "none";
        return;
      }
      wrap.style.display = "flex";

      // Rotate needle
      const rel = bearingToGhost(cam, gp);
      arrow.style.transform = `translate(-50%,-75%) rotate(${deg(rel)}deg)`;

      // Distance
      const dx = gp.x - cam.position.x, dy = gp.y - cam.position.y, dz = gp.z - cam.position.z;
      const d  = Math.sqrt(dx*dx + dy*dy + dz*dz);
      distL.textContent = Math.max(1, Math.round(d));
    });
  }
  setup();
})();