/**
 * Modular audio (HTMLAudio) — Weather-only ambience + Spirit Box (static loop + whisper)
 * Adds optional spatialization for the Spirit Box via a shared PannerNode.
 */
(function(){
  if (window.__PP_AUDIO__) return; window.__PP_AUDIO__ = true;

  const PP = window.PP || (window.PP = {});
  PP.audio = PP.audio || {};

  PP.audio.gain = { master:1.0, ambient:1.0, sfx:1.0, ui:1.0 };

  const A = PP.audio.tracks = {
    rain:      new Audio("./assets/audio/rainstorm.mp3"),
    clear:     new Audio("./assets/audio/clearWeather.mp3"),
    spiritbox: new Audio("./assets/audio/spiritbox.mp3"),
    whisper:   new Audio("./assets/audio/whisper.mp3"),
    doorCreak1:new Audio("./assets/audio/doorCreak1.mp3"),
    doorCreak2:new Audio("./assets/audio/doorCreak2.mp3"),
    slam1:     new Audio("./assets/audio/doorSlam1.mp3"),
    slam2:     new Audio("./assets/audio/doorSlam2.mp3"),
    ghostLaugh:new Audio("./assets/audio/ghostLaugh.mp3"),
    writing:   new Audio("./assets/audio/GhostWriting1.mp3"),
    steps: [
      new Audio("./assets/audio/step1.mp3"),
      new Audio("./assets/audio/step2.mp3"),
      new Audio("./assets/audio/step3.mp3")
    ]
  };

  // loop flags
  Object.values(A).forEach(v=>{
    if (Array.isArray(v)) v.forEach(x=>{ if ('loop' in x) x.loop=false; });
    else if ('loop' in v) v.loop=false;
  });
  A.rain.loop = true; A.clear.loop = true; A.spiritbox.loop = true;

  // utils
  function setVol(el, base, channel='sfx'){
    try {
      const g = PP.audio.gain;
      el.volume = Math.max(0, Math.min(1, base * (g.master||1) * (g[channel]||1)));
    } catch {}
  }
  function stop(el){ try{ el.pause(); el.currentTime=0; }catch{} }
  function play(el){ try{ el.play().catch(()=>{}); }catch{} }

  // weather
  let currentWeather = null;
  PP.audio.applyWeather = function(state){
    if (!state || currentWeather===state) return; currentWeather = state;
    stop(A.rain); stop(A.clear);
    switch(state){
      case "Clear":     setVol(A.clear, 0.30, 'ambient'); play(A.clear); break;
      case "Rain":
      case "Bloodmoon": setVol(A.rain,  0.55, 'ambient'); play(A.rain);  break;
      case "Snow":
      default: break; // silence
    }
  };

  PP.audio.playStep = function(volume=0.5){
    const s = A.steps[(Math.random()*A.steps.length)|0];
    try { s.currentTime=0; setVol(s, volume, 'sfx'); s.play().catch(()=>{});} catch {}
  };

  // ---- Spirit Box graph (adds optional shared panner) ----
  let ctx=null, srcStatic=null, srcWhisper=null, gStatic=null, gWhisper=null, biq=null, pan=null;
  const _duckTimers = { up:null, hold:null, down:null };

  function ensureGraph(){
    if (ctx) return true;
    try{
      ctx = new (window.AudioContext||window.webkitAudioContext)();

      srcStatic  = ctx.createMediaElementSource(A.spiritbox);
      srcWhisper = ctx.createMediaElementSource(A.whisper);

      gStatic  = ctx.createGain();   gStatic.gain.value = 1.0;
      gWhisper = ctx.createGain();   gWhisper.gain.value = 0.0;

      biq = ctx.createBiquadFilter(); biq.type='bandpass'; biq.frequency.value=1200; biq.Q.value=1.2;

      // Shared panner (initially bypassed to stereo)
      pan = ctx.createPanner();
      pan.panningModel = 'inverse';
      pan.distanceModel = 'inverse';
      pan.rolloffFactor = 1.0;
      pan.refDistance   = 2.0;
      pan.maxDistance   = 40.0;
      pan.coneInnerAngle = 360;
      pan.coneOuterAngle = 360;
      pan.coneOuterGain  = 0.6;
      try { pan.positionZ.setValueAtTime(0, ctx.currentTime); }catch{}

      // default route: gains → panner → destination
      srcStatic.connect(gStatic).connect(pan).connect(ctx.destination);
      srcWhisper.connect(biq).connect(gWhisper).connect(pan);

      return true;
    }catch(e){ console.warn('[audio] WebAudio unavailable; using HTMLAudio fallback', e); return false; }
  }
  function _clearFallbackTimers(){
    if (_duckTimers.up)   { clearInterval(_duckTimers.up);   _duckTimers.up=null; }
    if (_duckTimers.down) { clearInterval(_duckTimers.down); _duckTimers.down=null; }
    if (_duckTimers.hold) { clearTimeout(_duckTimers.hold);  _duckTimers.hold=null; }
  }

  PP.audio.spiritBox = {
    power(on){
      if (on){
        setVol(A.spiritbox, 0.55, 'sfx');
        try { A.spiritbox.play().catch(()=>{}); } catch {}
        if (ctx && ctx.state==='suspended') ctx.resume().catch(()=>{});
        return;
      }
      _clearFallbackTimers();
      try { A.whisper.pause(); A.whisper.currentTime=0; }catch{}
      try { A.spiritbox.pause(); A.spiritbox.currentTime=0; }catch{}
      try { A.spiritbox.volume = 0; } catch {}
      if (ctx){
        const now = ctx.currentTime||0;
        try{
          gStatic?.gain.cancelScheduledValues(now);  gStatic && (gStatic.gain.value=1.0);
          gWhisper?.gain.cancelScheduledValues(now); gWhisper && (gWhisper.gain.value=0.0);
        }catch{}
      }
    },

    ghostSpeak(opts={}){
      const {
        gain=0.9, duck=0.65, attack=0.05, hold=0.8, release=0.35,
        pitchMin=0.92, pitchMax=1.08, centerHz=1200, Q=1.2
      } = opts;

      const ok = ensureGraph();
      const rate = pitchMin + Math.random()*(pitchMax-pitchMin);
      try { A.whisper.playbackRate = rate; A.whisper.currentTime=0; } catch {}
      setVol(A.whisper, 0.85, 'sfx');
      try { A.whisper.play().catch(()=>{}); } catch {}

      if (!ok){
        _clearFallbackTimers();
        const prev=A.spiritbox.volume, target=prev*duck, steps=6, stepMs=(attack*1000)/steps;
        let i=0;
        _duckTimers.up = setInterval(()=>{
          i++; try{ A.spiritbox.volume = prev - (prev-target)*(i/steps);}catch{}
          if (i>=steps){ clearInterval(_duckTimers.up); _duckTimers.up=null;
            _duckTimers.hold = setTimeout(()=>{
              let j=steps;
              _duckTimers.down = setInterval(()=>{
                j--; try{ A.spiritbox.volume = prev - (prev-target)*(j/steps);}catch{}
                if (j<=0){ clearInterval(_duckTimers.down); _duckTimers.down=null; try{ A.spiritbox.volume=prev; }catch{} }
              }, (release*1000)/steps);
            }, hold*1000);
          }
        }, stepMs);
        return;
      }

      try {
        if (biq){ biq.frequency.setTargetAtTime(centerHz, ctx.currentTime, 0.01); biq.Q.setTargetAtTime(Q, ctx.currentTime, 0.01); }
        const now = ctx.currentTime, end = now + attack + hold + release;
        const s0 = gStatic.gain.value;
        gStatic.gain.cancelScheduledValues(now);
        gStatic.gain.setValueAtTime(s0, now);
        gStatic.gain.linearRampToValueAtTime(s0*duck, now+attack);
        gStatic.gain.setValueAtTime(s0*duck, now+attack+hold);
        gStatic.gain.linearRampToValueAtTime(s0, end);

        gWhisper.gain.cancelScheduledValues(now);
        gWhisper.gain.setValueAtTime(0.0, now);
        gWhisper.gain.linearRampToValueAtTime(gain, now+attack);
        gWhisper.gain.setValueAtTime(gain, now+attack+hold);
        gWhisper.gain.linearRampToValueAtTime(0.0, end);
      } catch {}
    },

    // ---- NEW: spatial controls (shared for the single box) ----
    enableSpatial(on=true){
      if (!ensureGraph()) return;
      // Nothing to rewire; panner is always in path. Just a semantic toggle via refDistance/rolloff.
      try {
        pan.refDistance = on ? 2.0 : 1e6; // huge refDistance ≈ no attenuation (2D)
        pan.rolloffFactor = on ? 1.0 : 0.0;
      } catch {}
    },
    setWorldPosition(x=0,y=0,z=0){
      if (!ensureGraph()) return;
      try {
        (pan.positionX||pan.setPosition).call(pan, x, y, z);
      } catch {
        try { pan.setPosition(x,y,z); } catch {}
      }
    },
    setListener(x,y,z, fx,fy,fz, ux,uy,uz){
      if (!ensureGraph()) return;
      const L = ctx.listener;
      try {
        (L.positionX||L.setPosition).call(L, x,y,z);
        (L.forwardX||L.setOrientation).call(L, fx,fy,fz, ux,uy,uz);
      } catch {
        try { L.setPosition(x,y,z); L.setOrientation(fx,fy,fz, ux,uy,uz); } catch {}
      }
    }
  };

  PP.audio.play = {
    spiritboxOn:  () => PP.audio.spiritBox.power(true),
    spiritboxOff: () => PP.audio.spiritBox.power(false),
    whisper:      () => PP.audio.spiritBox.ghostSpeak(),
    doorCreak: () => { const x=Math.random()<0.5?A.doorCreak1:A.doorCreak2; setVol(x,0.7,'sfx'); play(x); },
    slam:      () => { const x=Math.random()<0.5?A.slam1:A.slam2; setVol(x,0.85,'sfx'); play(x); },
    ghostLaugh:() => { setVol(A.ghostLaugh,0.75,'sfx'); play(A.ghostLaugh); },
    writing:   () => { setVol(A.writing,0.8,'sfx'); play(A.writing); }
  };

  PP.audio.init = function(initialWeather){
    Object.values(A).forEach(v=>{
      if (Array.isArray(v)) v.forEach(x=>{ try{ x.muted=true; x.play().then(()=>x.pause()).catch(()=>{});}catch{} });
      else { try{ v.muted=true; v.play().then(()=>v.pause()).catch(()=>{});}catch{} }
    });
    setTimeout(()=>{
      Object.values(A).forEach(v=>{
        if (Array.isArray(v)) v.forEach(x=>{ try{ x.muted=false; }catch{} });
        else { try{ v.muted=false; }catch{} }
      });
      ensureGraph();
      PP.audio.applyWeather(initialWeather || (window.weather&&window.weather.state) || 'Clear');
    }, 50);
  };

  (function pollWeather(){
    const ws = (window.weather && window.weather.state);
    if (ws && ws !== currentWeather) PP.audio.applyWeather(ws);
    setTimeout(pollWeather, 1000);
  })();

  PP.audio.setGains = g => Object.assign(PP.audio.gain, g||{});
  PP.audio.stopAll = function(){
    try{
      Object.values(A).forEach(v=>{ if(Array.isArray(v)) v.forEach(stop); else stop(v); });
      PP.audio.spiritBox.power(false);
    }catch{}
  };
})();
