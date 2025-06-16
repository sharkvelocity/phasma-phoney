import { startGame } from './game.js';
import { openMemories } from './multiRun.js';
import { openSettings } from './saveSystem.js';

// Startup logo fade
window.addEventListener('DOMContentLoaded', () => {
  const logo = document.getElementById('startup-logo');
  const titleScreen = document.getElementById('title-screen');

  setTimeout(() => {
    logo.classList.add('fade-out');
    setTimeout(() => {
      logo.remove();
      titleScreen.style.display = 'flex';
    }, 2500);
  }, 2500); // delay before fade

  // Wire up buttons
  document.getElementById('start-btn').addEventListener('click', () => {
    titleScreen.style.display = 'none';
    startGame();
  });

  document.getElementById('memories-btn').addEventListener('click', () => {
    titleScreen.style.display = 'none';
    openMemories();
  });

  document.getElementById('settings-btn').addEventListener('click', () => {
    titleScreen.style.display = 'none';
    openSettings();
  });

  // Hide the unused command entry box
  const cmdBox = document.getElementById('command-box');
  if (cmdBox) cmdBox.style.display = 'none';
});
