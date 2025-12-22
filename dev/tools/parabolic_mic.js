// ./assets/dev/tools/parabolic_mic.js
// Parabolic microphone: while equipped/active, boost spatial sounds in a cone by +30%.
(function(){
  "use strict";
  window.PP = window.PP || {};
  PP.tools = PP.tools || {};
  PP.tools.parabolic = PP.tools.parabolic || {};

  const CFG = {
    CONE_DEG: 16,       // half-angle of the beam
    RANGE: 30,          // meters
    BOOST: 1.30,        // +30%
    TICK_MS: 120
  };

  const S = {
    scn: null,
    timer: null,
    active: false,
    // cache original volumes so we can restore
    orig: new WeakMap()
  };

  function scene(){ return window.SCENE || BABYLON.Engine?.LastCreatedScene || null; }

  function inCone(origin, forward, p, deg){
    const dir = p.subtract(origin).normalize();
    const cos = BABYLON.Vector3.Dot(forward.normalize(), dir);
    const cosTheta = Math.cos(BABYLON.Angle.FromDegrees(deg).radians());
    const dist = BABYLON.Vector3.Distance(origin, p);
    return (cos >= cosTheta) && (dist <= CFG.RANGE);
  }

  function tick(){
    if (!S.active || !S.scn) return;

    // Define beam from active camera (or held mic emitter if you prefer)
    const cam = S.scn.activeCamera || window.camera;
    if (!cam) return;
    const origin = cam.globalPosition || cam.position;
    const forward = cam.getDirection ? cam.getDirection(BABYLON.Vector3.Forward()) : new BABYLON.Vector3(0,0,1);

    const sounds = S.scn.soundTracks?.flatMap(t=> t.soundCollection || []) || S.scn.mainSoundTrack?.soundCollection || [];
    if (!Array.isArray(sounds)) return;

    // First, restore everything
    for (const snd of sounds){
      if (!snd) continue;
      const base = S.orig.get(snd);
      if (typeof base === 'number'){
        try{ snd.setVolume(base); }catch{}
      }
    }

    // Then, boost those in cone with attached nodes
    for (const snd of sounds){
      if (!snd || !snd.spatialSound) continue;
      const n = snd.connectedTransformNode || snd._connectedTransformNode || null;
      const p = n?.getAbsolutePosition?.() || n?.position || null;
      if (!p) continue;

      // Save original if not cached
      if (!S.orig.has(snd)){
        try { S.orig.set(snd, snd.getVolume()); } catch { S.orig.set(snd, 1.0); }
      }

      if (inCone(origin, forward, p, CFG.CONE_DEG)){
        const base = S.orig.get(snd) || 1.0;
        try { snd.setVolume(Math.min(1.0, base * CFG.BOOST)); } catch {}
      }
    }
  }

  function enable(on){
    S.active = !!on;
    if (S.active){
      if (!S.scn) S.scn = scene();
      if (!S.timer) S.timer = setInterval(tick, CFG.TICK_MS);
    } else {
      if (S.timer) { clearInterval(S.timer); S.timer = null; }
      // restore volumes
      const s = S.scn;
      const sounds = s?.soundTracks?.flatMap(t=> t.soundCollection || []) || s?.mainSoundTrack?.soundCollection || [];
      if (Array.isArray(sounds)){
        for (const snd of sounds){
          const base = S.orig.get(snd);
          if (typeof base === 'number'){
            try{ snd.setVolume(base); }catch{}
          }
        }
      }
      S.orig = new WeakMap();
    }
  }

  PP.tools.parabolic.enable = enable;
})();