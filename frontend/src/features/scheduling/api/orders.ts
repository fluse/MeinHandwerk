import type { RecordModel } from 'pocketbase'
import { pb } from '@/core/api/pocketbase'
import type { Order, OrderFormInput } from '../types/order'

function toOrder(r: RecordModel): Order {
  return {
    id: r.id,
    title: r.title,
    trade: r.trade,
    date: r.date,
    from: r.from ?? '',
    to: r.to ?? '',
    client: r.client ?? '',
    phone: r.phone ?? '',
    address: r.address ?? '',
    material: r.material ?? '',
    desc: r.desc ?? '',
    note: r.note ?? '',
    assigned: r.assigned ?? [],
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

export async function listOrdersInRange(fromISO: string, toISO: string): Promise<Order[]> {
  const records = await pb.collection('orders').getFullList({
    filter: pb.filter('date >= {:from} && date <= {:to}', { from: fromISO, to: toISO }),
    sort: 'from',
    expand: 'customer',
  })
  return records.map(toOrder)
}

/** Alle Aufträge unabhängig vom Datum – für die kalenderfreie Auftragsliste. */
export async function listOrders(): Promise<Order[]> {
  const records = await pb.collection('orders').getFullList({
    sort: 'date,from',
    expand: 'customer',
  })
  return records.map(toOrder)
}

export async function getOrder(id: string): Promise<Order> {
  return toOrder(await pb.collection('orders').getOne(id, { expand: 'customer' }))
}

function toPayload(input: OrderFormInput) {
  return {
    title: input.title,
    trade: input.trade,
    date: input.date,
    from: input.from || '',
    to: input.to || '',
    client: input.client ?? '',
    phone: input.phone ?? '',
    address: input.address ?? '',
    material: input.material ?? '',
    desc: input.desc ?? '',
    note: input.note ?? '',
    assigned: input.assigned,
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

export async function setOrderTime(id: string, from: string, to: string): Promise<Order> {
  const record = await pb.collection('orders').update(id, { from, to })
  return toOrder(record)
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
