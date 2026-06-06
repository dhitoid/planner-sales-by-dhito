importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

const CACHE_NAME = 'scheduly-cache-v4'; 
const ASSETS = ['/', '/index.html', '/manifest.json'];

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

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title || 'Agenda Baru Scheduly';
  const notificationOptions = {
    body: payload.notification.body || 'Cek jadwalmu sekarang!',
    icon: 'https://cdn-icons-png.flaticon.com/512/8336/8336048.png', 
    badge: 'https://cdn-icons-png.flaticon.com/512/8336/8336048.png',
    vibrate: [500, 250, 500, 250, 500],
    requireInteraction: true,
    data: { id: payload.data?.id, url: payload.data?.url || '/' },
    actions: [
        { action: 'buka', title: '📱 Buka Scheduly' },
        { action: 'selesai', title: '✅ Tandai Selesai' }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('firestore.googleapis.com') || e.request.url.includes('firebaseio.com')) return;

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const action = event.action;
    const notificationData = event.notification.data || {};

    if (action === 'selesai' && notificationData.id) {
        event.waitUntil(
            self.clients.matchAll({ type: 'window' }).then((clientList) => {
                clientList.forEach(client => client.postMessage({ type: 'MARK_DONE', eventId: notificationData.id }));
            })
        );
    } else {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
                for (const client of clientList) {
                    if (client.url.includes('/') && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) return clients.openWindow(notificationData.url || '/');
            })
        );
    }
});
