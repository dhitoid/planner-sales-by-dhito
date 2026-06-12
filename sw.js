importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

const CACHE_NAME = 'scheduly-cache-v6'; // Naikkan versi cache
const ASSETS = ['/', '/index.html', '/manifest.json'];

firebase.initializeApp({
  apiKey: "AIzaSyDheNr02M_ReVweMi1hD9S4VRlnW3NqaIE",
  authDomain: "scheduly-pro.firebaseapp.com",
  projectId: "scheduly-pro",
  storageBucket: "scheduly-pro.firebasestorage.app",
  messagingSenderId: "792259340926",
  appId: "1:792259340926:web:a675394c4b76801bba062f"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Menerima pesan push: ', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'Agenda Scheduly';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'Waktunya cek jadwal Anda!',
    icon: 'https://cdn-icons-png.flaticon.com/512/8336/8336048.png', 
    badge: 'https://cdn-icons-png.flaticon.com/512/8336/8336048.png',
    vibrate: [500, 250, 500],
    requireInteraction: true,
    data: { 
        id: payload.data?.id, 
        url: payload.data?.url || '/' 
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
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

// INTERCEPT FETCH: Amankan jalur API Firebase agar tidak masuk Cache Box
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  
  const url = e.request.url;
  // JANGAN cache request yang mengarah ke server Firebase/Google API
  if (
    url.includes('firestore.googleapis.com') || 
    url.includes('firebaseio.com') ||
    url.includes('fcmregistration.googleapis.com') ||
    url.includes('googleapis.com') ||
    url.includes('firebase')
  ) {
      return; 
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Kembalikan cache dulu, tapi tetap fetch di background untuk update cache berikutnya (Stale-While-Revalidate)
        fetch(e.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
          }
        }).catch(() => {/* ignore network failure */});
        return cachedResponse;
      }

      return fetch(e.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
        return response;
      });
    })
  );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = event.notification.data.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Cek apakah ada tab yang sudah terbuka
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === targetUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            // Jika tidak ada, buka tab baru
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
