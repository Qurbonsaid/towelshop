import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Package,
  Plus,
  RotateCcw,
  Truck,
  User,
  Users,
  X,
} from "../components/icons";
import { isDeliveryRole } from "../constants/roles";
import { useHeader } from "../context/HeaderContext";
import { uz } from "../i18n/uz";
import {
  closeDailyReport,
  getTodayDateString,
  recordWarehouseLoad,
} from "../services/firestoreService";
import { formatPhoneDisplay } from "../utils/auth";

export function ManagerDashboard({
  userProfile,
  users = [],
  dailyReports = [],
}) {
  const todayStr = useMemo(() => getTodayDateString(), []);
  const [successToast, setSuccessToast] = useState(null);
  const [errorToast, setErrorToast] = useState(null);

  // Modal 1: Sochiq berish (Warehouse load)
  const [loadModalDriver, setLoadModalDriver] = useState(null);
  const [loadCount, setLoadCount] = useState("");
  const [loadNote, setLoadNote] = useState("");
  const [submittingLoad, setSubmittingLoad] = useState(false);

  // Modal 2: Sotilmagan sochiqlarni qabul qilish (Return unsold towels & close day)
  const [receiveModalDriver, setReceiveModalDriver] = useState(null);
  const [unsoldReceivedCount, setUnsoldReceivedCount] = useState("");
  const [receiveNote, setReceiveNote] = useState("");
  const [submittingReceive, setSubmittingReceive] = useState(false);

  const showSuccess = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const showError = (msg) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 4000);
  };

  useHeader(
    {
      title: uz.manager.title,
      subtitle: `${todayStr} • Sochiqlar nazorati`,
      showBack: false,
    },
    [todayStr],
  );

  // Only drivers (delivery or legacy staff)
  const drivers = useMemo(() => {
    return users.filter((u) => isDeliveryRole(u.role));
  }, [users]);

  // Aggregate stats across all delivery drivers today
  const summaryStats = useMemo(() => {
    let totalLoaded = 0;
    let totalDelivered = 0;
    let totalReturnedUsed = 0;
    let totalUnsoldReturned = 0;
    let totalCurrentStock = 0;

    drivers.forEach((driver) => {
      const driverId = driver.uid || driver.id;
      const rep = dailyReports.find(
        (r) => r.staffId === driverId && r.date === todayStr,
      );

      const loaded = Number(rep?.totalLoadedFromWarehouse || 0);
      const delivered = Number(rep?.totalDelivered || 0);
      const returnedUsed = Number(rep?.totalReturned || 0);
      const unsold = Number(rep?.unsoldTowelsReturned || 0);
      const currentStock = Math.max(0, loaded - delivered - unsold);

      totalLoaded += loaded;
      totalDelivered += delivered;
      totalReturnedUsed += returnedUsed;
      totalUnsoldReturned += unsold;
      totalCurrentStock += currentStock;
    });

    return {
      totalLoaded,
      totalDelivered,
      totalReturnedUsed,
      totalUnsoldReturned,
      totalCurrentStock,
    };
  }, [drivers, dailyReports, todayStr]);

  // Handle open Give Towels Modal
  const handleOpenLoadModal = (driver) => {
    setLoadModalDriver(driver);
    setLoadCount("");
    setLoadNote("Sochiqlardan berildi");
  };

  // Submit Give Towels
  const handleSubmitLoad = async (e) => {
    e.preventDefault();
    const count = Number(loadCount);
    if (!count || count <= 0 || !loadModalDriver) {
      showError("Iltimos, musbat sochiqlar sonini kiriting");
      return;
    }

    setSubmittingLoad(true);
    try {
      const driverId = loadModalDriver.uid || loadModalDriver.id;
      await recordWarehouseLoad({
        staffId: driverId,
        staffName: loadModalDriver.name || "Yetkazuvchi",
        count,
        note: loadNote.trim() || "Sochiqlardan berildi",
      });

      showSuccess(
        `${loadModalDriver.name || "Yetkazuvchi"}ga ${count} dona sochiq berildi!`,
      );
      setLoadModalDriver(null);
    } catch (err) {
      console.error("Error giving towels:", err);
      showError(uz.common.error);
    } finally {
      setSubmittingLoad(false);
    }
  };

  // Handle open Receive Unsold Towels Modal
  const handleOpenReceiveModal = (driver, currentExpectedStock) => {
    setReceiveModalDriver(driver);
    setUnsoldReceivedCount(
      currentExpectedStock > 0 ? String(currentExpectedStock) : "0",
    );
    setReceiveNote("Qoldiq sochiqlarga qabul qilindi");
  };

  // Submit Receive Unsold Towels & Close Day
  const handleSubmitReceive = async (e) => {
    e.preventDefault();
    const unsold = Number(unsoldReceivedCount);
    if (isNaN(unsold) || unsold < 0 || !receiveModalDriver) {
      showError(
        "Iltimos, to'g'ri sochiqlar sonini kiriting (0 yoki undan ko'p)",
      );
      return;
    }

    setSubmittingReceive(true);
    try {
      const driverId = receiveModalDriver.uid || receiveModalDriver.id;
      const reportId = `${driverId}_${todayStr}`;

      await closeDailyReport(reportId, {
        unsoldTowelsReturned: unsold,
        note: receiveNote.trim() || "Menejer tomonidan qabul qilindi",
      });

      showSuccess(
        `${receiveModalDriver.name || "Yetkazuvchi"}ning ${unsold} dona sochiqlari qabul qilindi va kun yakunlandi!`,
      );
      setReceiveModalDriver(null);
    } catch (err) {
      console.error("Error receiving towels:", err);
      showError(uz.common.error);
    } finally {
      setSubmittingReceive(false);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Toast Notifications */}
      {successToast && (
        <div className="fixed top-16 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-emerald-300 bg-white px-4 py-2.5 shadow-xl animate-in slide-in-from-top-2 duration-150 flex items-center gap-2 text-xs font-bold text-emerald-800">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{successToast}</span>
        </div>
      )}

      {errorToast && (
        <div className="fixed top-16 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-red-300 bg-white px-4 py-2.5 shadow-xl animate-in slide-in-from-top-2 duration-150 flex items-center gap-2 text-xs font-bold text-red-800">
          <AlertCircle size={16} className="text-red-600" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* 1. HERO WAREHOUSE SUMMARY CARD */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-600 to-emerald-800 p-4 text-white shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs">
              <Package size={20} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-wide">
                Bugungi Sochiqlar Holati
              </span>
              <h2 className="text-sm font-semibold text-emerald-50">
                {userProfile?.name
                  ? `${userProfile.name} (Menejer)`
                  : "Sochiqlar Nazorati"}
              </h2>
            </div>
          </div>
          <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-xs">
            {todayStr}
          </span>
        </div>

        {/* Aggregate Counters */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-500/50 text-center">
          <div className="rounded-xl bg-white/10 p-2 backdrop-blur-xs">
            <span className="text-[10px] text-emerald-200 block">
              Sochiqlardan berildi
            </span>
            <span className="text-lg font-extrabold text-white block mt-0.5">
              {summaryStats.totalLoaded}
            </span>
            <span className="text-[9px] text-emerald-200">dona</span>
          </div>

          <div className="rounded-xl bg-white/10 p-2 backdrop-blur-xs">
            <span className="text-[10px] text-emerald-200 block">
              Mashinalarda
            </span>
            <span className="text-lg font-extrabold text-white block mt-0.5">
              {summaryStats.totalCurrentStock}
            </span>
            <span className="text-[9px] text-emerald-200">dona</span>
          </div>

          <div className="rounded-xl bg-white/10 p-2 backdrop-blur-xs">
            <span className="text-[10px] text-emerald-200 block">
              Sotilmay qaytdi
            </span>
            <span className="text-lg font-extrabold text-white block mt-0.5">
              {summaryStats.totalUnsoldReturned}
            </span>
            <span className="text-[9px] text-emerald-200">dona</span>
          </div>
        </div>
      </div>

      {/* 2. DRIVERS LIST & ACTIONS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Truck size={16} className="text-emerald-600" />
            <span>
              {uz.manager.driverList} ({drivers.length})
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Sochiq yuklash va qaytarish
          </span>
        </div>

        {drivers.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <Users size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-600">
              {uz.manager.noDrivers}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Administrator xodimlar bo'limidan yetkazuvchi qo'shishi kerak.
            </p>
          </div>
        ) : (
          drivers.map((driver) => {
            const driverId = driver.uid || driver.id;
            const rep = dailyReports.find(
              (r) => r.staffId === driverId && r.date === todayStr,
            );

            const isClosed = rep?.status === "closed";
            const totalLoaded = Number(rep?.totalLoadedFromWarehouse || 0);
            const totalDelivered = Number(rep?.totalDelivered || 0);
            const totalReturned = Number(rep?.totalReturned || 0);
            const unsoldReturned = Number(rep?.unsoldTowelsReturned || 0);
            const currentStock = Math.max(
              0,
              totalLoaded - totalDelivered - unsoldReturned,
            );
            const warehouseLoads = Array.isArray(rep?.warehouseLoads)
              ? rep.warehouseLoads
              : [];

            return (
              <div
                key={driverId}
                className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3 hover:border-slate-300 transition-all"
              >
                {/* Driver Info & Status Badge */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">
                      <User size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-extrabold text-slate-900 truncate">
                        {driver.name || "Yetkazuvchi"}
                      </h3>
                      <p className="text-xs font-mono text-slate-500 mt-0.5">
                        +998 {formatPhoneDisplay(driver.phone)}
                      </p>
                    </div>
                  </div>

                  <div>
                    {isClosed ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={12} />
                        Kun yopilgan
                      </span>
                    ) : totalLoaded > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 border border-sky-200">
                        <Truck size={12} />
                        Faol / Yo'lda
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        Boshlanmagan
                      </span>
                    )}
                  </div>
                </div>

                {/* Driver Towel Metrics */}
                <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                  <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
                    <span className="block text-[10px] text-slate-500 font-medium truncate">
                      Berildi
                    </span>
                    <span className="font-extrabold text-slate-900 text-sm block mt-0.5">
                      {totalLoaded}
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
                    <span className="block text-[10px] text-slate-500 font-medium truncate">
                      Tarqatildi
                    </span>
                    <span className="font-extrabold text-slate-900 text-sm block mt-0.5">
                      {totalDelivered}
                    </span>
                  </div>

                  <div className="rounded-xl bg-emerald-50/70 p-2 border border-emerald-100">
                    <span className="block text-[10px] text-emerald-800 font-bold truncate">
                      Mashinada
                    </span>
                    <span className="font-black text-emerald-700 text-sm block mt-0.5">
                      {currentStock}
                    </span>
                  </div>

                  <div className="rounded-xl bg-amber-50/70 p-2 border border-amber-100">
                    <span className="block text-[10px] text-amber-800 font-medium truncate">
                      Qaytgan
                    </span>
                    <span className="font-extrabold text-amber-900 text-sm block mt-0.5">
                      {unsoldReturned}
                    </span>
                  </div>
                </div>

                {/* Used towels collected */}
                <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
                  <span>Yuvishga qaytarilgan (ishlatilgan):</span>
                  <span className="font-bold text-slate-700">
                    {totalReturned} dona
                  </span>
                </div>

                {/* Loads Timeline */}
                {warehouseLoads.length > 0 && (
                  <div className="rounded-xl bg-slate-50/80 p-2 text-xs border border-slate-100 space-y-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                      Berilgan sochiqlar tarixi:
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {warehouseLoads.map((load, lIdx) => (
                        <span
                          key={load.id || lIdx}
                          className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 font-mono text-[10px] text-slate-700 border border-slate-200"
                        >
                          <Clock size={10} className="text-slate-400" />
                          <span>{load.time}:</span>
                          <strong className="text-emerald-700">
                            +{load.count}
                          </strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons for Manager */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleOpenLoadModal(driver)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all"
                  >
                    <Plus size={15} />
                    <span>{uz.manager.giveTowels}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenReceiveModal(driver, currentStock)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all active:scale-95 ${
                      isClosed
                        ? "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
                        : "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100"
                    }`}
                  >
                    <RotateCcw size={14} />
                    <span>
                      {isClosed
                        ? "Qayta qabul qilish"
                        : uz.manager.receiveTowels}
                    </span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: SOCHIQ BERISH (Give Towels) */}
      {loadModalDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Package size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {uz.manager.loadModalTitle}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {loadModalDriver.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLoadModalDriver(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitLoad} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {uz.manager.countLabel} *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  autoFocus
                  value={loadCount}
                  onChange={(e) => setLoadCount(e.target.value)}
                  placeholder="Masalan: 100"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-base font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />

                {/* Quick Add Chips */}
                <div className="flex items-center gap-1.5 mt-2">
                  {[50, 100, 150, 200].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setLoadCount(String(val))}
                      className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    >
                      +{val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {uz.common.note}
                </label>
                <input
                  type="text"
                  value={loadNote}
                  onChange={(e) => setLoadNote(e.target.value)}
                  placeholder="Sochiqlardan berildi"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setLoadModalDriver(null)}
                  className="rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {uz.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submittingLoad}
                  className="flex items-center justify-center gap-1 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-60"
                >
                  <Check size={14} />
                  <span>
                    {submittingLoad
                      ? uz.common.loading
                      : uz.manager.confirmGive}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SOTILMAGAN SOCHIQLARNI QABUL QILISH (Receive Unsold Towels) */}
      {receiveModalDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <RotateCcw size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {uz.manager.receiveModalTitle}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {receiveModalDriver.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReceiveModalDriver(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReceive} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {uz.manager.unsoldLabel} *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  autoFocus
                  value={unsoldReceivedCount}
                  onChange={(e) => setUnsoldReceivedCount(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-base font-bold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Sotilmagan, qaytarib topshirilgan toza sochiqlar soni.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {uz.common.note}
                </label>
                <input
                  type="text"
                  value={receiveNote}
                  onChange={(e) => setReceiveNote(e.target.value)}
                  placeholder="Qoldiq omborga qabul qilindi"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReceiveModalDriver(null)}
                  className="rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {uz.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submittingReceive}
                  className="flex items-center justify-center gap-1 rounded-xl bg-amber-600 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 disabled:opacity-60"
                >
                  <Check size={14} />
                  <span>
                    {submittingReceive
                      ? uz.common.loading
                      : uz.manager.confirmReceive}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
