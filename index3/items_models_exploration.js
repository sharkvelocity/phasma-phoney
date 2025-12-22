// ./assets/index3/items_models_exploration.js — v2.0
// Loads ./assets/models/items/exploration_objects.glb and exposes a tiny API:
//   ItemsModels.init()
//   ItemsModels.showInHand(name)
//   ItemsModels.hideInHand()
//   ItemsModels.getActiveInHand() -> {name, root}
//   ItemsModels.instantiate(name, parent?) -> TransformNode (world clone)
//
// Auto-fixes PBR looking too dark by setting unlit if there's no environment.

(function(){
  "use strict";
  if (window.ItemsModels && window.ItemsModels.__v === '2.0') return;

  const PATH = "./assets/models/items/";
  const FILE = "exploration_objects.glb";

  const STATE = {
    ready:false,
    loading:false,
    map:{},              // logicalName -> template TransformNode
    sourceContainer:null,
    handAnchor:null,
    inHand:null,         // {name, root}
    offsets:{
      // per-item hand offsets (right-hand, screen space-ish)
      default: {pos:[0.28,-0.25,0.7], rot:[0.0, Math.PI*0.06, 0.0], scl:1.0},
      EMF:     {pos:[0.24,-0.27,0.68], rot:[0.0, Math.PI*0.08, 0.0], scl:1.0},
      SpiritBox:{pos:[0.26,-0.29,0.70], rot:[0.0, Math.PI*0.04, 0.0], scl:1.0},
      UV:      {pos:[0.24,-0.29,0.66], rot:[0.0, Math.PI*0.10, 0.0], scl:1.0},
      DOTS:    {pos:[0.28,-0.26,0.70], rot:[0.0, Math.PI*0.10, 0.0], scl:1.0},
      Camera:  {pos:[0.22,-0.23,0.75], rot:[0.0, Math.PI*0.12, 0.0], scl:1.0},
      Candle:  {pos:[0.30,-0.22,0.72], rot:[0.0, Math.PI*0.04, 0.0], scl:1.1},
      Thermometer:{pos:[0.24,-0.27,0.70], rot:[0.0, Math.PI*0.06, 0.0], scl:1.0},
      Lighter: {pos:[0.28,-0.28,0.65], rot:[0.0, Math.PI*0.05, 0.0], scl:1.2},
      Salt:    {pos:[0.28,-0.26,0.72], rot:[0.0, Math.PI*0.10, 0.0], scl:1.0},
      Book:    {pos:[0.26,-0.29,0.68], rot:[-0.05, Math.PI*0.14, 0.0], scl:1.0},
      WritingBook:{pos:[0.26,-0.29,0.68], rot:[-0.05, Math.PI*0.14, 0.0], scl:1.0},
      Crucifix:{pos:[0.28,-0.26,0.68], rot:[0.0, Math.PI*0.05, 0.0], scl:1.1},
      Incense:{pos:[0.28,-0.28,0.68], rot:[0.0, Math.PI*0.05, 0.0], scl:1.1},
      Tripod:{pos:[0.18,-0.30,0.85], rot:[0.0, Math.PI*0.18, 0.0], scl:1.0},
    }
  };

  function SCENE(){ return window.scene || BABYLON.Engine?.LastCreatedScene; }
  function CAM(){ return window.camera || SCENE()?.activeCamera; }
  function v3(x,y,z){ return new BABYLON.Vector3(x,y,z); }

  // fuzzy lookup helper: picks first mesh whose name contains all parts
  function findLike(meshes, ...parts){
    const wants = parts.map(p=> String(p).toLowerCase());
    return meshes.find(m=>{
      const n = (m.name||'').toLowerCase();
      return wants.every(w=> n.includes(w));
    });
  }

  function makeTemplateFromMesh(mesh){
    // Wrap mesh into a transform root so we can position/scale without altering shared mesh
    const s = SCENE();
    const root = new BABYLON.TransformNode(mesh.name+"_TEMPLATE_ROOT", s);
    mesh.parent = root;
    root.setEnabled(false);
    return root;
  }

  function normalizeMaterials(node){
    node.getChildMeshes?.()?.forEach(m=>{
      const mat = m.material;
      if (!mat) return;
      // If PBR and no environment set -> make unlit so albedo shows (prevents "black blocks")
      try{
        if (mat.getClassName && /PBR/i.test(mat.getClassName())){
          if (!SCENE().environmentTexture){ mat.unlit = true; }
          mat.backFaceCulling = true;
        }
      }catch{}
      // Ensure textures render
      try{ if (mat.diffuseTexture){ mat.diffuseTexture.updateSamplingMode(BABYLON.Texture.TRILINEAR_SAMPLINGMODE); } }catch{}
    });
  }

  function mapLogicalNames(allMeshes){
    const map = {};
    const pick = (...parts)=> {
      const m = findLike(allMeshes, ...parts);
      return m ? makeTemplateFromMesh(m) : null;
    };
    // Common tools (try several name patterns)
    map.EMF         = pick('emf')            || pick('reader');
    map.SpiritBox   = pick('spirit','box')   || pick('radio');
    map.UV          = pick('uv')             || pick('flash','light') || pick('black','light');
    map.DOTS        = pick('dots')           || pick('projector');
    map.Camera      = pick('video','cam')    || pick('camera');
    map.Candle      = pick('candle');
    map.Thermometer = pick('thermo');
    map.Lighter     = pick('lighter');
    map.Salt        = pick('salt');
    map.Book        = pick('book');
    map.WritingBook = map.Book;
    map.Crucifix    = pick('crucifix');
    map.Incense     = pick('smudge')         || pick('incense');
    map.Tripod      = pick('tripod');

    // Fallbacks (simple boxes so something shows up)
    Object.keys(map).forEach(k=>{
      if (!map[k]){
        const s = SCENE();
        const box = BABYLON.MeshBuilder.CreateBox('Fallback_'+k, {size:0.18}, s);
        const mat = new BABYLON.StandardMaterial('Mat_'+k, s);
        mat.diffuseColor = new BABYLON.Color3(0.2,0.8,0.8);
        box.material = mat;
        map[k] = makeTemplateFromMesh(box);
      }
      normalizeMaterials(map[k]);
    });

    STATE.map = map;
  }

  function ensureHandAnchor(){
    if (STATE.handAnchor && !STATE.handAnchor.isDisposed()) return STATE.handAnchor;
    const s = SCENE();
    const c = CAM();
    const root = new BABYLON.TransformNode('HandAnchor', s);
    if (c) root.parent = c;
    STATE.handAnchor = root;
    return root;
  }

  function applyOffset(root, name){
    const o = STATE.offsets[name] || STATE.offsets.default;
    const p = o.pos, r = o.rot, scl = o.scl||1;
    root.position.set(p[0], p[1], p[2]);
    root.rotation.set(r[0], r[1], r[2]);
    root.scaling.set(scl, scl, scl);
  }

  function cloneTemplate(name, parent){
    const t = STATE.map[name];
    if (!t) return null;
    const s = SCENE();
    // deep clone hierarchy
    const clone = t.clone(name+'_inHand_root', parent||null);
    // Make sure children are enabled
    (function enableTree(n){
      n.setEnabled(true);
      n.getChildren?.().forEach(enableTree);
    })(clone);
    return clone;
  }

  function showInHand(name){
    if (!STATE.ready) return;
    hideInHand();
    const anchor = ensureHandAnchor();
    if (!anchor) return;

    const root = cloneTemplate(name, anchor);
    if (!root) return;

    applyOffset(root, name);
    // in-hand shouldn't block rays
    root.getChildMeshes?.().forEach(m=>{ m.isPickable = false; });
    STATE.inHand = { name, root };
  }

  function hideInHand(){
    if (STATE.inHand?.root && !STATE.inHand.root.isDisposed()){
      try{ STATE.inHand.root.dispose(false,true); }catch{}
    }
    STATE.inHand = null;
  }

  function instantiate(name, parent){
    const root = cloneTemplate(name, parent||null);
    if (!root) return null;
    // world clones should be pickable & collide; let game decide collisions
    root.getChildMeshes?.().forEach(m=>{ m.isPickable = true; });
    return root;
  }

  function init(){
    if (STATE.ready || STATE.loading) return;
    if (!SCENE()) return;
    STATE.loading = true;

    BABYLON.SceneLoader.LoadAssetContainer(PATH, FILE, SCENE(), (container)=>{
      STATE.sourceContainer = container;
      // add to scene (but keep templates disabled via makeTemplateFromMesh)
      container.addAllToScene();
      // Gather meshes once they’re in the scene
      const meshes = container.meshes.filter(m=> m && m.name && !/^-?__root__$/i.test(m.name));
      mapLogicalNames(meshes);
      // hide originals
      meshes.forEach(m=>{ m.setEnabled(false); });
      STATE.ready = true;
      window.dispatchEvent(new CustomEvent('ItemsModelsReady'));
    }, null, (scene, msg, e)=>{
      console.warn('[ItemsModels] load error:', msg || e);
      STATE.ready = true; // allow fallbacks
      window.dispatchEvent(new CustomEvent('ItemsModelsReady'));
    });
  }

  window.ItemsModels = {
    __v:'2.0',
    init, showInHand, hideInHand, instantiate,
    getActiveInHand: ()=> STATE.inHand,
    isReady: ()=> STATE.ready
  };

  // auto-boot
  const boot = setInterval(()=>{ try{ if (SCENE()){ clearInterval(boot); init(); } }catch{} }, 150);
})();