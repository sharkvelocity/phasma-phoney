 

      const btn = (label, handler) => {
        const b = document.createElement('button');
        b.innerText = label;
        b.onclick = handler;
        container.appendChild(b);
      };

      btn('Move', () => {
        container.innerHTML = '';
        ['North', 'East', 'South', 'West'].forEach(dir => {
          const d = document.createElement('button');
          d.innerText = `Go ${dir}`;
          d.onclick = () => {
            displayNarratorText(movePlayer(dir));
            tickTurn();
            renderMinimap();
            renderOptions();
          };
          container.appendChild(d);
        });
        const back = document.createElement('button');
        back.innerText = 'Back';
        back.onclick = renderOptions;
        container.appendChild(back);
      });

      btn('Investigate', () => {
        displayNarratorText(performBehavior(getCurrentRoom()));
        adjustSanity(-5);
        tickTurn();
        renderMinimap();
      });

      btn('Use Item', () => {
        const items = getInventory();
        container.innerHTML = '';
        if (!items.length) {
          displayNarratorText("No items.");
          renderOptions();
          return;
        }
        items.forEach(item => {
          const i = document.createElement('button');
          i.innerText = `Use ${item}`;
          i.onclick = () => {
            displayNarratorText(useItem(item, getCurrentRoom(), getCurrentGhost().type));
            narrateItemThought(item);
            tickTurn();
            renderMinimap();
            renderOptions();
          };
          container.appendChild(i);
        });
        const back = document.createElement('button');
        back.innerText = 'Back';
        back.onclick = renderOptions;
        container.appendChild(back);
      });

      btn('Drop Item', dropItemMenu);
      btn('Pick Up Item', pickupMenu);
      btn('Guess Ghost', guessMenu);
      btn('Return to Van', () => {
        isVanAccess = true;
        showLoadoutMenu();
        document.getElementById('loadout-screen').style.display = 'block';
      });

    }
   
  
      <!-- Logic Block: _ghost_system -->
 
const ghostTypes = [
  'Spirit', 'Wraith', 'Phantom', 'Poltergeist', 'Banshee',
  'Jinn', 'Mare', 'Revenant', 'Shade', 'Demon',
  'Yurei', 'Oni', 'Hantu', 'Goryo', 'Myling',
  'Onryo', 'The Twins', 'Raiju', 'Obake', 'The Mimic',
  'Moroi', 'Deogen', 'Thaye', 'Succubus'
];

function getRandomGhost() {
  const type = ghostTypes[Math.floor(Math.random() * ghostTypes.length)];
  return { type, behavior: generateGhostBehavior(type) };
}

function generateGhostBehavior(type) {
  const baseBehaviors = [
    room => `You feel watched in the ${room}.`,
    room => `A chill runs through the ${room}.`,
    room => `The lights flicker briefly in the ${room}.`,
    room => `You hear faint whispers in the ${room}.`,
    room => `The air feels thick in the ${room}.`
  ];

  const ghostSpecifics = {
    'Poltergeist': [room => `Objects clatter violently in the ${room}.`],
    'Banshee': [room => `A piercing wail echoes through the ${room}.`],
    'Jinn': [room => `A surge of energy pulses through the ${room}.`],
    'Mare': [room => `Darkness creeps unnaturally in the ${room}.`],
    'Revenant': [room => `You sense something fast approaching in the ${room}.`],
    'Shade': [room => `Silence dominates the ${room}, too quiet.`],
    'Demon': [room => `You hear growling in the ${room}.`],
    'Yurei': [room => `A sorrowful presence hangs in the ${room}.`],
    'Oni': [room => `Loud footsteps stomp around the ${room}.`],
    'Hantu': [room => `Freezing winds swirl unnaturally in the ${room}.`],
    'Goryo': [room => `You glimpse a silhouette dart past in the ${room}.`],
    'Myling': [room => `Soft sobs fill the ${room}.`],
    'Onryo': [room => `Your lighter won't ignite in the ${room}.`],
    'The Twins': [room => `Two sets of footsteps echo in the ${room}.`],
    'Raiju': [room => `Your electronics buzz in the ${room}.`],
    'Obake': [room => `Fingerprints shift and warp in the ${room}.`],
    'The Mimic': [room => `You hear a sound that doesn’t match your evidence in the ${room}.`],
    'Moroi': [room => `Your breath fogs up as you speak in the ${room}.`],
    'Deogen': [room => `You feel eyes watching your every move in the ${room}.`],
    'Thaye': [room => `An ancient aura ages the air in the ${room}.`],
    'Succubus': [room => `A sultry whisper beckons in the ${room}.`]
  };

  return room => {
    const pool = [...baseBehaviors, ...(ghostSpecifics[type] || [])];
    return pool[Math.floor(Math.random() * pool.length)](room);
  };
}

