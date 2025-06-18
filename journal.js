// journal.js – Player note-taking system with internal memory

let journalNotes = "";

export function initializeJournal() {
  journalNotes = "";
  const textarea = document.getElementById("journal-entry");
  if (textarea) {
    textarea.value = "";
  }
}

export function updateNotes(note) {
  journalNotes = note;
  console.log("📝 Journal updated:", journalNotes);
}

export function getJournalNotes() {
  return journalNotes;
}
