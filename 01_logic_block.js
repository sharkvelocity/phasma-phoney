//=============================
// 1. WEATHER & ORB EFFECTS
//=============================
function spawnOrbs(count = 6) {
  for (let i = 0; i < count; i++) {
    const orb = document.createElement('div');
    orb.className = 'orb';
    orb.style.left = Math.random() * 100 + 'vw';
    orb.style.top = Math.random() * 100 + 'vh';
    orb.style.setProperty('--dx', (Math.random() - 0.5) * 150 + 'px');
    orb.style.setProperty('--dy', (Math.random() - 0.5) * 150 + 'px');
    const duration = 10 + Math.random() * 10;
    orb.style.animationDuration = `${duration}s, ${duration}s`;
    orb.style.animationDelay = `0s, ${Math.random() * 4}s`;
    document.body.appendChild(orb);
    setTimeout(() => {
      orb.style.transition = 'opacity 2s ease-out';
      orb.style.opacity = 0;
      setTimeout(() => orb.remove(), 3000);
    }, duration * 1000);
  }
}
setInterval(() => {
  if (document.hasFocus()) spawnOrbs(Math.floor(Math.random() * 2) + 1);
}, 5000);