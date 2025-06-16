const CACHE_NAME = 'phasma-phoney-v1';
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './logo.png',
  './game.js',
  './mechanics.js',
  './statistics.js',
  './narrator.js',
  './dialogueEngine.js',
  './ghosts.js',
  './meta.js',
  './turnSystem.js',
  './multiRun.js',
  './commandEngine.js',
  './commandParser.js',
  './ghostManager.js',
  './ghostTalk.js',
  './evidence.js',
  './dynamicGhost.js',
  './map.js',
  './miniMap.js',
  './van.js',
  './saveSystem.js',
  './inventory.js',
  './journal.js',
  './dialogue.js',
  './ai_narrator.js',
  './succubus.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
