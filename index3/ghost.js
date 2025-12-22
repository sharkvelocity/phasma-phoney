// ./assets/index3/ghost.js
// Minimal, friendly registry. Expand stats/behaviors as you like.

(function(){
  "use strict";

  const ALL_GHOSTS = {
    Spirit:      { evidence: ['EMF 5','Spirit Box','Ghost Writing'] },
    Wraith:      { evidence: ['EMF 5','Spirit Box','D.O.T.S'], notes:'Does not disturb salt' },
    Phantom:     { evidence: ['Spirit Box','Fingerprints','D.O.T.S'] },
    Poltergeist: { evidence: ['Spirit Box','Fingerprints','Ghost Writing'] },
    Banshee:     { evidence: ['Fingerprints','Ghost Orb','D.O.T.S'] },
    Jinn:        { evidence: ['EMF 5','Fingerprints','Freezing Temps'] },
    Mare:        { evidence: ['Spirit Box','Ghost Orb','Ghost Writing'] },
    Revenant:    { evidence: ['Ghost Orb','Ghost Writing','Freezing Temps'] },
    Shade:       { evidence: ['EMF 5','Ghost Writing','Freezing Temps'] },
    Demon:       { evidence: ['Fingerprints','Ghost Writing','Freezing Temps'] },
    Yurei:       { evidence: ['Ghost Orb','Freezing Temps','D.O.T.S'] },
    Oni:         { evidence: ['EMF 5','Freezing Temps','D.O.T.S'] },
    Yokai:       { evidence: ['Spirit Box','Ghost Orb','D.O.T.S'] },
    Hantu:       { evidence: ['Fingerprints','Ghost Orb','Freezing Temps'] },
    Goryo:       { evidence: ['EMF 5','Fingerprints','D.O.T.S'] },
    Myling:      { evidence: ['EMF 5','Fingerprints','Ghost Writing'] },
    Onryo:       { evidence: ['Spirit Box','Ghost Orb','Freezing Temps'] },
    "The Twins": { evidence: ['EMF 5','Spirit Box','Freezing Temps'] },
    Raiju:       { evidence: ['EMF 5','Ghost Orb','D.O.T.S'] },
    Obake:       { evidence: ['EMF 5','Fingerprints','Ghost Orb'] },
    "The Mimic": { evidence: ['Spirit Box','Fingerprints','Freezing Temps','Ghost Orb*'], notes:'Orb is fake' },
    Moroi:       { evidence: ['Spirit Box','Ghost Writing','Freezing Temps'] },
    Deogen:      { evidence: ['Spirit Box','Ghost Writing','D.O.T.S'] },
    Thaye:       { evidence: ['Ghost Orb','Ghost Writing','D.O.T.S'] }
  };

  // if a registry already exists, merge it (don’t wipe your custom data)
  const existing = window.GHOSTS || {};
  const merged = {...ALL_GHOSTS, ...existing};
  window.GHOSTS = merged;

  // quick helpers used elsewhere
  window.getGhostNames = ()=> Object.keys(window.GHOSTS);
})();
