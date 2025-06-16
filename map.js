// map.js

export const RoomMap = {
  Attic: ['Hallway'],
  Hallway: ['Attic', 'Bathroom', 'Bedroom', 'Living Room'],
  Bathroom: ['Hallway'],
  Bedroom: ['Hallway', 'Garage'],
  Garage: ['Bedroom', 'Kitchen'],
  Kitchen: ['Garage', 'Living Room'],
  Living Room: ['Kitchen', 'Hallway', 'Basement'],
  Basement: ['Living Room']
};

let currentRoom = 'Van';

export function generateRandomMap() {
  // For now, structure is fixed — but rooms can be shuffled later.
  return RoomMap;
}

export function getCurrentRoom() {
  return currentRoom;
}

export function moveToRoom(targetRoom, updateTurnCallback) {
  const path = calculatePath(currentRoom, targetRoom);
  if (!path || path.length === 0) {
    alert("You can't move there directly.");
    return;
  }

  const turnsNeeded = path.length - 1;
  currentRoom = targetRoom;

  if (updateTurnCallback) {
    updateTurnCallback(turnsNeeded);
  }

  updateMapView();
}

function calculatePath(start, end, visited = new Set()) {
  if (start === end) return [start];
  visited.add(start);

  const neighbors = RoomMap[start] || [];
  for (let neighbor of neighbors) {
    if (!visited.has(neighbor)) {
      const path = calculatePath(neighbor, end, visited);
      if (path) return [start, ...path];
    }
  }
  return null;
}

export function updateMapView() {
  const mapElement = document.getElementById('map-view');
  if (!mapElement) return;

  mapElement.innerHTML = '';
  Object.keys(RoomMap).forEach(room => {
    const button = document.createElement('button');
    button.textContent = room;
    button.onclick = () => moveToRoom(room, turns => {
      window.dispatchEvent(new CustomEvent('turnsTaken', { detail: { turns } }));
    });
    button.style.margin = '4px';
    button.disabled = room === currentRoom;
    mapElement.appendChild(button);
  });
}
