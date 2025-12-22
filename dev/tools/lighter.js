// lighter.js
// Player-attached lighter with flame effect and ghost interaction

(function(){
  'use strict';
  if (window.LIGHTER) return;

  const lighter = (window.LIGHTER = {
    mesh: null,
    flameMaterial: null,
    flameTexture: null,
    isOn: false
  });

  lighter.init = function(scene, mesh, playerRig){
    if (!scene || !mesh || !playerRig) return;

    lighter.mesh = mesh;

    // Create flame procedural texture
    lighter.flameTexture = new BABYLON.FireProceduralTexture(
      "lighterFlame",
      256,
      scene,
      undefined,
      true
    );
    lighter.flameTexture.fragmentUrl = "./assets/dev/game/flame.fragment.fx";

    // Create material
    lighter.flameMaterial = new BABYLON.StandardMaterial("lighterFlameMat", scene);
    lighter.flameMaterial.emissiveTexture = lighter.flameTexture;
    lighter.flameMaterial.backFaceCulling = false;

    lighter.mesh.material = lighter.flameMaterial;

    // Always attached to player hand (offset example)
    lighter.mesh.parent = playerRig.body;
    lighter.mesh.position.set(0.25, -0.25, 0.5);
    lighter.mesh.rotation.set(0, Math.PI/2, 0);

    lighter.mesh.isPickable = false;
    lighter.mesh.isVisible = false;

    // Force the lighter to stay with the player
    window.PP?.rig?.onUpdate?.push(dt => lighter.update(dt));
  };

  lighter.toggle = function(state){
    lighter.isOn = state ?? !lighter.isOn;
    if (lighter.mesh) lighter.mesh.isVisible = lighter.isOn;
  };

  lighter.update = function(dt){
    if (!lighter.flameTexture) return;
    lighter.flameTexture.time += dt;

    // Check ghost proximity
    const ghost = window.ghost;
    if (!ghost || !ghost.position || !lighter.isOn) return;

    const distance = BABYLON.Vector3.Distance(ghost.position, window.PP.rig.body.position);

    // If any ghost (except Shade) is close and lighter is on, it may blow out the fire
    if (distance < 3 && (ghost.type?.toLowerCase() !== 'shade') && Math.random() < 0.001) {
      lighter.toggle(false); // extinguish fire
      if (window.GhostEvents?.onObjectInteract) {
        // Trigger EMF level 2 at player position
        window.GhostEvents.onObjectInteract(window.PP.rig.body.position, 2);
      }
    }
  };

})();
