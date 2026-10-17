import { onMessage, onRegistered, register } from 'firebase/messaging'
import { arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore'
import { db, firebaseConfig, getFirebaseMessaging } from '../config/firebase'
import { COLLECTIONS } from '../constants/models'
import { uz } from '../i18n/uz'

async function showServiceWorkerNotification(title, options = {}) {
  if (
    typeof window === 'undefined' ||
    !('Notification' in window) ||
    !('serviceWorker' in navigator) ||
    Notification.permission !== 'granted'
  ) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    await registration.showNotification(title, options)
    return true
  } catch (error) {
    console.warn('Bildirishnomani ko\'rsatishda xatolik:', error)
    return false
  }
}

export async function registerFcmForAdmin(uid) {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return { success: false, reason: 'unsupported' }
  }

  let unsubscribeRegistered = () => {}

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return { success: false, reason: 'denied', permission }
    }

    const messaging = await getFirebaseMessaging()
    if (!messaging) {
      return { success: false, reason: 'unsupported' }
    }

    // Build URL with dynamic Firebase config parameters
    const params = new URLSearchParams()
    if (firebaseConfig.apiKey) params.set('apiKey', firebaseConfig.apiKey)
    if (firebaseConfig.authDomain) params.set('authDomain', firebaseConfig.authDomain)
    if (firebaseConfig.projectId) params.set('projectId', firebaseConfig.projectId)
    if (firebaseConfig.storageBucket) params.set('storageBucket', firebaseConfig.storageBucket)
    if (firebaseConfig.messagingSenderId) params.set('messagingSenderId', firebaseConfig.messagingSenderId)
    if (firebaseConfig.appId) params.set('appId', firebaseConfig.appId)
    if (firebaseConfig.messagingVapidKey) params.set('messagingVapidKey', firebaseConfig.messagingVapidKey)

    const swUrl = params.toString()
      ? `/firebase-messaging-sw.js?${params.toString()}`
      : '/firebase-messaging-sw.js'

    // Register service worker if not already registered
    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: '/',
    })

    const registrationIdPromise = new Promise((resolve) => {
      unsubscribeRegistered = onRegistered(messaging, resolve)
    })

    await register(messaging, {
      serviceWorkerRegistration: registration,
      ...(firebaseConfig.messagingVapidKey
        ? { vapidKey: firebaseConfig.messagingVapidKey }
        : {}),
    })

    const registrationId = await registrationIdPromise
    unsubscribeRegistered()

    if (registrationId && uid) {
      const userRef = doc(db, COLLECTIONS.USERS, uid)
      const userSnap = await getDoc(userRef)
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          fcmTokens: arrayUnion(registrationId),
        })
      }
      return { success: true, token: registrationId, permission }
    }

    return { success: !!registrationId, token: registrationId, permission }
  } catch (error) {
    unsubscribeRegistered()
    console.error('FCM ro\'yxatdan o\'tkazish xatosi:', error)
    return { success: false, error }
  }
}

export async function setupForegroundNotifications(onReceive) {
  try {
    const messaging = await getFirebaseMessaging()
    if (!messaging) return () => {}

    const unsubscribe = onMessage(messaging, (payload) => {
      if (onReceive) {
        onReceive(payload)
      } else if (Notification.permission === 'granted') {
        showServiceWorkerNotification(payload.notification?.title || uz.fcm.newSaleTitle, {
          body: payload.notification?.body,
          icon: '/favicon.svg',
        })
      }
    })

    return unsubscribe
  } catch (err) {
    console.warn('Foreground xabarnomani o\'rnatishda xatolik:', err)
    return () => {}
  }
}

export function triggerLocalTestNotification() {
  return showServiceWorkerNotification(uz.fcm.statusActive, {
    body: uz.fcm.statusActive,
    icon: '/favicon.svg',
  })
}
