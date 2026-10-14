import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore'

import { db } from '../config/firebase'
import { COLLECTIONS } from '../constants/models'

export async function listBarbershops() {
  const snapshot = await getDocs(collection(db, COLLECTIONS.BARBERSHOPS))
  return snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))
}

export async function listBarbersByBarbershop(barbershopId) {
  const q = query(collection(db, COLLECTIONS.BARBERS), where('barbershopId', '==', barbershopId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))
}

export async function createTransaction(payload) {
  await addDoc(collection(db, COLLECTIONS.TRANSACTIONS), {
    ...payload,
    createdAt: serverTimestamp(),
  })
}
