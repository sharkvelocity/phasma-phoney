// ./assets/index3/sound.js
(function(){
  window.INDEX3 = window.INDEX3 || {};
  const S = {};
  INDEX3.Sound = {
    load(scene){
      try{
        // Example ambient (adjust path if desired)
        S.amb = new BABYLON.Sound("amb", "./assets/audio/ambient.mp3", scene, null, { loop:true, autoplay:false, volume:0.35 });
      }catch(e){ console.warn("[sound] load failed", e); }
    },
    playAmb(){ try{ S.amb && S.amb.play(); }catch(_){} },
    stopAmb(){ try{ S.amb && S.amb.stop(); }catch(_){} }
  };
})();
