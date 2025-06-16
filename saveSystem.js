// saveSystem.js

let saveKey = 'phasmaPhoney_saveData';

export function saveGameState(state) {
  try {
    const dataToSave = JSON.stringify(state);
    localStorage.setItem(saveKey, dataToSave);
    console.log('[SaveSystem] Game state saved.');
  } catch (e) {
    console.error('[SaveSystem] Failed to save game state:', e);
  }
}

export function loadGameState() {
  try {
    const savedData = localStorage.getItem(saveKey);
    if (savedData) {
      console.log('[SaveSystem] Game state loaded.');
      return JSON.parse(savedData);
    }
  } catch (e) {
    console.error('[SaveSystem] Failed to load game state:', e);
  }
  return null;
}

export function clearSavedState() {
  try {
    localStorage.removeItem(saveKey);
    console.log('[SaveSystem] Game state cleared.');
  } catch (e) {
    console.error('[SaveSystem] Failed to clear saved game state:', e);
  }
}
