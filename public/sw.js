/* ═══════════════════════════════════════════════════════════
   TalatSuite Service Worker — เปลือกแอปสำหรับ PWA
   • แคชหน้าแอป (HTML/JS/CSS/ฟอนต์/ไอคอน) → เปิดเร็ว + ออฟไลน์ได้
   • network-first เสมอ → หลัง deploy ได้โค้ดใหม่เสมอ ไม่ติดค้างรุ่นเก่า
   • /api/** ไม่แคชเด็ดขาด (ข้อมูลสดตลอด)
   ═══════════════════════════════════════════════════════════ */
const CACHE = 'talatsuite-v5-6-0';
const SHELL = [
  '/',
  '/app.js',
  '/styles.css',
  '/i18n.js',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/fonts/fonts.css',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;                 /* เฉพาะ GET */
  if (url.origin !== self.location.origin) return;        /* ข้ามของนอกเว็บ */
  if (url.pathname.startsWith('/api/')) return;           /* API = สดเสมอ */
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        /* ได้ของใหม่ → อัปเดตแคช */
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || caches.match('/')))
  );
});

/* รับคำสั่งจากหน้าแอป */
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
