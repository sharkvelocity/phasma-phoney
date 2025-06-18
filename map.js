// map.js — Room structure and movement logic

const rooms = {
  "Foyer": { north: "Living Room" },
  "Living Room": { south: "Foyer", east: "Kitchen", west: "Bathroom" },
  "Kitchen": { west: "Living Room", north: "Dining Room" },
  "Bathroom": { east: "Living Room" },
  "Dining Room": { south: "Kitchen", east: "Garage" },
  "Garage": { west: "Dining Room", south: "Basement Stairs" },
  "Basement Stairs": { north: "Garage", down: "Basement" },
  "Basement": { up: "Basement Stairs" },
  "Bedroom": { west: "Living Room", north: "Closet" },
  "Closet": { south: "Bedroom" }
};

let currentRoom = "Foyer";

export function initializeMap() {
  currentRoom = "Foyer";
}

export function getCurrentRoom() {
  return currentRoom;
}

export function movePlayer(direction) {
  const room = rooms[currentRoom];
  if (!room || !room[direction.toLowerCase()]) {
    return `🚫 You can't go ${direction} from here.`;
  }

  currentRoom = room[direction.toLowerCase()];
  return `📍 You move ${direction} into the ${currentRoom}.`;
}

export function getAvailableDirections() {
  return Object.keys(rooms[currentRoom] || {});
}

export function getMapData() {
  return rooms;
}
