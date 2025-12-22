// player_rig_controller_final.js
(() => {
  // GLOBAL FLAGS
  window.playerCanMove = false; // starts false
  const SPEED_WALK = 3;
  const SPEED_SPRINT = 6;
  const SPEED_CROUCH = 1.5;

  // INPUT STATE
  const keys = {};
  let isSprinting = false;
  let isCrouching = false;

  // MOUSE STATE
  let pitch = 0;
  let yaw = 0;
  const sensitivity = 0.002;

  // PLAYER RIG
  let playerMesh = null;
  let camera = null;
  let scene = null;
  let canvas = null;

  // INIT FUNCTION (call AFTER map/player ready)
  window.initPlayerRig = (_scene, _camera, _playerMesh, _canvas) => {
    scene = _scene;
    camera = _camera;
    playerMesh = _playerMesh;
    canvas = _canvas;

    setupInput();
    scene.onBeforeRenderObservable.add(updateMovement);
  };

  // INPUT LISTENERS
  function setupInput() {
    if(!canvas) return;

    // KEYBOARD
    document.addEventListener("keydown", ev => {
      if(!window.playerCanMove) return;
      keys[ev.code] = true;
      if(ev.code === "ShiftLeft") isSprinting = true;
      if(ev.code === "ControlLeft") isCrouching = true;
    });

    document.addEventListener("keyup", ev => {
      if(!window.playerCanMove) return;
      keys[ev.code] = false;
      if(ev.code === "ShiftLeft") isSprinting = false;
      if(ev.code === "ControlLeft") isCrouching = false;
    });

    // MOUSE
    canvas.addEventListener("mousemove", ev => {
      if(!window.playerCanMove) return;
      if(document.pointerLockElement !== canvas) return;

      yaw += ev.movementX * sensitivity;
      pitch -= ev.movementY * sensitivity;
      pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch));

      camera.rotation.x = pitch;
      camera.rotation.y = yaw;
    });

    // POINTER LOCK
    canvas.addEventListener("click", () => {
      if(!window.playerCanMove) return;
      if(document.pointerLockElement !== canvas) canvas.requestPointerLock();
    });
  }

  // MOVEMENT UPDATE
  function updateMovement() {
    if(!window.playerCanMove || !playerMesh) return;

    const dt = scene.getEngine().getDeltaTime() / 1000;
    let forward = keys["KeyW"] ? 1 : keys["KeyS"] ? -1 : 0;
    let right = keys["KeyD"] ? 1 : keys["KeyA"] ? -1 : 0;

    let speed = SPEED_WALK;
    if(isSprinting && !isCrouching) speed = SPEED_SPRINT;
    if(isCrouching) speed = SPEED_CROUCH;

    // Horizontal movement
    const dir = new BABYLON.Vector3();
    if(forward || right) {
      const f = new BABYLON.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
      const r = new BABYLON.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
      dir.copyFrom(f.scale(forward).add(r.scale(right))).normalize().scaleInPlace(speed * dt);
      playerMesh.moveWithCollisions(dir);
    }

    // Keep grounded
    playerMesh.position.y = 1.8; // your fixed floor height

    // Update HUD
    if(window.updatePlayerPos) {
      window.updatePlayerPos(playerMesh.position.x, playerMesh.position.y, playerMesh.position.z);
    }
  }
})();
