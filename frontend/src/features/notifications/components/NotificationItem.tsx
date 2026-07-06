import { Check, Circle } from 'lucide-react'
import { Button } from '@/core/components/Button'
import type { AppNotification } from '@/core/api/notifications'
import { NOTIFICATION_TYPE_LABELS } from '@/core/lib/notificationTypes'

interface NotificationItemProps {
  notification: AppNotification
  onOpen: (notification: AppNotification) => void
  onMarkRead?: (notification: AppNotification) => void
}

function formatTimestamp(created: string): string {
  return new Date(created).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function NotificationItem({ notification, onOpen, onMarkRead }: NotificationItemProps) {
  return (
    <div
      className={`flex w-full items-start gap-2 rounded-lg border border-border px-3 py-2.5 text-sm transition-colors ${
        notification.read ? 'bg-card' : 'bg-sage/10'
      }`}
    >
      <button
        type="button"
        onClick={() => onOpen(notification)}
        className="flex min-w-0 flex-1 items-start gap-2 text-left hover:opacity-80"
      >
        {!notification.read && (
          <Circle size={8} fill="currentColor" className="mt-1.5 flex-none text-sage-deep" />
        )}
        <div className={`min-w-0 flex-1 ${notification.read ? 'ml-[16px]' : ''}`}>
          <div className="text-[11px] font-extrabold uppercase tracking-wide text-muted">
            {NOTIFICATION_TYPE_LABELS[notification.type] ?? notification.type}
          </div>
          <div className="text-ink">{notification.message}</div>
          <div className="mt-0.5 text-xs text-muted">{formatTimestamp(notification.created)}</div>
        </div>
      </button>
      {!notification.read && onMarkRead && (
        <Button
          type="button"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation()
            onMarkRead(notification)
          }}
          title="Als gelesen markieren"
          aria-label="Als gelesen markieren"
          className="flex-none px-2.5 py-1.5 text-xs"
        >
          <Check size={14} className="mr-1 inline-block align-text-bottom" />
          Gelesen
        </Button>
      )}
    </div>
  )
}
