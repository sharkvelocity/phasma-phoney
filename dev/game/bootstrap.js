/* bootstrap.js — unified game bootstrap with player rig + maps + audio + weather + controls */
(function(){
"use strict";
if(window.__GameBootstrapReady) return;
window.__GameBootstrapReady = true;

const log  = (...a)=>{ try{ console.log("[bootstrap]", ...a); }catch{} };
const warn = (...a)=>{ try{ console.warn("[bootstrap]", ...a); }catch{} };

const $ = s => document.querySelector(s);

// ---------- Loader UI ----------
const Loader = (() => {
  const box = () => $("#loading-box");
  const text = () => $("#loading-text");
  const fill = () => $("#loading-fill");
  let stepsDone=0, stepsTotal=0, queue=[];
  function show(){ const b=box(); if(b) b.style.display="flex"; }
  function hide(){ const b=box(); if(b) b.style.display="none"; }
  function label(s){ const t=text(); if(t) t.textContent = s||""; }
  function draw(){ const f=fill(); if(f) f.style.width = (stepsTotal?(stepsDone/stepsTotal*100):0).toFixed(1)+"%"; }
  function reset(){ queue.length=0; stepsDone=0; stepsTotal=0; draw(); }
  function addStep(lbl, fn){ queue.push({lbl,fn}); stepsTotal=queue.length; }
  async function run(){
    show(); draw();
    for(const s of queue){
      label(s.lbl); draw();
      try{ await s.fn(); }catch(e){ warn("step failed:", s.lbl, e); throw e; /* re-throw to stop game start if a step fails */ }
      stepsDone++; draw();
    }
    label("Finalizing…"); draw();
    await new Promise(r=>setTimeout(r,120));
    hide();
  }
  return { reset, addStep, run, show, hide, label, updateProgress: draw }; // updateProgress is for external use if needed
})();

// ---------- State ----------
let engine=null, scene=null, camera=null;
let hemi=null;
let started=false;

window.PP = window.PP || {};
// PP.mapManifest will be populated by loadManifest
PP.rig = window.PlayerRig; // Reference the global PlayerRig
PP.state = PP.state || {}; // For general game state
PP.controls = PP.controls || {}; // For control states
PP.weather = PP.weather || { current:null }; // Current weather state


// ---------- Map Manifest / Selector ----------
// This logic should now be the *only* place managing the map dropdown.
async function fetchJSON(url){
  try{
    const r = await fetch(url,{cache:"no-store"});
    if(!r.ok) throw new Error(`HTTP error! status: ${r.status} ${r.statusText}`);
    return await r.json();
  }catch(e){ warn("fetchJSON failed:", url,e); return null; }
}

async function loadManifestAndPopulateDropdown(){
  const j = await fetchJSON("./assets/models/map/maps.json");
  // Assuming map_loader.js only defines PP.mapManifest, we'll populate it here
  if(Array.isArray(j)) PP.mapManifest = j;
  else if(j && Array.isArray(j.maps)) PP.mapManifest = j.maps;
  else {
    warn("maps.json malformed or empty, using fallback manifest.");
    // Fallback if maps.json is not found or malformed
    PP.mapManifest = [
      { file: "Abandoned_House.glb", title: "Abandoned House" },
      { file: "furnished_house.glb", title: "Furnished House" },
      { file: "jailhouse.glb", title: "Jailhouse" },
      { title: "Procedural ProHouse (grid)", def: "prohouse_generator" },
      { file: "Abandoned_House2.glb", title: "Abandoned House 2" },
      { file: "farm_house.glb", title: "Farm House" }
    ];
  }

  const sel = $("#map-select");
  if(sel){
    // Clear any existing "loading maps" option
    sel.innerHTML = "";
    PP.mapManifest.forEach((m,i)=>{
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = m.title || m.file || ("map#"+i);
      sel.appendChild(opt);
    });

    let saved = parseInt(localStorage.getItem("selectedMapIndex"));
    if(isNaN(saved) || saved < 0 || saved >= PP.mapManifest.length) saved = 0;
    sel.value = saved;
    sel.onchange = ()=>{ localStorage.setItem("selectedMapIndex", sel.value); };

    // Initial HUD update for selected weather, before game starts
    const lastWeather = JSON.parse(localStorage.getItem("pp_weather") || "{}");
    if(lastWeather.type && window.updateWeather) {
      window.updateWeather(lastWeather.type, lastWeather.temp);
    }
  } else {
    warn("Map select element #map-select not found.");
  }
}

function getSelectedMapData(){
  const sel = $("#map-select");
  const idx = Number(sel?.value);
  if(isNaN(idx)||idx<0||idx>=PP.mapManifest.length) {
    warn("Invalid map selection, returning first map.");
    return PP.mapManifest[0];
  }
  return PP.mapManifest[idx];
}

// ---------- Engine & Scene ----------
function createEngineScene(){
  if(engine && scene) return;
  const canvas=$("#renderCanvas");
  if(!canvas) throw new Error("Missing #renderCanvas");
  engine=new BABYLON.Engine(canvas,true,{preserveDrawingBuffer:true,stencil:true,antialias:true});
  scene = new BABYLON.Scene(engine);
  scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.0045;
  scene.fogColor = new BABYLON.Color3(0.02, 0.03, 0.05);

  hemi=new BABYLON.HemisphericLight("hemi",new BABYLON.Vector3(0,1,0),scene);
  hemi.intensity=0.35;

  camera=new BABYLON.UniversalCamera("playerCam",new BABYLON.Vector3(0,1.8,0),scene);
  camera.minZ=0.1;
  try{ camera.inputs.clear(); }catch(e){} // Clear default camera inputs

  // Ground
  const ground=BABYLON.MeshBuilder.CreateGround("pp_ground",{width:200,height:200},scene);
  ground.isVisible=false;
  ground.checkCollisions=true;
  ground.receiveShadows=true;
  ground.metadata={isGround:true};

  // Enable Babylon physics
  // Make sure you have the Cannon.js script loaded (e.g., ./cdn/cannon.min.js)
  try {
    scene.enablePhysics(new BABYLON.Vector3(0,-9.81,0), new BABYLON.CannonJSPlugin());
  } catch(e) {
    warn("Physics engine (Cannon.js) not found or failed to initialize. PlayerRig will use kinematic movement.", e);
  }


  window.ENGINE = engine;
  window.scene = scene;  
  window.SCENE = scene;  
  window.camera = camera; 
  
  engine.runRenderLoop(()=>{ try{ if(scene) scene.render(); }catch(e){} });
  window.addEventListener("resize",()=>engine.resize());
  log("Babylon.js Engine and Scene created.");
}

// ---------- Weather + Audio ----------
// Use PP.weatherDefs from map_loader.js for definitions
let currentAmbientSound=null; // Renamed to avoid conflict with `weatherSound` in applyWeather

function pickRandomWeather(){
  // Use PP.weatherDefs (from map_loader.js)
  const choice = PP.weatherDefs[Math.floor(Math.random() * PP.weatherDefs.length)];
  const temp = choice.tempRange
    ? Math.floor(Math.random() * (choice.tempRange[1] - choice.tempRange[0] + 1)) + choice.tempRange[0]
    : 20; // Default temp
  return { type: choice.type, temp, ambient: choice.ambient };
}

function applyWeather(weatherData){
  if(!scene) { warn("Cannot apply weather: scene not ready."); return; }
  log("Applying weather:", weatherData.type, "Temp:", weatherData.temp);
  PP.weather.current = weatherData; // Store current weather

  // Clear any previous weather particle systems / sound
  if(currentAmbientSound){ currentAmbientSound.stop(); currentAmbientSound.dispose(); currentAmbientSound=null; }
  scene.meshes.filter(m=>m.metadata?.isWeather).forEach(m=>m.dispose()); // Clean up old weather meshes/particles

  // Update HUD
  if(window.updateWeather) window.updateWeather(weatherData.type, weatherData.temp);

  // Apply visual effects (particle systems, fog) based on weatherData.type
  switch(weatherData.type){
    case "Rain":{ // Use "Rain" string directly as defined in PP.weatherDefs
      const ps = new BABYLON.ParticleSystem("rain", 2000, scene);
      ps.particleTexture = new BABYLON.Texture("./assets/textures/rain.png", scene);
      ps.emitter = new BABYLON.Vector3(0,15,0);
      ps.minEmitBox = new BABYLON.Vector3(-20,0,-20);
      ps.maxEmitBox = new BABYLON.Vector3(20,0,20);
      ps.color1=new BABYLON.Color4(0.7,0.7,1,0.6);
      ps.color2=new BABYLON.Color4(0.7,0.7,1,0.6);
      ps.minSize=0.05; ps.maxSize=0.1;
      ps.minLifeTime=0.3; ps.maxLifeTime=0.6;
      ps.emitRate=1500;
      ps.direction1=new BABYLON.Vector3(0,-1,0);
      ps.direction2=new BABYLON.Vector3(0,-1,0);
      ps.gravity=new BABYLON.Vector3(0,-9.81,0);
      ps.updateSpeed=0.01;
      ps.start();
      // Particles attached to a dummy root for easier disposal
      const dummyRoot = new BABYLON.Mesh("weather_root_rain", scene);
      dummyRoot.metadata = { isWeather: true };
      ps.parent = dummyRoot;
      break;
    }
    case "Snow":{ // Use "Snow" string
      const ps = new BABYLON.ParticleSystem("snow", 1000, scene);
      ps.particleTexture = new BABYLON.Texture("./assets/textures/snowflake.png", scene);
      ps.emitter = new BABYLON.Vector3(0,15,0);
      ps.minEmitBox = new BABYLON.Vector3(-20,0,-20);
      ps.maxEmitBox = new BABYLON.Vector3(20,0,20);
      ps.color1=new BABYLON.Color4(1,1,1,1);
      ps.color2=new BABYLON.Color4(0.9,0.9,0.9,1);
      ps.minSize=0.15; ps.maxSize=0.25;
      ps.minLifeTime=2; ps.maxLifeTime=4;
      ps.emitRate=300;
      ps.direction1=new BABYLON.Vector3(-0.2,-1,0.2);
      ps.direction2=new BABYLON.Vector3(0.2,-1,-0.2);
      ps.gravity=new BABYLON.Vector3(0,-1,0);
      ps.updateSpeed=0.01;
      ps.start();
      const dummyRoot = new BABYLON.Mesh("weather_root_snow", scene);
      dummyRoot.metadata = { isWeather: true };
      ps.parent = dummyRoot;
      break;
    }
    case "Foggy":{ // Use "Foggy" string
      scene.fogDensity = 0.02;
      break;
    }
    case "Clear": // "Clear"
    default:{
      scene.fogDensity = 0.0045; // Default fog density
    }
  }

  // Play ambient sound
  if(weatherData.ambient){
    currentAmbientSound = new BABYLON.Sound(
      "ambient",
      "./assets/audio/" + weatherData.ambient,
      scene,
      null,
      { loop:true, autoplay:true, volume:0.6 }
    );
    log(`Started ambient sound: ${weatherData.ambient}`);
  }
}

// ---------- Player Rig Integration ----------
async function startPlayerRig(){
  if(PP.rig && typeof PP.rig.start === "function"){
    await PP.rig.start(scene, engine, camera);
    // After player rig starts, you might want to call its initPlayer function if it has one
    // e.g., to position the player based on the map's spawn point after the map is loaded
    if(PP.rig._internal && typeof PP.rig._internal._getSpawnPosition === "function"){
      const spawnPos = PP.rig._internal._getSpawnPosition();
      if(PP.rig.getBody()) {
          PP.rig.getBody().position.copyFrom(spawnPos);
          if (PP.rig.getBody().physicsImpostor) {
              PP.rig.getBody().physicsImpostor.setLinearVelocity(BABYLON.Vector3.Zero());
              PP.rig.getBody().physicsImpostor.setAngularVelocity(BABYLON.Vector3.Zero());
          }
      }
      camera.position.copyFrom(spawnPos); // Initial camera position
      log("PlayerRig positioned at spawn point.");
    }
  } else {
    warn("PlayerRig module not found or not correctly initialized.");
  }
}

// ---------- Game Initialization and Start Button Logic ----------
async function startGame(){
  if(started) return;
  started = true;

  // Hide title screen immediately
  const title = $("#title-screen");
  if(title) title.style.display = "none";

  try {
    Loader.reset();

    Loader.addStep("Creating engine & scene…", createEngineScene);

    Loader.addStep("Loading map manifest…", loadManifestAndPopulateDropdown);

    Loader.addStep("Loading selected map…", async ()=>{
      const mapData = getSelectedMapData();
      if(mapData && typeof PP.mapManager?.loadMap === "function"){
        await PP.mapManager.loadMap(mapData);
        log(`Map '${mapData.title || mapData.file}' loaded.`);
      } else {
        throw new Error(`Invalid map data or PP.mapManager.loadMap missing for map: ${JSON.stringify(mapData)}`);
      }
    });

    Loader.addStep("Initializing player rig…", startPlayerRig);

    Loader.addStep("Applying weather conditions…", async ()=>{
      let weather = localStorage.getItem("pp_weather");
      if(weather){
        try { weather = JSON.parse(weather); }
        catch(e) { warn("Corrupt weather in storage, resetting.", e); weather = null; }
      }
      if(!weather){
        weather = pickRandomWeather();
        localStorage.setItem("pp_weather", JSON.stringify(weather));
      }
      applyWeather(weather); // This handles ambient sound as well
    });

    await Loader.run(); // Execute all loading steps

    // After everything loads, ensure pointer lock is requested
    const canvas = $("#renderCanvas");
    if(canvas && canvas.requestPointerLock) {
      canvas.focus();
      canvas.requestPointerLock();
      log("Pointer lock requested.");
    }

  } catch (error) {
    warn("Failed to start game:", error);
    alert("Game failed to start: " + error.message);
    // Potentially re-show title screen or an error message
    if(title) title.style.display = "flex";
    Loader.hide();
    started = false; // Allow retrying
  }
}

// Bind start button and quit button listeners after DOM is loaded
document.addEventListener("DOMContentLoaded",()=>{
  const startBtn=$("#start-button");
  if(startBtn) {
    startBtn.addEventListener("click",startGame);
    log("Start button event listener attached.");
  } else {
    warn("Start button #start-button not found.");
  }

  const quitBtn = $("#quit-btn");
  if(quitBtn){
    quitBtn.addEventListener("click", ()=>{
      log("Quit button clicked. Resetting weather and ambient sound.");
      localStorage.removeItem("pp_weather"); // Clear saved weather
      if(currentAmbientSound){
        currentAmbientSound.stop();
        currentAmbientSound.dispose();
        currentAmbientSound = null;
      }
      // Reload page to return to title screen (or implement a proper menu system)
      window.location.reload();
    });
  }
});

// Expose startGame globally if needed by other scripts (e.g., console)
window.startGame=startGame;

})();
