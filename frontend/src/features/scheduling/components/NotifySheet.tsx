import { Share2 } from 'lucide-react'
import { orderMsg, waNum } from '@/core/lib/format'
import { Button } from '@/core/components/Button'
import { Overlay } from '@/core/components/Overlay'
import type { RosterMember } from '@/core/api/roster'
import type { ScheduledOrder } from '../types/order'

interface NotifySheetProps {
  order: ScheduledOrder
  members: RosterMember[]
  onClose: () => void
}

const linkClass =
  'inline-block rounded-lg border border-border bg-card px-3 py-2 text-sm font-bold text-sage-text no-underline'

export function NotifySheet({ order, members, onClose }: NotifySheetProps) {
  const msg = orderMsg(order)
  const enc = encodeURIComponent(msg)
  const assignedMembers = members.filter((m) => order.assigned.includes(m.id))

  const share = () => {
    if (navigator.share) {
      navigator.share({ title: 'Auftrag', text: msg }).catch(() => {})
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(msg)
    }
  }

  return (
    <Overlay variant="sheet" onClose={onClose}>
      <h2 className="mb-2.5 text-lg font-extrabold text-ink">Mitarbeiter benachrichtigen</h2>
      <div className="mb-3 whitespace-pre-wrap rounded-lg border border-border bg-page p-3 text-sm leading-relaxed">
        {msg}
      </div>
      <Button className="w-full" onClick={share}>
        <Share2 size={16} className="mr-1.5 inline-block align-text-bottom" />
        Teilen / Weiterleiten
      </Button>

      {assignedMembers.map((m) => (
        <div key={m.id} className="mt-3 rounded-xl border border-border p-3">
          <div className="mb-1.5 text-sm font-bold">{m.name}</div>
          <div className="flex flex-wrap gap-2">
            {m.phone && (
              <a
                className={linkClass}
                style={{ color: '#1E7D34', borderColor: '#BEE3C6' }}
                href={`https://wa.me/${waNum(m.phone)}?text=${enc}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
            )}
            {m.phone && (
              <a className={linkClass} href={`sms:${m.phone}?&body=${enc}`}>
                SMS
              </a>
            )}
            {m.email && (
              <a
                className={linkClass}
                href={`mailto:${m.email}?subject=${encodeURIComponent(`Neuer Auftrag: ${order.title}`)}&body=${enc}`}
              >
                E-Mail
              </a>
            )}
            {!m.phone && !m.email && (
              <span className="text-xs text-muted">
                Kein Kontakt hinterlegt – im Team ergänzen.
              </span>
            )}
          </div>
        </div>
      ))}

      <div className="mt-4 flex gap-2.5">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => {
            if (navigator.clipboard) navigator.clipboard.writeText(msg)
          }}
        >
          Kopieren
        </Button>
        <Button className="flex-1" onClick={onClose}>
          Schließen
        </Button>
      </div>
    </Overlay>
  )
}
