// moon.js
// Renders a visible billboarded moon using ./assets/textures/moon.jpg

(function(){
  'use strict';
  if (window.__MoonReady) return; window.__MoonReady = true;

  const SCENE = ()=> window.scene || BABYLON.Engine?.LastCreatedScene;

  function createMoon(){
    const s=SCENE(); if (!s) { setTimeout(createMoon, 120); return; }
    const MOON_DIAM = 18;
    const MOON_POS  = new BABYLON.Vector3(0, 120, 160);

    const disc = BABYLON.MeshBuilder.CreateDisc('MoonMesh',{radius:MOON_DIAM*0.5, tessellation:64}, s);
    disc.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    disc.isPickable = false; disc.applyFog = false; disc.renderingGroupId = 2;

    const mat = new BABYLON.StandardMaterial('moonMat', s);
    mat.diffuseTexture = new BABYLON.Texture('./assets/textures/moon.jpg', s, true, false);
    mat.emissiveTexture = mat.diffuseTexture;
    mat.emissiveColor = new BABYLON.Color3(1,1,1);
    mat.specularColor = new BABYLON.Color3(0,0,0);
    mat.backFaceCulling = false;
    disc.material = mat;
    disc.position.copyFrom(MOON_POS);
  }
  createMoon();
})();
