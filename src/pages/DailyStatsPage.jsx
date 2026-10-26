import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  Receipt,
  Search,
  User,
} from "../components/icons";
import { useHeader } from "../context/HeaderContext";
import { uz } from "../i18n/uz";
import { getTodayDateString } from "../services/firestoreService";

export function DailyStatsPage({
  sales = [],
  barbers = [],
  _barbershops = [],
}) {
  // Date filters: 'today' | 'yesterday' | 'week' | 'all' | 'custom'
  const [filterMode, setFilterMode] = useState("today");
  const [customDate, setCustomDate] = useState(getTodayDateString());

  // Search filter inside lists
  const [searchQuery, setSearchQuery] = useState("");

  // Accordion toggle states (both open by default for immediate overview)
  const [isNewDebtorsOpen, setIsNewDebtorsOpen] = useState(true);
  const [isDebtPayersOpen, setIsDebtPayersOpen] = useState(true);
  const [isAllLogsOpen, setIsAllLogsOpen] = useState(false);

  // Configure Header
  useHeader(
    {
      title: "Kunlik moliyaviy hisobot",
      subtitle: "Kassa tushumi, yangi qarzlar va to'lovlar",
      showBack: true,
      backTo: "/statistika",
    },
    [],
  );

  // Today and yesterday strings
  const [todayStr] = useState(() => getTodayDateString());
  const [yesterdayStr] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getTodayDateString(d);
  });

  const [weekAgoStr] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return getTodayDateString(d);
  });

  // Filter sales by selected date range for accurate total cash/card collection
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const sDate =
        s.date ||
        (s.createdAt
          ? getTodayDateString(
              s.createdAt.toDate ? s.createdAt.toDate() : s.createdAt,
            )
          : "");
      if (filterMode === "today") return sDate === todayStr;
      if (filterMode === "yesterday") return sDate === yesterdayStr;
      if (filterMode === "week")
        return sDate >= weekAgoStr && sDate <= todayStr;
      if (filterMode === "custom") return sDate === customDate;
      return true;
    });
  }, [sales, filterMode, todayStr, yesterdayStr, weekAgoStr, customDate]);

  // Barber map for fallback debt lookup on legacy sale records
  const barberMap = useMemo(() => {
    const map = new Map();
    barbers.forEach((b) => map.set(b.id, b));
    return map;
  }, [barbers]);

  // Build unified audit records directly from sales in memory (zero extra Firestore reads)
  const unifiedLogs = useMemo(() => {
    const list = sales.map((s) => {
      const cash = Number(s.cashAmount) || 0;
      const card = Number(s.cardAmount) || 0;
      const disc = Number(s.discount) || 0;
      const totalPaid = cash + card;
      const totalCredit = totalPaid + disc;
      const charged = Number(s.chargedAmount ?? s.totalPrice) || 0;
      const sDate =
        s.date ||
        (s.createdAt
          ? getTodayDateString(
              s.createdAt.toDate ? s.createdAt.toDate() : s.createdAt,
            )
          : todayStr);

      // If sale already contains embedded audit fields (new unified schema), use them directly
      if (s.oldDebt !== undefined || s.newDebt !== undefined) {
        return {
          ...s,
          id: s.id,
          saleId: s.id,
          cashAmount: cash,
          cardAmount: card,
          discount: disc,
          totalPaid,
          totalCredit,
          chargedAmount: charged,
          oldDebt: Number(s.oldDebt) || 0,
          newDebt: Number(s.newDebt) || 0,
          isDebtPayment: Boolean(s.isDebtPayment),
          debtPaidAmount: Number(s.debtPaidAmount) || 0,
          isNewDebt: Boolean(s.isNewDebt),
          newDebtAmount: Number(s.newDebtAmount) || 0,
          quantityDelivered: Number(s.quantityDelivered) || 0,
          returnedTowels: Number(s.returnedTowels) || 0,
          date: sDate,
        };
      }

      // Fallback calculation for legacy sales created before unified schema
      const barber = barberMap.get(s.barberId);
      const bDebt = Number(barber?.debt) || 0;

      const isNewDebt = charged > totalCredit;
      const newDebtAmount = isNewDebt ? charged - totalCredit : 0;

      const isDebtPayment =
        (Number(s.quantityDelivered) === 0 && totalCredit > 0) ||
        totalCredit > charged;
      const debtPaidAmount = isDebtPayment
        ? Number(s.quantityDelivered) === 0
          ? totalCredit
          : totalCredit - charged
        : 0;

      const oldDebt = isDebtPayment
        ? bDebt > 0
          ? bDebt + debtPaidAmount
          : debtPaidAmount
        : bDebt;
      const newDebt = isNewDebt
        ? bDebt + newDebtAmount
        : isDebtPayment
          ? Math.max(0, oldDebt - debtPaidAmount)
          : bDebt;

      return {
        id: s.id,
        saleId: s.id,
        barberId: s.barberId,
        barberName: s.barberName || "",
        barbershopId: s.barbershopId,
        barbershopName: s.barbershopName || "",
        staffId: s.staffId,
        staffName: s.staffName || "Xodim",
        cashAmount: cash,
        cardAmount: card,
        discount: disc,
        totalPaid,
        totalCredit,
        chargedAmount: charged,
        oldDebt,
        newDebt,
        isDebtPayment,
        debtPaidAmount,
        isNewDebt,
        newDebtAmount,
        quantityDelivered: Number(s.quantityDelivered) || 0,
        returnedTowels: Number(s.returnedTowels) || 0,
        note: s.note || "",
        date: sDate,
        createdAt: s.createdAt,
      };
    });

    return list.sort((a, b) => {
      const timeA = a.createdAt?.toMillis
        ? a.createdAt.toMillis()
        : a.createdAt?.toDate
          ? a.createdAt.toDate().getTime()
          : a.createdAt
            ? new Date(a.createdAt).getTime()
            : 0;
      const timeB = b.createdAt?.toMillis
        ? b.createdAt.toMillis()
        : b.createdAt?.toDate
          ? b.createdAt.toDate().getTime()
          : b.createdAt
            ? new Date(b.createdAt).getTime()
            : 0;
      return timeB - timeA;
    });
  }, [sales, todayStr, barberMap]);

  // 2-Hour Matching Rule (computed purely in memory without extra database reads/deletes):
  // If a barber incurred a debt and paid the same amount within 2 hours,
  // exclude both from "Yangi qarzdorlar" and "Qarzini to'laganlar".
  const { newDebtorsList, debtPayersList, matchedCancelledCount } =
    useMemo(() => {
      const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

      const getTime = (item) => {
        if (item.createdAt?.toMillis) return item.createdAt.toMillis();
        if (item.createdAt?.toDate) return item.createdAt.toDate().getTime();
        if (item.createdAt) return new Date(item.createdAt).getTime();
        return 0;
      };

      const isGenuineNewDebt = (item) => {
        const oldDebt = Number(item.oldDebt) || 0;
        const newDebt = Number(item.newDebt) || 0;
        const newDebtAmt = Number(item.newDebtAmount) || 0;

        if (newDebt > oldDebt) return true;
        if (newDebtAmt > 0) return true;
        if (item.isNewDebt && newDebt > 0) return true;
        return false;
      };

      const isGenuineDebtPayment = (item) => {
        const oldDebt = Number(item.oldDebt) || 0;
        const newDebt = Number(item.newDebt) || 0;
        const paid = Number(item.debtPaidAmount) || 0;

        if (oldDebt === 0 && newDebt === 0) return false;
        if (oldDebt > 0 && (newDebt < oldDebt || paid > 0)) return true;
        if (item.isDebtPayment && oldDebt > 0 && paid > 0) return true;

        return false;
      };

      const debtCandidates = [];
      const paymentCandidates = [];

      unifiedLogs.forEach((item) => {
        if (isGenuineNewDebt(item)) {
          const debtAmt =
            Number(item.newDebtAmount) ||
            Math.max(
              0,
              (Number(item.newDebt) || 0) - (Number(item.oldDebt) || 0),
            );
          debtCandidates.push({
            item,
            amt: debtAmt,
            time: getTime(item),
            id: item.id,
            barberId: item.barberId,
          });
        }

        if (isGenuineDebtPayment(item)) {
          const paidAmt =
            Number(item.debtPaidAmount) ||
            Math.max(
              0,
              (Number(item.oldDebt) || 0) - (Number(item.newDebt) || 0),
            );
          paymentCandidates.push({
            item,
            amt: paidAmt,
            time: getTime(item),
            id: item.id,
            barberId: item.barberId,
          });
        }
      });

      const cancelledIds = new Set();
      let matchCount = 0;

      debtCandidates.forEach((debt) => {
        if (cancelledIds.has(debt.id)) return;

        const match = paymentCandidates.find((payment) => {
          if (cancelledIds.has(payment.id)) return false;
          if (
            debt.barberId &&
            payment.barberId &&
            debt.barberId !== payment.barberId
          )
            return false;
          if (Math.abs(debt.amt - payment.amt) > 100) return false;
          if (
            debt.time &&
            payment.time &&
            Math.abs(debt.time - payment.time) > TWO_HOURS_MS
          )
            return false;
          return true;
        });

        if (match) {
          cancelledIds.add(debt.id);
          cancelledIds.add(match.id);
          matchCount += 1;
        }
      });

      const dateFilter = (item) => {
        const itemDate =
          item.date ||
          (item.createdAt
            ? getTodayDateString(
                item.createdAt.toDate
                  ? item.createdAt.toDate()
                  : item.createdAt,
              )
            : "");
        if (filterMode === "today") return itemDate === todayStr;
        if (filterMode === "yesterday") return itemDate === yesterdayStr;
        if (filterMode === "week")
          return itemDate >= weekAgoStr && itemDate <= todayStr;
        if (filterMode === "custom") return itemDate === customDate;
        return true;
      };

      const qLower = searchQuery.trim().toLowerCase();
      const searchFilter = (item) => {
        if (!qLower) return true;
        const barberMatch = item.barberName?.toLowerCase().includes(qLower);
        const shopMatch = item.barbershopName?.toLowerCase().includes(qLower);
        const staffMatch = item.staffName?.toLowerCase().includes(qLower);
        return barberMatch || shopMatch || staffMatch;
      };

      const finalNewDebtors = debtCandidates
        .filter(
          (d) =>
            !cancelledIds.has(d.id) &&
            dateFilter(d.item) &&
            searchFilter(d.item),
        )
        .map((d) => d.item);

      const finalDebtPayers = paymentCandidates
        .filter(
          (p) =>
            !cancelledIds.has(p.id) &&
            dateFilter(p.item) &&
            searchFilter(p.item),
        )
        .map((p) => p.item);

      return {
        newDebtorsList: finalNewDebtors,
        debtPayersList: finalDebtPayers,
        matchedCancelledCount: matchCount,
      };
    }, [
      unifiedLogs,
      filterMode,
      todayStr,
      yesterdayStr,
      weekAgoStr,
      customDate,
      searchQuery,
    ]);

  // Filter logs by selected date range for Accordion 3 (full logs stream)
  const filteredByDateLogs = useMemo(() => {
    return unifiedLogs.filter((item) => {
      const itemDate =
        item.date ||
        (item.createdAt
          ? getTodayDateString(
              item.createdAt.toDate ? item.createdAt.toDate() : item.createdAt,
            )
          : "");
      if (filterMode === "today") return itemDate === todayStr;
      if (filterMode === "yesterday") return itemDate === yesterdayStr;
      if (filterMode === "week")
        return itemDate >= weekAgoStr && itemDate <= todayStr;
      if (filterMode === "custom") return itemDate === customDate;
      return true;
    });
  }, [unifiedLogs, filterMode, todayStr, yesterdayStr, weekAgoStr, customDate]);

  // Financial aggregates for the selected date range
  const totals = useMemo(() => {
    let cash = 0;
    let card = 0;
    let discount = 0;

    filteredSales.forEach((s) => {
      cash += Number(s.cashAmount) || 0;
      card += Number(s.cardAmount) || 0;
      discount += Number(s.discount) || 0;
    });

    const totalCollected = cash + card;

    const totalNewDebt = newDebtorsList.reduce((sum, item) => {
      const amt =
        Number(item.newDebtAmount) ||
        Math.max(0, (Number(item.newDebt) || 0) - (Number(item.oldDebt) || 0));
      return sum + amt;
    }, 0);

    const totalDebtPaid = debtPayersList.reduce((sum, item) => {
      const amt =
        Number(item.debtPaidAmount) ||
        Math.max(0, (Number(item.oldDebt) || 0) - (Number(item.newDebt) || 0));
      return sum + amt;
    }, 0);

    return {
      cash,
      card,
      discount,
      totalCollected,
      totalDebtPaid,
      totalNewDebt,
      operationsCount: filteredSales.length,
    };
  }, [filteredSales, newDebtorsList, debtPayersList]);

  const formatTime = (ts) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString("uz-UZ", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return dateString;
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Date Filter Bar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Calendar size={14} className="text-emerald-600" />
            Davrni tanlang:
          </span>

          <span className="text-[11px] font-semibold text-slate-500">
            {filterMode === "today" && `Bugun (${formatDateDisplay(todayStr)})`}
            {filterMode === "yesterday" &&
              `Kecha (${formatDateDisplay(yesterdayStr)})`}
            {filterMode === "week" && "Oxirgi 7 kun"}
            {filterMode === "all" && "Barcha vaqt"}
            {filterMode === "custom" && formatDateDisplay(customDate)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilterMode("today")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
              filterMode === "today"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Bugun
          </button>

          <button
            type="button"
            onClick={() => setFilterMode("yesterday")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
              filterMode === "yesterday"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Kecha
          </button>

          <button
            type="button"
            onClick={() => setFilterMode("week")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
              filterMode === "week"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Oxirgi 7 kun
          </button>

          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
              filterMode === "all"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Barchasi
          </button>

          <input
            type="date"
            value={customDate}
            onChange={(e) => {
              setCustomDate(e.target.value);
              setFilterMode("custom");
            }}
            className={`rounded-xl border px-2.5 py-1 text-xs font-bold outline-none transition-all ${
              filterMode === "custom"
                ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                : "border-slate-200 bg-slate-50 text-slate-700"
            }`}
          />
        </div>
      </div>

      {/* 1. JAMI OLINGAN PUL (NAQD + CLICK) */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-xs">
              <DollarSign size={20} />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Jami olingan pul (Kassa)
              </h2>
              <p className="text-xs text-slate-400">
                {totals.operationsCount} ta savdo va to'lov amallari bo'yicha
              </p>
            </div>
          </div>

          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-extrabold text-emerald-800">
            Naqd + Click
          </span>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 p-4 text-white shadow-sm">
          <p className="text-xs font-semibold text-emerald-100">
            Jami qabul qilingan tushum:
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight">
            {totals.totalCollected.toLocaleString()} {uz.common.sum}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900">
                Naqd pul
              </span>
              <span className="rounded-md bg-emerald-200/80 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-950">
                Naqd
              </span>
            </div>
            <p className="mt-1.5 text-lg font-extrabold text-emerald-950">
              {totals.cash.toLocaleString()}{" "}
              <span className="text-xs font-normal text-emerald-800">
                {uz.common.sum}
              </span>
            </p>
          </div>

          <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-900">
                Click / Karta
              </span>
              <span className="rounded-md bg-sky-200/80 px-1.5 py-0.5 text-[10px] font-extrabold text-sky-950">
                Karta
              </span>
            </div>
            <p className="mt-1.5 text-lg font-extrabold text-sky-950">
              {totals.card.toLocaleString()}{" "}
              <span className="text-xs font-normal text-sky-800">
                {uz.common.sum}
              </span>
            </p>
          </div>
        </div>

        {totals.discount > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 border border-amber-200">
            <span>Berilgan jami chegirmalar:</span>
            <span className="font-extrabold">
              {totals.discount.toLocaleString()} {uz.common.sum}
            </span>
          </div>
        )}
      </div>

      {/* Global Search inside Debts & Payments */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
          <Search size={16} />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Sartarosh, sartaroshxona yoki xodim ismi bo'yicha qidirish..."
          className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-900 shadow-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
        />
      </div>

      {/* 2-Hour Cancellation Rule Notice */}
      {matchedCancelledCount > 0 && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-teal-50 border border-teal-200/80 p-3 text-xs text-teal-900 shadow-2xs">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <p className="font-bold text-teal-950">
              2 soatlik qoida qo'llanildi:
            </p>
            <p className="text-[11px] text-teal-800">
              {matchedCancelledCount} ta bir xil summali va 2 soat ichida
              yopilgan vaqtinchalik qarzlar avtomatik chiqarib tashlandi (kassa
              tushumi to'liq saqlanib qoldi).
            </p>
          </div>
        </div>
      )}

      {/* 2. ACCORDION 1: YANGI QARZDORLAR */}
      <div className="rounded-2xl border border-red-200 bg-white shadow-xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setIsNewDebtorsOpen((prev) => !prev)}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-red-50/80 to-rose-50/50 hover:bg-red-50 text-left transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-xs">
              <AlertCircle size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-extrabold text-red-950">
                  Yangi qarzdorlar
                </h3>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-800">
                  {newDebtorsList.length} ta
                </span>
              </div>
              <p className="text-xs font-semibold text-red-700 mt-0.5">
                Jami yangi yozilgan qarz: {totals.totalNewDebt.toLocaleString()}{" "}
                {uz.common.sum}
              </p>
            </div>
          </div>

          <div
            className={`flex h-7 w-7 items-center justify-center rounded-lg bg-white/80 text-red-700 shadow-2xs transition-transform duration-200 ${
              isNewDebtorsOpen ? "rotate-180" : ""
            }`}
          >
            <ChevronDown size={18} />
          </div>
        </button>

        {isNewDebtorsOpen && (
          <div className="p-3.5 space-y-2.5 border-t border-red-100 animate-in fade-in duration-150">
            {newDebtorsList.length === 0 ? (
              <div className="py-6 text-center text-slate-400">
                <CheckCircle2
                  size={32}
                  className="mx-auto text-emerald-400 mb-1.5"
                />
                <p className="text-xs font-semibold text-slate-700">
                  Ushbu davrda yangi qarzdorlar qayd etilmagan
                </p>
                <p className="text-[11px] text-slate-400">
                  Barcha savdolarga to'lov qilingan yoki sochiqlar naqdga
                  topshirilgan.
                </p>
              </div>
            ) : (
              newDebtorsList.map((item) => {
                const addedDebt =
                  Number(item.newDebtAmount) ||
                  Math.max(
                    0,
                    (Number(item.newDebt) || 0) - (Number(item.oldDebt) || 0),
                  );

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-red-100 bg-red-50/40 p-3 space-y-2 hover:border-red-200 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {item.barberName || "Sartarosh"}
                          </h4>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs font-semibold text-slate-600 truncate flex items-center gap-1">
                            <Building2 size={12} className="text-slate-400" />
                            {item.barbershopName || "Sartaroshxona"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock size={11} className="text-slate-400" />
                            {item.date} {formatTime(item.createdAt)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <User size={11} className="text-slate-400" />
                            Xodim:{" "}
                            <strong className="text-slate-700">
                              {item.staffName || "Xodim"}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-red-600 uppercase tracking-wide">
                          Yangi qarz
                        </p>
                        <p className="text-base font-extrabold text-red-700">
                          +{addedDebt.toLocaleString()} {uz.common.sum}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg bg-white p-2.5 border border-red-100/80 text-xs space-y-1">
                      {Number(item.quantityDelivered) > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Yetkazilgan toza sochiq:</span>
                          <span className="font-bold text-slate-800">
                            {item.quantityDelivered} dona (
                            {Number(item.chargedAmount || 0).toLocaleString()}{" "}
                            so'm)
                          </span>
                        </div>
                      )}

                      {Number(item.returnedTowels) > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Qaytarilgan sochiq:</span>
                          <span className="font-bold text-sky-800">
                            {item.returnedTowels} dona
                          </span>
                        </div>
                      )}

                      {Number(item.totalPaid) > 0 && (
                        <div className="flex justify-between text-emerald-700 font-semibold">
                          <span>To'langan summa:</span>
                          <span>
                            {Number(item.totalPaid).toLocaleString()} so'm
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between border-t border-slate-100 pt-1 font-bold text-slate-700">
                        <span>Qarz dinamikasi:</span>
                        <span className="text-red-700">
                          {Number(item.oldDebt || 0).toLocaleString()} →{" "}
                          <strong>
                            {Number(item.newDebt || 0).toLocaleString()}{" "}
                            {uz.common.sum}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {item.note && (
                      <p className="text-[11px] italic text-slate-500 bg-white/70 px-2 py-1 rounded-md border border-slate-100">
                        "{item.note}"
                      </p>
                    )}

                    {item.barbershopId && item.barberId && (
                      <div className="pt-0.5 text-right">
                        <Link
                          to={`/sartaroshxonalar/${item.barbershopId}/barber/${item.barberId}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 hover:text-red-900 hover:underline"
                        >
                          <span>Sartarosh hisobini ko'rish</span>
                          <ChevronRight size={13} />
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 3. ACCORDION 2: QARZINI TO'LAGANLAR */}
      <div className="rounded-2xl border border-emerald-200 bg-white shadow-xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setIsDebtPayersOpen((prev) => !prev)}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50/80 to-teal-50/50 hover:bg-emerald-50 text-left transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-extrabold text-emerald-950">
                  Qarzini to'laganlar
                </h3>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                  {debtPayersList.length} ta
                </span>
              </div>
              <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                Jami to'langan summa: {totals.totalDebtPaid.toLocaleString()}{" "}
                {uz.common.sum}
              </p>
            </div>
          </div>

          <div
            className={`flex h-7 w-7 items-center justify-center rounded-lg bg-white/80 text-emerald-700 shadow-2xs transition-transform duration-200 ${
              isDebtPayersOpen ? "rotate-180" : ""
            }`}
          >
            <ChevronDown size={18} />
          </div>
        </button>

        {isDebtPayersOpen && (
          <div className="p-3.5 space-y-2.5 border-t border-emerald-100 animate-in fade-in duration-150">
            {debtPayersList.length === 0 ? (
              <div className="py-6 text-center text-slate-400">
                <Receipt size={32} className="mx-auto text-slate-300 mb-1.5" />
                <p className="text-xs font-semibold text-slate-700">
                  Ushbu davrda qarz to'lovlari qayd etilmagan
                </p>
              </div>
            ) : (
              debtPayersList.map((item) => {
                const paid =
                  Number(item.totalPaid) ||
                  Number(item.cashAmount || 0) + Number(item.cardAmount || 0);

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 space-y-2 hover:border-emerald-200 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {item.barberName || "Sartarosh"}
                          </h4>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs font-semibold text-slate-600 truncate flex items-center gap-1">
                            <Building2 size={12} className="text-slate-400" />
                            {item.barbershopName || "Sartaroshxona"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock size={11} className="text-slate-400" />
                            {item.date} {formatTime(item.createdAt)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <User size={11} className="text-slate-400" />
                            Xodim:{" "}
                            <strong className="text-slate-700">
                              {item.staffName || "Xodim"}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                          To'landi
                        </p>
                        <p className="text-base font-extrabold text-emerald-800">
                          {paid.toLocaleString()} {uz.common.sum}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] flex-wrap">
                      {Number(item.cashAmount) > 0 && (
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-bold text-emerald-900">
                          Naqd: {Number(item.cashAmount).toLocaleString()} so'm
                        </span>
                      )}
                      {Number(item.cardAmount) > 0 && (
                        <span className="rounded-md bg-sky-100 px-2 py-0.5 font-bold text-sky-900">
                          Click: {Number(item.cardAmount).toLocaleString()} so'm
                        </span>
                      )}
                      {Number(item.discount) > 0 && (
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 font-bold text-amber-900">
                          Chegirma: {Number(item.discount).toLocaleString()}{" "}
                          so'm
                        </span>
                      )}
                    </div>

                    <div className="rounded-lg bg-white p-2.5 border border-emerald-100/80 text-xs flex items-center justify-between font-bold">
                      <span className="text-slate-600">Qarz holati:</span>
                      {Number(item.newDebt) === 0 &&
                      Number(item.oldDebt) > 0 ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <span>
                            {Number(item.oldDebt).toLocaleString()} so'm →
                          </span>
                          <span className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded text-[11px]">
                            Qarz to'liq yopildi 🎉
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-800">
                          {Number(item.oldDebt || 0).toLocaleString()} →{" "}
                          <span className="text-emerald-800">
                            {Number(item.newDebt || 0).toLocaleString()}{" "}
                            {uz.common.sum}
                          </span>
                        </span>
                      )}
                    </div>

                    {item.note && (
                      <p className="text-[11px] italic text-slate-500 bg-white/70 px-2 py-1 rounded-md border border-slate-100">
                        "{item.note}"
                      </p>
                    )}

                    {item.barbershopId && item.barberId && (
                      <div className="pt-0.5 text-right">
                        <Link
                          to={`/sartaroshxonalar/${item.barbershopId}/barber/${item.barberId}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
                        >
                          <span>Sartarosh hisobini ko'rish</span>
                          <ChevronRight size={13} />
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 4. ACCORDION 3: BARCHA AMALLAR XRONOLOGIYASI */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setIsAllLogsOpen((prev) => !prev)}
          className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 text-left transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-700 text-white shadow-xs">
              <Receipt size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Barcha amallar jurnali
                </h3>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                  {filteredByDateLogs.length} ta
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tanlangan davrdagi har bir amaliyotning batafsil xronologiyasi
              </p>
            </div>
          </div>

          <div
            className={`flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-600 shadow-2xs transition-transform duration-200 ${
              isAllLogsOpen ? "rotate-180" : ""
            }`}
          >
            <ChevronDown size={18} />
          </div>
        </button>

        {isAllLogsOpen && (
          <div className="p-3.5 space-y-2 border-t border-slate-200 animate-in fade-in duration-150">
            {filteredByDateLogs.length === 0 ? (
              <p className="text-center py-4 text-xs text-slate-400 font-medium">
                Ushbu davrda amallar qayd etilmagan.
              </p>
            ) : (
              filteredByDateLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-slate-900 truncate">
                      {log.barberName}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {log.barbershopName} • {log.staffName}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {log.date} {formatTime(log.createdAt)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    {Number(log.totalPaid) > 0 && (
                      <p className="font-extrabold text-emerald-700">
                        +{Number(log.totalPaid).toLocaleString()}{" "}
                        {uz.common.sum}
                      </p>
                    )}
                    {Number(log.newDebtAmount) > 0 && (
                      <p className="font-bold text-red-600 text-[11px]">
                        Qarz: +{Number(log.newDebtAmount).toLocaleString()}
                      </p>
                    )}
                    {Number(log.quantityDelivered) > 0 && (
                      <p className="text-[10px] text-slate-500">
                        {log.quantityDelivered} dona toza
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
