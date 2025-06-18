// ghosts.js – Ghost definition and random behavior engine

const ghostTypes = [
  'Spirit', 'Wraith', 'Phantom', 'Poltergeist', 'Banshee',
  'Jinn', 'Mare', 'Revenant', 'Shade', 'Demon',
  'Yurei', 'Oni', 'Hantu', 'Yokai', 'Goryo',
  'Myling', 'Onryo', 'The Twins', 'Raiju', 'Obake',
  'The Mimic', 'Moroi', 'Deogen', 'Thaye', 'Succubus'
];

let currentGhost = null;

export function getRandomGhost() {
  const type = ghostTypes[Math.floor(Math.random() * ghostTypes.length)];
  return { type };
}

export function initializeGhost(ghost) {
  currentGhost = {
    ...ghost,
    behaviorMap: generateBehavior(ghost.type)
  };
}

function generateBehavior(type) {
  const commonBehaviors = [
    (room) => `You hear a whisper echoing through the ${room}...`,
    (room) => `An object suddenly moves in the ${room}.`,
    (room) => `You feel a chill creep down your spine in the ${room}.`,
    (room) => `A distant humming sound vibrates the air in the ${room}.`,
    (room) => `Nothing happens in the ${room}, but you can’t shake the feeling you’re not alone.`
  ];

  const specialBehaviors = {
    'Succubus': [
      (room) => `An alluring presence brushes past you in the ${room}. Your thoughts fog.`,
      (room) => `You feel an unnatural warmth in the ${room}. A seductive whisper beckons.`,
      (room) => `You resist a sudden compulsion to stay in the ${room} forever...`
    ],
    'Poltergeist': [
      (room) => `A violent crash erupts in the ${room} as objects are hurled.`,
      (room) => `Drawers fly open and slam shut in the ${room}.`,
      (room) => `You’re nearly hit by flying debris in the ${room}!`
    ],
    'Demon': [
      (room) => `You feel overwhelming dread in the ${room}. The lights cut out.`,
      (room) => `A deep growl rumbles from the shadows of the ${room}.`,
      (room) => `Blood spatters briefly onto the walls of the ${room}, then vanishes.`
    ]
    // Add other ghost-specific behaviors here if needed
  };

  return (room) => {
    const pool = [...commonBehaviors];
    if (specialBehaviors[type]) {
      pool.push(...specialBehaviors[type]);
    }
    const action = pool[Math.floor(Math.random() * pool.length)];
    return action(room);
  };
}

export function getCurrentGhost() {
  return currentGhost;
}

// Used in game.js to simulate behavior
export function performBehavior(room) {
  if (!currentGhost || !currentGhost.behaviorMap) {
    return "You feel nothing... the ghost has yet to show itself.";
  }
  return currentGhost.behaviorMap(room);
}
