importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Config yang sama dengan yang di index.html
firebase.initializeApp({
  apiKey: "AIzaSyDheNr02M_ReVweMi1hD9S4VRlnW3NqaIE",
  projectId: "scheduly-pro",
  messagingSenderId: "792259340926",
  appId: "1:792259340926:web:a675394c4b76801bba062f"
});

const messaging = firebase.messaging();

// Menangani notifikasi di Latar Belakang (Background)
messaging.onBackgroundMessage(function(payload) {
  console.log('[sw.js] Menerima pesan latar belakang ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: 'https://cdn-icons-png.flaticon.com/512/8336/8336048.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/8336/8336048.png',
    vibrate: [500, 250, 500, 250, 500], // Getaran untuk alarm
    requireInteraction: true, // Notifikasi tidak akan hilang sampai di klik user
    data: {
      url: '/' // URL yang dibuka saat notifikasi diklik
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Menangani aksi saat user menekan notifikasinya
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Jika tab aplikasi sudah terbuka, fokuskan
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Jika belum terbuka, buka tab baru
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
