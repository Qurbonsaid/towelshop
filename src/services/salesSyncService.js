import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { COLLECTIONS } from "../constants/models";
import {
  bulkUpsertSalesLocal,
  deleteSaleLocal,
  getAllSalesLocal,
  getSyncMeta,
  localDb,
  setSyncMeta,
  upsertSaleLocal,
} from "./localDb";

const SYNC_CHANNEL_NAME = "towelshop_sales_sync";
const SYNC_KEY_LAST_TIME = "sales_lastSyncTime";

// Cross-tab broadcast channel for immediate multi-tab sync without Firestore reads
let broadcastChannel = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  } catch {
    broadcastChannel = null;
  }
}

// Active subscribers listening for sales updates
const subscribers = new Set();
let isSyncing = false;
let liveUnsubscribe = null;
let syncEngineStarted = false;

/**
 * Notifies all active React subscribers with the full, chronologically sorted
 * sales array from Dexie.
 */
export async function broadcastLocalSales() {
  const allSales = await getAllSalesLocal();
  subscribers.forEach((cb) => {
    try {
      cb(allSales);
    } catch (err) {
      console.error("Subscriber callback error:", err);
    }
  });
}

/**
 * Posts update to other browser tabs so open tabs update in real-time
 * without needing additional Firestore reads.
 */
export function notifyOtherTabs() {
  try {
    broadcastChannel?.postMessage({
      type: "SALES_UPDATED",
      timestamp: Date.now(),
    });
  } catch {
    // Ignore BroadcastChannel errors
  }
}

// Listen for updates from other open browser tabs
if (broadcastChannel) {
  broadcastChannel.onmessage = async (event) => {
    if (event.data?.type === "SALES_UPDATED") {
      await broadcastLocalSales();
    }
  };
}

/**
 * Normalizes a raw Firestore sale doc (consistent with normalizeSaleDoc in firestoreService).
 */
export function normalizeSaleDoc(docItem) {
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
 * Performs Delta Sync:
 * 1. Checks local Dexie count and lastSyncTime.
 * 2. If COLD START (empty Dexie or no lastSyncTime):
 *    Fetches all sales from Firestore once and seeds Dexie.
 * 3. If WARM START:
 *    Queries Firestore ONLY for documents with updatedAt >= (lastSyncTime - 60000).
 *    Consumes reads ONLY for newly added or edited documents (99% quota saved).
 */
export async function performDeltaSync() {
  if (isSyncing) return;
  isSyncing = true;

  try {
    const localCount = await localDb.sales.count();
    const lastSyncTime = await getSyncMeta(SYNC_KEY_LAST_TIME);

    // 1. COLD START: Paginate in batches of 500 documents
    // This avoids network timeouts, protects browser RAM, and renders the first 500 docs immediately
    if (localCount === 0 || !lastSyncTime) {
      const CHUNK_SIZE = 500;
      let lastDoc = null;
      let hasMore = true;
      let maxTime = 0;

      while (hasMore) {
        const q = lastDoc
          ? query(
              collection(db, COLLECTIONS.SALES),
              orderBy("createdAt", "desc"),
              startAfter(lastDoc),
              limit(CHUNK_SIZE)
            )
          : query(
              collection(db, COLLECTIONS.SALES),
              orderBy("createdAt", "desc"),
              limit(CHUNK_SIZE)
            );

        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          hasMore = false;
          break;
        }

        const sales = snapshot.docs.map(normalizeSaleDoc);
        await bulkUpsertSalesLocal(sales);

        sales.forEach((s) => {
          const t = s.updatedAt?.toMillis
            ? s.updatedAt.toMillis()
            : s.createdAt?.toMillis
              ? s.createdAt.toMillis()
              : 0;
          if (t > maxTime) maxTime = t;
        });

        // Broadcast each batch immediately so UI loads without waiting for all historical batches
        await broadcastLocalSales();
        notifyOtherTabs();

        if (snapshot.docs.length < CHUNK_SIZE) {
          hasMore = false;
        } else {
          lastDoc = snapshot.docs[snapshot.docs.length - 1];
        }
      }

      await setSyncMeta(SYNC_KEY_LAST_TIME, maxTime || Date.now());
      return;
    }

    // 2. WARM START: Delta query (only documents modified since last sync)
    // 60-second buffer guards against clock drift between server and client
    const syncFromTime = new Date(Math.max(0, Number(lastSyncTime) - 60000));
    const deltaQuery = query(
      collection(db, COLLECTIONS.SALES),
      where("updatedAt", ">=", syncFromTime)
    );

    const deltaSnapshot = await getDocs(deltaQuery);

    if (!deltaSnapshot.empty) {
      const updatedSales = deltaSnapshot.docs.map(normalizeSaleDoc);
      await bulkUpsertSalesLocal(updatedSales);

      let maxTime = Number(lastSyncTime);
      updatedSales.forEach((s) => {
        const t = s.updatedAt?.toMillis ? s.updatedAt.toMillis() : Date.now();
        if (t > maxTime) maxTime = t;
      });

      await setSyncMeta(SYNC_KEY_LAST_TIME, Math.max(maxTime, Date.now()));
      await broadcastLocalSales();
      notifyOtherTabs();
    } else {
      // No new sales, advance sync pointer to now
      await setSyncMeta(SYNC_KEY_LAST_TIME, Date.now());
    }
  } catch (err) {
    // If offline or network unavailable, continue safely using Dexie cache
    console.warn(
      "Sales delta-sync notice (serving from offline Dexie cache):",
      err?.message || err
    );
  } finally {
    isSyncing = false;
  }
}

