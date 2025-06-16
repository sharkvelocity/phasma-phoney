// narrator.js – Handles interaction with the narrator AI

import { narrator } from './ai_narrator.js';

export function getNarratorIntro() {
  return narrator.intro || 'The ghost awaits your presence...';
}

export function getNarratorComment(turn, sanity, evidence) {
  if (narrator.getComment) {
    return narrator.getComment(turn, sanity, evidence);
  }
  return 'Proceed with caution.';
}