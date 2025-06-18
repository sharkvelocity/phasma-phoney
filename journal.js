// journal.js – In-game journal system with localStorage persistence

let notes = '';
let evidenceLog = [];
const NOTES_KEY = 'phasma_notes';
const EVIDENCE_KEY = 'phasma_evidence';

export function initializeJournal() {
  notes = localStorage.getItem(NOTES_KEY) || '';
  evidenceLog = JSON.parse(localStorage.getItem(EVIDENCE_KEY)) || [];
  const textarea = document.getElementById('journal-entry');
  if (textarea) textarea.value = notes;
}

export function updateNotes(newContent) {
  notes = newContent;
  localStorage.setItem(NOTES_KEY, notes);
}

export function getNotes() {
  return notes;
}

export function logEvidence(evidence) {
  if (!evidenceLog.includes(evidence)) {
    evidenceLog.push(evidence);
    localStorage.setItem(EVIDENCE_KEY, JSON.stringify(evidenceLog));
  }
}

export function getEvidenceLog() {
  return evidenceLog;
}

export function clearJournal() {
  notes = '';
  evidenceLog = [];
  localStorage.removeItem(NOTES_KEY);
  localStorage.removeItem(EVIDENCE_KEY);
  const textarea = document.getElementById('journal-entry');
  if (textarea) textarea.value = '';
}
