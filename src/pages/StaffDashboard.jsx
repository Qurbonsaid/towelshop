import { useEffect, useMemo, useState } from 'react'

import { uz } from '../i18n/uz'
import {
  createTransaction,
  listBarbersByBarbershop,
  listBarbershops,
} from '../services/firestoreService'

const TABS = {
  DELIVERY: 'delivery',
  COLLECTION: 'collection',
}

export function StaffDashboard({ userId }) {
  const [tab, setTab] = useState(TABS.DELIVERY)
  const [barbershops, setBarbershops] = useState([])
  const [barbers, setBarbers] = useState([])
  const [barbershopId, setBarbershopId] = useState('')
  const [barberId, setBarberId] = useState('')
  const [deliveryQty, setDeliveryQty] = useState('')
  const [acceptedQty, setAcceptedQty] = useState('')
  const [collectionQty, setCollectionQty] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    listBarbershops().then(setBarbershops)
  }, [])

  useEffect(() => {
    if (!barbershopId) return

    listBarbersByBarbershop(barbershopId).then(setBarbers)
  }, [barbershopId])

  const isDelivery = tab === TABS.DELIVERY
  const displayedBarbers = barbershopId ? barbers : []
  const submitLabel = isDelivery ? uz.staff.submitDelivery : uz.staff.submitCollection

  const disabled = useMemo(
    () => !barbershopId || !barberId || (isDelivery ? !deliveryQty || !acceptedQty : !collectionQty),
    [acceptedQty, barberId, barbershopId, collectionQty, deliveryQty, isDelivery],
  )

  const handleSubmit = async (event) => {
    event.preventDefault()

    await createTransaction({
      type: isDelivery ? 'delivery' : 'collection',
      barbershopId,
      barberId,
      deliveryQty: Number(deliveryQty || 0),
      acceptedQty: Number(acceptedQty || 0),
      collectionQty: Number(collectionQty || 0),
      note,
      ownerUid: userId,
      createdAt: new Date(),
    })

    setDeliveryQty('')
    setAcceptedQty('')
    setCollectionQty('')
    setNote('')
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">{uz.staff.title}</h2>

      <div className="grid grid-cols-2 gap-2">
        <button
          className={`rounded-xl px-3 py-2 text-sm font-medium ${
            isDelivery ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
          }`}
          onClick={() => setTab(TABS.DELIVERY)}
          type="button"
        >
          {uz.staff.deliveryTab}
        </button>
        <button
          className={`rounded-xl px-3 py-2 text-sm font-medium ${
            !isDelivery ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
          }`}
          onClick={() => setTab(TABS.COLLECTION)}
          type="button"
        >
          {uz.staff.collectionTab}
        </button>
      </div>

      <form className="space-y-3 rounded-xl bg-white p-4 shadow-sm" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1 block text-sm text-slate-700">{uz.staff.barbershop}</span>
          <select
            className="w-full rounded-xl border border-slate-300 px-3 py-3 text-base"
            onChange={(event) => {
              setBarbershopId(event.target.value)
              setBarberId('')
            }}
            required
            value={barbershopId}
          >
            <option value="">Tanlang</option>
            {barbershops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm text-slate-700">{uz.staff.barber}</span>
          <select
            className="w-full rounded-xl border border-slate-300 px-3 py-3 text-base"
            onChange={(event) => setBarberId(event.target.value)}
            required
            value={barberId}
          >
            <option value="">Tanlang</option>
            {displayedBarbers.map((barber) => (
              <option key={barber.id} value={barber.id}>
                {barber.name}
              </option>
            ))}
          </select>
        </label>

        {isDelivery ? (
          <>
            <label className="block">
              <span className="mb-1 block text-sm text-slate-700">{uz.staff.deliveryQty}</span>
              <input
                className="w-full rounded-xl border border-slate-300 px-3 py-3"
                inputMode="numeric"
                min="0"
                onChange={(event) => setDeliveryQty(event.target.value)}
                required
                type="number"
                value={deliveryQty}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-slate-700">{uz.staff.acceptedQty}</span>
              <input
                className="w-full rounded-xl border border-slate-300 px-3 py-3"
                inputMode="numeric"
                min="0"
                onChange={(event) => setAcceptedQty(event.target.value)}
                required
                type="number"
                value={acceptedQty}
              />
            </label>
          </>
        ) : (
          <label className="block">
            <span className="mb-1 block text-sm text-slate-700">{uz.staff.collectionQty}</span>
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-3"
              inputMode="numeric"
              min="0"
              onChange={(event) => setCollectionQty(event.target.value)}
              required
              type="number"
              value={collectionQty}
            />
          </label>
        )}

        <label className="block">
          <span className="mb-1 block text-sm text-slate-700">{uz.common.note}</span>
          <textarea
            className="w-full rounded-xl border border-slate-300 px-3 py-3"
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            value={note}
          />
        </label>

        <p className="text-xs text-slate-500">{uz.staff.twelveHourRule}</p>

        <button
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white disabled:opacity-60"
          disabled={disabled}
          type="submit"
        >
          {submitLabel}
        </button>
      </form>
    </section>
  )
}
