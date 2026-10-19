import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  DollarSign,
  Package,
  Phone,
  Scissors,
  Settings,
} from "../components/icons";

import { BarberModal } from "../components/BarberModal";
import { BarberPaymentModal } from "../components/BarberPaymentModal";
import { CONTRACT_TYPES } from "../constants/models";
import { ROLES } from "../constants/roles";
import { useHeader } from "../context/HeaderContext";
import { uz } from "../i18n/uz";
import {
  createSale,
  deleteBarberCascade,
  recordBarberPayment,
  updateBarber,
} from "../services/firestoreService";
import { notifyAdminSafe } from "../services/pushService";
import { formatPhoneDisplay } from "../utils/auth";

export function BarberDetailsPage({
  role,
  userId,
  userProfile,
  barbershops = [],
  barbers = [],
  sales = [],
}) {
  const { shopId, barberId } = useParams();
  const navigate = useNavigate();
  const isAdmin = role === ROLES.ADMIN;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  // Sale modal state ("Sotish")
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [deliveryQty, setDeliveryQty] = useState("");
  const [returnQty, setReturnQty] = useState("");
  const [saleNote, setSaleNote] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [cardAmount, setCardAmount] = useState("");
  const [discount, setDiscount] = useState("");
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

  // Computed Stats for this Barber
  const stats = useMemo(() => {
    let totalDelivered = 0;
    let totalReturned = 0;
    let totalSalesSum = 0;

    barberSales.forEach((s) => {
      totalDelivered += Number(s.quantityDelivered) || 0;
      totalReturned += Number(s.returnedTowels) || 0;
      totalSalesSum += Number(s.totalPrice) || 0;
    });

    const heldTowels = Math.max(
      0,
      (Number(currentBarber?.initialTowels) || 0) +
        totalDelivered -
        totalReturned,
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

  // Header configuration
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

  // Handle Sale Modal ("Sotish")
  const handleOpenSale = () => {
    setDeliveryQty("");
    setReturnQty("");
    setSaleNote("");
    setCashAmount("");
    setCardAmount("");
    setDiscount("");
    setIsSaleModalOpen(true);
  };

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    const deliveredQuantity = Number(deliveryQty) || 0;
    const returnedQuantity = Number(returnQty) || 0;
    const cash = Number(cashAmount) || 0;
    const card = Number(cardAmount) || 0;
    const disc = Number(discount) || 0;
    const totalCredit = cash + card + disc;

    if (deliveredQuantity <= 0 && returnedQuantity <= 0 && totalCredit <= 0) {
      return;
    }

    setSaleSubmitting(true);
    const staffName = userProfile?.name || (isAdmin ? "Admin" : "Xodim");
    const barberName = currentBarber.name;
    const unitPrice = currentBarber.pricePerTowel || 3000;
    const totalPrice = deliveredQuantity * unitPrice;

    try {
      await createSale({
        barberId: currentBarber.id,
        barbershopId: currentBarber.barbershopId,
        staffId: userId,
        staffName,
        barberName,
        barbershopName: currentShop?.name || "",
        quantityDelivered: deliveredQuantity,
        returnedTowels: returnedQuantity,
        unitPrice,
        contractType: currentBarber.contractType,
        cashAmount: cash,
        cardAmount: card,
        discount: disc,
        note: saleNote,
      });

      // Dispatch push notification to admins if staff performed this action
      if (!isAdmin) {
        if (deliveredQuantity > 0 && returnedQuantity > 0) {
          notifyAdminSafe(
            uz.notifications.titles.deliveryAndReturn,
            uz.notifications.pushDeliveryAndReturn(
              staffName,
              barberName,
              deliveredQuantity,
              returnedQuantity,
              totalPrice,
            ),
          );
        } else if (deliveredQuantity > 0) {
          notifyAdminSafe(
            uz.notifications.titles.delivery,
            uz.notifications.pushDelivery(
              staffName,
              barberName,
              deliveredQuantity,
              totalPrice,
            ),
          );
        } else if (returnedQuantity > 0) {
          notifyAdminSafe(
            uz.notifications.titles.return,
            uz.notifications.pushReturn(staffName, barberName, returnedQuantity),
          );
        } else if (totalCredit > 0) {
          notifyAdminSafe(
            uz.notifications.titles.payment,
            uz.notifications.pushPayment(
              staffName,
              barberName,
              totalCredit,
              cash,
              card,
              disc,
            ),
          );
        }
      }

      setIsSaleModalOpen(false);
      showToast(
        deliveredQuantity <= 0 && returnedQuantity <= 0
          ? uz.barberDetails.paymentSuccess
          : deliveredQuantity > 0 && returnedQuantity > 0
            ? uz.common.success
            : deliveredQuantity > 0
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

  const handlePaymentSubmit = async (paymentData) => {
    const staffName = userProfile?.name || (isAdmin ? "Admin" : "Xodim");
    const barberName = currentBarber.name;
    const cash = Number(paymentData.cashAmount) || 0;
    const card = Number(paymentData.cardAmount) || 0;
    const disc = Number(paymentData.discount) || 0;
    const totalCredit = cash + card + disc;

    await recordBarberPayment({
      ...paymentData,
      barberId: currentBarber.id,
      barberName,
      barbershopId: currentBarber.barbershopId,
      barbershopName: currentShop?.name || "",
      staffId: userId,
      staffName,
    });

    if (!isAdmin && totalCredit > 0) {
      notifyAdminSafe(
        uz.notifications.titles.payment,
        uz.notifications.pushPayment(
          staffName,
          barberName,
          totalCredit,
          cash,
          card,
          disc,
        ),
      );
    }

    showToast(uz.barberDetails.paymentSuccess);
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

        {/* Quick action buttons: Sotish (Delivery/Return) & To'lov qabul qilish */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleOpenSale}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-3 py-2.5 text-xs font-bold text-white shadow-xs hover:from-emerald-700 hover:to-emerald-800 active:scale-98 transition-all"
          >
            <Package size={15} />
            {uz.barberDetails.saleBtn}
          </button>
          <button
            type="button"
            onClick={() => setIsPaymentModalOpen(true)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-800 shadow-xs hover:bg-emerald-100 active:scale-98 transition-all"
          >
            <DollarSign size={15} />
            {uz.barberDetails.settlePaymentBtn}
          </button>
        </div>
      </div>

      {/* Section 2: "Statistikalar" (Stats) */}
      <div className="space-y-3">
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
            {uz.barberDetails.recentTransactions} ({barberSales.length})
          </h4>

          {barberSales.length === 0 ? (
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
                        {Number(s.quantityDelivered) > 0 &&
                          `+${s.quantityDelivered} dona toza sochiq`}
                        {Number(s.returnedTowels) > 0 && (
                          <span className="block text-sky-700">
                            -{s.returnedTowels} dona qaytarildi
                          </span>
                        )}
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
            </div>
          )}
        </div>
      </div>

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

            <form onSubmit={handleSaleSubmit} className="mt-4 space-y-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {uz.barberDetails.deliveryQtyLabel}
                </label>
                <input
                  type="number"
                  min="1"
                  autoFocus
                  value={deliveryQty}
                  onChange={(e) => setDeliveryQty(e.target.value)}
                  placeholder="Masalan: 30"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
                {Number(deliveryQty) > 0 && (
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
                )}
              </div>

              <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {uz.barberDetails.returnQtyLabel}
                </label>
                <input
                  type="number"
                  min="1"
                  value={returnQty}
                  onChange={(e) => setReturnQty(e.target.value)}
                  placeholder="Masalan: 25"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base font-bold outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                />
                {currentBarber.contractType === CONTRACT_TYPES.PAY_FOR_USED &&
                  Number(returnQty) > 0 && (
                    <>
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
                    </>
                  )}
              </div>

              {/* Payment inputs: Naqd, Click, Chegirma */}
              <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <p className="text-xs font-bold text-slate-800">
                  To'lov qabul qilish (ixtiyoriy)
                </p>

                {/* Naqd */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Naqd pul (so'm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    placeholder="Masalan: 50000"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Click / Karta */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Click / Karta (so'm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={cardAmount}
                    onChange={(e) => setCardAmount(e.target.value)}
                    placeholder="Masalan: 30000"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-sky-500"
                  />
                </div>

                {/* Chegirma */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Chegirma (so'm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="Masalan: 5000"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-amber-500"
                  />
                </div>

                {/* Live total payment summary */}
                {(Number(cashAmount) > 0 ||
                  Number(cardAmount) > 0 ||
                  Number(discount) > 0) && (
                  <div className="pt-2 border-t border-slate-200 text-[11px] space-y-1">
                    <div className="flex justify-between font-semibold text-slate-700">
                      <span>Jami to'lov (Naqd + Click):</span>
                      <span>
                        {(
                          (Number(cashAmount) || 0) + (Number(cardAmount) || 0)
                        ).toLocaleString()}{" "}
                        {uz.common.sum}
                      </span>
                    </div>
                    {Number(discount) > 0 && (
                      <div className="flex justify-between font-semibold text-amber-800">
                        <span>Chegirma:</span>
                        <span>
                          {(Number(discount) || 0).toLocaleString()}{" "}
                          {uz.common.sum}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-emerald-800 pt-1 border-t border-slate-200">
                      <span>Qarzdan chegiriladi:</span>
                      <span>
                        {(
                          (Number(cashAmount) || 0) +
                          (Number(cardAmount) || 0) +
                          (Number(discount) || 0)
                        ).toLocaleString()}{" "}
                        {uz.common.sum}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {uz.barberDetails.noteLabel}
                </label>
                <input
                  type="text"
                  value={saleNote}
                  onChange={(e) => setSaleNote(e.target.value)}
                  placeholder="Ixtiyoriy izoh..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-emerald-500"
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
                    (!deliveryQty &&
                      !returnQty &&
                      !cashAmount &&
                      !cardAmount &&
                      !discount)
                  }
                  className="rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saleSubmitting ? uz.common.loading : uz.common.confirm}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Standalone Barber Payment Modal */}
      {isPaymentModalOpen && (
        <BarberPaymentModal
          barber={currentBarber}
          onSave={handlePaymentSubmit}
          onClose={() => setIsPaymentModalOpen(false)}
        />
      )}

      {/* Edit Barber Modal (available to both admin and staff) */}
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
