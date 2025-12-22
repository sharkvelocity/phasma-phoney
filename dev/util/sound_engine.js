window.PP = window.PP || {};
PP.audio = PP.audio || {};

(function soundEngine(){
  'use strict';

  const SFX = {
    ambient:         './audio/clearWeather.mp3',
    rainstorm:       './audio/rainstorm.mp3',
    snow:            './audio/snow.mp3',
    thunder1:        './audio/thunder.mp3',
    thunderLoud:     './audio/thunder_loud.mp3',
    thunderRumble:   './audio/thunder_rumble.mp3',
    step1:           './audio/step1.mp3',
    step2:           './audio/step2.mp3',
    step3:           './audio/step3.mp3',
    radio:           './audio/radio.mp3',
    singingGhost:    './audio/singingGhost.mp3',
    notebook:        './audio/notebook_open.mp3',
    toss:            './audio/Toss.wav',
    doorCreak:       './audio/door_creak.mp3',
    spiritboxLoop:   './audio/spiritbox.mp3'
  };

  if(PP.audio.register) {
    PP.audio.register(Object.keys(SFX).reduce((m,k)=> (m[k]={url:SFX[k]}, m), {}));
  } else {
    console.warn("[soundEngine] PP.audio.register missing, skipping SFX registration");
  }

  PP.audio.playStep      = (i)=> PP.audio.play?.(['step1','step2','step3'][i%3], { volume: 0.9 });
  PP.audio.playRadio     = ()=> PP.audio.play?.('radio', { volume: 0.8 });
  PP.audio.playNotebook  = ()=> PP.audio.play?.('notebook', { volume: 0.7 });
  PP.audio.loopAmbient   = ()=> PP.audio.loop?.('ambient', 0.35);
  PP.audio.loopSnow      = ()=> PP.audio.loop?.('snow', 0.25);
  PP.audio.loopRainstorm = ()=> PP.audio.loop?.('rainstorm', 0.6);

  PP.audio.weather = (function(){
    let currentLoop = null;
    let rainAudio = null, thunderTimeout = null;
    let particleSystem = null;
    const thunderFiles = ['thunder1','thunderLoud','thunderRumble'];

    function stopAll(scene){
      if(currentLoop){ currentLoop.stop(); currentLoop = null; }
      stopRain();
      stopParticles();
      resetBloodmoonLighting(scene);
    }

    function startRain(scene){
      stopAll(scene);
      rainAudio = PP.audio.loop?.('rainstorm', 0.6);
      currentLoop = rainAudio;
      scheduleThunder(scene);
      spawnRainParticles(scene);
    }

    function stopRain(){
      if(rainAudio){ rainAudio.stop(); rainAudio = null; }
      clearTimeout(thunderTimeout);
    }

    function scheduleThunder(scene){
      const delay = 5000 + Math.random()*10000;
      thunderTimeout = setTimeout(()=>{
        playRandomThunder(scene);
        scheduleThunder(scene);
      }, delay);
    }

    function playRandomThunder(scene){
      const file = thunderFiles[Math.floor(Math.random()*thunderFiles.length)];
      const volume = 0.4 + Math.random()*0.3;
      if(PP.audio.play) PP.audio.play(file, { volume });
      if(scene?.effects?.flashLightning) setTimeout(()=> scene.effects.flashLightning(volume), Math.random()*200);
    }

    function startSnow(scene){
      stopAll(scene);
      currentLoop = PP.audio.loop?.('snow', 0.25);
      spawnSnowParticles(scene);
    }

    function startClear(scene){
      stopAll(scene);
      currentLoop = PP.audio.loop?.('ambient', 0.35);
    }

    function startBloodmoon(scene){
      stopAll(scene);
      rainAudio = PP.audio.loop?.('rainstorm', 0.6);
      currentLoop = rainAudio;
      scheduleThunder(scene);
      spawnRainParticles(scene, new BABYLON.Color3(1,0.1,0.1));
      applyBloodmoonLighting(scene);
    }

    function stopParticles(){
      if(particleSystem && !particleSystem.isDisposed()){
        particleSystem.dispose();
        particleSystem = null;
      }
    }

    function spawnRainParticles(scene, tint=new BABYLON.Color3(0.5,0.5,1)){
      stopParticles();
      if(!scene) return;
      particleSystem = new BABYLON.ParticleSystem("rain", 5000, scene);
      particleSystem.particleTexture = new BABYLON.Texture("assets/particles/raindrop.png", scene);
      particleSystem.emitter = new BABYLON.Vector3(0,20,0);
      particleSystem.minEmitBox = new BABYLON.Vector3(-50,0,-50);
      particleSystem.maxEmitBox = new BABYLON.Vector3(50,0,50);
      particleSystem.color1 = new BABYLON.Color4(tint.r,tint.g,tint.b,0.7);
      particleSystem.color2 = new BABYLON.Color4(tint.r,tint.g,tint.b,0.7);
      particleSystem.minSize = 0.1;
      particleSystem.maxSize = 0.2;
      particleSystem.minLifeTime = 0.3;
      particleSystem.maxLifeTime = 0.5;
      particleSystem.emitRate = 1500;
      particleSystem.gravity = new BABYLON.Vector3(0,-30,0);
      particleSystem.direction1 = new BABYLON.Vector3(0,-1,0);
      particleSystem.direction2 = new BABYLON.Vector3(0,-1,0);
      particleSystem.start();
    }

    function spawnSnowParticles(scene){
      stopParticles();
      if(!scene) return;
      particleSystem = new BABYLON.ParticleSystem("snow", 3000, scene);
      particleSystem.particleTexture = new BABYLON.Texture("assets/particles/snowflake.png", scene);
      particleSystem.emitter = new BABYLON.Vector3(0,20,0);
      particleSystem.minEmitBox = new BABYLON.Vector3(-50,0,-50);
      particleSystem.maxEmitBox = new BABYLON.Vector3(50,0,50);
      particleSystem.color1 = new BABYLON.Color4(1,1,1,0.8);
      particleSystem.color2 = new BABYLON.Color4(0.9,0.9,1,0.8);
      particleSystem.minSize = 0.2;
      particleSystem.maxSize = 0.4;
      particleSystem.minLifeTime = 3;
      particleSystem.maxLifeTime = 5;
      particleSystem.emitRate = 800;
      particleSystem.gravity = new BABYLON.Vector3(0,-1,0);
      particleSystem.direction1 = new BABYLON.Vector3(-0.5,-1,-0.5);
      particleSystem.direction2 = new BABYLON.Vector3(0.5,-1,0.5);
      particleSystem.start();
    }

    function applyBloodmoonLighting(scene){
      if(!scene) return;
      if(scene.fogColor) scene.fogColor = new BABYLON.Color3(0.3,0.05,0.05);
      if(scene.clearColor) scene.clearColor = new BABYLON.Color3(0.2,0,0);
      if(window.hemi) window.hemi.diffuse = new BABYLON.Color3(1,0.1,0.1);
    }

    function resetBloodmoonLighting(scene){
      if(!scene) return;
      if(scene.fogColor) scene.fogColor = new BABYLON.Color3(0.02,0.03,0.05);
      if(scene.clearColor) scene.clearColor = new BABYLON.Color3(0,0,0);
      if(window.hemi) window.hemi.diffuse = new BABYLON.Color3(1,1,1);
    }

    function set(state, scene){
      switch(state?.toLowerCase()){
        case 'rainstorm': startRain(scene); break;
        case 'snow': startSnow(scene); break;
        case 'bloodmoon': startBloodmoon(scene); break;
        case 'clear':
        default: startClear(scene); break;
      }
    }

    return { stopAll, set };
  })();

})();
