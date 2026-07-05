import { colorVar } from '@/core/lib/cssVar'
import { TRADES, type Trade } from '../types/order'

export function TradeBadge({ trade }: { trade: Trade }) {
  return (
    <span
      className="whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-bold"
      style={{
        background: colorVar(`trade-${trade}`),
        color: colorVar(`trade-${trade}-fg`),
        border:
          trade === 'innenausbau' ? `1px solid ${colorVar('trade-innenausbau-border')}` : 'none',
      }}
    >
      {TRADES[trade]}
    </span>
  )
}

export function TradeDot({ trade }: { trade: Trade }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 flex-none rounded-[3px]"
      style={{
        background: colorVar(trade === 'innenausbau' ? 'trade-innenausbau-dot' : `trade-${trade}`),
      }}
    />
  )
}
