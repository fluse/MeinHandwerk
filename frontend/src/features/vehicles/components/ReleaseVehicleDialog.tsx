import { useState } from 'react'
import { LocateFixed, MapPin } from 'lucide-react'
import { Button } from '@/core/components/Button'
import { Overlay } from '@/core/components/Overlay'
import { geocodeAddress } from '@/core/api/geocoding'
import { useAssignVehicle, useUpdateVehicleLocation } from '../hooks/useVehicleMutations'
import type { Vehicle } from '../types/vehicle'

interface ReleaseVehicleDialogProps {
  open: boolean
  vehicle: Vehicle
  onClose: () => void
}

/** Fragt beim Freigeben eines Fahrzeugs nach dem Standort, statt ihn unverändert zu lassen (siehe
 * feature-order-flow-vehicle-position.md) – aufgebaut wie `MapsAppDialog` (Liste von Optionen). */
export function ReleaseVehicleDialog({ open, vehicle, onClose }: ReleaseVehicleDialogProps) {
  const [view, setView] = useState<'options' | 'address'>('options')
  const [address, setAddress] = useState(vehicle.address)
  const [geoError, setGeoError] = useState('')
  const updateLocation = useUpdateVehicleLocation()
  const assign = useAssignVehicle()

  const close = () => {
    setView('options')
    setGeoError('')
    onClose()
  }

  const releaseKeepingLocation = () => {
    assign.mutate({ id: vehicle.id, userId: null })
    close()
  }

  const releaseWithLocation = async (location: { address?: string; lat: number; lng: number }) => {
    await updateLocation.mutateAsync({ id: vehicle.id, location })
    assign.mutate({ id: vehicle.id, userId: null })
    close()
  }

  const geocodeAndRelease = async () => {
    setGeoError('')
    const result = await geocodeAddress(address)
    if (!result) {
      setGeoError('Adresse konnte nicht gefunden werden.')
      return
    }
    releaseWithLocation({ address, lat: result.lat, lng: result.lng })
  }

  const useMyLocationAndRelease = () => {
    setGeoError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        releaseWithLocation({
          address: vehicle.address,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
      },
      () => setGeoError('Standort konnte nicht ermittelt werden.'),
    )
  }

  if (view === 'address') {
    return (
      <Overlay open={open} onClose={close}>
        <h2 className="text-base font-semibold text-ink">Adresse eingeben</h2>
        <div className="mt-5 flex flex-col gap-2">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Adresse eingeben"
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-sage focus:outline-none"
          />
          <Button
            className="w-full"
            disabled={updateLocation.isPending}
            onClick={geocodeAndRelease}
          >
            Adresse geocodieren &amp; freigeben
          </Button>
          {geoError && <p className="text-xs text-danger">{geoError}</p>}
          <hr className="border-slate-300 my-2" />
          <Button variant="secondary" className="w-full" onClick={() => setView('options')}>
            Zurück
          </Button>
        </div>
      </Overlay>
    )
  }

  return (
    <Overlay open={open} onClose={close}>
      <h2 className="text-base font-semibold text-ink">Fahrzeug freigeben</h2>
      <div className="mt-5 flex flex-col gap-2">
        <Button variant="secondary" className="w-full" onClick={() => setView('address')}>
          <MapPin size={16} className="mr-1.5 inline-block align-text-bottom" />
          Adresse eingeben
        </Button>
        <Button variant="secondary" className="w-full" onClick={useMyLocationAndRelease}>
          <LocateFixed size={16} className="mr-1.5 inline-block align-text-bottom" />
          Aktuellen Standort verwenden
        </Button>
        <Button variant="secondary" className="w-full" onClick={releaseKeepingLocation}>
          Bestehenden Ort beibehalten
        </Button>
        {geoError && <p className="text-xs text-danger">{geoError}</p>}
        <hr className="border-slate-300 my-2" />
        <Button variant="secondary" className="w-full" onClick={close}>
          Abbrechen
        </Button>
      </div>
    </Overlay>
  )
}
