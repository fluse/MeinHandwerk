import { Button } from './Button'
import { buildAppleMapsUrl, buildGoogleMapsUrl, type MapsTarget } from '@/core/lib/maps'

interface MapsAppDialogProps {
  open: boolean
  target: MapsTarget
  onClose: () => void
}

export function MapsAppDialog({ open, target, onClose }: MapsAppDialogProps) {
  if (!open) return null

  const openWith = (url: string) => {
    window.open(url, '_blank')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-lg bg-card p-5 shadow-xl">
        <h2 className="text-base font-semibold text-ink">Navigation öffnen mit</h2>
        <div className="mt-5 flex flex-col gap-2">
          <Button className="w-full" onClick={() => openWith(buildGoogleMapsUrl(target))}>
            Google Maps
          </Button>
          <Button className="w-full" onClick={() => openWith(buildAppleMapsUrl(target))}>
            Apple Maps
          </Button>
          <Button variant="secondary" className="w-full" onClick={onClose}>
            Abbrechen
          </Button>
        </div>
      </div>
    </div>
  )
}
