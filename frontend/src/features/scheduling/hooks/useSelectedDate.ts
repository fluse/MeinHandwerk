import { useSearchParams } from 'react-router-dom'
import { todayISO } from '@/core/lib/date'

/** Hält das ausgewählte Datum des Tages-Dispoboards als "date"-Query-Parameter, damit die Ansicht deep-linkbar bleibt. */
export function useSelectedDate() {
  const [params, setParams] = useSearchParams()
  const date = params.get('date') || todayISO()

  const setDate = (isoDate: string) => {
    const next = new URLSearchParams(params)
    next.set('date', isoDate)
    setParams(next, { replace: true })
  }

  return { date, setDate }
}
