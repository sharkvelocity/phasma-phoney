// multiRun.js

import { initializeGame } from './game.js';
import { loadGhost } from './ghostData.js';
import { resetJournal } from './journal.js';
import { resetStats } from './statistics.js';
import { initializeMechanics } from './mechanics.js';
import { resetInventory } from './inventory.js';
import { resetMap } from './minimap.js';
import { logNarration } from './dialogueEngine.js';

let runHistory = [];
let currentRun = 0;

export function startNewRun() {
  currentRun++;
  saveRunData(); // Save previous run before wiping

  logNarration(`🌀 Beginning Run #${currentRun}...`);

  // Reset all modules
  resetStats();
  resetJournal();
  resetInventory();
  resetMap();
  initializeMechanics();

  // Load new randomized ghost
  loadGhost();

  // Start game fresh
  initializeGame();
}

export function saveRunData() {
  const stats = JSON.parse(localStorage.getItem('phasma_stats')) || {};
  const summary = {
    run: currentRun,
    ghost: stats.lastGhost || 'Unknown',
    outcome: stats.lastOutcome || 'Incomplete',
    turns: stats.turns || 0,
    sanity: stats.sanity || 0
  };
  runHistory.push(summary);
  localStorage.setItem('phasma_runHistory', JSON.stringify(runHistory));
}

export function getRunHistory() {
  return runHistory;
}

export function restorePreviousRuns() {
  const saved = localStorage.getItem('phasma_runHistory');
  if (saved) {
    runHistory = JSON.parse(saved);
    currentRun = runHistory.length;
  }
}
