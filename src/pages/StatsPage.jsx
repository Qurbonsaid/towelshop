import React, { useMemo, useState } from "react";
import { AdminPushBanner } from "../components/AdminPushBanner";
import { AdminStatsCards } from "../components/AdminStatsCards";
import {
  Calendar,
  CheckCircle2,
  DollarSign,
  Package,
} from "../components/icons";
import { ROLES } from "../constants/roles";
import { useHeader } from "../context/HeaderContext";
import { uz } from "../i18n/uz";
import {
  closeDailyReport,
  getTodayDateString,
} from "../services/firestoreService";
import { notifyAdminSafe } from "../services/pushService";

export function StatsPage({
  role,
  userId,
  userProfile,
  sales = [],
  barbers = [],
  returns = [],
  dailyReports = [],
}) {
  const isStaff = role === ROLES.STAFF;
  const todayStr = useMemo(() => getTodayDateString(), []);
  const [successToast, setSuccessToast] = useState(null);
  const [submittingHandover, setSubmittingHandover] = useState(false);

  useHeader(
    {
      title: isStaff ? "Kunlik hisobot" : uz.nav.stats,
      subtitle: isStaff
        ? `${userProfile?.name || "Xodim"} • ${todayStr}`
        : "Moliyaviy va tovar hisobotlari",
      showBack: false,
    },
    [isStaff, userProfile?.name, todayStr],
  );

  // Driver Today Data for Staff Role
  const staffTodayStats = useMemo(() => {
    if (!isStaff || !userId) return null;

    const mySalesToday = sales.filter((s) => {
      if (s.staffId !== userId) return false;
      if (s.date === todayStr) return true;
      if (s.createdAt) {
        const sDate = s.createdAt.toDate
          ? s.createdAt.toDate()
          : new Date(s.createdAt);
        return getTodayDateString(sDate) === todayStr;
      }
      return false;
    });

    const cashAmount = mySalesToday.reduce(
      (sum, s) => sum + (Number(s.cashAmount) || 0),
      0,
    );
    const cardAmount = mySalesToday.reduce(
      (sum, s) => sum + (Number(s.cardAmount) || 0),
      0,
    );
    const discount = mySalesToday.reduce(
      (sum, s) => sum + (Number(s.discount) || 0),
      0,
    );
    const totalPaid = cashAmount + cardAmount;

    const deliveredTowels = mySalesToday.reduce(
      (sum, s) => sum + (Number(s.quantityDelivered) || 0),
      0,
    );
    const returnedTowels = mySalesToday.reduce(
      (sum, s) => sum + (Number(s.returnedTowels) || 0),
      0,
    );

    const report = dailyReports.find(
      (r) => r.staffId === userId && r.date === todayStr,
    );
    const isClosed = report?.status === "closed";

    return {
      cashAmount,
      cardAmount,
      discount,
      totalPaid,
      deliveredTowels,
      returnedTowels,
      salesCount: mySalesToday.length,
      isClosed,
      reportId: report?.id || `${userId}_${todayStr}`,
      recentSales: mySalesToday,
    };
  }, [isStaff, userId, sales, dailyReports, todayStr]);

  // Admin Circulation Calculations
  const circulation = useMemo(() => {
    let totalDelivered = 0;
    let totalReturned = 0;

    sales.forEach((s) => {
      totalDelivered += Number(s.quantityDelivered) || 0;
    });

    returns.forEach((r) => {
      totalReturned += Number(r.returnedTowels) || 0;
    });

    const initialTowels = barbers.reduce(
      (sum, barber) => sum + (Number(barber.initialTowels) || 0),
      0,
    );
    const heldByClients = Math.max(
      0,
      initialTowels + totalDelivered - totalReturned,
    );

    return {
      totalDelivered,
      totalReturned,
      heldByClients,
    };
  }, [sales, returns, barbers]);

  // Handle Driver Handover / Submit daily report
  const handleDriverHandover = async () => {
    if (!staffTodayStats) return;
    setSubmittingHandover(true);
    try {
      await closeDailyReport(staffTodayStats.reportId);

      // Trigger push notification to admins
      const staffName = userProfile?.name || "Haydovchi/Xodim";
      notifyAdminSafe(
        uz.notifications.titles.handover,
        uz.notifications.pushHandover(
          staffName,
          staffTodayStats.totalPaid,
          staffTodayStats.cashAmount,
          staffTodayStats.cardAmount,
        ),
      );

      setSuccessToast("Kunlik kassa muvaffaqiyatli topshirildi va yopildi!");
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      console.error("Handover error:", err);
      alert(uz.common.error);
    } finally {
      setSubmittingHandover(false);
    }
  };

  // Staff Driver View
  if (isStaff && staffTodayStats) {
    return (
      <div className="space-y-4 pb-8">
        {successToast && (
          <div className="fixed top-16 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-emerald-300 bg-white px-4 py-2.5 shadow-xl animate-in slide-in-from-top-2 duration-150 flex items-center gap-2 text-xs font-bold text-emerald-800">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Daily Status Banner */}
        <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-600 to-emerald-700 p-4 text-white shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wide">
                Bugungi Kassa Hisoboti
              </span>
              <h2 className="text-xl font-black mt-0.5">
                {staffTodayStats.totalPaid.toLocaleString()} {uz.common.sum}
              </h2>
              <p className="text-xs text-emerald-100 mt-1 flex items-center gap-1.5">
                <Calendar size={13} />
                <span>{todayStr}</span>
                <span>•</span>
                <span>{staffTodayStats.salesCount} ta yetkazuv</span>
              </p>
            </div>

            <div className="rounded-xl bg-white/20 p-2">
              <DollarSign size={24} className="text-white" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-500/50 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-100">
              Kassa holati:
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                staffTodayStats.isClosed
                  ? "bg-white text-emerald-800"
                  : "bg-amber-400 text-amber-950"
              }`}
            >
              {staffTodayStats.isClosed ? "Kassa topshirilgan" : "Faol kassa"}
            </span>
          </div>
        </div>

        {/* 3 Main Revenue Cards: Cash, Click, Discount */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-center">
            <span className="block text-[10px] text-emerald-800 font-bold">
              Qo'ldagi Naqd
            </span>
            <span className="text-base font-extrabold text-emerald-950 block mt-0.5 truncate">
              {staffTodayStats.cashAmount.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-700">so'm</span>
          </div>

          <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-3 text-center">
            <span className="block text-[10px] text-sky-800 font-bold">
              Click / Karta
            </span>
            <span className="text-base font-extrabold text-sky-950 block mt-0.5 truncate">
              {staffTodayStats.cardAmount.toLocaleString()}
            </span>
            <span className="text-[10px] text-sky-700">so'm</span>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-center">
            <span className="block text-[10px] text-amber-900 font-bold">
              Chegirmalar
            </span>
            <span className="text-base font-extrabold text-amber-950 block mt-0.5 truncate">
              {staffTodayStats.discount.toLocaleString()}
            </span>
            <span className="text-[10px] text-amber-700">so'm</span>
          </div>
        </div>

        {/* Towels Movement Today */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Package size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Bugungi sochiqlar oqimi
              </h3>
              <p className="text-[11px] text-slate-500">
                Topshirilgan va qaytarib olingan sochiqlar
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1 text-center">
            <div className="rounded-xl bg-emerald-50/80 p-3 border border-emerald-100">
              <span className="block text-[10px] text-emerald-700 font-bold">
                Mijozlarga berildi
              </span>
              <span className="text-lg font-extrabold text-emerald-950 block mt-0.5">
                {staffTodayStats.deliveredTowels}
              </span>
              <span className="text-[10px] text-emerald-600">dona sochiq</span>
            </div>

            <div className="rounded-xl bg-sky-50/80 p-3 border border-sky-100">
              <span className="block text-[10px] text-sky-700 font-bold">
                Qaytarib olindi
              </span>
              <span className="text-lg font-extrabold text-sky-950 block mt-0.5">
                {staffTodayStats.returnedTowels}
              </span>
              <span className="text-[10px] text-sky-600">dona sochiq</span>
            </div>
          </div>
        </div>

        {/* Handover / Close Day Action */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          {staffTodayStats.isClosed ? (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
              <CheckCircle2 size={18} />
              <span>
                Bugungi hisobot adminga topshirilgan va kassa yopilgan.
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-600">
                Ish kuni yakunida kassadagi naqd pulni adminga topshirish uchun
                quyidagi tugmani bosing:
              </p>
              <button
                type="button"
                disabled={submittingHandover}
                onClick={handleDriverHandover}
                className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <CheckCircle2 size={16} />
                <span>
                  {submittingHandover
                    ? uz.common.loading
                    : `Kassani topshirish (${staffTodayStats.cashAmount.toLocaleString()} so'm)`}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Today's Transactions Timeline */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
          <h4 className="text-xs font-bold text-slate-900">
            Bugungi amallar tarixi ({staffTodayStats.recentSales.length})
          </h4>

          {staffTodayStats.recentSales.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              Bugun hali savdo yoki to'lov qayd etilmagan
            </p>
          ) : (
            <div className="space-y-2">
              {staffTodayStats.recentSales.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl bg-slate-50 p-3 border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{s.barberName}</p>
                    <p className="text-[11px] text-slate-500">
                      {s.barbershopName}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      {Number(s.quantityDelivered) > 0 && (
                        <span className="text-emerald-700 font-semibold">
                          +{s.quantityDelivered} dona berildi
                        </span>
                      )}
                      {Number(s.returnedTowels) > 0 && (
                        <span className="text-sky-700 font-semibold">
                          -{s.returnedTowels} dona olindi
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    {Number(s.totalPaid) > 0 ? (
                      <span className="font-bold text-emerald-700 block">
                        +{Number(s.totalPaid).toLocaleString()} so'm
                      </span>
                    ) : (
                      <span className="text-slate-400 block">-</span>
                    )}
                    {(Number(s.cashAmount) > 0 || Number(s.cardAmount) > 0) && (
                      <span className="text-[10px] text-slate-500 block">
                        {Number(s.cashAmount) > 0 &&
                          `Naqd: ${Number(s.cashAmount).toLocaleString()}`}
                        {Number(s.cashAmount) > 0 &&
                          Number(s.cardAmount) > 0 &&
                          " | "}
                        {Number(s.cardAmount) > 0 &&
                          `Click: ${Number(s.cardAmount).toLocaleString()}`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin View
  return (
    <div className="space-y-4 pb-6">
      {/* FCM Push Notification Banner */}
      <AdminPushBanner />

      {/* Main Financial Stats Cards */}
      <AdminStatsCards sales={sales} barbers={barbers} />

      {/* Towel Circulation Balance Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <Package size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Sochiqlar aylanmasi balansi
            </h3>
            <p className="text-[11px] text-slate-500">
              Tizimdagi toza va ishlatilgan sochiqlar oqimi
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 pt-1 text-center">
          <div className="rounded-xl bg-emerald-50/80 p-2.5 border border-emerald-100">
            <span className="block text-[10px] text-emerald-700 font-bold">
              Yetkazilgan
            </span>
            <span className="text-base font-extrabold text-emerald-950 block mt-0.5">
              {circulation.totalDelivered}
            </span>
            <span className="text-[10px] text-emerald-600">dona</span>
          </div>

          <div className="rounded-xl bg-sky-50/80 p-2.5 border border-sky-100">
            <span className="block text-[10px] text-sky-700 font-bold">
              Qaytarilgan
            </span>
            <span className="text-base font-extrabold text-sky-950 block mt-0.5">
              {circulation.totalReturned}
            </span>
            <span className="text-[10px] text-sky-600">dona</span>
          </div>

          <div className="rounded-xl bg-amber-50/80 p-2.5 border border-amber-100">
            <span className="block text-[10px] text-amber-800 font-bold">
              Band sochiq
            </span>
            <span className="text-base font-extrabold text-amber-950 block mt-0.5">
              {circulation.heldByClients}
            </span>
            <span className="text-[10px] text-amber-700">dona</span>
          </div>
        </div>
      </div>
    </div>
  );
}
