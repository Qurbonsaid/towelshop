import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Edit,
  Package,
  Scissors,
  User,
} from "../components/icons";
import { SaleEditModal } from "../components/SaleEditModal";
import { CONTRACT_TYPES } from "../constants/models";
import { uz } from "../i18n/uz";
import {
  createSale,
  listBarbersByBarbershop,
  subscribeBarbershops,
  subscribeStaffSales,
  updateSale,
} from "../services/firestoreService";

export function StaffDashboard({ userId, userProfile }) {
  // Barbershops & Barbers
  const [barbershops, setBarbershops] = useState([]);
  const [barbers, setBarbers] = useState([]);

  // Form State - Single unified window
  const [selectedShopId, setSelectedShopId] = useState("");
  const [selectedBarberId, setSelectedBarberId] = useState("");
  const [quantityDelivered, setQuantityDelivered] = useState("");
  const [returnedTowels, setReturnedTowels] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [cardAmount, setCardAmount] = useState("");
  const [discount, setDiscount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // History & Edit
  const [staffSales, setStaffSales] = useState([]);
  const [editingSale, setEditingSale] = useState(null);

  // Load Barbershops
  useEffect(() => {
    const unsub = subscribeBarbershops(setBarbershops);
    return () => unsub();
  }, []);

  // Handle shop change
  const handleShopChange = (shopId) => {
    setSelectedShopId(shopId);
    if (!shopId) {
      setBarbers([]);
      setSelectedBarberId("");
    }
  };

  // Load Barbers when shop changes
  useEffect(() => {
    if (!selectedShopId) return;
    let active = true;
    listBarbersByBarbershop(selectedShopId).then((items) => {
      if (!active) return;
      setBarbers(items);
      if (items.length > 0) {
        setSelectedBarberId(items[0].id);
      } else {
        setSelectedBarberId("");
      }
    });
    return () => {
      active = false;
    };
  }, [selectedShopId]);

  // Subscriptions for staff's recent activities
  useEffect(() => {
    if (!userId) return;
    const unsubSales = subscribeStaffSales(userId, setStaffSales);
    return () => {
      unsubSales();
    };
  }, [userId]);

  const currentBarber = useMemo(() => {
    return barbers.find((b) => b.id === selectedBarberId) || null;
  }, [barbers, selectedBarberId]);

  const currentShop = useMemo(() => {
    return barbershops.find((s) => s.id === selectedShopId) || null;
  }, [barbershops, selectedShopId]);

  // Live calculation preview
  const delivNum = Number(quantityDelivered) || 0;
  const retNum = Number(returnedTowels) || 0;
  const cashNum = Number(cashAmount) || 0;
  const cardNum = Number(cardAmount) || 0;
  const discNum = Number(discount) || 0;
  const totalPaidNum = cashNum + cardNum;
  const totalCreditNum = totalPaidNum + discNum;

  const unitPrice = currentBarber ? Number(currentBarber.pricePerTowel || 3000) : 3000;
  const isPayForUsed = currentBarber?.contractType === CONTRACT_TYPES.PAY_FOR_USED;
  const chargedAmount = isPayForUsed ? retNum * unitPrice : delivNum * unitPrice;

  const curTowels = currentBarber ? Number(currentBarber.towelsCount ?? 0) : 0;
  const projectedTowels = Math.max(0, curTowels + delivNum - retNum);

  const curDebt = currentBarber ? Number(currentBarber.debt || 0) : 0;
  const curOverpaid = currentBarber ? Number(currentBarber.overpaid || 0) : 0;
  const netBalance = (curDebt - curOverpaid) + chargedAmount - totalCreditNum;

  // Handle Unified Sale Submission
  const handleSubmitSale = async (e) => {
    e.preventDefault();
    if (!selectedShopId || !selectedBarberId) return;
    if (delivNum <= 0 && retNum <= 0 && totalCreditNum <= 0) {
      alert("Iltimos, berilgan yoki qaytarilgan sochiq soni yoki to'lov summasini kiriting");
      return;
    }

    setSubmitting(true);
    try {
      await createSale({
        barbershopId: selectedShopId,
        barbershopName: currentShop?.name || "",
        barberId: selectedBarberId,
        barberName: currentBarber?.name || "",
        staffId: userId,
        staffName: userProfile?.name || "Xodim",
        quantityDelivered: delivNum,
        returnedTowels: retNum,
        unitPrice,
        contractType: currentBarber?.contractType || CONTRACT_TYPES.PAY_FOR_TAKEN,
        cashAmount: cashNum,
        cardAmount: cardNum,
        discount: discNum,
        note,
      });

      setQuantityDelivered("");
      setReturnedTowels("");
      setCashAmount("");
      setCardAmount("");
      setDiscount("");
      setNote("");
      setSuccessMessage("Savdo va hisob-kitob muvaffaqiyatli saqlandi!");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      console.error("Staff sale error:", err);
      alert(uz.common.error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEditSale = async (saleId, editData) => {
    await updateSale(saleId, editData);
    setEditingSale(null);
    setSuccessMessage(uz.staff.saleUpdatedSuccess);
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{uz.staff.title}</h2>
          <p className="text-xs text-slate-500">
            {userProfile?.name ? `${userProfile.name} • ` : ""}Yagona savdo va hisob-kitob oynasi
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
          <User size={13} />
          <span>{uz.roles.staff}</span>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-900 animate-in fade-in duration-200">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Unified Form Card */}
      <div className="rounded-2xl bg-white p-4 shadow-xs border border-slate-200">
        <form onSubmit={handleSubmitSale} className="space-y-3.5">
          {/* 1. Barbershop Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              1. {uz.staff.selectBarbershop} *
            </label>
            <select
              required
              value={selectedShopId}
              onChange={(e) => handleShopChange(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            >
              <option value="">Sartaroshxonani tanlang...</option>
              {barbershops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name} {shop.address ? `(${shop.address})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Barber Selection */}
          {selectedShopId && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                2. {uz.staff.selectBarber} *
              </label>
              {barbers.length === 0 ? (
                <p className="rounded-xl bg-amber-50 p-2.5 text-xs text-amber-800 border border-amber-200">
                  Ushbu sartaroshxonada hali sartarosh kiritilmagan.
                </p>
              ) : (
                <select
                  required
                  value={selectedBarberId}
                  onChange={(e) => setSelectedBarberId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                >
                  {barbers.map((barber) => (
                    <option key={barber.id} value={barber.id}>
                      {barber.name} ({barber.pricePerTowel || 3000} so'm)
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Barber Details Card */}
          {currentBarber && (
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span className="flex items-center gap-1">
                  <Scissors size={14} className="text-emerald-600" />
                  {currentBarber.name}
                </span>
                <span className="text-[11px] font-bold text-slate-700">
                  {currentBarber.contractType === CONTRACT_TYPES.PAY_FOR_USED
                    ? "Ishlatilgan sochiqqa to'laydi"
                    : "Olingan sochiqqa to'laydi"}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200/60">
                <span>Undagi bor sochiqlar soni:</span>
                <span className="font-bold text-slate-900">{curTowels} dona</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Bir dona sochiq narxi:</span>
                <span className="font-bold text-slate-900">
                  {unitPrice.toLocaleString()} {uz.common.sum}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Qarzdorlik balansi:</span>
                <span className={`font-bold ${curDebt > 0 ? "text-red-600" : "text-slate-400"}`}>
                  {curDebt.toLocaleString()} {uz.common.sum}
                </span>
              </div>

              {curOverpaid > 0 && (
                <div className="flex items-center justify-between text-slate-600">
                  <span>Haqdorlik (Ortiqcha to'lov):</span>
                  <span className="font-bold text-emerald-600">
                    {curOverpaid.toLocaleString()} {uz.common.sum}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 3. Towels: Quantity Delivered & Returned */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Berilgan sochiq (dona)
              </label>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={quantityDelivered}
                onChange={(e) => setQuantityDelivered(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Olingan sochiq (dona)
              </label>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={returnedTowels}
                onChange={(e) => setReturnedTowels(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base font-bold outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              />
            </div>
          </div>

          {/* 4. Payment: Cash, Card, Discount */}
          <div className="space-y-2 rounded-xl bg-slate-50 p-3 border border-slate-200">
            <span className="block text-xs font-bold text-slate-800">
              To'lov va chegirmalar
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Naqd pul (so'm)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  inputMode="numeric"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Click / Karta (so'm)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  inputMode="numeric"
                  value={cardAmount}
                  onChange={(e) => setCardAmount(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                Chegirma (so'm)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                inputMode="numeric"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* 5. Live Background Calculation Summary */}
          {currentBarber && (delivNum > 0 || retNum > 0 || totalCreditNum > 0) && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/90 p-3 text-xs space-y-1.5 animate-in fade-in duration-150">
              <span className="block font-bold text-emerald-950 uppercase tracking-wide text-[10px]">
                Orqa fondagi hisob-kitob natijasi:
              </span>
              <div className="flex justify-between text-slate-700">
                <span>Sartaroshdagi sochiqlar soni:</span>
                <span className="font-bold text-slate-900">
                  {curTowels} → <strong className="text-emerald-700">{projectedTowels} dona</strong>
                </span>
              </div>
              {chargedAmount > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>Hisoblangan summa ({isPayForUsed ? "ishlatilganiga" : "olinganiga"}):</span>
                  <span className="font-bold text-slate-900">
                    {chargedAmount.toLocaleString()} so'm
                  </span>
                </div>
              )}
              {totalCreditNum > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>To'lov + chegirma:</span>
                  <span className="font-bold text-emerald-700">
                    -{totalCreditNum.toLocaleString()} so'm
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-emerald-200/80 pt-1 font-bold">
                <span>Yangi kutilayotgan balans:</span>
                <span className={netBalance > 0 ? "text-red-700" : netBalance < 0 ? "text-sky-700" : "text-emerald-800"}>
                  {netBalance > 0 && `Qarz: ${netBalance.toLocaleString()} so'm`}
                  {netBalance < 0 && `Ortiqcha to'lov: ${Math.abs(netBalance).toLocaleString()} so'm`}
                  {netBalance === 0 && "To'liq hisob-kitob (0 so'm)"}
                </span>
              </div>
            </div>
          )}

          {/* 6. Note (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Izoh (ixtiyoriy)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Qo'shimcha izoh..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-emerald-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !selectedShopId || !selectedBarberId || (delivNum <= 0 && retNum <= 0 && totalCreditNum <= 0)}
            className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-md active:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <Package size={18} />
            <span>{submitting ? uz.common.loading : "Savdoni tasdiqlash va saqlash"}</span>
          </button>
        </form>
      </div>

      {/* RECENT SALES LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Clock size={16} className="text-emerald-600" />
            <span>So'nggi savdolar ({staffSales.length})</span>
          </h3>
        </div>

        {staffSales.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center text-xs text-slate-400 border border-slate-200">
            Hozircha savdolar mavjud emas
          </div>
        ) : (
          <div className="space-y-2.5">
            {staffSales.slice(0, 15).map((sale) => (
              <div
                key={sale.id}
                className="rounded-2xl bg-white p-3.5 shadow-xs border border-slate-200 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{sale.barberName}</h4>
                    <p className="text-slate-500">{sale.barbershopName}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px]">
                      {sale.quantityDelivered > 0 && (
                        <span className="text-emerald-700 font-semibold">
                          +{sale.quantityDelivered} dona berildi
                        </span>
                      )}
                      {sale.returnedTowels > 0 && (
                        <span className="text-sky-700 font-semibold">
                          -{sale.returnedTowels} dona olindi
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-emerald-700 block">
                      {Number(sale.totalPrice || 0).toLocaleString()} {uz.common.sum}
                    </span>
                    {(Number(sale.cashAmount) > 0 || Number(sale.cardAmount) > 0) && (
                      <span className="text-[10px] text-slate-500 block">
                        To'landi: {(Number(sale.cashAmount || 0) + Number(sale.cardAmount || 0)).toLocaleString()} so'm
                      </span>
                    )}
                  </div>
                </div>

                {sale.note && (
                  <p className="rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600 italic">
                    "{sale.note}"
                  </p>
                )}

                <div className="flex items-center justify-end border-t border-slate-100 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingSale(sale)}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold text-xs border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-95 transition-all"
                  >
                    <Edit size={12} />
                    <span>Tahrirlash</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingSale && (
        <SaleEditModal
          sale={editingSale}
          isAdmin={false}
          onSave={handleSaveEditSale}
          onClose={() => setEditingSale(null)}
        />
      )}
    </div>
  );
}
