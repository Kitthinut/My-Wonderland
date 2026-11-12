var CACHE_NAME = "wonderland-shell-v2";
var APP_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./css/foundation.css",
  "./css/room-scene.css",
  "./css/habits.css",
  "./css/planning-food.css",
  "./css/focus.css",
  "./css/gamification.css",
  "./css/calendar.css",
  "./css/cloud-sync.css",
  "./js/firebase-config.js?v=20261112-2058",
  "./js/core.js",
  "./js/journal.js",
  "./js/habits.js",
  "./js/food.js",
  "./js/focus.js",
  "./js/computer.js",
  "./js/wonder.js",
  "./js/media.js",
  "./js/manifest.js",
  "./js/calendar.js",
  "./js/money.js",
  "./js/backup.js",
  "./js/room-layout.js",
  "./js/startup.js",
  "./js/cloud-sync.js?v=20261112-2058",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_FILES);
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) {
            return key.indexOf("wonderland-shell-") === 0 && key !== CACHE_NAME;
          })
          .map(function (key) {
            return caches.delete(key);
          }),
      );
    }).then(function () {
      return self.clients.claim();
    }),
  );
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }
  event.respondWith(
    caches.match(request).then(function (cached) {
      return cached || fetch(request);
    }),
  );
});
