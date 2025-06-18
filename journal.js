// journal.js – Complete in-game journal system with local persistence

let notes = '';
let evidenceLog = [];
const savedNotesKey = 'phasma_journal_notes';
const savedEvidenceKey = 'phasma_journal_evidence';

export function initializeJournal() {
  notes = localStorage.getItem(savedNotesKey) || '';
  evidenceLog = JSON.parse(localStorage.getItem(savedEvidenceKey)) || [];
  const textArea = document.getElementById('journal-entry');
  if (textArea) textArea.value = notes;
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

export function updateJournal(entry) {
  notes += `\n- ${entry}`;
  localStorage.setItem(savedNotesKey, notes);
  const textArea = document.getElementById('journal-entry');
  if (textArea) textArea.value = notes;
}

export function clearJournal() {
  notes = '';
  evidenceLog = [];
  localStorage.removeItem(savedNotesKey);
  localStorage.removeItem(savedEvidenceKey);
  const textArea = document.getElementById('journal-entry');
  if (textArea) textArea.value = '';
}
