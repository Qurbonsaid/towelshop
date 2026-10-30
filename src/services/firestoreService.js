import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
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
import {
  isIndexedDBAvailable,
  upsertSaleLocal,
  deleteSaleLocal,
  deleteSalesByBarberIdLocal,
  deleteSalesByBarbershopIdLocal,
} from "./localDb";
import {
  subscribeSalesWithSync,
  broadcastLocalSales,
  notifyOtherTabs,
} from "./salesSyncService";

// Default real-time listener window sizes to prevent unbounded full-history reads
const DEFAULT_SALES_LIMIT = 300;
const DEFAULT_REPORTS_LIMIT = 90;

// ========================
// DATE UTILS
// ========================

export function getTodayDateString(d = new Date()) {
  const date = d instanceof Date ? d : new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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
    updatedAt: serverTimestamp(),
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
  const barbersQuery = query(
    collection(db, COLLECTIONS.BARBERS),
    where("barbershopId", "==", barbershopId)
  );
  const barbersSnapshot = await getDocs(barbersQuery);

  const salesQuery = query(
    collection(db, COLLECTIONS.SALES),
    where("barbershopId", "==", barbershopId)
  );
  const salesSnapshot = await getDocs(salesQuery);

  for (const sDoc of salesSnapshot.docs) {
    await deleteDoc(sDoc.ref);
  }

  deleteSalesByBarbershopIdLocal(barbershopId)
    .then(() => {
      broadcastLocalSales();
      notifyOtherTabs();
    })
    .catch(() => {});

  for (const bDoc of barbersSnapshot.docs) {
    await deleteDoc(bDoc.ref);
  }

  await deleteDoc(doc(db, COLLECTIONS.BARBERSHOPS, barbershopId));
}

// ========================
// BARBERS
// ========================

function normalizeBarberDoc(docItem) {
  const data = docItem.data();
  return {
    id: docItem.id,
    ...data,
    towelsCount: Number(data.towelsCount ?? data.initialTowels ?? 0),
    debt: Number(data.debt || 0),
    overpaid: Number(data.overpaid || 0),
  };
}

