const HOUSE_LIGHT_REGEX = /(lamp|light|bulb|ceiling|sconce)/i;

function adoptExistingGltfLights(){
  let adopted = 0;
  (scene.lights||[]).forEach(l=>{
    if ([moonLight,flashLight,uvLight,irLight,hemiLight].includes(l)) return;
    if (HOUSE_LIGHT_REGEX.test(l.name||"")){
      l.intensity = 0;
      l.diffuse = new BABYLON.Color3(1.0, 0.95, 0.8);
      houseLights.push({ light:l, mesh:null });
      adopted++;
    }
  });
  return adopted>0;
}
function buildHouseLights(){
  const candidates = scene.meshes.filter(m=>HOUSE_LIGHT_REGEX.test(m.name||""));
  candidates.forEach((mesh, i)=>{
    const b = mesh.getBoundingInfo().boundingBox;
    const pos = b.centerWorld.clone(); pos.y += 0.2;
    const pl = new BABYLON.PointLight("houseLight_"+i, pos, scene);
    pl.intensity = 0; pl.range = 12; pl.diffuse = new BABYLON.Color3(1.0,0.95,0.8);
    houseLights.push({ light:pl, mesh });
    if (mesh.material && mesh.material.emissiveColor) mesh.material.emissiveColor = new BABYLON.Color3(0,0,0);
  });
}
function setHousePower(on){
  housePower = on;
  houseLights.forEach(({light,mesh})=>{
    light.intensity = on ? (light.intensity>0 ? light.intensity : 0.8) : 0;
    if (mesh?.material?.emissiveColor) mesh.material.emissiveColor = on && light.intensity>0
      ? new BABYLON.Color3(1.4,1.2,0.9) : new BABYLON.Color3(0,0,0);
  });
}
