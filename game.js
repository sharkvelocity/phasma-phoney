// game.js – Stable startGame integration for Phasma-Phoney

import { initializeMap, movePlayer, getCurrentRoom } from './map.js';
import { initializeJournal, updateJournal } from './journal.js';
import { getSanity } from './mechanics.js';
import { getRandomGhost, initializeGhost } from './ghosts.js';
import { addItemToInventory, getInventory, useItem } from './inventory.js';

let ghost = null;
let roundActive = false;

export function startGame() {
  roundActive = true;
  ghost = getRandomGhost();
  initializeGhost(ghost);
  initializeMap();
  initializeJournal();
  displayNarratorText("A new investigation begins. The ghost is unknown. Stay alert.");
  renderOptions();
}

function renderOptions() {
  const container = document.getElementById('option-buttons');
  if (!container) return;
  container.innerHTML = '';

  const options = [
    { label: '1. Investigate', action: investigate },
    { label: '2. Use Item', action: useInventoryItem },
    { label: '3. Move', action: openMoveMenu },
    { label: '4. Guess Ghost', action: guessGhost },
    { label: '5. Return to Van', action: returnToVan }
  ];

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.innerText = opt.label;
    btn.onclick = opt.action;
    container.appendChild(btn);
  });
}

function investigate() {
  updateJournal("You search the room. It's eerily quiet...");
  displayNarratorText("You hear faint footsteps echoing nearby...");
  renderOptions();
}

function useInventoryItem() {
  const inv = getInventory();
  if (!inv.length) {
    displayNarratorText("You have no items.");
    renderOptions();
    return;
  }

  const container = document.getElementById('option-buttons');
  container.innerHTML = '';
  inv.forEach((item, i) => {
    const btn = document.createElement('button');
    btn.innerText = `${i + 1}. Use ${item}`;
    btn.onclick = () => {
      const result = useItem(item, getCurrentRoom(), ghost?.type || '');
      displayNarratorText(result || "Nothing happened.");
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
      const moveText = movePlayer(dir);
      displayNarratorText(moveText);
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
  displayNarratorText("Guessing is not implemented yet.");
  renderOptions();
}

function returnToVan() {
  displayNarratorText("You return to the van. Investigation ends.");
}