/**
 * Sets up live real-time listener for ongoing changes during the current active session.
 * Uses bounded query on recent updatedAt to minimize Firestore read quota consumption.
 */
function startLiveSessionListener() {
  if (liveUnsubscribe) return;

  try {
    // Listen to changes occurring from 1 minute before session start
    const liveStartTime = new Date(Date.now() - 60000);
    const liveQuery = query(
      collection(db, COLLECTIONS.SALES),
      where("updatedAt", ">=", liveStartTime)
    );

    liveUnsubscribe = onSnapshot(
      liveQuery,
      async (snapshot) => {
        let hasChanges = false;
        for (const change of snapshot.docChanges()) {
          const docItem = change.doc;
          if (change.type === "added" || change.type === "modified") {
            const normalized = normalizeSaleDoc(docItem);
            await upsertSaleLocal(normalized);
            hasChanges = true;
          } else if (change.type === "removed") {
            await deleteSaleLocal(docItem.id);
            hasChanges = true;
          }
        }

        if (hasChanges) {
          await setSyncMeta(SYNC_KEY_LAST_TIME, Date.now());
          await broadcastLocalSales();
          notifyOtherTabs();
        }
      },
      (err) => {
        console.warn("Live sales listener notice:", err?.message || err);
      }
    );
  } catch (err) {
    console.warn("Could not start live sales listener:", err);
  }
}

/**
 * Subscribes to sales using Dexie Delta-Sync.
 *
 * Guaranteed Behavior:
 * 1. Emits cached sales instantly from IndexedDB (0ms latency, 0 reads).
 * 2. Runs background delta sync (only reads changed documents).
 * 3. Listens for live updates during the session.
 * 4. Cross-tab synchronization via BroadcastChannel.
 *
 * @param {Function} callback - (sales: Array) => void
 * @returns {Function} unsubscribe
 */
export function subscribeSalesWithSync(callback) {
  subscribers.add(callback);

  // 1. Immediately emit current local Dexie cache (0ms latency, 0 Firestore reads)
  getAllSalesLocal().then((cached) => {
    if (cached && cached.length > 0) {
      callback(cached);
    }
  });

  // 2. Initialize sync engine once
  if (!syncEngineStarted) {
    syncEngineStarted = true;

    performDeltaSync()
      .catch((e) => console.warn("Initial delta sync error:", e))
      .finally(() => {
        startLiveSessionListener();
      });
  }

  // Return unsubscribe handler
  return () => {
    subscribers.delete(callback);
    if (subscribers.size === 0 && liveUnsubscribe) {
      liveUnsubscribe();
      liveUnsubscribe = null;
      syncEngineStarted = false;
    }
  };
}
