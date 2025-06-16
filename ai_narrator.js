// ai_narrator.js
// Handles narration from Succubus and Deo based on game context

export const narrator = {
  currentVoice: "Deo", // or "Succubus", can toggle based on mood/intensity

  narrate(event, context = {}) {
    let line = "";
    switch (event) {
      case "start":
        line = this.random([
          "Welcome, investigator... darkness awaits.",
          "Ah, the hunt begins again. Let us see what haunts this place.",
          "You step into silence, but it will not remain so for long."
        ]);
        break;

      case "evidence_found":
        line = this.random([
          `That was a clear sign... Did you see it?`,
          `Evidence... the ghost reveals itself, piece by piece.`,
          `You’re getting closer. Keep pushing.`  
        ]);
        break;

      case "cursed_item_used":
        line = this.random([
          `You've tampered with power best left buried.`,
          `Tsk. That cursed thing will cost you, one way or another.`,
          `Brave or foolish, time will tell.`
        ]);
        break;

      case "sanity_low":
        this.currentVoice = "Succubus";
        line = this.random([
          `Mmm... I can feel your thoughts slipping. Stay with me a little longer...`,
          `Losing yourself, are you? Delicious.`,
          `Don’t worry, I’ll be right here... until the end.`
        ]);
        break;

      case "hunt_start":
        line = this.random([
          `Run.`,
          `It's coming... hide, now.`,
          `Your breath won't save you this time.`
        ]);
        break;

      case "death":
        this.currentVoice = "Succubus";
        line = this.random([
          `How beautiful you were, in your final moment.`,
          `Now you're just another ghost in the dark.`,
          `Rest, darling... I’ll remember your scream.`
        ]);
        break;

      case "guess_correct":
        line = this.random([
          `You’ve done it. The spirit is named, the case closed.`,
          `Impressive deduction. You might survive after all.`,
          `Truth shines even in this gloom.`
        ]);
        break;

      case "guess_wrong":
        line = this.random([
          `No... that wasn’t it. Something else lurks here.`,
          `You’ve named the wrong soul. It’s still watching.`,
          `Mistaken. Now deal with the consequences.`
        ]);
        break;

      default:
        line = this.random([
          "…",
          "Something stirs...",
          "The house listens."
        ]);
    }

    this.output(line);
  },

  random(lines) {
    return lines[Math.floor(Math.random() * lines.length)];
  },

  output(line) {
    const box = document.getElementById("narrator-box");
    box.innerText = (this.currentVoice === "Succubus" ? "Succubus: " : "Deo: ") + line;
  },

  setVoice(name) {
    this.currentVoice = name;
  }
};
