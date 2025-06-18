// statistics.js – Tracks all runtime game metrics and stores cumulative progression

let stats = {
  turnsTaken: 0,
  evidenceFound: 0,
  investigations: 0,
  wins: 0,
  losses: 0,
  cursedItemsUsed: 0,
  totalSanityLost: 0,
  lastGuess: null,
  lastGhost: null,
  lastOutcome: null,
  totalGuesses: 0
};

export function initializeStats() {
  stats = {
    turnsTaken: 0,
    evidenceFound: 0,
    investigations: 0,
    wins: 0,
    losses: 0,
    cursedItemsUsed: 0,
    totalSanityLost: 0,
    lastGuess: null,
    lastGhost: null,
    lastOutcome: null,
    totalGuesses: 0
  };
}

export function getStats() {
  return stats;
}

export function updateStats(newData) {
  for (const key in newData) {
    if (stats.hasOwnProperty(key)) {
      stats[key] += typeof newData[key] === 'number' ? newData[key] : 0;
    }
  }
}

export function setOutcome({ guess, ghost, correct }) {
  stats.lastGuess = guess;
  stats.lastGhost = ghost;
  stats.lastOutcome = correct ? 'win' : 'loss';
  stats.totalGuesses++;
  stats.investigations++;
  if (correct) stats.wins++;
  else stats.losses++;
}

export function getTurnCount() {
  return stats.turnsTaken;
}

export function incrementTurn() {
  stats.turnsTaken++;
}

export function recordSanityLoss(amount) {
  stats.totalSanityLost += Math.abs(amount);
}

export function addEvidenceFound(count = 1) {
  stats.evidenceFound += count;
}

export function incrementCursedItemUse() {
  stats.cursedItemsUsed++;
}

export function clearStats() {
  initializeStats();
}
