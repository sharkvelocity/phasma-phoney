// game.js – Core game flow logic

import { initializeMap, movePlayer, getCurrentRoom } from './map.js';
import { initializeJournal, updateJournal } from './journal.js';
import { getGhostActivity, isHunting, triggerHunt, endHunt, getSanity, adjustSanity, getEvidence, discoverEvidence, useCursedItem } from './mechanics.js';
import { getRandomGhost, initializeGhost } from './ghosts.js';
import { displayNarratorText } from './dialogueEngine.js';
import { addItemToInventory, getInventory, useItem } from './inventory.js';
import { incrementTurn, setOutcome, updateStats } from './statistics.js';

let ghost;
let roundActive = false;

export function startGame() {
  roundActive = true;
  ghost = getRandomGhost();
  initializeGhost(ghost);
  initializeMap();
  initializeJournal();
  updateStats({ investigations: 1 });
  updateHUD();
  displayNarratorText(`A new investigation begins... The ghost type is unknown. Stay alert.`);
  renderOptions();
}

function updateHUD() {
  document.getElementById('narrator-box').innerText = `Sanity: ${getSanity()}% | Room: ${getCurrentRoom()}`;
}

function renderOptions() {
  const container = document.getElementById('option-buttons');
  container.innerHTML = '';
  const options = [
    { label: '1. Investigate', action: investigate },
    { label: '2. Use Item', action: handleItemUse },
    { label: '3. Move', action: openMoveMenu },
    { label: '4. Guess Ghost', action: openGuessPopup },
    { label: '5. Return to Van', action: endGame }
  ];
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.innerText = opt.label;
    btn.onclick = opt.action;
    container.appendChild(btn);
  });
}

function investigate() {
  incrementTurn();
  const result = ghost.performBehavior(getCurrentRoom());
  updateJournal(result);
  displayNarratorText(result);
  updateHUD();
  renderOptions();
}

function handleItemUse() {
  const items = getInventory();
  const container = document.getElementById('option-buttons');
  container.innerHTML = '';
  if (items.length === 0) {
    displayNarratorText('You have no items to use.');
    renderOptions();
    return;
  }
  items.forEach((item, i) => {
    const btn = document.createElement('button');
    btn.innerText = `${i + 1}. Use ${item}`;
    btn.onclick = () => {
      const feedback = useItem(item, getCurrentRoom(), ghost.type);
      displayNarratorText(feedback);
      updateHUD();
      renderOptions();
    };
    container.appendChild(btn);
  });
  const backBtn = document.createElement('button');
  backBtn.innerText = 'Back';
  backBtn.onclick = renderOptions;
  container.appendChild(backBtn);
}

function openMoveMenu() {
  const container = document.getElementById('option-buttons');
  container.innerHTML = '';
  const directions = ['North', 'East', 'South', 'West'];
  directions.forEach(dir => {
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
  const backBtn = document.createElement('button');
  backBtn.innerText = 'Back';
  backBtn.onclick = renderOptions;
  container.appendChild(backBtn);
}

function openGuessPopup() {
  const popup = document.getElementById('guess-popup');
  const list = document.getElementById('ghost-options');
  list.innerHTML = '';
  const guesses = [
    'Spirit','Wraith','Phantom','Poltergeist','Banshee','Jinn','Mare','Revenant','Shade','Demon','Yurei','Oni','Hantu','Yokai','Goryo','Myling','Onryo','The Twins','Raiju','Obake','The Mimic','Moroi','Deogen','Thaye','Succubus'
  ];
  guesses.forEach(type => {
    const btn = document.createElement('button');
    btn.innerText = type;
    btn.onclick = () => handleGuess(type);
    list.appendChild(btn);
  });
  popup.classList.remove('hidden');
}

function handleGuess(guess) {
  const correct = guess === ghost.type;
  setOutcome({ guess, ghost: ghost.type, correct });
  const message = correct
    ? `Correct! It was a ${ghost.type}. You survive and earn experience.`
    : `Wrong guess. It was a ${ghost.type}. The ghost claims you.`;
  displayNarratorText(message);
  roundActive = false;
  endGame();
}

function endGame() {
  roundActive = false;
  displayNarratorText("You return to the van. The investigation concludes.");
}

document.getElementById('start-btn').onclick = () => {
  document.getElementById('title-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
  startGame();
};
