import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

import { auth, db } from '../config/firebase'
import { COLLECTIONS } from '../constants/models'
import { mapPhoneToEmail } from '../utils/auth'

export async function loginWithPhone(phone, password) {
  const email = mapPhoneToEmail(phone)
  const credential = await signInWithEmailAndPassword(auth, email, password)
  const userDocRef = doc(db, COLLECTIONS.USERS, credential.user.uid)
  const userDoc = await getDoc(userDocRef)
  const role = userDoc.exists() ? userDoc.data().role : null

  return { user: credential.user, role }
}

export function logout() {
  return signOut(auth)
}
