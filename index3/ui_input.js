
// ./assets/index3/ui_input.js — v1.4 (bind Use/Drop/Throw + number slots + keys)
(function(){
  "use strict";
  if (window.__UI_INPUT_WIRED__) return;
  window.__UI_INPUT_WIRED__ = true;

  function byId(id){ return document.getElementById(id); }
  function bindBtn(id, fn){
    const el = byId(id); if (!el) return;
    el.onclick = fn;
  }

  function wire(){
    // HUD buttons
    bindBtn('btn-use',   ()=> ItemSystem && ItemSystem.useDown());
    bindBtn('btn-place', ()=> ItemSystem && ItemSystem.drop());
    bindBtn('btn-toss',  ()=> ItemSystem && ItemSystem.toss(1.0));

    // Keyboard
    window.addEventListener('keydown', (e)=>{
      if (e.repeat) return;
      if (e.key>='1' && e.key<='5'){ ItemSystem && ItemSystem.select((e.key.charCodeAt(0)-'1'.charCodeAt(0))|0); }
      if (e.key==='e' || e.key==='E'){ ItemSystem && ItemSystem.useDown(); }
      if (e.key==='q' || e.key==='Q'){ ItemSystem && ItemSystem.drop(); }
      if (e.key==='f' || e.key==='F'){ ItemSystem && ItemSystem.toss(1.0); }
      if (e.key==='['){ ItemSystem && ItemSystem.prev(); }
      if (e.key===']'){ ItemSystem && ItemSystem.next(); }
    });
    window.addEventListener('keyup', (e)=>{
      if (e.key==='e' || e.key==='E'){ ItemSystem && ItemSystem.useUp && ItemSystem.useUp(); }
    });
  }

  // When ItemSystem is available or after DOM ready
  (function wait(){
    if (window.ItemSystem){ wire(); return; }
    setTimeout(wait, 120);
  })();
})();
