import { useSearchParams } from 'react-router-dom'
import { iso, mondayOf } from '@/core/lib/date'

/** Hält den Wochenstart (Montag) als "week"-Query-Parameter, damit die Kalenderansichten deep-linkbar bleiben. */
export function useWeekStart() {
  const [params, setParams] = useSearchParams()
  const raw = params.get('week')
  const weekStart = mondayOf(raw ? new Date(`${raw}T00:00:00`) : new Date())

  const setWeekStart = (d: Date) => {
    const next = new URLSearchParams(params)
    next.set('week', iso(mondayOf(d)))
    setParams(next, { replace: true })
  }

  return { weekStart, setWeekStart }
}
