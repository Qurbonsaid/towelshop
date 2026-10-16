import React, { useState } from 'react'
import { AlertCircle, Building2, Check, MapPin, Trash2, X } from './icons'

import { uz } from '../i18n/uz'
import { MapLocationPickerModal } from './MapLocationPickerModal'

export function BarbershopModal({ barbershop, onSave, onDelete, onClose }) {
  const [name, setName] = useState(barbershop?.name || '')
  const [address, setAddress] = useState(barbershop?.address || '')
  const [phone, setPhone] = useState(barbershop?.phone || '')
  const [latitude, setLatitude] = useState(barbershop?.latitude ?? '')
  const [longitude, setLongitude] = useState(barbershop?.longitude ?? '')
  const [showMapPicker, setShowMapPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [verificationInput, setVerificationInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        latitude: latitude !== '' && !isNaN(latitude) ? Number(latitude) : null,
        longitude: longitude !== '' && !isNaN(longitude) ? Number(longitude) : null,
      })
      onClose()
    } catch (err) {
      console.error(err)
      alert(uz.common.error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete || !barbershop) return
    if (verificationInput.trim().toLowerCase() !== barbershop.name.trim().toLowerCase()) {
      alert("Tasdiqlash uchun sartaroshxona nomini to'g'ri kiriting!")
      return
    }

    setDeleting(true)
    try {
      await onDelete(barbershop.id)
      onClose()
    } catch (err) {
      console.error('Delete error:', err)
      alert(uz.common.error)
    } finally {
      setDeleting(false)
    }
  }


  const handleLocationPicked = ({ latitude: lat, longitude: lng }) => {
    setLatitude(lat)
    setLongitude(lng)
  }

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
        <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <Building2 size={18} />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                {barbershop ? uz.admin.barbershops.editBtn : uz.admin.barbershops.addBtn}
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

          <form className="mt-4 space-y-3.5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {uz.admin.barbershops.nameLabel} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={uz.admin.barbershops.namePlaceholder}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {uz.admin.barbershops.addressLabel}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={uz.admin.barbershops.addressPlaceholder}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {uz.admin.barbershops.phoneLabel}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={uz.admin.barbershops.phonePlaceholder}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            {/* Location selector via Leaflet modal */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  {uz.admin.barbershops.locationLabel}
                </label>
                <button
                  type="button"
                  onClick={() => setShowMapPicker(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  <MapPin size={13} />
                  {uz.admin.barbershops.pickLocation}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="any"
                  placeholder="Kenglik (Lat)"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono outline-none focus:border-emerald-500"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Uzunlik (Lng)"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono outline-none focus:border-emerald-500"
                />
              </div>

              {latitude && longitude ? (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600">
                  <Check size={12} /> {uz.admin.barbershops.locationSelected}: {latitude}, {longitude}
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-400">
                  {uz.admin.barbershops.noLocationSelected}
                </p>
              )}
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
                disabled={saving}
                className="rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? uz.common.loading : uz.common.save}
              </button>
            </div>

            {/* Delete button for existing shop */}
            {barbershop && onDelete && (
              <div className="pt-3 border-t border-red-100 text-center">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-red-200 bg-red-50/70 py-2 text-xs font-bold text-red-600 hover:bg-red-100 active:scale-98 transition-all"
                >
                  <Trash2 size={14} />
                  {uz.barbershopDetails.deleteShop}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Strict Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-3 mx-auto">
              <AlertCircle size={28} />
            </div>
            <h4 className="text-base font-extrabold text-slate-900 text-center">
              {uz.barbershopDetails.deleteShopConfirmTitle}
            </h4>
            <p className="mt-2 text-xs text-red-600 leading-relaxed text-center font-medium">
              {uz.barbershopDetails.deleteShopConfirmDesc}
            </p>

            <div className="mt-4 rounded-xl bg-slate-50 p-3 border border-slate-200">
              <p className="text-[11px] text-slate-600 font-medium">
                {uz.barbershopDetails.deleteShopVerificationPrompt}
              </p>
              <p className="mt-0.5 text-xs font-mono font-bold text-slate-900 bg-white p-1 rounded border border-slate-200 text-center select-all">
                {barbershop.name}
              </p>
              <input
                type="text"
                value={verificationInput}
                onChange={(e) => setVerificationInput(e.target.value)}
                placeholder={barbershop.name}
                className="mt-2 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-red-500 font-medium"
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setVerificationInput('')
                }}
                className="rounded-xl border border-slate-300 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                {uz.common.cancel}
              </button>
              <button
                type="button"
                disabled={
                  deleting ||
                  verificationInput.trim().toLowerCase() !== barbershop.name.trim().toLowerCase()
                }
                onClick={handleDelete}
                className="rounded-xl bg-red-600 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700 disabled:opacity-40"
              >
                {deleting ? uz.common.loading : uz.common.delete}
              </button>
            </div>
          </div>
        </div>
      )}


      {showMapPicker && (
        <MapLocationPickerModal
          initialLat={latitude}
          initialLng={longitude}
          onSave={handleLocationPicked}
          onClose={() => setShowMapPicker(false)}
        />
      )}
    </>
  )
}

