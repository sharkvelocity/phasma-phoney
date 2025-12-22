// uv_prints.js
// UV footprints with fade + dispose

(function(){
  'use strict';
  if (window.UVPrints) return;

  const SCENE = ()=> window.scene || BABYLON.Engine?.LastCreatedScene;

  const TEX = './assets/textures/uv_footprint.png';
  const TTL = 60, FADE = 15, SCALE = 0.45, HEIGHT = 0.02;

  let mat=null;
  function ensureMat(s){
    if (mat) return mat;
    mat = new BABYLON.StandardMaterial('uv_print_mat', s);
    mat.diffuseTexture  = new BABYLON.Texture(TEX, s, true, false);
    mat.emissiveTexture = mat.diffuseTexture;
    mat.opacityTexture  = mat.diffuseTexture;
    mat.diffuseColor    = new BABYLON.Color3(0.0, 0.6, 0.2);
    mat.emissiveColor   = new BABYLON.Color3(0.2, 1.0, 0.4);
    mat.specularColor   = new BABYLON.Color3(0,0,0);
    mat.backFaceCulling = false;
    mat.freeze?.();
    return mat;
  }

  const PRINTS = [];
  function now(){ return (performance?.now?.() ?? Date.now())/1000; }

  function makePrintNode(s, pos, rotY=0, flip=false){
    const plane = BABYLON.MeshBuilder.CreatePlane('uv_print', { size: SCALE, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, s);
    plane.material = ensureMat(s);
    plane.rotation = new BABYLON.Vector3(Math.PI/2, 0, flip ? Math.PI : 0);
    plane.position = new BABYLON.Vector3(pos.x, (pos.y||0)+HEIGHT, pos.z);
    plane.rotation.y = rotY;
    plane.isPickable = false;
    plane.doNotSyncBoundingInfo = true;
    plane.freezeWorldMatrix?.();
    return plane;
  }

  function snapToGround(s, p){
    try{
      const ray = new BABYLON.Ray(new BABYLON.Vector3(p.x, (p.y||2)+5, p.z), new BABYLON.Vector3(0,-1,0), 20);
      const hit = s.pickWithRay(ray, m => m && m.isPickable !== false);
      if (hit?.hit && hit.pickedPoint) return hit.pickedPoint;
    }catch(_){}
    return p;
  }

  const API = {};
  API.addFootprint = function(pos, rotY=0){
    const s=SCENE(); if (!s) return null;
    const p = snapToGround(s, pos);
    const flip = Math.random() < 0.5;
    const mesh = makePrintNode(s, p, rotY, flip);
    PRINTS.push({ mesh, born: now() });
    return mesh;
  };
  API.addStepPair = function(centerPos, dirYRad){
    const s=SCENE(); if (!s) return null;
    const dir = new BABYLON.Vector3(Math.sin(dirYRad), 0, Math.cos(dirYRad));
    const side = BABYLON.Vector3.Cross(dir, BABYLON.Axis.Y).normalize();
    const stride = 0.35, width = 0.12;
    const pL = centerPos.add(dir.scale(stride)).add(side.scale(+width));
    const pR = centerPos.add(dir.scale(stride*1.9)).add(side.scale(-width));
    API.addFootprint(pL, dirYRad);
    API.addFootprint(pR, dirYRad);
  };
  API.clear = function(){
    for (const it of PRINTS){ try{ it.mesh.dispose(); }catch(_){ } }
    PRINTS.length = 0;
  };

  function attachLoop(){
    const s=SCENE(); if (!s){ setTimeout(attachLoop, 120); return; }
    const eng = s.getEngine?.() || BABYLON.Engine?.LastCreatedEngine;
    s.onBeforeRenderObservable.add(()=>{
      const t = now();
      for (let i=PRINTS.length-1; i>=0; i--){
        const it = PRINTS[i], age = t - it.born;
        if (age >= TTL){
          try{ it.mesh.dispose(); }catch(_){}
          PRINTS.splice(i,1);
          continue;
        }
        if (age >= (TTL - FADE)){
          const a = 1 - ((age - (TTL - FADE))/FADE);
          const m = it.mesh.material;
          if (m) { m.alpha = Math.max(0, Math.min(1, a)); }
        }
      }
    });
  }
  attachLoop();

  window.UVPrints = API;
})();

/* ---- Storage registration (UV Prints item) ---- */
(function(){
  if (!window.registerItem) return;
  registerItem({
    id: "uv_prints",
    name: "UV Prints",
    icon: "./assets/icons/uv_prints.png",
    defaultCharges: Infinity,
    onEquip(){
      try{
        if (window.uvLight){ uvLight.intensity = 1.2; }
        const badge = document.getElementById("camera-ir");
        if (badge) badge.style.display = "block";
      }catch(_){}
    }
  });
})();