let ghost = null;
function initializeGhost(g) { ghost = g; }
function performBehavior(room) { return ghost?.behavior(room) || 'Nothing happens.'; }
function getCurrentGhost() { return ghost; }

window.getRandomGhost = getRandomGhost;
window.initializeGhost = initializeGhost;
window.performBehavior = performBehavior;
window.getCurrentGhost = getCurrentGhost;
 

<!-- Logic Block: _journal_system -->
 
let journalNotes = '';

function updateNotes(txt) {
  journalNotes = txt;
  displayNarratorText('📝 Notes saved.');
}

function initializeJournal() {
  document.getElementById('journal-entry').value = journalNotes;
  const container = document.getElementById('evidence-checklist');
  if (container) renderEvidenceChecklist();
}


const allEvidence = ['EMF 5', 'Spirit Box', 'Fingerprints', 'Ghost Orbs', 'Ghost Writing', 'Freezing Temps', 'D.O.T.S'];

const ghostEvidenceMap = {
  Spirit: ['EMF 5', 'Spirit Box', 'Ghost Writing'],
  Wraith: ['EMF 5', 'Spirit Box', 'D.O.T.S'],
  Phantom: ['Spirit Box', 'Fingerprints', 'D.O.T.S'],
  Poltergeist: ['Spirit Box', 'Fingerprints', 'Ghost Writing'],
  Banshee: ['Fingerprints', 'Ghost Orbs', 'D.O.T.S'],
  Jinn: ['EMF 5', 'Fingerprints', 'Freezing Temps'],
  Mare: ['Spirit Box', 'Ghost Orbs', 'Ghost Writing'],
  Revenant: ['Ghost Orbs', 'Ghost Writing', 'Freezing Temps'],
  Shade: ['EMF 5', 'Ghost Writing', 'Freezing Temps'],
  Demon: ['Fingerprints', 'Ghost Writing', 'Freezing Temps'],
  Yurei: ['Ghost Orbs', 'Freezing Temps', 'D.O.T.S'],
  Oni: ['EMF 5', 'Freezing Temps', 'D.O.T.S'],
  Hantu: ['Fingerprints', 'Ghost Orbs', 'Freezing Temps'],
  Goryo: ['EMF 5', 'Fingerprints', 'D.O.T.S'],
  Myling: ['EMF 5', 'Fingerprints', 'Ghost Writing'],
  Onryo: ['Spirit Box', 'Ghost Orbs', 'Freezing Temps'],
  The Twins: ['EMF 5', 'Spirit Box', 'Freezing Temps'],
  Raiju: ['EMF 5', 'Ghost Orbs', 'D.O.T.S'],
  Obake: ['EMF 5', 'Fingerprints', 'Ghost Orbs'],
  The Mimic: ['Spirit Box', 'Fingerprints', 'Freezing Temps'],
  Moroi: ['Spirit Box', 'Ghost Writing', 'Freezing Temps'],
  Deogen: ['Spirit Box', 'Ghost Writing', 'D.O.T.S'],
  Thaye: ['Ghost Orbs', 'Ghost Writing', 'D.O.T.S'],
  Succubus: ['Spirit Box', 'Ghost Writing', 'EMF 5']
};

function renderEvidenceChecklist() {
  const container = document.getElementById('evidence-checklist');
  container.innerHTML = '';

  allEvidence.forEach(ev => {
    const label = document.createElement('label');
    label.style.display = 'inline-flex';
    label.style.alignItems = 'center';
    label.style.gap = '4px';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = ev;
    checkbox.onchange = updatePossibleGhosts;

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(ev));
    container.appendChild(label);
  });
}