export async function listBarbers() {
  const q = query(collection(db, COLLECTIONS.BARBERS), orderBy("name", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(normalizeBarberDoc);
}

export function subscribeBarbers(callback) {
  const q = query(collection(db, COLLECTIONS.BARBERS), orderBy("name", "asc"));
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map(normalizeBarberDoc));
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
  return snapshot.docs.map(normalizeBarberDoc);
}

export async function createBarber({
  barbershopId,
  name,
  phone = "",
  contractType = CONTRACT_TYPES.PAY_FOR_TAKEN,
  pricePerTowel = 3000,
  towelsCount = 0,
  debt = 0,
  overpaid = 0,
  initialTowels = 0,
}) {
  const countVal =
    Number(towelsCount !== undefined ? towelsCount : initialTowels) || 0;
  const initDebt = Number(debt) || 0;
  const initOverpaid = Number(overpaid) || 0;

  const docRef = await addDoc(collection(db, COLLECTIONS.BARBERS), {
    barbershopId,
    name: name.trim(),
    phone: phone.trim(),
    contractType,
    pricePerTowel: Number(pricePerTowel) || 3000,
    towelsCount: countVal,
    debt: initDebt,
    overpaid: initOverpaid,
    totalDelivered: countVal,
    totalReturned: 0,
    totalSalesSum: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateBarber(id, data) {
  const docRef = doc(db, COLLECTIONS.BARBERS, id);
  const updateData = {
    updatedAt: serverTimestamp(),
  };

  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.phone !== undefined) updateData.phone = data.phone.trim();
  if (data.barbershopId !== undefined)
    updateData.barbershopId = data.barbershopId;
  if (data.contractType !== undefined)
    updateData.contractType = data.contractType;
  if (data.pricePerTowel !== undefined)
    updateData.pricePerTowel = Number(data.pricePerTowel) || 0;
  if (data.towelsCount !== undefined)
    updateData.towelsCount = Number(data.towelsCount) || 0;
  else if (data.initialTowels !== undefined)
    updateData.towelsCount = Number(data.initialTowels) || 0;
  if (data.debt !== undefined) updateData.debt = Number(data.debt) || 0;
  if (data.overpaid !== undefined)
    updateData.overpaid = Number(data.overpaid) || 0;

  await updateDoc(docRef, updateData);
}

export async function deleteBarber(id) {
  await deleteDoc(doc(db, COLLECTIONS.BARBERS, id));
}

export async function deleteBarberCascade(barberId) {
  const salesQuery = query(
    collection(db, COLLECTIONS.SALES),
    where("barberId", "==", barberId)
  );
  const salesSnapshot = await getDocs(salesQuery);
  for (const sDoc of salesSnapshot.docs) {
    await deleteDoc(sDoc.ref);
  }
  deleteSalesByBarberIdLocal(barberId)
    .then(() => {
      broadcastLocalSales();
      notifyOtherTabs();
    })
    .catch(() => {});
  await deleteDoc(doc(db, COLLECTIONS.BARBERS, barberId));
}

// ========================
// SALES / TRANSACTIONS (UNIFIED WITH DEBT/PAYMENT AUDIT FIELDS)
// ========================

export async function createSale({
  barberId,
  barbershopId,
  staffId,
  staffName = "Xodim",
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
  const cash = Number(cashAmount) || 0;
  const card = Number(cardAmount) || 0;
  const disc = Number(discount) || 0;

  const totalPaid = cash + card;
  const totalCredit = cash + card + disc;

  const todayStr = getTodayDateString();

  const result = await runTransaction(db, async (transaction) => {
    // 1. ALL READS FIRST
    const barberRef = doc(db, COLLECTIONS.BARBERS, barberId);
    const barberDoc = await transaction.get(barberRef);
    if (!barberDoc.exists()) throw new Error("Sartarosh topilmadi");

    let reportRef = null;
    let reportDoc = null;
    if (staffId) {
      const reportId = `${staffId}_${todayStr}`;
      reportRef = doc(db, COLLECTIONS.DAILY_REPORTS, reportId);
      reportDoc = await transaction.get(reportRef);
    }

    // 2. IN-MEMORY CALCULATIONS
    const bData = barberDoc.data();
    const contract =
      contractType || bData.contractType || CONTRACT_TYPES.PAY_FOR_TAKEN;
    const price = Number(unitPrice) || Number(bData.pricePerTowel) || 3000;

    let chargedAmount = 0;
    if (contract === CONTRACT_TYPES.PAY_FOR_TAKEN) {
      chargedAmount = qty * price;
    } else if (contract === CONTRACT_TYPES.PAY_FOR_USED) {
      chargedAmount = returnedQty * price;
    }
    const totalPrice = chargedAmount;

    const currentTowels = Number(bData.towelsCount ?? bData.initialTowels ?? 0);
    const currentDebt = Number(bData.debt) || 0;
    const currentOverpaid = Number(bData.overpaid) || 0;

    const newTowelsCount = Math.max(0, currentTowels + qty - returnedQty);

    const netBalance =
      currentDebt - currentOverpaid + chargedAmount - totalCredit;
    let newDebt = 0;
    let newOverpaid = 0;
    if (netBalance > 0) {
      newDebt = netBalance;
      newOverpaid = 0;
    } else if (netBalance < 0) {
      newDebt = 0;
      newOverpaid = Math.abs(netBalance);
    }

    // Debt & payment audit fields stored directly on the sale document
    // (eliminates the duplicate /logs collection and its full-collection scans)
    const isDebtPayment = currentDebt > 0 && totalCredit > 0;
    const debtPaidAmount = isDebtPayment
      ? Math.min(currentDebt, totalCredit)
      : 0;
    const isNewDebt = newDebt > currentDebt;
    const newDebtAmount = isNewDebt ? newDebt - currentDebt : 0;

    let logType = "CASH_SALE";
    if (isDebtPayment && isNewDebt) {
      logType = "PAYMENT_AND_DEBT";
    } else if (isDebtPayment) {
      logType = "DEBT_PAYMENT";
    } else if (isNewDebt) {
      logType = "NEW_DEBT";
    }

    // 3. ALL WRITES AFTER READS
    // 3A. Update barber doc (including lifetime counters)
    const barberUpdate = {
      towelsCount: newTowelsCount,
      debt: newDebt,
      overpaid: newOverpaid,
      updatedAt: serverTimestamp(),
    };
    if (bData.totalDelivered !== undefined) {
      barberUpdate.totalDelivered =
        Math.max(0, (Number(bData.totalDelivered) || 0) + qty);
      barberUpdate.totalReturned =
        Math.max(0, (Number(bData.totalReturned) || 0) + returnedQty);
      barberUpdate.totalSalesSum =
        Math.max(0, (Number(bData.totalSalesSum) || 0) + totalPrice);
    }
    transaction.update(barberRef, barberUpdate);

    // 3B. Create unified sale document (contains both sale & debt audit info)
    const salesCol = collection(db, COLLECTIONS.SALES);
    const saleDocRef = doc(salesCol);

    const salePayload = {
      type: logType,
      barberId,
      barbershopId: barbershopId || bData.barbershopId || "",
      staffId: staffId || "unknown",
      staffName: staffName || "Xodim",
      barberName: barberName || bData.name || "",
      barbershopName: barbershopName || "",
      quantityDelivered: qty,
      returnedTowels: returnedQty,
      unitPrice: price,
      totalPrice,
      chargedAmount,
      contractType: contract,
      cashAmount: cash,
      cardAmount: card,
      discount: disc,
      totalPaid,
      totalCredit,
      oldDebt: currentDebt,
      newDebt,
      debtDifference: newDebt - currentDebt,
      isDebtPayment,
      debtPaidAmount,
      isNewDebt,
      newDebtAmount,
      oldOverpaid: currentOverpaid,
      newOverpaid,
      note: note.trim(),
      date: todayStr,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    transaction.set(saleDocRef, salePayload);

    // 3C. Update or set Daily Report
    if (reportRef && reportDoc) {
      if (reportDoc.exists()) {
        const rep = reportDoc.data();
        const totalDelivered = (Number(rep.totalDelivered) || 0) + qty;
        const totalReturned = (Number(rep.totalReturned) || 0) + returnedQty;
        const totalLoaded = Number(rep.totalLoadedFromWarehouse) || 0;
        const unsold = Number(rep.unsoldTowelsReturned) || 0;
        const currentStock = Math.max(0, totalLoaded - totalDelivered - unsold);

        transaction.update(reportRef, {
          cashAmount: (Number(rep.cashAmount) || 0) + cash,
          cardAmount: (Number(rep.cardAmount) || 0) + card,
          discount: (Number(rep.discount) || 0) + disc,
          totalPaid: (Number(rep.totalPaid) || 0) + totalPaid,
          totalDelivered,
          totalReturned,
          currentStock,
          salesCount: (Number(rep.salesCount) || 0) + 1,
          updatedAt: serverTimestamp(),
        });
      } else {
        transaction.set(reportRef, {
          staffId,
          staffName: staffName || "Xodim",
          date: todayStr,
          warehouseLoads: [],
          totalLoadedFromWarehouse: 0,
          totalDelivered: qty,
          totalReturned: returnedQty,
          currentStock: 0,
          unsoldTowelsReturned: 0,
          cashAmount: cash,
          cardAmount: card,
          discount: disc,
          totalPaid,
          salesCount: 1,
          status: "active",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }

    return { saleId: saleDocRef.id, payload: salePayload };
  });

  if (result?.saleId) {
    upsertSaleLocal({
      id: result.saleId,
      ...result.payload,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
      .then(() => {
        broadcastLocalSales();
        notifyOtherTabs();
      })
      .catch(() => {});
    return result.saleId;
  }

  return result;
}

export async function updateSale(
  saleId,
  { quantityDelivered, returnedTowels, cashAmount, cardAmount, discount, note }
) {
  const newQty = Number(quantityDelivered) || 0;
  const newReturnedQty = Number(returnedTowels) || 0;

  await runTransaction(db, async (transaction) => {
    // 1. ALL READS FIRST
    const saleRef = doc(db, COLLECTIONS.SALES, saleId);
    const saleDoc = await transaction.get(saleRef);
    if (!saleDoc.exists()) throw new Error("Sotuv topilmadi");

    const oldData = saleDoc.data();

    let barberRef = null;
    let barberDoc = null;
    if (oldData.barberId) {
      barberRef = doc(db, COLLECTIONS.BARBERS, oldData.barberId);
      barberDoc = await transaction.get(barberRef);
    }

    let reportRef = null;
    let reportDoc = null;
    if (oldData.staffId && oldData.date) {
      const reportId = `${oldData.staffId}_${oldData.date}`;
      reportRef = doc(db, COLLECTIONS.DAILY_REPORTS, reportId);
      reportDoc = await transaction.get(reportRef);
    }

    // 2. IN-MEMORY CALCULATIONS
    const price = Number(oldData.unitPrice) || 3000;
    const contract = oldData.contractType || CONTRACT_TYPES.PAY_FOR_TAKEN;

    const oldQty = Number(oldData.quantityDelivered) || 0;
    const oldReturnedQty = Number(oldData.returnedTowels) || 0;
    const oldCash = Number(
      oldData.cashAmount !== undefined
        ? oldData.cashAmount
        : oldData.receivedMoney || 0
    );
    const oldCard = Number(oldData.cardAmount) || 0;
    const oldDisc = Number(oldData.discount) || 0;

    const newCash =
      cashAmount !== undefined ? Number(cashAmount) || 0 : oldCash;
    const newCard =
      cardAmount !== undefined ? Number(cardAmount) || 0 : oldCard;
    const newDisc =
      discount !== undefined ? Number(discount) || 0 : oldDisc;

    const oldTowelDelta = oldQty - oldReturnedQty;
    const newTowelDelta = newQty - newReturnedQty;
    const towelDeltaDiff = newTowelDelta - oldTowelDelta;

    const oldCharge =
      contract === CONTRACT_TYPES.PAY_FOR_TAKEN
        ? oldQty * price
        : oldReturnedQty * price;
    const newCharge =
      contract === CONTRACT_TYPES.PAY_FOR_TAKEN
        ? newQty * price
        : newReturnedQty * price;
    const oldCredit = oldCash + oldCard + oldDisc;
    const newCredit = newCash + newCard + newDisc;
    const newPaid = newCash + newCard;
    const balanceDiff = newCharge - oldCharge - (newCredit - oldCredit);

    // 3. ALL WRITES AFTER READS
    let updatedBarberDebt = Number(oldData.newDebt) || 0;
    let updatedBarberOverpaid = Number(oldData.newOverpaid) || 0;

    if (barberRef && barberDoc && barberDoc.exists()) {
      const bData = barberDoc.data();
      const currentTowels = Number(
        bData.towelsCount ?? bData.initialTowels ?? 0
      );
      const currentDebt = Number(bData.debt) || 0;
      const currentOverpaid = Number(bData.overpaid) || 0;

      const updatedTowelsCount = Math.max(0, currentTowels + towelDeltaDiff);
      const netBalance = currentDebt - currentOverpaid + balanceDiff;
      let newDebt = 0;
      let newOverpaid = 0;
      if (netBalance > 0) {
        newDebt = netBalance;
        newOverpaid = 0;
      } else if (netBalance < 0) {
        newDebt = 0;
        newOverpaid = Math.abs(netBalance);
      }

      updatedBarberDebt = newDebt;
      updatedBarberOverpaid = newOverpaid;

      const barberUpdate = {
        towelsCount: updatedTowelsCount,
        debt: newDebt,
        overpaid: newOverpaid,
        updatedAt: serverTimestamp(),
      };
      if (bData.totalDelivered !== undefined) {
        barberUpdate.totalDelivered = Math.max(
          0,
          (Number(bData.totalDelivered) || 0) + (newQty - oldQty)
        );
        barberUpdate.totalReturned = Math.max(
          0,
          (Number(bData.totalReturned) || 0) + (newReturnedQty - oldReturnedQty)
        );
        barberUpdate.totalSalesSum = Math.max(
          0,
          (Number(bData.totalSalesSum) || 0) + (newCharge - oldCharge)
        );
      }
      transaction.update(barberRef, barberUpdate);
    }

    const priorDebt = Number(oldData.oldDebt) || 0;
    const isDebtPayment = priorDebt > 0 && newCredit > 0;
    const debtPaidAmount = isDebtPayment
      ? Math.min(priorDebt, newCredit)
      : 0;
    const isNewDebt = newCharge > newCredit;
    const newDebtAmount = isNewDebt ? newCharge - newCredit : 0;

    const saleUpdates = {
      quantityDelivered: newQty,
      returnedTowels: newReturnedQty,
      totalPrice: newCharge,
      chargedAmount: newCharge,
      cashAmount: newCash,
      cardAmount: newCard,
      discount: newDisc,
      totalPaid: newPaid,
      totalCredit: newCredit,
      newDebt: updatedBarberDebt,
      newOverpaid: updatedBarberOverpaid,
      isDebtPayment,
      debtPaidAmount,
      isNewDebt,
      newDebtAmount,
      updatedAt: serverTimestamp(),
    };
    if (note !== undefined) saleUpdates.note = note.trim();
    transaction.update(saleRef, saleUpdates);

    if (reportRef && reportDoc && reportDoc.exists()) {
      const rep = reportDoc.data();
      const deliveredDiff = newQty - oldQty;
      const returnedDiff = newReturnedQty - oldReturnedQty;
      const cashDiff = newCash - oldCash;
      const cardDiff = newCard - oldCard;
      const discDiff = newDisc - oldDisc;
      const totalPaidDiff = newCash + newCard - (oldCash + oldCard);

      const totalDelivered = Math.max(
        0,
        (Number(rep.totalDelivered) || 0) + deliveredDiff
      );
      const totalReturned = Math.max(
        0,
        (Number(rep.totalReturned) || 0) + returnedDiff
      );
      const totalLoaded = Number(rep.totalLoadedFromWarehouse) || 0;
      const unsold = Number(rep.unsoldTowelsReturned) || 0;
      const currentStock = Math.max(0, totalLoaded - totalDelivered - unsold);

      transaction.update(reportRef, {
        totalDelivered,
        totalReturned,
        cashAmount: Math.max(0, (Number(rep.cashAmount) || 0) + cashDiff),
        cardAmount: Math.max(0, (Number(rep.cardAmount) || 0) + cardDiff),
        discount: Math.max(0, (Number(rep.discount) || 0) + discDiff),
        totalPaid: Math.max(0, (Number(rep.totalPaid) || 0) + totalPaidDiff),
        currentStock,
        updatedAt: serverTimestamp(),
      });
    }
  });
}

export async function deleteSale(saleId) {
  await runTransaction(db, async (transaction) => {
    // 1. ALL READS FIRST
    const saleRef = doc(db, COLLECTIONS.SALES, saleId);
    const saleDoc = await transaction.get(saleRef);
    if (!saleDoc.exists()) return;

    const data = saleDoc.data();

    let barberRef = null;
    let barberDoc = null;
    if (data.barberId) {
      barberRef = doc(db, COLLECTIONS.BARBERS, data.barberId);
      barberDoc = await transaction.get(barberRef);
    }

    let reportRef = null;
    let reportDoc = null;
    if (data.staffId && data.date) {
      const reportId = `${data.staffId}_${data.date}`;
      reportRef = doc(db, COLLECTIONS.DAILY_REPORTS, reportId);
      reportDoc = await transaction.get(reportRef);
    }

    // 2. IN-MEMORY CALCULATIONS & WRITES
    const qty = Number(data.quantityDelivered) || 0;
    const returnedQty = Number(data.returnedTowels) || 0;
    const price = Number(data.unitPrice) || 3000;
    const contract = data.contractType || CONTRACT_TYPES.PAY_FOR_TAKEN;
    const cash = Number(data.cashAmount) || 0;
    const card = Number(data.cardAmount) || 0;
    const disc = Number(data.discount) || 0;
    const charge =
      contract === CONTRACT_TYPES.PAY_FOR_TAKEN
        ? qty * price
        : returnedQty * price;

    // 2A. Revert barber
    if (barberRef && barberDoc && barberDoc.exists()) {
      const bData = barberDoc.data();
      const currentTowels = Number(bData.towelsCount ?? 0);
      const currentDebt = Number(bData.debt) || 0;
      const currentOverpaid = Number(bData.overpaid) || 0;

      const revertedTowels = Math.max(0, currentTowels - (qty - returnedQty));
      const credit = cash + card + disc;
      const balanceDelta = -(charge - credit);

      const netBalance = currentDebt - currentOverpaid + balanceDelta;
      let newDebt = 0;
      let newOverpaid = 0;
      if (netBalance > 0) {
        newDebt = netBalance;
        newOverpaid = 0;
      } else if (netBalance < 0) {
        newDebt = 0;
        newOverpaid = Math.abs(netBalance);
      }

      const barberUpdate = {
        towelsCount: revertedTowels,
        debt: newDebt,
        overpaid: newOverpaid,
        updatedAt: serverTimestamp(),
      };
      if (bData.totalDelivered !== undefined) {
        barberUpdate.totalDelivered = Math.max(
          0,
          (Number(bData.totalDelivered) || 0) - qty
        );
        barberUpdate.totalReturned = Math.max(
          0,
          (Number(bData.totalReturned) || 0) - returnedQty
        );
        barberUpdate.totalSalesSum = Math.max(
          0,
          (Number(bData.totalSalesSum) || 0) - charge
        );
      }
      transaction.update(barberRef, barberUpdate);
    }

    // 2B. Revert daily report
    if (reportRef && reportDoc && reportDoc.exists()) {
      const rep = reportDoc.data();
      const totalDelivered = Math.max(
        0,
        (Number(rep.totalDelivered) || 0) - qty
      );
      const totalReturned = Math.max(
        0,
        (Number(rep.totalReturned) || 0) - returnedQty
      );
      const totalLoaded = Number(rep.totalLoadedFromWarehouse) || 0;
      const unsold = Number(rep.unsoldTowelsReturned) || 0;
      const currentStock = Math.max(0, totalLoaded - totalDelivered - unsold);

      transaction.update(reportRef, {
        totalDelivered,
        totalReturned,
        cashAmount: Math.max(0, (Number(rep.cashAmount) || 0) - cash),
        cardAmount: Math.max(0, (Number(rep.cardAmount) || 0) - card),
        discount: Math.max(0, (Number(rep.discount) || 0) - disc),
        totalPaid: Math.max(0, (Number(rep.totalPaid) || 0) - (cash + card)),
        salesCount: Math.max(0, (Number(rep.salesCount) || 1) - 1),
        currentStock,
        updatedAt: serverTimestamp(),
      });
    }

    // 2C. Delete sale doc
    transaction.delete(saleRef);
  });

  deleteSaleLocal(saleId)
    .then(() => {
      broadcastLocalSales();
      notifyOtherTabs();
    })
    .catch(() => {});
}

function normalizeSaleDoc(docItem) {
  const data = docItem.data();
  const cashAmount = Number(data.cashAmount || 0);
  const cardAmount = Number(data.cardAmount || 0);
  const discount = Number(data.discount || 0);
  return {
    id: docItem.id,
    ...data,
    quantityDelivered: Number(data.quantityDelivered || 0),
    returnedTowels: Number(data.returnedTowels || 0),
    cashAmount,
    cardAmount,
    discount,
    totalPrice: Number(data.totalPrice || 0),
    totalPaid: cashAmount + cardAmount,
    totalCredit: cashAmount + cardAmount + discount,
  };
}

/**
 * Subscribe to sales using Dexie IndexedDB with Firestore Delta-Sync.
 * If IndexedDB is supported, saves 99% of Firestore reads by serving from local cache
 * and only syncing changed documents (delta sync).
 * Fallback to direct Firestore bounded query if IndexedDB is blocked.
 */
export function subscribeSales(callback, maxLimit = DEFAULT_SALES_LIMIT) {
  if (isIndexedDBAvailable()) {
    return subscribeSalesWithSync(callback);
  }

  // Graceful fallback for non-IndexedDB environments
  const q = query(
    collection(db, COLLECTIONS.SALES),
    orderBy("createdAt", "desc"),
    limit(maxLimit)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map(normalizeSaleDoc));
    },
    (err) => console.error("Sales subscribe error:", err)
  );
}

export function subscribeStaffSales(
  staffId,
  callback,
  maxLimit = DEFAULT_SALES_LIMIT
) {
  const q = query(
    collection(db, COLLECTIONS.SALES),
    where("staffId", "==", staffId),
    orderBy("createdAt", "desc"),
    limit(maxLimit)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map(normalizeSaleDoc));
    },
    (err) => console.error("Staff sales subscribe error:", err)
  );
}

/**
 * Server-side aggregation fallback stub.
 */
export async function getAllTimeSalesAggregate() {
  return null;
}

// ========================
// RETURN TRANSACTIONS & PAYMENT HELPERS
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
    returnedTowels: Number(quantityReturned) || 0,
    unitPrice: 0,
    contractType: CONTRACT_TYPES.PAY_FOR_USED,
    cashAmount: 0,
    cardAmount: 0,
    discount: 0,
    note,
  });
}

export async function recordBarberPayment(payload) {
  return createSale({
    barberId: payload.barberId,
    barbershopId: payload.barbershopId,
    staffId: payload.staffId,
    staffName: payload.staffName,
    barberName: payload.barberName,
    barbershopName: payload.barbershopName,
    quantityDelivered: 0,
    returnedTowels: 0,
    unitPrice: 0,
    contractType: null,
    cashAmount: Number(payload.cashAmount) || 0,
    cardAmount: Number(payload.cardAmount) || 0,
    discount: Number(payload.discount) || 0,
    note: payload.note || "",
  });
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
// DAILY REPORTS & WAREHOUSE INVENTORY
// ========================

export function subscribeDailyReports(
  callback,
  maxLimit = DEFAULT_REPORTS_LIMIT
) {
  const q = query(
    collection(db, COLLECTIONS.DAILY_REPORTS),
    orderBy("date", "desc"),
    limit(maxLimit)
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

export function subscribeStaffDailyReports(
  staffId,
  callback,
  maxLimit = DEFAULT_REPORTS_LIMIT
) {
  const q = query(
    collection(db, COLLECTIONS.DAILY_REPORTS),
    where("staffId", "==", staffId),
    orderBy("date", "desc"),
    limit(maxLimit)
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

/**
 * Record warehouse towel load (driver pickup from warehouse)
 */
export async function recordWarehouseLoad({
  staffId,
  staffName,
  count: loadVal,
  note = "",
}) {
  const loadCount = Number(loadVal) || 0;
  if (loadCount <= 0 || !staffId) return;

  const todayStr = getTodayDateString();
  const reportId = `${staffId}_${todayStr}`;
  const reportRef = doc(db, COLLECTIONS.DAILY_REPORTS, reportId);

  const now = new Date();
  const timeStr = now.toLocaleTimeString("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const newLoadEntry = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    time: timeStr,
    count: loadCount,
    note: note.trim() || "Ombordan olindi",
    createdAt: now.toISOString(),
  };

  return await runTransaction(db, async (transaction) => {
    const reportDoc = await transaction.get(reportRef);

    if (reportDoc.exists()) {
      const rep = reportDoc.data();
      const existingLoads = Array.isArray(rep.warehouseLoads)
        ? rep.warehouseLoads
        : [];
      const updatedLoads = [...existingLoads, newLoadEntry];
      const totalLoaded =
        (Number(rep.totalLoadedFromWarehouse) || 0) + loadCount;
      const totalDelivered = Number(rep.totalDelivered) || 0;
      const unsold = Number(rep.unsoldTowelsReturned) || 0;
      const currentStock = Math.max(0, totalLoaded - totalDelivered - unsold);

      transaction.update(reportRef, {
        warehouseLoads: updatedLoads,
        totalLoadedFromWarehouse: totalLoaded,
        currentStock,
        updatedAt: serverTimestamp(),
      });
    } else {
      transaction.set(reportRef, {
        staffId,
        staffName: staffName || "Xodim",
        date: todayStr,
        warehouseLoads: [newLoadEntry],
        totalLoadedFromWarehouse: loadCount,
        totalDelivered: 0,
        totalReturned: 0,
        currentStock: loadCount,
        unsoldTowelsReturned: 0,
        cashAmount: 0,
        cardAmount: 0,
        discount: 0,
        totalPaid: 0,
        salesCount: 0,
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  });
}

/**
 * Close daily report at end of day, recording unsold towels returned to warehouse
 */
export async function closeDailyReport(
  reportId,
  { unsoldTowelsReturned = 0, note = "" } = {}
) {
  const reportRef = doc(db, COLLECTIONS.DAILY_REPORTS, reportId);
  const unsold = Number(unsoldTowelsReturned) || 0;

  await updateDoc(reportRef, {
    status: "closed",
    unsoldTowelsReturned: unsold,
    currentStock: 0,
    closingNote: note.trim(),
    closedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
