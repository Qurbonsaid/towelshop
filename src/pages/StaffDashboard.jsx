import React, { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Clock,
  Edit,
  Package,
  RotateCcw,
  Scissors,
  User,
} from '../components/icons'
import { SaleEditModal } from '../components/SaleEditModal'
import { CONTRACT_TYPES } from '../constants/models'
import { ROLES } from '../constants/roles'
import { uz } from '../i18n/uz'
import {
  createReturn,
  createSale,
  listBarbersByBarbershop,
  subscribeBarbershops,
  subscribeStaffReturns,
  subscribeStaffSales,
  updateSale,
} from '../services/firestoreService'
import {
  canEditSale,
  formatRemainingTime,
  getRemainingTimeMs,
} from '../utils/permissions'

const TABS = {
  DELIVERY: 'delivery',
  COLLECTION: 'collection',
}

export function StaffDashboard({ userId, userProfile }) {
  const [tab, setTab] = useState(TABS.DELIVERY)

  // Options
  const [barbershops, setBarbershops] = useState([])
  const [barbers, setBarbers] = useState([])

  // Form State
  const [selectedShopId, setSelectedShopId] = useState('')
  const [selectedBarberId, setSelectedBarberId] = useState('')
  const [quantityDelivered, setQuantityDelivered] = useState('')
  const [quantityReturned, setQuantityReturned] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Staff history lists
  const [staffSales, setStaffSales] = useState([])
  const [staffReturns, setStaffReturns] = useState([])
  const [editingSale, setEditingSale] = useState(null)

  // Timer tick for 12-hour countdown
  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1)
    }, 15000) // update countdown every 15s
    return () => clearInterval(interval)
  }, [])

  // Load Barbershops
  useEffect(() => {
    const unsub = subscribeBarbershops(setBarbershops)
    return () => unsub()
  }, [])

  // Handle shop change
  const handleShopChange = (shopId) => {
    setSelectedShopId(shopId)
    if (!shopId) {
      setBarbers([])
      setSelectedBarberId('')
    }
  }

  // Load Barbers when shop changes
  useEffect(() => {
    if (!selectedShopId) return
    let active = true
    listBarbersByBarbershop(selectedShopId).then((items) => {
      if (!active) return
      setBarbers(items)
      if (items.length > 0) {
        setSelectedBarberId(items[0].id)
      } else {
        setSelectedBarberId('')
      }
    })
    return () => {
      active = false
    }
  }, [selectedShopId])

  // Subscriptions for staff's recent activities
  useEffect(() => {
    if (!userId) return
    const unsubSales = subscribeStaffSales(userId, setStaffSales)
    const unsubReturns = subscribeStaffReturns(userId, setStaffReturns)
    return () => {
      unsubSales()
      unsubReturns()
    }
  }, [userId])

  const currentBarber = useMemo(() => {
    return barbers.find((b) => b.id === selectedBarberId) || null
  }, [barbers, selectedBarberId])

  const currentShop = useMemo(() => {
    return barbershops.find((s) => s.id === selectedShopId) || null
  }, [barbershops, selectedShopId])

  // Computed total for delivery
  const pricePerTowel = currentBarber ? Number(currentBarber.pricePerTowel || 3000) : 3000
  const qtyDeliveredNum = Number(quantityDelivered) || 0
  const calculatedTotal = qtyDeliveredNum * pricePerTowel

  // Handle Delivery / Sale Submission
  const handleSubmitDelivery = async (e) => {
    e.preventDefault()
    if (!selectedShopId || !selectedBarberId || qtyDeliveredNum <= 0) return

    setSubmitting(true)
    try {
      await createSale({
        barbershopId: selectedShopId,
        barbershopName: currentShop?.name || '',
        barberId: selectedBarberId,
        barberName: currentBarber?.name || '',
        staffId: userId,
        staffName: userProfile?.name || 'Xodim',
        quantityDelivered: qtyDeliveredNum,
        unitPrice: pricePerTowel,
        contractType: currentBarber?.contractType || CONTRACT_TYPES.PAY_FOR_TAKEN,
        note,
      })

      setQuantityDelivered('')
      setNote('')
      setSuccessMessage(uz.staff.saleCreatedSuccess)
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (err) {
      console.error(err)
      alert(uz.common.error)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Return Submission
  const handleSubmitReturn = async (e) => {
    e.preventDefault()
    const qtyReturnedNum = Number(quantityReturned) || 0
    if (!selectedShopId || !selectedBarberId || qtyReturnedNum <= 0) return

    setSubmitting(true)
    try {
      await createReturn({
        barbershopId: selectedShopId,
        barbershopName: currentShop?.name || '',
        barberId: selectedBarberId,
        barberName: currentBarber?.name || '',
        staffId: userId,
        staffName: userProfile?.name || 'Xodim',
        quantityReturned: qtyReturnedNum,
        note,
      })

      setQuantityReturned('')
      setNote('')
      setSuccessMessage(uz.staff.returnCreatedSuccess)
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (err) {
      console.error(err)
      alert(uz.common.error)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Staff Edit Sale (strict 12-hour window enforced)
  const handleSaveEditSale = async (saleId, editData) => {
    const sale = staffSales.find((s) => s.id === saleId)
    if (!sale) return

    if (!canEditSale({ role: ROLES.STAFF, staffId: sale.staffId, currentUid: userId, createdAt: sale.createdAt })) {
      alert(uz.staff.expiredRule)
      return
    }

    await updateSale(saleId, editData)
    setEditingSale(null)
    setSuccessMessage(uz.staff.saleUpdatedSuccess)
    setTimeout(() => setSuccessMessage(''), 5000)
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{uz.staff.title}</h2>
          <p className="text-xs text-slate-500">
            {userProfile?.name ? `${userProfile.name} • ` : ''}Sochiq yetkazish va qaytarish
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

      {/* Main Flow Tabs */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-200/70 p-1">
        <button
          type="button"
          onClick={() => setTab(TABS.DELIVERY)}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
            tab === TABS.DELIVERY
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package size={16} />
          <span>{uz.staff.deliveryTab}</span>
        </button>

        <button
          type="button"
          onClick={() => setTab(TABS.COLLECTION)}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
            tab === TABS.COLLECTION
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <RotateCcw size={16} />
          <span>{uz.staff.collectionTab}</span>
        </button>
      </div>

      {/* Form Card */}
      <div className="rounded-2xl bg-white p-4 shadow-xs border border-slate-200">
        <form onSubmit={tab === TABS.DELIVERY ? handleSubmitDelivery : handleSubmitReturn} className="space-y-3.5">
          {/* 1. Barbershop Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              1. {uz.staff.selectBarbershop} *
            </label>
            <div className="relative">
              <select
                required
                value={selectedShopId}
                onChange={(e) => handleShopChange(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              >
                <option value="">Sartaroshxonani tanlang...</option>
                {barbershops.map((shop) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name} {shop.address ? `(${shop.address})` : ''}
                  </option>
                ))}
              </select>
            </div>
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
                    ? uz.contractTypes.payForUsed
                    : uz.contractTypes.payForTaken}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200/60">
                <span>{uz.staff.unitPrice}</span>
                <span className="font-bold text-slate-900">{pricePerTowel.toLocaleString()} {uz.common.sum}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>{uz.staff.debtBalance}</span>
                <span className={`font-bold ${currentBarber.debt > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                  {(currentBarber.debt || 0).toLocaleString()} {uz.common.sum}
                </span>
              </div>

              {(currentBarber.overpaid || 0) > 0 && (
                <div className="flex items-center justify-between text-slate-600">
                  <span>{uz.staff.overpaidBalance}</span>
                  <span className="font-bold text-emerald-600">
                    {(currentBarber.overpaid || 0).toLocaleString()} {uz.common.sum}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 3. Quantity Input */}
          {tab === TABS.DELIVERY ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                3. {uz.staff.deliveryQty} *
              </label>
              <input
                type="number"
                min="1"
                required
                inputMode="numeric"
                value={quantityDelivered}
                onChange={(e) => setQuantityDelivered(e.target.value)}
                placeholder="Masalan: 20"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-lg font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />

              {qtyDeliveredNum > 0 && (
                <div className="mt-2 flex items-center justify-between rounded-xl bg-emerald-50/80 p-2.5 text-xs border border-emerald-200">
                  <span className="font-semibold text-emerald-900">{uz.staff.totalPrice}</span>
                  <span className="text-base font-bold text-emerald-700">
                    {calculatedTotal.toLocaleString()} {uz.common.sum}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                3. {uz.staff.collectionQty} *
              </label>
              <input
                type="number"
                min="1"
                required
                inputMode="numeric"
                value={quantityReturned}
                onChange={(e) => setQuantityReturned(e.target.value)}
                placeholder="Masalan: 15"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-lg font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </div>
          )}

          {/* 4. Note (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              4. {uz.staff.note}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Qo'shimcha izoh..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-emerald-500"
            />
          </div>

          {/* 12-hour strict edit reminder */}
          <p className="text-[11px] text-slate-500 leading-tight">
            {uz.staff.twelveHourRule}
          </p>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !selectedShopId || !selectedBarberId || (tab === TABS.DELIVERY ? qtyDeliveredNum <= 0 : !quantityReturned)}
            className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-md active:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {tab === TABS.DELIVERY ? <Package size={18} /> : <RotateCcw size={18} />}
            <span>
              {submitting
                ? uz.common.loading
                : tab === TABS.DELIVERY
                ? uz.staff.submitDelivery
                : uz.staff.submitCollection}
            </span>
          </button>
        </form>
      </div>

      {/* RECENT SALES LIST WITH 12-HOUR COUNTDOWN TIMER */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Clock size={16} className="text-emerald-600" />
            {uz.staff.recentSalesTitle}
          </h3>
          <span className="text-xs text-slate-500 font-medium">{staffSales.length} ta</span>
        </div>

        {staffSales.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center text-xs text-slate-400 border border-slate-200">
            {uz.staff.noRecentSales}
          </div>
        ) : (
          <div className="space-y-2.5">
            {staffSales.map((sale) => {
              const remainingMs = getRemainingTimeMs(sale.createdAt)
              const isEditable = remainingMs > 0
              const remainingText = formatRemainingTime(remainingMs)

              return (
                <div
                  key={sale.id}
                  className="rounded-2xl bg-white p-3.5 shadow-xs border border-slate-200 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{sale.barberName}</h4>
                      <p className="text-slate-500">{sale.barbershopName}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-700 block">
                        {Number(sale.totalPrice).toLocaleString()} {uz.common.sum}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {sale.quantityDelivered} dona × {Number(sale.unitPrice).toLocaleString()} {uz.common.sum}
                      </span>
                    </div>
                  </div>

                  {sale.note && (
                    <p className="rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600 italic">
                      "{sale.note}"
                    </p>
                  )}

                  {/* 12-Hour Countdown Timer & Action */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                    {isEditable ? (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          <Clock size={11} className="animate-pulse" />
                          {remainingText}
                        </span>
                      </div>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                        {uz.staff.expiredRule}
                      </span>
                    )}

                    <button
                      type="button"
                      disabled={!isEditable}
                      onClick={() => setEditingSale(sale)}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold text-xs transition-all ${
                        isEditable
                          ? 'border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-95'
                          : 'border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <Edit size={12} />
                      {uz.staff.editSaleBtn}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* RECENT RETURNS LIST */}
      {staffReturns.length > 0 && (
        <div className="space-y-2 pt-2">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <RotateCcw size={15} className="text-sky-600" />
            {uz.staff.recentReturnsTitle}
          </h3>
          <div className="space-y-1.5">
            {staffReturns.slice(0, 5).map((ret) => (
              <div
                key={ret.id}
                className="flex items-center justify-between rounded-xl bg-white p-3 shadow-xs border border-slate-200 text-xs"
              >
                <div>
                  <p className="font-bold text-slate-800">{ret.barberName}</p>
                  <p className="text-[11px] text-slate-500">{ret.barbershopName}</p>
                </div>
                <div className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 border border-sky-200">
                  {ret.quantityReturned} ta qaytarildi
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Staff 12-Hour Edit Modal */}
      {editingSale && (
        <SaleEditModal
          sale={editingSale}
          isAdmin={false}
          onSave={handleSaveEditSale}
          onClose={() => setEditingSale(null)}
        />
      )}
    </div>
  )
}
