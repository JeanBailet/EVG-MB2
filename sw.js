// Mode hors ligne : garde la page, les polices et les vidéos en mémoire sur le téléphone.
const CACHE = 'interlits-evg-v1';
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(['./', './index.html'].map((u) => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const isPage = req.mode === 'navigate' || req.destination === 'document';
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    if (isPage) {
      // la page : réseau d'abord (pour prendre les modifications), sinon la copie gardée
      try { const r = await fetch(req); if (r.ok) c.put('./index.html', r.clone()); return r; }
      catch (err) { return (await c.match('./index.html')) || (await c.match('./')) || Response.error(); }
    }
    // vidéos, polices, images : la copie gardée d'abord, sinon le réseau
    const hit = await c.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try { const r = await fetch(req); if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }
    catch (err) { return Response.error(); }
  })());
});
