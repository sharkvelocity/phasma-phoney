// statistics.js – Player stat tracking and turn counter

let stats = {
  sanity: 100,
  evidenceFound: 0,
  cursedItemsUsed: 0,
  turnsTaken: 0
};

export function loadStats() {
  const stored = localStorage.getItem('phasma_stats');
  if (stored) stats = JSON.parse(stored);
  return stats;
}

export function saveStats() {
  localStorage.setItem('phasma_stats', JSON.stringify(stats));
}

export function getStats() {
  return stats;
}

export function updateStats(newStats) {
  stats = { ...stats, ...newStats };
  saveStats();
}

export function clearStats() {
  stats = {
    sanity: 100,
    evidenceFound: 0,
    cursedItemsUsed: 0,
    turnsTaken: 0
  };
  saveStats();
}

export function getTurnCount() {
  return stats.turnsTaken;
}

export function incrementTurnCount() {
  stats.turnsTaken += 1;
  saveStats();
}