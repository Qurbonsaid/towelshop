import React, { useState } from 'react'
import { Check, DollarSign, X } from './icons'
import { uz } from '../i18n/uz'

export function BarberPaymentModal({ barber, onSave, onClose }) {
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const numericAmount = Number(amount)
    if (!numericAmount || numericAmount <= 0) return

    setSaving(true)
    try {
      await onSave(barber.id, numericAmount)
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
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
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

        <div className="mt-3 rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs">
          <p className="font-semibold text-slate-800">{barber.name}</p>
          <div className="mt-1 flex items-center justify-between text-slate-600">
            <span>Hozirgi qarz:</span>
            <span className="font-bold text-red-600">{(barber.debt || 0).toLocaleString()} {uz.common.sum}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Haqdorlik (Ortiqcha to'lov):</span>
            <span className="font-bold text-emerald-600">{(barber.overpaid || 0).toLocaleString()} {uz.common.sum}</span>
          </div>
        </div>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {uz.admin.barbers.paymentAmountLabel} *
            </label>
            <div className="relative">
              <input
                type="number"
                min="100"
                step="1000"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Masalan: 50000"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-base font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
              <span className="absolute right-3.5 top-3 text-xs font-medium text-slate-400 pointer-events-none">
                {uz.common.sum}
              </span>
            </div>
          </div>

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
              disabled={saving || !amount}
              className="rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              <Check size={16} />
              {saving ? uz.common.loading : uz.common.confirm}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

