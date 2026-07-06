import type { RecordModel } from 'pocketbase'
import { pb } from '@/core/api/pocketbase'
import type { NotificationType } from '@/core/lib/notificationTypes'

export interface AppNotification {
  id: string
  type: NotificationType
  message: string
  link: string
  read: boolean
  created: string
}

export interface NotificationFilter {
  type?: NotificationType
  from?: string
  to?: string
}

function toNotification(r: RecordModel): AppNotification {
  return {
    id: r.id,
    type: r.type,
    message: r.message ?? '',
    link: r.link ?? '',
    read: !!r.read,
    created: r.created,
  }
}

export async function listUnreadNotifications(): Promise<AppNotification[]> {
  const records = await pb.collection('notifications').getFullList({
    filter: 'read = false',
    sort: '-created',
  })
  return records.map(toNotification)
}

export async function listAllNotifications(
  filter: NotificationFilter = {},
): Promise<AppNotification[]> {
  const clauses: string[] = []
  if (filter.type) clauses.push('type = {:type}')
  if (filter.from) clauses.push('created >= {:from}')
  if (filter.to) clauses.push('created <= {:to}')

  const records = await pb.collection('notifications').getFullList({
    filter: clauses.length
      ? pb.filter(clauses.join(' && '), { type: filter.type, from: filter.from, to: filter.to })
      : '',
    sort: '-created',
  })
  return records.map(toNotification)
}

export async function markNotificationRead(id: string): Promise<void> {
  await pb.collection('notifications').update(id, { read: true })
}

export async function cleanupNotifications(): Promise<number> {
  const result = await pb.send<{ deleted: number }>('/api/notifications-cleanup', {
    method: 'POST',
  })
  return result.deleted ?? 0
}
