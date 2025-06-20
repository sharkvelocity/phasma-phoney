
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
