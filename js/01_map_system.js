
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
