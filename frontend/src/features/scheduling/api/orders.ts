import type { RecordModel } from 'pocketbase'
import { pb } from '@/core/api/pocketbase'
import type { Order, OrderFormInput, ScheduledOrder } from '../types/order'

function toOrder(r: RecordModel): Order {
  return {
    id: r.id,
    title: r.title,
    trade: r.trade,
    client: r.client ?? '',
    phone: r.phone ?? '',
    street: r.street ?? '',
    zip: r.zip ?? '',
    city: r.city ?? '',
    material: r.material ?? '',
    desc: r.desc ?? '',
    note: r.note ?? '',
    status: r.status,
    project: r.project ?? '',
    customer: r.customer ?? '',
    customerName: r.expand?.customer?.name ?? '',
    site: r.site ?? '',
    closedBy: r.closedBy ?? '',
    closedAt: r.closedAt ?? '',
    rapportSigned: !!r.rapportSigned,
    rapportReason: r.rapportReason ?? '',
    created: r.created,
  }
}

/** Eine order_blocks-Zeile (mit expandiertem `order`+`order.customer`) zu einem "Auftritt" des
 * Auftrags an diesem Tag zusammenbauen. */
function toScheduledOrder(r: RecordModel): ScheduledOrder {
  return {
    ...toOrder(r.expand?.order ?? {}),
    blockId: r.id,
    date: r.date,
    from: r.from ?? '',
    to: r.to ?? '',
    assigned: r.assigned ?? [],
  }
}

export async function listOrdersInRange(fromISO: string, toISO: string): Promise<ScheduledOrder[]> {
  const records = await pb.collection('order_blocks').getFullList({
    filter: pb.filter('date >= {:from} && date <= {:to}', { from: fromISO, to: toISO }),
    sort: 'date,from',
    expand: 'order,order.customer',
  })
  return records.map(toScheduledOrder)
}

/** Alle Termine ab (optional) einem Startdatum – für die kalenderfreie Auftragsliste, die
 * standardmäßig nicht unbegrenzt in die Vergangenheit lädt (siehe OrdersListPage). */
export async function listOrders(sinceISO?: string): Promise<ScheduledOrder[]> {
  const records = await pb.collection('order_blocks').getFullList({
    filter: sinceISO ? pb.filter('date >= {:since}', { since: sinceISO }) : '',
    sort: 'date,from',
    expand: 'order,order.customer',
  })
  return records.map(toScheduledOrder)
}

export async function getOrder(id: string): Promise<Order> {
  return toOrder(await pb.collection('orders').getOne(id, { expand: 'customer' }))
}

function toPayload(input: OrderFormInput) {
  return {
    title: input.title,
    trade: input.trade,
    client: input.client ?? '',
    phone: input.phone ?? '',
    street: input.street ?? '',
    zip: input.zip ?? '',
    city: input.city ?? '',
    material: input.material ?? '',
    desc: input.desc ?? '',
    note: input.note ?? '',
    project: input.project ?? '',
    customer: input.customer ?? '',
    site: input.site ?? '',
  }
}

export async function createOrder(input: OrderFormInput): Promise<Order> {
  const record = await pb.collection('orders').create({ ...toPayload(input), status: 'offen' })
  return toOrder(record)
}

export async function updateOrder(id: string, input: OrderFormInput): Promise<Order> {
  const record = await pb.collection('orders').update(id, toPayload(input))
  return toOrder(record)
}

export async function deleteOrder(id: string): Promise<void> {
  await pb.collection('orders').delete(id)
}

interface CloseOrderInput {
  closedBy: string
  rapportSigned: boolean
  rapportReason: string
}

export async function closeOrder(id: string, input: CloseOrderInput): Promise<Order> {
  const record = await pb.collection('orders').update(id, {
    status: 'erledigt',
    closedBy: input.closedBy,
    closedAt: new Date().toISOString(),
    rapportSigned: input.rapportSigned,
    rapportReason: input.rapportSigned ? '' : input.rapportReason,
  })
  return toOrder(record)
}

export async function reopenOrder(id: string): Promise<Order> {
  const record = await pb.collection('orders').update(id, { status: 'offen' })
  return toOrder(record)
}
