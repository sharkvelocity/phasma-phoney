// ./assets/index3/devmode.js
// DEV toggle button + Action Bar (always visible)

(function(){
  "use strict";
  const LS_KEY = "PP_DEV_MODE";

  function injectStyles(){
    if (document.getElementById("devmode-style")) return;
    const css = `
      #devmode-toggle{
        position:fixed; right:12px; top:60px; z-index:7000;
        padding:8px 10px; border:2px solid #0ff; color:#0ff; background:#111;
        border-radius:10px; cursor:pointer; box-shadow:0 0 10px rgba(0,255,255,0.2);
        font:12px/1 monospace; letter-spacing:1px;
      }
      #devmode-toggle.on{ background:#022; border-color:#6ff; color:#9ff; }

      /* Action bar is ALWAYS visible now */
      #action-bar{
        position:fixed; right:12px; bottom:100px; z-index:7000;
        display:flex; flex-direction:column; gap:6px;
        background:rgba(0,0,0,0.55); border:1px solid #066; padding:8px; border-radius:10px;
      }
      #action-bar .abtn{
        border:1px solid #0aa; background:#081314; color:#0ff; padding:8px 10px; border-radius:8px; cursor:pointer;
        text-align:center; min-width:120px;
      }
    `;
    const s = document.createElement('style');
    s.id = "devmode-style";
    s.textContent = css;
    document.head.appendChild(s);
  }

  function ensureActionBar(){
    if (document.getElementById('action-bar')) return;
    const bar = document.createElement('div');
    bar.id = 'action-bar';
    bar.innerHTML = `
      <button id="ab-use"   class="abtn">Use (E)</button>
      <button id="ab-drop"  class="abtn">Drop (X)</button>
      <button id="ab-throw" class="abtn">Throw (G)</button>
    `;
    document.body.appendChild(bar);
    // ui_input.js wires these handlers (useActive/dropActive/throwActive)
    try { window.initUI?.(); } catch (_) {}
  }

  function ensureButton(){
    if (document.getElementById('devmode-toggle')) return;
    const b = document.createElement('button');
    b.id = 'devmode-toggle';
    b.textContent = 'DEV';
    document.body.appendChild(b);
    b.onclick = ()=> setDevMode(!(window.DEV_MODE));
  }

  function setDevMode(on){
    window.DEV_MODE = !!on;
    localStorage.setItem(LS_KEY, on ? '1' : '0');
    // Show/hide the Dev Tools panel only (action bar is always visible)
    try{
      const t = document.getElementById('devtools-toggle');
      const p = document.getElementById('devtools-panel');
      if (t) t.style.display = 'block';
      if (p) p.style.display = on ? 'block' : 'none';
    }catch(_){}
    try{ window.toast?.(on ? 'Dev mode ON' : 'Dev mode OFF', 900); }catch(_){}
    const btn = document.getElementById('devmode-toggle');
    if (btn) btn.classList.toggle('on', !!on);
  }

  // Expose
  window.setDevMode = setDevMode;

  // Boot
  function init(){
    injectStyles();
    ensureActionBar();
    ensureButton();
    const saved = localStorage.getItem(LS_KEY) === '1';
    setDevMode(saved);
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
