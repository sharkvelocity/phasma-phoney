// inventory.js – Manages standard and cursed item logic

let inventory = [];
const cursedItems = [
  'Music Box', 'Haunted Mirror', 'Voodoo Doll',
  'Summoning Circle', 'Tarot Cards'
];

// ✅ Add up to 3 standard items from van
export function addItemToInventory(item) {
  if (inventory.length < 3 && !inventory.includes(item)) {
    inventory.push(item);
  }
}

// ✅ Dynamically add cursed items found in-game
export function unlockCursedItem(item) {
  if (cursedItems.includes(item) && !inventory.includes(item)) {
    inventory.push(item);
    console.log(`🧿 Cursed item unlocked: ${item}`);
  }
}

export function getInventory() {
  return [...inventory];
}

export function clearInventory() {
  inventory = [];
}

export function loadInventory() {
  console.log("🎒 Inventory loaded:", inventory.join(", "));
}

// ✅ Use logic for any item
export function useItem(item, room, ghostType) {
  if (cursedItems.includes(item)) {
    return useCursedItem(item);
  }

  switch (item) {
    case 'EMF Reader':
      return Math.random() < 0.6
        ? `🔊 EMF Reader spikes in the ${room}!`
        : `🔇 EMF Reader stays silent.`;
    case 'Spirit Box':
      return Math.random() < 0.5
        ? `📻 A whisper says: “Leave…” from the box in ${room}`
        : `📻 Only static from the Spirit Box.`;
    case 'UV Light':
      return Math.random() < 0.5
        ? `🔦 You see fingerprints glowing on a nearby surface in ${room}`
        : `🔦 No UV evidence detected in ${room}.`;
    case 'Thermometer':
      return Math.random() < 0.5
        ? `🌡 Freezing temperatures recorded in the ${room}.`
        : `🌡 Temperatures seem normal.`;
    case 'Camera':
      return Math.random() < 0.4
        ? `📸 A ghost orb floats across your lens in the ${room}!`
        : `📸 You capture nothing but darkness.`;
    case 'Candle':
      return Math.random() < 0.5
        ? `🕯 The flame snuffs out violently — something is here.`
        : `🕯 Candle remains steady.`;
    case 'Crucifix':
      return Math.random() < 0.4
        ? `✝️ The Crucifix sizzles in your hand. The ghost retreats.`
        : `✝️ No reaction from the Crucifix.`;
    case 'Salt':
      return Math.random() < 0.5
        ? `🧂 You spot ghost footprints forming in the salt.`
        : `🧂 Salt lies untouched.`;
    default:
      return `❓ You use the ${item}, but nothing happens.`;
  }
}

// ✅ Handle cursed item usage with full Tarot logic
function useCursedItem(itemName) {
  switch (itemName) {
    case 'Music Box':
      return `🎵 You wind the music box. A soft tune plays… footsteps approach slowly.`;
    case 'Haunted Mirror':
      return `🪞 You stare into the mirror. A distorted vision of the ghost's room flashes before your eyes.`;
    case 'Voodoo Doll':
      return `🧸 You stick a pin in the doll. A door slams in the distance. The air thickens.`;
    case 'Summoning Circle':
      return `🔺 You light all five candles. A ghost forms within the circle… and then vanishes.`;
    case 'Tarot Cards':
      const tarotEffects = [
        '🃏 The Fool — Nothing happens.',
        '🃏 The Tower — Electronics break nearby. A ghost is disturbed.',
        '🃏 The Devil — You feel a dark presence enter the room.',
        '🃏 The Hermit — All ghost activity ceases momentarily.',
        '🃏 The Wheel of Fortune — You feel your sanity shift. (±20%)',
        '🃏 The Moon — Your sanity plummets.',
        '🃏 The Sun — You feel peace. Your sanity is restored.',
        '🃏 Death — A cursed hunt begins immediately!',
        '🃏 The High Priestess — A soul is restored. (Not useful solo)',
        '🃏 The Hanged Man — You feel your breath leave you. (False alarm... this time.)',
        '🃏 The Lovers — You feel emotionally connected to something… or someone.',
        '🃏 The Priestess — A warm presence shields you from harm.'
      ];
      return tarotEffects[Math.floor(Math.random() * tarotEffects.length)];
    default:
      return `🧿 You use the ${itemName}. Strange forces stir around you.`;
  }
}
