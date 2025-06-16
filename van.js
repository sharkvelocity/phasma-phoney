// van.js
import { gameState } from './game.js';
import { narratorSay } from './narrator.js';
import { updateInventoryDisplay } from './inventory.js';
import { drawMap } from './map.js';

export const van = {
  maxCarry: 3,
  currentItems: [],
  droppedItems: {},

  inventory: [
    'EMF Reader',
    'Spirit Box',
    'Ghost Writing Book',
    'UV Flashlight',
    'Thermometer',
    'Video Camera',
    'DOTS Projector',
    'Photo Camera',
    'Salt',
    'Candle',
    'Smudge Stick',
    'Crucifix',
    'Parabolic Microphone',
    'Motion Sensor',
    'Sound Sensor'
  ],

  visitVan() {
    gameState.turns++;
    narratorSay("You return to the van. You can swap or pick new tools.");
    this.showVanInterface();
  },

  showVanInterface() {
    const container = document.getElementById("narrator-box");
    container.innerHTML = `<p>Select up to 3 tools to carry:</p>`;
    const list = document.createElement("ul");
    list.style.listStyle = 'none';
    list.style.padding = '0';

    this.inventory.forEach((item) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.innerText = this.currentItems.includes(item) ? `Drop ${item}` : `Pick ${item}`;
      btn.onclick = () => this.toggleItem(item);
      li.appendChild(btn);
      list.appendChild(li);
    });

    container.appendChild(list);
    updateInventoryDisplay();
  },

  toggleItem(item) {
    const idx = this.currentItems.indexOf(item);
    if (idx > -1) {
      this.currentItems.splice(idx, 1);
      narratorSay(`${item} returned to van.`);
    } else {
      if (this.currentItems.length < this.maxCarry) {
        this.currentItems.push(item);
        narratorSay(`${item} taken from van.`);
      } else {
        narratorSay("You're already holding 3 tools. Drop one to take another.");
        return;
      }
    }
    updateInventoryDisplay();
    this.showVanInterface();
  },

  dropItemInHouse(itemName, room) {
    if (!this.droppedItems[room]) this.droppedItems[room] = [];
    this.droppedItems[room].push(itemName);
    const idx = this.currentItems.indexOf(itemName);
    if (idx !== -1) this.currentItems.splice(idx, 1);
    narratorSay(`You dropped the ${itemName} in the ${room}.`);
    updateInventoryDisplay();
  },

  pickupItemFromRoom(itemName, room) {
    if (!this.droppedItems[room]) return;
    const roomItems = this.droppedItems[room];
    const idx = roomItems.indexOf(itemName);
    if (idx > -1 && this.currentItems.length < this.maxCarry) {
      roomItems.splice(idx, 1);
      this.currentItems.push(itemName);
      narratorSay(`You picked up the ${itemName} from the ${room}.`);
      updateInventoryDisplay();
    } else {
      narratorSay("You can't carry more items or item not found.");
    }
  },

  getDroppedItems(room) {
    return this.droppedItems[room] || [];
  }
};
