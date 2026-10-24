import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  Package,
  Plus,
  Shield,
  Trash2,
  User,
  Users,
  X,
} from "../components/icons";
import { StaffModal } from "../components/StaffModal";
import { ROLES } from "../constants/roles";
import { useHeader } from "../context/HeaderContext";
import { uz } from "../i18n/uz";
import { createStaffAccount } from "../services/authService";
import {
  closeDailyReport,
  deleteUserDoc,
  getTodayDateString,
} from "../services/firestoreService";
import { formatPhoneDisplay } from "../utils/auth";

export function StaffManagementPage({
  users = [],
  sales = [],
  dailyReports = [],
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStaffHistory, setSelectedStaffHistory] = useState(null);
  const [actionError, setActionError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [periodMap, setPeriodMap] = useState({}); // staffId -> 'today' | 'all'

  useHeader(
    {
      title: uz.nav.staff,
      subtitle: `${users.length} ta xodim va foydalanuvchi`,
      showBack: false,
    },
    [users.length],
  );

  const todayStr = useMemo(() => getTodayDateString(), []);

  // Aggregated Warehouse stats for Managers
  const managerStats = useMemo(() => {
    const todayReports = dailyReports.filter((r) => r.date === todayStr);

    const todayLoaded = todayReports.reduce(
      (sum, r) => sum + (Number(r.totalLoadedFromWarehouse) || 0),
      0,
    );
    const todayUnsold = todayReports.reduce(
      (sum, r) => sum + (Number(r.unsoldTowelsReturned) || 0),
      0,
    );
    const todayUsedReturned = todayReports.reduce(
      (sum, r) => sum + (Number(r.totalReturned) || 0),
      0,
    );
    const todayDelivered = todayReports.reduce(
      (sum, r) => sum + (Number(r.totalDelivered) || 0),
      0,
    );
    const todayInVehicles = todayReports.reduce((sum, r) => {
      const loaded = Number(r.totalLoadedFromWarehouse) || 0;
      const del = Number(r.totalDelivered) || 0;
      const uns = Number(r.unsoldTowelsReturned) || 0;
      return sum + Math.max(0, loaded - del - uns);
    }, 0);
    const todayActiveDrivers = todayReports.filter(
      (r) => (Number(r.totalLoadedFromWarehouse) || 0) > 0,
    ).length;
    const todayClosedReports = todayReports.filter(
      (r) => r.status === "closed",
    ).length;

    const allLoaded = dailyReports.reduce(
      (sum, r) => sum + (Number(r.totalLoadedFromWarehouse) || 0),
      0,
    );
    const allUnsold = dailyReports.reduce(
      (sum, r) => sum + (Number(r.unsoldTowelsReturned) || 0),
      0,
    );
    const allUsedReturned = dailyReports.reduce(
      (sum, r) => sum + (Number(r.totalReturned) || 0),
      0,
    );
    const allDelivered = dailyReports.reduce(
      (sum, r) => sum + (Number(r.totalDelivered) || 0),
      0,
    );
    const totalDaysManaged = new Set(
      dailyReports.map((r) => r.date).filter(Boolean),
    ).size;

    return {
      todayLoaded,
      todayUnsold,
      todayUsedReturned,
      todayDelivered,
      todayInVehicles,
      todayActiveDrivers,
      todayClosedReports,
      allLoaded,
      allUnsold,
      allUsedReturned,
      allDelivered,
      totalDaysManaged,
    };
  }, [dailyReports, todayStr]);

  const handleCreateStaff = async (data) => {
    await createStaffAccount(data);
    setSuccessMsg("Yangi xodim muvaffaqiyatli yaratildi!");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const handleDeleteUser = async (uid) => {
    if (window.confirm(uz.admin.staff.deleteConfirm)) {
      try {
        await deleteUserDoc(uid);
        setSuccessMsg("Xodim muvaffaqiyatli o'chirildi!");
        setTimeout(() => setSuccessMsg(""), 4000);
      } catch (err) {
        console.error(err);
        setActionError(uz.common.error);
        setTimeout(() => setActionError(""), 4000);
      }
    }
  };

  const handleAcceptHandover = async (staffId, reportId) => {
    try {
      const idToClose = reportId || `${staffId}_${todayStr}`;
      await closeDailyReport(idToClose);
      setSuccessMsg("Haydovchi kassasi muvaffaqiyatli qabul qilindi!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      setActionError(uz.common.error);
      setTimeout(() => setActionError(""), 4000);
    }
  };

  const togglePeriod = (staffId) => {
    setPeriodMap((prev) => ({
      ...prev,
      [staffId]: prev[staffId] === "all" ? "today" : "all",
    }));
  };

  return (
    <div className="space-y-3.5 pb-8">
      {/* Notifications */}
      {actionError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <AlertCircle size={15} />
          <span>{actionError}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          <CheckCircle2 size={15} className="text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Add Staff Button */}
      <button
        type="button"
        onClick={() => setIsAddModalOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-3 text-xs font-bold text-emerald-800 hover:bg-emerald-100/60 active:scale-98 transition-all"
      >
        <Plus size={16} />
        {uz.admin.staff.addBtn}
      </button>

      {/* Staff List with Balances and Stats */}
      <div className="space-y-3">
        {users.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <Users size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-600">
              Hozircha xodimlar mavjud emas
            </p>
          </div>
        ) : (
          users.map((staff) => {
            const staffId = staff.uid || staff.id;
            const isStaffAdmin = staff.role === ROLES.ADMIN;
            const isStaffManager = staff.role === ROLES.MANAGER;
            const isStaffDelivery = staff.role === ROLES.DELIVERY;
            const currentPeriod = periodMap[staffId] || "today";

            // Today's Sales & Transactions
            const staffSalesToday = sales.filter((s) => {
              if (s.staffId !== staffId) return false;
              if (s.date === todayStr) return true;
              if (s.createdAt) {
                const sDate = s.createdAt.toDate
                  ? s.createdAt.toDate()
                  : new Date(s.createdAt);
                return getTodayDateString(sDate) === todayStr;
              }
              return false;
            });

            const todayCash = staffSalesToday.reduce(
              (acc, s) => acc + (Number(s.cashAmount) || 0),
              0,
            );
            const todayCard = staffSalesToday.reduce(
              (acc, s) => acc + (Number(s.cardAmount) || 0),
              0,
            );
            const todayDiscount = staffSalesToday.reduce(
              (acc, s) => acc + (Number(s.discount) || 0),
              0,
            );
            const todayDelivered = staffSalesToday.reduce(
              (acc, s) => acc + (Number(s.quantityDelivered) || 0),
              0,
            );
            const todayReturned = staffSalesToday.reduce(
              (acc, s) => acc + (Number(s.returnedTowels) || 0),
              0,
            );

            // Today's Daily Report
            const todayReport = dailyReports.find(
              (r) => r.staffId === staffId && r.date === todayStr,
            );
            const isTodayClosed = todayReport?.status === "closed";

            // All-Time Sales & Transactions
            const staffSalesAll = sales.filter((s) => s.staffId === staffId);

            const allCash = staffSalesAll.reduce(
              (acc, s) => acc + (Number(s.cashAmount) || 0),
              0,
            );
            const allCard = staffSalesAll.reduce(
              (acc, s) => acc + (Number(s.cardAmount) || 0),
              0,
            );
            const allDiscount = staffSalesAll.reduce(
              (acc, s) => acc + (Number(s.discount) || 0),
              0,
            );
            const allDelivered = staffSalesAll.reduce(
              (acc, s) => acc + (Number(s.quantityDelivered) || 0),
              0,
            );
            const allReturned = staffSalesAll.reduce(
              (acc, s) => acc + (Number(s.returnedTowels) || 0),
              0,
            );

            // Display Values based on Period
            const displayCash = currentPeriod === "today" ? todayCash : allCash;
            const displayCard = currentPeriod === "today" ? todayCard : allCard;
            const displayDiscount =
              currentPeriod === "today" ? todayDiscount : allDiscount;
            const displayDelivered =
              currentPeriod === "today" ? todayDelivered : allDelivered;
            const displayReturned =
              currentPeriod === "today" ? todayReturned : allReturned;

            return (
              <div
                key={staffId}
                className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3 hover:border-slate-300 transition-all"
              >
                {/* Staff Header Info */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold ${
                        isStaffAdmin
                          ? "bg-indigo-100 text-indigo-700"
                          : isStaffManager
                            ? "bg-purple-100 text-purple-700"
                            : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {isStaffAdmin ? (
                        <Shield size={20} />
                      ) : isStaffManager ? (
                        <Package size={20} />
                      ) : (
                        <User size={20} />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-extrabold text-slate-900">
                          {staff.name || "Xodim"}
                        </h4>
                        {isStaffAdmin && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Administrator
                          </span>
                        )}
                        {isStaffManager && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            Menejer
                          </span>
                        )}
                        {isStaffDelivery && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Yetkazuvchi
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-slate-500 mt-0.5">
                        +998 {formatPhoneDisplay(staff.phone)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(staffId)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title={uz.common.delete}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {isStaffManager ? (
                  <div className="space-y-3 pt-1">
                    {/* Period Selector Tabs: Bugun vs Barcha davr */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                        Sochiqlar Nazorati & Statistika
                      </span>
                      <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => togglePeriod(staffId)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] transition-all ${
                            currentPeriod === "today"
                              ? "bg-white text-slate-900 font-bold shadow-xs"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          Bugun
                        </button>
                        <button
                          type="button"
                          onClick={() => togglePeriod(staffId)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] transition-all ${
                            currentPeriod === "all"
                              ? "bg-white text-slate-900 font-bold shadow-xs"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          Barchasi
                        </button>
                      </div>
                    </div>

                    {/* Key Warehouse Metrics (3 Cards) */}
                    <div className="grid grid-cols-3 gap-2">
                      {/* 1. Ombordan berildi */}
                      <div className="rounded-xl border border-purple-200 bg-purple-50/80 p-2.5 text-center">
                        <span className="block text-[10px] text-purple-800 font-bold">
                          Berildi
                        </span>
                        <span className="text-sm font-extrabold text-purple-950 block mt-0.5 truncate">
                          {currentPeriod === "today"
                            ? managerStats.todayLoaded.toLocaleString()
                            : managerStats.allLoaded.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-purple-700">
                          dona
                        </span>
                      </div>

                      {/* 2. Mashinalarda / Tarqatildi */}
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-2.5 text-center">
                        <span className="block text-[10px] text-emerald-800 font-bold">
                          {currentPeriod === "today"
                            ? "Mashinalarda"
                            : "Tarqatildi"}
                        </span>
                        <span className="text-sm font-extrabold text-emerald-950 block mt-0.5 truncate">
                          {currentPeriod === "today"
                            ? managerStats.todayInVehicles.toLocaleString()
                            : managerStats.allDelivered.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-emerald-700">
                          dona
                        </span>
                      </div>

                      {/* 3. Sotilmay qaytgan */}
                      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-2.5 text-center">
                        <span className="block text-[10px] text-amber-900 font-bold">
                          Sotilmay qaytdi
                        </span>
                        <span className="text-sm font-extrabold text-amber-950 block mt-0.5 truncate">
                          {currentPeriod === "today"
                            ? managerStats.todayUnsold.toLocaleString()
                            : managerStats.allUnsold.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-amber-700">dona</span>
                      </div>
                    </div>

                    {/* Operational Details Grid */}
                    <div className="grid grid-cols-3 gap-1.5 text-center text-xs bg-slate-50 rounded-xl p-2 border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-500 block truncate">
                          Yuvishga qaytgan
                        </span>
                        <span className="font-bold text-slate-800">
                          {currentPeriod === "today"
                            ? managerStats.todayUsedReturned
                            : managerStats.allUsedReturned}{" "}
                          ta
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {currentPeriod === "today"
                            ? "Faol haydovchi"
                            : "Ish kunlari"}
                        </span>
                        <span className="font-bold text-slate-800">
                          {currentPeriod === "today"
                            ? managerStats.todayActiveDrivers
                            : managerStats.totalDaysManaged}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {currentPeriod === "today"
                            ? "Yopilgan kassa"
                            : "Jami qaytgan"}
                        </span>
                        <span className="font-bold text-slate-800">
                          {currentPeriod === "today"
                            ? managerStats.todayClosedReports
                            : managerStats.allUnsold +
                              managerStats.allUsedReturned}
                        </span>
                      </div>
                    </div>

                    {/* Quick Link to open Warehouse Management */}
                    <Link
                      to="/ombor"
                      className="flex items-center justify-between rounded-xl bg-purple-50 hover:bg-purple-100/80 border border-purple-200/80 px-3 py-2 text-xs font-bold text-purple-900 transition-all active:scale-98"
                    >
                      <div className="flex items-center gap-2">
                        <Package size={15} className="text-purple-700" />
                        <span>Ombor boshqaruv paneliga o'tish</span>
                      </div>
                      <ChevronRight size={15} className="text-purple-600" />
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Period Selector Tabs: Bugun vs Barcha davr */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                        Haydovchi Balansi & Statistika
                      </span>
                      <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => togglePeriod(staffId)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] transition-all ${
                            currentPeriod === "today"
                              ? "bg-white text-slate-900 font-bold shadow-xs"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          Bugun
                        </button>
                        <button
                          type="button"
                          onClick={() => togglePeriod(staffId)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] transition-all ${
                            currentPeriod === "all"
                              ? "bg-white text-slate-900 font-bold shadow-xs"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          Barchasi
                        </button>
                      </div>
                    </div>

                    {/* Key Balance Metrics */}
                    <div className="grid grid-cols-3 gap-2">
                      {/* Cash in Hand */}
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-2.5 text-center">
                        <span className="block text-[10px] text-emerald-800 font-bold">
                          Qo'ldagi Naqd
                        </span>
                        <span className="text-sm font-extrabold text-emerald-950 block mt-0.5 truncate">
                          {displayCash.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-emerald-700">
                          so'm
                        </span>
                      </div>

                      {/* Click / Card */}
                      <div className="rounded-xl border border-sky-200 bg-sky-50/80 p-2.5 text-center">
                        <span className="block text-[10px] text-sky-800 font-bold">
                          Click / Karta
                        </span>
                        <span className="text-sm font-extrabold text-sky-950 block mt-0.5 truncate">
                          {displayCard.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-sky-700">so'm</span>
                      </div>

                      {/* Discount */}
                      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-2.5 text-center">
                        <span className="block text-[10px] text-amber-900 font-bold">
                          Chegirmalar
                        </span>
                        <span className="text-sm font-extrabold text-amber-950 block mt-0.5 truncate">
                          {displayDiscount.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-amber-700">so'm</span>
                      </div>
                    </div>

                    {/* Circulation: Warehouse loads, In Vehicle, Delivered & Returned */}
                    <div className="grid grid-cols-4 gap-1.5 text-center text-xs bg-slate-50 rounded-xl p-2 border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-500 block">
                          Ombordan
                        </span>
                        <span className="font-bold text-slate-800">
                          {currentPeriod === "today"
                            ? todayReport?.totalLoadedFromWarehouse || 0
                            : "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">
                          Mashinada
                        </span>
                        <span className="font-bold text-emerald-700">
                          {currentPeriod === "today"
                            ? todayReport?.currentStock || 0
                            : "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">
                          Topshirildi
                        </span>
                        <span className="font-bold text-slate-800">
                          {displayDelivered}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">
                          Qaytarildi
                        </span>
                        <span className="font-bold text-sky-700">
                          {displayReturned}
                        </span>
                      </div>
                    </div>

                    {/* Handover Action & History Button */}
                    <div className="pt-1 flex items-center justify-between gap-2 flex-wrap">
                      {currentPeriod === "today" && (
                        <>
                          {isTodayClosed ? (
                            <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={14} />
                              <span>Bugungi kassa qabul qilingan</span>
                            </div>
                          ) : todayCash > 0 ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleAcceptHandover(staffId, todayReport?.id)
                              }
                              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all"
                            >
                              <DollarSign size={14} />
                              <span>
                                Kassani qabul qilish (
                                {todayCash.toLocaleString()} so'm)
                              </span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">
                              Bugun naqd pul yig'ilmagan
                            </span>
                          )}
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedStaffHistory({
                            id: staffId,
                            name: staff.name,
                          })
                        }
                        className="ml-auto inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                      >
                        <Clock size={13} />
                        <span>Hisobotlar tarixi</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Driver Daily Reports History Modal */}
      {selectedStaffHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Kunlik hisobotlar tarixi
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedStaffHistory.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStaffHistory(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 pr-1">
              {dailyReports.filter((r) => r.staffId === selectedStaffHistory.id)
                .length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Ushbu haydovchi bo'yicha hali hisobotlar mavjud emas
                </div>
              ) : (
                dailyReports
                  .filter((r) => r.staffId === selectedStaffHistory.id)
                  .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
                  .map((rep) => (
                    <div
                      key={rep.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          {rep.date}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rep.status === "closed"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {rep.status === "closed"
                            ? "Topshirilgan"
                            : "Faol kassa"}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1 pt-1 text-[11px]">
                        <div>
                          <span className="text-slate-500 block">Naqd:</span>
                          <span className="font-bold text-emerald-700">
                            {(Number(rep.cashAmount) || 0).toLocaleString()}{" "}
                            {uz.common.sum}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Click:</span>
                          <span className="font-bold text-sky-700">
                            {(Number(rep.cardAmount) || 0).toLocaleString()}{" "}
                            {uz.common.sum}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">
                            Chegirma:
                          </span>
                          <span className="font-bold text-amber-700">
                            {(Number(rep.discount) || 0).toLocaleString()}{" "}
                            {uz.common.sum}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px] text-slate-600">
                        <span>
                          Topshirildi: <b>{rep.totalDelivered || 0} ta</b> •
                          Qaytarildi: <b>{rep.totalReturned || 0} ta</b>
                        </span>
                        <span>{rep.salesCount || 0} ta savdo</span>
                      </div>

                      {/* Warehouse Loads & Unsold returned */}
                      {(rep.totalLoadedFromWarehouse > 0 ||
                        rep.unsoldTowelsReturned > 0) && (
                        <div className="pt-1 border-t border-slate-200/80 text-[10px] text-slate-500 space-y-0.5">
                          <div className="flex justify-between">
                            <span>
                              Ombordan olindi:{" "}
                              <b>{rep.totalLoadedFromWarehouse || 0} ta</b>
                            </span>
                            {rep.unsoldTowelsReturned > 0 && (
                              <span className="text-amber-800 font-semibold">
                                Sotilmay qaytdi: {rep.unsoldTowelsReturned} ta
                              </span>
                            )}
                          </div>
                          {Array.isArray(rep.warehouseLoads) &&
                            rep.warehouseLoads.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                {rep.warehouseLoads.map((wl, wIdx) => (
                                  <span
                                    key={wl.id || wIdx}
                                    className="rounded bg-white px-1.5 py-0.5 border border-slate-200 font-mono text-[9px]"
                                  >
                                    {wl.time}: +{wl.count}
                                  </span>
                                ))}
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedStaffHistory(null)}
                className="w-full rounded-xl bg-slate-100 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                {uz.common.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <StaffModal
          onSave={handleCreateStaff}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  );
}
