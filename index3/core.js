// ./assets/index3/core.js
// Shared globals, helpers, audio, inventory defaults, evidence helpers.

(function () {
  "use strict";

  // ---------- tiny DOM helpers ----------
  window.$  = (sel, root = document) => root.querySelector(sel);
  window.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---------- toast (UI) ----------
  window.toast = function toast(msg, ms = 1200) {
    const t = $('#toast'); if (!t) { console.log('[toast]', msg); return; }
    t.textContent = msg;
    t.style.display = 'block';
    clearTimeout(toast._id);
    toast._id = setTimeout(() => { t.style.display = 'none'; }, ms);
  };

  // ---------- world/game state ----------
  window.controls = { forward:false, back:false, left:false, right:false };
  window.player = {
    sanity: 100,
    speedWalk: 0.085,   // units / frame-second
    speedRun:  0.16,
    running:   false,
    room: 'Van'
  };

  // ---------- inventory ----------
  // Slots are 1..5 (we ignore index 0). 4=Lighter, 5=Notebook fixed by Storage.
  window.inventory = {
    slots:       Array(6).fill(null),
    slotCharges: Array(6).fill(Infinity)
  };
  // sensible defaults so the belt isn't empty before opening Storage
  inventory.slots[4] = 'Lighter';
  inventory.slots[5] = 'Notebook';

  // Default charges for some consumables (Storage UI will use this)
  window.ITEM_DEFAULT_CHARGES = {
    'Salt': 3,
    'Writing Book': 1
  };
  // Optional: map of "Item Name" -> glTF mesh name (Dev Tools may fill this)
  window.ITEM_MODEL_MAP = {};

  // Fallback general item list (Storage grid will prefer ./assets/dev/tools/manifest.json)
  window.STORAGE_ITEMS = window.STORAGE_ITEMS || [
    'Spirit Box', 'Writing Book', 'Salt', 'UV Prints', 'DOTS'
  ];

  // ---------- house power / lights ----------
  window.housePower = true;
  // If you populate this with { light: <BABYLON.Light> } objects, Dev Tools switch linker will work
  window.houseLights = window.houseLights || [];

  window.setHousePower = function setHousePower(on) {
    window.housePower = !!on;
    try {
      houseLights.forEach(h => {
        if (!h || !h.light) return;
        h.light.intensity = on ? (h.light._savedIntensity || h.light.intensity || 0.8) : 0;
      });
      toast(on ? 'Main breaker: ON' : 'Main breaker: OFF', 900);
    } catch (e) { /* ignore */ }
  };

  // ---------- polygon+room helpers ----------
  function pointInPolyXZ(p, poly /* [{x,z},...] */) {
    if (!poly || poly.length < 3) return false;
    let inside = false, x = p.x, z = p.z;
    for (let i=0, j=poly.length-1; i<poly.length; j=i++) {
      const xi = poly[i].x, zi = poly[i].z;
      const xj = poly[j].x, zj = poly[j].z;
      const intersect = ((zi > z) !== (zj > z)) &&
                        (x < (xj - xi) * (z - zi) / ((zj - zi) || 1e-7) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }
  window.inVanZone = function inVanZone(pos) {
    try {
      const van = (window.ROOMS || []).find(r => (r.name || '').toLowerCase() === 'van');
      if (van && van.poly) return pointInPolyXZ(pos, van.poly);
    } catch (_) {}
    // fallback: rough bounding box near common van coords
    return (pos.x > 34 && pos.x < 52 && pos.z > -125 && pos.z < -112);
  };

  // ---------- simple audio helpers ----------
  // HTMLAudio fallback (your Babylon.Sound versions will still work side-by-side)
  function makeAudio(src, vol = 1.0) {
    try { const a = new Audio(src); a.volume = vol; return a; } catch { return null; }
  }
  window.audio = window.audio || {};
  audio.doorCreak1 = audio.doorCreak1 || makeAudio('./assets/audio/door_creak1.mp3', 0.6);
  audio.doorCreak2 = audio.doorCreak2 || makeAudio('./assets/audio/door_creak2.mp3', 0.6);
  audio.step1      = audio.step1      || makeAudio('./assets/audio/step1.mp3', 0.55);
  audio.step2      = audio.step2      || makeAudio('./assets/audio/step2.mp3', 0.55);
  audio.step3      = audio.step3      || makeAudio('./assets/audio/step3.mp3', 0.55);
  // You said the spirit box file is named this:
  audio.spiritbox  = audio.spiritbox  || makeAudio('./assets/audio/spiritbox.mp3', 0.6);

  // footsteps used by ui_input.js
  window.playStep = function playStep(vol = 0.5) {
    try {
      const s = Math.random();
      const a = (s < 0.34) ? audio.step1 : (s < 0.67) ? audio.step2 : audio.step3;
      if (a) { a.pause(); a.currentTime = 0; a.volume = vol; a.play().catch(()=>{}); }
    } catch (_) {}
  };

  // ---------- ghost + evidence helpers ----------
  // Minimal ghost DB for evidence checks. Expand as you like.
  window.GHOSTS = window.GHOSTS || {
    Spirit:     { evidence: ['spiritbox', 'writing', 'emf'] },
    Wraith:     { evidence: ['dots', 'emf', 'uv'] },       // special: does NOT disturb salt (handled in salt_system.js)
    Goryo:      { evidence: ['dots', 'emf', 'uv'], dotsCameraOnly: true },
    Shade:      { evidence: ['writing', 'emf', 'freezing'] }
  };
  window.currentGhostKey = window.currentGhostKey || 'Spirit';

  // evidence lookup with a few synonyms
  const EV_KEYS = {
    uv: ['uv','fingerprints','prints','ultraviolet'],
    dots: ['dots'],
    writing: ['writing','writingbook','book'],
    spiritbox: ['spiritbox','box','boxvoice'],
    emf: ['emf'],
    freezing: ['freezing','temps','temp']
  };
  function matchKey(key, target) {
    const cand = (EV_KEYS[key] || [key]).map(s => s.toLowerCase());
    return cand.includes((target || '').toLowerCase());
  }
  window.ghostHasEvidence = function ghostHasEvidence(needle) {
    try {
      const rec = window.GHOSTS[window.currentGhostKey];
      if (!rec || !rec.evidence) return true; // permissive fallback
      return rec.evidence.some(k => matchKey(needle, k));
    } catch { return true; }
  };

  // tiny stubs some tools call (safe to replace with your real ones)
  window.beginHunt   = window.beginHunt   || (() => { $('#hud-hunt-state').textContent = 'HUNT';   toast('Hunt started'); });
  window.endHunt     = window.endHunt     || (() => { $('#hud-hunt-state').textContent = 'Calm';   toast('Hunt ended');   });
  window.flickerStart= window.flickerStart|| (() => toast('Lights flicker'));

})();
