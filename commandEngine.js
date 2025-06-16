// commandEngine.js

import { handleTool } from './mechanics.js';
import { moveToRoom } from './map.js';
import { updateNarrator } from './dialogueEngine.js';
import { openJournal } from './journal.js';
import { openMap } from './miniMap.js';
import { returnToVan } from './van.js';
import { guessGhost } from './ghostManager.js';

export function executeCommand(command) {
  const cmd = command.toLowerCase().trim();

  if (cmd.startsWith('use ')) {
    const item = cmd.replace('use ', '').trim();
    return handleTool(item);
  }

  if (cmd.startsWith('move to ')) {
    const room = cmd.replace('move to ', '').trim();
    return moveToRoom(room);
  }

  if (cmd === 'journal') return openJournal();
  if (cmd === 'map') return openMap();
  if (cmd === 'van') return returnToVan();
  if (cmd.startsWith('guess ')) {
    const guess = cmd.replace('guess ', '').trim();
    return guessGhost(guess);
  }

  updateNarrator("I didn't understand that action. Try again.", 'neutral');
}
