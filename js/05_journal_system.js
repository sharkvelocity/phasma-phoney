
document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('start-btn');
  const gameScreen = document.getElementById('game-screen');
  const loadoutScreen = document.getElementById('loadout-screen');
  const confirmBtn = document.getElementById('confirm-loadout');
  const backBtn = document.getElementById('back-btn');
  const journalBtn = document.getElementById('journal-btn');
  const saveJournalBtn = document.getElementById('save-journal');
  const closeJournalBtn = document.getElementById('close-journal');
  const journalScreen = document.getElementById('journal-screen');

  startBtn.onclick = () => {
    const wantsLoadout = confirm("Do you want to select a loadout?");
    if (wantsLoadout) {
      showLoadoutMenu();
      loadoutScreen.style.display = 'block';
      startBtn.style.display = 'none';
    } else {
      gameScreen.classList.remove('hidden');
      startBtn.style.display = 'none';
      startGame();
    }
  };

  confirmBtn.onclick = () => {
    loadoutScreen.style.display = 'none';

    if (isVanAccess) {
      isVanAccess = false;
      renderOptions();
      return;
    }

    selectedLoadout.forEach(item => addItemToInventory(item));
    gameScreen.classList.remove('hidden');
    startGame();
  };

  backBtn.onclick = () => {
    loadoutScreen.style.display = 'none';

    if (isVanAccess) {
      isVanAccess = false;
      renderOptions();
    } else {
      startBtn.style.display = 'inline-block';
    }
  };

  journalBtn.onclick = () => {
    initializeJournal();
    journalScreen.classList.remove('hidden');
  };

  saveJournalBtn.onclick = () => {
    const text = document.getElementById('journal-entry').value;
    updateNotes(text);
    journalScreen.classList.add('hidden');
  };

  closeJournalBtn.onclick = () => {
    journalScreen.classList.add('hidden');
  };
});
