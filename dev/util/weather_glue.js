// ./assets/dev/util/weather_glue.js
// Wires Weather engine into the game lifecycle with procedural textures, audio, and Bloodmoon support
(function(){
  "use strict";

  const pick = arr => arr[(Math.random()*arr.length)|0];
  const clamp = (v,a,b)=> Math.max(a, Math.min(b, v));
  const STATE = {
    booted: false,
    inited: false,
    current: null,
    thunderTimers: [],
    bloodmoonTimers: [],
    ambientName: null
  };

  // --- Helpers ---
  function getScene(){ return window.SCENE || BABYLON.EngineStore.LastCreatedScene || null; }

  function stopAmbientLoop(){
    if (STATE.ambientName && PP?.audio){
      try { PP.audio.stop(STATE.ambientName); } catch{}
      STATE.ambientName = null;
    }
  }

  function playAmbientLoop(name, volume=0.35){
    stopAmbientLoop();
    if (PP?.audio?.loop){
      STATE.ambientName = name;
      PP.audio.loop(name, volume);
    }
  }

  function playThunder(){
    if (!PP?.audio) return;
    const sounds = window.WEATHER_AUDIO_MAP?.thunder || ["thunder1","thunder2","thunder3"];
    PP.audio.play(pick(sounds), { volume: 0.25 + Math.random()*0.3 });
  }

 function scheduleRandomRumble(){
    STATE.thunderTimers ||= [];
    const delay = 5000 + Math.random()*15000;
    const timer = setTimeout(() => {
        if (STATE.current === "Rainstorm" && PP?.audio?.play){
            const rumbleSounds = window.WEATHER_AUDIO_MAP?.rumble || ["thunder_rumble1","thunder_rumble2"];
            const sound = rumbleSounds[Math.floor(Math.random()*rumbleSounds.length)];
            PP.audio.play(sound, { volume: 0.2 + Math.random()*0.2 });
        }
        scheduleRandomRumble();
    }, delay);
    STATE.thunderTimers.push(timer);
}


  function clearThunderTimers(){
    STATE.thunderTimers.forEach(t => clearTimeout(t));
    STATE.thunderTimers = [];
  }

  function clearBloodmoonTimers(){
    STATE.bloodmoonTimers.forEach(t => clearTimeout(t));
    STATE.bloodmoonTimers = [];
  }

  // --- Bloodmoon ---
  function startBloodmoonEffects(){
    const scene = getScene();
    if (!PP?.audio || !window.Weather || STATE.current !== "Bloodmoon" || !scene) return;

    // Set red fog
    scene.fogColor = new BABYLON.Color3(0.5,0.05,0.05);

    // Set Bloodmoon particles via Weather API
    Weather.set("Bloodmoon",{intensity:0.8,immediate:true});

    // Red ambient loop
    playAmbientLoop(window.WEATHER_AUDIO_MAP?.bloodmoon || "bloodmoon_loop", 0.4);

    function thunderPulse(){
      if (STATE.current === "Bloodmoon"){
        playThunder();
        const t = setTimeout(thunderPulse, 5000 + Math.random()*15000);
        STATE.bloodmoonTimers.push(t);
      }
    }
    thunderPulse();
  }

  function stopBloodmoonEffects(){
    clearBloodmoonTimers();
    const scene = getScene();
    if (scene) scene.fogColor = new BABYLON.Color3(0.02,0.03,0.05);
  }

  // --- Weather ---
  function setWeather(state, opts={}){
    if (!window.Weather) return;
    opts = opts || {};
    try { Weather.set(state, opts); } catch(e){ console.warn(e); }

    stopAmbientLoop();
    clearThunderTimers();
    stopBloodmoonEffects();

    STATE.current = state;

    switch(state){
      case "Clear": playAmbientLoop(window.WEATHER_AUDIO_MAP?.clear || "ambient",0.25); break;
      case "Rainstorm": 
        playAmbientLoop(window.WEATHER_AUDIO_MAP?.rain || "rain_loop",0.35);
        scheduleRandomRumble(); 
        break;
      case "Snow": playAmbientLoop(window.WEATHER_AUDIO_MAP?.snow || "snow_loop",0.25); break;
      case "Bloodmoon": startBloodmoonEffects(); break;
    }
  }

  function cycleWeather(){
    if (!window.Weather) return;
    const next = STATE.current === "Clear" ? "Rainstorm" :
                 STATE.current === "Rainstorm" ? "Snow" :
                 STATE.current === "Snow" ? "Bloodmoon" :
                 "Clear";
    setWeather(next, { intensity: next==="Clear"?undefined:(0.5+Math.random()*0.5) });
  }

  // --- Input binding ---
  function bindKeys(){
    window.addEventListener("keydown", (e)=>{
      if (!e.altKey) return;
      switch(e.code){
        case "Digit1": setWeather("Clear",{immediate:true}); break;
        case "Digit2": setWeather("Rainstorm",{intensity:0.8}); break;
        case "Digit3": setWeather("Snow",{intensity:0.6}); break;
        case "Digit4": setWeather("Bloodmoon",{intensity:0.7}); break;
        case "KeyW": cycleWeather(); break;
      }
    });
  }

  function expose(){
    window.setWeather = setWeather;
    window.cycleWeather = cycleWeather;
    window.playThunder = playThunder;
  }

  // --- Boot ---
  function firstInteractionBoot(){
    if (STATE.booted) return;
    const boot = ()=>{
      STATE.booted = true;
      document.removeEventListener("pointerdown", boot);
      document.removeEventListener("keydown", boot);
      window.audioUnlocked = true;
      initWeatherOnce();
    };
    document.addEventListener("pointerdown", boot, { once:true, capture:true });
    document.addEventListener("keydown", boot, { once:true, capture:true });
  }

  function initWeatherOnce(){
    if (STATE.inited || !window.Weather) return false;

    try { if (typeof Weather.init === "function") Weather.init(); } catch {}

    // Determine state
    const urlState = (new URLSearchParams(location.search)).get("weather") || 
                     (location.hash.match(/weather=([^&]+)/i)?.[1]);
    let state = urlState && /^(clear|rainstorm|snow|bloodmoon)$/i.test(urlState) 
      ? urlState[0].toUpperCase()+urlState.slice(1).toLowerCase() 
      : null;
    if (!state){
      const r = Math.random();
      state = r < 0.55 ? "Clear" : (r < 0.85 ? "Rainstorm" : "Snow");
    }

    setWeather(state, { intensity: state==="Clear"?undefined:(0.5+Math.random()*0.5), immediate:true });
    STATE.inited = true;
    return true;
  }

  // --- Main Boot Glue ---
  (function boot(){
    expose();
    bindKeys();
    firstInteractionBoot();
    // Ensure weather starts after game starts
    window.addEventListener("pp:start", ()=>initWeatherOnce());
  })();

})();
