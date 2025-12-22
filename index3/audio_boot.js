<script>
/* Robust, idempotent audio unlocker */
(function(){
  if (window.__PP_AUDIO_BOOT__) return; window.__PP_AUDIO_BOOT__ = true;
  window.audioUnlocked = false;

  function tryUnlock(){
    try {
      const eng = BABYLON.EngineStore?.LastCreatedEngine || window.ENGINE;
      const scn = BABYLON.EngineStore?.LastCreatedScene  || window.scene || window.SCENE;

      // Babylon audio contexts
      if (BABYLON.Engine?.audioEngine?.unlock) BABYLON.Engine.audioEngine.unlock();
      if (eng?.audioEngine?.unlock) eng.audioEngine.unlock();

      // Resume whichever AudioContext exists
      const ctx = eng?.getAudioContext?.()
        || BABYLON.Engine?.audioEngine?.audioContext
        || BABYLON.Engine?.audioEngine?._audioContext
        || null;
      if (ctx && ctx.state === 'suspended') { ctx.resume().catch(()=>{}); }

      if (eng) eng.audioEnabled = true;
      if (scn) scn.audioEnabled = true;

      window.audioUnlocked = true;
      document.dispatchEvent(new CustomEvent('pp-audio-unlocked'));

      // Stop listening once successful
      window.removeEventListener('pointerdown', tryUnlock, true);
      window.removeEventListener('touchstart', tryUnlock, true);
      window.removeEventListener('keydown', tryUnlock, true);
      document.removeEventListener('visibilitychange', tryUnlock, true);
      const btn = document.getElementById('start-button');
      if (btn) btn.removeEventListener('click', tryUnlock, true);

      console.log('[audio] unlocked');
    } catch(e){ /* swallow and keep trying on next gesture */ }
  }

  // Any user gesture and (for Safari) visibility change
  window.addEventListener('pointerdown', tryUnlock, true);
  window.addEventListener('touchstart', tryUnlock, true);
  window.addEventListener('keydown', tryUnlock, true);
  document.addEventListener('visibilitychange', tryUnlock, true);
  setTimeout(()=>{
    const btn = document.getElementById('start-button');
    if (btn) btn.addEventListener('click', tryUnlock, {once:true, capture:true});
  }, 0);
})();
</script>
