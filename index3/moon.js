// ./assets/index3/moon.js
// Static moon: Babylon sphere + unlit texture. No orbit, no rotation required.

(function () {
  "use strict";

  const TEX_PATH = "./assets/textures/moon.jpg"; // your path
  const MOON_NAME = "pp_moon_sphere";

  function ensureScene() {
    if (!window.scene) throw new Error("[moon] scene not ready yet");
    return window.scene;
  }

  function alreadyExists(sc) {
    return sc.getMeshByName(MOON_NAME);
  }

  function makeMoon(sc) {
    // Large sphere far above the map
    const moon = BABYLON.MeshBuilder.CreateSphere(MOON_NAME, { diameter: 60, segments: 32 }, sc);
    moon.position = new BABYLON.Vector3(0, 120, -200); // tweak if you want it elsewhere
    moon.isPickable = false;
    moon.checkCollisions = false;
    moon.receiveShadows = false;

    // Unlit material with the moon texture
    const mat = new BABYLON.StandardMaterial("pp_moon_mat", sc);
    mat.diffuseTexture = new BABYLON.Texture(TEX_PATH, sc, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
    mat.specularColor = new BABYLON.Color3(0, 0, 0);
    mat.emissiveColor = new BABYLON.Color3(1, 1, 1);
    mat.disableLighting = true; // make it appear self-lit
    mat.backFaceCulling = true; // we view the outside of the sphere
    moon.material = mat;

    // Optional: slight tilt so it’s not perfectly “front-on”
    moon.rotation.y = Math.PI * 0.12;

    // Keep it simple: no per-frame updates (no orbit)
    return moon;
  }

  // Public API (in case you want to reposition later)
  window.Moon = {
    create: function () {
      const sc = ensureScene();
      const exist = alreadyExists(sc);
      return exist || makeMoon(sc);
    },
    setPosition: function (v3) {
      const sc = ensureScene();
      const m = sc.getMeshByName(MOON_NAME) || this.create();
      m.position.copyFrom(v3);
    },
    getMesh: function () {
      const sc = ensureScene();
      return sc.getMeshByName(MOON_NAME);
    }
  };

  // If scene is already up by the time this file loads, create immediately.
  try { if (window.scene) Moon.create(); } catch {}

})();
