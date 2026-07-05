import { useRef, useState } from 'react'
import { colorVar } from '@/core/lib/cssVar'
import { formatHour } from '@/core/lib/time'
import { surname } from '@/core/lib/format'
import type { TimelineEntry } from '@/core/lib/calendarLayout'
import type { Order } from '../types/order'

interface DragState {
  startY: number
  startEnd: number
  curEnd: number
}

interface TimelineBlockProps {
  entry: TimelineEntry<Order>
  pixelsPerHour: number
  dayStartHour: number
  dayEndHour: number
  canResize: boolean
  onClick: () => void
  onResize: (newEnd: number) => void
}

/** Ein einzelner, per Drag am unteren Rand verlängerbarer Termin-Block im Stunden-Zeitstrahl. */
export function TimelineBlock({
  entry,
  pixelsPerHour,
  dayStartHour,
  dayEndHour,
  canResize,
  onClick,
  onResize,
}: TimelineBlockProps) {
  const [dragEnd, setDragEnd] = useState<number | null>(null)
  const dragRef = useRef<DragState | null>(null)

  const end = dragEnd ?? entry.end
  const top = (entry.start - dayStartHour) * pixelsPerHour
  const height = Math.max(24, (end - entry.start) * pixelsPerHour - 3)
  const width = 100 / entry.lanes
  const left = entry.lane * width
  const done = entry.item.status === 'erledigt'
  const bg =
    entry.item.trade === 'innenausbau'
      ? colorVar('trade-innenausbau')
      : colorVar(`trade-${entry.item.trade}`)
  const fg = colorVar(`trade-${entry.item.trade}-fg`)

  return (
    <div
      onClick={onClick}
      className="absolute box-border cursor-pointer overflow-hidden rounded-lg px-1.5 py-1 shadow-sm transition-shadow hover:shadow-md"
      style={{
        top,
        left: `${left}%`,
        width: `calc(${width}% - 4px)`,
        height,
        background: bg,
        color: fg,
        opacity: done ? 0.6 : 1,
      }}
    >
      <div className="truncate text-[11px] font-extrabold">
        {surname(entry.item.client) || entry.item.title}
      </div>
      <div className="truncate text-[10px] opacity-90">
        {formatHour(entry.start, dayStartHour, dayEndHour)}–
        {formatHour(end, dayStartHour, dayEndHour)}
      </div>
      {canResize && (
        <div
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => {
            e.stopPropagation()
            try {
              e.currentTarget.setPointerCapture(e.pointerId)
            } catch {
              // ignore
            }
            dragRef.current = { startY: e.clientY, startEnd: entry.end, curEnd: entry.end }
            setDragEnd(entry.end)
          }}
          onPointerMove={(e) => {
            const drag = dragRef.current
            if (!drag) return
            let next = drag.startEnd + (e.clientY - drag.startY) / pixelsPerHour
            next = Math.round(next * 4) / 4
            next = Math.max(entry.start + 0.25, Math.min(dayEndHour, next))
            drag.curEnd = next
            setDragEnd(next)
          }}
          onPointerUp={() => {
            const drag = dragRef.current
            if (!drag) return
            dragRef.current = null
            setDragEnd(null)
            if (Math.abs(drag.curEnd - drag.startEnd) >= 0.01) onResize(drag.curEnd)
          }}
          onPointerCancel={() => {
            dragRef.current = null
            setDragEnd(null)
          }}
          className="absolute inset-x-0 bottom-0 flex h-3.5 cursor-ns-resize touch-none items-center justify-center"
        >
          <div className="h-0.5 w-6 rounded-full opacity-70" style={{ background: fg }} />
        </div>
      )}
    </div>
  )
}