function updatePossibleGhosts() {
  const selected = Array.from(document.querySelectorAll('#evidence-checklist input:checked')).map(cb => cb.value);
  const list = document.getElementById('possible-ghosts');
  list.innerHTML = '';

  if (selected.length === 0) {
    list.innerHTML = '<li>All ghosts are possible</li>';
    return;
  }

  const possible = Object.entries(ghostEvidenceMap).filter(([ghost, ev]) =>
    selected.every(sel => ev.includes(sel))
  ).map(([ghost]) => ghost);

  list.innerHTML = possible.length
    ? possible.map(g => `<li>${g}</li>`).join('')
    : '<li>No ghosts match this combination</li>';
}

window.updateNotes = updateNotes;
window.initializeJournal = initializeJournal;
 


<!-- Logic Block: 1_weather_orbs -->
 
//=============================
// 1. WEATHER & ORB EFFECTS
//=============================
function spawnOrbs(count = 6) {
  for (let i = 0; i < count; i++) {
    const orb = document.createElement('div');
    orb.className = 'orb';
    orb.style.left = Math.random() * 100 + 'vw';
    orb.style.top = Math.random() * 100 + 'vh';
    orb.style.setProperty('--dx', (Math.random() - 0.5) * 150 + 'px');
    orb.style.setProperty('--dy', (Math.random() - 0.5) * 150 + 'px');
    const duration = 10 + Math.random() * 10;
    orb.style.animationDuration = `${duration}s, ${duration}s`;
    orb.style.animationDelay = `0s, ${Math.random() * 4}s`;
    document.body.appendChild(orb);
    setTimeout(() => {
      orb.style.transition = 'opacity 2s ease-out';
      orb.style.opacity = 0;
      setTimeout(() => orb.remove(), 3000);
    }, duration * 1000);
  }
}
setInterval(() => {
  if (document.hasFocus()) spawnOrbs(Math.floor(Math.random() * 2) + 1);
}, 5000);
 

<!-- Logic Block: 2_map_system -->
 
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
 

<!-- Logic Block: 3_inventory_van -->
 
const consumables = ['Smudge Stick', 'Candle', 'Salt'];
const alwaysWithYou = ['Lighter'];
const inventory = {};
const vanInventory = {
  'Smudge Stick': 4,
  'Salt': 3,
  'Candle': 4,
  'EMF Reader': 1,
  'Spirit Box': 1,
  'Crucifix': 1,
  'UV Light': 1,
  'Thermometer': 1,
  'Parabolic Mic': 1,
  'Proximity Sensor': 1,
  'Camera': 1,
  'Ghost Writing Book': 1
};

let selectedLoadout = [], isVanAccess = false;
const roomItems = {};

const evidenceToolMap = {
  'EMF Reader': 'EMF 5',
  'Spirit Box': 'Spirit Box',
  'UV Light': 'Fingerprints',
  'Thermometer': 'Freezing Temps',
  'Camera': 'Ghost Orbs',
  'Ghost Writing Book': 'Ghost Writing',
  'Parabolic Mic': 'Whispers',
  'Salt': 'Footprints'
};

