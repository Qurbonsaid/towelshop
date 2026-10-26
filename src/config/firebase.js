import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { getMessaging, isSupported } from 'firebase/messaging'

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  messagingVapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || import.meta.env.VITE_FIREBASE_MESSAGING_VAPID_KEY,
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

// Enable IndexedDB persistent local caching across tabs so unchanged documents
// are served from local cache on reload instead of consuming Firestore read quota.
function initDb() {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    })
  } catch {
    return getFirestore(app)
  }
}

export const db = initDb()

let messagingInstance = null

export async function getFirebaseMessaging() {
  if (typeof window === 'undefined') return null
  try {
    const supported = await isSupported()
    if (supported && !messagingInstance) {
      messagingInstance = getMessaging(app)
    }
    return messagingInstance
  } catch (err) {
    console.warn("Firebase Messaging qo'llab-quvvatlanmadi:", err)
    return null
  }
}
