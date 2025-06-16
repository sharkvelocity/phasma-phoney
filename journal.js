// journal.js – In-game journal system

let notes = '';
let evidenceLog = [];
let savedStats = {};
let savedNotesKey = 'phasma_journal_notes';
let savedEvidenceKey = 'phasma_journal_evidence';
let savedStatsKey = 'phasma_journal_stats';

export function initializeJournal() {
  notes = localStorage.getItem(savedNotesKey) || '';
  evidenceLog = JSON.parse(localStorage.getItem(savedEvidenceKey)) || [];
  savedStats = JSON.parse(localStorage.getItem(savedStatsKey)) || {};
}

export function updateNotes(newContent) {
  notes = newContent;
  localStorage.setItem(savedNotesKey, notes);
}

export function getNotes() {
  return notes;
}

export function logEvidence(evidence) {
  if (!evidenceLog.includes(evidence)) {
    evidenceLog.push(evidence);
    localStorage.setItem(savedEvidenceKey, JSON.stringify(evidenceLog));
  }
}

export function getEvidenceLog() {
  return evidenceLog;
}

export function clearJournal() {
  notes = '';
  evidenceLog = [];
  localStorage.removeItem(savedNotesKey);
  localStorage.removeItem(savedEvidenceKey);
}

export function displayJournalStats(stats) {
  savedStats = stats;
  localStorage.setItem(savedStatsKey, JSON.stringify(stats));
}

export function getJournalStats() {
  return savedStats;
}

export function renderJournalHTML() {
  const container = document.createElement('div');
  container.id = 'journal-container';
  container.innerHTML = `
    <h2>Investigator's Journal</h2>
    <textarea id="journal-notes" placeholder="Type your notes here...">${notes}</textarea>
    
    <h3>Logged Evidence</h3>
    <ul id="evidence-log">
      ${evidenceLog.map(e => `<li>${e}</li>`).join('')}
    </ul>
    
    <h3>Statistics</h3>
    <ul>
      ${Object.entries(savedStats).map(([key, val]) => `<li>${key}: ${val}</li>`).join('')}
    </ul>
    
    <button onclick="window.saveJournal()">Save Notes</button>
    <button onclick="window.clearJournal()">Clear Journal</button>
  `;
  return container;
}

// Global bindings for UI buttons
window.saveJournal = () => {
  const textArea = document.getElementById('journal-notes');
  if (textArea) updateNotes(textArea.value);
};

window.clearJournal = () => {
  if (confirm("Are you sure you want to clear all journal contents?")) {
    clearJournal();
    location.reload(); // Refresh to update UI
  }
};
