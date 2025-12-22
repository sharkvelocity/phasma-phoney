
// ./assets/index3/items.js — v2.6 (Use/Drop/Throw + EMF toggle + simple toss physics)
// No external physics engine required. Uses moveWithCollisions + a tiny kinematic loop.
// Requires: BABYLON, window.scene, window.camera
(function(){
  "use strict";
  if (window.ItemSystem && window.ItemSystem.__v === '2.6') return;

  const SCENE = ()=> window.scene || BABYLON.Engine?.LastCreatedScene;
  const CAMERA= ()=> window.camera || SCENE()?.activeCamera;
  const v3    = (x,y,z)=> new BABYLON.Vector3(x,y,z);
  const clamp = (v,a,b)=> Math.max(a, Math.min(b,v));
  const toast = (m)=> window.toast ? window.toast(m) : console.log('[items]', m);

  // ---------------- Hand anchor (where held items sit) ----------------
  const HAND = {
    pivot: null,
    ensure(){
      const s = SCENE(), c = CAMERA(); if (!s || !c) return;
      if (HAND.pivot && HAND.pivot._isDisposed) HAND.pivot = null;
      if (HAND.pivot) return HAND.pivot;
      const p = new BABYLON.TransformNode('HandPivot', s);
      p.parent = c;
      p.position = v3(0.35, -0.25, 0.7); // slight right/low/forward offset
      p.rotation = v3(0, 0, 0);
      HAND.pivot = p;
      return p;
    }
  };

  // ---------------- Simple toss / drop kinematics ----------------
  // Works without physics plugin. Uses moveWithCollisions() against checkCollisions meshes.
  const KIN = {
    enabled: true,
    bodies: new Set(),
    gravity: v3(0, -9.8, 0), // m/s^2
    airFriction: 0.02,
    add(mesh, vel){
      if (!mesh) return;
      mesh.metadata = mesh.metadata || {};
      mesh.metadata._kin = { vel: vel.clone() };
      KIN.bodies.add(mesh);
    },
    remove(mesh){
      if (!mesh) return;
      if (mesh.metadata && mesh.metadata._kin) delete mesh.metadata._kin;
      KIN.bodies.delete(mesh);
    },
    tick(dt){
      if (!KIN.bodies.size) return;
      const tmp = [];
      KIN.bodies.forEach(m=> tmp.push(m));
      for (const m of tmp){
        const kin = m.metadata && m.metadata._kin;
        if (!kin){ KIN.bodies.delete(m); continue; }
        // v = v + g*dt - air* v
        kin.vel = kin.vel.add(KIN.gravity.scale(dt)).scale(1 - KIN.airFriction);
        const step = kin.vel.scale(dt);
        try {
          // use a capsule-ish radius for small items
          m.moveWithCollisions(step);
        } catch {
          m.position.addInPlace(step);
        }
        // hit ground: dampen and stop when small
        if (m._collisionMask || true){
          // naive ground stop if Y goes below -1.. assume floors are y≈0..
          if (m.position.y < 0.02) {
            m.position.y = 0.02;
            if (kin.vel.y < 0) kin.vel.y *= -0.25; // bounce
            kin.vel.x *= 0.65; kin.vel.z *= 0.65;
            if (kin.vel.lengthSquared() < 0.01){
              KIN.remove(m);
            }
          }
        }
      }
    }
  };

  // Per-frame
  (function bootKIN(){
    const tryHook = setInterval(()=>{
      const s = SCENE(); if (!s) return;
      clearInterval(tryHook);
      s.onBeforeRenderObservable.add(()=>{
        const dt = Math.min(0.05, s.getEngine().getDeltaTime() / 1000);
        KIN.tick(dt);
      });
    }, 100);
  })();

  // ---------------- Models (equip visuals) ----------------
  const Models = {
    cacheRoot: null,
    loaded: false,
    nodes: {},
    // Load exploration_objects.glb once. Safe if missing; we'll fallback to boxes.
    ensure(cb){
      if (Models.loaded){ cb && cb(); return; }
      const s = SCENE(); if (!s) return;
      const url = "./assets/models/items/exploration_objects.glb";
      BABYLON.SceneLoader.Append("", url, s, (scn)=>{
        // Put under a hidden parent
        const root = new BABYLON.TransformNode("ItemModelRoot", s);
        scn.meshes.forEach(m=>{
          if (!m.name || m.name === "BackgroundHelper") return;
          if (m.parent == null) m.setParent(root);
        });
        root.setEnabled(false);
        Models.cacheRoot = root;
        // Index by fuzzy names
        function take(name, rx){
          const n = s.getNodeByName(name) || scn.meshes.find(mm=> rx.test(mm.name));
          if (n) Models.nodes[name] = n;
        }
        take("EMF",        /emf/i);
        take("SpiritBox",  /spirit.?box/i);
        take("UV",         /(uv|black).?light/i);
        take("DOTS",       /dots?/i);
        take("Book",       /(book|writing)/i);
        take("Thermo",     /thermo/i);
        take("Lighter",    /lighter/i);
        take("Camera",     /(video.?cam|camera)/i);
        take("Candle",     /candle/i);
        Models.loaded = true;
        cb && cb();
      }, null, (scene, msg)=>{
        console.warn("[items] model load failed:", msg);
        Models.loaded = true;
        cb && cb();
      });
    },
    spawnCopy(key){
      const s = SCENE(); if (!s) return null;
      const src = Models.nodes[key];
      if (!src){
        // fallback rectangular gizmo
        const box = BABYLON.MeshBuilder.CreateBox("Fallback_"+key, {size:0.2}, s);
        const m = new BABYLON.StandardMaterial("M_"+key, s);
        m.diffuseColor = new BABYLON.Color3(0.2, 0.8, 1.0);
        box.material = m;
        return box;
      }
      // clone hierarchy
      const clone = src.clone("itm_"+key+"_"+Date.now().toString(36));
      // if source is mesh with children, clone will be only the mesh; duplicate children
      if (src.getChildren && src.getChildren().length){
        src.getChildren().forEach(ch=>{
          const cc = ch.clone(ch.name+"_c");
          cc.parent = clone;
        });
      }
      clone.setEnabled(true);
      return clone;
    }
  };

  // ---------------- Item registry ----------------
  // Each handler may implement: onEquip, onUnequip, onUseDown, onUseUp, onDrop, onThrow, tick
  const REG = {
    EMF: {
      id: "EMF", name: "EMF Reader", icon: "./assets/icons/emf.png", modelKey:"EMF",
      state: { on:false, level:0 },
      onEquip(it){ /*visual*/ },
      onUseDown(it){
        this.state.on = !this.state.on;
        toast("EMF "+(this.state.on?"ON":"OFF"));
        // glow a bit if model present
        if (it.node && it.node.getChildMeshes){
          it.node.getChildMeshes().forEach(m=>{
            if (!m.material) m.material = new BABYLON.StandardMaterial("mat_"+m.name, SCENE());
            try { m.material.emissiveColor = this.state.on ? new BABYLON.Color3(0,1,0.2) : new BABYLON.Color3(0,0,0); } catch {}
          });
        }
      },
      onDrop(it){ /* nothing special */ },
      onThrow(it){ /* nothing special */ },
      tick(it,dt){ /* later: proximity to ghost updates level */ }
    },
    SpiritBox: {
      id:"SpiritBox", name:"Spirit Box", icon:"./assets/icons/spiritbox.png", modelKey:"SpiritBox",
      state:{ on:false, audio:null },
      onEquip(it){},
      onUseDown(it){
        this.state.on = !this.state.on;
        toast("Spirit Box "+(this.state.on?"ON":"OFF"));
        try{
          if (!this.state.audio){
            this.state.audio = new BABYLON.Sound("spiritbox", "./assets/audio/spiritbox.mp3", SCENE(), null, { loop:true, autoplay:false, volume:0.6 });
          }
          if (this.state.on) this.state.audio.play(); else this.state.audio.stop();
        }catch(e){ console.warn("[SpiritBox] audio failed", e); }
      }
    },
    Lighter: {
      id:"Lighter", name:"Lighter", icon:"./assets/icons/lighter.png", modelKey:"Lighter",
      state:{ on:false, light:null, flickerId:0 },
      onUseDown(it){
        this.state.on = !this.state.on;
        toast("Lighter "+(this.state.on?"ON":"OFF"));
        const s = SCENE();
        if (this.state.on){
          if (!this.state.light){
            this.state.light = new BABYLON.PointLight("LighterLight", v3(0,0,0), s);
            this.state.light.intensity = 0.55;
            this.state.light.range = 7;
          }
          this.state.light.parent = it.node;
          this.state.light.position = v3(0,0.05,0.05);
          // soft flicker
          this.state.flickerId = window.setInterval(()=>{
            this.state.light.intensity = 0.5 + Math.random()*0.25;
          }, 60);
        } else {
          if (this.state.flickerId) { clearInterval(this.state.flickerId); this.state.flickerId=0; }
          if (this.state.light){ this.state.light.parent=null; this.state.light.dispose(); this.state.light=null; }
        }
      },
      onUnequip(it){
        if (this.state.flickerId) { clearInterval(this.state.flickerId); this.state.flickerId=0; }
        if (this.state.light){ this.state.light.parent=null; this.state.light.dispose(); this.state.light=null; }
        this.state.on=false;
      }
    },
    Thermo: {
      id:"Thermo", name:"Thermometer", icon:"./assets/icons/thermometer.png", modelKey:"Thermo",
      onEquip(){ try{ window.ThermoHUD && ThermoHUD.show(true); }catch{} },
      onUnequip(){ try{ window.ThermoHUD && ThermoHUD.show(false); }catch{} },
      onUseDown(){ /* no toggle needed */ },
      tick(it,dt){ try{ window.ThermoHUD && ThermoHUD.update && ThermoHUD.update(); }catch{} }
    },
    UV:    { id:"UV",    name:"UV Light",    icon:"./assets/icons/uv.png",     modelKey:"UV"    },
    DOTS:  { id:"DOTS",  name:"D.O.T.S",     icon:"./assets/icons/dots.png",   modelKey:"DOTS"  },
    Book:  { id:"Book",  name:"Writing Book",icon:"./assets/icons/book.png",   modelKey:"Book"  },
    Camera:{ id:"Camera",name:"Video Cam",   icon:"./assets/icons/camera.png", modelKey:"Camera"},
    Candle:{ id:"Candle",name:"Candle",      icon:"./assets/icons/candle.png", modelKey:"Candle"}
  };

  // ---------------- System core ----------------
  const SYS = {
    __v:'2.6',
    belt: [],          // array of item IDs in slots
    activeIndex: 0,
    held: null,        // { id, def, node }
    worldItems: new Set(), // dropped meshes for pickup later (optional)
    init(){
      Models.ensure(()=>{});
      this.buildBeltUI();
      this.fillDefaultLoadout();
      this.select(0);
      this.wireButtons();
      toast("Item system ready");
    },
    buildBeltUI(){
      const wrap = document.getElementById('belt'); if (!wrap) return;
      wrap.innerHTML='';
      for (let i=0;i<5;i++){
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.dataset.index = i;
        const key = document.createElement('div');
        key.className = 'key'; key.textContent = (i+1);
        const img = document.createElement('img'); img.alt=''; img.style.opacity='0.9';
        const label = document.createElement('div'); label.className='label'; label.style.display='none';
        slot.appendChild(key); slot.appendChild(img); slot.appendChild(label);
        slot.onclick = ()=> this.select(i);
        wrap.appendChild(slot);
      }
      this.refreshBelt();
    },
    refreshBelt(){
      const wrap = document.getElementById('belt'); if (!wrap) return;
      for (let i=0;i<5;i++){
        const slot = wrap.children[i]; if (!slot) continue;
        const id = this.belt[i];
        const img = slot.querySelector('img');
        if (id && REG[id]){
          img.src = REG[id].icon || '';
          img.style.display='';
        } else {
          img.src=''; img.style.display='none';
        }
        slot.classList.toggle('active', i===this.activeIndex);
      }
    },
    fillDefaultLoadout(){
      if (!this.belt.length){
        this.belt = ['EMF','SpiritBox','Thermo','Lighter','Book'];
      }
      this.refreshBelt();
    },
    select(i){
      i = clamp(i|0, 0, 4);
      if (this.activeIndex === i) return;
      this.unequip();
      this.activeIndex = i;
      this.refreshBelt();
      this.equip(this.belt[i]);
    },
    equip(id){
      const def = REG[id]; if (!def) return;
      const s = SCENE(); if (!s) return;
      const node = Models.spawnCopy(def.modelKey || id) || new BABYLON.TransformNode("Held_"+id, s);
      node.parent = HAND.ensure();
      node.position = v3(0,0,0);
      node.scaling.scaleInPlace(0.6);
      this.held = { id, def, node };
      try{ def.onEquip && def.onEquip(this.held); }catch(e){ console.warn('[onEquip]', e); }
    },
    unequip(){
      if (!this.held) return;
      try{ this.held.def.onUnequip && this.held.def.onUnequip(this.held); }catch{}
      try{ this.held.node.setParent(null); this.held.node.dispose(false,true); }catch{}
      this.held = null;
    },
    useDown(){ if (this.held && this.held.def.onUseDown) try{ this.held.def.onUseDown(this.held); }catch(e){ console.warn('[useDown]',e); } },
    useUp(){   if (this.held && this.held.def.onUseUp)   try{ this.held.def.onUseUp(this.held);   }catch(e){ console.warn('[useUp]',e);   } },
    drop(){
      if (!this.held) return;
      const h = this.held;
      try{ h.def.onDrop && h.def.onDrop(h); }catch{}
      // detach to world and gently place in front of camera
      const s=SCENE(), c=CAMERA(); if (!s||!c) return;
      h.node.setParent(null);
      const ray = c.getForwardRay(3.0);
      const pos = c.position.add(ray.direction.scale(0.9));
      pos.y = Math.max(0.12, pos.y - 0.25);
      h.node.position.copyFrom(pos);
      h.node.checkCollisions = true;
      KIN.remove(h.node);
      this.worldItems.add(h.node);
      this.held = null;
      this.equip(this.belt[this.activeIndex]); // show an empty hand? Just re-equip for now
    },
    toss(power=1.0){
      if (!this.held) return;
      const h = this.held;
      try{ h.def.onThrow && h.def.onThrow(h); }catch{}
      h.node.setParent(null);
      const s=SCENE(), c=CAMERA(); if (!s||!c) return;
      const ray = c.getForwardRay(10);
      const vel = ray.direction.scale(4.5 * clamp(power,0.3,2.5)).add(v3(0, 2.0*power, 0));
      h.node.checkCollisions = true;
      KIN.add(h.node, vel);
      this.worldItems.add(h.node);
      this.held = null;
      this.equip(this.belt[this.activeIndex]);
    },
    tick(dt){
      if (this.held && this.held.def.tick) try{ this.held.def.tick(this.held, dt); }catch{}
    },
    // External helpers
    setBelt(ids){ this.belt = ids.slice(0,5); this.refreshBelt(); this.unequip(); this.equip(this.belt[this.activeIndex]); },
    next(){ this.select((this.activeIndex+1)%5); },
    prev(){ this.select((this.activeIndex+4)%5); }
  };

  // Frame update for item-specific ticks
  (function bootTick(){
    const timer = setInterval(()=>{
      const s = SCENE(); if (!s) return;
      clearInterval(timer);
      s.onBeforeRenderObservable.add(()=>{
        const dt = Math.min(0.05, s.getEngine().getDeltaTime()/1000);
        SYS.tick(dt);
      });
    }, 120);
  })();

  // Bind to window
  window.ItemSystem = SYS;

  // Auto-init when scene appears
  (function autoInit(){
    const t = setInterval(()=>{
      if (SCENE() && CAMERA()){
        clearInterval(t);
        SYS.init();
      }
    }, 150);
  })();
})();