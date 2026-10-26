import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  Package,
  Phone,
  Receipt,
  Scissors,
  Settings,
} from "../components/icons";

import { BarberModal } from "../components/BarberModal";
import { CONTRACT_TYPES } from "../constants/models";
import { ROLES } from "../constants/roles";
import { useHeader } from "../context/HeaderContext";
import { uz } from "../i18n/uz";
import {
  deleteBarberCascade,
  updateBarber,
} from "../services/firestoreService";
import { formatPhoneDisplay } from "../utils/auth";

function formatDateTime(ts, fallbackDate) {
  if (!ts) {
    if (fallbackDate) {
      const parts = fallbackDate.split("-");
      if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
      return fallbackDate;
    }
    return "";
  }
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d.getTime())) {
    if (fallbackDate) {
      const parts = fallbackDate.split("-");
      if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
      return fallbackDate;
    }
    return "";
  }
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${day}.${month}.${year}, ${hours}:${minutes}`;
}

export function BarberDetailsPage({
  role,
  barbershops = [],
  barbers = [],
  sales = [],
}) {
  const { shopId, barberId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = role === ROLES.ADMIN;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    if (location.state?.toast) {
      showToast(location.state.toast);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const currentBarber = useMemo(() => {
    return barbers.find((b) => b.id === barberId);
  }, [barbers, barberId]);

  const currentShop = useMemo(() => {
    return (
      barbershops.find((s) => s.id === shopId) ||
      (currentBarber
        ? barbershops.find((s) => s.id === currentBarber.barbershopId)
        : null)
    );
  }, [barbershops, shopId, currentBarber]);

  // Barber sales & returns (sorted newest first)
  const barberSales = useMemo(() => {
    return sales
      .filter((s) => s.barberId === barberId)
      .sort((a, b) => {
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
  }, [sales, barberId]);

  // Computed Stats for this Barber (combines embedded barber counters with recent sales)
  const stats = useMemo(() => {
    let recentDelivered = 0;
    let recentReturned = 0;
    let recentSalesSum = 0;

    barberSales.forEach((s) => {
      recentDelivered += Number(s.quantityDelivered) || 0;
      recentReturned += Number(s.returnedTowels) || 0;
      recentSalesSum += Number(s.totalPrice) || 0;
    });

    const totalDelivered = Math.max(
      recentDelivered,
      Number(currentBarber?.totalDelivered || 0),
    );
    const totalReturned = Math.max(
      recentReturned,
      Number(currentBarber?.totalReturned || 0),
    );
    const totalSalesSum = Math.max(
      recentSalesSum,
      Number(currentBarber?.totalSalesSum || 0),
    );

    const heldTowels = Number(
      currentBarber?.towelsCount !== undefined
        ? currentBarber.towelsCount
        : currentBarber?.initialTowels || 0,
    );
    const currentDebt = Number(currentBarber?.debt) || 0;
    const overpaidBalance = Number(currentBarber?.overpaid) || 0;

    return {
      heldTowels,
      totalDelivered,
      totalReturned,
      totalSalesSum,
      currentDebt,
      overpaidBalance,
    };
  }, [barberSales, currentBarber]);

  useHeader(
    {
      title: currentBarber ? currentBarber.name : uz.barberDetails.title,
      subtitle: currentShop ? currentShop.name : null,
      showBack: true,
      backTo: `/sartaroshxonalar/${shopId}`,
      actions: (
        <button
          type="button"
          onClick={() => setIsEditModalOpen(true)}
          title={uz.barberDetails.editBarber}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition-all"
        >
          <Settings size={16} />
        </button>
      ),
    },
    [currentBarber, currentShop, shopId, isAdmin],
  );

  if (!currentBarber) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <Scissors size={32} className="mx-auto text-slate-300 mb-2" />
        <p className="text-sm font-bold text-slate-800">Sartarosh topilmadi</p>
        <button
          type="button"
          onClick={() => navigate(`/sartaroshxonalar/${shopId}`)}
          className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs"
        >
          {uz.barberDetails.backToShop}
        </button>
      </div>
    );
  }

  const handleUpdateBarber = async (data) => {
    await updateBarber(currentBarber.id, data);
    showToast(uz.common.success);
  };

  const handleDeleteBarber = async (id) => {
    await deleteBarberCascade(id);
    navigate(`/sartaroshxonalar/${shopId}`, { replace: true });
  };

  return (
    <div className="space-y-4 pb-8">
      {toastMessage && (
        <div className="fixed top-16 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-emerald-300 bg-white px-4 py-2.5 shadow-xl animate-in slide-in-from-top-2 duration-150 flex items-center gap-2 text-xs font-bold text-emerald-800">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900">
                {currentBarber.name}
              </h2>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  currentBarber.contractType === CONTRACT_TYPES.PAY_FOR_USED
                    ? "bg-sky-50 text-sky-700 border border-sky-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {currentBarber.contractType === CONTRACT_TYPES.PAY_FOR_USED
                  ? "Ishlatilgan sochiqqa"
                  : "Olingan sochiqqa"}
              </span>
            </div>
            {currentShop && (
              <p className="text-xs text-slate-500 mt-0.5">
                {currentShop.name}
              </p>
            )}
            <p className="mt-1 text-xs font-semibold text-emerald-700">
              Bir dona: {(currentBarber.pricePerTowel || 3000).toLocaleString()}{" "}
              {uz.common.sum}
            </p>
            {currentBarber.phone && (
              <a
                href={`tel:${currentBarber.phone}`}
                className="mt-1 inline-flex items-center gap-1 font-mono text-xs font-semibold text-emerald-700 hover:underline"
              >
                <Phone size={12} />
                +998 {formatPhoneDisplay(currentBarber.phone)}
              </a>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center">
          <button
            type="button"
            onClick={() =>
              navigate(`/sartaroshxonalar/${shopId}/barber/${barberId}/sale`)
            }
            className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Package size={15} />
            {uz.barberDetails.saleBtn}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3 text-center">
            <span className="block text-[10px] text-emerald-800 font-bold">
              {uz.barberDetails.heldTowels}
            </span>
            <span className="text-lg font-extrabold text-emerald-950 block mt-0.5">
              {stats.heldTowels}
            </span>
            <span className="text-[10px] text-emerald-700">dona</span>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50/80 p-3 text-center">
            <span className="block text-[10px] text-red-700 font-bold">
              {uz.barberDetails.currentDebt}
            </span>
            <span className="text-sm font-extrabold text-red-950 block mt-0.5 truncate">
              {stats.currentDebt.toLocaleString()}
            </span>
            <span className="text-[10px] text-red-600">so'm</span>
          </div>

          <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-3 text-center">
            <span className="block text-[10px] text-sky-700 font-bold">
              {uz.barberDetails.overpaidBalance.replace(" (Haqdorlik)", "")}
            </span>
            <span className="text-sm font-extrabold text-sky-950 block mt-0.5 truncate">
              {stats.overpaidBalance.toLocaleString()}
            </span>
            <span className="text-[10px] text-sky-600">so'm</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs divide-y divide-slate-100 text-xs">
          <div className="flex items-center justify-between pb-2">
            <span className="text-slate-500">
              {uz.barberDetails.totalDelivered}
            </span>
            <span className="font-bold text-slate-800">
              {stats.totalDelivered} dona
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-slate-500">
              {uz.barberDetails.totalReturned}
            </span>
            <span className="font-bold text-slate-800">
              {stats.totalReturned} dona
            </span>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-slate-500">
              {uz.barberDetails.totalSalesVolume}
            </span>
            <span className="font-bold text-emerald-700">
              {stats.totalSalesSum.toLocaleString()} {uz.common.sum}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
          <h4 className="text-xs font-bold text-slate-900 mb-2.5">
            {uz.barberDetails.recentTransactions} ({barberSales.length})
          </h4>

          {barberSales.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              {uz.barberDetails.noTransactions}
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {barberSales.slice(0, 15).map((s) => {
                const qtyDelivered = Number(s.quantityDelivered) || 0;
                const qtyReturned = Number(s.returnedTowels) || 0;
                const chargedPrice = Number(s.totalPrice) || 0;
                const cash = Number(s.cashAmount) || 0;
                const card = Number(s.cardAmount) || 0;
                const disc = Number(s.discount) || 0;
                const totalCredit = (Number(s.totalPaid) || cash + card) + disc;

                const isPaymentOnly = qtyDelivered === 0 && qtyReturned === 0;

                if (isPaymentOnly) {
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-xl bg-emerald-50/70 border border-emerald-100 p-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-2xs">
                          <Receipt size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-emerald-950">
                              To'lov qilish
                            </span>
                            <span className="rounded bg-emerald-200/80 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-900">
                              Qarz to'lovi
                            </span>
                          </div>
                          {s.note && (
                            <p className="text-[10px] text-slate-500 italic truncate max-w-xs mt-0.5">
                              "{s.note}"
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5 flex-wrap">
                            <span className="flex items-center gap-1 font-semibold text-slate-600">
                              <Clock size={10} className="text-slate-400" />
                              {formatDateTime(s.createdAt, s.date)}
                            </span>
                            <span>•</span>
                            <span>
                              Xodim:{" "}
                              <strong className="text-slate-700">
                                {s.staffName || "Xodim"}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-extrabold text-emerald-700 text-sm">
                          +{totalCredit.toLocaleString()} {uz.common.sum}
                        </p>
                        {card > 0 && cash > 0 ? (
                          <p className="text-[9px] text-slate-500">
                            Naqd: {cash.toLocaleString()} • Click:{" "}
                            {card.toLocaleString()}
                          </p>
                        ) : card > 0 ? (
                          <p className="text-[9px] text-sky-700 font-semibold">
                            Click / Karta
                          </p>
                        ) : (
                          <p className="text-[9px] text-emerald-800 font-semibold">
                            Naqd pul
                          </p>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-xs hover:bg-slate-100/70 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700">
                        <Package size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800">
                          {qtyDelivered > 0 && (
                            <span>+{qtyDelivered} dona toza sochiq</span>
                          )}
                          {qtyReturned > 0 && (
                            <span
                              className={`block text-sky-700 ${
                                qtyDelivered > 0
                                  ? "text-[11px] font-semibold"
                                  : ""
                              }`}
                            >
                              -{qtyReturned} dona qaytarildi
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5 flex-wrap">
                          <span className="flex items-center gap-1 font-semibold text-slate-600">
                            <Clock size={10} className="text-slate-400" />
                            {formatDateTime(s.createdAt, s.date)}
                          </span>
                          <span>•</span>
                          <span>
                            Xodim:{" "}
                            <strong className="text-slate-700">
                              {s.staffName || "Xodim"}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-slate-900 text-sm">
                        {chargedPrice.toLocaleString()} {uz.common.sum}
                      </p>
                      {totalCredit === 0 && chargedPrice > 0 ? (
                        <span className="inline-block rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700">
                          To'lanmagan (Qarz)
                        </span>
                      ) : totalCredit >= chargedPrice && chargedPrice > 0 ? (
                        <span className="inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                          To'langan
                        </span>
                      ) : totalCredit > 0 && totalCredit < chargedPrice ? (
                        <span className="inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                          To'landi: {totalCredit.toLocaleString()}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {isEditModalOpen && (
        <BarberModal
          barber={currentBarber}
          barbershops={barbershops}
          isAdmin={isAdmin}
          onSave={handleUpdateBarber}
          onDelete={handleDeleteBarber}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </div>
  );
}
