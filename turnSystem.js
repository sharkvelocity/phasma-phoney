// turnSystem.js

import { gameState } from './game.js';
import { checkForEvidence } from './evidence.js';
import { triggerGhostActivity } from './ghosts.js';
import { applyCursedEffects } from './mechanics.js';
import { updateNarrator } from './narrator.js';
import { updateMap } from './map.js';
import { checkForHunt } from './ghostManager.js';
import { logStatEvent } from './statistics.js';

export function takeTurn(command = "") {
  if (gameState.isGameOver) return;

  gameState.turnsTaken++;

  if (command && command.toLowerCase() !== "journal") {
    logStatEvent("commandsIssued");
    gameState.commandHistory.push(command);
  }

  // Apply sanity drain
  drainSanity();

  // Run ghost behavior
  triggerGhostActivity();

  // Apply cursed effects if active
  applyCursedEffects();

  // Evidence check (if applicable)
  checkForEvidence();

  // Hunt check (danger!)
  checkForHunt();

  // Map and room effects
  updateMap();

  // Narrator response
  updateNarrator(command);

  // Auto-prompt journal reminder
  if (gameState.turnsTaken % 3 === 0) {
    updateNarrator("You may want to record something in your journal...");
  }

  // Update previous room tracker
  gameState.previousRoom = gameState.currentRoom;
}

function drainSanity() {
  let drainAmount = 1;

  if (gameState.environment.darkness) drainAmount += 1;
  if (gameState.environment.stress > 50) drainAmount += 1;
  if (gameState.environment.isBloodMoon) drainAmount += 1;

  gameState.sanity -= drainAmount;
  if (gameState.sanity < 0) gameState.sanity = 0;

  logStatEvent("sanityDrained", drainAmount);
}
