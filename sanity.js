// sanity.js

let sanity = 100;
let sanityDecayRate = 1; // percent per turn
let sanityInterval = null;

export function startSanityDrain() {
  sanityInterval = setInterval(() => {
    modifySanity(-sanityDecayRate);
  }, 60000); // Decrease sanity every minute
}

export function stopSanityDrain() {
  clearInterval(sanityInterval);
}

export function modifySanity(amount) {
  sanity = Math.max(0, Math.min(100, sanity + amount));
  updateSanityVisuals();
  checkSanityThresholds();
}

export function getSanity() {
  return sanity;
}

function updateSanityVisuals() {
  const gameScreen = document.getElementById("game-screen");
  if (!gameScreen) return;

  if (sanity > 70) {
    gameScreen.style.filter = "none";
  } else if (sanity > 40) {
    gameScreen.style.filter = "grayscale(50%)";
  } else if (sanity > 20) {
    gameScreen.style.filter = "grayscale(70%) blur(1px)";
  } else {
    gameScreen.style.filter = "grayscale(100%) blur(2px)";
  }
}

function checkSanityThresholds() {
  if (sanity <= 30 && Math.random() < 0.25) {
    triggerHallucination();
  }
}

function triggerHallucination() {
  const box = document.getElementById("narrator-box");
  if (!box) return;

  const hallucinations = [
    "You hear your own name whispered from somewhere behind you...",
    "A hand grazes your back — but you're alone in the room.",
    "The candle flame flickers against a breath you cannot feel.",
    "Deo: Investigator... are you sure this house is empty?",
    "Succubus: Mmm... someone's losing their grip.",
    "A photo falls face-down on the floor. You didn't touch it.",
    "The journal’s pages flutter as if blown by a wind from within.",
  ];

  const message = hallucinations[Math.floor(Math.random() * hallucinations.length)];
  box.innerText = message;
}
