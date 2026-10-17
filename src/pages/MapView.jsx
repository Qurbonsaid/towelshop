import React, { useEffect, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { Package, Phone } from '../components/icons'
import { uz } from '../i18n/uz'
import { listBarbers, listBarbershops } from '../services/firestoreService'

const DEFAULT_CENTER = [41.311081, 69.240562] // Tashkent

export function MapView() {
  const [barbershops, setBarbershops] = useState([])
  const [barbers, setBarbers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listBarbershops(), listBarbers()]).then(([shops, barbersList]) => {
      setBarbershops(shops)
      setBarbers(barbersList)
      setLoading(false)
    })
  }, [])

  const shopsWithCoords = barbershops.filter(
    (s) =>
      s.latitude !== null &&
      s.longitude !== null &&
      Number.isFinite(Number(s.latitude)) &&
      Number.isFinite(Number(s.longitude))
  )

  const centerPos =
    shopsWithCoords.length > 0
      ? [Number(shopsWithCoords[0].latitude), Number(shopsWithCoords[0].longitude)]
      : DEFAULT_CENTER

  return (
    <div className="space-y-3 pb-20">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{uz.map.title}</h2>
        <p className="text-xs text-slate-500">{uz.map.subtitle}</p>
      </div>

      {loading ? (
        <div className="flex h-[60vh] items-center justify-center rounded-2xl bg-white border border-slate-200 text-xs text-slate-500">
          {uz.common.loading}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="h-[62vh] min-h-[350px] w-full">
            <MapContainer center={centerPos} className="h-full w-full" zoom={12}>
              <TileLayer
                attribution='&copy; Google Maps'
                url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              />

              {shopsWithCoords.map((shop) => {
                const shopBarbers = barbers.filter((b) => b.barbershopId === shop.id)
                const lat = Number(shop.latitude)
                const lng = Number(shop.longitude)

                return (
                  <Marker key={shop.id} position={[lat, lng]}>
                    <Popup className="custom-popup">
                      <div className="p-1 text-slate-900 font-sans">
                        <h4 className="font-bold text-sm text-slate-900">{shop.name}</h4>
                        {shop.address && (
                          <p className="text-xs text-slate-600 mt-0.5">{shop.address}</p>
                        )}
                        {shop.phone && (
                          <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                            <Phone size={11} /> {shop.phone}
                          </p>
                        )}

                        <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-1.5 text-xs">
                          <span className="text-slate-500">
                            {uz.map.viewBarbers} <strong className="text-slate-800">{shopBarbers.length}</strong>
                          </span>
                        </div>

                        <Link
                          to="/staff"
                          className="mt-2.5 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white no-underline hover:bg-emerald-700"
                        >
                          <Package size={13} />
                          {uz.map.tradeHere}
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>
              Xaritada: <strong className="text-emerald-700">{shopsWithCoords.length} ta</strong> sartaroshxona
            </span>
            <span className="text-slate-400 text-[11px]">
              Jami: {barbershops.length} ta
            </span>
          </div>
        </div>
      )}

      {/* List of barbershops without coordinates if any */}
      {barbershops.length > shopsWithCoords.length && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800">
          <p className="font-semibold">{uz.map.noLocation}</p>
          <p className="mt-0.5 text-[11px]">
            {barbershops.length - shopsWithCoords.length} ta sartaroshxonaga hali koordinata belgilanmagan.
          </p>
        </div>
      )}
    </div>
  )
}
