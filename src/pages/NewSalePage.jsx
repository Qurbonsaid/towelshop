import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  Building2,
  Check,
  DollarSign,
  Package,
  RotateCcw,
  Scissors,
  User,
} from "../components/icons";
import { CONTRACT_TYPES } from "../constants/models";
import { ROLES } from "../constants/roles";
import { useHeader } from "../context/HeaderContext";
import { uz } from "../i18n/uz";
import { createSale } from "../services/firestoreService";
import { notifyAdminSafe } from "../services/pushService";

export function NewSalePage({
  role,
  userId,
  userProfile,
  barbershops = [],
  barbers = [],
  _sales = [],
  _returns = [],
}) {
  const { shopId: paramShopId, barberId: paramBarberId } = useParams();
  const navigate = useNavigate();
  const isAdmin = role === ROLES.ADMIN;

  const [selectedShopId, setSelectedShopId] = useState(paramShopId || "");
  const [selectedBarberId, setSelectedBarberId] = useState(paramBarberId || "");

  const [quantityDelivered, setQuantityDelivered] = useState("");
  const [returnedTowels, setReturnedTowels] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [cardAmount, setCardAmount] = useState("");
  const [discount, setDiscount] = useState("");
  const [note, setNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const currentBarber = useMemo(() => {
    return barbers.find((b) => b.id === selectedBarberId) || null;
  }, [barbers, selectedBarberId]);

  const currentShop = useMemo(() => {
    if (selectedShopId) {
      return barbershops.find((s) => s.id === selectedShopId) || null;
    }
    if (currentBarber?.barbershopId) {
      return (
        barbershops.find((s) => s.id === currentBarber.barbershopId) || null
      );
    }
    return null;
  }, [barbershops, selectedShopId, currentBarber]);

  const shopBarbers = useMemo(() => {
    if (!selectedShopId) return [];
    return barbers.filter((b) => b.barbershopId === selectedShopId);
  }, [barbers, selectedShopId]);

  const handleShopChange = (newShopId) => {
    setSelectedShopId(newShopId);
    setSelectedBarberId("");
  };

  const backTarget = useMemo(() => {
    if (paramShopId && paramBarberId) {
      return `/sartaroshxonalar/${paramShopId}/barber/${paramBarberId}`;
    }
    if (paramShopId) {
      return `/sartaroshxonalar/${paramShopId}`;
    }
    return "/savdolar";
  }, [paramShopId, paramBarberId]);

  useHeader(
    {
      title: "Yangi savdo",
      subtitle: currentBarber
        ? `${currentBarber.name} • ${currentShop?.name || ""}`
        : "Sotuv va hisob-kitobni rasmiylashtirish",
      showBack: true,
      backTo: backTarget,
    },
    [currentBarber, currentShop, backTarget]
  );

  const delivNum = Math.max(0, Number(quantityDelivered) || 0);
  const retNum = Math.max(0, Number(returnedTowels) || 0);
  const cashNum = Math.max(0, Number(cashAmount) || 0);
  const cardNum = Math.max(0, Number(cardAmount) || 0);
  const discNum = Math.max(0, Number(discount) || 0);

  const totalPaid = cashNum + cardNum;
  const totalCredit = totalPaid + discNum;

  const unitPrice = currentBarber
    ? Number(currentBarber.pricePerTowel || 3000)
    : 3000;
  const isPayForUsed =
    currentBarber?.contractType === CONTRACT_TYPES.PAY_FOR_USED;
  const chargedAmount = isPayForUsed
    ? retNum * unitPrice
    : delivNum * unitPrice;

  const curTowels = currentBarber ? Number(currentBarber.towelsCount ?? 0) : 0;
  const projectedTowels = Math.max(0, curTowels + delivNum - retNum);

  const curDebt = currentBarber ? Number(currentBarber.debt || 0) : 0;
  const curOverpaid = currentBarber ? Number(currentBarber.overpaid || 0) : 0;
  const netBalance = curDebt - curOverpaid + chargedAmount - totalCredit;

  const canSubmit =
    Boolean(currentBarber) &&
    (delivNum > 0 || retNum > 0 || totalCredit > 0);

  const addDelivery = (qty) => {
    setQuantityDelivered((prev) => String((Number(prev) || 0) + qty));
  };
  const addReturn = (qty) => {
    setReturnedTowels((prev) => String((Number(prev) || 0) + qty));
  };
  const addCash = (amount) => {
    setCashAmount((prev) => String((Number(prev) || 0) + amount));
  };
  const addCard = (amount) => {
    setCardAmount((prev) => String((Number(prev) || 0) + amount));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!currentBarber) {
      setErrorMessage("Iltimos, avval sartaroshni tanlang.");
      return;
    }

    if (!canSubmit) {
      setErrorMessage(
        "Iltimos, berilgan yoki qaytarilgan sochiq sonini, yoki to'lov summasini kiriting."
      );
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    const staffName = userProfile?.name || (isAdmin ? "Admin" : "Xodim");
    const barberName = currentBarber.name;

    try {
      await createSale({
        barberId: currentBarber.id,
        barbershopId: currentBarber.barbershopId,
        staffId: userId,
        staffName,
        barberName,
        barbershopName: currentShop?.name || "",
        unitPrice,
        contractType:
          currentBarber.contractType || CONTRACT_TYPES.PAY_FOR_TAKEN,
        quantityDelivered: delivNum,
        returnedTowels: retNum,
        totalPrice: chargedAmount,
        cashAmount: cashNum,
        cardAmount: cardNum,
        discount: discNum,
        note: note.trim(),
      });

      // Dispatch a single consolidated push notification to Admins
      if (!isAdmin) {
        if (delivNum > 0 && retNum > 0) {
          notifyAdminSafe(
            uz.notifications.titles.deliveryAndReturn,
            uz.notifications.pushDeliveryAndReturn(
              staffName,
              barberName,
              delivNum,
              retNum,
              chargedAmount
            )
          );
        } else if (delivNum > 0) {
          notifyAdminSafe(
            uz.notifications.titles.delivery,
            uz.notifications.pushDelivery(
              staffName,
              barberName,
              delivNum,
              chargedAmount
            )
          );
        } else if (retNum > 0) {
          notifyAdminSafe(
            uz.notifications.titles.return,
            uz.notifications.pushReturn(staffName, barberName, retNum)
          );
        } else if (totalCredit > 0) {
          notifyAdminSafe(
            uz.notifications.titles.payment,
            uz.notifications.pushPayment(
              staffName,
              barberName,
              totalPaid,
              cashNum,
              cardNum,
              discNum
            )
          );
        }
      }

      if (paramShopId && paramBarberId) {
        navigate(
          `/sartaroshxonalar/${paramShopId}/barber/${paramBarberId}`,
          {
            state: { toast: uz.barberDetails.deliverySuccess },
            replace: true,
          }
        );
      } else {
        navigate("/savdolar", {
          state: { toast: "Savdo muvaffaqiyatli saqlandi!" },
          replace: true,
        });
      }
    } catch (err) {
      console.error("Sale submit error:", err);
      setErrorMessage(
        uz.common.error || "Xatolik yuz berdi. Qayta urinib ko'ring."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(backTarget);
  };

  return (
    <div className="relative min-h-[calc(100vh-65px)] flex flex-col justify-between">
      <form onSubmit={handleSubmit} className="space-y-4 pb-36">
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-800 animate-in fade-in duration-150">
            <AlertCircle size={18} className="text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {(!paramShopId || !paramBarberId) && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sartaroshxona va Sartaroshni tanlang
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sartaroshxona *
              </label>
              <select
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

            {selectedShopId && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sartarosh *
                </label>
                {shopBarbers.length === 0 ? (
                  <p className="rounded-xl bg-amber-50 p-2.5 text-xs text-amber-800 border border-amber-200">
                    Ushbu sartaroshxonada hali sartarosh kiritilmagan.
                  </p>
                ) : (
                  <select
                    value={selectedBarberId}
                    onChange={(e) => setSelectedBarberId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  >
                    <option value="">Sartaroshni tanlang...</option>
                    {shopBarbers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.pricePerTowel || 3000} so'm)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
        )}

        {currentBarber ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold">
                  <Scissors size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-900 truncate">
                    {currentBarber.name}
                  </h2>
                  <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                    <Building2 size={13} className="text-slate-400 shrink-0" />
                    <span>{currentShop?.name || "Sartaroshxona"}</span>
                  </p>
                </div>
              </div>

              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 border border-slate-200">
                {isPayForUsed
                  ? "Ishlatilganiga to'laydi"
                  : "Olinganiga to'laydi"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
              <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
                <p className="text-[10px] font-medium text-slate-500">Bor sochiq</p>
                <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                  {curTowels} <span className="text-[10px] font-normal text-slate-500">dona</span>
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
                <p className="text-[10px] font-medium text-slate-500">1 dona narxi</p>
                <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                  {unitPrice.toLocaleString()}{" "}
                  <span className="text-[10px] font-normal text-slate-500">so'm</span>
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
                <p className="text-[10px] font-medium text-slate-500">Hozirgi balans</p>
                {curDebt > 0 ? (
                  <p className="text-xs font-extrabold text-red-600 mt-0.5 truncate">
                    Qarz: {curDebt.toLocaleString()}
                  </p>
                ) : curOverpaid > 0 ? (
                  <p className="text-xs font-extrabold text-emerald-600 mt-0.5 truncate">
                    +{curOverpaid.toLocaleString()}
                  </p>
                ) : (
                  <p className="text-xs font-extrabold text-slate-600 mt-0.5">
                    0 so'm
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
            <User size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-medium">Davom etish uchun sartaroshni tanlang</p>
          </div>
        )}

        {currentBarber && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
              Sochiqlar harakati
            </h3>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
                    <Package size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {uz.barberDetails.deliveryQtyLabel}
                    </h4>
                    <p className="text-[11px] text-emerald-800">
                      Sartaroshga berilayotgan toza sochiqlar
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={quantityDelivered}
                  onChange={(e) => setQuantityDelivered(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-emerald-300 bg-white px-3.5 py-2.5 text-base font-extrabold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                />
                <span className="absolute right-3.5 top-3 text-xs font-semibold text-slate-400 pointer-events-none">
                  dona
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] text-slate-500 font-semibold mr-1">Tezkor:</span>
                {[5, 10, 20, 30, 50].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => addDelivery(num)}
                    className="rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100 active:scale-95 transition-all shadow-2xs"
                  >
                    +{num}
                  </button>
                ))}
                {delivNum > 0 && (
                  <button
                    type="button"
                    onClick={() => setQuantityDelivered("")}
                    className="ml-auto text-[11px] font-semibold text-slate-500 hover:text-red-600 underline"
                  >
                    Tozalash
                  </button>
                )}
              </div>

              {delivNum > 0 && (
                <div className="flex items-center justify-between rounded-xl bg-emerald-100/70 px-3 py-2 text-xs font-bold text-emerald-950">
                  <span>Hisoblangan toza sochiq qiymati:</span>
                  <span>{(delivNum * unitPrice).toLocaleString()} {uz.common.sum}</span>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-600 text-white">
                    <RotateCcw size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {uz.barberDetails.returnQtyLabel}
                    </h4>
                    <p className="text-[11px] text-sky-800">
                      Qaytarib olinayotgan ishlatilgan sochiqlar
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={returnedTowels}
                  onChange={(e) => setReturnedTowels(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-sky-300 bg-white px-3.5 py-2.5 text-base font-extrabold text-slate-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-200"
                />
                <span className="absolute right-3.5 top-3 text-xs font-semibold text-slate-400 pointer-events-none">
                  dona
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] text-slate-500 font-semibold mr-1">Tezkor:</span>
                {[5, 10, 20, 30, 50].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => addReturn(num)}
                    className="rounded-lg border border-sky-300 bg-white px-2.5 py-1 text-xs font-bold text-sky-800 hover:bg-sky-100 active:scale-95 transition-all shadow-2xs"
                  >
                    +{num}
                  </button>
                ))}
                {retNum > 0 && (
                  <button
                    type="button"
                    onClick={() => setReturnedTowels("")}
                    className="ml-auto text-[11px] font-semibold text-slate-500 hover:text-red-600 underline"
                  >
                    Tozalash
                  </button>
                )}
              </div>

              {isPayForUsed && retNum > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between rounded-xl bg-sky-100/70 px-3 py-2 text-xs font-bold text-sky-950">
                    <span>Ishlatilganiga hisoblangan summa:</span>
                    <span>{(retNum * unitPrice).toLocaleString()} {uz.common.sum}</span>
                  </div>
                  <p className="text-[10px] text-sky-800 px-1">
                    Ushbu sartarosh ishlatilgan sochiq bo'yicha hisob-kitob qiladi.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3.5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                  <DollarSign size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    To'lov qabul qilish (ixtiyoriy)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Naqd, karta yoki chegirma kiritishingiz mumkin
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Naqd pul (so'm)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    inputMode="numeric"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    placeholder="Masalan: 50000"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-medium text-slate-400 pointer-events-none">
                    {uz.common.sum}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                  {[20000, 50000, 100000, 200000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => addCash(amt)}
                      className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 active:scale-95 transition-all"
                    >
                      +{amt / 1000}k
                    </button>
                  ))}
                  {cashNum > 0 && (
                    <button
                      type="button"
                      onClick={() => setCashAmount("")}
                      className="ml-auto text-[10px] font-semibold text-slate-400 hover:text-red-600 underline"
                    >
                      Tozalash
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Click / Karta (so'm)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    inputMode="numeric"
                    value={cardAmount}
                    onChange={(e) => setCardAmount(e.target.value)}
                    placeholder="Masalan: 30000"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-medium text-slate-400 pointer-events-none">
                    {uz.common.sum}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                  {[20000, 50000, 100000, 200000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => addCard(amt)}
                      className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 active:scale-95 transition-all"
                    >
                      +{amt / 1000}k
                    </button>
                  ))}
                  {cardNum > 0 && (
                    <button
                      type="button"
                      onClick={() => setCardAmount("")}
                      className="ml-auto text-[10px] font-semibold text-slate-400 hover:text-red-600 underline"
                    >
                      Tozalash
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chegirma (so'm)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    inputMode="numeric"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="Masalan: 5000"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-medium text-slate-400 pointer-events-none">
                    {uz.common.sum}
                  </span>
                </div>
              </div>

              {totalCredit > 0 && (
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs space-y-1.5 animate-in fade-in duration-150">
                  <div className="flex justify-between text-slate-600">
                    <span>Qabul qilingan to'lov (Naqd + Click):</span>
                    <span className="font-bold text-slate-900">
                      {totalPaid.toLocaleString()} {uz.common.sum}
                    </span>
                  </div>
                  {discNum > 0 && (
                    <div className="flex justify-between text-amber-800">
                      <span>Berilgan chegirma:</span>
                      <span className="font-bold">
                        {discNum.toLocaleString()} {uz.common.sum}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-emerald-800 pt-1 border-t border-slate-200">
                    <span>Qarzdan jami chegiriladi:</span>
                    <span>{totalCredit.toLocaleString()} {uz.common.sum}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                {uz.barberDetails.noteLabel}
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ixtiyoriy izoh yoki eslatma yozing..."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 resize-none"
              />
            </div>

            {(delivNum > 0 || retNum > 0 || totalCredit > 0) && (
              <div className="rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50/70 p-4 shadow-xs text-xs space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-950">
                    Hisob-kitob xulosasi
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Avtomatik hisob
                  </span>
                </div>

                <div className="flex justify-between text-slate-700">
                  <span>Sartaroshdagi sochiqlar soni:</span>
                  <span className="font-bold text-slate-900">
                    {curTowels} dona → <strong className="text-emerald-700">{projectedTowels} dona</strong>
                  </span>
                </div>

                {chargedAmount > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>
                      Hisoblangan summa ({isPayForUsed ? "ishlatilganiga" : "olinganiga"}):
                    </span>
                    <span className="font-bold text-slate-900">
                      {chargedAmount.toLocaleString()} {uz.common.sum}
                    </span>
                  </div>
                )}

                {totalCredit > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>Kiritilgan to'lov va chegirma:</span>
                    <span className="font-bold text-emerald-800">
                      -{totalCredit.toLocaleString()} {uz.common.sum}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-emerald-200/80 pt-2 text-sm font-extrabold">
                  <span className="text-slate-800">Kutilayotgan yangi balans:</span>
                  <span
                    className={
                      netBalance > 0
                        ? "text-red-600"
                        : netBalance < 0
                          ? "text-emerald-700"
                          : "text-slate-700"
                    }
                  >
                    {netBalance > 0 && `Qarz: ${netBalance.toLocaleString()} ${uz.common.sum}`}
                    {netBalance < 0 && `Ortiqcha to'lov: ${Math.abs(netBalance).toLocaleString()} ${uz.common.sum}`}
                    {netBalance === 0 && "Qarz yo'q (0 so'm)"}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </form>

      <div className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-lg border-t border-slate-200/90 bg-white/95 px-4 py-3 backdrop-blur-md shadow-2xl">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={submitting}
            className="flex items-center justify-center rounded-xl border border-slate-300 bg-white py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-98 transition-all"
          >
            {uz.common.cancel}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !canSubmit}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 py-3 text-sm font-bold text-white shadow-md hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 transition-all"
          >
            {submitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Saqlanmoqda...</span>
              </>
            ) : (
              <>
                <Check size={18} />
                <span>{uz.barberDetails.recordDeliveryBtn || "Savdoni saqlash"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
