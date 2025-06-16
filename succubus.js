// succubus.js
// Succubus narrator: reacts to mood, ghost behavior, and tone escalation

export class Succubus {
  constructor() {
    this.mood = "neutral"; // can be: neutral, amused, curious, aroused, angry
    this.lastInteraction = 0;
    this.cooldown = 3; // turns between tone changes
  }

  updateMood(eventType) {
    switch (eventType) {
      case "ghostTalk":
        this.mood = this._randomMood(["curious", "amused"]);
        break;
      case "evidenceFound":
        this.mood = this._randomMood(["curious", "aroused"]);
        break;
      case "huntStart":
        this.mood = "angry";
        break;
      case "playerIdle":
        this.mood = "bored";
        break;
      default:
        this.mood = "neutral";
    }
  }

  getDialogue(context) {
    const mood = this.mood;
    const responses = {
      neutral: [
        "Let’s see what secrets this house holds...",
        "Ghosts never rest, you know. Not really.",
      ],
      amused: [
        "You’re cute when you think you’re in control.",
        "Keep teasing it like that, and it just might respond.",
      ],
      curious: [
        "Did you hear that? Mmm… delicious fear.",
        "Such strange energy. Something wants to be seen.",
      ],
      aroused: [
        "The veil is so thin now… it tingles, doesn’t it?",
        "Ahh… I can feel it breathing on your neck.",
      ],
      angry: [
        "You’ve gone and upset it. Good.",
        "Let’s see who survives this little game, shall we?",
      ],
      bored: [
        "Yawn… is this really your best effort?",
        "Ghosts get impatient. So do I.",
      ]
    };

    const pool = responses[mood] || responses["neutral"];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  _randomMood(possibleMoods) {
    return possibleMoods[Math.floor(Math.random() * possibleMoods.length)];
  }
}

export const succubus = new Succubus();
