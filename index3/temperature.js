// ./assets/index3/temperature.js — v1.0
// Ambient temperature model + left-pinned thermometer UI.
// Shows only when the "Thermometer" item is equipped.
// Integrates with Weather (Clear/Rainstorm/Snow), indoor muffling, and ghost cold spots.
//
// Works out of the box. For best results, emit this custom event when active item changes:
//   document.dispatchEvent(new CustomEvent('active-item-changed', { detail:{ name:'Thermometer' } }));
// or call:  Thermometer.setEquipped(true/false)
//
// Optional overrides BEFORE this script:
//   window.THERMOMETER_IMAGE_URL = './assets/images/thermometer.png';   // PNG you like
//   window.THERMOMETER_RANGE_C = { min:-20, max:40 };                   // scale for column
//   window.THERMOMETER_GHOST_COOL = { radius:5, delta:10 };             // °C drop @ center

(function(){
  "use strict";

  // -------- helpers --------
  const SCENE  = ()=> window.scene || BABYLON.Engine?.LastCreatedScene;
  const CAMERA = ()=> window.camera || SCENE()?.activeCamera;
  const clamp  = (v,a,b)=> Math.max(a, Math.min(b,v));
  const lerp   = (a,b,t)=> a + (b-a)*clamp(t,0,1);
  const v3     = (x,y,z)=> new BABYLON.Vector3(x,y,z);

  // -------- config (tweak here or via globals) --------
  const CFG = {
    // display
    img: window.THERMOMETER_IMAGE_URL || './assets/images/thermometer.png',
    rangeC: Object.assign({ min:-20, max:40 }, window.THERMOMETER_RANGE_C||{}),
    // ambient baselines by Weather.state
    ambientC: { Clear: 20, Rainstorm: 14, Snow: -2 },
    indoorBias: 3.5,          // warmer indoors
    jitterAmp: 0.25,          // small +/- noise
    jitterSpeed: 0.65,        // Hz
    // ghost cold spot
    ghostCool: Object.assign({ radius:5, delta:10 }, window.THERMOMETER_GHOST_COOL||{}), // up to -10°C within 0m, fades by 5m
    // update rate (UI)
    smooth: 0.15,             // lerp factor per frame for the readout/column
  };

  const ST = {
    equipped: false,
    celsius: 20,
    displayC: 20,    // smoothed for UI
    lastT: performance.now()/1000,
    uiBuilt: false,
    ui: null,
  };

  // ============ PUBLIC API ============
  const API = {
    // read current celsius at camera (or position)
    getCelsiusAt,
    isFreezingAt:(pos)=> getCelsiusAt(pos) <= 0,
    getAmbientC: ()=> estimateAmbientC(),
    // equip control (if your inventory can’t send the event)
    setEquipped:(on)=> setEquipped(!!on),
    toggle:()=> setEquipped(!ST.equipped),
    // internal state (debug)
    _state: ST
  };
  window.Thermometer = API;

  // Listen for "active item changed" coming from your items system (recommended)
  document.addEventListener('active-item-changed', (e)=>{
    const name = (e?.detail?.name||'').toLowerCase();
    setEquipped( name==='thermometer' || name==='temp' || name==='thermo' );
  });

  // ------- temperature model -------
  function estimateAmbientC(){
    // 1) Weather baseline
    let w = (window.Weather && window.Weather.isSnowing && window.Weather.isSnowing()) ? 'Snow'
          : (window.Weather && window.Weather.isRaining && window.Weather.isRaining()) ? 'Rainstorm'
          : (window.Weather && Weather.state) || 'Clear';
    let base = CFG.ambientC[w] ?? 18;

    // 2) Indoor bias
    try{ if (window.Weather && Weather.indoor) base += CFG.indoorBias; }catch{}

    // 3) Day/night (optional; if you have moon/time systems)
    //    Tiny swing: assume night is ~2°C cooler if a "sun" isn't bright.
    try{
      const l = SCENE()?.lights?.find(L=> L.name && /sun|directional/i.test(L.name));
      if (!l || (l.intensity||1) < 0.2) base -= 2;
    }catch{}

    return base;
  }

  function ghostColdSpotAt(pos){
    try{
      const gc = window.ghostCtrl;
      const s  = gc?.getState?.();
      const root = (window.ghostCtrl && window.ghostCtrl._state && window.ghostCtrl._state.ghostRoot) || null;
      const gpos = root?.position || null;
      if (!gpos || !pos) return 0;
      const d = BABYLON.Vector3.Distance(gpos, pos);
      if (d >= CFG.ghostCool.radius) return 0;
      // linear falloff: d=0 -> -delta, d=R -> 0
      const k = 1 - (d / CFG.ghostCool.radius);
      return -CFG.ghostCool.delta * k;
    }catch{ return 0; }
  }

  function getCelsiusAt(pos){
    const scene = SCENE(); const cam = CAMERA();
    const p = pos || cam?.position || v3(0,0,0);

    let t = estimateAmbientC();

    // 4) Room-specific offsets (optional hook)
    // If you have Map/Rooms that can tell a room temp offset, apply it:
    try{
      if (window.Map && typeof Map.getRoomAt === 'function'){
        const room = Map.getRoomAt(p);
        if (room && typeof room.tempOffsetC === 'number') t += room.tempOffsetC;
      }
    }catch{}

    // 5) Ghost cold spot
    t += ghostColdSpotAt(p);

    // 6) Local noise
    const now = performance.now()/1000;
    t += CFG.jitterAmp * Math.sin(now * 2*Math.PI * CFG.jitterSpeed);

    return t;
  }

  // ------- UI -------
  function buildUI(){
    if (ST.uiBuilt) return;
    ST.uiBuilt = true;

    const style = document.createElement('style');
    style.textContent = `
#thermo-wrap{
  position:fixed; left:14px; top:50%; transform:translateY(-50%);
  width:84px; height:300px; z-index:7000; display:none; /* hidden until equipped */
  pointer-events:none;
}
#thermo-card{ position:relative; width:100%; height:100%; }
#thermo-img{ position:absolute; inset:0; object-fit:contain; filter:drop-shadow(0 0 8px rgba(0,0,0,0.35)); }
#thermo-col{
  position:absolute; left:38%; bottom:16%; width:24%; height:68%;
  background:linear-gradient(#2a9,#e33 30%, #e90000 70%);
  border-radius:10px; box-shadow:inset 0 0 6px rgba(0,0,0,0.6);
  transform-origin:bottom; clip-path:inset(calc(100% - var(--h, 0%)) 0 0 0);
  opacity:0.95; mix-blend-mode:screen;
}
#thermo-readout{
  position:absolute; left:4px; bottom:-28px; width:120px;
  font:12px/1.2 monospace; color:#9ff; text-shadow:0 0 6px rgba(0,255,255,0.3);
  pointer-events:none;
}
`;
    document.head.appendChild(style);

    const wrap = document.createElement('div');
    wrap.id = 'thermo-wrap';
    wrap.innerHTML = `
      <div id="thermo-card">
        <img id="thermo-img" alt="Thermometer" />
        <div id="thermo-col"></div>
        <div id="thermo-readout"></div>
      </div>
    `;
    document.body.appendChild(wrap);

    // Set image
    const img = wrap.querySelector('#thermo-img');
    img.src = CFG.img;

    ST.ui = {
      wrap,
      col: wrap.querySelector('#thermo-col'),
      txt: wrap.querySelector('#thermo-readout'),
    };
  }

  function showUI(on){
    if (!ST.ui) return;
    ST.ui.wrap.style.display = on ? 'block' : 'none';
  }

  function setEquipped(on){
    ST.equipped = !!on;
    buildUI();
    showUI(ST.equipped);
  }

  function updateUI(dt){
    if (!ST.ui || !ST.equipped) return;

    // smooth value
    ST.displayC = lerp(ST.displayC, ST.celsius, clamp(CFG.smooth, 0, 1));

    // column height %
    const r = CFG.rangeC;
    const pct = clamp( (ST.displayC - r.min) / (r.max - r.min), 0, 1);
    ST.ui.col.style.setProperty('--h', (pct*100).toFixed(1) + '%');

    // text: °C and °F
    const c = ST.displayC;
    const f = (c * 9/5) + 32;
    ST.ui.txt.textContent = `${c.toFixed(1)}°C  |  ${f.toFixed(1)}°F` + (c<=0 ? '  (Freezing)' : '');
  }

  // ------- main loop -------
  function tick(){
    const now = performance.now()/1000;
    const dt = Math.min(0.2, Math.max(0, now - ST.lastT));
    ST.lastT = now;

    // always compute in case someone toggles equip mid-frame
    ST.celsius = getCelsiusAt();

    if (ST.equipped) updateUI(dt);
  }

  // attach to scene loop
  const boot = setInterval(()=>{ try{
    if (SCENE() && CAMERA()){
      clearInterval(boot);
      buildUI();
      // default hidden until equipped
      ST.displayC = ST.celsius = getCelsiusAt();
      SCENE().onBeforeRenderObservable.add(tick);
    }
  }catch{} }, 200);

})();
