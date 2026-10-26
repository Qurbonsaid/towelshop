import { auth, db } from "../config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

// Cache admin FCM tokens in memory for 10 minutes to avoid querying Firestore
// on every rapid sale submission.
const ADMIN_TOKENS_TTL_MS = 10 * 60 * 1000;
let cachedAdminTokens = null;
let cachedAdminTokensAt = 0;

async function getAdminFcmTokens() {
  const now = Date.now();
  if (cachedAdminTokens && now - cachedAdminTokensAt < ADMIN_TOKENS_TTL_MS) {
    return cachedAdminTokens;
  }

  const adminsQuery = query(
    collection(db, "users"),
    where("role", "==", "admin")
  );
  const querySnapshot = await getDocs(adminsQuery);
  const targetTokens = [];

  querySnapshot.forEach((docSnap) => {
    const userData = docSnap.data();
    if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
      targetTokens.push(...userData.fcmTokens);
    } else if (userData.fcmToken) {
      targetTokens.push(userData.fcmToken);
    }
  });

  cachedAdminTokens = [...new Set(targetTokens)];
  cachedAdminTokensAt = now;
  return cachedAdminTokens;
}

export async function sendAdminPushNotification(titleOrPayload, bodyArg) {
  try {
    const title =
      typeof titleOrPayload === "object" && titleOrPayload !== null
        ? titleOrPayload.title
        : titleOrPayload;
    const body =
      typeof titleOrPayload === "object" && titleOrPayload !== null
        ? titleOrPayload.body
        : bodyArg;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, skipped: true, message: "No authenticated user" };
    }

    const uniqueTokens = await getAdminFcmTokens();

    if (uniqueTokens.length === 0) {
      return { success: true, skipped: true, message: "No tokens found" };
    }

    const idToken = await currentUser.getIdToken();

    const response = await fetch(
      "https://towelshop.kuzatuvchi-my.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          tokens: uniqueTokens,
          title,
          body,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to dispatch push notification.");
    }
    return data;
  } catch (err) {
    console.error("Error triggering push notification:", err);
    throw err;
  }
}

/**
 * Safe wrapper for staff actions - ensures failed pushes never break the user flow
 */
export async function notifyAdminSafe(titleOrPayload, bodyArg) {
  try {
    return await sendAdminPushNotification(titleOrPayload, bodyArg);
  } catch (err) {
    console.warn("Non-blocking push notification error:", err?.message || err);
    return { success: false, error: err?.message || "Push failed" };
  }
}