const allItems = Object.keys(vanInventory);
function getInventory() { return Object.keys(inventory).concat(alwaysWithYou); }
function updateHUD() {
  const hud = document.getElementById('hud-status');
  hud.innerText = `Turn: ${turn} | Sanity: ${getSanity()}% | XP: ${getXP()} | Inventory: ${getInventory().join(', ') || 'none'}`;
}
function addItemToInventory(item) {
  const total = Object.values(inventory).reduce((a, b) => a + b, 0);
  if (total >= 3) return displayNarratorText('❌ You can only carry 3 items.');
  inventory[item] = 1;
  updateHUD();
}
function useItem(item, room, ghostType) {
  if (!inventory[item]) return `❌ You don’t have a ${item}.`;
  let result = `🧪 You used the ${item} in the ${room}.`;

  if (['Spirit', 'Demon', 'Yurei', 'Succubus'].includes(ghostType) && item === 'Smudge Stick') {
    result += `\n🌀 The ${ghostType} becomes angry!`;
  }

  const evidence = evidenceToolMap[item];
  if (evidence) {
    const success = Math.random() < 0.6;
    if (success) {
      result += `\n🔍 You detect something...`;
      result += `\n${discoverEvidence(evidence)}`;
      lastAction = 'evidence';
    } else {
      result += `\n🕯️ It’s quiet. Maybe try again later.`;
      lastAction = 'idle';
    }
  }

  if (consumables.includes(item)) {
    delete inventory[item];
    updateHUD();
  }
  return result;
}
function dropItem(item) {
  const room = getCurrentRoom();
  if (!inventory[item]) return `❌ You don’t have a ${item} to drop.`;
  if (!roomItems[room]) roomItems[room] = [];
  roomItems[room].push(item);
  delete inventory[item];
  updateHUD();
  return `📦 You placed the ${item} in the ${room}.`;
}
function pickUpItem(item) {
  const room = getCurrentRoom();
  if (!roomItems[room] || !roomItems[room].includes(item)) return `❌ No ${item} found here.`;
  const total = Object.values(inventory).reduce((a, b) => a + b, 0);
  if (total >= 3) return `❌ Your hands are full.`;
  inventory[item] = 1;
  roomItems[room] = roomItems[room].filter(i => i !== item);
  updateHUD();
  return `🎒 You picked up the ${item}.`;
}
function showRoomItems() {
  const room = getCurrentRoom();
  const items = roomItems[room] || [];
  return items.length ? `🗂️ Items here: ${items.join(', ')}` : '📭 The room is empty.';
}
 

<!-- Logic Block: 4_cursed_tarot -->
 
const tarotCards = [
  '🃏 The Fool – Nothing happens.', '🪦 The Hanged Man – You feel your sanity drain rapidly.',
  '☀️ The Sun – Sanity fully restored!', '🌑 The Moon – Sanity drops to 0!',
  '🧙 The Hermit – The ghost is temporarily trapped.',
  '🎡 The Wheel of Fortune – Sanity shifts unpredictably.',
  '💀 Death – A hunt begins instantly!', '👹 The Devil – The ghost manifests nearby.',
  '🗼 The Tower – A crash rings out. The ghost moves to your room.',
  '👼 The High Priestess – You sense a protective spirit.'
];

function useCursedItem(name) {
  cursedItemsUsed++;
  adjustSanity(-20);
  let result = `🔮 You use the ${name}. Reality ripples through the air...`;
  if (name.toLowerCase().includes('tarot')) result += '\n' + drawTarotCard();
  lastAction = 'cursed item';
  return result;
}
function drawTarotCard() {
  const card = tarotCards[Math.floor(Math.random() * tarotCards.length)];
  if (card.includes('sanity drain')) adjustSanity(-30);
  if (card.includes('fully restored')) adjustSanity(100 - getSanity());
  if (card.includes('drops to 0')) sanity = 0;
  if (card.includes('hunt')) triggerHunt();
  if (card.includes('manifest')) ghostActivityLevel = 7;
  if (card.includes('moves to your room')) ghostActivityLevel = 8;
  return `🃏 Tarot card drawn: ${card}`;
}
 


<!-- Logic Block: 7_narration_visuals -->
 
function displayNarratorThought(text) {
  const thoughtDiv = document.getElementById('narrator-thought');
  const readout = document.getElementById('main-readout');
  thoughtDiv.innerText = text;
  readout.innerText += `\n🧠 ${text}`;
  readout.scrollTop = readout.scrollHeight;
}

