import Dexie from "dexie";

/**
 * TowelShop Local Dexie Database (IndexedDB)
 *
 * Stores full sales history locally to:
 * 1. Eliminate Firestore daily free read quota exhaustion (50k limit).
 * 2. Remove the artificial 300-doc limit that broke monthly and all-time stats.
 * 3. Provide instant (0ms) cold load and complete offline capability.
 */
export const localDb = new Dexie("TowelShopLocalDB");

localDb.version(1).stores({
  sales:
    "id, date, createdAtMillis, updatedAtMillis, barbershopId, barberId, staffId, type",
  syncMeta: "key",
});

/**
 * Checks whether IndexedDB is available and functional in this browser.
 */
export function isIndexedDBAvailable() {
  try {
    return (
      typeof window !== "undefined" &&
      "indexedDB" in window &&
      window.indexedDB !== null
    );
  } catch {
    return false;
  }
}

/**
 * Normalizes a raw Firestore sale doc or plain object for clean storage in Dexie.
 * Ensures timestamps are serialized to integer milliseconds so IndexedDB structured clone
 * and Dexie indexing work reliably across browsers without losing object prototypes.
 */
export function serializeSaleForLocalDb(sale) {
  if (!sale || !sale.id) return null;

  let createdAtMillis = 0;
  if (sale.createdAt?.toMillis) {
    createdAtMillis = sale.createdAt.toMillis();
  } else if (sale.createdAt?.seconds) {
    createdAtMillis = sale.createdAt.seconds * 1000;
  } else if (typeof sale.createdAtMillis === "number") {
    createdAtMillis = sale.createdAtMillis;
  } else if (sale.createdAt instanceof Date) {
    createdAtMillis = sale.createdAt.getTime();
  } else if (
    typeof sale.createdAt === "string" ||
    typeof sale.createdAt === "number"
  ) {
    createdAtMillis = new Date(sale.createdAt).getTime();
  } else if (sale.date) {
    createdAtMillis = new Date(`${sale.date}T00:00:00`).getTime();
  }
  if (!createdAtMillis || isNaN(createdAtMillis)) createdAtMillis = Date.now();

  let updatedAtMillis = 0;
  if (sale.updatedAt?.toMillis) {
    updatedAtMillis = sale.updatedAt.toMillis();
  } else if (sale.updatedAt?.seconds) {
    updatedAtMillis = sale.updatedAt.seconds * 1000;
  } else if (typeof sale.updatedAtMillis === "number") {
    updatedAtMillis = sale.updatedAtMillis;
  } else if (sale.updatedAt instanceof Date) {
    updatedAtMillis = sale.updatedAt.getTime();
  } else if (
    typeof sale.updatedAt === "string" ||
    typeof sale.updatedAt === "number"
  ) {
    updatedAtMillis = new Date(sale.updatedAt).getTime();
  } else {
    updatedAtMillis = createdAtMillis;
  }
  if (!updatedAtMillis || isNaN(updatedAtMillis)) {
    updatedAtMillis = createdAtMillis;
  }

  const cashAmount = Number(sale.cashAmount || 0);
  const cardAmount = Number(sale.cardAmount || 0);
  const discount = Number(sale.discount || 0);
  const totalPrice = Number(sale.totalPrice || 0);
  const quantityDelivered = Number(sale.quantityDelivered || 0);
  const returnedTowels = Number(sale.returnedTowels || 0);

  return {
    ...sale,
    id: String(sale.id),
    barberId: sale.barberId ? String(sale.barberId) : "",
    barbershopId: sale.barbershopId ? String(sale.barbershopId) : "",
    staffId: sale.staffId ? String(sale.staffId) : "",
    date: sale.date || "",
    type: sale.type || "CASH_SALE",
    quantityDelivered,
    returnedTowels,
    cashAmount,
    cardAmount,
    discount,
    totalPrice,
    totalPaid: Number(sale.totalPaid ?? cashAmount + cardAmount),
    totalCredit: Number(sale.totalCredit ?? cashAmount + cardAmount + discount),
    createdAtMillis,
    updatedAtMillis,
    createdAtRaw: sale.date || new Date(createdAtMillis).toISOString(),
    updatedAtRaw: new Date(updatedAtMillis).toISOString(),
  };
}

