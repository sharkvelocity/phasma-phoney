// ./assets/dev/util/env_and_sound.js — unified weather, particles, and audio
(function(){
  "use strict";

  window.PP = window.PP || {};
  PP.audio = PP.audio || {};

  const clamp = (v,a,b)=> Math.max(a, Math.min(b,v));
  const lerp = (a,b,t)=> a + (b-a)*Math.max(0,Math.min(1,t));
  const v3 = (x,y,z)=> new BABYLON.Vector3(x,y,z);

  function S(){ return window.SCENE || BABYLON.Engine?.LastCreatedScene || null; }
  function cam(){ const s=S(); return s?.activeCamera || window.camera || null; }

  // ────── Env / Weather State ──────
  const ST = {
    state: "Clear",
    intensity:1.0,
    indoor:false,
    started:false,
    lastT:performance.now()/1000,
    nextLightningAt:Infinity,
    sounds:{ ambient:null, rain:null, snow:null, thunder:[] },
    volBase:{ ambient:0.7, rain:0.65, snow:0.5, thunder:0.9 },
    volTarget:{ ambient:0, rain:0, snow:0 },
    volNow:{ ambient:0, rain:0, snow:0 },
    _loopCB:null,
    _rainPS:null,
    _snowPS:null,
    _flashLight:null,
    _glowLayer:null,
    _indoorLast:null,
    _indoorAcc:0,
    _indoorPeriod:0.5
  };

  // ────── Audio Init (after user gesture) ──────
  function initAudio(){
    if(ST.started) return;
    const s=S(); if(!s) return;

    // Ambient & weather sounds
    ST.sounds.ambient = new BABYLON.Sound("amb","./assets/audio/ambient.mp3",s,null,{ loop:true, autoplay:false, volume:ST.volBase.ambient, spatialSound:false });
    ST.sounds.rain = new BABYLON.Sound("rain","./assets/audio/rainstorm.mp3",s,null,{ loop:true, autoplay:false, volume:ST.volBase.rain, spatialSound:false });
    ST.sounds.snow = new BABYLON.Sound("snow","./assets/audio/snow.mp3",s,null,{ loop:true, autoplay:false, volume:ST.volBase.snow, spatialSound:false });

    const thunderFiles = ["thunder_loud.mp3","thunder_rumble.mp3","thunder.mp3"];
    ST.sounds.thunder = thunderFiles.map((f,i)=> new BABYLON.Sound("th"+i,"./assets/audio/"+f,s,null,{ loop:false, autoplay:false, volume:ST.volBase.thunder, spatialSound:false }));

    ST.started=true;
  }

  // ────── Particles ──────
  function disposeParticles(){ 
    try{ ST._rainPS?.dispose(); }catch{} 
    try{ ST._snowPS?.dispose(); }catch{} 
    ST._rainPS=null; ST._snowPS=null; 
  }

  function spawnRainParticles(tint=new BABYLON.Color3(0.5,0.5,1)){
    const s=S(); if(!s) return; disposeParticles();
    const ps = new BABYLON.ParticleSystem("rainPS",5000,s);
    ps.particleTexture = new BABYLON.Texture("assets/particles/raindrop.png",s);
    ps.emitter=v3(0,20,0); ps.minEmitBox=v3(-50,0,-50); ps.maxEmitBox=v3(50,0,50);
    ps.color1=ps.color2=new BABYLON.Color4(tint.r,tint.g,tint.b,0.7);
    ps.minSize=0.1; ps.maxSize=0.2; ps.minLifeTime=0.3; ps.maxLifeTime=0.5;
    ps.emitRate=1500; ps.gravity=v3(0,-30,0); ps.direction1=v3(0,-1,0); ps.direction2=v3(0,-1,0);
    ps.start(); ST._rainPS=ps;
  }

  function spawnSnowParticles(){
    const s=S(); if(!s) return; disposeParticles();
    const ps = new BABYLON.ParticleSystem("snowPS",3000,s);
    ps.particleTexture = new BABYLON.Texture("assets/particles/snowflake.png",s);
    ps.emitter=v3(0,20,0); ps.minEmitBox=v3(-50,0,-50); ps.maxEmitBox=v3(50,0,50);
    ps.color1=ps.color2=new BABYLON.Color4(1,1,1,0.8);
    ps.minSize=0.2; ps.maxSize=0.4; ps.minLifeTime=3; ps.maxLifeTime=5;
    ps.emitRate=800; ps.gravity=v3(0,-1,0); ps.direction1=v3(-0.5,-1,-0.5); ps.direction2=v3(0.5,-1,0.5);
    ps.start(); ST._snowPS=ps;
  }

  // ────── Lightning / Bloodmoon ──────
  function flashBloodmoon(){
    const s=S(); if(!s) return;
    const c=cam(); if(!c?.position) return;

    if(!ST._glowLayer){
      ST._glowLayer=new BABYLON.GlowLayer("bloodmoonGlow",s,{intensity:0.25});
      ST._glowLayer.blurKernelSize=64;
      ST._glowLayer.customEmissiveColorSelector=(m,sb,mat,res)=>res.set(0.8,0.1,0.1,1);
    }

    if(!ST._flashLight || ST._flashLight.isDisposed()){
      ST._flashLight=new BABYLON.PointLight("blood_flash",c.position.add(v3(0,10,0)),s);
      ST._flashLight.range=250;
      ST._flashLight.diffuse=new BABYLON.Color3(0.8,0.1,0.1);
      ST._flashLight.specular=ST._flashLight.diffuse;
      ST._flashLight.intensity=0;
    }

    let pulses = 1 + (Math.random()<0.4?1:0), i=0;
    const doPulse=()=>{
      if(i++>=pulses) return;
      const dir=v3(Math.random()-0.5,0,Math.random()-0.5).normalize().scale(80+Math.random()*40);
      ST._flashLight.position=c.position.add(dir).add(v3(0,12+Math.random()*8,0));
      ST._flashLight.intensity=0.6 + Math.random()*0.4;
      setTimeout(()=>{ if(ST._flashLight) ST._flashLight.intensity=0; },120 + Math.random()*80);
      if(i<pulses) setTimeout(doPulse,100 + Math.random()*140);
    };
    doPulse();
  }

  function scheduleLightning(){ ST.nextLightningAt = performance.now()/1000 + (18+Math.random()*24)*(0.85+Math.random()*0.3); }

  // ────── Audio Helpers ──────
  function playThunder(){
    if(!ST.sounds.thunder?.length) return;
    const pick=Math.random();
    const snd = pick<0.2?ST.sounds.thunder[0]:pick<0.7?ST.sounds.thunder[1]:ST.sounds.thunder[2];
    try{ snd.setVolume(clamp(ST.volBase.thunder*(ST.indoor?0.35:1)*(0.75+Math.random()*0.35),0,1)); snd.play(); }catch{}
  }

  // ────── Indoor detection ──────
  function isIndoorAt(pos){
    const s=S(); if(!s||!pos) return false;
    try{
      const V=window.PP?.CONFIG?.VAN;
      if(V && V.POSITION && typeof V.RADIUS==='number') 
        if(BABYLON.Vector3.Distance(pos,V.POSITION)<=(V.RADIUS+1)) return false;
    }catch{}
    const from=v3(pos.x,pos.y+0.5,pos.z);
    const ray=new BABYLON.Ray(from,v3(0,1,0),12);
    const hit = s.pickWithRay(ray,m=>{
      if(!m) return false;
      if(m.isPickable===false) return false;
      if(m.metadata?.isRoof || m.metadata?.isCeiling) return true;
      return /roof|ceiling|attic|upper|secondfloor/.test((m.name||'').toLowerCase());
    });
    return !!(hit && hit.hit);
  }

  function indoorMonitor(dt){
    ST._indoorAcc+=dt;
    if(ST._indoorAcc<ST._indoorPeriod) return;
    ST._indoorAcc=0;
    const c=cam(); if(!c?.position) return;
    const inHouse=isIndoorAt(c.position);
    if(inHouse!==ST._indoorLast){ ST._indoorLast=inHouse; ST.indoor=inHouse; setWeather(ST.state,{intensity:ST.intensity,immediate:true}); }
  }

  function applyVolumes(dt){
    if(!ST.started) return;
    const k=clamp(dt*1.5,0,1); const muffle=ST.indoor?0.35:1;
    ST.volNow.ambient=lerp(ST.volNow.ambient,ST.volTarget.ambient,k);
    ST.volNow.rain   =lerp(ST.volNow.rain,ST.volTarget.rain*ST.intensity*muffle,k);
    ST.volNow.snow   =lerp(ST.volNow.snow,ST.volTarget.snow*ST.intensity*muffle,k);

    try{ ST.sounds.ambient?.setVolume(ST.volNow.ambient); }catch{}
    try{ ST.sounds.rain?.setVolume(ST.volNow.rain); }catch{}
    try{ ST.sounds.snow?.setVolume(ST.volNow.snow); }catch{}
  }

  // ────── Tick Loop ──────
  function tick(){
    const now=performance.now()/1000, dt=Math.min(0.2,now-ST.lastT); ST.lastT=now;

    if(ST.state==="Bloodmoon" && now>=ST.nextLightningAt){ flashBloodmoon(); scheduleLightning(); }
    indoorMonitor(dt);
    applyVolumes(dt);

    // Random thunder for Rainstorm
    if(ST.state==="Rainstorm" && Math.random()<0.002) playThunder();

    const hw=document.getElementById('hud-weather');
    if(hw) hw.textContent=ST.state+(ST.indoor?" (Indoor)":"");
  }

  function hookLoop(){
    const s=S(); if(!s||ST._loopCB) return;
    ST._loopCB=tick; s.onBeforeRenderObservable.add(ST._loopCB);
  }

  // ────── Weather / Env API ──────
  function setWeather(state, opts={}){
    if(!/^(Clear|Rainstorm|Bloodmoon|Snow)$/.test(state)) return;
    ST.state=state;
    if(typeof opts.intensity==='number') ST.intensity=clamp(opts.intensity,0,1);
    disposeParticles();

    if(state==="Clear"){ ST.volTarget={ambient:ST.volBase.ambient,rain:0,snow:0}; ST.nextLightningAt=Infinity; }
    else if(state==="Rainstorm"){ ST.volTarget={ambient:0,rain:ST.volBase.rain,snow:0}; ST.nextLightningAt=Infinity; spawnRainParticles(); }
    else if(state==="Bloodmoon"){ ST.volTarget={ambient:0,rain:ST.volBase.rain,snow:0}; scheduleLightning(); spawnRainParticles(); }
    else{ ST.volTarget={ambient:0,rain:0,snow:ST.volBase.snow}; ST.nextLightningAt=Infinity; spawnSnowParticles(); }

    if(opts.immediate){
      const muffle=ST.indoor?0.35:1;
      ST.volNow.ambient=ST.volTarget.ambient;
      ST.volNow.rain=ST.volTarget.rain*ST.intensity*muffle;
      ST.volNow.snow=ST.volTarget.snow*ST.intensity*muffle;
      try{ ST.sounds.ambient?.setVolume(ST.volNow.ambient); }catch{}
      try{ ST.sounds.rain?.setVolume(ST.volNow.rain); }catch{}
      try{ ST.sounds.snow?.setVolume(ST.volNow.snow); }catch{}
    }
  }

  function cycleWeather(){
    const next = ST.state==="Clear" ? "Rainstorm" :
                 ST.state==="Rainstorm" ? "Snow" :
                 ST.state==="Snow" ? "Bloodmoon" :
                 "Clear";
    setWeather(next,{ intensity: next==="Clear"?undefined:(0.5+Math.random()*0.5) });
  }

  // ────── First Interaction Boot ──────
  function firstInteractionBootWrapper(){
    firstInteractionBoot(()=>{
      initAudio();
      setWeather(ST.state,{immediate:true});
      hookLoop();
      console.log("[EnvAndSound] Audio & Weather initialized after Start button");
    });
  }

  // ────── Expose API ──────
  window.EnvAndSound = {
    ST,
    initAudio,
    firstInteractionBoot:firstInteractionBootWrapper,
    setWeather,
    cycleWeather,
    tick
  };

})();
