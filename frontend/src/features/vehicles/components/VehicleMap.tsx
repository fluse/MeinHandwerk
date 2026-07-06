import { useEffect } from 'react'
import L from 'leaflet'
import type { LatLngExpression } from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { CustomerLocation } from '@/core/api/customerLocations'
import type { Vehicle } from '../types/vehicle'

// Fallback-Zentrum ohne Marker: geografische Mitte Deutschlands.
const DEFAULT_CENTER: LatLngExpression = [51.1657, 10.4515]

// Eigene inline-SVG/Emoji-Icons statt Leaflets Default-Marker-Bildern – die brechen mit
// Vite/Bundlern (404 auf marker-icon.png), weil Leaflet die Bildpfade relativ zum eigenen
// Paket erwartet statt zum gebauten Asset-Output.
function markerIcon(bg: string, emoji: string) {
  return L.divIcon({
    html: `<div style="width:30px;height:30px;border-radius:9999px;background:${bg};display:flex;align-items:center;justify-content:center;font-size:15px;line-height:1;box-shadow:0 1px 4px rgba(0,0,0,0.4);border:2px solid #fff;">${emoji}</div>`,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  })
}

const vehicleIconAssigned = markerIcon('#7c7bb0', '🚐')
const vehicleIconFree = markerIcon('#9aa0a6', '🚐')
const customerIcon = markerIcon('#51684d', '📍')

function mapsLink(lat: number, lng: number) {
  return `https://maps.google.com/?q=${lat},${lng}`
}

// MapContainer setzt Bounds nur einmal beim Mount – Marker kommen aber erst async per
// React Query nach. Diese Kind-Komponente fitted die Bounds neu, sobald sich die
// tatsächlichen Koordinaten ändern.
function FitBounds({ points }: { points: LatLngExpression[] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView(points[0], 13)
      return
    }
    map.fitBounds(L.latLngBounds(points), { padding: [30, 30] })
  }, [map, points])
  return null
}

interface VehicleMapProps {
  vehicles: Vehicle[]
  customers: CustomerLocation[]
}

export function VehicleMap({ vehicles, customers }: VehicleMapProps) {
  const vehiclePoints = vehicles.filter(
    (v): v is Vehicle & { lat: number; lng: number } => v.lat != null && v.lng != null,
  )
  const customerPoints = customers.filter(
    (c): c is CustomerLocation & { lat: number; lng: number } => c.lat != null && c.lng != null,
  )

  const points: LatLngExpression[] = [
    ...vehiclePoints.map((v): LatLngExpression => [v.lat, v.lng]),
    ...customerPoints.map((c): LatLngExpression => [c.lat, c.lng]),
  ]

  return (
    <div className="relative isolate z-0 mb-3 h-64 w-full overflow-hidden rounded-xl border border-border">
      <MapContainer center={DEFAULT_CENTER} zoom={6} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {vehiclePoints.map((v) => (
          <Marker
            key={v.id}
            position={[v.lat, v.lng]}
            icon={v.assignedTo ? vehicleIconAssigned : vehicleIconFree}
          >
            <Popup>
              <div className="text-sm font-semibold text-ink">{v.name}</div>
              <div className="text-xs text-muted">
                {v.assignedToName ? `Bei ${v.assignedToName}` : 'Nicht zugeordnet'}
              </div>
              <a
                href={mapsLink(v.lat, v.lng)}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-sage-deep"
              >
                In Google Maps öffnen
              </a>
            </Popup>
          </Marker>
        ))}
        {customerPoints.map((c) => (
          <Marker key={c.id} position={[c.lat, c.lng]} icon={customerIcon}>
            <Popup>
              <div className="text-sm font-semibold text-ink">{c.name}</div>
              {c.address && <div className="text-xs text-muted">{c.address}</div>}
              <a
                href={mapsLink(c.lat, c.lng)}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-sage-deep"
              >
                In Google Maps öffnen
              </a>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
