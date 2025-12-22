// ./assets/index3/mapdefs_furnished_house.js
(function () {
  window.MAP_DEFS = window.MAP_DEFS || {};

  // Furnished House definition
  MAP_DEFS["furnished_house.js"] = {
    title: "Furnished House",
    file: "furnished_house.glb",
    // Scaled down model; adjust if oversized
    scale: 0.020,
    rotationY: 0,

    // Align world origin so your desired local (0,0) aligns with a real-world spot.
    // From earlier: "make this the origin": XZ ≈ (23.23, -49.32) => offset ~ (-23.23, 0, 49.32)
    offset: { x: -23.23, y: 0, z: 49.32 },

    // If you have explicit spawn in local space, keep it here (local units)
    spawn: { x: 0.0, y: 1.80, z: 0.0 },

    // vanZone system (local-space polygon + spawn inside)
    vanZone: {
      poly: [
        { x: -4, z: 18 }, { x: 4, z: 18 }, { x: 4, z: 24 }, { x: -4, z: 24 }
      ],
      spawn: { x: 0.0, y: 1.80, z: 21.0 }
    },

    exteriorMode: "exterior",
    exterior: [
      { x:-15, z:-20 }, { x:15, z:-20 }, { x:15, z:20 }, { x:-15, z:20 }
    ],

    rooms: [
      { name:"Van",          poly:[ {x:-4,z:18}, {x:4,z:18}, {x:4,z:24}, {x:-4,z:24} ] },
      { name:"Living Room",  poly:[ {x:-6,z:-2}, {x:8,z:-2}, {x:8,z:8}, {x:-6,z:8} ] },
      { name:"Kitchen",      poly:[ {x:8,z:-2},  {x:14,z:-2}, {x:14,z:8}, {x:8,z:8} ] },
      { name:"Hallway",      poly:[ {x:-6,z:-8}, {x:0,z:-8},  {x:0,z:-2}, {x:-6,z:-2} ] },
      { name:"Bedroom",      poly:[ {x:0,z:-8},  {x:8,z:-8},  {x:8,z:-2}, {x:0,z:-2} ] },
      { name:"Bathroom",     poly:[ {x:8,z:-8},  {x:14,z:-8}, {x:14,z:-2}, {x:8,z:-2} ] }
    ]
  };
})();
