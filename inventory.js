// inventory.js – Item handling and effects

let inventory = ['Crucifix', 'Camera', 'Salt', 'Smudge Stick', 'Candle', 'EMF Reader', 'Spirit Box', 'Ghost Writing Book', 'UV Flashlight', 'Thermometer'];

export function getInventory() {
  return inventory;
}

export function addItemToInventory(item) {
  if (!inventory.includes(item)) {
    inventory.push(item);
  }
}

export function useItem(item, room, ghostType) {
  if (!inventory.includes(item)) {
    return `You don't have a ${item}.`;
  }

  let message = '';
  switch (item) {
    case 'Crucifix':
      message = ['Demon', 'Revenant', 'Thaye'].includes(ghostType)
        ? 'The crucifix glows and repels something unseen.'
        : 'The crucifix warms faintly... but nothing reacts.';
      break;
    case 'Camera':
      message = ['Phantom', 'Goryo', 'The Mimic'].includes(ghostType)
        ? 'A ghostly image appears for a split second!'
        : 'The camera clicks. Empty photo.';
      break;
    case 'Salt':
      message = ['Wraith', 'Banshee', 'Spirit', 'The Twins'].includes(ghostType)
        ? 'Salt scatters. A footprint burns into it instantly.'
        : 'The salt lays untouched.';
      break;
    case 'Smudge Stick':
      message = ['Yurei', 'Oni', 'Moroi'].includes(ghostType)
        ? 'Smoke surrounds you. The room lightens briefly.'
        : 'The smudge fizzles out quietly.';
      break;
    case 'Candle':
      message = ['Onryo', 'Mare'].includes(ghostType)
        ? 'The candle extinguishes suddenly on its own.'
        : 'The candle flickers gently but stays lit.';
      break;
    case 'EMF Reader':
      message = ['Raiju', 'Obake', 'Spirit'].includes(ghostType)
        ? 'The EMF spikes violently to red! Something is here.'
        : 'Nothing detected on EMF.';
      break;
    case 'Spirit Box':
      message = ['Yokai', 'Deogen', 'Spirit'].includes(ghostType)
        ? 'A voice whispers: "leave..."'
        : 'White noise crackles endlessly.';
      break;
    case 'Ghost Writing Book':
      message = ['Demon', 'Yurei', 'Revenant'].includes(ghostType)
        ? 'A page flips. Writing appears: "die."'
        : 'The book remains blank.';
      break;
    case 'UV Flashlight':
      message = ['Obake', 'Banshee', 'Goryo'].includes(ghostType)
        ? 'You see a glowing fingerprint... and another forming.'
        : 'No evidence under UV light.';
      break;
    case 'Thermometer':
      message = ['Hantu', 'Moroi', 'Shade'].includes(ghostType)
        ? 'The reading drops to freezing instantly.'
        : 'Temperature remains steady.';
      break;
    default:
      message = `You use the ${item}, but nothing happens.`;
      break;
  }

  // Remove used item
  inventory = inventory.filter(i => i !== item);
  return message;
}
