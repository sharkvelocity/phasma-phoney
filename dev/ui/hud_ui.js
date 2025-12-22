// File: assets/dev/ui/hud_ui.js
// HUD wire-up. Listens for Weather, Room, Hunt, and Sanity events.
// Automatically syncs Weather HUD with the Weather engine.
(function(){
  "use strict";
  if (window.__PP_HUD_UI__) return;
  window.__PP_HUD_UI__ = true;

  // --- Element helpers ---
  const $ = sel => document.querySelector(sel);
  const elWeather = () => $('#hud-weather');
  const elRoom    = () => $('#hud-room');
  const elHunt    = () => $('#hud-hunt');
  const elSanity  = () => $('#hud-sanity');
  const elFill    = () => $('#sanity-fill');

  function setText(el, value){
    if (el) el.textContent = value;
  }

  function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

  function setSanity(pct){
    pct = clamp(Math.floor(pct), 0, 100);
    setText(elSanity(), `${pct}%`);
    const f = elFill();
    if (f) f.style.width = `${pct}%`;
  }

  // --- Initialize default HUD ---
  setText(elWeather(), '—');
  setText(elRoom(), 'Van');
  setText(elHunt(), 'Calm');
  setSanity(100);

  // --- Event listeners ---
  window.addEventListener('pp:hud:weather', e => setText(elWeather(), e.detail?.text ?? '—'));
  window.addEventListener('pp:hud:room',    e => setText(elRoom(),    e.detail?.text ?? '—'));
  window.addEventListener('pp:hud:hunt',    e => setText(elHunt(),    e.detail?.text ?? 'Calm'));
  window.addEventListener('pp:sanity:update', e => setSanity(e.detail?.percent ?? 100));

  // --- Auto-sync with Weather engine ---
  if (window.Weather && typeof Weather.set === 'function'){
    const originalSet = Weather.set;
    Weather.set = function(state, opts={}){
      originalSet(state, opts);
      const indoorSuffix = Weather.ST?.indoor ? " (Indoor)" : "";
      setText(elWeather(), state + indoorSuffix);
    };
  }

  // --- Expose HUD API ---
  window.HUD = {
    weather: t => window.dispatchEvent(new CustomEvent('pp:hud:weather', { detail:{text:t} })),
    room:    t => window.dispatchEvent(new CustomEvent('pp:hud:room',    { detail:{text:t} })),
    hunt:    t => window.dispatchEvent(new CustomEvent('pp:hud:hunt',    { detail:{text:t} })),
    sanity:  n => window.dispatchEvent(new CustomEvent('pp:sanity:update',{ detail:{percent:n} })),
  };

})();
