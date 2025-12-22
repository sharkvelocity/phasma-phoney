/**
 * modular_bindings.js (keyboard + PS5 controller)
 * - Unified input for keyboard and DualSense (PS5) controllers.
 * - Keyboard: WASD/keys as before.
 * - Controller: Maps Phasmophobia-like layout into the same state/slots/events.
 * - Exposes PP.getMovementFlags() and PP.getSpeeds().
 */
(function () {
  if (window.__PP_BINDINGS__) return; window.__PP_BINDINGS__ = true;

  const PP = (window.PP = window.PP || {});
  const C  = (PP.controls = PP.controls || {});
  PP.state = PP.state || {};
  PP.state.controls = PP.state.controls || { forward:false, back:false, left:false, right:false };
  PP.state.selectedSlot = PP.state.selectedSlot || 1;   // 1..3; 4 is lighter (no slot)
  PP.state.running = false;

  const Keys = Object.create(null);
  const F = PP.state.controls;

  // ---------- helpers ----------
  const has = (arr, code) => Array.isArray(arr) && arr.includes(code);

  function S(){ 
    return window.SCENE || window.scene || 
           (window.ENGINE && ENGINE.scenes && ENGINE.scenes[0]) || null; 
  }

  function uiBusy() {
    const ae = document.activeElement;
    if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) return true;
    if (document.getElementById('notebook-modal')?.style?.display !== 'none') return true;
    return false;
  }

  function emit(name, detail) {
    try { window.dispatchEvent(new CustomEvent(name, { detail })); } catch {}
  }

  function selectSlot(n) {
    n = Math.max(1, Math.min(3, n|0));
    const prev = PP.state.selectedSlot;
    if (prev === n) {
      emit('pp:slot:confirm', { slot: n });
      return;
    }
    PP.state.selectedSlot = n;
    emit('pp:slot:change', { prev, next: n });

    if (typeof window.selectSlot === 'function') window.selectSlot(n);
    if (typeof window.buildBelt === 'function')  { try { window.buildBelt(null); } catch {} }
    if (typeof window.refreshCameraOverlay === 'function') { try { window.refreshCameraOverlay(); } catch {} }
  }

  const syncHeldLights = () => { if (typeof window.syncHeldLights === 'function') window.syncHeldLights(); };
  const toggleNearestHouseLight = () => { if (typeof window.toggleNearestHouseLight === 'function') window.toggleNearestHouseLight(); };
  const setHousePower = (on) => { if (typeof window.setHousePower === 'function') window.setHousePower(on); };

  function preventIfNeeded(e){
    const block = ['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
    if (block.includes(e.code)) e.preventDefault();
  }

  // ---------- Keyboard ----------
  addEventListener('keydown', (e) => {
    Keys[e.code] = true;
    preventIfNeeded(e);
    if (uiBusy()) return;

    if (has(C.keys?.forward, e.code)) F.forward = true;
    if (has(C.keys?.back,    e.code)) F.back    = true;
    if (has(C.keys?.left,    e.code)) F.left    = true;
    if (has(C.keys?.right,   e.code)) F.right   = true;
    if (has(C.keys?.sprint,  e.code)) PP.state.running = true;

    if (C.keys?.slots?.includes(e.code)) {
      const n = parseInt(e.code.replace(/\D/g, ''), 10) || 0;
      if (n >= 1 && n <= 3) {
        selectSlot(n);
        return;
      }
    }

    if (has(C.keys?.notebook, e.code) && typeof window.openNotebook === 'function') window.openNotebook();
    if (has(C.keys?.openDoor, e.code) && typeof window.openDoorNearby === 'function') window.openDoorNearby();
    if (has(C.keys?.use,      e.code) && typeof window.useActiveItem === 'function') window.useActiveItem();
    if (has(C.keys?.minimap,  e.code) && typeof window.toggleMinimap === 'function') window.toggleMinimap();

    if (has(C.keys?.flash, e.code)) { window.flashOn = !window.flashOn; window.uvOn=false; window.irOn=false; syncHeldLights(); }
    if (has(C.keys?.uv,    e.code)) { window.uvOn = !window.uvOn; window.flashOn=false; window.irOn=false; syncHeldLights(); }
    if (has(C.keys?.ir,    e.code)) { window.irOn = !window.irOn; window.flashOn=false; window.uvOn=false; syncHeldLights(); if (typeof window.refreshCameraOverlay==='function') window.refreshCameraOverlay(); }
    if (has(C.keys?.lightToggle, e.code)) toggleNearestHouseLight();
    if (has(C.keys?.powerToggle, e.code)) setHousePower(!window.housePower);
  }, { capture: true });

  addEventListener('keyup', (e) => {
    Keys[e.code] = false;
    if (has(C.keys?.forward, e.code)) F.forward = false;
    if (has(C.keys?.back,    e.code)) F.back    = false;
    if (has(C.keys?.left,    e.code)) F.left    = false;
    if (has(C.keys?.right,   e.code)) F.right   = false;
    if (has(C.keys?.sprint,  e.code)) PP.state.running = false;
  }, { capture: true });

  // ---------- PS5 Controller ----------
  const ps5Bindings = {
    // left stick = movement
    stick: { threshold: 0.25 },
    buttons: {
      0: () => { if (typeof window.useActiveItem === 'function') window.useActiveItem(); }, // X
      1: () => { if (typeof window.dropItem === 'function') window.dropItem(); },           // Circle
      2: () => { if (typeof window.pickupItem === 'function') window.pickupItem(); },       // Square
      3: () => selectSlot((PP.state.selectedSlot % 3) + 1),                                 // Triangle cycle
      9: () => { F.crouch = !F.crouch; emit('pp:crouch', { crouch: F.crouch }); },          // R3
      10: () => { F.crouch = !F.crouch; emit('pp:crouch', { crouch: F.crouch }); },         // L3
      4: () => { PP.state.running = true; },                                               // L1 hold = sprint
      6: () => { if (typeof window.placeItem === 'function') window.placeItem(); },         // L2
      7: () => { if (typeof window.interact === 'function') window.interact(); },           // R2
      13: () => { window.flashOn = !window.flashOn; syncHeldLights(); }                     // D-pad Down
    }
  };

  function pollController() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = pads[0]; // assume first
    if (pad) {
      const axLH = pad.axes[0] || 0, axLV = pad.axes[1] || 0;
      F.left  = axLH < -ps5Bindings.stick.threshold;
      F.right = axLH >  ps5Bindings.stick.threshold;
      F.forward = axLV < -ps5Bindings.stick.threshold;
      F.back    = axLV >  ps5Bindings.stick.threshold;

      pad.buttons.forEach((btn, i) => {
        if (btn.pressed && ps5Bindings.buttons[i]) {
          try { ps5Bindings.buttons[i](); } catch {}
        }
        if (i === 4 && !btn.pressed) PP.state.running = false; // release sprint
      });
    }
    requestAnimationFrame(pollController);
  }
  pollController();

  // ---------- Footsteps ----------
  (function footsteps() {
    const s = S(); if (!s || !s.activeCamera) return setTimeout(footsteps, 200);
    const cam = s.activeCamera, st = { last: null, acc: 0 };
    (function tick(){
      const now = cam.position?.clone?.() || cam.position || new BABYLON.Vector3();
      if (!st.last) st.last = now;
      const d = BABYLON.Vector3.Distance(now, st.last);
      st.last = now;

      const moving = F.forward || F.back || F.left || F.right;
      if (moving){
        st.acc += d;
        const stride = (PP.state.running ? (PP.controls.strideRun || 0.8) : (PP.controls.strideWalk || 1.2));
        if (st.acc >= stride){
          st.acc = 0;
          if (typeof window.playStep === 'function') { try { window.playStep(0.42); } catch {} }
        }
      }
      requestAnimationFrame(tick);
    })();
  })();

  // ---------- Exports ----------
  PP.getMovementFlags = () => ({ ...F, running: !!PP.state.running, crouch: !!F.crouch });
  PP.getSpeeds        = () => ({ walk: PP.controls.speedWalk || 0.9, run: PP.controls.speedRun || 1.8 });

  window.addEventListener('pp:start', () => {
    try { if (typeof window.buildBelt === 'function') window.buildBelt(null); } catch {}
  }, { once: true });

})();
