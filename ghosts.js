// ghosts.js – Canonical ghost engine with behaviors, evidence, and preferred items

const ghostDataList = [
  {
    type: 'Spirit',
    evidence: ['EMF Level 5', 'Ghost Writing', 'Spirit Box'],
    preferredItems: ['Smudge Stick', 'Spirit Box'],
    behaviors: [
      (room) => `You sense a calm but watchful energy in the ${room}.`,
      (room) => `The ${room} remains eerily neutral, but presence is strong.`
    ]
  },
  {
    type: 'Wraith',
    evidence: ['DOTS', 'EMF Level 5', 'Spirit Box'],
    preferredItems: ['Salt', 'UV Light'],
    behaviors: [
      (room) => `Footsteps pass through salt in the ${room}... but leave no prints.`,
      (room) => `You feel the air warp—like something passed through you in the ${room}.`
    ]
  },
  {
    type: 'Phantom',
    evidence: ['DOTS', 'Fingerprints', 'Spirit Box'],
    preferredItems: ['Photo Camera'],
    behaviors: [
      (room) => `A shadowy figure appears, then vanishes in the ${room}.`,
      (room) => `Looking at the ghost drains your sanity in the ${room}.`
    ]
  },
  {
    type: 'Poltergeist',
    evidence: ['Ghost Writing', 'Spirit Box', 'Fingerprints'],
    preferredItems: ['Sound Sensor', 'Video Camera'],
    behaviors: [
      (room) => `Drawers slam shut in the ${room}.`,
      (room) => `Objects fly across the ${room}.`
    ]
  },
  {
    type: 'Banshee',
    evidence: ['DOTS', 'Fingerprints', 'Ghost Orb'],
    preferredItems: ['Parabolic Mic', 'Crucifix'],
    behaviors: [
      (room) => `A haunting song whispers in your ear in the ${room}.`,
      (room) => `You feel personally targeted in the ${room}.`
    ]
  },
  {
    type: 'Jinn',
    evidence: ['EMF Level 5', 'Fingerprints', 'Freezing Temps'],
    preferredItems: ['Breaker Off', 'EMF Reader'],
    behaviors: [
      (room) => `Electronics surge near the ${room}.`,
      (room) => `You move too fast—something reacts violently in the ${room}.`
    ]
  },
  {
    type: 'Mare',
    evidence: ['Ghost Orb', 'Ghost Writing', 'Spirit Box'],
    preferredItems: ['Light Source', 'Candle'],
    behaviors: [
      (room) => `Darkness deepens unnaturally in the ${room}.`,
      (room) => `The lights go out on their own in the ${room}.`
    ]
  },
  {
    type: 'Revenant',
    evidence: ['Ghost Orb', 'Ghost Writing', 'Freezing Temps'],
    preferredItems: ['Smudge Stick', 'Crucifix'],
    behaviors: [
      (room) => `You sense you're being hunted in the ${room}.`,
      (room) => `Heavy footsteps echo behind you in the ${room}.`
    ]
  },
  {
    type: 'Shade',
    evidence: ['EMF Level 5', 'Ghost Writing', 'Freezing Temps'],
    preferredItems: ['Thermometer', 'Book'],
    behaviors: [
      (room) => `No activity... until you're alone in the ${room}.`,
      (room) => `You feel like something is withholding its power in the ${room}.`
    ]
  },
  {
    type: 'Demon',
    evidence: ['Ghost Writing', 'Freezing Temps', 'Fingerprints'],
    preferredItems: ['Crucifix', 'Smudge Stick'],
    behaviors: [
      (room) => `A deep growl rumbles in the ${room}.`,
      (room) => `Overwhelming dread fills the ${room}.`
    ]
  },
  {
    type: 'Yurei',
    evidence: ['DOTS', 'Ghost Orb', 'Freezing Temps'],
    preferredItems: ['Smudge Stick', 'Motion Sensor'],
    behaviors: [
      (room) => `The temperature drops rapidly in the ${room}.`,
      (room) => `You feel mentally exhausted just by being in the ${room}.`
    ]
  },
  {
    type: 'Oni',
    evidence: ['DOTS', 'EMF Level 5', 'Freezing Temps'],
    preferredItems: ['Video Camera', 'EMF Reader'],
    behaviors: [
      (room) => `Sudden burst of strength—you hear a loud crash in the ${room}.`,
      (room) => `Something barrels into furniture in the ${room}.`
    ]
  },
  {
    type: 'Hantu',
    evidence: ['Fingerprints', 'Ghost Orb', 'Freezing Temps'],
    preferredItems: ['Thermometer'],
    behaviors: [
      (room) => `Your breath fogs over... The ${room} is freezing.`,
      (room) => `The ghost is faster in this cold ${room}.`
    ]
  },
  {
    type: 'Yokai',
    evidence: ['DOTS', 'Ghost Orb', 'Spirit Box'],
    preferredItems: ['Sound Sensor', 'Candle'],
    behaviors: [
      (room) => `You hear incomprehensible whispers reacting to your voice in the ${room}.`,
      (room) => `The ghost seems agitated by talking in the ${room}.`
    ]
  },
  {
    type: 'Goryo',
    evidence: ['DOTS', 'EMF Level 5', 'Fingerprints'],
    preferredItems: ['Video Camera'],
    behaviors: [
      (room) => `A figure briefly appears only on the DOTS projector in the ${room}.`,
      (room) => `You sense something watching—but only when you're alone.`
    ]
  },
  {
    type: 'Myling',
    evidence: ['EMF Level 5', 'Ghost Writing', 'Fingerprints'],
    preferredItems: ['Parabolic Mic'],
    behaviors: [
      (room) => `You hear footsteps more clearly in the ${room}.`,
      (room) => `The ghost’s sounds are loud—but its presence is hard to detect.`
    ]
  },
  {
    type: 'Onryo',
    evidence: ['Ghost Orb', 'Freezing Temps', 'Spirit Box'],
    preferredItems: ['Candle', 'Thermometer'],
    behaviors: [
      (room) => `A lit candle extinguishes suddenly in the ${room}.`,
      (room) => `You feel the spirit is drawn to fire in the ${room}.`
    ]
  },
  {
    type: 'The Twins',
    evidence: ['EMF Level 5', 'Freezing Temps', 'Spirit Box'],
    preferredItems: ['EMF Reader', 'Motion Sensor'],
    behaviors: [
      (room) => `Activity seems duplicated in the ${room}.`,
      (room) => `You feel like two entities are nearby in the ${room}.`
    ]
  },
  {
    type: 'Raiju',
    evidence: ['DOTS', 'EMF Level 5', 'Ghost Orb'],
    preferredItems: ['Electronics'],
    behaviors: [
      (room) => `Tech shorts out violently in the ${room}.`,
      (room) => `The ghost surges near active equipment in the ${room}.`
    ]
  },
  {
    type: 'Obake',
    evidence: ['EMF Level 5', 'Ghost Orb', 'Fingerprints'],
    preferredItems: ['UV Light'],
    behaviors: [
      (room) => `You find fingerprints that disappear quickly in the ${room}.`,
      (room) => `A distorted form flickers briefly in the ${room}.`
    ]
  },
  {
    type: 'The Mimic',
    evidence: ['Freezing Temps', 'Fingerprints', 'Spirit Box'],
    preferredItems: ['Salt', 'Camera'],
    behaviors: [
      (room) => `A familiar ghostly event repeats in the ${room}.`,
      (room) => `You sense a deception is occurring nearby...`
    ]
  },
  {
    type: 'Moroi',
    evidence: ['Freezing Temps', 'Ghost Writing', 'Spirit Box'],
    preferredItems: ['Smudge Stick', 'Voice'],
    behaviors: [
      (room) => `A thick sense of dread and fatigue settles in the ${room}.`,
      (room) => `You cough. Something is draining your will to fight.`
    ]
  },
  {
    type: 'Deogen',
    evidence: ['DOTS', 'Ghost Writing', 'Spirit Box'],
    preferredItems: ['Crucifix', 'Proximity Sensor'],
    behaviors: [
      (room) => `You sense a presence that knows exactly where you are.`,
      (room) => `The ghost approaches slowly, deliberately, never fooled.`
    ]
  },
  {
    type: 'Thaye',
    evidence: ['DOTS', 'Ghost Orb', 'Ghost Writing'],
    preferredItems: ['Timer', 'Smudge Stick'],
    behaviors: [
      (room) => `The ghost seems powerful... but slows as time passes.`,
      (room) => `You feel less threatened in the ${room} than before.`
    ]
  },
  {
    type: 'Succubus',
    evidence: ['Spirit Box', 'Ghost Orb', 'Freezing Temps'],
    preferredItems: ['Mirror', 'Candle'],
    behaviors: [
      (room) => `A sultry voice calls to you from the shadows in the ${room}.`,
      (room) => `Your heart races in the ${room}. The air feels charged with desire.`,
      (room) => `The presence here is both terrifying and intoxicating...`
    ]
  }
];

// Active ghost
let currentGhost = null;

export function getRandomGhost() {
  const ghost = ghostDataList[Math.floor(Math.random() * ghostDataList.length)];
  return { ...ghost };
}

export function initializeGhost(ghost) {
  currentGhost = {
    ...ghost,
    perform: () => ghost.behaviors[Math.floor(Math.random() * ghost.behaviors.length)]
  };
}

export function performBehavior(room) {
  if (!currentGhost || !currentGhost.perform) return "You feel watched, but nothing happens.";
  return currentGhost.perform()(room);
}

export function getCurrentGhost() {
  return currentGhost;
}
