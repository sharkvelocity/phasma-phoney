// ghostManager.js — Controls ghost state, evidence, behaviors

import { currentGhost, getCurrentGhost, initializeGhostData } from './ghostData.js';
import { addJournalEntry } from './journal.js';
import { applyEvidenceDiscovery } from './evidence.js';
import { triggerHunt, checkGhostActivity } from './mechanics.js';

let ghostMood = 'neutral'; // can be: neutral, irritated, aggressive
let evidenceFound = [];

export function startGhostSession() {
  initializeGhostData();
  ghostMood = 'neutral';
  evidenceFound = [];
  console.log(`[GhostManager] New ghost: ${getCurrentGhost()}`);
}

export function updateGhostMood(trigger) {
  // Trigger: 'talk', 'smudge', 'photo', 'itemDrop', etc.
  switch (trigger) {
    case 'talk':
      ghostMood = ghostMood === 'neutral' ? 'irritated' : 'aggressive';
      break;
    case 'smudge':
      ghostMood = 'neutral';
      break;
    case 'journal':
      ghostMood = ghostMood; // No change
      break;
    default:
      break;
  }
  console.log(`[GhostManager] Mood changed to: ${ghostMood}`);
}

export function getGhostMood() {
  return ghostMood;
}

export function recordEvidence(evidence) {
  if (!evidenceFound.includes(evidence)) {
    evidenceFound.push(evidence);
    applyEvidenceDiscovery(evidence);
    addJournalEntry(`Discovered evidence: ${evidence}`);
  }
}

export function getDiscoveredEvidence() {
  return evidenceFound;
}

export function handleGhostTurn(turn) {
  const mood = getGhostMood();

  // Increase risk of hunt or activity based on ghost mood
  const shouldHunt = mood === 'aggressive' && Math.random() < 0.3;
  const shouldTriggerActivity = mood !== 'neutral' && Math.random() < 0.5;

  if (shouldHunt) {
    triggerHunt(getCurrentGhost());
  } else if (shouldTriggerActivity) {
    checkGhostActivity(getCurrentGhost());
  }
}
