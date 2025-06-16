// evidence.js
import { getCurrentGhost } from './ghosts.js';
import { recordEvent, updateJournal } from './journal.js';
import { getNarratorLine } from './meta.js';

const evidenceCooldowns = {};
const COOLDOWN_MS = 3000;

const evidenceMessages = {
  EMF: [
    "The EMF reader shrieks with a spike to level 5!",
    "It buzzes wildly—EMF 5 confirmed.",
    "A sudden jolt! The EMF hits red."
  ],
  'Spirit Box': [
    "A disembodied voice hisses through the static.",
    "You hear a whisper: *get out...*",
    "The Spirit Box crackles with ghostly speech."
  ],
  'Ghost Writing': [
    "You flip open the book... writing appears!",
    "Scribbled words manifest from nowhere.",
    "The pen moves—something is writing!"
  ],
  UV: [
    "A glowing handprint is smeared across the door.",
    "You shine the light—something was here.",
    "Faint glowing footprints trail toward the window."
  ],
  Freezing: [
    "You see your breath—it's freezing in here.",
    "Ice creeps across the walls.",
    "Your skin tingles—the room drops below zero."
  ],
  DOTS: [
    "A shadow darts across the green grid.",
    "Something flashes past the DOTS!",
    "You blink—and see it sprint by again."
  ],
  Video: [
    "A faint orb glides across the video feed.",
    "Something floats—visible only on the screen.",
    "The camera catches a drifting spirit orb."
  ]
};

export function checkForEvidence(tool) {
  const now = Date.now();
  if (evidenceCooldowns[tool] && now - evidenceCooldowns[tool] < COOLDOWN_MS) {
    recordEvent(`⏳ You must wait before using the ${tool} again.`);
    return;
  }

  evidenceCooldowns[tool] = now;

  const ghost = getCurrentGhost();
  if (!ghost || !ghost.evidence || !Array.isArray(ghost.evidence)) {
    recordEvent(`🔍 The ${tool} does not react to anything here.`);
    return;
  }

  const narrator = getNarratorLine();

  if (ghost.evidence.includes(tool)) {
    const message = getRandomEvidenceMessage(tool);
    recordEvent(`${narrator} ${message}`);
    updateJournal(`📘 Found evidence: ${tool}`);
  } else {
    recordEvent(`${narrator} The ${tool} shows nothing unusual.`);
  }
}

function getRandomEvidenceMessage(tool) {
  const list = evidenceMessages[tool];
  return list ? list[Math.floor(Math.random() * list.length)] : "Paranormal activity detected.";
}

export function resetEvidenceCooldowns() {
  for (const key in evidenceCooldowns) {
    delete evidenceCooldowns[key];
  }
}
