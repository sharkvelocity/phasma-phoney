function applyNightPalette(){
  scene.clearColor = new BABYLON.Color4(0.01,0.01,0.02,1);
  scene.ambientColor = new BABYLON.Color3(0.02,0.02,0.05);
  scene.imageProcessingConfiguration.exposure = 0.8;
  scene.imageProcessingConfiguration.contrast = 1.15;
  scene.environmentIntensity = 0.25;
  scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.0045;
  scene.fogColor = new BABYLON.Color3(0.02,0.03,0.05);
  if (cloudMat) cloudMat.emissiveColor = new BABYLON.Color3(0.02,0.03,0.07);
}
function applyBloodMoonPalette(){
  scene.clearColor = new BABYLON.Color4(0.02,0,0.02,1);
  scene.ambientColor = new BABYLON.Color3(0.04,0.01,0.02);
  scene.imageProcessingConfiguration.exposure = 0.5;
  scene.imageProcessingConfiguration.contrast = 1.2;
  scene.environmentIntensity = 0.25;
  scene.fogDensity = 0.005;
  scene.fogColor = new BABYLON.Color3(0.06,0.01,0.02);
  if (cloudMat) cloudMat.emissiveColor = new BABYLON.Color3(0.16,0.03,0.03);
}
function setupNightAtmosphere(){
  applyNightPalette();

  cloudMat = new BABYLON.StandardMaterial("cloudSky", scene);
  cloudMat.backFaceCulling = false;
  cloudMat.disableLighting = true;
  cloudMat.diffuseTexture = new BABYLON.Texture("./assets/images/sky/clouds_night.jpg", scene);
  cloudMat.diffuseTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
  cloudMat.emissiveColor = new BABYLON.Color3(0.02,0.03,0.07);
  cloudMat.disableDepthWrite = true;

  if (skybox) skybox.dispose();
  skybox = BABYLON.MeshBuilder.CreateBox("skybox", { size: 1500 }, scene);
  skybox.material = cloudMat;
  skybox.infiniteDistance = true;
  skybox.isPickable = false;
  skybox.renderingGroupId = 0;

  const fillLight = new BABYLON.HemisphericLight('fillLight', new BABYLON.Vector3(0,1,0), scene);
  fillLight.intensity=0.15;

  moonLight = new BABYLON.DirectionalLight("moonLight", new BABYLON.Vector3(-0.2,-1,0.1), scene);
  moonLight.position = new BABYLON.Vector3(0,200,0);
  moonLight.intensity = 0.45;

  moonShadows = new BABYLON.ShadowGenerator(2048, moonLight);
  moonShadows.useBlurExponentialShadowMap = true;
  moonShadows.blurKernel = 16;
  moonShadows.bias = 0.001;
  moonShadows.normalBias = 0.5;

  flashLight = new BABYLON.SpotLight("flashLight", new BABYLON.Vector3(0,0,0), new BABYLON.Vector3(0,0,1), Math.PI/3, 10, scene);
  flashLight.parent = camera; flashLight.intensity = 0; flashLight.range = 40;
  flashLight.diffuse = new BABYLON.Color3(1, 0.98, 0.92);
  flashLight.specular = new BABYLON.Color3(0.8, 0.8, 0.8);
  flashLight.shadowEnabled = true;
  flashShadows = new BABYLON.ShadowGenerator(1024, flashLight);
  flashShadows.useBlurExponentialShadowMap = true;

  uvLight = new BABYLON.SpotLight("uvLight", new BABYLON.Vector3(0,0,0), new BABYLON.Vector3(0,0,1), Math.PI/3, 8, scene);
  uvLight.parent = camera; uvLight.intensity = 0; uvLight.range = 30;
  uvLight.diffuse = new BABYLON.Color3(0.6,0.3,0.9); uvLight.specular = new BABYLON.Color3(0,0,0);

  irLight = new BABYLON.SpotLight("irLight", new BABYLON.Vector3(0,0,0), new BABYLON.Vector3(0,0,1), Math.PI/2, 10, scene);
  irLight.parent = camera; irLight.intensity = 0;
  irLight.diffuse = new BABYLON.Color3(0.4,0.6,0.4); irLight.specular = new BABYLON.Color3(0,0,0);

  scene.onBeforeRenderObservable.add(()=>{
    cloudScroll += engine ? engine.getDeltaTime()*0.00003 : 0.00003;
    if (cloudMat?.diffuseTexture) cloudMat.diffuseTexture.uOffset = cloudScroll;
  });
}
