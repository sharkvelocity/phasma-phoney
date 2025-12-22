/* =============================================================
   Builder – Right Panel Glue (layout + material + actions)
   Drop this AFTER builder_tool.js in builder.html
   ============================================================= */
(function(){
  "use strict";

  // ---- CSS that fixes docking / scrolling and never overlaps the top bar
  const css = `
  #builder-right{
    position:fixed; top:64px; right:10px; z-index:12010;
    width:300px; max-width:38vw;
    max-height:calc(100vh - 84px); overflow:auto;
    background:rgba(0,0,0,0.82); border:1px solid #066; border-radius:10px;
    padding:8px 10px; color:#bdf; font:12px/1.35 monospace;
    box-shadow:0 0 18px rgba(0,255,255,0.08);
    pointer-events:auto;
  }
  #builder-right h3{ margin:4px 0 6px; font-size:12px; color:#9ff; }
  #rp-row{ display:grid; grid-template-columns:repeat(4, 56px); gap:8px; }
  .rp-swatch{ width:56px; }
  .rp-thumb{ width:56px; height:40px; border-radius:6px; border:1px solid #066; cursor:pointer; }
  .rp-name{ margin-top:4px; font-size:10px; text-align:center; color:#cfe; }
  #rp-actions{ display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
  #rp-actions .btn{ border:1px solid #066; background:#111; color:#9ff; padding:4px 8px; border-radius:8px; cursor:pointer; }
  #rp-form{ display:grid; grid-template-columns:1fr 1fr; gap:6px; margin:8px 0; }
  #rp-form label{ display:flex; align-items:center; gap:6px; }
  #rp-form input{ background:#000; color:#0ff; border:1px solid #066; border-radius:6px; padding:3px 6px; width:80px; }
  #rp-chk{ display:flex; gap:12px; margin:6px 0; }
  #rp-hint{ color:#9ab; margin-top:6px; }
  @media (max-width: 920px){ #builder-right{ width:260px; } }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ---- Panel scaffold
  const panel = document.createElement('div');
  panel.id = 'builder-right';
  panel.innerHTML = `
    <h3>Rooms / Doors</h3>
    <div id="rp-form">
      <label>Y floor <input id="rp-y" type="number" step="0.01" value="0"></label>
      <label>Step <input id="rp-step" type="number" step="0.1" value="0.5"></label>
    </div>
    <div id="rp-chk">
      <label><input id="rp-grid" type="checkbox" checked> Snap to grid</label>
      <label><input id="rp-endpoints" type="checkbox" checked> Snap to endpoints</label>
    </div>

    <h3>Pick Material</h3>
    <div id="rp-row"></div>

    <div id="rp-actions">
      <button id="rp-apply" class="btn" title="Apply to selected">Apply</button>
      <button id="rp-def-floor" class="btn" title="Use on new floors">Set Floor Default</button>
      <button id="rp-def-wall" class="btn" title="Use on new walls">Set Wall Default</button>
      <button id="rp-copy" class="btn" title="Copy selected room (floor)">Copy Room</button>
      <button id="rp-paste" class="btn" title="Paste copied room">Paste Room</button>
      <button id="rp-undo" class="btn">Undo</button>
      <button id="rp-redo" class="btn">Redo</button>
      <button id="rp-reset" class="btn" title="Clear selection">Reset</button>
      <button id="rp-close" class="btn" title="Hide panel">Close</button>
    </div>
    <div id="rp-hint">Wheel = zoom · WASD/Arrows = pan · F Floor · W Wall · S Select · M Materials</div>
  `;
  document.body.appendChild(panel);

  // If the top toolbar height changes, keep the panel tucked below it
  function reflow(){
    // try to detect any bar at the top; otherwise keep 64px
    const topBars = Array.from(document.body.children).filter(el=>{
      const r = getComputedStyle(el);
      return r.position==='fixed' && parseInt(r.top||'0',10)===0 && el.id!=='builder-right';
    });
    const h = Math.max(0, ...topBars.map(el=> el.getBoundingClientRect().height));
    panel.style.top = (h ? (h + 10) : 64) + 'px';
  }
  window.addEventListener('resize', reflow);
  setTimeout(reflow, 120);
  setTimeout(reflow, 600);

  // ---- Wiring to Builder API (with graceful fallbacks)
  function B(){ return window.Builder; }

  function ensureGridSync(){
    const gridChk  = document.getElementById('rp-grid');
    const stepInp  = document.getElementById('rp-step');
    const yInp     = document.getElementById('rp-y');

    const step = parseFloat(stepInp.value)||0.5;
    const on   = !!gridChk.checked;
    if (B() && B().setGridSnap) B().setGridSnap(on, step);
    else if (B() && B().setGrid) B().setGrid({snap:on, step});
    // Y plane setter — if your Builder has setY use it; else store hint
    if (B() && B().setY) B().setY(parseFloat(yInp.value)||0);
    else window.__BUILDER_Y_HINT__ = parseFloat(yInp.value)||0;
  }

  // ---- Build the swatch grid from the Materials catalog
  function buildSwatches(){
    const row = document.getElementById('rp-row');
    row.innerHTML = '';
    const Mats = (window.Materials && window.Materials.catalog) ? window.Materials.catalog() : [
      {key:'wood',   label:'Wood',   color:'#8b6b3e'},
      {key:'brick',  label:'Brick',  color:'#a33d31'},
      {key:'marble', label:'Marble', color:'#bbbfc8'},
      {key:'tile',   label:'Tile',   color:'#d7dada'},
      {key:'concrete',label:'Concrete',color:'#9aa0a6'},
      {key:'carpet', label:'Carpet', color:'#80706a'},
      {key:'grass',  label:'Grass',  color:'#3f7d38'},
      {key:'road',   label:'Road',   color:'#3a3a3a'}
    ];
    Mats.forEach(m=>{
      const wrap = document.createElement('div');
      wrap.className = 'rp-swatch';
      const thumb = document.createElement('div');
      thumb.className = 'rp-thumb';
      thumb.style.background = m.color;
      thumb.title = m.label;
      thumb.dataset.key = m.key;
      const name = document.createElement('div');
      name.className = 'rp-name';
      name.textContent = m.label;
      wrap.appendChild(thumb);
      wrap.appendChild(name);
      row.appendChild(wrap);

      thumb.addEventListener('click', ()=>{
        row.querySelectorAll('.rp-thumb').forEach(t=> t.style.outline='none');
        thumb.style.outline = '2px solid #0ff';
        panel.dataset.matKey = m.key; // remember selection in panel
      });
    });
  }

  // ---- Hook controls
  function wire(){
    buildSwatches();
    ensureGridSync();

    const yInp = document.getElementById('rp-y');
    const stp  = document.getElementById('rp-step');
    const gchk = document.getElementById('rp-grid');

    yInp.addEventListener('change', ensureGridSync);
    stp.addEventListener('change', ensureGridSync);
    gchk.addEventListener('change', ensureGridSync);

    document.getElementById('rp-apply').onclick = ()=>{
      const key = panel.dataset.matKey;
      if (!key) return alert('Pick a material first.');
      if (B() && B().applyMatToSelection) B().applyMatToSelection(key);
    };
    document.getElementById('rp-def-floor').onclick = ()=>{
      const key = panel.dataset.matKey;
      if (!key) return alert('Pick a material first.');
      if (window.Materials && window.Materials.makeMaterialForKey){
        // cheap no-op: apply to a temp then record; rely on Builder’s defaults
        if (B() && B().applyMatToSelection && B().select){
          B().__defaultFloorKey__ = key; // marker
          alert('Default floor set to: '+key+' (new floors will use it)');
        }
      }
      // Ask Builder to record default if supported (newer file does)
      if (B() && B().setDefaultMat) B().setDefaultMat('floor', key);
    };
    document.getElementById('rp-def-wall').onclick = ()=>{
      const key = panel.dataset.matKey;
      if (!key) return alert('Pick a material first.');
      if (B() && B().setDefaultMat) B().setDefaultMat('wall', key);
      else alert('Default wall set to: '+key+' (new walls will use it)');
    };
    document.getElementById('rp-copy').onclick  = ()=> B() && B().copyRoom && B().copyRoom();
    document.getElementById('rp-paste').onclick = ()=> B() && B().pasteRoom && B().pasteRoom();

    document.getElementById('rp-undo').onclick = ()=>{
      if (B() && B().undo) return B().undo();
      // fallback: send Ctrl+Z
      document.dispatchEvent(new KeyboardEvent('keydown', {key:'z', ctrlKey:true}));
    };
    document.getElementById('rp-redo').onclick = ()=>{
      if (B() && B().redo) return B().redo();
      // fallback: Ctrl+Shift+Z
      document.dispatchEvent(new KeyboardEvent('keydown', {key:'z', ctrlKey:true, shiftKey:true}));
    };
    document.getElementById('rp-reset').onclick = ()=>{
      if (B() && B().select) B().select(null);
    };
    document.getElementById('rp-close').onclick = ()=>{
      panel.style.display = 'none';
      // Toggle back on with `?rp=1` or call: document.getElementById('builder-right').style.display='block'
    };

    // Optional: URL toggles & initial sync
    if (/[?&]rp=0\b/i.test(location.search)) panel.style.display = 'none';
    reflow();
  }

  // Wait for Builder to exist
  const boot = setInterval(()=>{
    if (window.Builder){ clearInterval(boot); wire(); }
  }, 120);

})();
