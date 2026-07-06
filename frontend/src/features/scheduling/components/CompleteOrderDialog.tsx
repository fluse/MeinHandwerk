import { useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import { surname } from '@/core/lib/format'
import { Button } from '@/core/components/Button'
import { Overlay } from '@/core/components/Overlay'
import { useOrderPhotos, useUploadOrderPhoto } from '../hooks/useOrderPhotos'
import { useCloseOrder } from '../hooks/useOrderMutations'
import type { Order } from '../types/order'

interface CompleteOrderDialogProps {
  order: Order
  currentUserId: string
  onClose: () => void
}

export function CompleteOrderDialog({ order, currentUserId, onClose }: CompleteOrderDialogProps) {
  const { data: photos = [] } = useOrderPhotos(order.id)
  const upload = useUploadOrderPhoto(order.id)
  const close = useCloseOrder()
  const fileRef = useRef<HTMLInputElement>(null)

  const [signed, setSigned] = useState<boolean | null>(null)
  const [reason, setReason] = useState('')
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
    if (signed === null) {
      setError('Bitte Rapportzettel-Frage beantworten.')
      return
    }
    if (signed === false && !reason.trim()) {
      setError('Bitte Begründung eingeben.')
      return
    }
    close.mutate(
      {
        id: order.id,
        closedBy: currentUserId,
        rapportSigned: signed,
        rapportReason: reason.trim(),
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

      <div className="mb-2 mt-5 text-sm font-bold text-sage-text">
        2 · Rapportzettel vom Kunden unterschrieben?
      </div>
      <div className="flex gap-2.5">
        {(
          [
            [true, 'Ja'],
            [false, 'Nein'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={label}
            type="button"
            onClick={() => setSigned(value)}
            className={`flex-1 rounded-xl border p-3 text-sm font-bold ${
              signed === value
                ? value
                  ? 'border-status-erledigt-fg bg-status-erledigt-bg text-status-erledigt-fg'
                  : 'border-danger bg-danger-bg text-danger'
                : 'border-border text-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {signed === false && (
        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-muted" htmlFor="reason">
            Begründung (Pflicht)
          </label>
          <textarea
            id="reason"
            className="min-h-[70px] w-full resize-y rounded-md border border-border px-3 py-2 text-sm focus:border-sage focus:outline-none"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Warum wurde nicht unterschrieben?"
            autoFocus
          />
        </div>
      )}

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

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
