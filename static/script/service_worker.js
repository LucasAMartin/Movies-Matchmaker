// USED FOR PWA SUPPORT, SO APP CAN BE INSTALLED LOCALLY

// Cached core static resources
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("static").then(cache => {
      return cache.addAll(["./", "/static/img/android-chrome-192x192.png"]);
    })
  );
});

// Fetch resources
self.addEventListener("fetch",e=>{
  e.respondWith(
    caches.match(e.request).then(response=>{
      return response||fetch(e.request);
    })
  );
})