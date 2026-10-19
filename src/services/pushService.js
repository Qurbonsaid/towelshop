import { auth, db } from "../config/firebase"; // Adjust to your Firebase config path
import { collection, query, where, getDocs } from "firebase/firestore";

export async function sendAdminPushNotification(title, body) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("No authenticated user found for sending push notification.");
      return { success: false, skipped: true, message: "No authenticated user" };
    }

    // Fetch admin tokens dynamically from Firestore
    const adminsQuery = query(
      collection(db, "users"),
      where("role", "==", "admin")
    );

    const querySnapshot = await getDocs(adminsQuery);
    const targetTokens = [];

    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
        targetTokens.push(...userData.fcmTokens);
      } else if (userData.fcmToken) {
        targetTokens.push(userData.fcmToken);
      }
    });

    const uniqueTokens = [...new Set(targetTokens)];

    // Gracefully exit without throwing an error if zero tokens exist
    if (uniqueTokens.length === 0) {
      console.warn(
        "No active admin FCM tokens found in Firestore. Skipping notification."
      );
      return { success: true, skipped: true, message: "No tokens found" };
    }

    // Retrieve the short-lived Firebase ID token
    const idToken = await currentUser.getIdToken();

    // Dispatch request to Cloudflare Worker
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
          title: title,
          body: body,
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
export async function notifyAdminSafe(title, body) {
  try {
    return await sendAdminPushNotification(title, body);
  } catch (err) {
    console.warn("Non-blocking push notification error:", err?.message || err);
    return { success: false, error: err?.message || "Push failed" };
  }
}
