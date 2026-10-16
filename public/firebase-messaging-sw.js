// Towelshop - Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js')

// Extract configuration dynamically from registration URL parameters or build-time fallback
const urlParams = new URLSearchParams(self.location.search)
const config = {
  apiKey: urlParams.get('apiKey') || '__FIREBASE_API_KEY__',
  authDomain: urlParams.get('authDomain') || '__FIREBASE_AUTH_DOMAIN__',
  projectId: urlParams.get('projectId') || '__FIREBASE_PROJECT_ID__',
  storageBucket: urlParams.get('storageBucket') || '__FIREBASE_STORAGE_BUCKET__',
  messagingSenderId: urlParams.get('messagingSenderId') || '__FIREBASE_MESSAGING_SENDER_ID__',
  appId: urlParams.get('appId') || '__FIREBASE_APP_ID__',
}

// Ensure valid configuration is present before initializing
const hasValidConfig = Boolean(
  config.apiKey &&
  config.projectId &&
  !config.apiKey.startsWith('__') &&
  !config.projectId.startsWith('__')
)

if (hasValidConfig) {
  firebase.initializeApp(config)
  const messaging = firebase.messaging()

  messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification?.title || 'Towelshop Bildirishnomasi'
    const notificationOptions = {
      body: payload.notification?.body || 'Yangi xabarnoma keldi',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: payload.data || {},
    }

    self.registration.showNotification(notificationTitle, notificationOptions)
  })
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/admin')
      }
    })
  )
})
