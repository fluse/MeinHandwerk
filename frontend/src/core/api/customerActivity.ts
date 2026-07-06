import { pb } from '@/core/api/pocketbase'
import { todayISO } from '@/core/lib/date'

export interface CustomerActivityItem {
  id: string
  title: string
  date: string
  status: string
  /** Nur für Aufträge gesetzt (siehe order_blocks) – Gesamtzahl der Termine des Auftrags. */
  blockCount?: number
}

/** Schlanker Direktzugriff auf `orders`/`projects` für die Rückschau ("Aufträge/Projekte
 *  dieses Kunden") auf der Kundenkarte – von features/customers benötigt, darf aber nicht
 *  aus features/scheduling bzw. features/projects importieren (Features importieren sich
 *  nicht), daher hier in core/. */
export async function listOrdersForCustomer(customerId: string): Promise<CustomerActivityItem[]> {
  const orders = await pb.collection('orders').getFullList({
    filter: pb.filter('customer = {:id}', { id: customerId }),
  })
  if (orders.length === 0) return []

  // Eine gebündelte order_blocks-Abfrage für alle Aufträge dieses Kunden statt einer Schleife
  // (kein N+1) – Termine/Zuweisung liegen jetzt auf order_blocks statt auf orders.date.
  const filter = orders.map((_, i) => `order = {:id${i}}`).join(' || ')
  const params = Object.fromEntries(orders.map((o, i) => [`id${i}`, o.id]))
  const blocks = await pb.collection('order_blocks').getFullList({
    filter: pb.filter(filter, params),
    sort: 'date',
  })
  const blocksByOrder = new Map<string, string[]>()
  blocks.forEach((b) => {
    const dates = blocksByOrder.get(b.order) ?? []
    dates.push(b.date)
    blocksByOrder.set(b.order, dates)
  })

  const today = todayISO()
  return orders
    .map((o) => {
      const dates = blocksByOrder.get(o.id) ?? []
      const nextDate = dates.find((d) => d >= today) ?? dates[0] ?? ''
      return {
        id: o.id,
        title: o.title ?? '',
        date: nextDate,
        status: o.status ?? '',
        blockCount: dates.length,
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

export async function listProjectsForCustomer(customerId: string): Promise<CustomerActivityItem[]> {
  const records = await pb.collection('projects').getFullList({
    filter: pb.filter('customer = {:id}', { id: customerId }),
    sort: '-date',
  })
  return records.map((r) => ({
    id: r.id,
    title: r.title ?? '',
    date: r.date ?? '',
    status: r.status ?? '',
  }))
}
