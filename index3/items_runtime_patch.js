// ./assets/index3/items_runtime_patch.js — v1.1
// Always-visible USE / DROP / THROW controls, lighter emits light,
// Spirit Box USE toggles audio (if SpiritBoxAudio present),
// item models appear in-hand via ItemsModels, simple drop/throw placement.
//
// Include AFTER: ui_input.js, items.js, items_models_exploration.js, spiritbox_audio_glue.js

(function(){
  "use strict";
  if (window.ItemsRuntimePatch && window.ItemsRuntimePatch.__v === '1.1') return;

  const API = { __v:'1.1' };
  window.ItemsRuntimePatch = API;

  const S = {
    btnUse:null, btnDrop:null, btnThrow:null,
    watchId:null,
    lastActive:null,
    lighterOn:false,
    lighterLight:null,
    flameFlickerId:null,
  };

  const SCENE = ()=> window.scene || BABYLON.Engine?.LastCreatedScene;
  const CAM   = ()=> window.camera || SCENE()?.activeCamera;
  const v3    = (x,y,z)=> new BABYLON.Vector3(x,y,z);

  // -------- UI BAR (if your index doesn’t already have explicit buttons) --------
  function ensureActionBar(){
    if (document.getElementById('action-bar')) return;
    const bar = document.createElement('div');
    bar.id = 'action-bar';
    bar.style.cssText = `
      position:fixed; left:50%; bottom:96px; transform:translateX(-50%);
      display:flex; gap:10px; z-index:6500; background:rgba(0,0,0,0.5);
      border:1px solid #066; border-radius:10px; padding:8px 10px;`;
    function mk(label,id){
      const b = document.createElement('button'); b.id = id;
      b.textContent = label;
      b.style.cssText = `border:1px solid #0aa; background:#111; color:#0ff; padding:6px 12px; border-radius:8px; cursor:pointer;`;
      b.onpointerdown = ev=> ev.preventDefault();
      return b;
    }
    S.btnUse   = mk('USE','btn-use');
    S.btnDrop  = mk('DROP','btn-drop');
    S.btnThrow = mk('THROW','btn-throw');
    bar.appendChild(S.btnUse); bar.appendChild(S.btnDrop); bar.appendChild(S.btnThrow);
    document.body.appendChild(bar);
  }

  function getActiveItemId(){
    try{
      if (window.Items?.getActiveId) return window.Items.getActiveId();
      const a = document.querySelector('#belt .slot.active[data-item]');
      if (a) return a.getAttribute('data-item');
      if (window.Inventory?.activeId) return window.Inventory.activeId;
    }catch{}
    return null;
  }

  // -------- IN-HAND MODEL SWAP --------
  function syncInHandModel(){
    if (!window.ItemsModels?.isReady?.()) return;
    const cur = (getActiveItemId()||'').trim();
    if (cur === S.lastActive) return;
    S.lastActive = cur;

    if (!cur){
      ItemsModels.hideInHand();
      return;
    }

    // Map some ids to canonical names
    const map = {
      'emf':'EMF','emfreader':'EMF',
      'spiritbox':'SpiritBox','spirit box':'SpiritBox','radio':'SpiritBox',
      'uv':'UV','uvlight':'UV','flashlight':'UV','blacklight':'UV',
      'dots':'DOTS','projector':'DOTS',
      'camera':'Camera','videocam':'Camera','video camera':'Camera',
      'candle':'Candle',
      'thermo':'Thermometer','thermometer':'Thermometer',
      'lighter':'Lighter',
      'salt':'Salt',
      'book':'Book','writingbook':'WritingBook','notebook':'WritingBook',
      'crucifix':'Crucifix',
      'incense':'Incense','smudge':'Incense',
      'tripod':'Tripod'
    };
    const key = map[cur.toLowerCase()] || cur;
    ItemsModels.showInHand(key);
  }

  // -------- LIGHTER: point light that follows the hand --------
  function ensureLighterLight(){
    if (S.lighterLight && !S.lighterLight.isDisposed()) return S.lighterLight;
    const s = SCENE();
    S.lighterLight = new BABYLON.PointLight('LighterLight', v3(0,0,0), s);
    S.lighterLight.intensity = 2.5;
    S.lighterLight.range = 10;
    S.lighterLight.diffuse = new BABYLON.Color3(1.0, 0.85, 0.6);
    S.lighterLight.specular= new BABYLON.Color3(1.0, 0.9, 0.7);
    S.lighterLight.setEnabled(false);
    return S.lighterLight;
  }
  function flicker(on){
    if (!on){ if (S.flameFlickerId){ clearInterval(S.flameFlickerId); S.flameFlickerId=null; } return; }
    const L = ensureLighterLight();
    const anchor = window.ItemsModels?.getActiveInHand()?.root || CAM();
    L.parent = anchor || null;
    S.flameFlickerId = setInterval(()=>{
      if (!L) return;
      L.intensity = 2.2 + Math.random()*0.7;
      L.position = v3(0.03 + (Math.random()*0.02-0.01), -0.02 + (Math.random()*0.01-0.005), 0.01);
    }, 50);
  }
  function toggleLighter(){
    S.lighterOn = !S.lighterOn;
    const L = ensureLighterLight();
    const anchor = window.ItemsModels?.getActiveInHand()?.root || CAM();
    L.parent = anchor || null;
    L.setEnabled(S.lighterOn);
    flicker(S.lighterOn);
  }
  function forceLighterOff(){
    if (!S.lighterOn) return;
    S.lighterOn = false;
    if (S.lighterLight) S.lighterLight.setEnabled(false);
    flicker(false);
  }

  // -------- USE logic --------
  function onUse(){
    const cur = (getActiveItemId()||'').toLowerCase();
    if (/lighter/.test(cur)) { toggleLighter(); return; }
    if (/spirit ?box|radio/.test(cur)) { window.SpiritBoxAudio?.toggle?.(); return; }
    // fallback to any existing Items handler
    try { window.Items?.use?.(); } catch {}
  }

  // -------- DROP / THROW (simple, physics-free) --------
  function dropOrThrow({force=0}={}){
    const inHand = window.ItemsModels?.getActiveInHand?.();
    if (!inHand?.root) return;

    // make a world clone
    const world = ItemsModels.instantiate(inHand.name, null);
    if (!world) return;

    const s = SCENE(), c = CAM();
    const ray = c.getForwardRay(20);
    let place = c.position.add(ray.direction.scale(0.8)); // default drop point

    // project down to ground
    const down = new BABYLON.Ray(place.add(v3(0,2,0)), v3(0,-1,0), 8);
    const hit  = s.pickWithRay(down, m=> m && m.isPickable!==false);
    if (hit?.hit) place = hit.pickedPoint.add(v3(0,0.02,0));

    world.position.copyFrom(place);
    world.rotation = inHand.root.rotation.clone();
    world.scaling  = inHand.root.scaling.clone();

    // gentle toss forward if force > 0
    if (force>0){
      const vel = ray.direction.scale(force);
      const g = -9.8;
      const t0 = performance.now()/1000;
      const id = s.onBeforeRenderObservable.add(()=>{
        const t = performance.now()/1000 - t0;
        const dt = Math.min(0.05, s.getEngine().getDeltaTime()/1000);
        // apply gravity
        vel.y += g*dt*0.25;
        world.position.addInPlace(vel.scale(dt));
        // collide with ground using downward ray
        const r = new BABYLON.Ray(world.position.add(v3(0,1,0)), v3(0,-1,0), 2);
        const h = s.pickWithRay(r, m=> m && m.isPickable!==false);
        if (h?.hit && world.position.y <= h.pickedPoint.y+0.02){
          world.position.y = h.pickedPoint.y+0.02;
          s.onBeforeRenderObservable.remove(id);
        }
      });
    }

    // don’t duplicate the in-hand view; leave it (player still “holding” item visually)
    // If your inventory system supports removing on drop, call it:
    try { window.Items?.dropped?.(inHand.name, world); } catch {}

    // Safety: lighter shouldn’t keep lighting after a throw/drop
    if (/lighter/i.test(inHand.name)) forceLighterOff();
  }

  // -------- BIND UI + KEYS --------
  function bindUI(){
    ensureActionBar();
    S.btnUse.onclick   = onUse;
    S.btnDrop.onclick  = ()=> dropOrThrow({force:0});
    S.btnThrow.onclick = ()=> dropOrThrow({force:2.5}); // tune force as you like

    // Keys: E=use, Q=drop, R=throw
    window.addEventListener('keydown', (e)=>{
      if (e.repeat) return;
      const k = e.code||e.key||'';
      if (k==='KeyE' || k==='e' || k==='E'){ e.preventDefault(); onUse(); }
      if (k==='KeyQ' || k==='q' || k==='Q'){ e.preventDefault(); dropOrThrow({force:0}); }
      if (k==='KeyR' || k==='r' || k==='R'){ e.preventDefault(); dropOrThrow({force:2.5}); }
    }, true);
  }

  // -------- WATCHERS --------
  function startWatchers(){
    if (S.watchId) return;
    S.watchId = setInterval(()=>{
      if (window.ItemsModels?.isReady?.()) syncInHandModel();
      // turn off lighter if we switched away
      const cur = (getActiveItemId()||'').toLowerCase();
      if (!/lighter/.test(cur)) forceLighterOff();
    }, 120);
  }

  // -------- BOOT --------
  const boot = setInterval(()=>{
    try{
      if (!SCENE()) return;
      bindUI();
      startWatchers();
      clearInterval(boot);
    }catch{}
  }, 150);
})();