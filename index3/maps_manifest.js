// ./assets/index3/maps_manifest.js
(function(){
  window.INDEX3 = window.INDEX3 || {};
  // If ./assets/models/map/maps.json exists at runtime, boot.js will prefer that.
  // Otherwise we fall back to this manifest.
  INDEX3.MAPS_MANIFEST_FALLBACK = [
    { file: "Abandoned_House.glb", title: "Abandoned House", def: "Abandoned_House.js" },
    { file: "furnished_house.glb",  title: "Furnished House",  def: "furnished_house.js" },
    { file: "jailhouse.glb",        title: "Jailhouse",        def: "jailhouse.js" },
    { file: "apartment_floor_plan.glb", title: "Apartment (Floor Plan)", def: "apartment.config.js" } // optional if you add a def
  ];
})();
