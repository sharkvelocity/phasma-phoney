// journal.js – In-game journal system

let notes = '';
let evidenceLog = [];

export function initializeJournal() {
  notes = '';
  evidenceLog = [];
}

export function updateNotes(newContent) {
  notes = newContent;
}

export function getNotes() {
  return notes;
}

export function logEvidence(evidence) {
  if (!evidenceLog.includes(evidence)) {
    evidenceLog.push(evidence);
  }
}

export function getEvidenceLog() {
  return evidenceLog;
}

export function updateJournal(entry) {
  notes += `\n- ${entry}`;
  const textArea = document.getElementById('journal-entry');
  if (textArea) textArea.value = notes;
}
