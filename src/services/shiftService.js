import {
  collection,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { COLLECTIONS } from "../constants/models";

/**
 * Returns the business shift date formatted as YYYY-MM-DD in Asia/Tashkent (GMT+5).
 * The business day cutoff is 03:00 AM:
 * - From 03:00:00 AM on Day X until 02:59:59 AM on Day X+1 belongs to Day X.
 * - If current time is between 00:00:00 and 02:59:59 AM, it is treated as part of Day X-1.
 *
 * @param {Date|string|number} d - Input date or timestamp
 * @returns {string} YYYY-MM-DD
 */
export function getBusinessDateString(d = new Date()) {
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    return d;
  }

  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return "";

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type) =>
    Number(parts.find((p) => p.type === type)?.value || 0);

  let year = getPart("year");
  let month = getPart("month");
  let day = getPart("day");
  let hour = getPart("hour");
  if (hour === 24) hour = 0;

  // Before 03:00 AM Tashkent time, the shift belongs to previous day
  if (hour < 3) {
    const prevDate = new Date(Date.UTC(year, month - 1, day - 1));
    year = prevDate.getUTCFullYear();
    month = prevDate.getUTCMonth() + 1;
    day = prevDate.getUTCDate();
  }

  const yyyy = String(year);
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Calculates remaining milliseconds until the next 03:00:00 AM in Asia/Tashkent (UTC+5).
 * 03:00 AM Tashkent is 22:00:00.000 UTC of the previous calendar day.
 */
export function getMsUntilNextTashkent3AM(now = new Date()) {
  const currentUtcMillis = now.getTime();

  // 3:00 AM in Tashkent (UTC+5) is 22:00:00.000 UTC
  const targetUtc = new Date(now);
  targetUtc.setUTCHours(22, 0, 0, 0);

  // If 22:00 UTC has already passed today, the next 3:00 AM Tashkent is tomorrow's 22:00 UTC
  if (targetUtc.getTime() <= currentUtcMillis) {
    targetUtc.setUTCDate(targetUtc.getUTCDate() + 1);
  }

  return targetUtc.getTime() - currentUtcMillis;
}

/**
 * Closes all active daily reports whose date is earlier than the current business shift date.
 * Guarantees that at 03:00 AM (or whenever app is opened next day), past shifts are
 * marked as "closed" without requiring manual action by Admin or Driver.
 *
 * @returns {Promise<number>} Number of reports closed
 */
export async function autoClosePastDailyReports() {
  try {
    const currentBusinessDate = getBusinessDateString();

    const q = query(
      collection(db, COLLECTIONS.DAILY_REPORTS),
      where("status", "==", "active")
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return 0;

    let closedCount = 0;
    for (const docItem of snapshot.docs) {
      const data = docItem.data();
      // If the report belongs to an older shift (date < currentBusinessDate), close it automatically
      if (data.date && data.date < currentBusinessDate) {
        await updateDoc(docItem.ref, {
          status: "closed",
          closingNote:
            data.closingNote ||
            "Tizim tomonidan avtomatik yopildi (03:00 Asia/Tashkent)",
          closedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        closedCount++;
      }
    }

    if (closedCount > 0) {
      console.log(
        `[ShiftService] ${closedCount} ta o'tgan kungi faol kassa soat 03:00 qoidasi bo'yicha avtomatik yopildi.`
      );
    }
    return closedCount;
  } catch (err) {
    console.error("[ShiftService] autoClosePastDailyReports error:", err);
    return 0;
  }
}

/**
 * Starts the autonomous scheduler:
 * 1. Checks and closes stale past shifts immediately on startup.
 * 2. Sets a timeout targeting the exact 03:00:00 AM Tashkent moment.
 * 3. Keeps a periodic interval (every 5 mins) to handle device wakeups / backgrounding.
 *
 * @returns {Function} Stop scheduler callback
 */
export function startAutoCloseScheduler() {
  let timerId = null;
  let intervalId = null;
  let isRunning = false;

  const runSafeCheck = async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      await autoClosePastDailyReports();
    } finally {
      isRunning = false;
    }
  };

  const scheduleNext3AM = () => {
    const msUntil3AM = getMsUntilNextTashkent3AM();
    timerId = setTimeout(async () => {
      await runSafeCheck();
      scheduleNext3AM();
    }, msUntil3AM);
  };

  // 1. Initial check on startup
  runSafeCheck();

  // 2. Exact 03:00 AM schedule
  scheduleNext3AM();

  // 3. Periodic safeguard check (every 5 minutes)
  intervalId = setInterval(runSafeCheck, 5 * 60 * 1000);

  return () => {
    if (timerId) clearTimeout(timerId);
    if (intervalId) clearInterval(intervalId);
  };
}
