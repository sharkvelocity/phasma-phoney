// dialogueEngine.js – Controls structured dialogue sequences

import { dialogue } from './dialogue.js';

export function getDialogue(key) {
  return dialogue[key] || '...';
}

export function listDialogueKeys() {
  return Object.keys(dialogue);
}