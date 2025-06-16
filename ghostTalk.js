// ghostTalk.js
import { getCurrentGhost, getGameState, updateGameState, triggerHuntChance } from './game.js';
import { playNarratorLine } from './dialogueEngine.js';

let ghostTalkCooldown = 0;

export function ghostTalk(phrase) {
  const gameState = getGameState();
  const ghost = getCurrentGhost();

  // Cooldown check
  if (ghostTalkCooldown > 0) {
    playNarratorLine("You should give the spirit a moment before trying again...");
    return;
  }

  // Mood-based tone matching
  const mood = ghost.mood || 'neutral'; // 'neutral', 'agitated', 'friendly'
  let response = '';
  let behaviorShift = false;

  const friendlyLines = ghost.ghostTalkLines.filter(line => line.tone === 'friendly');
  const agitatedLines = ghost.ghostTalkLines.filter(line => line.tone === 'agitated');
  const neutralLines = ghost.ghostTalkLines.filter(line => line.tone === 'neutral');

  switch (mood) {
    case 'friendly':
      response = randomFrom(friendlyLines) || randomFrom(neutralLines);
      break;
    case 'agitated':
      response = randomFrom(agitatedLines) || randomFrom(neutralLines);
      behaviorShift = true;
      break;
    default:
      response = randomFrom(neutralLines);
      break;
  }

  playNarratorLine(`The ghost whispers: "${response.text}"`);

  // Cooldown application
  ghostTalkCooldown = 3; // e.g., 3 turns
  updateGameState('ghostTalkCooldown', ghostTalkCooldown);

  // Chance of reaction
  if (behaviorShift) {
    const aggressionRoll = Math.random();
    if (aggressionRoll > 0.7) {
      playNarratorLine("You feel a sudden chill. The ghost didn't like that...");
      triggerHuntChance(0.2); // 20% chance to provoke hunt
    }
  }
}

export function decrementGhostTalkCooldown() {
  if (ghostTalkCooldown > 0) {
    ghostTalkCooldown--;
    updateGameState('ghostTalkCooldown', ghostTalkCooldown);
  }
}

function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}
