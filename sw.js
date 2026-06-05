const CACHE_NAME = 'scheduly-cache-v2'; // Naikkan ke v2 agar browser memuat pembaruan
const ASSETS = [
  '/', // Sangat disarankan menambahkan root path
  'index.html',
  'manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11',
  'https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js'
];

// 1. EVENT INSTALL: Simpan aset ke cache dan paksa SW baru langsung aktif
self.addEventListener('install', (e) => {
  self.skipWaiting(); // Memaksa service worker baru untuk langsung aktif tanpa menunggu tab ditutup
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// 2. EVENT ACTIVATE: Hapus cache versi lama agar tidak memakan memori, lalu ambil alih kontrol
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Menghapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. EVENT FETCH: Mengambil aset dari cache (Offline Mode)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});

// =========================================================================
// 4. EVENT NOTIFICATIONCLICK: Menangkap aksi dari Notifikasi Prioritas Tinggi
// =========================================================================
self.addEventListener('notificationclick', (event) => {
    event.notification.close(); // Selalu tutup notifikasi setelah diklik user

    const action = event.action;
    const notificationData = event.notification.data;

    // Jika user menekan tombol "Tandai Selesai" dari notifikasi
    if (action === 'selesai') {
        event.waitUntil(
            self.clients.matchAll({ type: 'window' }).then((clientList) => {
                for (const client of clientList) {
                    // Kirim pesan ke index.html untuk mengeksekusi centang selesai
                    client.postMessage({
                        type: 'MARK_DONE',
                        eventId: notificationData.id
                    });
                }
            })
        );
    } 
    // Jika user mengklik badan notifikasi atau tombol "Buka"
    else {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
                // Jika tab Scheduly sudah terbuka, fokuskan layar ke tab tersebut
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url.includes('scheduly') && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Jika aplikasi tertutup sepenuhnya, buka aplikasi (window baru)
                if (clients.openWindow) {
                    return clients.openWindow(notificationData.url || '/');
                }
            })
        );
    }
});
