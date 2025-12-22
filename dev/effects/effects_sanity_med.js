// ./assets/dev/effects/effects_sanity_med.js
// Applies infinite stamina 10s + 40% sanity over 30s (cap 100%).
(function(){
  "use strict";

  function clamp(n,a,b){ return Math.max(a, Math.min(b,n)); }

  function applyEffects(){
    // Stamina boost (inform your player controller)
    window.dispatchEvent(new CustomEvent('pp:player:stamina-boost', { detail:{ seconds:10 }}));

    // Sanity regen 40% over 30s → ~1.333%/s
    const total = 0.40, dur = 30, tick = 0.5;
    const perTick = total / (dur / tick); // ~0.006666…
    let elapsed = 0;

    const id = setInterval(()=>{
      elapsed += tick;
      try {
        // Assume PP.state.sanity in 0..1 or 0..100; handle both
        const s = window.PP?.state?.sanity;
        if (typeof s === 'number'){
          if (s <= 1.0){
            window.PP.state.sanity = clamp(s + perTick, 0, 1);
          } else {
            window.PP.state.sanity = clamp(s + perTick*100, 0, 100);
          }

          // Call HUD updater if available
          if (typeof window.updateSanity === "function") {
            const v = window.PP.state.sanity <= 1
              ? Math.round(window.PP.state.sanity*100)
              : Math.round(window.PP.state.sanity);
            window.updateSanity(v);
          }
        }
      } catch {}
      if (elapsed >= dur) clearInterval(id);
    }, tick*1000);
  }

  // Hook from inventory_system: pp:effect:sanity-med
  window.addEventListener('pp:effect:sanity-med', applyEffects);
})();
