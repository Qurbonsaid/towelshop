import React, { useState } from 'react'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import { Check, MapPin, Navigation, X } from './icons'
import { uz } from '../i18n/uz'

const DEFAULT_CENTER = [41.311081, 69.240562] // Tashkent center

function MapClickHandler({ position, onPositionChange }) {
  const map = useMapEvents({
    click(event) {
      const { lat, lng } = event.latlng
      onPositionChange([Number(lat.toFixed(6)), Number(lng.toFixed(6))])
      map.flyTo(event.latlng, map.getZoom())
    },
  })

  return position ? (
    <Marker
      draggable={true}
      eventHandlers={{
        dragend(e) {
          const marker = e.target
          const latlng = marker.getLatLng()
          onPositionChange([Number(latlng.lat.toFixed(6)), Number(latlng.lng.toFixed(6))])
        },
      }}
      position={position}
    />
  ) : null
}

export function MapLocationPickerModal({ initialLat, initialLng, onSave, onClose }) {
  const [position, setPosition] = useState(
    initialLat && initialLng ? [Number(initialLat), Number(initialLng)] : DEFAULT_CENTER
  )
  const [locating, setLocating] = useState(false)

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Brauzeringiz geolokatsiyani qo\'llab-quvvatlamaydi')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        const lat = Number(pos.coords.latitude.toFixed(6))
        const lng = Number(pos.coords.longitude.toFixed(6))
        setPosition([lat, lng])
      },
      (err) => {
        setLocating(false)
        console.warn('Geolokatsiya xatosi:', err)
        alert('Joriy joylashuvni aniqlab bo\'lmadi. Xaritadan o\'zingiz belgilang.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleConfirm = () => {
    if (position) {
      onSave({
        latitude: position[0],
        longitude: position[1],
      })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <MapPin size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">{uz.map.selectLocationModalTitle}</h3>
              <p className="text-xs text-slate-500">{uz.map.selectLocationHint}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Map Container */}
        <div className="relative h-[48vh] min-h-[280px] w-full bg-slate-100">
          <MapContainer
            center={position || DEFAULT_CENTER}
            className="h-full w-full"
            zoom={13}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onPositionChange={setPosition} position={position} />
          </MapContainer>

          {/* Quick GPS button overlay */}
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={locating}
            className="absolute bottom-3 right-3 z-[1000] flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-md border border-slate-200 active:scale-95 disabled:opacity-60"
          >
            <Navigation className={`text-emerald-600 ${locating ? 'animate-spin' : ''}`} size={16} />
            <span>{locating ? uz.common.loading : uz.map.getMyLocation}</span>
          </button>
        </div>

        {/* Coordinates indicator & actions */}
        <div className="space-y-3 p-4 bg-white border-t border-slate-100">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2.5 text-xs border border-slate-200">
            <div>
              <span className="text-slate-500 block">{uz.map.latitude}</span>
              <span className="font-mono font-medium text-slate-800">{position ? position[0] : '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">{uz.map.longitude}</span>
              <span className="font-mono font-medium text-slate-800">{position ? position[1] : '—'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onClose}
              type="button"
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 active:bg-slate-100"
            >
              <X size={16} />
              {uz.common.cancel}
            </button>
            <button
              onClick={handleConfirm}
              type="button"
              className="flex items-center justify-center gap-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white shadow-sm active:bg-emerald-700"
            >
              <Check size={16} />
              {uz.map.confirmLocation}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

