// inventory.js – Player inventory management system

export const defaultInventory = ['journal', 'lighter'];
export let carriedItems = [...defaultInventory];
export let vanInventory = [
  'EMF Reader',
  'Spirit Box',
  'Video Camera',
  'Photo Camera',
  'Ghost Writing Book',
  'UV Light',
  'DOTS Projector',
  'Thermometer',
  'Salt',
  'Candle',
  'Smudge Stick',
  'Motion Sensor',
  'Sound Sensor',
  'Parabolic Microphone'
];

export let droppedItems = []; // Tracks in-house item placements

const MAX_CARRY = 3;

export function resetInventory() {
  carriedItems = [...defaultInventory];
  droppedItems = [];
}

export function getCurrentInventory() {
  return carriedItems;
}

export function getVanInventory() {
  return vanInventory;
}

export function getDroppedItems() {
  return droppedItems;
}

export function carryItem(item) {
  if (carriedItems.includes(item)) {
    return `${item} is already in your hand.`;
  }

  if (carriedItems.length - defaultInventory.length >= MAX_CARRY) {
    return `You can only carry ${MAX_CARRY} investigation items. Drop one first.`;
  }

  if (vanInventory.includes(item)) {
    carriedItems.push(item);
    return `You picked up the ${item}.`;
  } else {
    return `${item} is not available in the van.`;
  }
}

export function dropItem(item) {
  if (!carriedItems.includes(item)) {
    return `${item} is not in your inventory.`;
  }

  if (defaultInventory.includes(item)) {
    return `You can't drop your default item: ${item}.`;
  }

  carriedItems = carriedItems.filter(i => i !== item);
  droppedItems.push(item);
  return `You dropped the ${item} inside the house.`;
}

export function retrieveDroppedItem(item) {
  if (!droppedItems.includes(item)) {
    return `${item} is not in the house.`;
  }

  if (carriedItems.length - defaultInventory.length >= MAX_CARRY) {
    return `You're carrying too much. Drop something before picking up ${item}.`;
  }

  droppedItems = droppedItems.filter(i => i !== item);
  carriedItems.push(item);
  return `You picked the ${item} back up.`;
}

export function listInventory() {
  return `Inventory: ${carriedItems.join(', ')}`;
}

export function listVanItems() {
  return `Available in van: ${vanInventory.join(', ')}`;
}
