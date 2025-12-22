/* assets/dev/util/pp_runtime.js
   Minimal runtime helpers. No engine creation here.
   Safe global export (won't crash on read-only getters).
*/
(function(){
  "use strict";
  if (window.__PP_RUNTIME_SAFE__) return;
  window.__PP_RUNTIME_SAFE__ = true;

  const PP = (window.PP = window.PP || {});
  PP.globals = PP.globals || {};

  function trySet(obj, key, value){
    try { obj[key] = value; } catch { /* read-only getter – ignore */ }
  }

  PP.runtime = {
    exportGlobals(engine, scene, camera){
      // namespace copy
      PP.globals.engine = engine;
      PP.globals.scene  = scene;
      PP.globals.camera = camera;

      // best-effort global names
      trySet(window, "ENGINE", engine);
      trySet(window, "SCENE",  scene);
      trySet(window, "camera", camera);

      // also stash underscored fallbacks for tools that check them
      window.__ENGINE = engine;
      window.__SCENE  = scene;
      window.__camera = camera;
    }
  };
})();
