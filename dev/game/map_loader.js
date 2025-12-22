// assets/dev/game/map_loader.js
// This module provides map manifest and weather definitions.
// It does NOT handle UI population or event listeners.

window.PP = window.PP || {};

// Map Definitions (will be populated from maps.json in bootstrap)
PP.mapManifest = [];

// Weather Definitions - CONFIRMED AUDIO FILE NAMES from your repo tree
PP.weatherDefs = [
  { type: "Clear", tempRange: [15, 25], ambient: "clearWeather.mp3" }, // Using clearWeather.mp3
  { type: "Rain", tempRange: [10, 18], ambient: "rainstorm.mp3" },   // Using rainstorm.mp3
  { type: "Snow", tempRange: [-5, 2], ambient: "snow.mp3" },        // Using snow.mp3
  { type: "Foggy", tempRange: [8, 14], ambient: "ambient.mp3" },    // Assuming ambient.mp3 for fog (adjust if you have a specific fog sound)
];

// If you have specific procedural generator definitions or settings that
// map_manager needs, you can put them here:
// PP.proceduralGenerators = {
//   prohouse_generator: { /* config for prohouse */ }
// };

console.log("[map_loader] Definitions loaded.");
