import { Circle } from 'lucide-react'
import type { AppNotification } from '@/core/api/notifications'
import { NOTIFICATION_TYPE_LABELS } from '@/core/lib/notificationTypes'

interface NotificationItemProps {
  notification: AppNotification
  onOpen: (notification: AppNotification) => void
}

function formatTimestamp(created: string): string {
  return new Date(created).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function NotificationItem({ notification, onOpen }: NotificationItemProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className={`flex w-full items-start gap-2 rounded-lg border border-border px-3 py-2.5 text-left text-sm transition-colors hover:bg-page ${
        notification.read ? 'bg-card' : 'bg-sage/10'
      }`}
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
  )
}
