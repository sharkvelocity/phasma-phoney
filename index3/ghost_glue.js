// ./assets/index3/ghost_glue.js
// Hooks into GhostAPI.loadGhost() to attach movement automatically;
// also ensures updateGhost(dt) calls GhostMove.update(dt).
(function(){
  "use strict";
  window.currentGhostKey = window.currentGhostKey || "Spirit";
  function findNewRoot(beforeSet) {
    try {
      const added = scene.meshes.filter(m => !beforeSet.has(m));
      // Prefer a root-level TransformNode/Mesh containing 'ghost'
      const cand = added.find(m => (!m.parent) && /ghost/i.test(m.name||""));
      if (cand) return cand;
      // else, pick the first added top-level node
      return added.find(m => !m.parent) || added[0] || null;
    } catch { return null; }
  }
  function attachIfPossible(root, type) {
    if (!root) return;
    try {
      window.GhostMove?.attach(root);
      window.GhostMove?.setType(type || window.currentGhostKey, window.GHOST_DATA?.[type || window.currentGhostKey]);
    } catch(e) { console.warn("[ghost_glue] attach failed", e); }
  }
  function ensureUpdateTick(){
    if (typeof window.updateGhost !== "function") {
      window.updateGhost = function(dt){ try { window.GhostMove?.update(dt); } catch{} };
    }
  }
  ensureUpdateTick();
  // Patch loader if present
  if (window.GhostAPI && typeof GhostAPI.loadGhost === "function") {
    const _orig = GhostAPI.loadGhost.bind(GhostAPI);
    GhostAPI.loadGhost = async function(type){
      const before = new Set(scene.meshes);
      const res = await _orig(type);
      // prefer explicit root if GhostAPI exposes it
      const root = (GhostAPI.root || GhostAPI.ghostRoot || findNewRoot(before));
      attachIfPossible(root, type);
      ensureUpdateTick();
      return res;
    };
  } else {
    // If the loader isn't ready yet, try once DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
      if (window.GhostAPI && typeof GhostAPI.loadGhost === "function") {
        const _orig = GhostAPI.loadGhost.bind(GhostAPI);
        GhostAPI.loadGhost = async function(type){
          const before = new Set(scene.meshes);
          const res = await _orig(type);
          const root = (GhostAPI.root || GhostAPI.ghostRoot || findNewRoot(before));
          attachIfPossible(root, type);
          ensureUpdateTick();
          return res;
        };
      }
    });
  }
})();