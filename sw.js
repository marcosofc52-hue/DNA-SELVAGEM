
const CACHE = "dna-selvagem-v1";

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.add("./").catch(() => {})
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE)
            .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const saved = await cache.match(request);

    if (request.mode === "navigate") {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        return saved || await cache.match("./") ||
          new Response("Abra o site com internet uma vez para salvá-lo.", {
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          });
      }
    }

    if (saved) return saved;

    try {
      const response = await fetch(request);
      if (response.ok || response.type === "opaque") {
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      return new Response("", { status: 503 });
    }
  })());
});
