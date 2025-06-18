// map.js – Handles room layout and player movement

let currentRoom = 'Entrance';

const rooms = {
  Entrance: { North: 'Hallway' },
  Hallway: { South: 'Entrance', East: 'Living Room', West: 'Bathroom', North: 'Master Bedroom' },
  Bathroom: { East: 'Hallway' },
  Living Room: { West: 'Hallway', North: 'Kitchen' },
  Kitchen: { South: 'Living Room' },
  'Master Bedroom': { South: 'Hallway', East: 'Closet' },
  Closet: { West: 'Master Bedroom' }
};

export function initializeMap() {
  currentRoom = 'Entrance';
}

export function movePlayer(direction) {
  const options = rooms[currentRoom];
  if (options && options[direction]) {
    currentRoom = options[direction];
    return `🚶 You move ${direction} to the ${currentRoom}.`;
  } else {
    return `⛔ You can't go ${direction} from the ${currentRoom}.`;
  }
}

export function getCurrentRoom() {
  return currentRoom;
}
