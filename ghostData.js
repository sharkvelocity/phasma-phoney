// ghostData.js — manages full ghost data and random selection

export let currentGhost = null;

const ghostList = [
  'Spirit', 'Wraith', 'Phantom', 'Poltergeist', 'Banshee', 'Jinn',
  'Mare', 'Revenant', 'Shade', 'Demon', 'Yurei', 'Oni',
  'Yokai', 'Hantu', 'Goryo', 'Myling', 'Onryo', 'The Twins',
  'Raiju', 'Obake', 'The Mimic', 'Moroi', 'Deogen', 'Thaye',
  'Succubus' // If unlocked
];

export function initializeGhostData() {
  currentGhost = getRandomGhost();
  console.log(`👻 Selected ghost: ${currentGhost}`);
}

function getRandomGhost() {
  const index = Math.floor(Math.random() * ghostList.length);
  return ghostList[index];
}

export function getCurrentGhost() {
  return currentGhost;
}

export function resetGhostState() {
  currentGhost = null;
}
