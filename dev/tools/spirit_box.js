// assets/dev/tools/spirit_box.js
// Spirit Box tool: positional static loop + whisper overlays, proper Web Audio panner.
// - Toggle in-hand by equip (your UI decides) OR look-at + "E" for dropped units.
// - Keeps playing when dropped; turns off when you switch items.
// - Distance-based fade with HRTF; inverse distance model;
// - Multiple units supported.

(function(){
  "use strict";
  if (window.__PP_SPIRITBOX__) return; window.__PP_SPIRITBOX__ = true;

  const PP   = (window.PP = window.PP || {});
  const TWO_PI = Math.PI * 2;

  // ---------- Config ----------
  const AUDIO_URLS = {
    static:  "./assets/audio/spiritbox.mp3",   // looping bed
    whisper: "./assets/audio/whisper.mp3"      // one-shots laid over static
  };

  // Panner tuning (Web Audio)
  const PANNER_OPTS = {
    panningModel:  "HRTF",       // ✅ valid: "HRTF" | "equalpower"
    distanceModel: "inverse",    // ✅ valid: "linear" | "inverse" | "exponential"
    refDistance:   2.0,
    rolloffFactor: 1.0,
    maxDistance:   40.0,
    coneInnerAngle: 360,
    coneOuterAngle: 360,
    coneOuterGain:  0.7
  };

  // Whisper cadence (only when ON; you can also trigger via pp:ghost:spirit-speak)
  const WHISPER = {
    minGapSec: 10,   // min seconds between whispers
    maxGapSec: 22,   // max seconds between whispers
  };

  // ---------- Audio graph ----------
  let AC = null;     // AudioContext
  let master = null; // GainNode (SFX bus)
  function ensureAudio(){
    if (AC) return;
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain();
    master.gain.value = (PP.audio?.gain?.sfx ?? 1.0) * (PP.audio?.gain?.master ?? 1.0);
    master.connect(AC.destination);

    // Track gain changes from your modular audio
    window.addEventListener('pp:audio:gain-changed', ()=>{
      try {
        master.gain.value = (PP.audio?.gain?.sfx ?? 1.0) * (PP.audio?.gain?.master ?? 1.0);
      } catch {}
    });
  }

  function createUnitAudio(){
    ensureAudio();

    // Static loop element -> MediaElementSource -> Panner -> Master
    const elStatic = new Audio(AUDIO_URLS.static);
    elStatic.loop = true;
    elStatic.preload = "auto";

    const srcStatic = AC.createMediaElementSource(elStatic);
    const panner    = AC.createPanner();
    const gUnit     = AC.createGain(); // per-unit volume gate

    // Apply panner defaults (correct enums)
    panner.panningModel  = PANNER_OPTS.panningModel;
    panner.distanceModel = PANNER_OPTS.distanceModel;
    panner.refDistance   = PANNER_OPTS.refDistance;
    panner.rolloffFactor = PANNER_OPTS.rolloffFactor;
    panner.maxDistance   = PANNER_OPTS.maxDistance;
    panner.coneInnerAngle = PANNER_OPTS.coneInnerAngle;
    panner.coneOuterAngle = PANNER_OPTS.coneOuterAngle;
    panner.coneOuterGain  = PANNER_OPTS.coneOuterGain;

    srcStatic.connect(panner);
    panner.connect(gUnit);
    gUnit.connect(master);

    // Whisper one-shot element and source (created on demand)
    const elWhisper = new Audio(AUDIO_URLS.whisper);
    elWhisper.loop = false;
    const srcWhisper = AC.createMediaElementSource(elWhisper);
    const gWhisper   = AC.createGain();
    gWhisper.gain.value = 0.95;

    srcWhisper.connect(panner); // share panner/position
    // (panner -> gUnit -> master already connected)

    return { elStatic, elWhisper, panner, gUnit };
  }

  // ---------- World helpers ----------
  function scene(){ return window.SCENE || window.scene || BABYLON.Engine?.LastCreatedScene || null; }
  function cam(){ const s=scene(); return s && (s.activeCamera || window.camera); }
  function v3(x,y,z){ return new BABYLON.Vector3(x,y,z); }

  // Ray from camera forward to interact with dropped units
  function rayFromCam(dist=4){
    const c = cam(); const s = scene(); if (!c || !s) return null;
    const origin = c.globalPosition ? c.globalPosition.clone() : c.position.clone();
    const dir    = c.getForwardRay(dist).direction;
    return new BABYLON.Ray(origin, dir, dist);
  }

  // ---------- Spirit Box Unit ----------
  class SpiritBoxUnit {
    constructor(meshOrGetter){
      this.getPos = () => {
        try{
          if (typeof meshOrGetter === 'function') return meshOrGetter();
          const m = meshOrGetter;
          return m?.getAbsolutePosition?.() || m?.position || null;
        }catch{ return null; }
      };

      const a = createUnitAudio();
      this.elStatic  = a.elStatic;
      this.elWhisper = a.elWhisper;
      this.panner    = a.panner;
      this.gUnit     = a.gUnit;

      this.on = false;
      this.nextWhisperAt = 0;

      // Initial position
      const p = this.getPos() || v3(0,0,0);
      this.panner.setPosition(p.x, p.y, p.z);
    }

    setOn(on){
      this.on = !!on;
      if (!AC) ensureAudio();
      if (this.on){
        // resume context in case of tab suspension
        AC.resume?.().catch(()=>{});
        try { this.elStatic.play().catch(()=>{}); } catch {}
        this.scheduleNextWhisper();
      } else {
        try { this.elStatic.pause(); } catch {}
        this.elStatic.currentTime = 0;
        // Do not stop whisper mid-play; just let it finish
      }
    }

    toggle(){ this.setOn(!this.on); }

    scheduleNextWhisper(){
      const now = AC.currentTime || (performance.now()/1000);
      const d = WHISPER.minGapSec + Math.random()*(WHISPER.maxGapSec-WHISPER.minGapSec);
      this.nextWhisperAt = now + d;
    }

    playWhisper(){
      try {
        this.elWhisper.currentTime = 0;
        this.elWhisper.play().catch(()=>{});
      } catch {}
      this.scheduleNextWhisper();
    }

    // Call every frame
    tick(dt){
      const p = this.getPos();
      if (p){
        try { this.panner.setPosition(p.x, p.y, p.z); } catch {}
      }
      if (this.on){
        const now = AC.currentTime || (performance.now()/1000);
        if (now >= this.nextWhisperAt){
          this.playWhisper();
        }
      }
    }

    stopAll(){
      try{ this.elStatic.pause(); this.elStatic.currentTime=0; }catch{}
      try{ this.elWhisper.pause(); this.elWhisper.currentTime=0; }catch{}
      this.on = false;
    }
  }

  // ---------- Manager ----------
  const M = {
    units: new Set(),     // all world/in-hand instances
    inHand: null,         // the one following the player when equipped
    loopAttached: false
  };

  function attachLoop(){
    if (M.loopAttached) return;
    const s = scene(); if (!s) return;
    s.onBeforeRenderObservable.add(()=>{
      const eng = s.getEngine?.() || window.ENGINE;
      const dt  = Math.min(0.1, ((eng?.getDeltaTime?.()||16.7)/1000));
      M.units.forEach(u => u.tick(dt));
      // If equipped, keep in-hand unit at player head
      if (M.inHand){
        try{
          const b = s.__playerBody || s.getMeshByName?.('player_capsule') || cam();
          const p = b?.getAbsolutePosition?.() || b?.position;
          if (p) M.inHand.panner.setPosition(p.x, p.y + 1.6, p.z);
        }catch{}
      }
    });
    M.loopAttached = true;
  }

  // Create/attach a dropped unit for a given mesh
  function ensureUnitForMesh(mesh){
    for (const u of M.units){
      if (u.__mesh === mesh) return u;
    }
    const unit = new SpiritBoxUnit(mesh);
    unit.__mesh = mesh;
    M.units.add(unit);
    attachLoop();
    return unit;
  }

  // Create/attach an in-hand unit that tracks the player/head
  function ensureInHand(){
    if (M.inHand) return M.inHand;
    const unit = new SpiritBoxUnit(()=> {
      const s=scene(); const b=s?.__playerBody || s?.getMeshByName?.('player_capsule') || cam();
      const p=b?.getAbsolutePosition?.() || b?.position || v3(0,0,0);
      return new BABYLON.Vector3(p.x, p.y + 1.6, p.z);
    });
    M.inHand = unit;
    M.units.add(unit);
    attachLoop();
    return unit;
  }

  // ---------- Public API ----------
  PP.spiritBox = {
    // Equip/unequip from belt
    setEquipped(on){
      if (on){
        const u = ensureInHand();
        u.setOn(true);
      } else if (M.inHand){
        // Switching items should turn it OFF (per your spec)
        M.inHand.setOn(false);
      }
    },

    // Called when you place the device in the world (pass the created mesh)
    onPlaced(mesh){
      if (!mesh) return;
      mesh.metadata = mesh.metadata || {};
      mesh.metadata.type = 'spirit_box';
      const u = ensureUnitForMesh(mesh);
      // If it was in-hand and ON when dropped, keep it playing
      if (M.inHand && M.inHand.on){ u.setOn(true); }
      attachLoop();
    },

    // Toggle nearest dropped spirit box by looking at it and pressing E
    toggleLookedAt(){
      const s=scene(); const r=rayFromCam(4); if (!s || !r) return false;
      const hit = s.pickWithRay(r, m=> !!(m?.metadata?.type==='spirit_box'));
      if (hit?.pickedMesh){
        const u = ensureUnitForMesh(hit.pickedMesh);
        u.toggle();
        return true;
      }
      return false;
    },

    // External trigger from ghost logic to force a whisper on closest ON unit
    ghostSpeak(){
      let target=null, minD=1e9;
      const cpos = cam()?.globalPosition || cam()?.position;
      if (!cpos) return;
      M.units.forEach(u=>{
        if (!u.on) return;
        const p = u.getPos(); if (!p) return;
        const d = BABYLON.Vector3.Distance(p, cpos);
        if (d < minD){ minD=d; target=u; }
      });
      target?.playWhisper();
    },

    // Safety stop (e.g., on game end)
    stopAll(){ M.units.forEach(u=>u.stopAll()); }
  };

  // ---------- Event wiring ----------
  // Start: ensure AudioContext is unlocked
  window.addEventListener('pp:start', ()=>{
    try{ ensureAudio(); AC.resume?.(); }catch{}
  });

  // Switch away from spirit box => turn OFF in-hand unit
  window.addEventListener('pp:active-item-changed', (ev)=>{
    const id = ev.detail?.id;
    if (id !== 'spirit_box' && M.inHand){
      M.inHand.setOn(false);
    }
  });

  // When a device mesh is spawned/placed by your tool pipeline
  // Call PP.spiritBox.onPlaced(mesh) from your placement code.
  // (kept here for reference)

  // Look-at + "E" toggles a dropped unit
  addEventListener('keydown', (e)=>{
    if (e.code === 'KeyE'){
      if (PP.spiritBox.toggleLookedAt()) e.preventDefault();
    }
  }, true);

  // Ghost can ask for a whisper explicitly
  window.addEventListener('pp:ghost:spirit-speak', ()=> PP.spiritBox.ghostSpeak());

})();
