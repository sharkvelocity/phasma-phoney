// ghosts.js – Full Ghost System with 25 Behaviors + Selection Engine

const ghostTypes = [
  'Spirit', 'Wraith', 'Phantom', 'Poltergeist', 'Banshee',
  'Jinn', 'Mare', 'Revenant', 'Shade', 'Demon',
  'Yurei', 'Oni', 'Hantu', 'Yokai', 'Goryo',
  'Myling', 'Onryo', 'The Twins', 'Raiju', 'Obake',
  'The Mimic', 'Moroi', 'Deogen', 'Thaye', 'Succubus'
];

let currentGhost = null;

export function getGhostTypes() {
  return ghostTypes;
}

export function getRandomGhost() {
  const type = ghostTypes[Math.floor(Math.random() * ghostTypes.length)];
  return { type };
}

export function initializeGhost(ghost) {
  currentGhost = {
    type: ghost.type,
    behaviorMap: generateBehavior(ghost.type)
  };
}

export function getCurrentGhost() {
  return currentGhost;
}

export function getCurrentGhostType() {
  return currentGhost?.type || null;
}

export function performBehavior(room) {
  if (!currentGhost || !currentGhost.behaviorMap) {
    return "You feel nothing... the ghost has yet to show itself.";
  }
  return currentGhost.behaviorMap(room);
}

function generateBehavior(type) {
  const common = [
    (room) => `You hear faint footsteps echoing through the ${room}.`,
    (room) => `The temperature drops as you step into the ${room}.`,
    (room) => `An uneasy silence fills the ${room}.`
  ];

  const unique = {
    Spirit: [
      (room) => `You sense calm but undeniable presence in the ${room}.`,
      (room) => `A subtle whisper passes your ear in the ${room}.`
    ],
    Wraith: [
      (room) => `The ${room} feels disconnected from reality.`,
      (room) => `You hear footsteps, but see no trace.`
    ],
    Phantom: [
      (room) => `You see a glimpse of a figure in the ${room}… then it vanishes.`,
      (room) => `Your vision distorts slightly in the ${room}.`
    ],
    Poltergeist: [
      (room) => `Loud crashes erupt as objects are flung across the ${room}.`,
      (room) => `Drawers slam open and shut violently.`
    ],
    Banshee: [
      (room) => `A distant, sorrowful wail fills the ${room}.`,
      (room) => `You hear singing that turns to screams in the ${room}.`
    ],
    Jinn: [
      (room) => `Electronics spark briefly as you enter the ${room}.`,
      (room) => `An unnatural breeze circles you in the ${room}.`
    ],
    Mare: [
      (room) => `The lights flicker and fail in the ${room}.`,
      (room) => `Shadows crawl unnaturally across the walls.`
    ],
    Revenant: [
      (room) => `You feel hunted. You shouldn't linger in the ${room}.`,
      (room) => `Your breath shortens. It's fast.`
    ],
    Shade: [
      (room) => `The ${room} feels empty and still.`,
      (room) => `You sense something watching from the corner.`
    ],
    Demon: [
      (room) => `A growl echoes from beneath the floor.`,
      (room) => `Symbols flash on the wall and vanish in the ${room}.`
    ],
    Yurei: [
      (room) => `You feel your energy being sapped.`,
      (room) => `A misty figure lingers near you briefly.`
    ],
    Oni: [
      (room) => `Heavy breathing fills the ${room}.`,
      (room) => `Your muscles tense without reason.`
    ],
    Hantu: [
      (room) => `Frost creeps across the floor.`,
      (room) => `Breath fogs instantly in the ${room}.`
    ],
    Yokai: [
      (room) => `Chattering voices erupt, then stop abruptly.`,
      (room) => `A loud whisper hushes you aggressively.`
    ],
    Goryo: [
      (room) => `A reflection moves without a source.`,
      (room) => `You glimpse a ghost in your camera… but nothing’s there.`
    ],
    Myling: [
      (room) => `A child’s humming echoes softly.`,
      (room) => `Tiny handprints mark the wall.`
    ],
    Onryo: [
      (room) => `Candlelight flickers in time with your breath.`,
      (room) => `You feel a presence whenever fire burns.`
    ],
    'The Twins': [
      (room) => `Two distinct footsteps echo in different corners.`,
      (room) => `Conflicting cold spots confuse your senses.`
    ],
    Raiju: [
      (room) => `Static bursts near your electronics.`,
      (room) => `The lights buzz violently as you enter.`
    ],
    Obake: [
      (room) => `Fingerprints shift and smear unnaturally.`,
      (room) => `You catch a glimpse of something shifting shape.`
    ],
    'The Mimic': [
      (room) => `You hear evidence of another ghost type.`,
      (room) => `Familiar sounds play tricks on you.`
    ],
    Moroi: [
      (room) => `You feel physically ill in the ${room}.`,
      (room) => `Your vision blurs the longer you stay.`
    ],
    Deogen: [
      (room) => `Heavy footsteps slowly approach.`,
      (room) => `An immense pressure closes in on you.`
    ],
    Thaye: [
      (room) => `Time feels strange here. You feel… older.`,
      (room) => `The air grows heavier with each moment.`
    ],
    Succubus: [
      (room) => `A sultry breath brushes your neck.`,
      (room) => `Your mind fogs with strange desires.`
    ]
  };

  const combined = unique[type] ? [...common, ...unique[type]] : [...common];
  return (room) => combined[Math.floor(Math.random() * combined.length)](room);
}
