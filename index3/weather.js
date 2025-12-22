// Weather system with crossfades + lightning/thunder + indoor muffling.
// STARTS ONLY AFTER "pp:start" (fired when user clicks Start Investigation).
(function(){
  "use strict";
  const lerp = (a,b,t)=> a + (b-a)*Math.max(0, Math.min(1, t));
  const clamp = (v,a,b)=> Math.max(a, Math.min(b,v));
  const v3 = (x,y,z)=> new BABYLON.Vector3(x,y,z);

  const S = {
    state: "Clear",          // "Clear" | "Rainstorm" | "Snow"
    ready: false,
    sounds: { ambient:null, clear:null, rain:null, snow:null, thunder:[] },
    volBase: { ambient:0.7, clear:0.25, rain:0.6, snow:0.5, thunder:0.9 },
    volTarget: { ambient:0.7, clear:0.0,  rain:0.0, snow:0.0, thunder:0.9 },
    indoor: false,
    intensity: 1.0,
    nextLightningAt: 0,
    lastT: performance.now()/1000,
    boundUpdate: null,
    lightCache: [],
    // indoor monitor
    _indoorLast: null,
    _indoorAcc: 0,
    _indoorPeriod: 0.5, // seconds
  };

  function ensureSounds(){
    if (S.ready || !window.scene) return;
    const scn = window.scene;
    try {
      S.sounds.ambient = new BABYLON.Sound("amb", "./assets/audio/ambient.mp3", scn, null,
        { loop:true, autoplay:false, volume:S.volBase.ambient, spatialSound:false });

      S.sounds.clear   = new BABYLON.Sound("clear", "./assets/audio/clearWeather.mp3", scn, null,
        { loop:true, autoplay:false, volume:0.0, spatialSound:false });

      S.sounds.rain    = new BABYLON.Sound("rain", "./assets/audio/rainstorm.mp3", scn, null,
        { loop:true, autoplay:false, volume:0.0, spatialSound:false });

      try {
        S.sounds.snow = new BABYLON.Sound("snow", "./assets/audio/snow.mp3", scn, null,
          { loop:true, autoplay:false, volume:0.0, spatialSound:false });
      } catch(_){ S.sounds.snow = null; }

      const list = (window.WEATHER_AUDIO_MAP?.thunder?.length ? window.WEATHER_AUDIO_MAP.thunder : ["thunder1.mp3","thunder2.mp3","thunder3.mp3"]);
      list.forEach((f,i)=>{
        try{
          const th = new BABYLON.Sound("th"+i, "./assets/audio/"+f, scn, null,
            { loop:false, autoplay:false, volume:S.volBase.thunder, spatialSound:false });
          S.sounds.thunder.push(th);
        }catch(_){}
      });

      S.ready = true;
    } catch (e) {
      console.warn("[weather] sound init failed", e);
    }
  }

  function _applyTargets(dt){
    if (!S.ready) return;
    const muffle = S.indoor ? 0.35 : 1.0;
    const tAmbient = S.volTarget.ambient;
    const tClear   = S.volTarget.clear;
    const tRain    = S.volTarget.rain * S.intensity * muffle;
    const tSnow    = S.volTarget.snow * S.intensity * muffle;
    const k = clamp(dt * 1.5, 0, 1);

    try {
      if (S.sounds.ambient) S.sounds.ambient.setVolume( lerp(S.sounds.ambient.getVolume(), tAmbient, k) );
      if (S.sounds.clear)   S.sounds.clear.setVolume(   lerp(S.sounds.clear.getVolume(),   tClear,   k) );
      if (S.sounds.rain)    S.sounds.rain.setVolume(    lerp(S.sounds.rain.getVolume(),    tRain,    k) );
      if (S.sounds.snow)    S.sounds.snow.setVolume(    lerp(S.sounds.snow.getVolume(),    tSnow,    k) );
    } catch {}

    // (Re)start/stop loops as needed
    try { if (S.sounds.ambient && tAmbient > 0.02 && !S.sounds.ambient.isPlaying) S.sounds.ambient.play(); } catch {}
    try { if (S.sounds.clear   && tClear   > 0.02 && !S.sounds.clear.isPlaying)   S.sounds.clear.play();   } catch {}
    try { if (S.sounds.rain    && tRain    > 0.02 && !S.sounds.rain.isPlaying)    S.sounds.rain.play();    } catch {}
    try { if (S.sounds.snow    && tSnow    > 0.02 && !S.sounds.snow.isPlaying)    S.sounds.snow.play();    } catch {}

    try { if (S.sounds.clear   && tClear   <= 0.01 && S.sounds.clear.isPlaying)   S.sounds.clear.stop();   } catch {}
    try { if (S.sounds.rain    && tRain    <= 0.01 && S.sounds.rain.isPlaying)    S.sounds.rain.stop();    } catch {}
    try { if (S.sounds.snow    && tSnow    <= 0.01 && S.sounds.snow.isPlaying)    S.sounds.snow.stop();    } catch {}
  }

  function _scheduleLightningSoon(min=7, max=18){
    const now = performance.now()/1000;
    const k = clamp(S.intensity, 0.15, 1);
    const delay = (min + (max-min)*(1-k)) * (0.6 + Math.random()*0.8);
    S.nextLightningAt = now + delay;
  }

  function _flashLightning(){
    const layer = document.getElementById('flash-overlay');
    if (!layer) return;
    const pulses = 1 + (Math.random()<0.6 ? 1 : 0);
    let i = 0;
    const doPulse = () => {
      if (i++ >= pulses) return;
      const alpha = 0.6 + Math.random()*0.35;
      layer.style.opacity = String(alpha);
      setTimeout(()=> layer.style.opacity = '0', 80 + Math.random()*90);
      _flickerNearbyLights(0.5 + Math.random()*0.6);
      setTimeout(_playThunder, 140 + Math.random()*220);
      if (i < pulses) setTimeout(doPulse, 120 + Math.random()*140);
    };
    doPulse();
  }

  function _playThunder(){
    const arr = S.sounds.thunder || [];
    if (!arr.length) return;
    const s = arr[(Math.random()*arr.length)|0];
    try {
      s.setVolume( clamp(S.volBase.thunder * (0.7 + Math.random()*0.5) * (S.indoor?0.6:1.0), 0, 1) );
      s.play();
    } catch {}
  }

  function _flickerNearbyLights(durSec){
    try{
      const sc = scene;
      if (!S.lightCache.length) S.lightCache = (sc.lights||[]).slice();
      const cam = scene.activeCamera || window.camera;
      const ref = cam?.position || v3(0,0,0);
      const lights = S.lightCache.filter(L=>{
        const p = L.getAbsolutePosition?.() || L.position;
        if (!p) return false;
        return BABYLON.Vector3.Distance(p, ref) <= 16;
      });
      if (!lights.length) return;
      const saved = lights.map(L=>({L, i:L.intensity}));
      const id = setInterval(()=>{ lights.forEach(({L,i})=> L.intensity = i * (0.7 + Math.random()*0.7)); }, 40);
      setTimeout(()=>{ clearInterval(id); saved.forEach(({L,i})=> L.intensity = i); }, durSec*1000);
    }catch{}
  }

  // -------- INDOOR / OUTDOOR DETECTION (fixes "muffled outside") --------
  function _isIndoorAt(pos){
    const sc = window.scene; if (!sc || !pos) return false;

    // 1) Van zone override → outdoor
    try{
      const V = window.PP?.CONFIG?.VAN;
      if (V && V.POSITION && typeof V.RADIUS === 'number') {
        if (BABYLON.Vector3.Distance(pos, V.POSITION) <= (V.RADIUS + 1.0)) return false;
      }
    } catch {}

    // 2) Upward ray: if we hit a roof/ceiling above us, treat as indoor
    const from = new BABYLON.Vector3(pos.x, pos.y + 0.5, pos.z);
    const ray  = new BABYLON.Ray(from, new BABYLON.Vector3(0,1,0), 12); // up to 12m overhead
    const hit  = sc.pickWithRay(ray, (m)=>{
      if (!m) return false;
      if (m.isPickable === false) return false;
      if (m.metadata?.isRoof || m.metadata?.isCeiling) return true;
      const n = (m.name || '').toLowerCase();
      return /roof|ceiling|attic|upper|secondfloor/.test(n);
    });
    return !!(hit && hit.hit);
  }

  function _indoorMonitor(dt){
    S._indoorAcc += dt;
    if (S._indoorAcc < S._indoorPeriod) return;
    S._indoorAcc = 0;

    const cam = scene?.activeCamera || window.camera;
    const p = cam?.position;
    if (!p) return;

    const isIn = _isIndoorAt(p);
    if (isIn !== S._indoorLast){
      S._indoorLast = isIn;
      Weather.setIndoor(isIn); // this will update volumes & HUD text
    }
  }
  // ---------------------------------------------------------------------

  function _update(dt){
    if (S.state === "Rainstorm"){
      const now = performance.now()/1000;
      if (now >= S.nextLightningAt){ _flashLightning(); _scheduleLightningSoon(); }
    }
    // Check indoor/outdoor at low frequency
    _indoorMonitor(dt);

    _applyTargets(dt);
    const hw = document.getElementById('hud-weather');
    if (hw) hw.textContent = S.state + (S.indoor ? " (Indoor)" : "");
  }

  function _hookSceneUpdate(){
    if (!scene || S.boundUpdate) return;
    S.boundUpdate = () => {
      const now = performance.now()/1000;
      const dt = Math.min(0.2, Math.max(0, now - S.lastT));
      S.lastT = now;
      _update(dt);
    };
    scene.onBeforeRenderObservable.add(S.boundUpdate);
  }

  // Public API
  window.Weather = {
    init(){
      ensureSounds();
      Weather.set(S.state, { immediate:true });
      _hookSceneUpdate();
    },
    set(state, opts={}){
      if (!/^(Clear|Rainstorm|Snow)$/.test(state)) return;
      S.state = state;
      if (typeof opts.intensity === 'number') S.intensity = clamp(opts.intensity, 0, 1);

      if (state === "Clear"){
        S.volTarget.ambient = S.volBase.ambient;
        S.volTarget.clear   = S.volBase.clear;
        S.volTarget.rain    = 0.0;
        S.volTarget.snow    = 0.0;
        _scheduleLightningSoon(999,999);
      } else if (state === "Rainstorm"){
        S.volTarget.ambient = S.volBase.ambient * 0.9;
        S.volTarget.clear   = 0.0;
        S.volTarget.rain    = S.volBase.rain;
        S.volTarget.snow    = 0.0;
        _scheduleLightningSoon();
      } else { // Snow
        S.volTarget.ambient = S.volBase.ambient * 0.9;
        S.volTarget.clear   = 0.0;
        S.volTarget.rain    = 0.0;
        S.volTarget.snow    = S.volBase.snow;
        _scheduleLightningSoon(999,999);
      }

      const hw = document.getElementById('hud-weather');
      if (hw) hw.textContent = S.state + (S.indoor ? " (Indoor)" : "");
    },
    setIndoor(on){
      S.indoor = !!on;
      // Recompute targets to apply muffling immediately
      Weather.set(S.state, { intensity:S.intensity });
    },
    setVolumes(v){
      Object.assign(S.volBase, {
        ambient: (v.ambient ?? S.volBase.ambient),
        clear:   (v.clear   ?? S.volBase.clear),
        rain:    (v.rain    ?? S.volBase.rain),
        snow:    (v.snow    ?? S.volBase.snow),
        thunder: (v.thunder ?? S.volBase.thunder),
      });
      Weather.set(S.state, { intensity:S.intensity });
    },
    flashNow(){ if (S.state==="Rainstorm") { _flashLightning(); _scheduleLightningSoon(); } },
    isRaining(){ return S.state === "Rainstorm"; },
    update(){ /* no-op; driven by scene */ }
  };

  // ---------- START TRIGGER ----------
  window.addEventListener('pp:start', ()=>{
    const tryStart = () => {
      if (!window.scene) return setTimeout(tryStart, 100);
      ensureSounds();
      const r = Math.random();
      const next = (r < 0.5) ? "Clear" : (r < 0.8 ? "Rainstorm" : "Snow");
      Weather.set(next, { immediate:true, intensity: 0.85 });
      Weather.init();
      console.log("[Weather] started:", S.state);
    };
    tryStart();
  });
})();