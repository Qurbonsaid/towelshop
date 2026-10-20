import React, { useMemo, useState } from "react";
import { AdminPushBanner } from "../components/AdminPushBanner";
import { AdminStatsCards } from "../components/AdminStatsCards";
import {
  CheckCircle2,
  Clock,
  Package,
  Plus,
  Truck,
  X,
} from "../components/icons";
import { ROLES } from "../constants/roles";
import { useHeader } from "../context/HeaderContext";
import { uz } from "../i18n/uz";
import {
  closeDailyReport,
  getTodayDateString,
  recordWarehouseLoad,
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

  // Modals for Staff Driver
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [warehouseCount, setWarehouseCount] = useState("");
  const [warehouseNote, setWarehouseNote] = useState("");
  const [submittingWarehouse, setSubmittingWarehouse] = useState(false);

  const [isCloseDayModalOpen, setIsCloseDayModalOpen] = useState(false);
  const [unsoldTowelsInput, setUnsoldTowelsInput] = useState("");
  const [closeNoteInput, setCloseNoteInput] = useState("");
  const [submittingCloseDay, setSubmittingCloseDay] = useState(false);

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

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

    const totalLoadedFromWarehouse = Number(report?.totalLoadedFromWarehouse || 0);
    const warehouseLoads = Array.isArray(report?.warehouseLoads)
      ? report.warehouseLoads
      : [];
    const unsoldTowelsReturned = Number(report?.unsoldTowelsReturned || 0);

    // Current stock calculation
    const currentStock = report?.currentStock !== undefined
      ? Number(report.currentStock)
      : Math.max(0, totalLoadedFromWarehouse - deliveredTowels - unsoldTowelsReturned);

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
      warehouseLoads,
      totalLoadedFromWarehouse,
      currentStock,
      unsoldTowelsReturned,
      recentSales: mySalesToday,
    };
  }, [isStaff, userId, sales, dailyReports, todayStr]);

  // Admin Circulation Calculations (using live towelsCount from barbers)
  const circulation = useMemo(() => {
    let totalDelivered = 0;
    let totalReturned = 0;

    sales.forEach((s) => {
      totalDelivered += Number(s.quantityDelivered) || 0;
    });

    returns.forEach((r) => {
      totalReturned += Number(r.returnedTowels) || 0;
    });

    const heldByClients = barbers.reduce(
      (sum, barber) =>
        sum +
        Number(
          barber.towelsCount !== undefined
            ? barber.towelsCount
            : barber.initialTowels || 0,
        ),
      0,
    );

    return {
      totalDelivered,
      totalReturned,
      heldByClients,
    };
  }, [sales, returns, barbers]);

  // Handle Record Warehouse Load
  const handleRecordWarehouseLoad = async (e) => {
    e.preventDefault();
    const count = Number(warehouseCount) || 0;
    if (count <= 0) return;

    setSubmittingWarehouse(true);
    try {
      await recordWarehouseLoad({
        staffId: userId,
        staffName: userProfile?.name || "Xodim",
        count,
        note: warehouseNote,
      });

      // Notify admin
      const staffName = userProfile?.name || "Haydovchi";
      notifyAdminSafe(
        "Ombordan sochiq olindi",
        `${staffName} ombordan ${count} dona sochiq olib ketdi.`
      );

      setWarehouseCount("");
      setWarehouseNote("");
      setIsWarehouseModalOpen(false);
      showToast(`${count} dona sochiq ombordan olindi deb qayd etildi!`);
    } catch (err) {
      console.error("Warehouse load error:", err);
      alert(uz.common.error);
    } finally {
      setSubmittingWarehouse(false);
    }
  };

  // Open Close Day Modal
  const handleOpenCloseDayModal = () => {
    // Pre-fill with current calculated stock in car
    setUnsoldTowelsInput(String(staffTodayStats?.currentStock || 0));
    setCloseNoteInput("");
    setIsCloseDayModalOpen(true);
  };

  // Submit Close Day
  const handleConfirmCloseDay = async (e) => {
    e.preventDefault();
    if (!staffTodayStats) return;

    setSubmittingCloseDay(true);
    const unsold = Number(unsoldTowelsInput) || 0;
    try {
      await closeDailyReport(staffTodayStats.reportId, {
        unsoldTowelsReturned: unsold,
        note: closeNoteInput,
      });

      const staffName = userProfile?.name || "Haydovchi";
      notifyAdminSafe(
        "Kunlik hisobot topshirildi",
        `${staffName} ishni yakunladi. Naqd: ${staffTodayStats.cashAmount.toLocaleString()} so'm, Qaytarilgan sochiq: ${unsold} dona.`
      );

      setIsCloseDayModalOpen(false);
      showToast("Kunlik hisobot muvaffaqiyatli topshirildi va yopildi!");
    } catch (err) {
      console.error("Close day error:", err);
      alert(uz.common.error);
    } finally {
      setSubmittingCloseDay(false);
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

        {/* 1. HERO INVENTORY CARD: Current Stock in Vehicle */}
        <div className="rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-600 to-emerald-800 p-4 text-white shadow-md space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wide flex items-center gap-1.5">
                <Truck size={14} />
                <span>Mashinada sotish uchun mavjud sochiqlar</span>
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black tracking-tight">
                  {staffTodayStats.currentStock}
                </span>
                <span className="text-sm font-semibold text-emerald-100">
                  dona yangi sochiq
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsWarehouseModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-emerald-800 shadow-xs hover:bg-emerald-50 active:scale-95 transition-all"
            >
              <Plus size={15} />
              <span>Ombordan olish</span>
            </button>
          </div>

          {/* Quick Flow breakdown */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-500/50 text-center text-[11px]">
            <div>
              <span className="text-emerald-200 block">Ombordan olindi:</span>
              <span className="font-bold text-white text-sm">
                {staffTodayStats.totalLoadedFromWarehouse} dona
              </span>
            </div>
            <div>
              <span className="text-emerald-200 block">Sartaroshlarga berildi:</span>
              <span className="font-bold text-white text-sm">
                {staffTodayStats.deliveredTowels} dona
              </span>
            </div>
            <div>
              <span className="text-emerald-200 block">Qaytarib olindi:</span>
              <span className="font-bold text-white text-sm">
                {staffTodayStats.returnedTowels} dona
              </span>
            </div>
          </div>
        </div>

        {/* 2. REVENUE METRICS: Cash, Click, Discount */}
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

        {/* 3. WAREHOUSE PICKUPS TIMELINE (Qachon nechta olingan) */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <Package size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Ombordan olingan sochiqlar
                </h3>
                <p className="text-[11px] text-slate-500">
                  Bugungi kun davomida yuklanganlar tarixi
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsWarehouseModalOpen(true)}
              className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 active:scale-95"
            >
              + Qo'shish
            </button>
          </div>

          {staffTodayStats.warehouseLoads.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-400">
              Bugun hali ombordan sochiq olinmadi. "Ombordan olish" tugmasi orqali kiriting.
            </div>
          ) : (
            <div className="space-y-2">
              {staffTodayStats.warehouseLoads.map((load, idx) => (
                <div
                  key={load.id || idx}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs border border-slate-100"
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600 border border-slate-200">
                      <Clock size={11} />
                      {load.time}
                    </span>
                    <span className="font-medium text-slate-700">{load.note}</span>
                  </div>
                  <span className="font-bold text-emerald-700 text-sm">
                    +{load.count} dona
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. END OF DAY CLOSING SECTION (Ish yakuni va sotilmay qolganlar) */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          {staffTodayStats.isClosed ? (
            <div className="space-y-2 rounded-xl bg-emerald-50 p-3.5 border border-emerald-200 text-xs">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <span>Bugungi kun yakunlandi va hisobot adminga topshirildi.</span>
              </div>
              <div className="pt-2 border-t border-emerald-200/70 text-[11px] text-emerald-900 space-y-1">
                <p>
                  • Sotilmay omborga qaytarilgan yangi sochiqlar: <strong>{staffTodayStats.unsoldTowelsReturned} dona</strong>
                </p>
                <p>
                  • Topshirilgan kassa naqdi: <strong>{staffTodayStats.cashAmount.toLocaleString()} so'm</strong>
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Ish yakunida kunni yopish</h4>
                <p className="text-xs text-slate-500">
                  Ish kuni tugaganda omborga qaytgan yangi sochiqlar va kassani adminga topshiring
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenCloseDayModal}
                className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} />
                <span>Kunni yakunlash va hisobotni saqlash</span>
              </button>
            </div>
          )}
        </div>

        {/* 5. TODAY'S TRANSACTIONS TIMELINE */}
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
                    <p className="text-[11px] text-slate-500">{s.barbershopName}</p>
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

        {/* MODAL: Record Warehouse Load */}
        {isWarehouseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <Truck size={18} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Ombordan sochiq olish
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWarehouseModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleRecordWarehouseLoad} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Olingan yangi sochiqlar soni (dona) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    autoFocus
                    value={warehouseCount}
                    onChange={(e) => setWarehouseCount(e.target.value)}
                    placeholder="Masalan: 200"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-base font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Izoh (ixtiyoriy)
                  </label>
                  <input
                    type="text"
                    value={warehouseNote}
                    onChange={(e) => setWarehouseNote(e.target.value)}
                    placeholder="Masalan: Ertalabki yuklash"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsWarehouseModalOpen(false)}
                    className="rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {uz.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingWarehouse || !warehouseCount}
                    className="rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {submittingWarehouse ? uz.common.loading : "Saqlash"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Close Day & Record Unsold Towels */}
        {isCloseDayModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <CheckCircle2 size={18} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Ish yakuni: Kunni yopish
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCloseDayModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleConfirmCloseDay} className="mt-4 space-y-3.5">
                {/* Summary Box */}
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>Qo'ldagi naqd pul:</span>
                    <span className="font-bold text-emerald-700">
                      {staffTodayStats.cashAmount.toLocaleString()} so'm
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>Click / Karta:</span>
                    <span className="font-bold text-sky-700">
                      {staffTodayStats.cardAmount.toLocaleString()} so'm
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>Qaytarilgan ishlatilgan sochiqlar:</span>
                    <span className="font-bold text-slate-900">
                      {staffTodayStats.returnedTowels} dona
                    </span>
                  </div>
                </div>

                {/* Unsold Towels Returned Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sotilmay qolgan yangi sochiqlar (omborga qaytadigan) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={unsoldTowelsInput}
                    onChange={(e) => setUnsoldTowelsInput(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-base font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Hisoblangan qoldiq: {staffTodayStats.currentStock} dona
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Yakuniy izoh (ixtiyoriy)
                  </label>
                  <input
                    type="text"
                    value={closeNoteInput}
                    onChange={(e) => setCloseNoteInput(e.target.value)}
                    placeholder="Masalan: Barcha sartaroshxonalar aylanib chiqildi"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCloseDayModalOpen(false)}
                    className="rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {uz.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCloseDay}
                    className="rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {submittingCloseDay ? uz.common.loading : "Tasdiqlash va Yopish"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
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
              Sartaroshlarda bor
            </span>
            <span className="text-base font-extrabold text-amber-950 block mt-0.5">
              {circulation.heldByClients}
            </span>
            <span className="text-[10px] text-amber-700">dona</span>
          </div>
        </div>
      </div>

      {/* Today's Driver Daily Reports Section for Admin */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <Truck size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Haydovchilarning kunlik hisobotlari ({todayStr})
            </h3>
            <p className="text-[11px] text-slate-500">
              Ombor yuklamalari, savdolar va kun yakuni
            </p>
          </div>
        </div>

        {dailyReports.filter((r) => r.date === todayStr).length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">
            Bugungi sana uchun hisobotlar hali ochilmagan
          </p>
        ) : (
          <div className="space-y-3">
            {dailyReports
              .filter((r) => r.date === todayStr)
              .map((rep) => (
                <div
                  key={rep.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {rep.staffName || "Haydovchi"}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {rep.salesCount || 0} ta yetkazuv
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        rep.status === "closed"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {rep.status === "closed" ? "Topshirilgan / Yopilgan" : "Faol"}
                    </span>
                  </div>

                  {/* Towels status */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1 text-center bg-white p-2 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Ombordan</span>
                      <span className="font-bold text-slate-800">
                        {rep.totalLoadedFromWarehouse || 0} ta
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Mashinada</span>
                      <span className="font-bold text-emerald-700">
                        {rep.currentStock || 0} ta
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Berildi</span>
                      <span className="font-bold text-slate-800">
                        {rep.totalDelivered || 0} ta
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Qaytdi</span>
                      <span className="font-bold text-sky-700">
                        {rep.totalReturned || 0} ta
                      </span>
                    </div>
                  </div>

                  {/* Money status */}
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-slate-600">
                      Naqd: <strong className="text-emerald-700">{(Number(rep.cashAmount) || 0).toLocaleString()} so'm</strong>
                      {" | "}Click: <strong className="text-sky-700">{(Number(rep.cardAmount) || 0).toLocaleString()} so'm</strong>
                    </span>
                    {rep.unsoldTowelsReturned > 0 && (
                      <span className="text-amber-800 font-semibold">
                        Sotilmay qaytdi: {rep.unsoldTowelsReturned} ta
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
