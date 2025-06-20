const rooms = ['Foyer', 'Living Room', 'Kitchen', 'Dining Room', 'Bathroom', 'Bedroom', 'Basement', 'Garage'];
let currentRoom = 'Foyer';

const roomMap = {
  'Foyer':        { North: 'Living Room', East: 'Garage', South: 'Basement' },
  'Living Room':  { South: 'Foyer', East: 'Kitchen', West: 'Dining Room' },
  'Kitchen':      { West: 'Living Room' },
  'Dining Room':  { East: 'Living Room' },
  'Bathroom':     { North: 'Bedroom' },
  'Bedroom':      { South: 'Bathroom' },
  'Garage':       { West: 'Foyer' },
  'Basement':     { North: 'Foyer' }
};

function movePlayer(direction) {
  const destination = roomMap[currentRoom]?.[direction];
  if (!destination) return `❌ Can't go ${direction}.`;
  currentRoom = destination;
  adjustSanity(-2);
  return `🚪 You move ${direction} into the ${destination}.`;
}
function getCurrentRoom() { return currentRoom; }
window.movePlayer = movePlayer;
window.getCurrentRoom = getCurrentRoom;