// ./assets/index3/spiritbox_audio_glue.js — v1.0
// Makes the USE button (and E key) start/stop spiritbox.mp3
// Only activates when the currently held item is the Spirit Box.
//
// Requirements:
// - window.scene (Babylon scene)
// - window.audioUnlocked (set true after user clicks Start)
// - Audio file at: ./assets/audio/spiritbox.mp3

(function(){
  "use strict";
  if (window.__SPIRITBOX_GLUE_V1__) return;
  window.__SPIRITBOX_GLUE_V1__ = true;

  const S = {
    ready:false,
    sound:null,
    playing:false,
    lastActiveId:null,
    btn:null,
    keydown:false,
    watchId: null,
  };

  const PATH = "./assets/audio/spiritbox.mp3";

  const SCENE = ()=> window.scene || BABYLON.Engine?.LastCreatedScene;

  // --- Active item detection (try multiple common shapes) ---
  function getActiveItemId(){
    try{
      if (window.Items?.getActiveId) return window.Items.getActiveId();
      if (window.Inventory?.getActiveItem) return window.Inventory.getActiveItem()?.id || window.Inventory.getActiveItem()?.name;
      if (window.Inventory?.activeId) return window.Inventory.activeId;
      if (window.currentItemId) return window.currentItemId;
      if (window.activeItemName) return window.activeItemName;
      // Belt slot with .active?
      const a = document.querySelector('#belt .slot.active[data-item]');
      if (a) return a.getAttribute('data-item');
    }catch{}
    return null;
  }
  function isHoldingSpiritBox(){
    const id = (getActiveItemId()||"").toLowerCase();
    return /spirit ?box|spiritbox/.test(id);
  }

  // --- UI helpers ---
  function setUseLabel(on){
    try{
      if (!S.btn) S.btn = document.getElementById('t-use');
      if (S.btn){
        S.btn.textContent = on ? "STOP" : "USE";
        S.btn.style.borderColor = on ? "#0f0" : "#066";
        S.btn.style.color = on ? "#0f0" : "#0ff";
      }
    }catch{}
  }
  function toast(msg){
    try{ window.toast?.(msg); }catch{ console.log("[spiritbox]", msg); }
  }

  // --- Audio setup ---
  function ensureSound(){
    if (S.sound || !SCENE()) return S.sound;
    try {
      S.sound = new BABYLON.Sound("spiritbox", PATH, SCENE(), null, {
        loop:true, autoplay:false, volume:0.85, spatialSound:false
      });
    } catch(e) {
      console.warn("[spiritbox] failed to init sound", e);
    }
    return S.sound;
  }

  // --- Toggle logic (USE) ---
  function toggleSpirit(){
    if (!isHoldingSpiritBox()) return false;
    if (!window.audioUnlocked){ toast("Click Start first to unlock audio."); return true; }
    const snd = ensureSound(); if (!snd){ toast("Spiritbox audio missing."); return true; }

    if (!S.playing){
      try{ snd.play(); S.playing = true; setUseLabel(true); }catch{}
    } else {
      try{ snd.stop(); S.playing = false; setUseLabel(false); }catch{}
    }
    return true; // handled
  }

  function stopIfPlaying(){
    if (!S.playing || !S.sound) return;
    try{ S.sound.stop(); }catch{}
    S.playing = false;
    setUseLabel(false);
  }

  // --- Bind USE button (capture so we can intercept cleanly) ---
  function bindUseButton(){
    if (S.btn) return;
    S.btn = document.getElementById('t-use');
    if (!S.btn) return;
    S.btn.addEventListener('click', (e)=>{
      if (isHoldingSpiritBox()){
        e.stopImmediatePropagation();
        e.preventDefault();
        toggleSpirit();
      }
      // else let the original handlers run
    }, true);
  }

  // --- Bind E key (only intercept for spirit box) ---
  function bindUseKey(){
    window.addEventListener('keydown', (e)=>{
      if (S.keydown) return;
      const key = e.code||e.key||'';
      if (key==='KeyE' || key==='e' || key==='E'){
        if (isHoldingSpiritBox()){
          S.keydown = true;
          e.stopImmediatePropagation();
          e.preventDefault();
          toggleSpirit();
        }
      }
    }, true);
    window.addEventListener('keyup', (e)=>{
      const key = e.code||e.key||'';
      if (key==='KeyE' || key==='e' || key==='E') S.keydown = false;
    }, true);
  }

  // --- Watch for item switches / drop / throw and stop audio ---
  function startWatcher(){
    if (S.watchId) return;
    S.watchId = setInterval(()=>{
      const cur = getActiveItemId();
      if (cur !== S.lastActiveId){
        // active item changed
        if (!/spirit ?box|spiritbox/i.test(cur||"")) stopIfPlaying();
        S.lastActiveId = cur;
      }
    }, 120);
    // Also stop on page hide (safety)
    document.addEventListener('visibilitychange', ()=>{ if (document.hidden) stopIfPlaying(); });
  }

  // --- Boot when scene is ready ---
  const boot = setInterval(()=>{
    try{
      if (!SCENE()) return;
      bindUseButton();
      bindUseKey();
      startWatcher();
      S.ready = true;
      clearInterval(boot);
    }catch{}
  }, 150);

  // Expose tiny API for other scripts if needed
  window.SpiritBoxAudio = {
    toggle: toggleSpirit,
    stop: stopIfPlaying,
    isPlaying: ()=> !!S.playing
  };

})();