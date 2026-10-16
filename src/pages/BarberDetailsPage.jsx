import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  Package,
  RotateCcw,
  Phone,
  Scissors,
  Settings,
} from "../components/icons";

import { BarberModal } from "../components/BarberModal";
import { CONTRACT_TYPES } from "../constants/models";
import { ROLES } from "../constants/roles";
import { useHeader } from "../context/HeaderContext";
import { uz } from "../i18n/uz";
import {
  createReturn,
  createSale,
  deleteBarberCascade,
  recordBarberPayment,
  updateBarber,
} from "../services/firestoreService";
import { formatPhoneDisplay } from "../utils/auth";

export function BarberDetailsPage({
  role,
  userId,
  userProfile,
  barbershops = [],
  barbers = [],
  sales = [],
  returns = [],
}) {
  const { shopId, barberId } = useParams();
  const navigate = useNavigate();
  const isAdmin = role === ROLES.ADMIN;

  const [activeTab, setActiveTab] = useState("info"); // 'info' | 'stats'
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // Sale modal state ("Sotish")
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleType, setSaleType] = useState("delivery");
  const [deliveryQty, setDeliveryQty] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [returnQty, setReturnQty] = useState("");
  const [returnNote, setReturnNote] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [saleSubmitting, setSaleSubmitting] = useState(false);

  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

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

  // Barber sales & returns
  const barberSales = useMemo(() => {
    return sales.filter((s) => s.barberId === barberId);
  }, [sales, barberId]);

  const barberReturns = useMemo(() => {
    return returns.filter((r) => r.barberId === barberId);
  }, [returns, barberId]);

  // Computed Stats for this Barber
  const stats = useMemo(() => {
    let totalDelivered = 0;
    let totalReturned = 0;
    let totalSalesSum = 0;

    barberSales.forEach((s) => {
      totalDelivered += Number(s.quantityDelivered) || 0;
      totalSalesSum += Number(s.totalPrice) || 0;
    });

    barberReturns.forEach((r) => {
      totalReturned += Number(r.quantityReturned) || 0;
    });

    const heldTowels = Math.max(0, totalDelivered - totalReturned);
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
  }, [barberSales, barberReturns, currentBarber]);

  // Header configuration
  useHeader(
    {
      title: currentBarber ? currentBarber.name : uz.barberDetails.title,
      subtitle: currentShop ? currentShop.name : null,
      showBack: true,
      backTo: `/sartaroshxonalar/${shopId}`,
      actions: isAdmin ? (
        <button
          type="button"
          onClick={() => setIsEditModalOpen(true)}
          title={uz.barberDetails.editBarber}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition-all"
        >
          <Settings size={16} />
        </button>
      ) : null,
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

  // Handle Sale Modal ("Sotish")
  const handleOpenSale = () => {
    setSaleType("delivery");
    setDeliveryQty("");
    setDeliveryNote("");
    setReturnQty("");
    setReturnNote("");
    setPaymentAmount("");
    setIsSaleModalOpen(true);
  };

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    const quantity = Number(saleType === "delivery" ? deliveryQty : returnQty);
    const payment = Number(paymentAmount);
    if ((!quantity || quantity <= 0) && (!payment || payment <= 0)) return;

    setSaleSubmitting(true);
    try {
      if (quantity > 0 && saleType === "delivery") {
        await createSale({
          barberId: currentBarber.id,
          barbershopId: currentBarber.barbershopId,
          staffId: userId,
          staffName: userProfile?.name || (isAdmin ? "Admin" : "Xodim"),
          barberName: currentBarber.name,
          barbershopName: currentShop?.name || "",
          quantityDelivered: quantity,
          unitPrice: currentBarber.pricePerTowel || 3000,
          contractType: currentBarber.contractType,
          note: deliveryNote,
        });
      } else if (quantity > 0) {
        await createReturn({
          barberId: currentBarber.id,
          barbershopId: currentBarber.barbershopId,
          staffId: userId,
          staffName: userProfile?.name || (isAdmin ? "Admin" : "Xodim"),
          barberName: currentBarber.name,
          barbershopName: currentShop?.name || "",
          quantityReturned: quantity,
          note: returnNote,
        });
      }

      if (payment > 0) {
        await recordBarberPayment(currentBarber.id, payment);
      }

      setIsSaleModalOpen(false);
      showToast(
        quantity <= 0
          ? uz.barberDetails.paymentSuccess
          : saleType === "delivery"
          ? uz.barberDetails.deliverySuccess
          : uz.barberDetails.returnSuccess,
      );
    } catch (err) {
      console.error("Sale action error:", err);
      alert(uz.common.error);
    } finally {
      setSaleSubmitting(false);
    }
  };

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
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-emerald-300 bg-white px-4 py-2.5 shadow-xl animate-in slide-in-from-top-2 duration-150 flex items-center gap-2 text-xs font-bold text-emerald-800">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Barber Quick Summary */}
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

        {/* Unified sale action: use it once for delivery and again when towels are returned */}
        <div className="mt-4">
          <button
            type="button"
            onClick={handleOpenSale}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-3 py-3 text-xs font-bold text-white shadow-xs hover:from-emerald-700 hover:to-emerald-800 active:scale-98 transition-all"
          >
            <Package size={16} />
            {uz.barberDetails.saleBtn}
          </button>
        </div>
      </div>

      {/* Tabs: "Ma'lumotlar" (Information) & "Statistikalar" (Stats) */}
      <div className="grid grid-cols-2 rounded-xl bg-slate-200/70 p-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab("info")}
          className={`rounded-lg py-2 transition-all ${
            activeTab === "info"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {uz.barberDetails.infoSection}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("stats")}
          className={`rounded-lg py-2 transition-all ${
            activeTab === "stats"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {uz.barberDetails.statsSection}
        </button>
      </div>

      {/* Section 1: "Ma'lumotlar" (Information) */}
      {activeTab === "info" && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Mijoz profili va shartnomasi
            </h3>

            <div className="space-y-2.5 text-xs divide-y divide-slate-100">
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500">
                  {uz.barberDetails.barbershop}
                </span>
                <span className="font-bold text-slate-800">
                  {currentShop?.name || "—"}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500">{uz.barberDetails.phone}</span>
                <span className="font-mono font-bold text-slate-800">
                  {currentBarber.phone
                    ? `+998 ${formatPhoneDisplay(currentBarber.phone)}`
                    : "Kiritilmagan"}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500">
                  {uz.barberDetails.pricePerTowel}
                </span>
                <span className="font-bold text-emerald-700">
                  {(currentBarber.pricePerTowel || 3000).toLocaleString()}{" "}
                  {uz.common.sum}
                </span>
              </div>

              <div className="pt-2">
                <span className="text-slate-500 block mb-1">
                  {uz.barberDetails.contractType}
                </span>
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                  <span className="font-bold text-slate-900 block">
                    {currentBarber.contractType === CONTRACT_TYPES.PAY_FOR_USED
                      ? uz.contractTypes.payForUsed
                      : uz.contractTypes.payForTaken}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    {currentBarber.contractType === CONTRACT_TYPES.PAY_FOR_USED
                      ? uz.contractTypes.payForUsedDesc
                      : uz.contractTypes.payForTakenDesc}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Section 2: "Statistikalar" (Stats) */}
      {activeTab === "stats" && (
        <div className="space-y-3 animate-in fade-in duration-150">
          {/* Main 3 Balance Cards */}
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

          {/* Circulation Volumes */}
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

          {/* Recent transactions for this barber */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
            <h4 className="text-xs font-bold text-slate-900 mb-2.5">
              {uz.barberDetails.recentTransactions} (
              {barberSales.length + barberReturns.length})
            </h4>

            {barberSales.length === 0 && barberReturns.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                {uz.barberDetails.noTransactions}
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {barberSales.slice(0, 10).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                        <Package size={14} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">
                          +{s.quantityDelivered} dona toza sochiq
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Xodim: {s.staffName || "Xodim"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-700">
                        {Number(s.totalPrice || 0).toLocaleString()}{" "}
                        {uz.common.sum}
                      </p>
                    </div>
                  </div>
                ))}

                {barberReturns.slice(0, 5).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                        <RotateCcw size={14} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">
                          -{r.quantityReturned} dona ishlatilgan sochiq
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Xodim: {r.staffName || "Xodim"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-semibold text-sky-700">
                        Qaytarim
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Unified Sale Modal ("Sotish") */}
      {isSaleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Package size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {uz.barberDetails.saleTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSaleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setSaleType("delivery")}
                className={`rounded-lg py-2 transition-all ${
                  saleType === "delivery"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-slate-600"
                }`}
              >
                {uz.barberDetails.giveTowels}
              </button>
              <button
                type="button"
                onClick={() => setSaleType("return")}
                className={`rounded-lg py-2 transition-all ${
                  saleType === "return"
                    ? "bg-white text-sky-700 shadow-xs"
                    : "text-slate-600"
                }`}
              >
                {uz.barberDetails.receiveTowels}
              </button>
            </div>

            <form onSubmit={handleSaleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {saleType === "delivery"
                    ? uz.barberDetails.deliveryQtyLabel
                    : uz.barberDetails.returnQtyLabel}{" "}
                  *
                </label>
                <input
                  type="number"
                  min="1"
                  autoFocus
                  value={saleType === "delivery" ? deliveryQty : returnQty}
                  onChange={(e) =>
                    saleType === "delivery"
                      ? setDeliveryQty(e.target.value)
                      : setReturnQty(e.target.value)
                  }
                  placeholder={saleType === "delivery" ? "Masalan: 30" : "Masalan: 25"}
                  className={`w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-base font-bold outline-none ${
                    saleType === "delivery"
                      ? "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                      : "focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                  }`}
                />
              </div>

              {saleType === "delivery" && Number(deliveryQty) > 0 && (
                <div className="rounded-xl bg-emerald-50/80 p-3 border border-emerald-200 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-800 font-medium">
                      {uz.barberDetails.totalAmountLabel}:
                    </span>
                    <span className="text-sm font-extrabold text-emerald-950">
                      {(
                        Number(deliveryQty) *
                        (currentBarber.pricePerTowel || 3000)
                      ).toLocaleString()}{" "}
                      {uz.common.sum}
                    </span>
                  </div>
                </div>
              )}

              {saleType === "return" &&
                currentBarber.contractType === CONTRACT_TYPES.PAY_FOR_USED &&
                Number(returnQty) > 0 && (
                  <div className="rounded-xl bg-sky-50/80 p-3 border border-sky-200 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-sky-800 font-medium">
                        Hisob-kitob summasi:
                      </span>
                      <span className="text-sm font-extrabold text-sky-950">
                        {(
                          Number(returnQty) *
                          (currentBarber.pricePerTowel || 3000)
                        ).toLocaleString()}{" "}
                        {uz.common.sum}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-sky-700">
                      Ishlatilgan sochiqlar bo'yicha to'lov sartarosh hisobiga
                      yoziladi.
                    </p>
                  </div>
                )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {uz.barberDetails.paymentAmountLabel}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Masalan: 50000"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">
                    {uz.common.sum}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {uz.barberDetails.noteLabel}
                </label>
                <input
                  type="text"
                  value={saleType === "delivery" ? deliveryNote : returnNote}
                  onChange={(e) =>
                    saleType === "delivery"
                      ? setDeliveryNote(e.target.value)
                      : setReturnNote(e.target.value)
                  }
                  placeholder="Ixtiyoriy izoh..."
                  className={`w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none ${
                    saleType === "delivery"
                      ? "focus:border-emerald-500"
                      : "focus:border-sky-500"
                  }`}
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSaleModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {uz.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={
                    saleSubmitting ||
                    (!(saleType === "delivery" ? deliveryQty : returnQty) &&
                      !paymentAmount)
                  }
                  className={`rounded-xl py-2.5 text-xs font-bold text-white shadow-xs disabled:opacity-60 ${
                    saleType === "delivery"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-sky-600 hover:bg-sky-700"
                  }`}
                >
                  {saleSubmitting ? uz.common.loading : uz.common.confirm}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Edit Barber Modal (with delete confirmation) */}
      {isEditModalOpen && (
        <BarberModal
          barber={currentBarber}
          barbershops={barbershops}
          onSave={handleUpdateBarber}
          onDelete={handleDeleteBarber}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

    </div>
  );
}
