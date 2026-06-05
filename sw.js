// Import Firebase SDK (Versi Compat)
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

const CACHE_NAME = 'scheduly-cache-v3'; // Naikkan versi cache agar up-to-date
// Hapus CDN eksternal dari sini agar instalasi Service Worker lebih stabil
const ASSETS = [
  '/', 
  'index.html',
  'manifest.json',
  '/icon.png' // Pastikan kamu punya file ini
];

// Inisialisasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDheNr02M_ReVweMi1hD9S4VRlnW3NqaIE",
  authDomain: "scheduly-pro.firebaseapp.com",
  projectId: "scheduly-pro",
  storageBucket: "scheduly-pro.firebasestorage.app",
  messagingSenderId: "792259340926",
  appId: "1:792259340926:web:a675394c4b76801bba062f"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// --- 1. LOGIKA FIREBASE MESSAGING (BACKGROUND) ---
messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] Menerima pesan background: ', payload);
  const notificationTitle = payload.notification.title || 'Pengingat Scheduly';
  const notificationOptions = {
    body: payload.notification.body || 'Kamu punya jadwal baru!',
    icon: '/icon.png', 
    data: { id: payload.data?.id, url: payload.data?.url || '/' }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// --- 2. EVENT INSTALL ---
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

// --- 3. EVENT ACTIVATE ---
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// --- 4. EVENT FETCH (STRATEGI NETWORK-FIRST) ---
self.addEventListener('fetch', (e) => {
  // Hanya proses request GET. Biarkan POST/PUT lewat.
  if (e.request.method !== 'GET') return;

  // JANGAN cache request ke database Firebase agar fitur offline mereka bekerja
  if (e.request.url.includes('firestore.googleapis.com') || e.request.url.includes('firebaseio.com')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Jika jaringan sukses, simpan/update ke cache untuk dipakai saat offline
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Jika offline, ambil dari cache
        return caches.match(e.request);
      })
  );
});

// --- 5. EVENT NOTIFICATIONCLICK ---
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const action = event.action;
    const notificationData = event.notification.data || {};

    if (action === 'selesai') {
        event.waitUntil(
            self.clients.matchAll({ type: 'window' }).then((clientList) => {
                clientList.forEach(client => client.postMessage({ type: 'MARK_DONE', eventId: notificationData.id }));
            })
        );
    } else {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
                for (const client of clientList) {
                    if (client.url.includes('/') && 'focus' in client) return client.focus();
                }
                if (clients.openWindow) return clients.openWindow(notificationData.url || '/');
            })
        );
    }
});
