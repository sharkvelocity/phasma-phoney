// game.js

import { updateNarrator, showDialogue } from './dialogueEngine.js';
import { startNewRun, getCurrentRunState } from './multiRun.js';
import { openJournal, updateJournal } from './journal.js';
import { openMap } from './miniMap.js';
import { returnToVan } from './van.js';
import { presentActions } from './commandEngine.js';

let gameStarted = false;

export function startGame() {
  if (gameStarted) return;
  gameStarted = true;

  document.getElementById('title-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'block';

  startNewRun();
  updateNarrator("Welcome, investigator. The house awaits.");
  promptAction();
}

export function promptAction() {
  const actions = presentActions(getCurrentRunState());
  const container = document.getElementById('action-buttons');
  container.innerHTML = '';

  actions.forEach(action => {
    const btn = document.createElement('button');
    btn.textContent = action.text;
    btn.onclick = action.callback;
    container.appendChild(btn);
  });
}

// UI Navigation Handlers
document.getElementById('open-journal').addEventListener('click', () => {
  openJournal();
});

document.getElementById('open-map').addEventListener('click', () => {
  openMap();
});

document.getElementById('return-van').addEventListener('click', () => {
  returnToVan();
});
