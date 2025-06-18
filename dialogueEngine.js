// dialogueEngine.js – Narration delivery system

import { dialogue } from './dialogue.js';

export function displayNarratorText(keyOrText) {
  const box = document.getElementById('narrator-box');
  if (!box) return;
  const text = dialogue[keyOrText] || keyOrText;
  box.innerText = text;
}
