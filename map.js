// map.js – Expanded house layout with 3x3 grid navigation

let currentRoom = 'Entrance';

const roomMap = {
  'Entrance': { North: 'Hallway' },
  'Hallway': { South: 'Entrance', East: 'Living Room', West: 'Bathroom', North: 'Garage' },
  'Living Room': { West: 'Hallway', North: 'Kitchen' },
  'Kitchen': { South: 'Living Room', East: 'Dining Room' },
  'Dining Room': { West: 'Kitchen' },
  'Bathroom': { East: 'Hallway', North: 'Bedroom' },
  'Bedroom': { South: 'Bathroom', East: 'Closet' },
  'Closet': { West: 'Bedroom' },
  'Garage': { South: 'Hallway', East: 'Workshop' },
  'Workshop': { West: 'Garage', South: 'Basement' },
  'Basement': { North: 'Workshop' }
};

export function initializeMap() {
  currentRoom = 'Entrance';
}

export function movePlayer(direction) {
  const room = roomMap[currentRoom];
  if (room && room[direction]) {
    currentRoom = room[direction];
    return `You move ${direction} into the ${currentRoom}.`;
  } else {
    return `You can't go ${direction} from here.`;
  }
}

export function getCurrentRoom() {
  return currentRoom;
}
