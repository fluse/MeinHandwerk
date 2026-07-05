import { ClientResponseError } from 'pocketbase'
import { pb } from '@/core/api/pocketbase'

/** reader-Nutzer-ID -> readAt (ISO-Datum) */
export type OrderReadMap = Record<string, string>

export async function listOrderReads(orderId: string): Promise<OrderReadMap> {
  const records = await pb.collection('order_reads').getFullList({
    filter: pb.filter('order = {:order}', { order: orderId }),
  })
  const map: OrderReadMap = {}
  for (const r of records) map[r.reader] = r.readAt
  return map
}

export async function markOrderRead(orderId: string, readerId: string): Promise<void> {
  try {
    await pb.collection('order_reads').getFirstListItem(
      pb.filter('order = {:order} && reader = {:reader}', {
        order: orderId,
        reader: readerId,
      }),
    )
  } catch (err) {
    if (err instanceof ClientResponseError && err.status === 404) {
      await pb.collection('order_reads').create({ order: orderId, reader: readerId })
      return
    }
    throw err
  }
}
