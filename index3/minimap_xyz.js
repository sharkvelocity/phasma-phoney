// ./assets/index3/minimap_xyz.js
(function(){
  window.INDEX3 = window.INDEX3 || {};
  INDEX3.attachXYZHud = function(scene){
    const hud = document.getElementById('hud-xyz'); if (hud) hud.style.display = 'block';
    scene.onBeforeRenderObservable.add(()=>{
      try {
        const cam = scene.activeCamera;
        if (!cam) return;
        document.getElementById('hud-x').textContent = cam.position.x.toFixed(2);
        document.getElementById('hud-y').textContent = cam.position.y.toFixed(2);
        document.getElementById('hud-z').textContent = cam.position.z.toFixed(2);
      } catch(_) {}
    });
  };
})();
