// game.js – Core game flow logic

import { getCurrentRoom, movePlayer } from './map.js';
import { getSanity, adjustSanity } from './mechanics.js';
import { updateJournal } from './journal.js';
import { getRandomGhost, initializeGhost, performBehavior } from './ghosts.js';
import { getInventory, useItem } from './inventory.js';

let ghost = null;
let roundActive = false;

export function startGame() {
  console.log('🚀 Game starting...');
  ghost = getRandomGhost();
  initializeGhost(ghost);
  roundActive = true;
  updateHUD();
  displayNarratorText("🕵️ Investigation begins. Ghost type unknown. Stay alert.");
  renderOptions();
}

function updateHUD() {
  const narrator = document.getElementById('narrator-box');
  if (narrator) narrator.innerText = `Sanity: ${getSanity()}% | Room: ${getCurrentRoom()}`;
}

function renderOptions() {
  const container = document.getElementById('option-buttons');
  if (!container) return;
  container.innerHTML = '';

  const opts = [
    { label: '1. Investigate', action: investigate },
    { label: '2. Use Item', action: useItemMenu },
    { label: '3. Move', action: openMoveMenu },
    { label: '4. Guess Ghost', action: guessGhost },
    { label: '5. Return to Van', action: endGame }
  ];

  opts.forEach(opt => {
    const btn = document.createElement('button');
    btn.innerText = opt.label;
    btn.onclick = opt.action;
    container.appendChild(btn);
  });
}

function investigate() {
  const msg = performBehavior(getCurrentRoom());
  updateJournal(msg);
  displayNarratorText(msg);
  adjustSanity(-5);
  updateHUD();
  renderOptions();
}

function useItemMenu() {
  const container = document.getElementById('option-buttons');
  container.innerHTML = '';
  const items = getInventory();

  if (items.length === 0) {
    displayNarratorText("🧳 You have no items.");
    renderOptions();
    return;
  }

  items.forEach((item, idx) => {
    const btn = document.createElement('button');
    btn.innerText = `${idx + 1}. Use ${item}`;
    btn.onclick = () => {
      const result = useItem(item, getCurrentRoom(), ghost.type);
      displayNarratorText(result);
      updateHUD();
      renderOptions();
    };
    container.appendChild(btn);
  });

  const back = document.createElement('button');
  back.innerText = 'Back';
  back.onclick = renderOptions;
  container.appendChild(back);
}

function openMoveMenu() {
  const container = document.getElementById('option-buttons');
  container.innerHTML = '';
  ['North', 'East', 'South', 'West'].forEach(dir => {
    const btn = document.createElement('button');
    btn.innerText = `Go ${dir}`;
    btn.onclick = () => {
      const result = movePlayer(dir);
      displayNarratorText(result);
      updateHUD();
      renderOptions();
    };
    container.appendChild(btn);
  });

  const back = document.createElement('button');
  back.innerText = 'Back';
  back.onclick = renderOptions;
  container.appendChild(back);
}

function guessGhost() {
  const container = document.getElementById('option-buttons');
  container.innerHTML = '';

  const guesses = [
    'Spirit', 'Wraith', 'Phantom', 'Poltergeist', 'Banshee',
    'Jinn', 'Mare', 'Revenant', 'Shade', 'Demon',
    'Yurei', 'Oni', 'Hantu', 'Yokai', 'Goryo',
    'Myling', 'Onryo', 'The Twins', 'Raiju', 'Obake',
    'The Mimic', 'Moroi', 'Deogen', 'Thaye', 'Succubus'
  ];

  guesses.forEach(g => {
    const btn = document.createElement('button');
    btn.innerText = g;
    btn.onclick = () => handleGuess(g);
    container.appendChild(btn);
  });

  const back = document.createElement('button');
  back.innerText = 'Back';
  back.onclick = renderOptions;
  container.appendChild(back);
}

function handleGuess(guess) {
  if (guess === ghost.type) {
    displayNarratorText(`✅ You guessed correctly! It was a ${ghost.type}.`);
  } else {
    displayNarratorText(`❌ Incorrect. The ghost was a ${ghost.type}.`);
  }
  endGame();
}

function endGame() {
  roundActive = false;
  displayNarratorText("📦 You return to the van. Investigation complete.");
  document.getElementById('option-buttons').innerHTML = '';
}
