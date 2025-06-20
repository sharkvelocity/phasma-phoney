
const ghostTypes = [
  'Spirit', 'Wraith', 'Phantom', 'Poltergeist', 'Banshee',
  'Jinn', 'Mare', 'Revenant', 'Shade', 'Demon',
  'Yurei', 'Oni', 'Hantu', 'Goryo', 'Myling',
  'Onryo', 'The Twins', 'Raiju', 'Obake', 'The Mimic',
  'Moroi', 'Deogen', 'Thaye', 'Succubus'
];

function getRandomGhost() {
  const type = ghostTypes[Math.floor(Math.random() * ghostTypes.length)];
  return { type, behavior: generateGhostBehavior(type) };
}

function generateGhostBehavior(type) {
  const baseBehaviors = [
    room => `You feel watched in the ${room}.`,
    room => `A chill runs through the ${room}.`,
    room => `The lights flicker briefly in the ${room}.`,
    room => `You hear faint whispers in the ${room}.`,
    room => `The air feels thick in the ${room}.`
  ];

  const ghostSpecifics = {
    'Poltergeist': [room => `Objects clatter violently in the ${room}.`],
    'Banshee': [room => `A piercing wail echoes through the ${room}.`],
    'Jinn': [room => `A surge of energy pulses through the ${room}.`],
    'Mare': [room => `Darkness creeps unnaturally in the ${room}.`],
    'Revenant': [room => `You sense something fast approaching in the ${room}.`],
    'Shade': [room => `Silence dominates the ${room}, too quiet.`],
    'Demon': [room => `You hear growling in the ${room}.`],
    'Yurei': [room => `A sorrowful presence hangs in the ${room}.`],
    'Oni': [room => `Loud footsteps stomp around the ${room}.`],
    'Hantu': [room => `Freezing winds swirl unnaturally in the ${room}.`],
    'Goryo': [room => `You glimpse a silhouette dart past in the ${room}.`],
    'Myling': [room => `Soft sobs fill the ${room}.`],
    'Onryo': [room => `Your lighter won't ignite in the ${room}.`],
    'The Twins': [room => `Two sets of footsteps echo in the ${room}.`],
    'Raiju': [room => `Your electronics buzz in the ${room}.`],
    'Obake': [room => `Fingerprints shift and warp in the ${room}.`],
    'The Mimic': [room => `You hear a sound that doesn’t match your evidence in the ${room}.`],
    'Moroi': [room => `Your breath fogs up as you speak in the ${room}.`],
    'Deogen': [room => `You feel eyes watching your every move in the ${room}.`],
    'Thaye': [room => `An ancient aura ages the air in the ${room}.`],
    'Succubus': [room => `A sultry whisper beckons in the ${room}.`]
  };

  return room => {
    const pool = [...baseBehaviors, ...(ghostSpecifics[type] || [])];
    return pool[Math.floor(Math.random() * pool.length)](room);
  };
}

let ghost = null;
function initializeGhost(g) { ghost = g; }
function performBehavior(room) { return ghost?.behavior(room) || 'Nothing happens.'; }
function getCurrentGhost() { return ghost; }

window.getRandomGhost = getRandomGhost;
window.initializeGhost = initializeGhost;
window.performBehavior = performBehavior;
window.getCurrentGhost = getCurrentGhost;
