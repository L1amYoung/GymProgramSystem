const V = 'gym-a5b0f673e3', IMG = 'gym-img';
const isImgReq = u => (u.origin === location.origin && u.pathname.includes('/img/')) || u.hostname === 'i.ytimg.com' || u.hostname === 'static.exercisedb.dev' || u.hostname === 'fonts.gstatic.com' || u.hostname === 'fonts.googleapis.com' || u.pathname.endsWith('manifest.webmanifest');
self.addEventListener('install', e => e.waitUntil(caches.open(V).then(c => c.add(new Request('./', {cache: 'reload'}))).catch(() => {}).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil((async () => {
  const img = await caches.open(IMG);
  for(const k of await caches.keys()){
    if(k === V || k === IMG) continue;
    try{ const c = await caches.open(k);   // giữ ảnh từ bản cũ
      for(const r of await c.keys()){ if(isImgReq(new URL(r.url)) && !(await img.match(r))){ const res = await c.match(r); if(res) await img.put(r, res); } } }catch(err){}
    await caches.delete(k);
  }
  await self.clients.claim();
})()));
self.addEventListener('fetch', e => {
  const r = e.request; if(r.method !== 'GET') return;
  const u = new URL(r.url);
  if(isImgReq(u)){
    const local = u.origin === location.origin;
    e.respondWith(caches.open(IMG).then(c => c.match(r).then(hit => {
      const net = fetch(r).then(res => { if(res.ok || res.type === 'opaque') c.put(r, res.clone()); return res; });
      if(hit){ if(local) e.waitUntil(net.catch(() => {})); return hit; }   // có sẵn: trả ngay, ảnh của site kiểm tra ngầm
      return net;
    })));
    return;
  }
  if(u.origin === location.origin && (r.mode === 'navigate' || u.pathname.endsWith('.html') || u.pathname.endsWith('/'))){
    // mở ngay bản đã lưu, tải bản mới ngầm cho lần mở sau
    const net = fetch(r).then(res => { if(res.ok){ const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; });
    e.respondWith(caches.open(V).then(c => c.match(r, {ignoreSearch: true}).then(hit => hit || c.match('./'))).then(hit => hit || net).catch(() => net));
    e.waitUntil(net.catch(() => {}));
  }
});
