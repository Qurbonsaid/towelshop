import { useEffect, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'

import { uz } from '../i18n/uz'
import { listBarbershops } from '../services/firestoreService'

const defaultCenter = [41.311081, 69.240562]

export function MapView() {
  const [barbershops, setBarbershops] = useState([])

  useEffect(() => {
    listBarbershops().then((items) => {
      setBarbershops(
        items.filter(
          (item) =>
            Number.isFinite(item.location?.lat) &&
            Number.isFinite(item.location?.lng),
        ),
      )
    })
  }, [])

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-slate-900">{uz.map.title}</h2>
      <p className="text-sm text-slate-600">{uz.map.noLocation}</p>

      <div className="h-[60vh] overflow-hidden rounded-xl border border-slate-200">
        <MapContainer center={defaultCenter} className="h-full w-full" zoom={12}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {barbershops.map((shop) => (
            <Marker key={shop.id} position={[shop.location.lat, shop.location.lng]}>
              <Popup>{shop.name}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </section>
  )
}
