// ghosts.js – Full ghost roster and logic engine

import { succubus } from './succubus.js';

const ghostTypes = [
  succubus,
  { type: 'Spirit', performBehavior: () => 'You feel a calming breeze, then sudden dread.' },
  { type: 'Wraith', performBehavior: () => 'A soft static crackle erupts nearby... then silence.' },
  { type: 'Phantom', performBehavior: () => 'A figure flashes in the corner of your eye and vanishes.' },
  { type: 'Poltergeist', performBehavior: () => 'A book slams shut violently behind you.' },
  { type: 'Banshee', performBehavior: () => 'A high-pitched wail sends shivers down your spine.' },
  { type: 'Jinn', performBehavior: () => 'You feel an unnatural gust pushing you back.' },
  { type: 'Mare', performBehavior: () => 'Darkness deepens. You can barely see your hands.' },
  { type: 'Revenant', performBehavior: () => 'You feel watched. Something is hunting.' },
  { type: 'Shade', performBehavior: () => 'Everything falls unnaturally quiet... too quiet.' },
  { type: 'Demon', performBehavior: () => 'The lights burst and a guttural growl echoes from nowhere.' },
  { type: 'Yurei', performBehavior: () => 'Your limbs feel heavy. The ghost drains your energy.' },
  { type: 'Oni', performBehavior: () => 'The air shifts violently. Heavy steps echo nearby.' },
  { type: 'Hantu', performBehavior: () => 'The room chills instantly. Your breath fogs heavily.' },
  { type: 'Yokai', performBehavior: () => 'You hear whispers that grow louder the more you speak.' },
  { type: 'Goryo', performBehavior: () => 'A shadow glides past a laser grid silently.' },
  { type: 'Myling', performBehavior: () => 'A child’s humming grows louder... then abruptly stops.' },
  { type: 'Onryo', performBehavior: () => 'A candle snuffs itself out. The room grows tense.' },
  { type: 'The Twins', performBehavior: () => 'Two distinct sounds echo in different directions.' },
  { type: 'Raiju', performBehavior: () => 'Electronics glitch violently. Your devices spike in static.' },
  { type: 'Obake', performBehavior: () => 'A fingerprint smears and shifts shape unnaturally.' },
  { type: 'The Mimic', performBehavior: () => 'You hear ghostly evidence that doesn’t match... beware.' },
  { type: 'Moroi', performBehavior: () => 'You cough involuntarily. Your breath shortens in fear.' },
  { type: 'Deogen', performBehavior: () => 'You feel targeted. A presence charges directly at you.' },
  { type: 'Thaye', performBehavior: () => 'An old energy surrounds you... but weakens over time.' }
];

export function getRandomGhost() {
  const index = Math.floor(Math.random() * ghostTypes.length);
  return ghostTypes[index];
}

export function initializeGhost(ghost) {
  if (ghost && ghost.initialize) ghost.initialize();
}
