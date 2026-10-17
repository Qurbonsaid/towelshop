import React, { useState } from "react";
import { Bell, BellRing } from "./icons";
import { uz } from "../i18n/uz";
import {
  registerFcmForAdmin,
  triggerLocalTestNotification,
} from "../services/fcmService";

export function AdminPushBanner({ adminUid }) {
  const [permission, setPermission] = useState(() =>
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported",
  );
  const [loading, setLoading] = useState(false);

  const handleEnablePush = async () => {
    setLoading(true);
    await registerFcmForAdmin(adminUid);
    await triggerLocalTestNotification();
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
    setLoading(false);
  };

  if (permission === "granted") {
    return null; // Don't show the banner if permission is already granted
  }

  if (permission === "denied") {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <Bell size={16} />
        </div>
        <p className="flex-1">
          {uz.fcm.statusDenied}. Brauzer sozlamalaridan bildirishnomalarga
          ruxsat bering.
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
          <BellRing size={18} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-slate-900">
            {uz.fcm.bannerTitle}
          </h4>
          <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
            {uz.fcm.bannerText}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleEnablePush}
              disabled={loading}
              type="button"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-95 disabled:opacity-60"
            >
              <Bell size={14} />
              {loading ? uz.common.loading : uz.fcm.enableBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
