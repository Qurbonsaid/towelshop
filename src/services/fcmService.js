import { getToken, onMessage } from 'firebase/messaging'
import { arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore'
import { db, firebaseConfig, getFirebaseMessaging } from '../config/firebase'
import { COLLECTIONS } from '../constants/models'
import { uz } from '../i18n/uz'

export async function registerFcmForAdmin(uid) {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return { success: false, reason: 'unsupported' }
  }

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

    const swUrl = params.toString()
      ? `/firebase-messaging-sw.js?${params.toString()}`
      : '/firebase-messaging-sw.js'

    // Register service worker if not already registered
    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: '/',
    })

    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
    }).catch((err) => {
      console.warn('FCM Token olishda xatolik:', err)
      return null
    })

    if (token && uid) {
      const userRef = doc(db, COLLECTIONS.USERS, uid)
      const userSnap = await getDoc(userRef)
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          fcmTokens: arrayUnion(token),
        })
      }
      return { success: true, token, permission }
    }

    return { success: !!token, token, permission }
  } catch (error) {
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
        new Notification(payload.notification?.title || uz.fcm.newSaleTitle, {
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
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(uz.fcm.newSaleTitle, {
      body: uz.notifications.pushSaleBody('Alisher', 'Jasur', 20, 60000),
      icon: '/favicon.svg',
    })
    return true
  }
  return false
}

