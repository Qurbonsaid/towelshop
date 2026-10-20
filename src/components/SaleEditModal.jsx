import React, { useState } from "react";
import { Check, Edit, X } from "./icons";
import { CONTRACT_TYPES } from "../constants/models";
import { uz } from "../i18n/uz";

export function SaleEditModal({ sale, isAdmin = false, onSave, onClose }) {
  const [quantity, setQuantity] = useState(sale?.quantityDelivered ?? 1);
  const [returnedTowels, setReturnedTowels] = useState(
    sale?.returnedTowels ?? 0,
  );
  const [cashAmount, setCashAmount] = useState(
    sale?.cashAmount ?? 0,
  );
  const [cardAmount, setCardAmount] = useState(sale?.cardAmount ?? 0);
  const [discount, setDiscount] = useState(sale?.discount ?? 0);
  const [saving, setSaving] = useState(false);

  const qtyNum = Number(quantity) || 0;
  const returnedNum = Number(returnedTowels) || 0;
  const cashNum = Number(cashAmount) || 0;
  const cardNum = Number(cardAmount) || 0;
  const discNum = Number(discount) || 0;
  const totalCredit = cashNum + cardNum + discNum;
  const isPayUsed = sale?.contractType === CONTRACT_TYPES.PAY_FOR_USED;
  const totalPrice = isPayUsed
    ? returnedNum * (Number(sale?.unitPrice) || 0)
    : qtyNum * (Number(sale?.unitPrice) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (qtyNum <= 0 && returnedNum <= 0 && totalCredit <= 0) return;

    setSaving(true);
    try {
      await onSave(sale.id, {
        quantityDelivered: qtyNum,
        returnedTowels: returnedNum,
        cashAmount: cashNum,
        cardAmount: cardNum,
        discount: discNum,
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
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Edit size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {isAdmin
                  ? uz.admin.masterLedger.editModalTitle
                  : uz.staff.editSaleTitle}
              </h3>
              <p className="text-xs text-slate-500">
                {sale.barbershopName} • {sale.barberName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <form className="mt-4 space-y-3.5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {uz.staff.deliveryQty}
            </label>
            <input
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {uz.barberDetails.returnQtyLabel}
            </label>
            <input
              type="number"
              min="0"
              value={returnedTowels}
              onChange={(e) => setReturnedTowels(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-bold outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            />
          </div>

          <div className="rounded-xl bg-emerald-50/70 p-3 border border-emerald-100">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-900">
                {uz.staff.totalPrice}
              </span>
              <span className="text-base font-bold text-emerald-700">
                {totalPrice.toLocaleString()} {uz.common.sum}
              </span>
            </div>
          </div>

          {/* Payment breakdown */}
          <div className="space-y-2 rounded-xl bg-slate-50 p-3 border border-slate-200">
            <p className="text-xs font-bold text-slate-700">To'lov va chegirma</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Naqd (so'm)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Click (so'm)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={cardAmount}
                  onChange={(e) => setCardAmount(e.target.value)}
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
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {uz.common.cancel}
            </button>
            <button
              type="submit"
              disabled={
                saving || (qtyNum <= 0 && returnedNum <= 0 && totalCredit <= 0)
              }
              className="rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              <Check size={16} />
              {saving ? uz.common.loading : uz.common.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
