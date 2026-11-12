const V = 'gym-2d118a323f';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request; if(r.method !== 'GET') return;
  const u = new URL(r.url);
  const isImg = (u.origin === location.origin && u.pathname.includes('/img/')) || u.hostname === 'i.ytimg.com' || u.hostname === 'fonts.gstatic.com' || u.hostname === 'fonts.googleapis.com' || u.pathname.endsWith('manifest.webmanifest');
  if(isImg){
    e.respondWith(caches.open(V).then(c => c.match(r).then(hit => hit || fetch(r).then(res => { if(res.ok || res.type === 'opaque') c.put(r, res.clone()); return res; }))));
    return;
  }
  if(u.origin === location.origin && (r.mode === 'navigate' || u.pathname.endsWith('.html') || u.pathname.endsWith('/'))){
    // mở ngay bản đã lưu (nhanh khi quay lại app), tải bản mới ngầm cho lần mở sau
    const net = fetch(r).then(res => { if(res.ok){ const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; });
    e.respondWith(caches.match(r, {ignoreSearch: true}).then(hit => hit || net).catch(() => net));
    e.waitUntil(net.catch(() => {}));
  }
});
