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
  const orders = await pb.collection('orders').getFullList()
  if (orders.length === 0) return []

  // Eine gebündelte order_blocks-Abfrage für alle Aufträge statt einer Schleife (kein N+1) –
  // das Datum für Sortierung/Label liegt jetzt auf order_blocks statt auf orders.date.
  const filter = orders.map((_, i) => `order = {:id${i}}`).join(' || ')
  const params = Object.fromEntries(orders.map((o, i) => [`id${i}`, o.id]))
  const blocks = await pb.collection('order_blocks').getFullList({
    filter: pb.filter(filter, params),
    sort: 'date',
  })
  const earliestDateByOrder = new Map<string, string>()
  blocks.forEach((b) => {
    if (!earliestDateByOrder.has(b.order)) earliestDateByOrder.set(b.order, b.date)
  })

  return orders
    .map((r) => ({
      id: r.id,
      title: r.title,
      client: r.client ?? '',
      date: earliestDateByOrder.get(r.id) ?? '',
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
}
