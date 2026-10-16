import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updatePassword,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'

import { initializeApp } from 'firebase/app'

import { app, auth, db } from '../config/firebase'
import { COLLECTIONS } from '../constants/models'
import { ROLES } from '../constants/roles'
import { mapPhoneToEmail, normalizePhone } from '../utils/auth'

export async function loginWithPhone(phone, password) {
  const cleanPhone = normalizePhone(phone)
  const email = mapPhoneToEmail(cleanPhone)

  const credential = await signInWithEmailAndPassword(auth, email, password)
  const userDocRef = doc(db, COLLECTIONS.USERS, credential.user.uid)
  const userDoc = await getDoc(userDocRef)

  if (!userDoc.exists()) {
    throw new Error('Foydalanuvchi ma\'lumotlar bazasida topilmadi')
  }

  const profile = userDoc.data()
  const role = profile.role || ROLES.STAFF

  return { user: credential.user, role, profile }
}

export function logout() {
  return signOut(auth)
}

// Admin dashboard allows creating staff accounts without logging out current session
export async function createStaffAccount({ name, phone, password, role = ROLES.STAFF }) {
  const cleanPhone = normalizePhone(phone)
  const email = mapPhoneToEmail(cleanPhone)

  // Secondary Firebase app instance to avoid replacing current session in primary auth
  const secondaryAppName = `staff-creator-${Date.now()}`
  const secondaryApp = initializeApp(app.options, secondaryAppName)
  const secondaryAuth = getAuth(secondaryApp)

  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password)
    const newUid = cred.user.uid

    const userProfile = {
      uid: newUid,
      phone: cleanPhone,
      name: name || (role === ROLES.ADMIN ? 'Administrator' : 'Xodim'),
      role,
      createdAt: serverTimestamp(),
      fcmTokens: [],
    }

    await setDoc(doc(db, COLLECTIONS.USERS, newUid), userProfile)
    await signOut(secondaryAuth)

    return { success: true, uid: newUid }
  } catch (error) {
    console.error('Xodim yaratishda xato:', error)
    throw error
  }
}

export async function updateUserProfile({ name, phone, currentPassword, newPassword, currentPhone }) {
  const currentUser = auth.currentUser
  if (!currentUser) throw new Error('Foydalanuvchi tizimga kirmagan')

  const cleanPhone = normalizePhone(phone)
  const isPhoneChanged = Boolean(cleanPhone && cleanPhone !== normalizePhone(currentPhone))
  const isPasswordChangeRequested = Boolean(newPassword && newPassword.trim().length > 0)

  // Security constraint: Changing password or sensitive fields must require entering old/current password first
  if (isPhoneChanged || isPasswordChangeRequested) {
    if (!currentPassword) {
      throw new Error("Xavfsizlik talabi: Telefon raqami yoki parolni o'zgartirish uchun joriy parolingizni kiritish shart!")
    }

    try {
      const currentEmail = currentUser.email || mapPhoneToEmail(currentPhone)
      const credential = EmailAuthProvider.credential(currentEmail, currentPassword)
      await reauthenticateWithCredential(currentUser, credential)
    } catch (authErr) {
      if (
        authErr.code === 'auth/wrong-password' ||
        authErr.code === 'auth/invalid-credential' ||
        authErr.message?.includes('invalid-credential')
      ) {
        throw new Error("Joriy parol noto'g'ri kiritildi!")
      }
      throw authErr
    }

    if (isPasswordChangeRequested) {
      if (newPassword.length < 6) {
        throw new Error("Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak!")
      }
      await updatePassword(currentUser, newPassword)
    }

    if (isPhoneChanged) {
      const newEmail = mapPhoneToEmail(cleanPhone)
      await updateEmail(currentUser, newEmail)
    }
  }

  const updateData = {
    name: name.trim(),
    updatedAt: serverTimestamp(),
  }
  if (cleanPhone) {
    updateData.phone = cleanPhone
  }

  await updateDoc(doc(db, COLLECTIONS.USERS, currentUser.uid), updateData)
  return { success: true }
}

