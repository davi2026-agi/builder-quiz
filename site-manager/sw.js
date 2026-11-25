const V = 'sm-v3';
const ASSETS = ["./", "./index.html", "./manifest.json", "./favicon.svg", "./css/s1.css", "./css/s2.css", "./css/s3.css", "./js/p1.js", "./js/p2.js", "./js/p3.js", "./js/p4.js", "./js/p5.js", "./js/p6.js", "./js/p7.js", "./js/p8.js", "./js/p9.js"];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()).catch(() => {}));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(r => {
      if (r && r.ok) { const cp = r.clone(); caches.open(V).then(c => c.put(req, cp)); }
      return r;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
