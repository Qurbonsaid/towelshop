import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'

import { db } from '../config/firebase'
import { COLLECTIONS, CONTRACT_TYPES } from '../constants/models'

// ========================
// BARBERSHOPS
// ========================

export async function listBarbershops() {
  const q = query(collection(db, COLLECTIONS.BARBERSHOPS), orderBy('name', 'asc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))
}

export function subscribeBarbershops(callback) {
  const q = query(collection(db, COLLECTIONS.BARBERSHOPS), orderBy('name', 'asc'))
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))
      callback(items)
    },
    (err) => console.error('Barbershops subscribe error:', err)
  )
}

export async function createBarbershop({ name, address = '', phone = '', latitude = null, longitude = null }) {
  const docRef = await addDoc(collection(db, COLLECTIONS.BARBERSHOPS), {
    name: name.trim(),
    address: address.trim(),
    phone: phone.trim(),
    latitude: latitude !== null && !isNaN(latitude) ? Number(latitude) : null,
    longitude: longitude !== null && !isNaN(longitude) ? Number(longitude) : null,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateBarbershop(id, data) {
  const docRef = doc(db, COLLECTIONS.BARBERSHOPS, id)
  await updateDoc(docRef, {
    ...data,
    latitude: data.latitude !== undefined && data.latitude !== null && !isNaN(data.latitude) ? Number(data.latitude) : null,
    longitude: data.longitude !== undefined && data.longitude !== null && !isNaN(data.longitude) ? Number(data.longitude) : null,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteBarbershop(id) {
  await deleteDoc(doc(db, COLLECTIONS.BARBERSHOPS, id))
}

export async function deleteBarbershopCascade(barbershopId) {
  // 1. Get all child barbers
  const barbersQuery = query(collection(db, COLLECTIONS.BARBERS), where('barbershopId', '==', barbershopId))
  const barbersSnapshot = await getDocs(barbersQuery)

  // 2. Get all child sales
  const salesQuery = query(collection(db, COLLECTIONS.SALES), where('barbershopId', '==', barbershopId))
  const salesSnapshot = await getDocs(salesQuery)

  // 3. Get all child returns
  const returnsQuery = query(collection(db, COLLECTIONS.RETURNS), where('barbershopId', '==', barbershopId))
  const returnsSnapshot = await getDocs(returnsQuery)

  // Delete all child sales
  for (const sDoc of salesSnapshot.docs) {
    await deleteDoc(sDoc.ref)
  }

  // Delete all child returns
  for (const rDoc of returnsSnapshot.docs) {
    await deleteDoc(rDoc.ref)
  }

  // Delete all child barbers
  for (const bDoc of barbersSnapshot.docs) {
    await deleteDoc(bDoc.ref)
  }

  // Delete the barbershop itself
  await deleteDoc(doc(db, COLLECTIONS.BARBERSHOPS, barbershopId))
}


// ========================
// BARBERS
// ========================

export async function listBarbers() {
  const q = query(collection(db, COLLECTIONS.BARBERS), orderBy('name', 'asc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))
}

export function subscribeBarbers(callback) {
  const q = query(collection(db, COLLECTIONS.BARBERS), orderBy('name', 'asc'))
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))
      callback(items)
    },
    (err) => console.error('Barbers subscribe error:', err)
  )
}

export async function listBarbersByBarbershop(barbershopId) {
  const q = query(collection(db, COLLECTIONS.BARBERS), where('barbershopId', '==', barbershopId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))
}

export async function createBarber({
  barbershopId,
  name,
  phone = '',
  contractType = CONTRACT_TYPES.PAY_FOR_TAKEN,
  pricePerTowel = 3000,
  debt = 0,
  overpaid = 0,
}) {
  const docRef = await addDoc(collection(db, COLLECTIONS.BARBERS), {
    barbershopId,
    name: name.trim(),
    phone: phone.trim(),
    contractType,
    pricePerTowel: Number(pricePerTowel) || 0,
    debt: Number(debt) || 0,
    overpaid: Number(overpaid) || 0,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateBarber(id, data) {
  const docRef = doc(db, COLLECTIONS.BARBERS, id)
  const updateData = { ...data }
  if (data.pricePerTowel !== undefined) updateData.pricePerTowel = Number(data.pricePerTowel) || 0
  if (data.debt !== undefined) updateData.debt = Number(data.debt) || 0
  if (data.overpaid !== undefined) updateData.overpaid = Number(data.overpaid) || 0

  await updateDoc(docRef, updateData)
}

export async function deleteBarber(id) {
  await deleteDoc(doc(db, COLLECTIONS.BARBERS, id))
}

export async function deleteBarberCascade(barberId) {
  // Delete associated sales
  const salesQuery = query(collection(db, COLLECTIONS.SALES), where('barberId', '==', barberId))
  const salesSnapshot = await getDocs(salesQuery)
  for (const sDoc of salesSnapshot.docs) {
    await deleteDoc(sDoc.ref)
  }

  // Delete associated returns
  const returnsQuery = query(collection(db, COLLECTIONS.RETURNS), where('barberId', '==', barberId))
  const returnsSnapshot = await getDocs(returnsQuery)
  for (const rDoc of returnsSnapshot.docs) {
    await deleteDoc(rDoc.ref)
  }

  // Delete the barber doc
  await deleteDoc(doc(db, COLLECTIONS.BARBERS, barberId))
}


export async function recordBarberPayment(barberId, paymentAmount) {
  const amount = Number(paymentAmount) || 0
  if (amount <= 0) return

  await runTransaction(db, async (transaction) => {
    const barberRef = doc(db, COLLECTIONS.BARBERS, barberId)
    const barberDoc = await transaction.get(barberRef)
    if (!barberDoc.exists()) throw new Error('Sartarosh topilmadi')

    const currentDebt = Number(barberDoc.data().debt) || 0
    const currentOverpaid = Number(barberDoc.data().overpaid) || 0

    let newDebt = currentDebt
    let newOverpaid = currentOverpaid

    if (amount <= newDebt) {
      newDebt -= amount
    } else {
      const remaining = amount - newDebt
      newDebt = 0
      newOverpaid += remaining
    }

    transaction.update(barberRef, {
      debt: newDebt,
      overpaid: newOverpaid,
      updatedAt: serverTimestamp(),
    })
  })
}

// ========================
// SALES / TRANSACTIONS
// ========================

export async function createSale({
  barberId,
  barbershopId,
  staffId,
  staffName,
  barberName = '',
  barbershopName = '',
  quantityDelivered,
  unitPrice,
  contractType = CONTRACT_TYPES.PAY_FOR_TAKEN,
  note = '',
}) {
  const qty = Number(quantityDelivered) || 0
  const price = Number(unitPrice) || 0
  const totalPrice = qty * price

  return await runTransaction(db, async (transaction) => {
    // 1. Barber debt balance update if payForTaken
    const barberRef = doc(db, COLLECTIONS.BARBERS, barberId)
    const barberDoc = await transaction.get(barberRef)

    if (barberDoc.exists() && contractType === CONTRACT_TYPES.PAY_FOR_TAKEN && totalPrice > 0) {
      const currentDebt = Number(barberDoc.data().debt) || 0
      const currentOverpaid = Number(barberDoc.data().overpaid) || 0

      let newDebt = currentDebt
      let newOverpaid = currentOverpaid

      if (currentOverpaid >= totalPrice) {
        newOverpaid = currentOverpaid - totalPrice
      } else {
        const remaining = totalPrice - currentOverpaid
        newOverpaid = 0
        newDebt = currentDebt + remaining
      }

      transaction.update(barberRef, {
        debt: newDebt,
        overpaid: newOverpaid,
        updatedAt: serverTimestamp(),
      })
    }

    // 2. Add Sale Document
    const salesCol = collection(db, COLLECTIONS.SALES)
    const saleDocRef = doc(salesCol)

    transaction.set(saleDocRef, {
      barberId,
      barbershopId,
      staffId,
      staffName: staffName || 'Xodim',
      barberName,
      barbershopName,
      quantityDelivered: qty,
      unitPrice: price,
      totalPrice,
      contractType,
      note: note.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return saleDocRef.id
  })
}

export async function updateSale(saleId, { quantityDelivered, unitPrice, note, barberId }) {
  const qty = Number(quantityDelivered) || 0
  const price = Number(unitPrice) || 0
  const newTotalPrice = qty * price

  return await runTransaction(db, async (transaction) => {
    const saleRef = doc(db, COLLECTIONS.SALES, saleId)
    const saleDoc = await transaction.get(saleRef)
    if (!saleDoc.exists()) throw new Error('Sotuv topilmadi')

    const oldData = saleDoc.data()
    const oldTotalPrice = Number(oldData.totalPrice) || 0
    const diff = newTotalPrice - oldTotalPrice

    // If barber is payForTaken, adjust the difference in debt
    if (diff !== 0 && oldData.contractType === CONTRACT_TYPES.PAY_FOR_TAKEN) {
      const bId = barberId || oldData.barberId
      const barberRef = doc(db, COLLECTIONS.BARBERS, bId)
      const barberDoc = await transaction.get(barberRef)

      if (barberDoc.exists()) {
        let currentDebt = Number(barberDoc.data().debt) || 0
        let currentOverpaid = Number(barberDoc.data().overpaid) || 0

        if (diff > 0) {
          // Increase debt
          if (currentOverpaid >= diff) {
            currentOverpaid -= diff
          } else {
            const rem = diff - currentOverpaid
            currentOverpaid = 0
            currentDebt += rem
          }
        } else {
          // Decrease debt
          const refund = Math.abs(diff)
          if (refund <= currentDebt) {
            currentDebt -= refund
          } else {
            const rem = refund - currentDebt
            currentDebt = 0
            currentOverpaid += rem
          }
        }

        transaction.update(barberRef, {
          debt: currentDebt,
          overpaid: currentOverpaid,
          updatedAt: serverTimestamp(),
        })
      }
    }

    transaction.update(saleRef, {
      quantityDelivered: qty,
      unitPrice: price,
      totalPrice: newTotalPrice,
      note: note ? note.trim() : (oldData.note || ''),
      updatedAt: serverTimestamp(),
    })
  })
}

export async function deleteSale(saleId) {
  const saleRef = doc(db, COLLECTIONS.SALES, saleId)
  await deleteDoc(saleRef)
}

export function subscribeSales(callback) {
  const q = query(collection(db, COLLECTIONS.SALES), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))
      callback(items)
    },
    (err) => console.error('Sales subscribe error:', err)
  )
}

export function subscribeStaffSales(staffId, callback) {
  const q = query(
    collection(db, COLLECTIONS.SALES),
    where('staffId', '==', staffId),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))
      callback(items)
    },
    (err) => console.error('Staff sales subscribe error:', err)
  )
}

// ========================
// RETURNS / COLLECTIONS
// ========================

export async function createReturn({
  barberId,
  barbershopId,
  staffId,
  staffName = 'Xodim',
  barberName = '',
  barbershopName = '',
  quantityReturned,
  note = '',
}) {
  const qty = Number(quantityReturned) || 0

  return await runTransaction(db, async (transaction) => {
    // Check if barber is payForUsed. If so, used towels increase debt!
    const barberRef = doc(db, COLLECTIONS.BARBERS, barberId)
    const barberDoc = await transaction.get(barberRef)

    if (barberDoc.exists() && barberDoc.data().contractType === CONTRACT_TYPES.PAY_FOR_USED && qty > 0) {
      const pricePerTowel = Number(barberDoc.data().pricePerTowel) || 0
      const charge = qty * pricePerTowel

      let currentDebt = Number(barberDoc.data().debt) || 0
      let currentOverpaid = Number(barberDoc.data().overpaid) || 0

      if (currentOverpaid >= charge) {
        currentOverpaid -= charge
      } else {
        const rem = charge - currentOverpaid
        currentOverpaid = 0
        currentDebt += rem
      }

      transaction.update(barberRef, {
        debt: currentDebt,
        overpaid: currentOverpaid,
        updatedAt: serverTimestamp(),
      })
    }

    const returnsCol = collection(db, COLLECTIONS.RETURNS)
    const returnDocRef = doc(returnsCol)

    transaction.set(returnDocRef, {
      barberId,
      barbershopId,
      staffId,
      staffName,
      barberName,
      barbershopName,
      quantityReturned: qty,
      note: note.trim(),
      createdAt: serverTimestamp(),
    })

    return returnDocRef.id
  })
}

export function subscribeReturns(callback) {
  const q = query(collection(db, COLLECTIONS.RETURNS), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))
      callback(items)
    },
    (err) => console.error('Returns subscribe error:', err)
  )
}

export function subscribeStaffReturns(staffId, callback) {
  const q = query(
    collection(db, COLLECTIONS.RETURNS),
    where('staffId', '==', staffId),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))
      callback(items)
    },
    (err) => console.error('Staff returns subscribe error:', err)
  )
}

// ========================
// USERS / STAFF
// ========================

export function subscribeUsers(callback) {
  const q = query(collection(db, COLLECTIONS.USERS), orderBy('name', 'asc'))
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))
      callback(items)
    },
    (err) => console.error('Users subscribe error:', err)
  )
}

export async function deleteUserDoc(uid) {
  await deleteDoc(doc(db, COLLECTIONS.USERS, uid))
}

export async function updateUserRole(uid, role) {
  await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
    role,
    updatedAt: serverTimestamp(),
  })
}