function narrateItemThought(item) {
  const thoughts = {
    'Candle': [
      "I feel a little safer with a flame nearby.",
      "The candle flickers… is that wind or something else?",
      "This light might be all that stands between me and the dark."
    ],
    'Smudge Stick': [
      "Hope this keeps whatever it is at bay.",
      "The smoke curls like fingers. Protective… maybe.",
      "Old rituals for older things."
    ],
    'EMF Reader': [
      "This thing better beep at the right time.",
      "Still quiet… but that doesn’t mean safe.",
      "Waiting for the spike. Dreading it, too."
    ],
    'Spirit Box': [
      "I hate the sound it makes. Static and whispers.",
      "Every time it turns on, I brace myself.",
      "It’s talking. Or it’s trying to."
    ],
    'UV Light': [
      "Let’s see what hides in the dark.",
      "Invisible stains glow back at me. I shiver.",
      "Something touched that. Not long ago."
    ],
    'Thermometer': [
      "Come on, give me a drop.",
      "If it’s freezing in here, I’ll know soon.",
      "Cold spots mean company."
    ],
    'Parabolic Mic': [
      "What are you saying in silence?",
      "Just wind… or whispers?",
      "I’m listening. Maybe I shouldn’t be."
    ],
    'Camera': [
      "One flash might reveal too much.",
      "Say cheese, ghost.",
      "Click. Now to check what I caught."
    ],
    'Salt': [
      "Let’s see what steps through this.",
      "Hope this slows it down.",
      "Footprints would confirm I’m not alone."
    ]
  };
  if (thoughts[item]) {
    displayNarratorThought(randomFrom(thoughts[item]));
  }
}

function getAmbientByRoom(room) {
  const map = {
    'Foyer': [
      "The entryway feels colder than the outside air.",
      "Shoes are lined up neatly — untouched.",
      "Something waits beyond this welcome mat."
    ],
    'Living Room': [
      "Couch cushions sag, like they expect company.",
      "The TV screen reflects only shadows.",
      "A remote clicks on the table... by itself?"
    ],
    'Kitchen': [
      "Old dishes remain in the sink — freshly cold.",
      "The fridge hums, too steady for comfort.",
      "There’s a faint smell of something burned."
    ],
    'Dining Room': [
      "Chairs are pulled out — as if a meal was interrupted.",
      "Dust clings to the silverware like guilt.",
      "One place setting is disturbingly clean."
    ],
    'Bathroom': [
      "A faucet drips, despite being turned off.",
      "Your reflection wavers in the mirror slightly.",
      "The shower curtain sways with no breeze."
    ],
    'Bedroom': [
      "The bed is made... but the pillow’s indented.",
      "Something feels possessive about this room.",
      "Perfume still lingers in the air — faint and wrong."
    ],
    'Basement': [
      "The lightbulb flickers without pattern.",
      "Concrete sweats. Or bleeds.",
      "You hear something breathing behind the boiler."
    ],
    'Garage': [
      "Tools hang neatly. Some have moved.",
      "The smell of oil blends with something older.",
      "A workbench drawer is slightly ajar now."
    ]
  };
  return map[room] || ["You feel watched from the corners of the room."];
}

function updateEnvironmentVisuals(room, action) {
  document.body.classList.remove('lights-flicker', 'basement-fog', 'raining');
  if (room === 'Living Room' && action === 'major activity') {
    document.body.classList.add('lights-flicker');
    setTimeout(() => document.body.classList.remove('lights-flicker'), 2000);
  }
  if (room === 'Basement' && ghostActivityLevel > 5) {
    document.body.classList.add('basement-fog');
  }
}

