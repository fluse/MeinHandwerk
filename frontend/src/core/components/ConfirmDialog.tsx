import { Button } from './Button'
import { Overlay } from './Overlay'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Bestätigen',
  cancelLabel = 'Abbrechen',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Overlay open={open}>
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {description && <p className="mt-2 text-sm text-muted">{description}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Overlay>
  )
}
