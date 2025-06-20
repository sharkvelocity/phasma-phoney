
function startGame() {
  resetStats();
  ghost = getRandomGhost();
  initializeGhost(ghost);
  initializeJournal();
  updateHUD();
  displayNarratorText("So it begins...");
  renderOptions();
}

function tickTurn() {
  turn++;
  updateHUD();
  const ghostResult = performGhostAction();
  displayNarratorText(ghostResult);
  narrateAmbience();
}
