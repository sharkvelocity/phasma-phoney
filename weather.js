//=============================
// 1. WEATHER & ORB EFFECTS
//=============================
function spawnOrbs(count = 6) {
  for (let i = 0; i < count; i++) {
    const orb = document.createElement('div');
    orb.className = 'orb';
    orb.style.left = Math.random() * 100 + 'vw';
    orb.style.top = Math.random() * 100 + 'vh';
    orb.style.setProperty('--dx', (Math.random() - 0.5) * 150 + 'px');
    orb.style.setProperty('--dy', (Math.random() - 0.5) * 150 + 'px');
    const duration = 10 + Math.random() * 10;
    orb.style.animationDuration = `${duration}s, ${duration}s`;
    orb.style.animationDelay = `0s, ${Math.random() * 4}s`;
    document.body.appendChild(orb);
    setTimeout(() => {
      orb.style.transition = 'opacity 2s ease-out';
      orb.style.opacity = 0;
      setTimeout(() => orb.remove(), 3000);
    }, duration * 1000);
  }
}
setInterval(() => {
  if (document.hasFocus()) spawnOrbs(Math.floor(Math.random() * 2) + 1);
}, 5000);

const consumables = ['Smudge Stick', 'Candle', 'Salt'];
const alwaysWithYou = ['Lighter'];
const inventory = {};
const vanInventory = {
  'Smudge Stick': 4,
  'Salt': 3,
  'Candle': 4,
  'EMF Reader': 1,
  'Spirit Box': 1,
  'Crucifix': 1,
  'UV Light': 1,
  'Thermometer': 1,
  'Parabolic Mic': 1,
  'Proximity Sensor': 1,
  'Camera': 1,
  'Ghost Writing Book': 1
};

let selectedLoadout = [], isVanAccess = false;
const roomItems = {};

const evidenceToolMap = {
  'EMF Reader': 'EMF 5',
  'Spirit Box': 'Spirit Box',
  'UV Light': 'Fingerprints',
  'Thermometer': 'Freezing Temps',
  'Camera': 'Ghost Orbs',
  'Ghost Writing Book': 'Ghost Writing',
  'Parabolic Mic': 'Whispers',
  'Salt': 'Footprints'
};

const allItems = Object.keys(vanInventory);
function getInventory() { return Object.keys(inventory).concat(alwaysWithYou); }
function updateHUD() {
  const hud = document.getElementById('hud-status');
  hud.innerText = `Turn: ${turn} | Sanity: ${getSanity()}% | XP: ${getXP()} | Inventory: ${getInventory().join(', ') || 'none'}`;
}
function addItemToInventory(item) {
  const total = Object.values(inventory).reduce((a, b) => a + b, 0);
  if (total >= 3) return displayNarratorText('❌ You can only carry 3 items.');
  inventory[item] = 1;
  updateHUD();
}
function useItem(item, room, ghostType) {
  if (!inventory[item]) return `❌ You don’t have a ${item}.`;
  let result = `🧪 You used the ${item} in the ${room}.`;

  if (['Spirit', 'Demon', 'Yurei', 'Succubus'].includes(ghostType) && item === 'Smudge Stick') {
    result += `\n🌀 The ${ghostType} becomes angry!`;
  }

  const evidence = evidenceToolMap[item];
  if (evidence) {
    const success = Math.random() < 0.6;
    if (success) {
      result += `\n🔍 You detect something...`;
      result += `\n${discoverEvidence(evidence)}`;
      lastAction = 'evidence';
    } else {
      result += `\n🕯️ It’s quiet. Maybe try again later.`;
      lastAction = 'idle';
    }
  }

  if (consumables.includes(item)) {
    delete inventory[item];
    updateHUD();
  }
  return result;
}
function dropItem(item) {
  const room = getCurrentRoom();
  if (!inventory[item]) return `❌ You don’t have a ${item} to drop.`;
  if (!roomItems[room]) roomItems[room] = [];
  roomItems[room].push(item);
  delete inventory[item];
  updateHUD();
  return `📦 You placed the ${item} in the ${room}.`;
}
function pickUpItem(item) {
  const room = getCurrentRoom();
  if (!roomItems[room] || !roomItems[room].includes(item)) return `❌ No ${item} found here.`;
  const total = Object.values(inventory).reduce((a, b) => a + b, 0);
  if (total >= 3) return `❌ Your hands are full.`;
  inventory[item] = 1;
  roomItems[room] = roomItems[room].filter(i => i !== item);
  updateHUD();
  return `🎒 You picked up the ${item}.`;
}
function showRoomItems() {
  const room = getCurrentRoom();
  const items = roomItems[room] || [];
  return items.length ? `🗂️ Items here: ${items.join(', ')}` : '📭 The room is empty.';
}

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