/**
 * Restores synthetic Firestore Timestamp compatibility (.toMillis(), .toDate())
 * so any existing UI component reading doc.createdAt.toMillis() will never fail.
 */
export function deserializeSaleFromLocalDb(record) {
  if (!record) return null;
  const cMillis =
    Number(record.createdAtMillis) ||
    (record.date ? new Date(`${record.date}T00:00:00`).getTime() : Date.now());
  const uMillis = Number(record.updatedAtMillis) || cMillis;

  return {
    ...record,
    createdAt: {
      toMillis: () => cMillis,
      toDate: () => new Date(cMillis),
      seconds: Math.floor(cMillis / 1000),
      nanoseconds: 0,
    },
    updatedAt: {
      toMillis: () => uMillis,
      toDate: () => new Date(uMillis),
      seconds: Math.floor(uMillis / 1000),
      nanoseconds: 0,
    },
  };
}

/**
 * Fetch all sales from local Dexie, sorted newest first by createdAtMillis.
 */
export async function getAllSalesLocal() {
  try {
    const rawSales = await localDb.sales.toArray();
    // Fast in-memory sort ensures descending chronological order
    rawSales.sort(
      (a, b) => (b.createdAtMillis || 0) - (a.createdAtMillis || 0)
    );
    return rawSales.map(deserializeSaleFromLocalDb);
  } catch (err) {
    console.error("Dexie getAllSalesLocal error:", err);
    return [];
  }
}

/**
 * Bulk upsert sales into Dexie local DB.
 */
export async function bulkUpsertSalesLocal(salesList) {
  if (!salesList || !salesList.length) return;
  try {
    const serialized = salesList.map(serializeSaleForLocalDb).filter(Boolean);
    await localDb.sales.bulkPut(serialized);
  } catch (err) {
    console.error("Dexie bulkUpsertSalesLocal error:", err);
  }
}

/**
 * Single upsert sale into Dexie local DB.
 */
export async function upsertSaleLocal(sale) {
  if (!sale) return;
  try {
    const serialized = serializeSaleForLocalDb(sale);
    if (serialized) {
      await localDb.sales.put(serialized);
    }
  } catch (err) {
    console.error("Dexie upsertSaleLocal error:", err);
  }
}

/**
 * Delete a sale by ID from Dexie local DB.
 */
export async function deleteSaleLocal(saleId) {
  if (!saleId) return;
  try {
    await localDb.sales.delete(String(saleId));
  } catch (err) {
    console.error("Dexie deleteSaleLocal error:", err);
  }
}

/**
 * Delete all sales for a given barberId (used in cascade delete).
 */
export async function deleteSalesByBarberIdLocal(barberId) {
  if (!barberId) return;
  try {
    await localDb.sales.where("barberId").equals(String(barberId)).delete();
  } catch (err) {
    console.error("Dexie deleteSalesByBarberIdLocal error:", err);
  }
}

/**
 * Delete all sales for a given barbershopId (used in cascade delete).
 */
export async function deleteSalesByBarbershopIdLocal(barbershopId) {
  if (!barbershopId) return;
  try {
    await localDb.sales
      .where("barbershopId")
      .equals(String(barbershopId))
      .delete();
  } catch (err) {
    console.error("Dexie deleteSalesByBarbershopIdLocal error:", err);
  }
}

/**
 * Get a sync metadata value (e.g., 'sales_lastSyncTime').
 */
export async function getSyncMeta(key) {
  try {
    const entry = await localDb.syncMeta.get(key);
    return entry?.value ?? null;
  } catch (err) {
    console.error("Dexie getSyncMeta error:", err);
    return null;
  }
}

/**
 * Set a sync metadata value.
 */
export async function setSyncMeta(key, value) {
  try {
    await localDb.syncMeta.put({ key, value });
  } catch (err) {
    console.error("Dexie setSyncMeta error:", err);
  }
}

