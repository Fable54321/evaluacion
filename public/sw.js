const CACHE_NAME = "vegibec-evaluacion-shell-v1";

async function cacheApplicationShell() {
  const cache = await caches.open(CACHE_NAME);
  const scopeUrl = new URL("./", self.registration.scope);
  const response = await fetch(scopeUrl, { cache: "no-cache" });
  if (!response.ok) throw new Error("Unable to cache application shell");
  await cache.put(scopeUrl, response.clone());
  const html = await response.text();
  const assetUrls = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map((match) => new URL(match[1], scopeUrl))
    .filter((url) => url.origin === scopeUrl.origin);
  await Promise.all(assetUrls.map(async (url) => {
    const assetResponse = await fetch(url);
    if (!assetResponse.ok) throw new Error(`Unable to cache ${url.pathname}`);
    await cache.put(url, assetResponse);
  }));
}

async function isApplicationShellCached() {
  const cache = await caches.open(CACHE_NAME);
  const scopeUrl = new URL("./", self.registration.scope);
  const response = await cache.match(scopeUrl);
  if (!response) return false;
  const html = await response.text();
  const assetUrls = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map((match) => new URL(match[1], scopeUrl))
    .filter((url) => url.origin === scopeUrl.origin);
  const cachedAssets = await Promise.all(assetUrls.map((url) => cache.match(url)));
  return cachedAssets.every(Boolean);
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheApplicationShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((names) => Promise.all(names.filter((name) => name.startsWith("vegibec-evaluacion-shell-") && name !== CACHE_NAME).map((name) => caches.delete(name)))).then(() => self.clients.claim()));
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CHECK_OFFLINE_READY") return;
  event.waitUntil(isApplicationShellCached().then((ready) => {
    event.ports[0]?.postMessage({ ready });
  }));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then(async (response) => {
      if (response.ok) (await caches.open(CACHE_NAME)).put(new URL("./", self.registration.scope), response.clone());
      return response;
    }).catch(async () => (await caches.match(request)) ?? (await caches.match(new URL("./", self.registration.scope))) ?? Response.error()));
    return;
  }

  event.respondWith(caches.match(request).then((cached) => cached ?? fetch(request).then(async (response) => {
    if (response.ok) (await caches.open(CACHE_NAME)).put(request, response.clone());
    return response;
  })));
});
