// lantern.js
// Basic lantern object with flame effect

(function(){
  'use strict';
  if (window.LANTERN) return; // already initialized

  const lantern = (window.LANTERN = {
    mesh: null,
    flameMaterial: null,
    flameTexture: null
  });

  lantern.init = function(scene, mesh){
    if (!scene || !mesh) return;

    lantern.mesh = mesh;

    // Create flame procedural texture
    lantern.flameTexture = new BABYLON.FireProceduralTexture(
      "lanternFlame",
      256,
      scene,
      undefined,
      true
    );
    lantern.flameTexture.fragmentUrl = "./assets/dev/game/flame.fragment.fx";

    // Create material
    lantern.flameMaterial = new BABYLON.StandardMaterial("lanternFlameMat", scene);
    lantern.flameMaterial.emissiveTexture = lantern.flameTexture;
    lantern.flameMaterial.backFaceCulling = false;

    // Apply material to mesh
    lantern.mesh.material = lantern.flameMaterial;
  };

  // Optional: update per frame if needed
  lantern.update = function(dt){
    if (!lantern.flameTexture) return;
    lantern.flameTexture.time += dt; // some shaders use time uniform
  };

})();
