// ./assets/index3/ghost_preload.js
// Preload ghost4.glb so ghost_movement's randomizer selects it.
(function(){
  "use strict";
  const S = ()=> window.scene || window.SCENE || BABYLON.Engine?.LastCreatedScene;

  async function go(){
    const s = S(); if (!s) return setTimeout(go, 120);

    const rootUrl = "./assets/models/ghosts/";
    const file    = "ghost4.glb";

    try {
      const res = await BABYLON.SceneLoader.ImportMeshAsync(null, rootUrl, file, s);
      // Make the imported meshes easy for the ghost randomizer to find.
      (res.meshes||[]).forEach((m,i)=>{
        if (!m || !m.name) return;
        // Prefix names with 'ghost' so the regex in ghost_movement.js prefers it.
        if (!/ghost/i.test(m.name)) m.name = `ghost4_${i}_ghost`;
        // Keep invisible until the runtime takes ownership.
        if ("visibility" in m) m.visibility = 0;
        if ("isVisible" in m)  m.isVisible  = false;
        if (m.material && m.material.alpha !== undefined) m.material.alpha = 0.0;
      });

      // Tiny nudge: advertise that a preferred ghost model is present.
      window.GHOST_PREFERRED_MODEL = "ghost4";
      console.log("[ghost_preload] ghost4.glb imported, meshes tagged.");
    } catch(e){
      console.warn("[ghost_preload] failed to import ghost4.glb", e);
    }
  }
  go();
})();