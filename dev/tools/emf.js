// File: assets/dev/tools/emf.js
// EMF reader logic: emits readings based on ghost activity, hunt, and proximity
(function(){
  'use strict';
  if (window.__PP_EMF__) return; window.__PP_EMF__ = true;

  const PP = window.PP || (window.PP = {});
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioCtx();

  const EMF = {
    level: 0,
    maxLevel: 5,
    decayRate: 0.4, // per second
    active: false,
    beepTimers: [],
    position: ()=> PP.rig?.body?.position || {x:0,y:0,z:0},
    range: 4.0, // default EMF detection range
    lastSpikeTime: 0
  };

  function distance(pos1, pos2){
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
  }

  function beep(level){
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    // Map EMF 1–5 to low→high pitch
    const base = 220; // EMF1
    const step = 80;  // pitch increment
    osc.frequency.value = base + (level-1)*step;
    gain.gain.value = 0.25;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  function spike(level){
    EMF.level = Math.max(EMF.level, Math.min(level, EMF.maxLevel));
    beep(level);
    EMF.lastSpikeTime = performance.now();
  }

  function decay(dt){
    if (EMF.level>0){
      EMF.level -= EMF.decayRate * dt;
      if (EMF.level<0) EMF.level=0;
    }
  }

  function isNear(pos){
    return distance(pos, EMF.position()) <= EMF.range;
  }

  // ------- Ghost interaction triggers -------
  function handleGhostEvent(ev){
    const ghost = window.ghost || {};
    const readerOn = true; // we can check actual reader status if needed
    if (!readerOn) return;

    const ghostPos = ghost.position || {x:0,y:0,z:0};
    if (!isNear(ghostPos)) return;

    switch(ev.type){
      case 'throw':
      case 'book_write':
      case 'plate_interact':
      case 'cross_burn':
      case 'breaker':
      case 'salt':
        // Only ghosts in proximity trigger EMF
        spike(1 + Math.floor(Math.random()*5));
        break;
      case 'hunt':
        // Random EMF spike near player
        const huntRange = ghost.type==='Raiju'? 10:4;
        if (distance(ghostPos, EMF.position()) <= huntRange){
          spike(1 + Math.floor(Math.random()*5));
        }
        break;
      default:
        break;
    }
  }

  // ------- Hook ghost events -------
  const ghostEvents = [
    'pp:ghost:throw',       // payload: {item:'book'/'plate', ghost:ghost}
    'pp:ghost:book_write',  // payload: {ghost:ghost}
    'pp:ghost:plate',       // payload: {ghost:ghost}
    'pp:ghost:cross_burn',  // payload: {ghost:ghost}
    'pp:ghost:breaker',     // payload: {ghost:ghost}
    'pp:ghost:salt',        // payload: {ghost:ghost}
    'pp:ghost:hunt'         // payload: {ghost:ghost}
  ];

  ghostEvents.forEach(evt=>{
    window.addEventListener(evt, e=> handleGhostEvent({type:e.type.split(':').pop(), detail:e.detail}));
  });

  // ------- Tick decay -------
  let last = performance.now();
  function tick(){
    const now = performance.now();
    const dt = (now-last)/1000;
    last=now;
    decay(dt);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  window.EMF = EMF;
})();
