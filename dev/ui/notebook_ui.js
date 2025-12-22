// File: assets/dev/ui/notebook_ui.js
// Wires the existing #btn-notebook and #notebook-modal open/close.
// (Evidence list population stays in your ghost/evidence systems.)
(function(){
  "use strict";
  if (window.__PP_NOTEBOOK_UI__) return; window.__PP_NOTEBOOK_UI__ = true;

  const modal = ()=> document.getElementById('notebook-modal');
  const btnOpen = ()=> document.getElementById('btn-notebook');

  function open(){ const m=modal(); if (m) m.style.display='block'; }
  function close(){ const m=modal(); if (m) m.style.display='none'; }

  // hook close button inside modal if present
  document.addEventListener('click', (e)=>{
    const t = e.target;
    if (!t) return;
    if (t.id === 'btn-notebook'){ e.preventDefault(); open(); }
    if (t.matches && t.matches('#notebook-modal .hud-btn')){ /* leave to existing handlers */ }
  });

  window.openNotebook = open;
  window.closeNotebook = close;

  // Close on Escape
  window.addEventListener('keydown', (e)=>{
    if (e.code === 'Escape'){
      const m=modal(); if (m && m.style.display!=='none') close();
    }
  });

})();
