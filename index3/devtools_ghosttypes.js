// ./assets/index3/devtools_ghosttypes.js
// DevTools: full ghost list + teleport + hunt/idle controls.
(function(){
  "use strict";

  // ---------- helpers ----------
  function $(sel, root){ return (root||document).querySelector(sel); }
  function el(tag, cls, txt){
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt) n.textContent = txt;
    return n;
  }

  function getAllGhostTypes(){
    if (window.GHOST_DATA && typeof window.GHOST_DATA === "object") {
      return Object.keys(window.GHOST_DATA).sort((a,b)=>a.localeCompare(b));
    }
    if (window.GhostAPI && typeof GhostAPI.types === "function") {
      try { return GhostAPI.types().slice().sort((a,b)=>a.localeCompare(b)); } catch {}
    }
    return ["Spirit","Wraith","Banshee"]; // fallback
  }

  function getGhostRoot(){
    // Prefer explicit root from GhostAPI if exposed
    if (window.GhostAPI && (GhostAPI.root || GhostAPI.ghostRoot)) {
      return GhostAPI.root || GhostAPI.ghostRoot;
    }
    // Heuristic: first top-level node matching /ghost/i, else a recently added top-level mesh
    try {
      const top = scene.meshes.filter(m => !m.parent);
      const byName = top.find(m => /ghost/i.test(m.name||""));
      if (byName) return byName;
      return top[top.length-1] || null;
    } catch { return null; }
  }

  function pickGroundY(x, z){
    try {
      const origin = new BABYLON.Vector3(x, 50, z);
      const dir = new BABYLON.Vector3(0,-1,0);
      const ray = new BABYLON.Ray(origin, dir, 200);
      const hit = scene.pickWithRay(ray, m => !!m && m.isPickable !== false);
      if (hit && hit.hit && hit.pickedPoint) return hit.pickedPoint.y;
    } catch {}
    return 0; // fallback plane
  }

  function forwardPick(maxDist=30){
    try {
      const ray = camera.getForwardRay(maxDist);
      const hit = scene.pickWithRay(ray, m => !!m && m.isPickable !== false);
      if (hit && hit.hit && hit.pickedPoint) return hit;
    } catch {}
    return null;
  }

  async function changeGhostType(type){
    window.currentGhostKey = type;
    try {
      if (window.GhostAPI && typeof GhostAPI.loadGhost === "function") {
        await GhostAPI.loadGhost(type); // ghost_glue will re-attach movement
      }
      // Ensure movement has correct type even if model wasn't reloaded
      window.GhostMove?.setType(type, window.GHOST_DATA?.[type]);
    } catch(e) {
      console.warn("[devtools] ghost change failed", e);
    }
  }

  function teleportGhostToPlayer(){
    const root = getGhostRoot(); if (!root || !window.camera) return;
    const x = camera.position.x, z = camera.position.z;
    const y = pickGroundY(x, z);
    root.position.set(x, y + 0.05, z);
  }

  function teleportGhostToCrosshair(){
    const root = getGhostRoot(); if (!root || !window.camera) return;
    const hit = forwardPick(50);
    if (hit && hit.pickedPoint) {
      const p = hit.pickedPoint;
      root.position.set(p.x, p.y + 0.05, p.z);
    } else {
      // fallback: drop ~5m ahead on ground
      const fwd = camera.getForwardRay(5).direction;
      const tx = camera.position.x + fwd.x * 5;
      const tz = camera.position.z + fwd.z * 5;
      const ty = pickGroundY(tx, tz);
      root.position.set(tx, ty + 0.05, tz);
    }
  }

  function setHunt(on){
    window.isGhostHunting = !!on;
    window.GhostMove?.setMode(on ? "hunt" : "idle");
    const hud = $('#hud-weather'); // just any HUD element to flash feedback if you like
    if (hud) { hud.textContent = on ? "HUNTING" : "Calm"; }
  }

  // ---------- UI injection ----------
  function mountControls(){
    const panel = document.getElementById('devtools-panel') || document.body;
    if (!panel) return;

    let box = panel.querySelector('#ghost-tools');
    if (!box) {
      box = el('div'); box.id = 'ghost-tools';
      box.style.margin = '8px 0';
      box.style.padding = '8px';
      box.style.border = '1px solid rgba(255,255,255,0.15)';
      box.style.borderRadius = '8px';
      panel.appendChild(box);
    }
    box.innerHTML = ""; // rebuild

    const title = el('div', null, "👻 Ghost Tools");
    title.style.fontWeight = '700';
    title.style.marginBottom = '6px';
    box.appendChild(title);

    const row1 = el('div'); row1.style.display = 'flex'; row1.style.gap = '6px'; row1.style.flexWrap = 'wrap';
    const sel = el('select'); sel.id = 'ghost-type-select'; sel.style.minWidth = '180px';

    // Populate types
    const types = getAllGhostTypes();
    const current = window.currentGhostKey && types.includes(window.currentGhostKey) ? window.currentGhostKey : types[0];
    types.forEach(t => {
      const opt = el('option'); opt.value = t; opt.textContent = t;
      if (t === current) opt.selected = true;
      sel.appendChild(opt);
    });

    const btnReload = el('button', null, 'Reload');
    const btnTPPlayer = el('button', null, 'TP → Player');
    const btnTPCross = el('button', null, 'TP → Crosshair');
    btnReload.type = btnTPPlayer.type = btnTPCross.type = 'button';

    row1.appendChild(sel);
    row1.appendChild(btnReload);
    row1.appendChild(btnTPPlayer);
    row1.appendChild(btnTPCross);
    box.appendChild(row1);

    const row2 = el('div'); row2.style.display = 'flex'; row2.style.gap = '6px'; row2.style.marginTop = '6px';
    const btnHunt = el('button', null, 'Start Hunt');
    const btnIdle = el('button', null, 'Stop Hunt');
    btnHunt.type = btnIdle.type = 'button';
    row2.appendChild(btnHunt);
    row2.appendChild(btnIdle);
    box.appendChild(row2);

    // Wire events
    sel.onchange = () => changeGhostType(sel.value);
    btnReload.onclick = () => changeGhostType(sel.value);
    btnTPPlayer.onclick = teleportGhostToPlayer;
    btnTPCross.onclick = teleportGhostToCrosshair;
    btnHunt.onclick = () => setHunt(true);
    btnIdle.onclick = () => setHunt(false);
  }

  // mount when ready
  if (document.readyState !== "loading") mountControls();
  else document.addEventListener('DOMContentLoaded', mountControls);

})();
