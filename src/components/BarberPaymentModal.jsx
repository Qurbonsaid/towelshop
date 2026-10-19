import React, { useMemo, useState } from "react";
import { Check, DollarSign, X } from "./icons";
import { uz } from "../i18n/uz";

export function BarberPaymentModal({
  barber,
  onSave,
  onClose,
}) {
  const [cashAmount, setCashAmount] = useState("");
  const [cardAmount, setCardAmount] = useState("");
  const [discount, setDiscount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const cashNum = Number(cashAmount) || 0;
  const cardNum = Number(cardAmount) || 0;
  const discNum = Number(discount) || 0;

  const totalPaid = cashNum + cardNum;
  const totalCredit = cashNum + cardNum + discNum;

  const currentDebt = Number(barber?.debt) || 0;
  const currentOverpaid = Number(barber?.overpaid) || 0;

  // Projected balances after payment
  const projectedBalance = useMemo(() => {
    let nextDebt = currentDebt;
    let nextOverpaid = currentOverpaid;

    if (totalCredit <= nextDebt) {
      nextDebt -= totalCredit;
    } else {
      const remaining = totalCredit - nextDebt;
      nextDebt = 0;
      nextOverpaid += remaining;
    }

    return { nextDebt, nextOverpaid };
  }, [currentDebt, currentOverpaid, totalCredit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalCredit <= 0) return;

    setSaving(true);
    try {
      await onSave({
        barberId: barber.id,
        barberName: barber.name,
        barbershopId: barber.barbershopId,
        cashAmount: cashNum,
        cardAmount: cardNum,
        discount: discNum,
        note: note.trim(),
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert(uz.common.error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <DollarSign size={18} />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              {uz.admin.barbers.settlePaymentTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current status */}
        <div className="mt-3 rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs">
          <p className="font-semibold text-slate-800">{barber.name}</p>
          <div className="mt-1 flex items-center justify-between text-slate-600">
            <span>Hozirgi qarz:</span>
            <span className="font-bold text-red-600">
              {currentDebt.toLocaleString()} {uz.common.sum}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Haqdorlik (Ortiqcha to'lov):</span>
            <span className="font-bold text-emerald-600">
              {currentOverpaid.toLocaleString()} {uz.common.sum}
            </span>
          </div>
        </div>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          {/* Naqd (cashAmount) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Naqd pul (so'm)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1000"
                autoFocus
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                placeholder="Masalan: 50000"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
              <span className="absolute right-3.5 top-2 text-xs font-medium text-slate-400 pointer-events-none">
                {uz.common.sum}
              </span>
            </div>
          </div>

          {/* Click / Karta (cardAmount) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Click / Karta (so'm)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1000"
                value={cardAmount}
                onChange={(e) => setCardAmount(e.target.value)}
                placeholder="Masalan: 30000"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-bold outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              />
              <span className="absolute right-3.5 top-2 text-xs font-medium text-slate-400 pointer-events-none">
                {uz.common.sum}
              </span>
            </div>
          </div>

          {/* Chegirma (discount) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chegirma (so'm)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1000"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="Masalan: 5000"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-bold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              />
              <span className="absolute right-3.5 top-2 text-xs font-medium text-slate-400 pointer-events-none">
                {uz.common.sum}
              </span>
            </div>
          </div>

          {/* Izoh */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {uz.common.note}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Qo'shimcha izoh..."
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-emerald-500"
            />
          </div>

          {/* Summary Calculation */}
          {totalCredit > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span>Jami to'lov (Naqd + Click):</span>
                <span className="font-bold text-slate-900">
                  {totalPaid.toLocaleString()} {uz.common.sum}
                </span>
              </div>
              {discNum > 0 && (
                <div className="flex items-center justify-between text-amber-800">
                  <span>Chegirma:</span>
                  <span className="font-bold">
                    {discNum.toLocaleString()} {uz.common.sum}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-emerald-900 pt-1 border-t border-emerald-200">
                <span className="font-semibold">Qarzdan chegiriladi:</span>
                <span className="font-extrabold text-sm text-emerald-800">
                  {totalCredit.toLocaleString()} {uz.common.sum}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 text-[11px] pt-1 border-t border-emerald-100">
                <span>To'lovdan keyingi qarz:</span>
                <span className="font-bold text-red-600">
                  {projectedBalance.nextDebt.toLocaleString()} {uz.common.sum}
                </span>
              </div>
              {projectedBalance.nextOverpaid > 0 && (
                <div className="flex items-center justify-between text-slate-600 text-[11px]">
                  <span>Haqdorlik (Ortiqcha):</span>
                  <span className="font-bold text-emerald-600">
                    {projectedBalance.nextOverpaid.toLocaleString()}{" "}
                    {uz.common.sum}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {uz.common.cancel}
            </button>
            <button
              type="submit"
              disabled={saving || totalCredit <= 0}
              className="rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              <Check size={16} />
              {saving ? uz.common.loading : uz.common.confirm}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
