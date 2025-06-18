// dialogue.js – Full narration pool for all major game states and item triggers

export const dialogue = {
  intro: "A new investigation begins... The ghost is unknown. Stay alert.",
  success: "You correctly identified the ghost. You live to tell the tale.",
  failure: "You failed to guess the ghost. It claims your soul.",
  vanReturn: "You retreat to the van. The job is done... for now.",

  // Item logic
  itemNone: "You don’t have anything to use.",
  crucifixUsed: "You raise the crucifix. The temperature drops instantly.",
  cameraClick: "You snap a photo. For a moment, a shadow appears.",
  saltHiss: "The salt shifts... something unseen steps into it.",
  smudgeUsed: "Smoke wafts through the air. Silence follows.",
  candleOut: "The flame flickers out without warning.",
  emfSpike: "EMF spikes! Readings jump to 5.",
  spiritBox: "A voice crackles through: 'get out'...",
  bookMessage: "Words appear in the book: 'I see you.'",
  uvPrint: "A glowing handprint appears on the wall.",
  coldSpot: "The thermometer plummets. Freezing breath clouds your vision.",

  // Movement
  moveBlocked: "That direction is blocked or leads nowhere.",
  movedRoom: (dir, room) => `You move ${dir} into the ${room}.`,

  // Journal and Ghost
  journalUpdated: "Your journal has been updated.",
  guessPrompt: "What kind of ghost do you believe this is?",
  guessCorrect: (type) => `Correct. It was a ${type}. You survive... for now.`,
  guessWrong: (type) => `Wrong. The ghost was a ${type}. You are not alone anymore...`,

  // Fallbacks
  unknownAction: "Nothing happens. The air remains still.",
  backToMenu: "Returning to menu... stay vigilant."
};
