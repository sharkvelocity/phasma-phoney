// mechanics.js – Ghost activity, sanity, evidence, cursed items, and investigation tracking

let sanity = 100;
let ghostActivityLevel = 0;
let currentHunt = false;
let evidenceDiscovered = [];
let turnCount = 0;
let cursedItemsUsed = 0;
let evidenceFound = 0;

export function initializeMechanics() {
  sanity = 100;
  ghostActivityLevel = 0;
  currentHunt = false;
  evidenceDiscovered = [];
  turnCount = 0;
  cursedItemsUsed = 0;
  evidenceFound = 0;
}

// 🧠 Sanity System
export function getSanity() {
  return sanity;
}

export function adjustSanity(amount) {
  sanity = Math.max(0, Math.min(100, sanity + amount));
}

// 👻 Ghost Activity
export function getGhostActivity() {
  return ghostActivityLevel;
}

export function isHunting() {
  return currentHunt;
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

// 🔍 Evidence Tracking
export function discoverEvidence(evidenceType) {
  if (!evidenceDiscovered.includes(evidenceType)) {
    evidenceDiscovered.push(evidenceType);
    evidenceFound++;
  }
}

export function getEvidence() {
  return evidenceDiscovered;
}

export function resetEvidence() {
  evidenceDiscovered = [];
}

// 🎭 Ghost Event Simulation
export function performGhostAction() {
  const roll = Math.random();
  turnCount++;

  if (roll < 0.1) {
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

// 🔮 Cursed Items
export function useCursedItem(itemName) {
  adjustSanity(-20);
  cursedItemsUsed++;
  return `You use the ${itemName}. Reality warps momentarily around you.`;
}

// 📊 Investigation Statistics
export function getTurnCount() {
  return turnCount;
}

export function incrementTurnCount() {
  turnCount++;
}

export function getStats() {
  return {
    sanity,
    turnCount,
    evidenceFound,
    cursedItemsUsed
  };
}

export function resetStats() {
  initializeMechanics();
}
