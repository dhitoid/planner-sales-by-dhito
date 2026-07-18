// Import Firebase Script untuk Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// 1. Inisialisasi Firebase di Background (Ganti config ini dengan milik Firebase kamu)
firebase.initializeApp({
  apiKey: "AIzaSyDheNr02M_ReVweMi1hD9S4VRlnW3NqaIE",
  authDomain: "scheduly-pro.firebaseapp.com",
  projectId: "scheduly-pro",
  storageBucket: "scheduly-pro.firebasestorage.app",
  messagingSenderId: "792259340926",
  appId: "1:792259340926:web:a675394c4b76801bba062f"
});

const messaging = firebase.messaging();

// 2. Menangkap Push Notification saat PWA ditutup
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Menerima pesan background ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: 'https://cdn-icons-png.flaticon.com/512/8336/8336048.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/8336/8336048.png', // Icon kecil untuk Android status bar
    vibrate: [500, 200, 500],
    data: payload.data // Bawa URL atau data agar bisa diklik
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 3. Aksi saat Notifikasi di klik (Buka aplikasi)
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Jika PWA sudah terbuka, fokuskan
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url.includes('/') && 'focus' in client) {
          return client.focus();
        }
      }
      // Jika PWA ditutup, buka window baru
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
