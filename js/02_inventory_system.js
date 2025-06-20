
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