function narrateAmbience() {
  const room = getCurrentRoom();
  updateEnvironmentVisuals(room, lastAction);

  const ambienceByAction = {
    'idle': getAmbientByRoom(room),
    'minor activity': [
      "You freeze — listening for something more.",
      "It wasn’t just the wind. Was it?",
      "You glance toward the noise but see nothing.",
      "Your mind replays the sound again and again."
    ],
    'major activity': [
      "Your pulse rises — the room feels smaller now.",
      "You tense, waiting for the next sound to follow.",
      "You can’t help but scan the shadows twice.",
      "It’s close. You know it’s close."
    ],
    'hunt': [
      "Your instincts scream: run, now.",
      "You feel your body move before your mind catches up.",
      "Every sound is too loud. Every breath is too short.",
      "You pray it didn’t see you. You’re not sure to whom."
    ],
    'cursed item': [
      "Reality swims — colors wrong and wronger.",
      "You grip something familiar to stay grounded.",
      "It worked. Or it failed. You’re not sure.",
      "Your hand tingles where the object rested."
    ],
    'evidence': [
      "You jot the detail quickly, heart racing.",
      "That confirms something. But what?",
      "You fumble to log the clue before it fades.",
      "Another piece... but is it a truth, or a trick?"
    ]
  };

  const lines = ambienceByAction[lastAction] || getAmbientByRoom(room);
  if (Math.random() < 0.4) {
    displayNarratorText(`🧠 ${randomFrom(lines)}`);
  }
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
 

<!-- Logic Block: 8_game_loop -->
 
function startGame() {
  resetStats();
  ghost = getRandomGhost();
  initializeGhost(ghost);
  initializeJournal();
  updateHUD();
  displayNarratorText("So it begins...");
  renderOptions();
}

  <div id="right-panel">
  <h3>Evidence Checklist</h3>
  <div id="evidence-checklist"></div>
  <ul id="possible-ghosts"></ul>
</div>

function tickTurn() {
  turn++;
  updateHUD();
  const ghostResult = performGhostAction();
  displayNarratorText(ghostResult);
  narrateAmbience();
}
 

<!-- Logic Block: 9_button_rendering -->
 
function renderOptions() {
  const container = document.getElementById('option-buttons');
  container.innerHTML = '';

  const btn = (label, handler) => {
    const b = document.createElement('button');
    b.innerText = label;
    b.onclick = handler;
    container.appendChild(b);
  };

  // Move Button (submenu)
  btn('Move', () => {
    container.innerHTML = '';
    ['North', 'East', 'South', 'West'].forEach(dir => {
      const dirBtn = document.createElement('button');
      dirBtn.innerText = `Go ${dir}`;
      dirBtn.onclick = () => {
        const result = movePlayer(dir);
        displayNarratorText(result);
        tickTurn();
        renderMinimap();
        renderOptions();
      };
      container.appendChild(dirBtn);
    });
    const back = document.createElement('button');
    back.innerText = 'Back';
    back.onclick = renderOptions;
    container.appendChild(back);
  });

  // Investigate
  btn('Investigate', () => {
    const msg = performBehavior(getCurrentRoom());
    adjustSanity(-5);
    displayNarratorText(msg);
    tickTurn();
    renderMinimap();
  });

  // Use Item
  btn('Use Item', () => {
    const items = getInventory();
    container.innerHTML = '';

    if (!items.length) {
      displayNarratorText("🧳 You have no items.");
      renderOptions();
      return;
    }

    items.forEach(item => {
      const itemBtn = document.createElement('button');
      itemBtn.innerText = `Use ${item}`;
      itemBtn.onclick = () => {
        const msg = useItem(item, getCurrentRoom(), getCurrentGhost().type);
        displayNarratorText(msg);
        narrateItemThought(item);
        tickTurn();
        renderMinimap();
        renderOptions();
      };
      container.appendChild(itemBtn);
    });

    const back = document.createElement('button');
    back.innerText = 'Back';
    back.onclick = renderOptions;
    container.appendChild(back);
  });

  // Item Interactions
  btn('Drop Item', dropItemMenu);
  btn('Pick Up Item', pickupMenu);
  btn('Guess Ghost', guessMenu);

  // Van Interaction
  btn('Return to Van', () => {
    isVanAccess = true;
    showLoadoutMenu();
    document.getElementById('loadout-screen').style.display = 'block';
  });

  // Always update minimap
  renderMinimap();
}
 

<!-- Logic Block: 10_dom_content_loaded -->
 
document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('start-btn');
  const gameScreen = document.getElementById('game-screen');
  const loadoutScreen = document.getElementById('loadout-screen');
  const confirmBtn = document.getElementById('confirm-loadout');
  const backBtn = document.getElementById('back-btn');
  const journalBtn = document.getElementById('journal-btn');
  const saveJournalBtn = document.getElementById('save-journal');
  const closeJournalBtn = document.getElementById('close-journal');
  const journalScreen = document.getElementById('journal-screen');

  startBtn.onclick = () => {
    const wantsLoadout = confirm("Do you want to select a loadout?");
    if (wantsLoadout) {
      showLoadoutMenu();
      loadoutScreen.style.display = 'block';
      startBtn.style.display = 'none';
    } else {
      gameScreen.classList.remove('hidden');
      startBtn.style.display = 'none';
      startGame();
    }
  };

  confirmBtn.onclick = () => {
    loadoutScreen.style.display = 'none';

    if (isVanAccess) {
      isVanAccess = false;
      renderOptions();
      return;
    }

    selectedLoadout.forEach(item => addItemToInventory(item));
    gameScreen.classList.remove('hidden');

    resetStats();
    ghost = getRandomGhost();
    initializeGhost(ghost);
    initializeJournal();
    updateHUD();
    displayNarratorText("So it begins...");
    renderOptions();
  };

  backBtn.onclick = () => {
    loadoutScreen.style.display = 'none';

    if (isVanAccess) {
      isVanAccess = false;
      renderOptions();
    } else {
      startBtn.style.display = 'inline-block';
    }
  };

  journalBtn.onclick = () => {
    initializeJournal();
    journalScreen.classList.remove('hidden');
  };

  saveJournalBtn.onclick = () => {
    const text = document.getElementById('journal-entry').value;
    updateNotes(text);
    journalScreen.classList.add('hidden');
  };

  closeJournalBtn.onclick = () => {
    journalScreen.classList.add('hidden');
  };
});
 


