(function(){
  "use strict";
  if (window.__PP_PTRLOCK__) return; window.__PP_PTRLOCK__ = true;

  const PPM = (window.PP = window.PP || {});
  const state = {
    canvas: null,
    uiOpenCount: 0,       // how many UIs are asking to keep the mouse free
    wantedLock: false,    // desire to be locked when allowed
    isLocked: false,
  };

  function getCanvas(){ return state.canvas || (state.canvas = document.getElementById("renderCanvas")); }

  function canLock(){ return state.uiOpenCount <= 0; }
  function isLocked(){ return document.pointerLockElement === getCanvas(); }

  function lockNow(){
    const c = getCanvas(); if (!c) return;
    try { c.requestPointerLock?.(); } catch(_){}
  }
  function unlockNow(){
    try { document.exitPointerLock?.(); } catch(_){}
  }

  function ensure(){
    state.isLocked = isLocked();
    if (state.wantedLock && canLock() && !state.isLocked) lockNow();
    if ((!state.wantedLock || !canLock()) && state.isLocked) unlockNow();
  }

  // Public API (so any module can control this explicitly if needed)
  const api = PPM.pointerLock = {
    lock(){ state.wantedLock = true; ensure(); },
    unlock(){ state.wantedLock = false; ensure(); },
    hold(reason){ // e.g. UI opened
      state.uiOpenCount = Math.max(1, state.uiOpenCount + 1);
      ensure();
    },
    release(reason){ // e.g. UI closed
      state.uiOpenCount = Math.max(0, state.uiOpenCount - 1);
      ensure();
    },
    isLocked(){ return isLocked(); }
  };

  // Observe native pointer lock changes
  ["pointerlockchange","mozpointerlockchange","webkitpointerlockchange"].forEach(ev=>{
    document.addEventListener(ev, ()=> { state.isLocked = isLocked(); }, false);
  });

  // Auto (re)lock on canvas click when allowed
  document.addEventListener("click", (e)=>{
    if (!getCanvas() || e.target !== getCanvas()) return;
    state.wantedLock = true;
    ensure();
  }, true);

  // Keep behavior after tab switches etc.
  document.addEventListener("visibilitychange", ()=>{
    if (!document.hidden) ensure();
  });

  // Start locked after the Start button is used
  window.addEventListener("pp:start", ()=>{
    state.wantedLock = true;
    setTimeout(ensure, 0);
  }, { once:true });

  // -----------------------------------------------------------------------
  // Notebook integration
  function wrap(fnName, onBefore, onAfter){
    const prev = window[fnName];
    window[fnName] = function(...args){
      try { onBefore?.(); } catch(_){}
      const r = prev?.apply(this, args);
      try { onAfter?.(); } catch(_){}
      return r;
    };
  }

  // If your UI already dispatches events, we listen to them:
  window.addEventListener("pp:notebook:open", ()=> api.hold("notebook"));
  window.addEventListener("pp:notebook:close",()=> api.release("notebook"));
  window.addEventListener("pp:van:open",      ()=> api.hold("van"));
  window.addEventListener("pp:van:close",     ()=> api.release("van"));

  // Also wrap common functions if they exist / appear later:
  // Notebook
  wrap("openNotebook",  ()=> api.hold("notebook"));
  wrap("closeNotebook", ()=> api.release("notebook"));
  // Van (rename these if your actual functions differ)
  wrap("openVan",       ()=> api.hold("van"));
  wrap("closeVan",      ()=> api.release("van"));

  // Fallback: if you toggle DOM nodes directly, watch the notebook modal element.
  const tryObserveNotebook = ()=>{
    const el = document.getElementById("notebook-modal");
    if (!el) return;
    const obs = new MutationObserver(()=>{
      const visible = el.style.display !== "none";
      if (visible) api.hold("notebook"); else api.release("notebook");
    });
    obs.observe(el, { attributes:true, attributeFilter:["style","class"] });
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tryObserveNotebook);
  } else {
    tryObserveNotebook();
  }
})();
