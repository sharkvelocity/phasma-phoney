/**
 * modular_settings.js (updated)
 * Drop this BEFORE all other game systems.
 * Exposes global config on window.PP for controls, tuning, and rules.
 */
(function () {
  window.PP = window.PP || {};

  /* ------------ Controls (keys & movement tuning) ------------ */
  PP.controls = {
    keys: {
      // Movement
      forward:   ['KeyW','ArrowUp'],
      back:      ['KeyS','ArrowDown'],
      left:      ['KeyA','ArrowLeft'],
      right:     ['KeyD','ArrowRight'],
      sprint:    ['ShiftLeft','ShiftRight'],

      // Belt slots: exactly 1–3 (lighter is separate on Digit4)
      slots:     ['Digit1','Digit2','Digit3'],
      lighter:   ['Digit4'],

      // Core actions
      use:       ['Space'],   // “Use” active item
      interact:  ['KeyE'],    // Doors & ground/placed tools (e.g., Spirit Box on floor)
      notebook:  ['KeyN'],
      minimap:   ['KeyM'],

      // Lighting / environment
      flash:       ['KeyF'],  // flashlight (held/headgear)
      uv:          ['KeyU'],
      ir:          ['KeyI'],
      lightToggle: ['KeyL'],  // nearest house light
      powerToggle: ['KeyP'],  // house breaker

      // Camera
      cameraToggle: ['KeyV']  // FP <-> TP
    },

    // Movement tuning (from your refs)
    strideWalk: 1.2,
    strideRun:  0.8,
    speedWalk:  0.90,
    speedRun:   1.80,

    // Camera feel (used by rig if present)
    mouseSens:       0.002,
    touchLookSens:   0.0022,

    allowFly: false,
    godMode:  false
  };

  /* ------------ Ghost / Hunt / Sanity tuning ------------ */
  PP.ghost = {
    // Sanity drain per second
    baseSanityDrain: 0.6 / 60,
    nearSanityDrain: 1.2 / 60,
    nearDistance:    7.0,

    // Hunt pacing
    huntSanityThreshold: 65,
    huntCooldownMin:     22,
    huntCooldownMax:     40,   // 22 + Math.random()*18
    huntChanceBelow40:   0.85,
    huntChanceAbove40:   0.55,

    // Ghost locomotion
    speed:             1.4,
    stepIntervalWalk:  0.55,
    stepIntervalHunt:  0.48,
    footAudible:       18,

    // Twins behavior
    twinsSeparationMin: 10.0,
    twinsSeparationMax: 12.0,

    // Crucifix
    crucifixBaseRadius:  3.0,
    crucifixDemonRadius: 5.0
  };

  /* ------------ Weather modifiers (sanity/hunt multipliers) ------------ */
  // Match names used by weather.js exactly: Clear | Rainstorm | Snow | Bloodmoon
  PP.weatherMods = {
    Clear:     { sanity: 1.00, huntChance: 1.00, huntPace: 1.00 },
    Rainstorm: { sanity: 1.00, huntChance: 1.00, huntPace: 1.00 },
    Snow:      { sanity: 0.95, huntChance: 1.00, huntPace: 1.00 },
    Bloodmoon: { sanity: 1.25, huntChance: 1.40, huntPace: 1.20 }
  };

  /* ------------ Placeables / rules ------------ */
  PP.rules = {
    crucifixBaseRadius:  3.0,
    crucifixDemonRadius: 5.0
  };

  /* ------------ Lightweight shared state ------------ */
  PP.state = PP.state || {
    running: false,
    controls: { forward:false, back:false, left:false, right:false },
    selectedSlot: 1   // 1..3 (belt). Lighter is separate.
  };
})();
