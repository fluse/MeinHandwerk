import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/core/components/Button'
import { Overlay } from '@/core/components/Overlay'
import { useMarkNotificationRead, useUnreadNotifications } from '@/core/hooks/useNotifications'
import type { AppNotification } from '@/core/api/notifications'
import { NotificationItem } from './NotificationItem'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { data: unread = [] } = useUnreadNotifications()
  const markRead = useMarkNotificationRead()
  const navigate = useNavigate()

  const handleOpen = (notification: AppNotification) => {
    markRead.mutate(notification.id)
    setOpen(false)
    if (notification.link) navigate(notification.link)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Meldungen"
        aria-label="Meldungen"
        className="relative text-sage-deep"
      >
        <Bell size={20} />
        {unread.length > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      <Overlay open={open} variant="sheet" responsive onBackdropClick={() => setOpen(false)}>
        <h2 className="text-base font-semibold text-ink">Meldungen</h2>
        <div className="mt-4 flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
          {unread.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Keine neuen Meldungen.</p>
          ) : (
            unread.map((n) => <NotificationItem key={n.id} notification={n} onOpen={handleOpen} />)
          )}
        </div>
        <hr className="my-4 border-border" />
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            setOpen(false)
            navigate('/notifications')
          }}
        >
          Alle Meldungen ansehen
        </Button>
      </Overlay>
    </>
  )
}
