import { colorVar } from '@/core/lib/cssVar'
import type { OrderStatus } from '../types/order'

const LABEL: Record<OrderStatus, string> = { offen: 'Offen', erledigt: 'Erledigt' }

export function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span
      className="whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold"
      style={{
        background: colorVar(`status-${status}-bg`),
        color: colorVar(`status-${status}-fg`),
      }}
    >
      {LABEL[status]}
    </span>
  )
}
