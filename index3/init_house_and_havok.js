// Enables Havok, builds house, attaches world physics, hingeifies ALL doors,
// installs click handler (hinged doors slow-toggle; locked doors rattle),
// and exposes hunt start/end hooks to lock/slam exterior doors during hunts.
(function () {
  // ----- configurable audio paths -----
  const SND = {
    lock:   "./assets/audio/door_lock.mp3",
    unlock: "./assets/audio/door_unlock.mp3",
    slam:   "./assets/audio/door_slam.mp3",
    rattle: "./assets/audio/door_rattle.mp3"
  };

  let snd = {};
  function loadSound(scene, key, url){
    try {
      snd[key] = new BABYLON.Sound(key, url, scene, null, { volume: 0.9 });
    } catch(e) {
      snd[key] = { play: ()=>console.warn("[sound missing]", key, url) };
    }
  }

  function ready() {
    return window.scene &&
           typeof window.enableHavok === "function" &&
           typeof window.buildProceduralHouse === "function" &&
           typeof window.attachPhysicsToHouse === "function" &&
           typeof window.hingeifyAllDoors === "function";
  }

  const poll = setInterval(async () => {
    if (!ready()) return;
    clearInterval(poll);

    const scene = window.scene;

    // Load SFX
    loadSound(scene, "lock",   SND.lock);
    loadSound(scene, "unlock", SND.unlock);
    loadSound(scene, "slam",   SND.slam);
    loadSound(scene, "rattle", SND.rattle);

    // 1) Enable Havok
    await enableHavok(scene, { locateBase: "./cdn/havok/" });

    // 2) Build the procedural house & attach physics
    const house = buildProceduralHouse(scene, { rootName: "MainHouse" });
    attachPhysicsToHouse(scene, house);

    // 3) Hingeify ALL doors (interior + exterior)
    const doorCtrl = hingeifyAllDoors(scene, house, { maxOpenDeg: 110, speed: 0.8, motorForce: 70 });

    // Identify exterior doors by name from the procedural builder
    const EXTERIOR = ["Door_Front", "Door_Back"].filter(n => doorCtrl[n]);

    // 4) Click handling: hinged doors toggle slowly; locked doors rattle
    scene.onPointerObservable.add((pi) => {
      if (pi.type !== BABYLON.PointerEventTypes.POINTERDOWN) return;
      const pick = scene.pick(scene.pointerX, scene.pointerY);
      if (!pick?.hit) return;

      // Did we click a door? Find controller by matching leaf or frame children
      let clickedName = null;
      for (const [name, ctrl] of Object.entries(doorCtrl)) {
        const door = ctrl.door;
        if (pick.pickedMesh === door.leaf || pick.pickedMesh === door.frame || door.frame.getChildMeshes().includes(pick.pickedMesh)) {
          clickedName = name;
          if (ctrl.locked) { snd.rattle?.play(); }
          else window.toggleHingedDoorSlow(ctrl);
          break;
        }
      }
    });

    // 5) Hunt-time exterior locking + slam
    function lockExteriorDoors() {
      EXTERIOR.forEach(name => {
        const ctrl = doorCtrl[name];
        if (!ctrl) return;
        ctrl.setLocked(true);
        ctrl.slam(2.6); // quick angular shove toward closed
      });
      snd.slam?.play();
      snd.lock?.play();
    }

    function unlockExteriorDoors() {
      EXTERIOR.forEach(name => doorCtrl[name]?.setLocked(false));
      snd.unlock?.play();
    }

    // Expose hooks for your hunt system to call:
    // Call window.__onHuntStart() when a hunt begins,
    // and window.__onHuntEnd() when it ends.
    window.__onHuntStart = lockExteriorDoors;
    window.__onHuntEnd   = unlockExteriorDoors;

    console.log("[Init] Havok + House + Hinges wired. Hunt hooks: __onHuntStart/__onHuntEnd.");
  }, 100);
})();
