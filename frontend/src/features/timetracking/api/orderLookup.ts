import { pb } from '@/core/api/pocketbase'

export interface OrderLookup {
  id: string
  title: string
  client: string
  date: string
}

/** Schlanker Direktzugriff auf die `orders`-Collection für die Auftrags-Auswahl im Zeiterfassungs-
 *  formular – bewusst ohne Import von features/scheduling (Features importieren sich nicht). */
export async function listOrderLookup(): Promise<OrderLookup[]> {
  const records = await pb.collection('orders').getFullList({ sort: '-date' })
  return records.map((r) => ({ id: r.id, title: r.title, client: r.client ?? '', date: r.date }))
}
