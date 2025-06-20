
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
