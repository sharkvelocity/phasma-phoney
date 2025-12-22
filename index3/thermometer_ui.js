// ./assets/index3/thermometer_ui.js — v1.0
// Fancy thermometer HUD: vertical tube with tick marks and a live-fill bar.
// Shows only when the player is holding the thermometer (best-effort autodetect),
// but also exposes a manual API so items.js can toggle explicitly.
//
// Public API:
//   ThermoHUD.setVisible(true|false)
//   ThermoHUD.setRange(minC, maxC)     // optional, default -10..50
//   ThermoHUD.setTempC(value)          // manual push (auto-pulls from Temperature if available)
//   ThermoHUD.setAutoDetect(on=true)   // watches held item and samples scene temp automatically
//   ThermoHUD.rebuild()                // rebuild ticks if you changed range
//
// Autodetect behavior:
// - Tries to detect the held item via common globals (STATE.held.key, PLAYER.hand.item.key, HELD_ITEM_KEY).
// - Considers it 'thermometer' if the key/name matches /thermo/i.
// - Pulls temp from window.Temperature if present:
//      - prefers Temperature.sampleAt(position) if available
//      - else Temperature.getCurrent?.()
//      - else Temperature.value
// - Falls back to 21°C if nothing is available.
//
// Styling is injected here so you don't need to edit index3.html.
(function(){
  "use strict";
  const $ = (sel,root=document)=> root.querySelector(sel);
  const SCENE = ()=> window.scene || BABYLON.Engine?.LastCreatedScene;
  const CAMERA= ()=> window.camera || SCENE()?.activeCamera;

  const S = {
    minC: -10, maxC: 50,
    auto: true,
    visible: false,
    built: false,
    lastTemp: 21,
    lastShowKey: null,
    updater: null,
    watcher: null,
  };

  function injectCSS(){
    if (document.getElementById("thermo-css")) return;
    const css = document.createElement("style");
    css.id = "thermo-css";
    css.textContent = `
    #thermo-hud{ display:none; }
    #thermo-hud .t-wrap{ display:flex; align-items:center; gap:10px; }
    #thermo-gauge{
      position:relative; width:32px; height:180px; border:1px solid #066; border-radius:10px;
      background:linear-gradient(180deg, rgba(5,20,22,0.9), rgba(0,0,0,0.7));
      box-shadow:inset 0 0 8px rgba(0,255,255,0.12);
    }
    #thermo-tube{
      position:absolute; left:10px; right:10px; bottom:10px; top:10px;
      border-radius:8px; background:rgba(0,0,0,0.6); overflow:hidden;
    }
    #thermo-bar{
      position:absolute; left:0; right:0; bottom:0; height:0%;
      background:linear-gradient(180deg, #5df 0%, #0ff 40%, #0a9 100%);
      box-shadow:0 0 8px rgba(0,255,255,0.25);
      transform-origin:bottom;
    }
    #thermo-scale{
      position:absolute; left:-36px; right:36px; top:8px; bottom:8px; pointer-events:none;
    }
    .th-tick{
      position:absolute; left:-2px; right:-2px; height:1px; background:#066; opacity:0.7;
      transform:translateY(var(--y));
    }
    .th-tick.major{ background:#0cc; height:2px; }
    .th-tick .lab{
      position:absolute; left:-44px; top:-7px; width:40px; text-align:right; color:#9ff; font-size:10px; opacity:0.85;
    }
    #thermo-read{
      font-weight:bold; color:#0ff; font-size:16px;
      text-shadow:0 0 8px rgba(0,255,255,0.25);
    }
    #thermo-icon{ opacity:0.9; }
    `;
    document.head.appendChild(css);
  }

  function build(){
    injectCSS();
    const hud = $("#thermo-hud");
    if (!hud){ console.warn("[ThermoHUD] #thermo-hud element missing"); return; }
    hud.innerHTML = ""; // rebuild
    const wrap = document.createElement("div"); wrap.className = "t-wrap";
    const icon = document.createElement("img"); icon.id="thermo-icon"; icon.src = icon.src || "./assets/icons/thermometer.png"; icon.width=20; icon.height=20;
    const read = document.createElement("div"); read.id="thermo-read"; read.textContent="--.-°C";
    const g = document.createElement("div"); g.id = "thermo-gauge";
    const scale = document.createElement("div"); scale.id = "thermo-scale";
    const tube = document.createElement("div"); tube.id = "thermo-tube";
    const bar  = document.createElement("div"); bar.id  = "thermo-bar";
    tube.appendChild(bar); g.appendChild(tube); g.appendChild(scale);
    wrap.appendChild(icon); wrap.appendChild(g); wrap.appendChild(read);
    hud.appendChild(wrap);
    makeTicks(scale);
    S.built = true;
  }

  function makeTicks(scaleEl){
    scaleEl.innerHTML = "";
    const H = 180 - 20; // gauge inner visual height approx (px), matches CSS top/bottom
    const min = S.minC, max = S.maxC;
    const stepMajor = 10, stepMinor = 5;
    for (let t = min; t <= max; t += stepMinor){
      const p = (t - min) / (max - min);
      const y = (H - (H * p)) + 10; // +top padding
      const div = document.createElement("div");
      div.className = "th-tick" + (t % stepMajor === 0 ? " major" : "");
      div.style.setProperty("--y", y + "px");
      if (t % stepMajor === 0){
        const lab = document.createElement("div");
        lab.className = "lab"; lab.textContent = `${t}°`;
        div.appendChild(lab);
      }
      scaleEl.appendChild(div);
    }
  }

  function setRange(minC, maxC){
    if (typeof minC === "number") S.minC = minC;
    if (typeof maxC === "number") S.maxC = maxC;
    const sc = $("#thermo-scale"); if (sc) makeTicks(sc);
  }

  function setVisible(on){
    S.visible = !!on;
    const hud = $("#thermo-hud");
    if (hud) hud.style.display = S.visible ? "block" : "none";
  }

  function setTempC(val){
    S.lastTemp = val;
    const read = $("#thermo-read"); if (read) read.textContent = `${val.toFixed(1)}°C`;
    const bar  = $("#thermo-bar");
    if (bar){
      const t = Math.max(S.minC, Math.min(S.maxC, val));
      const p = (t - S.minC) / (S.maxC - S.minC);
      bar.style.height = (p*100).toFixed(1) + "%";
      // color tone by temp
      let c;
      if (val <= 0) c = "linear-gradient(180deg, #8cf, #39f)";
      else if (val < 10) c = "linear-gradient(180deg, #7ef, #0cf)";
      else if (val < 25) c = "linear-gradient(180deg, #6fd, #0c9)";
      else c = "linear-gradient(180deg, #f88, #d33)";
      bar.style.background = c;
    }
  }

  function detectHeldKey(){
    try {
      const s = window.STATE;
      if (s?.held?.key) return s.held.key;
      if (window.HELD_ITEM_KEY) return window.HELD_ITEM_KEY;
      const p = window.PLAYER;
      if (p?.hand?.item?.key) return p.hand.item.key;
      if (window.currentHeldItemKey) return window.currentHeldItemKey;
      // belt slots (common pattern)
      if (window.BELT?.active?.key) return window.BELT.active.key;
    } catch {}
    return null;
  }

  function autoVisibleTick(){
    const key = (detectHeldKey()||"").toString().toLowerCase();
    const should = /thermo/.test(key);
    if (should !== S.visible) setVisible(should);
  }

  function sampleTemp(){
    // Try the temperature system if present
    try {
      const T = window.Temperature || window.TEMP || null;
      if (!T) return null;
      const cam = CAMERA();
      const pos = cam?.position || (window.player?.position);
      if (typeof T.sampleAt === "function" && pos){
        return T.sampleAt(pos);
      }
      if (typeof T.getCurrent === "function"){
        return T.getCurrent();
      }
      if (typeof T.value === "number"){
        return T.value;
      }
    } catch {}
    return null;
  }

  function updateLoop(){
    if (S.auto){
      autoVisibleTick();
      const v = sampleTemp();
      if (typeof v === "number") setTempC(v);
    }
  }

  function startLoops(){
    if (!S.updater){
      const s = SCENE();
      if (s){
        S.updater = ()=> updateLoop();
        s.onBeforeRenderObservable.add(S.updater);
      } else {
        // fallback timer
        S.updater = setInterval(updateLoop, 100);
      }
    }
    if (!S.watcher){
      S.watcher = setInterval(()=>{
        // Rebuild if HUD added later
        if (!S.built && document.getElementById("thermo-hud")) build();
      }, 400);
    }
  }

  // Public API
  window.ThermoHUD = {
    setVisible,
    setRange,
    setTempC,
    setAutoDetect(on=true){ S.auto = !!on; },
    rebuild: build,
  };

  // Boot
  function init(){
    if (!document.getElementById("thermo-hud")) return; // wait for DOM
    build();
    // Try to tighten range from Temperature if provided
    try {
      const T = window.Temperature;
      if (T?.getRange){
        const r = T.getRange();
        if (r && typeof r.min === "number" && typeof r.max === "number"){
          S.minC = r.min; S.maxC = r.max;
          setRange(S.minC, S.maxC);
        }
      }
    } catch {}
    startLoops();
  }
  if (document.readyState === "complete" || document.readyState === "interactive"){
    setTimeout(init, 0);
  } else {
    window.addEventListener("DOMContentLoaded", init);
  }
})();