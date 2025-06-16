let playerStats = {
  totalGames: 0,
  correctGuesses: 0,
  deaths: 0,
  notesWritten: 0,
};

export function loadStats() {
  const saved = localStorage.getItem('phoneyStats');
  if (saved) playerStats = JSON.parse(saved);
}

export function saveStats() {
  localStorage.setItem('phoneyStats', JSON.stringify(playerStats));
}

export function incrementStat(statName) {
  if (playerStats.hasOwnProperty(statName)) {
    playerStats[statName]++;
    saveStats();
  }
}

export function getStatsHTML() {
  return `
    <div id="stats-display">
      <h3>Investigator Statistics</h3>
      <ul>
        <li>Total Games Played: ${playerStats.totalGames}</li>
        <li>Correct Ghost Guesses: ${playerStats.correctGuesses}</li>
        <li>Times Killed: ${playerStats.deaths}</li>
        <li>Journal Notes Written: ${playerStats.notesWritten}</li>
      </ul>
    </div>
  `;
}
