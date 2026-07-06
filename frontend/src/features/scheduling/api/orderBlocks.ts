import type { RecordModel } from 'pocketbase'
import { pb } from '@/core/api/pocketbase'
import type { OrderBlock, OrderBlockFormInput } from '../types/order'

function toOrderBlock(r: RecordModel): OrderBlock {
  return {
    id: r.id,
    order: r.order,
    date: r.date,
    from: r.from ?? '',
    to: r.to ?? '',
    assigned: r.assigned ?? [],
    created: r.created,
  }
}

export async function listOrderBlocks(orderId: string): Promise<OrderBlock[]> {
  const records = await pb.collection('order_blocks').getFullList({
    filter: pb.filter('order = {:orderId}', { orderId }),
    sort: 'date',
  })
  return records.map(toOrderBlock)
}

function toPayload(input: OrderBlockFormInput) {
  return {
    date: input.date,
    from: input.from || '',
    to: input.to || '',
    assigned: input.assigned,
  }
}

export async function createOrderBlock(
  orderId: string,
  input: OrderBlockFormInput,
): Promise<OrderBlock> {
  const record = await pb.collection('order_blocks').create({ order: orderId, ...toPayload(input) })
  return toOrderBlock(record)
}

export async function updateOrderBlock(
  id: string,
  input: OrderBlockFormInput,
): Promise<OrderBlock> {
  const record = await pb.collection('order_blocks').update(id, toPayload(input))
  return toOrderBlock(record)
}

export async function updateOrderBlockTime(
  id: string,
  from: string,
  to: string,
): Promise<OrderBlock> {
  const record = await pb.collection('order_blocks').update(id, { from, to })
  return toOrderBlock(record)
}

export async function deleteOrderBlock(id: string): Promise<void> {
  await pb.collection('order_blocks').delete(id)
}