<!-- Logic Block: 11_webllm_jane -->
 
document.addEventListener('DOMContentLoaded', () => {
    initJane();
  });

  async function ghostNarrationFromJane(context) {
    const line = await askJane(context);
    displayNarratorText("🧠 " + line);
  }
 

 
function displayNarratorText(text) {
  const systemBox = document.getElementById('system-text');
  const readout = document.getElementById('main-readout');
  systemBox.innerText = text;
  readout.innerText += `\n${text}`;
  readout.scrollTop = readout.scrollHeight;
}
 
 
let sanity = 100;
let xp = 0;
let turn = 1;
let cursedItemsUsed = 0;
let ghostActivityLevel = 0;
let lastAction = 'idle';

function resetStats() {
  sanity = 100;
  xp = 0;
  turn = 1;
  cursedItemsUsed = 0;
  ghostActivityLevel = 0;
  lastAction = 'idle';
}

function adjustSanity(change) {
  sanity = Math.max(0, Math.min(100, sanity + change));
}

function getSanity() {
  return sanity;
}

function getXP() {
  return xp;
}

function triggerHunt() {
  lastAction = 'hunt';
  ghostActivityLevel = 10;
  adjustSanity(-30);
  displayNarratorText("💀 The ghost begins a hunt!");
}
 
 
function dropItemMenu() {
  const items = getInventory().filter(i => !alwaysWithYou.includes(i));
  const container = document.getElementById('option-buttons');
  container.innerHTML = '';

  if (!items.length) {
    displayNarratorText("📦 You have nothing to drop.");
    renderOptions();
    return;
  }

  items.forEach(item => {
    const btn = document.createElement('button');
    btn.innerText = `Drop ${item}`;
    btn.onclick = () => {
      displayNarratorText(dropItem(item));
      renderOptions();
    };
    container.appendChild(btn);
  });

  const back = document.createElement('button');
  back.innerText = 'Back';
  back.onclick = renderOptions;
  container.appendChild(back);
}

function pickupMenu() {
  const room = getCurrentRoom();
  const items = roomItems[room] || [];
  const container = document.getElementById('option-buttons');
  container.innerHTML = '';

  if (!items.length) {
    displayNarratorText("📭 Nothing to pick up here.");
    renderOptions();
    return;
  }

  items.forEach(item => {
    const btn = document.createElement('button');
    btn.innerText = `Pick Up ${item}`;
    btn.onclick = () => {
      displayNarratorText(pickUpItem(item));
      renderOptions();
    };
    container.appendChild(btn);
  });

  const back = document.createElement('button');
  back.innerText = 'Back';
  back.onclick = renderOptions;
  container.appendChild(back);
}
 
 
function showLoadoutMenu() {
  const container = document.getElementById('loadout-options');
  container.innerHTML = '';
  selectedLoadout = [];

  allItems.forEach(item => {
    const btn = document.createElement('button');
    btn.innerText = item;
    btn.onclick = () => {
      const idx = selectedLoadout.indexOf(item);
      if (idx >= 0) {
        selectedLoadout.splice(idx, 1);
        btn.style.background = '';
      } else {
        if (selectedLoadout.length >= 3) {
          alert("🎒 You can only carry 3 items.");
          return;
        }
        selectedLoadout.push(item);
        btn.style.background = 'darkgreen';
      }
    };
    container.appendChild(btn);
  });
}
 
 
function displayNarratorText(text) {
  const systemBox = document.getElementById('system-text');
  const readout = document.getElementById('main-readout');
  systemBox.innerText = text;
  readout.innerText += `\n${text}`;
  readout.scrollTop = readout.scrollHeight;
}
 
 
let sanity = 100;
let xp = 0;
let turn = 1;
let cursedItemsUsed = 0;
let ghostActivityLevel = 0;
let lastAction = 'idle';

