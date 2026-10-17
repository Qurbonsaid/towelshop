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
} from "firebase/firestore";

import { db } from "../config/firebase";
import { COLLECTIONS, CONTRACT_TYPES } from "../constants/models";

// ========================
// BARBERSHOPS
// ========================

export async function listBarbershops() {
  const q = query(
    collection(db, COLLECTIONS.BARBERSHOPS),
    orderBy("name", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data(),
  }));
}

export function subscribeBarbershops(callback) {
  const q = query(
    collection(db, COLLECTIONS.BARBERSHOPS),
    orderBy("name", "asc")
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));
      callback(items);
    },
    (err) => console.error("Barbershops subscribe error:", err)
  );
}

export async function createBarbershop({
  name,
  address = "",
  phone = "",
  latitude = null,
  longitude = null,
}) {
  const docRef = await addDoc(collection(db, COLLECTIONS.BARBERSHOPS), {
    name: name.trim(),
    address: address.trim(),
    phone: phone.trim(),
    latitude: latitude !== null && !isNaN(latitude) ? Number(latitude) : null,
    longitude:
      longitude !== null && !isNaN(longitude) ? Number(longitude) : null,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateBarbershop(id, data) {
  const docRef = doc(db, COLLECTIONS.BARBERSHOPS, id);
  await updateDoc(docRef, {
    ...data,
    latitude:
      data.latitude !== undefined &&
      data.latitude !== null &&
      !isNaN(data.latitude)
        ? Number(data.latitude)
        : null,
    longitude:
      data.longitude !== undefined &&
      data.longitude !== null &&
      !isNaN(data.longitude)
        ? Number(data.longitude)
        : null,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteBarbershop(id) {
  await deleteDoc(doc(db, COLLECTIONS.BARBERSHOPS, id));
}

export async function deleteBarbershopCascade(barbershopId) {
  // 1. Get all child barbers
  const barbersQuery = query(
    collection(db, COLLECTIONS.BARBERS),
    where("barbershopId", "==", barbershopId)
  );
  const barbersSnapshot = await getDocs(barbersQuery);

  // 2. Get all child sales
  const salesQuery = query(
    collection(db, COLLECTIONS.SALES),
    where("barbershopId", "==", barbershopId)
  );
  const salesSnapshot = await getDocs(salesQuery);

  // Delete all child sales
  for (const sDoc of salesSnapshot.docs) {
    await deleteDoc(sDoc.ref);
  }

  // Delete all child barbers
  for (const bDoc of barbersSnapshot.docs) {
    await deleteDoc(bDoc.ref);
  }

  // Delete the barbershop itself
  await deleteDoc(doc(db, COLLECTIONS.BARBERSHOPS, barbershopId));
}

// ========================
// BARBERS
// ========================

export async function listBarbers() {
  const q = query(collection(db, COLLECTIONS.BARBERS), orderBy("name", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data(),
  }));
}

export function subscribeBarbers(callback) {
  const q = query(collection(db, COLLECTIONS.BARBERS), orderBy("name", "asc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));
      callback(items);
    },
    (err) => console.error("Barbers subscribe error:", err)
  );
}

export async function listBarbersByBarbershop(barbershopId) {
  const q = query(
    collection(db, COLLECTIONS.BARBERS),
    where("barbershopId", "==", barbershopId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data(),
  }));
}

export async function createBarber({
  barbershopId,
  name,
  phone = "",
  contractType = CONTRACT_TYPES.PAY_FOR_TAKEN,
  pricePerTowel = 3000,
  initialTowels = 0,
  debt = 0,
  overpaid = 0,
}) {
  const docRef = await addDoc(collection(db, COLLECTIONS.BARBERS), {
    barbershopId,
    name: name.trim(),
    phone: phone.trim(),
    contractType,
    pricePerTowel: Number(pricePerTowel) || 0,
    initialTowels: Number(initialTowels) || 0,
    debt: Number(debt) || 0,
    overpaid: Number(overpaid) || 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateBarber(id, data) {
  const docRef = doc(db, COLLECTIONS.BARBERS, id);
  const updateData = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  if (data.pricePerTowel !== undefined)
    updateData.pricePerTowel = Number(data.pricePerTowel) || 0;
  if (data.debt !== undefined) updateData.debt = Number(data.debt) || 0;
  if (data.overpaid !== undefined)
    updateData.overpaid = Number(data.overpaid) || 0;

  await updateDoc(docRef, updateData);
}

export async function deleteBarber(id) {
  await deleteDoc(doc(db, COLLECTIONS.BARBERS, id));
}

export async function deleteBarberCascade(barberId) {
  // Delete associated sales
  const salesQuery = query(
    collection(db, COLLECTIONS.SALES),
    where("barberId", "==", barberId)
  );
  const salesSnapshot = await getDocs(salesQuery);
  for (const sDoc of salesSnapshot.docs) {
    await deleteDoc(sDoc.ref);
  }

  // Delete the barber doc
  await deleteDoc(doc(db, COLLECTIONS.BARBERS, barberId));
}

export async function recordBarberPayment(barberId, paymentAmount) {
  const amount = Number(paymentAmount) || 0;
  if (amount <= 0) return;

  await runTransaction(db, async (transaction) => {
    const barberRef = doc(db, COLLECTIONS.BARBERS, barberId);
    const barberDoc = await transaction.get(barberRef);
    if (!barberDoc.exists()) throw new Error("Sartarosh topilmadi");

    const currentDebt = Number(barberDoc.data().debt) || 0;
    const currentOverpaid = Number(barberDoc.data().overpaid) || 0;

    let newDebt = currentDebt;
    let newOverpaid = currentOverpaid;

    if (amount <= newDebt) {
      newDebt -= amount;
    } else {
      const remaining = amount - newDebt;
      newDebt = 0;
      newOverpaid += remaining;
    }

    transaction.update(barberRef, {
      debt: newDebt,
      overpaid: newOverpaid,
      updatedAt: serverTimestamp(),
    });
  });
}

// ========================
// SALES / TRANSACTIONS
// ========================

export async function createSale({
  barberId,
  barbershopId,
  staffId,
  staffName,
  barberName = "",
  barbershopName = "",
  quantityDelivered,
  returnedTowels = 0,
  unitPrice,
  contractType = CONTRACT_TYPES.PAY_FOR_TAKEN,
  note = "",
}) {
  const qty = Number(quantityDelivered) || 0;
  const returnedQty = Number(returnedTowels) || 0;
  const price = Number(unitPrice) || 0;
  const totalPrice = qty * price;

  return await runTransaction(db, async (transaction) => {
    // 1. Barber debt balance update if payForTaken
    const barberRef = doc(db, COLLECTIONS.BARBERS, barberId);
    const barberDoc = await transaction.get(barberRef);

    if (
      barberDoc.exists() &&
      contractType === CONTRACT_TYPES.PAY_FOR_TAKEN &&
      totalPrice > 0
    ) {
      const currentDebt = Number(barberDoc.data().debt) || 0;
      const currentOverpaid = Number(barberDoc.data().overpaid) || 0;

      let newDebt = currentDebt;
      let newOverpaid = currentOverpaid;

      if (currentOverpaid >= totalPrice) {
        newOverpaid = currentOverpaid - totalPrice;
      } else {
        const remaining = totalPrice - currentOverpaid;
        newOverpaid = 0;
        newDebt = currentDebt + remaining;
      }

      transaction.update(barberRef, {
        debt: newDebt,
        overpaid: newOverpaid,
        updatedAt: serverTimestamp(),
      });
    }

    if (
      barberDoc.exists() &&
      barberDoc.data().contractType === CONTRACT_TYPES.PAY_FOR_USED &&
      returnedQty > 0
    ) {
      const charge =
        returnedQty * (Number(barberDoc.data().pricePerTowel) || 0);
      let currentDebt = Number(barberDoc.data().debt) || 0;
      let currentOverpaid = Number(barberDoc.data().overpaid) || 0;

      if (currentOverpaid >= charge) {
        currentOverpaid -= charge;
      } else {
        currentDebt += charge - currentOverpaid;
        currentOverpaid = 0;
      }

      transaction.update(barberRef, {
        debt: currentDebt,
        overpaid: currentOverpaid,
        updatedAt: serverTimestamp(),
      });
    }

    // 2. Add Sale Document
    const salesCol = collection(db, COLLECTIONS.SALES);
    const saleDocRef = doc(salesCol);

    transaction.set(saleDocRef, {
      barberId,
      barbershopId,
      staffId,
      staffName: staffName || "Xodim",
      barberName,
      barbershopName,
      quantityDelivered: qty,
      returnedTowels: returnedQty,
      unitPrice: price,
      totalPrice,
      contractType,
      note: note.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return saleDocRef.id;
  });
}

export async function updateSale(
  saleId,
  { quantityDelivered, returnedTowels, receivedMoney }
) {
  const qty = Number(quantityDelivered) || 0;
  const returnedQty = Number(returnedTowels) || 0;
  const received = Number(receivedMoney) || 0;

  return await runTransaction(db, async (transaction) => {
    const saleRef = doc(db, COLLECTIONS.SALES, saleId);
    const saleDoc = await transaction.get(saleRef);
    if (!saleDoc.exists()) throw new Error("Sotuv topilmadi");

    const oldData = saleDoc.data();
    const price = Number(oldData.unitPrice) || 0;
    const oldQty = Number(oldData.quantityDelivered) || 0;
    const oldReturnedQty = Number(oldData.returnedTowels) || 0;
    const oldReceived = Number(oldData.receivedMoney) || 0;
    const deliveryDiff =
      oldData.contractType === CONTRACT_TYPES.PAY_FOR_TAKEN
        ? (qty - oldQty) * price
        : 0;
    const returnDiff =
      (returnedQty - oldReturnedQty) *
      (oldData.contractType === CONTRACT_TYPES.PAY_FOR_USED ? price : 0);
    const paymentDiff = received - oldReceived;
    const balanceDiff = deliveryDiff + returnDiff - paymentDiff;

    if (balanceDiff !== 0) {
      const barberRef = doc(db, COLLECTIONS.BARBERS, oldData.barberId);
      const barberDoc = await transaction.get(barberRef);

      if (barberDoc.exists()) {
        let currentDebt = Number(barberDoc.data().debt) || 0;
        let currentOverpaid = Number(barberDoc.data().overpaid) || 0;

        if (balanceDiff > 0) {
          if (currentOverpaid >= balanceDiff) {
            currentOverpaid -= balanceDiff;
          } else {
            const rem = balanceDiff - currentOverpaid;
            currentOverpaid = 0;
            currentDebt += rem;
          }
        } else {
          const credit = Math.abs(balanceDiff);
          if (credit <= currentDebt) {
            currentDebt -= credit;
          } else {
            const rem = credit - currentDebt;
            currentDebt = 0;
            currentOverpaid += rem;
          }
        }

        transaction.update(barberRef, {
          debt: currentDebt,
          overpaid: currentOverpaid,
          updatedAt: serverTimestamp(),
        });
      }
    }

    transaction.update(saleRef, {
      quantityDelivered: qty,
      returnedTowels: returnedQty,
      receivedMoney: received,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function deleteSale(saleId) {
  const saleRef = doc(db, COLLECTIONS.SALES, saleId);
  await deleteDoc(saleRef);
}

export function subscribeSales(callback) {
  const q = query(
    collection(db, COLLECTIONS.SALES),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((docItem) => ({ id: docItem.id, ...docItem.data() }))
        .filter(
          (item) =>
            Number(item.quantityDelivered) > 0 ||
            Number(item.returnedTowels) > 0
        );
      callback(items);
    },
    (err) => console.error("Sales subscribe error:", err)
  );
}

export function subscribeStaffSales(staffId, callback) {
  const q = query(
    collection(db, COLLECTIONS.SALES),
    where("staffId", "==", staffId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((docItem) => ({ id: docItem.id, ...docItem.data() }))
        .filter(
          (item) =>
            Number(item.quantityDelivered) > 0 ||
            Number(item.returnedTowels) > 0
        );
      callback(items);
    },
    (err) => console.error("Staff sales subscribe error:", err)
  );
}

// ========================
// RETURN TRANSACTIONS
// ========================

export async function createReturn({
  barberId,
  barbershopId,
  staffId,
  staffName = "Xodim",
  barberName = "",
  barbershopName = "",
  quantityReturned,
  note = "",
}) {
  return createSale({
    barberId,
    barbershopId,
    staffId,
    staffName,
    barberName,
    barbershopName,
    quantityDelivered: 0,
    returnedTowels: quantityReturned,
    unitPrice: 0,
    contractType: null,
    note,
  });
}

export function subscribeReturns(callback) {
  const q = query(
    collection(db, COLLECTIONS.SALES),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((docItem) => ({ id: docItem.id, ...docItem.data() }))
        .filter((item) => Number(item.returnedTowels) > 0);
      callback(items);
    },
    (err) => console.error("Returns subscribe error:", err)
  );
}

export function subscribeStaffReturns(staffId, callback) {
  const q = query(
    collection(db, COLLECTIONS.SALES),
    where("staffId", "==", staffId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((docItem) => ({ id: docItem.id, ...docItem.data() }))
        .filter((item) => Number(item.returnedTowels) > 0);
      callback(items);
    },
    (err) => console.error("Staff returns subscribe error:", err)
  );
}

// ========================
// USERS / STAFF
// ========================

export function subscribeUsers(callback) {
  const q = query(collection(db, COLLECTIONS.USERS), orderBy("name", "asc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));
      callback(items);
    },
    (err) => console.error("Users subscribe error:", err)
  );
}

export async function deleteUserDoc(uid) {
  if (!uid) throw new Error("Foydalanuvchi identifikatori topilmadi");
  await deleteDoc(doc(db, COLLECTIONS.USERS, uid));
}
