// mechanics.js – Handles ghost logic, sanity, evidence, and cursed items

import { updateStats, getStats, clearStats, getTurnCount, incrementTurnCount } from './statistics.js';
import { adjustSanity as altAdjustSanity, getSanity as altGetSanity } from './sanity.js';

let ghostActivityLevel = 0;
let currentHunt = false;
let evidenceDiscovered = [];

export function initializeMechanics() {
  ghostActivityLevel = 0;
  currentHunt = false;
  evidenceDiscovered = [];
}

export function getGhostActivity() {
  return ghostActivityLevel;
}

export function triggerHunt() {
  currentHunt = true;
  ghostActivityLevel = 10;
  adjustSanity(-25);
}

export function endHunt() {
  currentHunt = false;
  ghostActivityLevel = 0;
}

export function isHunting() {
  return currentHunt;
}

export function getSanity() {
  const stats = getStats();
  return stats.sanity ?? 100;
}

export function adjustSanity(amount) {
  const stats = getStats();
  stats.sanity = Math.max(0, Math.min(100, (stats.sanity ?? 100) + amount));
  updateStats(stats);
}

export function discoverEvidence(evidenceType) {
  if (!evidenceDiscovered.includes(evidenceType)) {
    evidenceDiscovered.push(evidenceType);
    updateStats({ evidenceFound: (getStats().evidenceFound || 0) + 1 });
  }
}

export function getEvidence() {
  return evidenceDiscovered;
}

export function resetEvidence() {
  evidenceDiscovered = [];
}

export function performGhostAction() {
  const roll = Math.random();
  if (roll < 0.1) {
    ghostActivityLevel = 10;
    triggerHunt();
    return 'The air turns ice cold. You hear rapid footsteps. The hunt has begun!';
  } else if (roll < 0.3) {
    ghostActivityLevel = 6;
    adjustSanity(-10);
    return 'Lights flicker ominously. Something brushes your arm...';
  } else if (roll < 0.6) {
    ghostActivityLevel = 3;
    return 'You hear a distant thump. Something just moved nearby.';
  } else {
    ghostActivityLevel = 1;
    return 'A cold draft passes by, but nothing happens.';
  }
}

export function useCursedItem(itemName) {
  adjustSanity(-20);
  updateStats({ cursedItemsUsed: (getStats().cursedItemsUsed || 0) + 1 });
  return `You use the ${itemName}. Reality warps momentarily around you.`;
}

export function getTurnCount() {
  return getTurnCount();
}

export function incrementTurnCount() {
  incrementTurnCount();
}