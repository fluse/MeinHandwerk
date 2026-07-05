import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addDays, fmtShort, kw, mondayOf } from '@/core/lib/date'

interface WeekNavProps {
  weekStart: Date
  onChange: (d: Date) => void
}

export function WeekNav({ weekStart, onChange }: WeekNavProps) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-card px-3.5 py-2.5">
      <button
        type="button"
        onClick={() => onChange(addDays(weekStart, -7))}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-page font-bold text-sage-deep"
      >
        <ChevronLeft size={18} />
      </button>
      <div className="flex-1 text-center">
        <div className="text-sm font-extrabold text-ink">KW {kw(weekStart)}</div>
        <div className="text-xs text-muted">
          {fmtShort(weekStart)}–{fmtShort(addDays(weekStart, 5))}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(addDays(weekStart, 7))}
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-border bg-page font-bold text-sage-deep"
      >
        <ChevronRight size={18} />
      </button>
      <button
        type="button"
        onClick={() => onChange(mondayOf(new Date()))}
        className="rounded-full border border-border cursor-pointer px-2.5 py-1.5 text-xs font-semibold text-muted"
      >
        Heute
      </button>
    </div>
  )
}
