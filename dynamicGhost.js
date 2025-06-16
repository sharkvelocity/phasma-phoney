import { ghostList } from './ghostData.js';

let currentGhost = null;

function randomizeGhost() {
  const index = Math.floor(Math.random() * ghostList.length);
  return ghostList[index];
}

function switchGhost() {
  currentGhost = randomizeGhost();
  return currentGhost;
}

currentGhost = randomizeGhost();
export { switchGhost, currentGhost };
