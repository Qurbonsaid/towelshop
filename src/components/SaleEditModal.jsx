import React, { useState } from 'react'
import { Check, Edit, X } from './icons'
import { uz } from '../i18n/uz'

export function SaleEditModal({ sale, isAdmin = false, onSave, onClose }) {
  const [quantity, setQuantity] = useState(sale?.quantityDelivered ?? 1)
  const [unitPrice, setUnitPrice] = useState(sale?.unitPrice ?? 3000)
  const [note, setNote] = useState(sale?.note || '')
  const [saving, setSaving] = useState(false)

  const qtyNum = Number(quantity) || 0
  const priceNum = Number(unitPrice) || 0
  const totalPrice = qtyNum * priceNum

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (qtyNum <= 0) return

    setSaving(true)
    try {
      await onSave(sale.id, {
        quantityDelivered: qtyNum,
        unitPrice: priceNum,
        note: note.trim(),
        barberId: sale.barberId,
      })
      onClose()
    } catch (err) {
      console.error(err)
      alert(uz.common.error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Edit size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {isAdmin ? uz.admin.masterLedger.editModalTitle : uz.staff.editSaleTitle}
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
              {uz.staff.deliveryQty} *
            </label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-base font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {uz.admin.barbers.priceLabel} *
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="100"
                required
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-base font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
              <span className="absolute right-3.5 top-3 text-xs font-medium text-slate-400 pointer-events-none">
                {uz.common.sum}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-emerald-50/70 p-3 border border-emerald-100">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-900">{uz.staff.totalPrice}</span>
              <span className="text-base font-bold text-emerald-700">
                {totalPrice.toLocaleString()} {uz.common.sum}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {uz.common.note}
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={uz.common.notePlaceholder}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
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
              disabled={saving || qtyNum <= 0}
              className="rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              <Check size={16} />
              {saving ? uz.common.loading : uz.common.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
