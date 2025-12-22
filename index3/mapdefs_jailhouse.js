// ./assets/index3/mapdefs_jailhouse.js
(function () {
  window.MAP_DEFS = window.MAP_DEFS || {};
  MAP_DEFS["jailhouse.js"] = {
    title: "Jailhouse",
    file: "jailhouse.glb",
    scale: 1.0,
    rotationY: 0,
    offset: { x: 0, y: 0, z: 0 },
    spawn: { x: 0, y: 1.8, z: 0 },
    vanZone: {
      poly: [ {x:-5,z:-5},{x:5,z:-5},{x:5,z:5},{x:-5,z:5} ],
      spawn: { x: 0, y: 1.8, z: 0 }
    }
  };
})();
