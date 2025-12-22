// ./assets/index3/icons.js
// Resolves item names -> icon images from ./assets/icons/, with smart fallbacks.

(function(){
  "use strict";

  // Where your icons live (change if needed)
  window.ICON_BASE = window.ICON_BASE || "./assets/icons/";

  // Optional: explicit per-item mappings you want to force
  window.ITEM_ICON_MAP = window.ITEM_ICON_MAP || {
    // "Salt": "./assets/icons/salt.png",
    // "Spirit Box": "./assets/icons/spirit_box.png",
  };

  // Common aliases → filename stems we’ll try
  const ICON_ALIASES = {
    "salt":            ["salt","salt_shaker"],
    "dots":            ["dots","dots_projector","projector"],
    "uv":              ["uv","uv_light","uvprints","fingerprints"],
    "uv prints":       ["uv_prints","uvprints","fingerprints","uv"],
    "writing book":    ["writing_book","book","journal","notebook"],
    "spirit box":      ["spirit_box","spiritbox","box"],
    "lighter":         ["lighter"],
    "notebook":        ["notebook","journal"]
  };

  const EXT_ORDER = [".png",".webp",".svg",".jpg",".gif"];

  function norm(s){
    return (s||"").toLowerCase().replace(/\s+/g,"_").replace(/[^a-z0-9_]/g,"");
  }

  function candidatesFor(itemName){
    const out = [];
    const nice = String(itemName||"");
    // 1) explicit mapping
    if (window.ITEM_ICON_MAP[nice]) out.push(window.ITEM_ICON_MAP[nice]);

    // 2) ItemRegistry metadata (if your storage/register system provides it)
    try{
      const meta = window.ItemRegistry?.getMeta?.(nice);
      if (meta?.icon) out.push(meta.icon);
    }catch(_){}

    // 3) generated guesses (aliases + normalized)
    const n = norm(nice);
    const stems = new Set([ n, ...(ICON_ALIASES[nice.toLowerCase()]||[]), ...(ICON_ALIASES[n]||[]) ]);
    for (const stem of stems){
      for (const ext of EXT_ORDER){
        out.push(window.ICON_BASE + stem + ext);
      }
    }
    return out.filter(Boolean);
  }

  // Builds an <img> that cycles through candidates on error until one loads
  window.createItemIconEl = function createItemIconEl(itemName, maxSize = 60){
    if (!itemName) return null;
    const tries = candidatesFor(itemName);
    if (!tries.length) return null;

    const img = document.createElement("img");
    img.alt = itemName;
    img.style.maxWidth = maxSize+"px";
    img.style.maxHeight = maxSize+"px";
    img.style.objectFit = "contain";
    img.style.imageRendering = "crisp-edges";
    img.dataset.i = "0";
    img.dataset.tries = JSON.stringify(tries);

    function setNext(){
      const list = JSON.parse(img.dataset.tries||"[]");
      let i = parseInt(img.dataset.i||"0",10);
      if (i >= list.length) {
        // give up
        img.replaceWith(document.createTextNode(itemName));
        return;
      }
      img.src = list[i];
      img.dataset.i = String(i+1);
    }
    img.onerror = setNext;
    setNext(); // kick off

    return img;
  };

  // Allow runtime registration (optional)
  window.registerIcon = function(name, url){
    window.ITEM_ICON_MAP[name] = url;
  };

})();
