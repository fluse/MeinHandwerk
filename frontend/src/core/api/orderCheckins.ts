import type { RecordModel } from 'pocketbase'
import { pb } from '@/core/api/pocketbase'

export type CheckinType = 'unterwegs' | 'angekommen' | 'arbeit_begonnen' | 'verlassen'

export interface OrderCheckin {
  id: string
  order: string
  employee: string
  type: CheckinType
  created: string
}

function toCheckin(r: RecordModel): OrderCheckin {
  return {
    id: r.id,
    order: r.order,
    employee: r.employee,
    type: r.type,
    created: r.created,
  }
}

export async function listOrderCheckins(orderId: string): Promise<OrderCheckin[]> {
  const records = await pb.collection('order_checkins').getFullList({
    filter: pb.filter('order = {:orderId}', { orderId }),
    sort: 'created',
  })
  return records.map(toCheckin)
}

export async function createOrderCheckin(
  orderId: string,
  employeeId: string,
  type: CheckinType,
): Promise<OrderCheckin> {
  const record = await pb.collection('order_checkins').create({
    order: orderId,
    employee: employeeId,
    type,
  })
  return toCheckin(record)
}