function resetStats() {
  sanity = 100;
  xp = 0;
  turn = 1;
  cursedItemsUsed = 0;
  ghostActivityLevel = 0;
  lastAction = 'idle';
}

function adjustSanity(change) {
  sanity = Math.max(0, Math.min(100, sanity + change));
}

function getSanity() {
  return sanity;
}

function getXP() {
  return xp;
}

function triggerHunt() {
  lastAction = 'hunt';
  ghostActivityLevel = 10;
  adjustSanity(-30);
  displayNarratorText("💀 The ghost begins a hunt!");
}
 
 
function renderMinimap() {
  const minimap = document.getElementById('minimap');
  if (!minimap) return;

  const neighbors = roomMap[getCurrentRoom()] || {};
  const directions = ['North', 'East', 'South', 'West'];

  minimap.innerHTML = `<h3>Minimap</h3><p>Current Room: <strong>${getCurrentRoom()}</strong></p>`;
  directions.forEach(dir => {
    const dest = neighbors[dir];
    if (dest) {
      const line = document.createElement('div');
      line.innerText = `🧭 ${dir} → ${dest}`;
      minimap.appendChild(line);
    }
  });
}
 
 
function dropItemMenu() {
  const items = getInventory().filter(i => !alwaysWithYou.includes(i));
  const container = document.getElementById('option-buttons');
  container.innerHTML = '';

  if (!items.length) {
    displayNarratorText("📦 You have nothing to drop.");
    renderOptions();
    return;
  }

  items.forEach(item => {
    const btn = document.createElement('button');
    btn.innerText = `Drop ${item}`;
    btn.onclick = () => {
      displayNarratorText(dropItem(item));
      renderOptions();
    };
    container.appendChild(btn);
  });

  const back = document.createElement('button');
  back.innerText = 'Back';
  back.onclick = renderOptions;
  container.appendChild(back);
}

function pickupMenu() {
  const room = getCurrentRoom();
  const items = roomItems[room] || [];
  const container = document.getElementById('option-buttons');
  container.innerHTML = '';

  if (!items.length) {
    displayNarratorText("📭 Nothing to pick up here.");
    renderOptions();
    return;
  }

  items.forEach(item => {
    const btn = document.createElement('button');
    btn.innerText = `Pick Up ${item}`;
    btn.onclick = () => {
      displayNarratorText(pickUpItem(item));
      renderOptions();
    };
    container.appendChild(btn);
  });

  const back = document.createElement('button');
  back.innerText = 'Back';
  back.onclick = renderOptions;
  container.appendChild(back);
}
 
 
function guessMenu() {
  const container = document.getElementById('option-buttons');
  container.innerHTML = '';
  const ghosts = Object.keys(ghostEvidenceMap);

  ghosts.forEach(ghost => {
    const btn = document.createElement('button');
    btn.innerText = ghost;
    btn.onclick = () => {
      const correct = ghost === getCurrentGhost().type;
      const message = correct
        ? `✅ Correct! The ghost was a ${ghost}. You've survived and earned XP!`
        : `❌ Wrong. It was actually a ${getCurrentGhost().type}. Better luck next time.`;
      if (correct) xp += 50;
      displayNarratorText(message);
      document.getElementById('option-buttons').innerHTML = '';
    };
    container.appendChild(btn);
  });

  const back = document.createElement('button');
  back.innerText = 'Back';
  back.onclick = renderOptions;
  container.appendChild(back);
}
 
