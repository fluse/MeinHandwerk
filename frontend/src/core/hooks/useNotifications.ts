import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pb } from '@/core/api/pocketbase'
import {
  cleanupNotifications,
  listAllNotifications,
  listUnreadNotifications,
  markNotificationRead,
  type NotificationFilter,
} from '@/core/api/notifications'

const notificationsRootKey = ['notifications'] as const
const unreadKey = [...notificationsRootKey, 'unread'] as const
const allKey = (filter: NotificationFilter) => [...notificationsRootKey, 'all', filter] as const

/** Hält die Glocke live: PocketBase-Realtime respektiert dabei `notifications.viewRule`, ein
 *  Nutzer bekommt also ohnehin nur Events zu seinen eigenen Meldungen zugestellt. */
function useNotificationsRealtime() {
  const queryClient = useQueryClient()

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let cancelled = false

    pb.collection('notifications')
      .subscribe('*', () => {
        queryClient.invalidateQueries({ queryKey: notificationsRootKey })
      })
      .then((unsub) => {
        if (cancelled) {
          unsub()
        } else {
          unsubscribe = unsub
        }
      })

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [queryClient])
}

export function useUnreadNotifications() {
  useNotificationsRealtime()
  return useQuery({ queryKey: unreadKey, queryFn: listUnreadNotifications })
}

export function useAllNotifications(filter: NotificationFilter) {
  return useQuery({ queryKey: allKey(filter), queryFn: () => listAllNotifications(filter) })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationsRootKey }),
  })
}

export function useCleanupNotifications() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cleanupNotifications,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationsRootKey }),
  })
}
