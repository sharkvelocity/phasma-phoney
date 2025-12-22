// ./assets/index3/reticle.js
// Center reticle with aim-detect highlight and simple API.

(function () {
  "use strict";

  // --- defaults (you can override via window.RETICLE_OPTS before this script) ---
  let RETICLE_OPTS = Object.assign({
    visible: true,
    style: "cross",   // "cross" | "dot" | "circle-dot"
    size: 18,         // overall size in px
    thickness: 2,     // line stroke width
    gap: 4,           // gap from center for cross
    color: "#0ff",    // normal color
    hitColor: "#0f0", // when aiming at pickable target
    opacity: 0.95,
    maxAimDistance: 3.0 // meters
  }, (window.RETICLE_OPTS || {}));

  function injectCSS() {
    if (document.getElementById("reticle-style")) return;
    const css = `
      #reticle{
        position:fixed; left:50%; top:50%; transform:translate(-50%,-50%);
        z-index:6500; pointer-events:none; opacity:${RETICLE_OPTS.opacity};
        transition: transform 120ms ease, opacity 120ms ease;
      }
      #reticle svg { display:block; }
    `;
    const s = document.createElement("style");
    s.id = "reticle-style";
    s.textContent = css;
    document.head.appendChild(s);
  }

  function makeCrossSVG({ size, thickness, gap, color }) {
    const s = size, g = gap, half = s / 2, len = half - g;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", s);
    svg.setAttribute("height", s);
    svg.setAttribute("viewBox", `0 0 ${s} ${s}`);
    const mk = (x1, y1, x2, y2) => {
      const l = document.createElementNS(svg.namespaceURI, "line");
      l.setAttribute("x1", x1); l.setAttribute("y1", y1);
      l.setAttribute("x2", x2); l.setAttribute("y2", y2);
      l.setAttribute("stroke", color);
      l.setAttribute("stroke-width", thickness);
      l.setAttribute("stroke-linecap", "round");
      return l;
    };
    svg.appendChild(mk(half, half - g - len, half, half - g)); // top
    svg.appendChild(mk(half, half + g,       half, half + g + len)); // bottom
    svg.appendChild(mk(half - g - len, half, half - g, half)); // left
    svg.appendChild(mk(half + g, half,       half + g + len, half)); // right
    return svg;
  }

  function makeDotSVG({ size, thickness, color, withCircle }) {
    const s = size;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", s);
    svg.setAttribute("height", s);
    svg.setAttribute("viewBox", `0 0 ${s} ${s}`);
    const cx = s / 2, cy = s / 2;
    if (withCircle) {
      const ring = document.createElementNS(svg.namespaceURI, "circle");
      ring.setAttribute("cx", cx); ring.setAttribute("cy", cy);
      ring.setAttribute("r", (s / 2) - thickness);
      ring.setAttribute("fill", "none");
      ring.setAttribute("stroke", color);
      ring.setAttribute("stroke-width", thickness);
      svg.appendChild(ring);
    }
    const dot = document.createElementNS(svg.namespaceURI, "circle");
    dot.setAttribute("cx", cx); dot.setAttribute("cy", cy);
    dot.setAttribute("r", Math.max(1, thickness));
    dot.setAttribute("fill", color);
    svg.appendChild(dot);
    return svg;
  }

  function buildSVG(opts) {
    if (opts.style === "dot")        return makeDotSVG(opts);
    if (opts.style === "circle-dot") return makeDotSVG(Object.assign({}, opts, { withCircle: true }));
    return makeCrossSVG(opts); // default cross
  }

  // --- mount ---
  let WRAP, SVG;
  function mount() {
    injectCSS();
    WRAP = document.getElementById("reticle");
    if (!WRAP) {
      WRAP = document.createElement("div");
      WRAP.id = "reticle";
      document.body.appendChild(WRAP);
    }
    WRAP.innerHTML = "";
    SVG = buildSVG(RETICLE_OPTS);
    WRAP.appendChild(SVG);
    setReticleVisible(!!RETICLE_OPTS.visible);
  }

  // --- public API ---
  function setReticleVisible(v) {
    if (!WRAP) return;
    WRAP.style.display = v ? "block" : "none";
  }
  function setReticleColor(c) {
    SVG?.querySelectorAll("line,circle,path").forEach(el => {
      if (el.tagName === "circle" && el.getAttribute("fill") !== "none") {
        el.setAttribute("fill", c);
      }
      el.setAttribute("stroke", c);
    });
  }
  function reticleFlash(ms = 140, color = RETICLE_OPTS.hitColor) {
    if (!WRAP) return;
    const prev = getComputedStyle(SVG.querySelector("line,circle,path")).stroke || RETICLE_OPTS.color;
    setReticleColor(color);
    WRAP.style.transform = "translate(-50%,-50%) scale(1.25)";
    WRAP.style.opacity = "1";
    setTimeout(() => {
      setReticleColor(prev);
      WRAP.style.transform = "translate(-50%,-50%) scale(1)";
      WRAP.style.opacity = RETICLE_OPTS.opacity;
    }, ms);
  }
  function reticleSetStyle(newOpts) {
    RETICLE_OPTS = Object.assign(RETICLE_OPTS, newOpts || {});
    mount();
  }

  // expose
  window.setReticleVisible = setReticleVisible;
  window.setReticleColor   = setReticleColor;
  window.reticleFlash      = reticleFlash;
  window.reticleSetStyle   = reticleSetStyle;

  // --- aim detection (highlights when aiming at pickable) ---
  function startAimCheck() {
    const scene = window.scene || BABYLON.Engine?.LastCreatedScene;
    if (!scene) return;
    let last = 0;
    scene.onBeforeRenderObservable.add(() => {
      const now = performance.now();
      if (now - last < 80) return; // ~12.5 fps check
      last = now;
      try {
        const cam = window.camera; if (!cam) return;
        const dir = cam.getForwardRay().direction;
        const ray = new BABYLON.Ray(cam.position, dir, RETICLE_OPTS.maxAimDistance);
        const hit = scene.pickWithRay(ray, m => m && m.isPickable !== false);
        setReticleColor(hit?.hit ? RETICLE_OPTS.hitColor : RETICLE_OPTS.color);
      } catch (_) {}
    });
  }

  // optional: Alt+R toggles visibility
  window.addEventListener("keydown", (e) => {
    if ((e.key === "r" || e.key === "R") && e.altKey) {
      const vis = (WRAP?.style.display !== "none");
      setReticleVisible(!vis);
    }
  });

  // init
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { mount(); startAimCheck(); });
  } else {
    mount(); startAimCheck();
  }
})();
