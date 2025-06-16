// ghosts.js – Registry of ghost types

import { Succubus } from './succubus.js';

export const ghostRegistry = {
  succubus: Succubus
};

export function getGhostByName(name) {
  return ghostRegistry[name.toLowerCase()] || null;
}

export function listAllGhosts() {
  return Object.keys(ghostRegistry);
}