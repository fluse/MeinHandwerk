import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addDays, fmtLong, iso, todayISO } from '@/core/lib/date'

interface DayNavProps {
  date: string
  onChange: (isoDate: string) => void
}

export function DayNav({ date, onChange }: DayNavProps) {
  const d = new Date(`${date}T00:00:00`)

  return (
    <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-card px-3.5 py-2.5">
      <button
        type="button"
        onClick={() => onChange(iso(addDays(d, -1)))}
        className="flex h-9 w-9 flex-none items-center justify-center rounded-md border border-border bg-page font-bold text-sage-deep"
      >
        <ChevronLeft size={18} />
      </button>
      <div className="flex-1 text-center text-sm font-extrabold capitalize text-ink">
        {fmtLong(date)}
      </div>
      <button
        type="button"
        onClick={() => onChange(iso(addDays(d, 1)))}
        className="flex h-9 w-9 flex-none cursor-pointer items-center justify-center rounded-md border border-border bg-page font-bold text-sage-deep"
      >
        <ChevronRight size={18} />
      </button>
      <button
        type="button"
        onClick={() => onChange(todayISO())}
        className="flex-none cursor-pointer rounded-full border border-border px-2.5 py-1.5 text-xs font-semibold text-muted"
      >
        Heute
      </button>
    </div>
  )
}
