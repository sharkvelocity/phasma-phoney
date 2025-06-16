// commandParser.js

import { executeCommand } from './commandEngine.js';

const inputBox = document.getElementById('player-command');
const submitBtn = document.getElementById('command-submit');

export function initializeCommandParser() {
  if (submitBtn && inputBox) {
    submitBtn.addEventListener('click', () => {
      const command = inputBox.value;
      if (command) {
        executeCommand(command);
        inputBox.value = '';
      }
    });

    inputBox.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const command = inputBox.value;
        if (command) {
          executeCommand(command);
          inputBox.value = '';
        }
      }
    });
  }
}
