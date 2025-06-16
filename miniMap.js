// minimap.js

import { updateNarrator, advanceTurn } from './turnSystem.js';
import { gameState } from './game.js';

const rooms = [
  'Van', 'Foyer', 'Living Room', 'Kitchen', 'Garage',
  'Bathroom', 'Bedroom 1', 'Bedroom 2', 'Basement', 'Attic'
];

const connections = {
  'Van': ['Foyer'],
  'Foyer': ['Van', 'Living Room', 'Kitchen'],
  'Living Room': ['Foyer', 'Bedroom 1'],
  'Kitchen': ['Foyer', 'Garage', 'Bathroom'],
  'Garage': ['Kitchen'],
  'Bathroom': ['Kitchen'],
  'Bedroom 1': ['Living Room', 'Bedroom 2'],
  'Bedroom 2': ['Bedroom 1', 'Basement'],
  'Basement': ['Bedroom 2', 'Attic'],
  'Attic': ['Basement']
};

export function initMinimap() {
  const mapView = document.getElementById('map-view');
  mapView.innerHTML = '<button onclick="toggleMinimap()">🗺️ Minimap</button><div id="minimap" style="display:none;"></div>';
}

window.toggleMinimap = function () {
  const map = document.getElementById('minimap');
  if (map.style.display === 'none') {
    renderMinimap();
    map.style.display = 'block';
  } else {
    map.style.display = 'none';
  }
};

function renderMinimap() {
  const container = document.getElementById('minimap');
  container.innerHTML = '';
  rooms.forEach(room => {
    const btn = document.createElement('button');
    btn.innerText = room;
    btn.style.margin = '2px';
    btn.style.background = gameState.location === room ? 'lime' : 'black';
    btn.style.color = 'white';
    btn.onclick = () => moveToRoom(room);
    container.appendChild(btn);
  });
}

function moveToRoom(targetRoom) {
  if (targetRoom === gameState.location) {
    updateNarrator(`You're already in the ${targetRoom}.`);
    return;
  }

  const path = getShortestPath(gameState.location, targetRoom);
  if (!path.length) {
    updateNarrator(`You can't reach the ${targetRoom} from here.`);
    return;
  }

  const turnsToMove = path.length - 1;
  updateNarrator(`Moving to ${targetRoom} (${turnsToMove} turns)...`);
  gameState.location = targetRoom;

  for (let i = 0; i < turnsToMove; i++) {
    advanceTurn(); // One turn per space moved
  }

  renderMinimap();
}

// Dijkstra-style shortest path search
function getShortestPath(start, goal, visited = new Set()) {
  if (start === goal) return [start];
  visited.add(start);
  const paths = connections[start]
    .filter(next => !visited.has(next))
    .map(next => [start, ...getShortestPath(next, goal, new Set(visited))])
    .filter(path => path[path.length - 1] === goal);
  if (!paths.length) return [];
  return paths.reduce((a, b) => (a.length < b.length ? a : b));
}
