// ps5_controller.js — ties PS5 buttons to PP.rig controller
(function(){
  "use strict";

  if(window.__PP_PS5_READY__) return;
  window.__PP_PS5_READY__ = true;

  const PAD = { lastButtons: [], polling: false };

  function ensureRig(){ return window.PP && PP.rig && PP.rig.body; }

  function pressButton(btnIndex){
    if(!ensureRig()) return;
    const rig = PP.rig;
    const state = PP.state;

    switch(btnIndex){
      case 0: // X — Use item
        if(typeof window.useItem === "function") window.useItem();
        break;
      case 1: // Circle — Drop / Toss
        if(typeof window.dropItem === "function") window.dropItem();
        break;
      case 2: // Triangle — Cycle items
        if(typeof window.cycleItems === "function") window.cycleItems();
        break;
      case 3: // Square — Pickup
        if(typeof window.pickupItem === "function") window.pickupItem();
        break;
      case 4: // L1 — Sprint / Run
        state.run = true;
        break;
      case 5: // R1 — undefined
        break;
      case 6: // L2 — Place
        if(typeof window.placeItem === "function") window.placeItem();
        break;
      case 7: // R2 — Interact (doors, switches)
        if(typeof window.openDoor === "function") window.openDoor();
        break;
      case 8: // L3 — Crouch
      case 9: // R3 — Crouch
        state.crouch = !state.crouch;
        break;
      case 12: // D-pad Up — optional
      case 13: // D-pad Down — Toggle light
        if(typeof window.toggleLight === "function") window.toggleLight();
        break;
      default: break;
    }
  }

  function releaseButton(btnIndex){
    if(!ensureRig()) return;
    switch(btnIndex){
      case 4: // L1 — stop sprint
        PP.state.run = false;
        break;
      default: break;
    }
  }

  function pollGamepad(){
    const pads = navigator.getGamepads?.();
    if(!pads) return;
    const pad = pads[0];
    if(!pad) return;

    pad.buttons.forEach((b, i) => {
      if(b.pressed && !PAD.lastButtons[i]){
        pressButton(i);
      } else if(!b.pressed && PAD.lastButtons[i]){
        releaseButton(i);
      }
      PAD.lastButtons[i] = b.pressed;
    });

    requestAnimationFrame(pollGamepad);
  }

  pollGamepad();
})();
