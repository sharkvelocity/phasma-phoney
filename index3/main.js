// ./assets/index3/main.js
// Scene bootstrapping, camera/lights, render loop, belt UI, interact/use, and safeStart().

(function () {
  "use strict";

  // Tiny $, used throughout
  window.$ = window.$ || (sel => document.querySelector(sel));

  // Toggle: use Babylon built-in movement (default) vs custom mover in ui_input.js
  window.USE_CUSTOM_MOVEMENT = false; // set true to switch back to custom

  // Babylon globals expected everywhere
  window.engine = null;
  window.scene  = null;
  window.camera = null;

  // player-held lights toggled by input (ui_input.js)
  window.flashLight = null;
  window.uvLight    = null;
  window.irLight    = null;

  // belt
  window.activeItemSlot = 1;

  // --- door creak (lazy pool with safe fallback) ---
  let __doorCreakPool = null;
  function getDoorCreakSound(){
    if (!window.audioUnlocked || !window.scene) return null;
    if (__doorCreakPool) return __doorCreakPool[Math.floor(Math.random()*__doorCreakPool.length)];
    __doorCreakPool = [];
    const candidates = [
      "./assets/audio/door_creak.mp3",
      "./assets/audio/doorCreak1.mp3",
      "./assets/audio/door-creak.mp3"
    ];
    candidates.forEach((p, i) => {
      try {
        const s = new BABYLON.Sound(`doorCreak${i}`, p, scene, null, {
          loop:false, autoplay:false, volume:0.7, spatialSound:false
        });
        __doorCreakPool.push(s);
      } catch {}
    });
    return __doorCreakPool[0] || null;
  }

  // ---------- scene creation ----------
  function createScene(canvas) {
    const eng = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true }, true);
    const sc  = new BABYLON.Scene(eng);
    sc.collisionsEnabled = true;
    sc.gravity = new BABYLON.Vector3(0, -0.5, 0);

    // camera
    const cam = new BABYLON.FreeCamera("PlayerCam", new BABYLON.Vector3(44, 1.7, -119), sc);
    cam.attachControl(canvas, true);
    cam.ellipsoid = new BABYLON.Vector3(0.5, 0.9, 0.5);
    cam.applyGravity = true;
    cam.checkCollisions = true;

    // ✅ Enable Babylon's built-in keyboard movement (WASD + Arrows)
    cam.keysUp    = [87, 38]; // W, Up
    cam.keysDown  = [83, 40]; // S, Down
    cam.keysLeft  = [65, 37]; // A, Left
    cam.keysRight = [68, 39]; // D, Right
    cam.speed = 0.45;         // tune as you like

    cam.minZ = 0.1;
    sc.activeCamera = cam;

    // basic ambient
    const hemi = new BABYLON.HemisphericLight("hemilight", new BABYLON.Vector3(0.2, 1, 0.1), sc);
    hemi.intensity = 0.4;

    // handheld lights attached to camera
    const fwd = new BABYLON.Vector3(0, 0, 1);
    const fl = new BABYLON.SpotLight("flash", cam.position, fwd, Math.PI / 3.2, 14, sc);
    fl.intensity = 0; // off by default
    fl.parent = cam;
    fl.diffuse = new BABYLON.Color3(1.0, 0.98, 0.9);

    const uv = new BABYLON.SpotLight("uv", cam.position, fwd, Math.PI / 3.0, 12, sc);
    uv.intensity = 0;
    uv.parent = cam;
    uv.diffuse = new BABYLON.Color3(0.4, 0.8, 1.0);

    const ir = new BABYLON.SpotLight("ir", cam.position, fwd, Math.PI / 3.0, 12, sc);
    ir.intensity = 0;
    ir.parent = cam;
    ir.diffuse = new BABYLON.Color3(0.8, 0.95, 1.0);

    // store
    window.engine = eng;
    window.scene  = sc;
    window.camera = cam;
    window.flashLight = fl;
    window.uvLight = uv;
    window.irLight = ir;

    // Temporary ground to prevent falling before the map loads; remove after loadMap()
    const ground = BABYLON.MeshBuilder.CreateGround("tmp_ground", { width: 400, height: 400, subdivisions: 2 }, sc);
    ground.checkCollisions = true;
    ground.position.y = -0.05;
    const gm = new BABYLON.StandardMaterial("tmp_ground_mat", sc);
    gm.diffuseColor = new BABYLON.Color3(0.05, 0.08, 0.08);
    ground.material = gm;
    window.tmpGround = ground;

    // ghost placeholder (real model handled by GhostAPI)
    window.ghost = window.ghost || { type: window.currentGhostKey || 'Spirit', position: new BABYLON.Vector3(43, 0.1, -130), speed: 1.2 };
    Object.defineProperty(window.ghost, 'position', {
      get(){ return this._pos || (this._pos = new BABYLON.Vector3(43,0.1,-130)); },
      set(v){ this._pos = v; }
    });

    // 🔧 Noclip toggle + unstick helper
    window.addEventListener('keydown', (e) => {
      if (e.key === 'n' || e.key === 'N') {
        camera.checkCollisions = !camera.checkCollisions;
        console.log('[noclip]', camera.checkCollisions ? 'OFF (colliding)' : 'ON (no collisions)');
      }
    });
    window.unstick = () => { camera.position.y += 1.0; };

    return sc;
  }

  // ---------- belt UI ----------
  function slotLabel(n) { return String(n); }
  function slotIcon(itemName) {
  if (!itemName) {
    const span = document.createElement('span');
    span.textContent = '—';
    span.style.fontSize = '11px';
    span.style.color = '#9ff';
    return span;
  }
  if (window.createItemIconEl) {
    const img = window.createItemIconEl(itemName, 60);
    if (img) return img;
  }
  // Fallback: text label
  const span = document.createElement('span');
  span.textContent = itemName.replace(/ .*/, '');
  span.style.fontSize = '11px';
  span.style.color = '#9ff';
  return span;
}


  window.rebuildBelt = function rebuildBelt() {
    const host = $('#belt'); if (!host) return;
    host.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const slot = document.createElement('div');
      slot.className = 'slot' + (i === window.activeItemSlot ? ' active' : '');
      const key = document.createElement('div');
      key.className = 'key';
      key.textContent = slotLabel(i);

      const item = inventory.slots[i];
      const inner = document.createElement('div');
      inner.style.display = 'flex';
      inner.style.flexDirection = 'column';
      inner.style.alignItems = 'center';
      inner.style.gap = '2px';

      inner.appendChild(slotIcon(item || ''));

      const ch = inventory.slotCharges[i];
      if (isFinite(ch)) {
        const c = document.createElement('div');
        c.style.fontSize = '11px';
        c.style.color = '#cff';
        c.textContent = String(ch);
        inner.appendChild(c);
      }

      slot.appendChild(key);
      slot.appendChild(inner);
      slot.onclick = () => selectSlot(i);
      host.appendChild(slot);
    }
  };

  window.selectSlot = function selectSlot(n) {
    window.activeItemSlot = n;
    rebuildBelt();

    const item = inventory.slots[n];
    if (item && window.ItemRegistry && typeof window.ItemRegistry.onEquip === 'function') {
      window.ItemRegistry.onEquip(item, n);
    }
  };

  // ---------- Interact / Use (RETICLE → WORLD → HELD) ----------
  function raycast(dist=3.0, pickPredicate) {
    if (!scene || !camera) return null;
    const origin = camera.position.clone();
    const forward = camera.getForwardRay(dist);
    const ray = new BABYLON.Ray(origin, forward.direction, dist);
    const hit = scene.pickWithRay(ray, pickPredicate || (m => !!m && m.isPickable !== false));
    return (hit && hit.hit) ? hit : null;
  }

  function toggleDoor(mesh) {
    if (!mesh) return false;
    const node = mesh.parent || mesh; // prefer parent as the pivot if present
    node.metadata = node.metadata || {};
    const meta = node.metadata;
    meta.__doorOpen = !meta.__doorOpen;

    // Compute pivot at current bounding-box center
    try {
      const bb = node.getBoundingInfo().boundingBox;
      const center = bb.centerWorld.clone();
      const axis = BABYLON.Axis.Y;
      const angle = meta.__doorOpen ? (Math.PI * 0.6) : (-Math.PI * 0.6); // ~108°
      node.rotateAround(center, axis, angle);
      // creak (safe)
      try { getDoorCreakSound()?.play(); } catch {}
      return true;
    } catch {
      return false;
    }
  }

  function tryWorldInteract() {
    const hit = raycast(3.0);
    if (!hit || !hit.pickedMesh) return false;
    const m = hit.pickedMesh;

    // Mesh-provided handler
    if (m.metadata && typeof m.metadata.onInteract === 'function') {
      try { m.metadata.onInteract({hit, scene, camera}); return true; } catch {}
    }

    // Door heuristic
    const name = (m.name || '').toLowerCase();
    if (name.includes('door') || (Array.isArray(window.doorMeshes) && window.doorMeshes.includes(m))) {
      return toggleDoor(m);
    }
    if (m.parent && (m.parent.name || '').toLowerCase().includes('door')) {
      return toggleDoor(m.parent);
    }

    return false;
  }

  function tryHeldItemUse() {
    const item = inventory.slots[window.activeItemSlot];
    if (!item) return false;
    if (window.ItemRegistry && typeof window.ItemRegistry.onUse === 'function') {
      try { window.ItemRegistry.onUse(item, window.activeItemSlot); return true; } catch {}
    }
    return false;
  }

  window.onUse = function onUse() {
    if (tryWorldInteract()) return;
    tryHeldItemUse();
  };

  // Bind 'E' for interact
  window.addEventListener('keydown', (e) => {
    if (e.key === 'e' || e.key === 'E') {
      try { window.onUse(); } catch {}
    }
  });

  // ---------- game loop ----------
  function startLoops() {
    let last = performance.now();

    engine.runRenderLoop(() => {
      if (!scene || scene.isDisposed) return;
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;

      try {
        // Use custom mover only if explicitly enabled; otherwise Babylon built-in keys drive movement
        if (window.USE_CUSTOM_MOVEMENT && typeof handleMovement === 'function') handleMovement(dt);

        if (typeof updatePlayerFootsteps === 'function') updatePlayerFootsteps(dt);
        if (typeof updateGhost === 'function') updateGhost(dt);
        if (window.Weather && typeof window.Weather.update === 'function') Weather.update(dt);
      } catch (e) { /* ignore */ }

      scene.render();
    });

    window.addEventListener('resize', () => engine?.resize());
  }

  // ---------- UI gates ----------
  function hideTitle() { const t = $('#title-screen'); if (t) t.style.display = 'none'; }
  function showHUD() { const h = $('#hud'); if (h) h.style.display = 'flex'; }

  function showLoading(on, pct = 0, msg = 'initializing…') {
    const o = $('#loading-overlay'); const bar = $('#loading-bar'); const tx = $('#loading-text'); const ti = $('#loading-title');
    if (!o) return;
    o.style.display = on ? 'flex' : 'none';
    if (bar) bar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    if (tx)  tx.textContent = `${Math.round(pct)}%`;
    if (ti)  ti.textContent = msg;
  }
  window.showLoading = showLoading; // allow loaders to pipe progress

  // ---------- public safeStart (used by the Start button & ui_input.js) ----------
  let _started = false;
  window.safeStart = async function safeStart() {
    if (_started) return;
    _started = true;

    // Unlock audio on user gesture (required by browsers)
    window.audioUnlocked = true;

    showLoading(true, 8, 'creating scene');
    const canvas = $('#renderCanvas');
    if (!canvas) throw new Error('No #renderCanvas');

    createScene(canvas);

    // Load the house GLB via map.js, then apply shadow flags
    showLoading(true, 12, 'loading house');
    try {
      if (typeof loadMap === 'function') {
        await loadMap();                 // from map.js
        showLoading(true, 72, 'finalizing scene');
        if (typeof afterMapLoadedForShadows === 'function') afterMapLoadedForShadows();

        // Remove the temporary visible ground so it doesn't block movement
        if (window.tmpGround && !window.tmpGround.isDisposed()) {
          try {
            window.tmpGround.checkCollisions = false;
            window.tmpGround.isVisible = false;
            window.tmpGround.dispose();
          } catch {}
          window.tmpGround = null;
        }
      } else {
        console.warn('loadMap() was not found. Did map.js load?');
      }
    } catch (e) {
      console.error('Map failed', e);
    }

    // Load the real ghost (invisible by default; GhostAPI manages visibility)
    try {
      if (window.GhostAPI && typeof window.GhostAPI.loadGhost === 'function') {
        await window.GhostAPI.loadGhost(window.currentGhostKey || 'Spirit');
      }
    } catch (e) {
      console.error('Ghost load failed', e);
    }

    // Initialize Weather + default state (after audio unlocked)
    try {
      if (window.Weather && typeof window.Weather.init === 'function') {
        Weather.init();
        Weather.set("Clear"); // change to "Rainstorm" to test
      }
    } catch (e) {
      console.warn("Weather init failed:", e);
    }

    // basic belt draw
    rebuildBelt();
    selectSlot(1);

    // allow devtools to find things
    setTimeout(() => { const btn = $('#devtools-toggle'); if (btn) btn.style.display = 'block'; }, 50);

    // quick progress finish + HUD reveal
    let pct = 72;
    const id = setInterval(() => {
      pct = Math.min(100, pct + 7);
      showLoading(true, pct);
      if (pct >= 100) {
        clearInterval(id);
        showLoading(false);
        showHUD();
      }
    }, 80);

    hideTitle();
    startLoops();
  };

  // If someone presses Enter on the title screen, start
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && $('#title-screen')?.style.display !== 'none') safeStart();
  });

  // --- robust Start button binding (so “Start Investigation” works even if id/class changes) ---
  function bindStartButtons() {
    const ts = document.getElementById('title-screen');
    if (!ts) return;

    const explicit = [
      '#start-button',
      '[data-action="start"]',
      'button.start',
      'a.start'
    ].map(sel => ts.querySelector(sel)).filter(Boolean);

    const textMatches = Array.from(ts.querySelectorAll('button, a, [role="button"], .button'))
      .filter(el => (el.textContent || '').toLowerCase().includes('start'));

    const candidates = [...new Set([...explicit, ...textMatches])];

    if (candidates.length === 0) {
      ts.addEventListener('click', (e) => {
        e.preventDefault?.();
        e.stopPropagation?.();
        try { window.safeStart?.(); } catch {}
      }, { once: true });
      return;
    }

    candidates.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault?.();
        e.stopPropagation?.();
        try { window.safeStart?.(); } catch {}
      }, { once: true });
    });
  }

  // Initialize UI bindings immediately (initUI is defined in ui_input.js) + bind start buttons
  if (typeof initUI === 'function') {
    try { initUI(); } catch (e) { /* ignore */ }
  } else {
    document.addEventListener('DOMContentLoaded', () => { try { initUI?.(); } catch {} });
  }
  if (document.readyState !== "loading") bindStartButtons();
  else document.addEventListener('DOMContentLoaded', bindStartButtons);

})();
