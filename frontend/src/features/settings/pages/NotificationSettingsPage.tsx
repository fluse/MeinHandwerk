import { useState } from 'react'
import { Button } from '@/core/components/Button'
import { ConfirmDialog } from '@/core/components/ConfirmDialog'
import { useCleanupNotifications } from '@/core/hooks/useNotifications'

export function NotificationSettingsPage() {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [resultCount, setResultCount] = useState<number | null>(null)
  const cleanup = useCleanupNotifications()

  const handleConfirm = () => {
    setConfirmOpen(false)
    cleanup.mutate(undefined, {
      onSuccess: (deleted) => setResultCount(deleted),
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        Meldungen werden nicht automatisch gelöscht. Hier kannst du die komplette Meldungshistorie
        (aller Mitarbeiter) auf einmal aufräumen.
      </p>

      <div>
        <Button variant="danger" onClick={() => setConfirmOpen(true)} disabled={cleanup.isPending}>
          {cleanup.isPending ? 'Wird aufgeräumt…' : 'Alle Meldungen löschen'}
        </Button>
      </div>

      {resultCount !== null && (
        <p className="text-xs text-muted">{resultCount} Meldung(en) gelöscht.</p>
      )}
      {cleanup.isError && (
        <p className="text-xs text-danger">Aufräumen fehlgeschlagen. Bitte erneut versuchen.</p>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Alle Meldungen löschen?"
        description="Dies löscht die Meldungshistorie für alle Mitarbeiter unwiderruflich."
        confirmLabel="Löschen"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
