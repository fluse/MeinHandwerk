import { useState } from 'react'
import { LocateFixed, MapPin, Navigation, Pencil, Trash2, User } from 'lucide-react'
import { Button } from '@/core/components/Button'
import { DetailRow } from '@/core/components/DetailRow'
import { ConfirmDialog } from '@/core/components/ConfirmDialog'
import { MapsAppDialog } from '@/core/components/MapsAppDialog'
import { geocodeAddress } from '@/core/api/geocoding'
import { useAssignVehicle, useUpdateVehicleLocation } from '../hooks/useVehicleMutations'
import type { Vehicle } from '../types/vehicle'

interface VehicleCardProps {
  vehicle: Vehicle
  currentUserId: string
  canPlan: boolean
  onEdit: () => void
  onDelete: () => void
}

export function VehicleCard({
  vehicle: v,
  currentUserId,
  canPlan,
  onEdit,
  onDelete,
}: VehicleCardProps) {
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showMaps, setShowMaps] = useState(false)
  const [address, setAddress] = useState(v.address)
  const [geoError, setGeoError] = useState('')
  const assign = useAssignVehicle()
  const updateLocation = useUpdateVehicleLocation()

  const isMine = v.assignedTo === currentUserId
  const isFree = !v.assignedTo
  const canManageLocation = isMine || canPlan
  const mapsHref =
    v.lat != null && v.lng != null ? `https://maps.google.com/?q=${v.lat},${v.lng}` : undefined

  const geocode = async () => {
    setGeoError('')
    const result = await geocodeAddress(address)
    if (!result) {
      setGeoError('Adresse konnte nicht gefunden werden.')
      return
    }
    updateLocation.mutate({ id: v.id, location: { address, lat: result.lat, lng: result.lng } })
  }

  const useMyLocation = () => {
    setGeoError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateLocation.mutate({
          id: v.id,
          location: { address, lat: pos.coords.latitude, lng: pos.coords.longitude },
        })
      },
      () => setGeoError('Standort konnte nicht ermittelt werden.'),
    )
  }

  return (
    <div className="mb-2.5 overflow-hidden rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left"
      >
        <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-page text-sm font-extrabold text-sage-deep">
          {v.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-ink">{v.name}</div>
          <div className="truncate text-xs text-muted">
            {v.assignedToName ? `Bei ${v.assignedToName}` : 'Nicht zugeordnet'}
            {v.plate ? ` · ${v.plate}` : ''}
          </div>
        </div>
      </button>

      {open && (
        <div className="px-3.5 pb-3.5">
          <div className="rounded-lg border border-border bg-page px-3">
            <DetailRow icon={User} label="Zugeordnet" value={v.assignedToName || 'Niemand'} />
            <DetailRow
              icon={MapPin}
              label="Standort"
              value={
                v.address || (v.lat != null ? `${v.lat.toFixed(5)}, ${v.lng?.toFixed(5)}` : '')
              }
              href={mapsHref}
            />
            {v.locationUpdatedAt && (
              <div className="py-1.5 text-[11px] text-muted">
                Zuletzt aktualisiert: {new Date(v.locationUpdatedAt).toLocaleString('de-DE')}
              </div>
            )}
          </div>

          <div className="mt-2.5 flex flex-wrap gap-2">
            {isFree && (
              <Button
                className="flex-1"
                onClick={() => assign.mutate({ id: v.id, userId: currentUserId })}
              >
                Mir zuordnen
              </Button>
            )}
            {(isMine || canPlan) && !isFree && (
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => assign.mutate({ id: v.id, userId: null })}
              >
                Freigeben
              </Button>
            )}
            {mapsHref && (
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowMaps(true)}
              >
                <Navigation size={16} className="mr-1.5 inline-block align-text-bottom" />
                Navigation
              </Button>
            )}
          </div>

          {canManageLocation && (
            <div className="mt-2.5 rounded-lg border border-dashed border-border p-3">
              <div className="mb-1.5 text-xs font-extrabold text-sage-deep">
                STANDORT AKTUALISIEREN
              </div>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Adresse eingeben"
                className="mb-2 w-full rounded-md border border-border px-3 py-2 text-sm focus:border-sage focus:outline-none"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  disabled={updateLocation.isPending}
                  onClick={geocode}
                >
                  Adresse geocodieren
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  disabled={updateLocation.isPending}
                  onClick={useMyLocation}
                >
                  <LocateFixed size={16} className="mr-1.5 inline-block align-text-bottom" />
                  Meinen Standort verwenden
                </Button>
              </div>
              {geoError && <p className="mt-1.5 text-xs text-danger">{geoError}</p>}
            </div>
          )}

          {canPlan && (
            <div className="mt-2.5 flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={onEdit}
                title="Fahrzeug bearbeiten"
                className="cursor-pointer text-sage-deep"
              >
                <Pencil size={17} />
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                title="Fahrzeug löschen"
                className="cursor-pointer text-danger"
              >
                <Trash2 size={17} />
              </button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Fahrzeug löschen?"
        description="Dieser Vorgang kann nicht rückgängig gemacht werden."
        confirmLabel="Löschen"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false)
          onDelete()
        }}
      />

      <MapsAppDialog
        open={showMaps}
        target={{ address: v.address, lat: v.lat, lng: v.lng }}
        onClose={() => setShowMaps(false)}
      />
    </div>
  )
}
