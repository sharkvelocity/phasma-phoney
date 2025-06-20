document.addEventListener('DOMContentLoaded', () => {
    initJane();
  });

  async function ghostNarrationFromJane(context) {
    const line = await askJane(context);
    displayNarratorText("🧠 " + line);
  }