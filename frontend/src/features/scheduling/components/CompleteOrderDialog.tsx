import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, FileText, Plus } from 'lucide-react'
import { surname } from '@/core/lib/format'
import { Button } from '@/core/components/Button'
import { Overlay } from '@/core/components/Overlay'
import { useRapportsForOrder } from '@/features/timetracking/hooks/useRapports'
import { useOrderPhotos, useUploadOrderPhoto } from '../hooks/useOrderPhotos'
import { useCloseOrder } from '../hooks/useOrderMutations'
import type { Order } from '../types/order'

interface CompleteOrderDialogProps {
  order: Order
  currentUserId: string
  onClose: () => void
}

export function CompleteOrderDialog({ order, currentUserId, onClose }: CompleteOrderDialogProps) {
  const navigate = useNavigate()
  const { data: photos = [] } = useOrderPhotos(order.id)
  const { data: rapports = [] } = useRapportsForOrder(order.id)
  const upload = useUploadOrderPhoto(order.id)
  const close = useCloseOrder()
  const fileRef = useRef<HTMLInputElement>(null)

  const [noPhotoOk, setNoPhotoOk] = useState(false)
  const [error, setError] = useState('')

  const onFiles = (files: FileList | null) => {
    if (!files?.length) return
    Array.from(files).forEach((file) => upload.mutate({ file, uploadedBy: currentUserId }))
    if (fileRef.current) fileRef.current.value = ''
  }

  const submit = () => {
    if (photos.length === 0 && !noPhotoOk) {
      setError('Bitte Fotos hochladen oder „keine Fotos“ bestätigen.')
      return
    }
    if (rapports.length === 0) {
      setError('Bitte zuerst einen Rapportzettel erstellen.')
      return
    }
    close.mutate(
      {
        id: order.id,
        closedBy: currentUserId,
        rapportSigned: true,
        rapportReason: '',
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Overlay variant="sheet">
      <h2 className="mb-0.5 text-lg font-extrabold text-ink">Auftrag abschließen</h2>
      <p className="mb-4 text-sm text-muted">
        {order.title} · {surname(order.client)}
      </p>

      <div className="mb-2 text-sm font-bold text-sage-text">1 · Fotos vom fertigen Auftrag</div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        onChange={(e) => onFiles(e.target.files)}
        className="hidden"
      />
      <Button variant="secondary" className="w-full" onClick={() => fileRef.current?.click()}>
        <Camera size={16} className="mr-1.5 inline-block align-text-bottom" />
        Fotos hochladen ({photos.length})
      </Button>
      {photos.length > 0 ? (
        <div className="mt-2.5 grid grid-cols-4 gap-1.5">
          {photos.map((p) => (
            <img
              key={p.id}
              src={p.url}
              alt=""
              className="aspect-square w-full rounded-md border border-border object-cover"
            />
          ))}
        </div>
      ) : (
        <label className="mt-2.5 flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={noPhotoOk}
            onChange={(e) => setNoPhotoOk(e.target.checked)}
          />
          Keine Fotos möglich
        </label>
      )}

      <div className="mb-2 mt-5 text-sm font-bold text-sage-text">2 · Rapportzettel</div>
      {rapports.length === 0 ? (
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => navigate(`/orders/${order.id}/rapport/new`)}
        >
          <Plus size={16} className="mr-1.5 inline-block align-text-bottom" />
          Rapportzettel erstellen
        </Button>
      ) : (
        <div className="flex flex-col gap-1.5">
          {rapports.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => navigate(`/orders/${order.id}/rapport/${r.id}/edit`)}
              className="flex items-center gap-2 rounded-xl border border-border p-3 text-left text-sm font-bold"
            >
              <FileText size={16} className="text-sage-text" />
              Rapportzettel vom{' '}
              {new Date(`${r.date}T00:00:00`).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      <hr className="mt-5 border-border" />

      <div className="mt-5 flex gap-2.5">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Abbrechen
        </Button>
        <Button className="flex-1" disabled={close.isPending} onClick={submit}>
          Abschließen
        </Button>
      </div>
    </Overlay>
  )
}
