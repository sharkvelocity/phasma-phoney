let journalNotes = '';

function updateNotes(txt) {
  journalNotes = txt;
  displayNarratorText('📝 Notes saved.');
}

function initializeJournal() {
  document.getElementById('journal-entry').value = journalNotes;
  renderEvidenceChecklist();
}

const allEvidence = ['EMF 5', 'Spirit Box', 'Fingerprints', 'Ghost Orbs', 'Ghost Writing', 'Freezing Temps', 'D.O.T.S'];

const ghostEvidenceMap = {
  Spirit: ['EMF 5', 'Spirit Box', 'Ghost Writing'],
  Wraith: ['EMF 5', 'Spirit Box', 'D.O.T.S'],
  Phantom: ['Spirit Box', 'Fingerprints', 'D.O.T.S'],
  Poltergeist: ['Spirit Box', 'Fingerprints', 'Ghost Writing'],
  Banshee: ['Fingerprints', 'Ghost Orbs', 'D.O.T.S'],
  Jinn: ['EMF 5', 'Fingerprints', 'Freezing Temps'],
  Mare: ['Spirit Box', 'Ghost Orbs', 'Ghost Writing'],
  Revenant: ['Ghost Orbs', 'Ghost Writing', 'Freezing Temps'],
  Shade: ['EMF 5', 'Ghost Writing', 'Freezing Temps'],
  Demon: ['Fingerprints', 'Ghost Writing', 'Freezing Temps'],
  Yurei: ['Ghost Orbs', 'Freezing Temps', 'D.O.T.S'],
  Oni: ['EMF 5', 'Freezing Temps', 'D.O.T.S'],
  Hantu: ['Fingerprints', 'Ghost Orbs', 'Freezing Temps'],
  Goryo: ['EMF 5', 'Fingerprints', 'D.O.T.S'],
  Myling: ['EMF 5', 'Fingerprints', 'Ghost Writing'],
  Onryo: ['Spirit Box', 'Ghost Orbs', 'Freezing Temps'],
  The Twins: ['EMF 5', 'Spirit Box', 'Freezing Temps'],
  Raiju: ['EMF 5', 'Ghost Orbs', 'D.O.T.S'],
  Obake: ['EMF 5', 'Fingerprints', 'Ghost Orbs'],
  The Mimic: ['Spirit Box', 'Fingerprints', 'Freezing Temps'],
  Moroi: ['Spirit Box', 'Ghost Writing', 'Freezing Temps'],
  Deogen: ['Spirit Box', 'Ghost Writing', 'D.O.T.S'],
  Thaye: ['Ghost Orbs', 'Ghost Writing', 'D.O.T.S'],
  Succubus: ['Spirit Box', 'Ghost Writing', 'EMF 5']
};

function renderEvidenceChecklist() {
  const container = document.getElementById('evidence-checklist');
  container.innerHTML = '';

  allEvidence.forEach(ev => {
    const label = document.createElement('label');
    label.style.display = 'inline-flex';
    label.style.alignItems = 'center';
    label.style.gap = '4px';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = ev;
    checkbox.onchange = updatePossibleGhosts;

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(ev));
    container.appendChild(label);
  });
}

function updatePossibleGhosts() {
  const selected = Array.from(document.querySelectorAll('#evidence-checklist input:checked')).map(cb => cb.value);
  const list = document.getElementById('possible-ghosts');
  list.innerHTML = '';

  if (selected.length === 0) {
    list.innerHTML = '<li>All ghosts are possible</li>';
    return;
  }

  const possible = Object.entries(ghostEvidenceMap).filter(([ghost, ev]) =>
    selected.every(sel => ev.includes(sel))
  ).map(([ghost]) => ghost);

  list.innerHTML = possible.length
    ? possible.map(g => `<li>${g}</li>`).join('')
    : '<li>No ghosts match this combination</li>';
}

window.updateNotes = updateNotes;
window.initializeJournal = initializeJournal;