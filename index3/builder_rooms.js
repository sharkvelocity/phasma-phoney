// ./assets/index3/builder_rooms.js — v1.7
// Right-side Rooms/Doors palette with material picker (thumbnail resolver),
// Draw/Finish/Undo/Redo/Cancel/Reset/Clear, Room/Door mode, door width,
// Copy/Paste Room, grid snapping, and Apply material to current selection.
//
// Works with window.Builder if present; otherwise all actions no-op safely.
// Requires: Babylon (for materials/textures only).
(function(){
  "use strict";

  // ------------------------------------------------------------
  // Thumbnail + texture resolver (prevents 404s)
  // ------------------------------------------------------------
  // Where your material images live. Adjust if needed.
  const MATERIALS_BASE = window.MATERIALS_BASE || {
    thumbs  : "./cdn/materials/thumbnails/", // optional (if you add thumbs later)
    library : "./cdn/materials/library/"     // your screenshot shows files here
  };

  // Optional explicit filename overrides per key
  const MATERIALS_ALIAS = window.MATERIALS_ALIAS || {
    // "wood_oak": "babylonOak_basecolor.jpg",
    // "tile_white": "babylonTileWhite_basecolor.png"
  };

  // Helper that never shows a broken-image icon
  function makeMatThumb(key){
    // If the host page already defined it, use theirs.
    if (typeof window.makeMatThumb === "function") return window.makeMatThumb(key);

    const srcs = [];
    if (MATERIALS_ALIAS[key]) {
      srcs.push(MATERIALS_BASE.library + MATERIALS_ALIAS[key]);
    }
    const candidates = [
      key + ".jpg", key + ".png",
      key + "_albedo.jpg", key + "_albedo.png",
      key + "_basecolor.jpg", key + "_basecolor.png",
      key + "_diffuse.jpg", key + "_diffuse.png"
    ];
    candidates.forEach(n=>{
      srcs.push(MATERIALS_BASE.thumbs  + n);
      srcs.push(MATERIALS_BASE.library + n);
    });

    const img = new Image();
    img.alt = key; img.decoding = "async"; img.loading = "lazy";
    let i = 0;
    const next = ()=> {
      if (i < srcs.length){ img.src = srcs[i++]; }
      else {
        // canvas fallback (small cyan swatch)
        const c = document.createElement("canvas"); c.width = c.height = 64;
        const g = c.getContext("2d");
        g.fillStyle = "#233"; g.fillRect(0,0,64,64);
        g.fillStyle = "#8cf"; g.fillRect(10,10,44,44);
        img.src = c.toDataURL("image/png");
      }
    };
    img.onerror = next; next();
    return img;
  }

  // ------------------------------------------------------------
  // Material catalog (keys only; files are looked up dynamically)
  // ------------------------------------------------------------
  const MATERIAL_KEYS = [
    "tile_white","wood_oak","wood_pine","carpet_gray",
    "wallpaper_cream","concrete","brick","stone",
    "plaster","linoleum","tile_gray","tile_beige"
  ];

  // Build (or fetch) a Babylon material from a key
  function getOrCreateMaterial(scene, key, opts={}){
    const id = "MAT_"+key;
    const found = scene.getMaterialByName(id);
    if (found) return found;

    // Attempt to find a basecolor texture by trying common suffixes
    const tryFiles = [];
    if (MATERIALS_ALIAS[key]) tryFiles.push(MATERIALS_BASE.library + MATERIALS_ALIAS[key]);

    const suffixes = [
      ".jpg",".png","_albedo.jpg","_albedo.png","_basecolor.jpg","_basecolor.png","_diffuse.jpg","_diffuse.png"
    ];
    suffixes.forEach(s=>{
      tryFiles.push(MATERIALS_BASE.library + key + s);
    });

    const mat = new BABYLON.StandardMaterial(id, scene);
    mat.specularColor = new BABYLON.Color3(0.06,0.06,0.06);

    let i = 0;
    function tryNext(){
      if (i>=tryFiles.length){ return; }
      const url = tryFiles[i++];
      const tex = new BABYLON.Texture(url, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, ()=>{
        mat.diffuseTexture = tex;
        // default tiling
        tex.uScale = (opts.uScale||1);
        tex.vScale = (opts.vScale||1);
      }, ()=>{
        tryNext(); // onError -> try next candidate
      });
    }
    tryNext();
    return mat;
  }

  // ------------------------------------------------------------
  // Minimal Builder adapter (safe no-ops if methods missing)
  // ------------------------------------------------------------
  const B = (function(){
    const b = (window.Builder||{});
    function noop(){ /* no-op */ }

    return {
      // drawing
      beginRoom : b.beginRoom    || b.roomsStart || noop,
      finishRoom: b.finishRoom   || b.roomsFinish|| noop,
      cancelRoom: b.cancelRoom   || b.roomsCancel|| noop,
      undoPoint : b.undoRoomPoint|| b.roomsUndoPoint || b.undo || noop,
      redoPoint : b.redoRoomPoint|| b.roomsRedoPoint || b.redo || noop,
      clear     : b.clearRooms   || noop,
      resetSel  : b.resetSelection || noop,

      // modes & settings
      setMode   : b.setRoomsMode || b.roomsSetMode || noop, // 'room' | 'door'
      setDoorW  : b.setDoorWidth || b.roomsSetDoorWidth || noop,
      setGrid   : b.setGrid      || noop, // {snap, step}

      // materials
      applyMat  : b.applyMatToSelection || noop,

      // copy/paste
      copyRoom  : b.copyRoomShape || b.roomsCopySelection || noop,
      pasteRoom : b.pasteRoomShape|| b.roomsPaste || noop
    };
  })();

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------
  const UI = {
    root: null,
    build(){
      if (this.root && document.body.contains(this.root)) return;
      const box = document.createElement("div");
      box.id = "rooms-panel";
      box.style.cssText = [
        "position:fixed",
        "top:12px",
        "right:12px",
        "width:320px",
        "max-height:82vh",
        "overflow:auto",
        "z-index:12020",
        "background:rgba(0,0,0,0.78)",
        "border:1px solid #066",
        "border-radius:10px",
        "padding:8px 10px",
        "color:#9ff",
        "font:12px/1.35 monospace",
        "box-shadow:0 0 18px rgba(0,255,255,0.08)"
      ].join(";");

      box.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <b style="color:#0ff">Rooms / Doors</b>
          <span style="opacity:.7">Builder</span>
        </div>

        <div style="margin-bottom:8px;border-bottom:1px solid #044;padding-bottom:6px;">
          <div style="display:grid;grid-template-columns:repeat(4,auto);gap:6px;align-items:center;">
            <button id="r_draw"   class="btn">Draw Room</button>
            <button id="r_finish" class="btn">Finish</button>
            <button id="r_undo"   class="btn">Undo</button>
            <button id="r_cancel" class="btn">Cancel</button>

            <label style="grid-column:1/3">Y floor <input id="r_y" type="number" value="0" step="0.01" style="width:72px"></label>
            <label>Snap <input id="r_snap" type="checkbox" checked></label>
            <label>Step <input id="r_step" type="number" value="0.5" step="0.1" min="0.05" style="width:60px"></label>
          </div>
        </div>

        <div style="margin-bottom:8px;border-bottom:1px solid #044;padding-bottom:6px;">
          <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
            <button id="mode_room" class="btn" style="border-color:#0aa;color:#0ff;">Room Mode</button>
            <button id="mode_door" class="btn">Door Mode</button>
            <label>door width <input id="door_w" type="number" value="1.0" step="0.05" min="0.4" style="width:60px"></label>
          </div>
          <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;">
            <button id="copy_room" class="btn">Copy Room</button>
            <button id="paste_room" class="btn" title="Paste (click to place)">Paste</button>
          </div>
        </div>

        <div style="margin-bottom:8px;border-bottom:1px solid #044;padding-bottom:6px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <b style="color:#0ff">Pick Material</b>
            <label>U <input id="mat_u" type="number" value="2" step="0.25" style="width:50px"></label>
            <label>V <input id="mat_v" type="number" value="2" step="0.25" style="width:50px"></label>
            <button id="mat_apply" class="btn">Apply</button>
          </div>
          <div id="mat_grid" style="display:grid;grid-template-columns:repeat(5, 56px);gap:6px;"></div>
        </div>

        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <label><input id="snap_grid" type="checkbox" checked> Snap to grid</label>
          <label><input id="snap_endp" type="checkbox" checked> Snap to endpoints</label>
          <button id="btn_redo" class="btn">Redo</button>
          <button id="btn_reset" class="btn">Reset</button>
          <button id="btn_clear" class="btn" style="color:#faa;border-color:#933;">Clear</button>
        </div>
      `;
      document.body.appendChild(box);
      this.root = box;

      // Style for .btn reused
      ensureButtonCSS();

      // Wire buttons
      const $ = (id)=> box.querySelector(id);

      // Draw block
      $("#r_draw").onclick   = ()=> B.beginRoom({ y:+$("#r_y").value||0, snap:$("#r_snap").checked, step:+$("#r_step").value||0.5 });
      $("#r_finish").onclick = ()=> B.finishRoom();
      $("#r_cancel").onclick = ()=> B.cancelRoom();
      $("#r_undo").onclick   = ()=> B.undoPoint();

      // Modes
      $("#mode_room").onclick = ()=> setMode('room');
      $("#mode_door").onclick = ()=> setMode('door');
      $("#door_w").oninput    = ()=> B.setDoorW(+$("#door_w").value||1.0);

      // Copy / Paste
      $("#copy_room").onclick  = ()=> B.copyRoom();
      $("#paste_room").onclick = ()=> B.pasteRoom();

      // Grid/snapping changes (apply live)
      $("#snap_grid").onchange = applyGrid;
      $("#r_step").onchange    = applyGrid;
      function applyGrid(){
        B.setGrid && B.setGrid({ snap: $("#snap_grid").checked, step: +$("#r_step").value||0.5 });
      }

      // Redo/Reset/Clear
      $("#btn_redo").onclick  = ()=> B.redoPoint ? B.redoPoint() : (window.Builder?.redo?.());
      $("#btn_reset").onclick = ()=> B.resetSel();
      $("#btn_clear").onclick = ()=> {
        if (confirm("Clear all rooms/walls on current floor?")) B.clear();
      };

      // Build the material grid
      buildMatGrid($("#mat_grid"));

      // Apply material
      $("#mat_apply").onclick = ()=>{
        if (!UI._selMatKey) return toast("Pick a material first.");
        const u = +$("#mat_u").value || 1;
        const v = +$("#mat_v").value || 1;
        const s = window.scene || window.SCENE;
        if (!s) return;
        const mat = getOrCreateMaterial(s, UI._selMatKey, {uScale:u, vScale:v});
        // Let Builder apply, else try to apply to a currently highlighted mesh
        if (B.applyMat) {
          B.applyMat(UI._selMatKey, {uScale:u, vScale:v, material:mat});
        } else {
          // fallback: try to apply to a mesh named "Selection"
          const sel = (s.meshes||[]).find(m=>m.name==="Selection" || m.metadata?.builder?.isSelected);
          if (sel) sel.material = mat;
        }
      };

      // Initial mode
      setMode('room');
      applyGrid();
    }
  };

  UI._selMatKey = null;

  function setMode(mode){
    B.setMode && B.setMode(mode);
    const roomBtn = UI.root.querySelector("#mode_room");
    const doorBtn = UI.root.querySelector("#mode_door");
    if (mode === 'room'){
      roomBtn.style.borderColor="#0aa"; roomBtn.style.color="#0ff";
      doorBtn.style.borderColor="#066"; doorBtn.style.color="#9ff";
    } else {
      doorBtn.style.borderColor="#0aa"; doorBtn.style.color="#0ff";
      roomBtn.style.borderColor="#066"; roomBtn.style.color="#9ff";
    }
  }

  function buildMatGrid(container){
    container.innerHTML = "";
    MATERIAL_KEYS.forEach(key=>{
      const cell = document.createElement("div");
      cell.style.cssText = [
        "width:56px","height:56px","border:1px solid #044","border-radius:6px",
        "overflow:hidden","cursor:pointer","display:flex","align-items:center","justify-content:center",
        "background:#111","position:relative"
      ].join(";");

      const img = makeMatThumb(key);
      img.style.cssText = "max-width:100%;max-height:100%;object-fit:cover;display:block;";

      const tag = document.createElement("div");
      tag.textContent = key.replace(/_/g," ");
      tag.style.cssText = "position:absolute;left:2px;bottom:2px;font-size:9px;color:#adf;background:rgba(0,0,0,0.55);padding:1px 2px;border-radius:3px;";

      cell.appendChild(img);
      cell.appendChild(tag);

      cell.onclick = ()=>{
        // highlight
        [...container.children].forEach(n=> n.style.outline="none");
        cell.style.outline = "2px solid #0ff";
        UI._selMatKey = key;
      };

      container.appendChild(cell);
    });
  }

  function ensureButtonCSS(){
    if (document.getElementById("rooms-btn-css")) return;
    const css = document.createElement("style");
    css.id = "rooms-btn-css";
    css.textContent = `
      #rooms-panel .btn{
        border:1px solid #066;background:#111;color:#9ff;
        padding:4px 8px;border-radius:8px;cursor:pointer;user-select:none;
      }
      #rooms-panel .btn:active{ transform: translateY(1px); }
      #rooms-panel input{ background:#000;color:#0ff;border:1px solid #066;border-radius:6px;padding:2px 5px;}
    `;
    document.head.appendChild(css);
  }

  function toast(msg){
    try{
      if (window.toast) return window.toast(msg, 1000);
      console.log("[builder_rooms]", msg);
    }catch{}
  }

  // ------------------------------------------------------------
  // Boot once scene is around (just for material creation)
  // ------------------------------------------------------------
  (function boot(){
    try {
      UI.build();
    } catch (e) {
      console.warn("[builder_rooms] init failed, retrying…", e);
      setTimeout(boot, 200);
    }
  })();

})();
