import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchableSelect } from '@/core/components/SearchableSelect'
import { useMarkNotificationRead, useAllNotifications } from '@/core/hooks/useNotifications'
import type { AppNotification } from '@/core/api/notifications'
import {
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPES,
  type NotificationType,
} from '@/core/lib/notificationTypes'
import { NotificationItem } from '../components/NotificationItem'

const fieldClass =
  'w-full rounded-md border border-border px-3 py-2 text-sm focus:border-sage focus:outline-none'

const TYPE_ITEMS = NOTIFICATION_TYPES.map((t) => ({ id: t, label: NOTIFICATION_TYPE_LABELS[t] }))

export function NotificationsHistoryPage() {
  const [type, setType] = useState<NotificationType | ''>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const navigate = useNavigate()
  const markRead = useMarkNotificationRead()

  const { data: notifications = [], isLoading } = useAllNotifications({
    type: type || undefined,
    from: from ? `${from} 00:00:00` : undefined,
    to: to ? `${to} 23:59:59` : undefined,
  })

  const handleOpen = (notification: AppNotification) => {
    if (!notification.read) markRead.mutate(notification.id)
    if (notification.link) navigate(notification.link)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-lg font-semibold text-ink">Alle Meldungen</h1>

      <div className="mb-4 flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted" htmlFor="notification-type">
            Typ
          </label>
          <SearchableSelect
            id="notification-type"
            value={type}
            onChange={(id) => setType(id as NotificationType | '')}
            items={TYPE_ITEMS}
            emptyOptionLabel="Alle Typen"
            searchPlaceholder="Typ suchen…"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label
              className="mb-1 block text-xs font-medium text-muted"
              htmlFor="notification-from"
            >
              Von
            </label>
            <input
              id="notification-from"
              type="date"
              className={fieldClass}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-muted" htmlFor="notification-to">
              Bis
            </label>
            <input
              id="notification-to"
              type="date"
              className={fieldClass}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {isLoading && <p className="text-sm text-muted">Lädt…</p>}
        {!isLoading && notifications.length === 0 && (
          <p className="py-6 text-center text-sm text-muted">Keine Meldungen gefunden.</p>
        )}
        {notifications.map((n) => (
          <NotificationItem key={n.id} notification={n} onOpen={handleOpen} />
        ))}
      </div>
    </div>
  )
}
