import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
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

export function getTodayDateString(d = new Date()) {
  const date = d instanceof Date ? d : new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function createBarber({
  barbershopId,
  name,
  phone = "",
  contractType = CONTRACT_TYPES.PAY_FOR_TAKEN,
  pricePerTowel = 3000,
  initialTowels = 0,
  initialDebt = 0,
  initialOverpaid = 0,
  debt = 0,
  overpaid = 0,
}) {
  const initDebt =
    Number(initialDebt !== undefined && initialDebt !== 0 ? initialDebt : debt) || 0;
  const initOverpaid =
    Number(initialOverpaid !== undefined && initialOverpaid !== 0 ? initialOverpaid : overpaid) || 0;
  const initTowels = Number(initialTowels) || 0;

  const docRef = await addDoc(collection(db, COLLECTIONS.BARBERS), {
    barbershopId,
    name: name.trim(),
    phone: phone.trim(),
    contractType,
    pricePerTowel: Number(pricePerTowel) || 0,
    initialTowels: initTowels,
    initialDebt: initDebt,
    initialOverpaid: initOverpaid,
    debt: initDebt,
    overpaid: initOverpaid,
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
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.phone !== undefined) updateData.phone = data.phone.trim();
  if (data.pricePerTowel !== undefined)
    updateData.pricePerTowel = Number(data.pricePerTowel) || 0;
  if (data.initialTowels !== undefined)
    updateData.initialTowels = Number(data.initialTowels) || 0;
  if (data.initialDebt !== undefined)
    updateData.initialDebt = Number(data.initialDebt) || 0;
  if (data.initialOverpaid !== undefined)
    updateData.initialOverpaid = Number(data.initialOverpaid) || 0;
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

export async function recordBarberPayment(barberIdOrPayload, legacyAmount) {
  let barberId = "";
  let barbershopId = "";
  let barbershopName = "";
  let barberName = "";
  let staffId = "";
  let staffName = "";
  let cashAmount = 0;
  let cardAmount = 0;
  let discount = 0;
  let note = "";

  if (typeof barberIdOrPayload === "object" && barberIdOrPayload !== null) {
    barberId = barberIdOrPayload.barberId;
    barbershopId = barberIdOrPayload.barbershopId || "";
    barbershopName = barberIdOrPayload.barbershopName || "";
    barberName = barberIdOrPayload.barberName || "";
    staffId = barberIdOrPayload.staffId || "";
    staffName = barberIdOrPayload.staffName || "Xodim";
    cashAmount = Number(barberIdOrPayload.cashAmount) || 0;
    cardAmount = Number(barberIdOrPayload.cardAmount) || 0;
    discount = Number(barberIdOrPayload.discount) || 0;
    note = barberIdOrPayload.note || "";
  } else {
    barberId = barberIdOrPayload;
    cashAmount = Number(legacyAmount) || 0;
  }

  const totalCredit = cashAmount + cardAmount + discount;
  const totalPaid = cashAmount + cardAmount;

  if (totalCredit <= 0) return null;

  const todayStr = getTodayDateString();

  return await runTransaction(db, async (transaction) => {
    const barberRef = doc(db, COLLECTIONS.BARBERS, barberId);
    const barberDoc = await transaction.get(barberRef);
    if (!barberDoc.exists()) throw new Error("Sartarosh topilmadi");

    const barberData = barberDoc.data();
    const currentDebt = Number(barberData.debt) || 0;
    const currentOverpaid = Number(barberData.overpaid) || 0;

    let newDebt = currentDebt;
    let newOverpaid = currentOverpaid;

    if (totalCredit <= newDebt) {
      newDebt -= totalCredit;
    } else {
      const remaining = totalCredit - newDebt;
      newDebt = 0;
      newOverpaid += remaining;
    }

    transaction.update(barberRef, {
      debt: newDebt,
      overpaid: newOverpaid,
      updatedAt: serverTimestamp(),
    });

    // Create payment transaction in sales collection
    const salesCol = collection(db, COLLECTIONS.SALES);
    const saleDocRef = doc(salesCol);
    transaction.set(saleDocRef, {
      barberId,
      barberName: barberName || barberData.name || "",
      barbershopId: barbershopId || barberData.barbershopId || "",
      barbershopName: barbershopName || "",
      staffId: staffId || "unknown",
      staffName: staffName || "Xodim",
      quantityDelivered: 0,
      returnedTowels: 0,
      unitPrice: 0,
      totalPrice: 0,
      contractType: barberData.contractType || null,
      cashAmount,
      cardAmount,
      discount,
      totalPaid,
      totalCredit,
      note: note.trim(),
      date: todayStr,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update daily report doc for driver
    if (staffId) {
      const reportId = `${staffId}_${todayStr}`;
      const reportRef = doc(db, COLLECTIONS.DAILY_REPORTS, reportId);
      const reportDoc = await transaction.get(reportRef);

      if (reportDoc.exists()) {
        const repData = reportDoc.data();
        transaction.update(reportRef, {
          cashAmount: (Number(repData.cashAmount) || 0) + cashAmount,
          cardAmount: (Number(repData.cardAmount) || 0) + cardAmount,
          discount: (Number(repData.discount) || 0) + discount,
          totalPaid: (Number(repData.totalPaid) || 0) + totalPaid,
          updatedAt: serverTimestamp(),
        });
      } else {
        transaction.set(reportRef, {
          staffId,
          staffName: staffName || "Xodim",
          date: todayStr,
          cashAmount,
          cardAmount,
          discount,
          totalPaid,
          totalDelivered: 0,
          totalReturned: 0,
          salesCount: 0,
          status: "active",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }

    return paymentDocRef.id;
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
  quantityDelivered = 0,
  returnedTowels = 0,
  unitPrice = 0,
  contractType = CONTRACT_TYPES.PAY_FOR_TAKEN,
  cashAmount = 0,
  cardAmount = 0,
  discount = 0,
  note = "",
}) {
  const qty = Number(quantityDelivered) || 0;
  const returnedQty = Number(returnedTowels) || 0;
  const price = Number(unitPrice) || 0;
  const totalPrice = qty * price;

  const cash = Number(cashAmount) || 0;
  const card = Number(cardAmount) || 0;
  const disc = Number(discount) || 0;
  const totalCredit = cash + card + disc;
  const totalPaid = cash + card;

  const todayStr = getTodayDateString();

  return await runTransaction(db, async (transaction) => {
    // 1. Fetch barber doc
    const barberRef = doc(db, COLLECTIONS.BARBERS, barberId);
    const barberDoc = await transaction.get(barberRef);
    if (!barberDoc.exists()) throw new Error("Sartarosh topilmadi");

    const bData = barberDoc.data();
    let currentDebt = Number(bData.debt) || 0;
    let currentOverpaid = Number(bData.overpaid) || 0;

    // Delivery charge if contractType is payForTaken
    if (contractType === CONTRACT_TYPES.PAY_FOR_TAKEN && totalPrice > 0) {
      if (currentOverpaid >= totalPrice) {
        currentOverpaid -= totalPrice;
      } else {
        const remaining = totalPrice - currentOverpaid;
        currentOverpaid = 0;
        currentDebt += remaining;
      }
    }

    // Return charge if contractType is payForUsed
    if (
      bData.contractType === CONTRACT_TYPES.PAY_FOR_USED &&
      returnedQty > 0
    ) {
      const charge = returnedQty * (Number(bData.pricePerTowel) || price || 0);
      if (currentOverpaid >= charge) {
        currentOverpaid -= charge;
      } else {
        currentDebt += charge - currentOverpaid;
        currentOverpaid = 0;
      }
    }

    // Deduct payment (cash + card + discount)
    if (totalCredit > 0) {
      if (totalCredit <= currentDebt) {
        currentDebt -= totalCredit;
      } else {
        const remaining = totalCredit - currentDebt;
        currentDebt = 0;
        currentOverpaid += remaining;
      }
    }

    transaction.update(barberRef, {
      debt: currentDebt,
      overpaid: currentOverpaid,
      updatedAt: serverTimestamp(),
    });

    // 2. Add Sale Document
    const salesCol = collection(db, COLLECTIONS.SALES);
    const saleDocRef = doc(salesCol);

    transaction.set(saleDocRef, {
      barberId,
      barbershopId,
      staffId: staffId || "unknown",
      staffName: staffName || "Xodim",
      barberName: barberName || bData.name || "",
      barbershopName,
      quantityDelivered: qty,
      returnedTowels: returnedQty,
      unitPrice: price,
      totalPrice,
      contractType,
      cashAmount: cash,
      cardAmount: card,
      discount: disc,
      totalPaid,
      totalCredit,
      note: note.trim(),
      date: todayStr,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });



    // 4. Update Daily Report for driver
    if (staffId) {
      const reportId = `${staffId}_${todayStr}`;
      const reportRef = doc(db, COLLECTIONS.DAILY_REPORTS, reportId);
      const reportDoc = await transaction.get(reportRef);

      if (reportDoc.exists()) {
        const rep = reportDoc.data();
        transaction.update(reportRef, {
          cashAmount: (Number(rep.cashAmount) || 0) + cash,
          cardAmount: (Number(rep.cardAmount) || 0) + card,
          discount: (Number(rep.discount) || 0) + disc,
          totalPaid: (Number(rep.totalPaid) || 0) + totalPaid,
          totalDelivered: (Number(rep.totalDelivered) || 0) + qty,
          totalReturned: (Number(rep.totalReturned) || 0) + returnedQty,
          salesCount: (Number(rep.salesCount) || 0) + 1,
          updatedAt: serverTimestamp(),
        });
      } else {
        transaction.set(reportRef, {
          staffId,
          staffName: staffName || "Xodim",
          date: todayStr,
          cashAmount: cash,
          cardAmount: card,
          discount: disc,
          totalPaid,
          totalDelivered: qty,
          totalReturned: returnedQty,
          salesCount: 1,
          status: "active",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }

    return saleDocRef.id;
  });
}

export async function updateSale(
  saleId,
  { quantityDelivered, returnedTowels, receivedMoney, cashAmount, cardAmount, discount }
) {
  const qty = Number(quantityDelivered) || 0;
  const returnedQty = Number(returnedTowels) || 0;

  return await runTransaction(db, async (transaction) => {
    const saleRef = doc(db, COLLECTIONS.SALES, saleId);
    const saleDoc = await transaction.get(saleRef);
    if (!saleDoc.exists()) throw new Error("Sotuv topilmadi");

    const oldData = saleDoc.data();
    const price = Number(oldData.unitPrice) || 0;
    const oldQty = Number(oldData.quantityDelivered) || 0;
    const oldReturnedQty = Number(oldData.returnedTowels) || 0;

    const oldCredit =
      oldData.totalCredit !== undefined
        ? Number(oldData.totalCredit) || 0
        : Number(oldData.receivedMoney) || 0;

    const cash =
      cashAmount !== undefined
        ? Number(cashAmount) || 0
        : Number(oldData.cashAmount) || 0;
    const card =
      cardAmount !== undefined
        ? Number(cardAmount) || 0
        : Number(oldData.cardAmount) || 0;
    const disc =
      discount !== undefined
        ? Number(discount) || 0
        : Number(oldData.discount) || 0;

    const newCredit =
      cashAmount !== undefined || cardAmount !== undefined || discount !== undefined
        ? cash + card + disc
        : Number(receivedMoney) || 0;

    const deliveryDiff =
      oldData.contractType === CONTRACT_TYPES.PAY_FOR_TAKEN
        ? (qty - oldQty) * price
        : 0;
    const returnDiff =
      (returnedQty - oldReturnedQty) *
      (oldData.contractType === CONTRACT_TYPES.PAY_FOR_USED ? price : 0);
    const paymentDiff = newCredit - oldCredit;
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
      cashAmount: cash,
      cardAmount: card,
      discount: disc,
      totalPaid: cash + card,
      totalCredit: newCredit,
      receivedMoney: cash + card,
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
            Number(item.returnedTowels) > 0 ||
            Number(item.totalPaid) > 0 ||
            Number(item.totalCredit) > 0 ||
            Number(item.cashAmount) > 0 ||
            Number(item.cardAmount) > 0 ||
            Number(item.discount) > 0
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
            Number(item.returnedTowels) > 0 ||
            Number(item.totalPaid) > 0 ||
            Number(item.totalCredit) > 0 ||
            Number(item.cashAmount) > 0 ||
            Number(item.cardAmount) > 0 ||
            Number(item.discount) > 0
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

export async function updateUserRole(uid, role) {
  if (!uid) throw new Error("Foydalanuvchi identifikatori topilmadi");
  const userRef = doc(db, COLLECTIONS.USERS, uid);
  await updateDoc(userRef, {
    role,
    updatedAt: serverTimestamp(),
  });
}



// ========================
// DAILY REPORTS
// ========================

export function subscribeDailyReports(callback) {
  const q = query(
    collection(db, COLLECTIONS.DAILY_REPORTS),
    orderBy("date", "desc")
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
    (err) => console.error("Daily reports subscribe error:", err)
  );
}

export function subscribeStaffDailyReports(staffId, callback) {
  const q = query(
    collection(db, COLLECTIONS.DAILY_REPORTS),
    where("staffId", "==", staffId),
    orderBy("date", "desc")
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
    (err) => console.error("Staff daily reports subscribe error:", err)
  );
}

export async function closeDailyReport(reportId) {
  const reportRef = doc(db, COLLECTIONS.DAILY_REPORTS, reportId);
  await updateDoc(reportRef, {
    status: "closed",
    closedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
