import { useQuery } from '@tanstack/react-query'
import { listTimelogInRange } from '../api/timelog'

export function timelogQueryKey(fromISO: string, toISO: string) {
  return ['timelog', fromISO, toISO] as const
}

export function useTimelog(fromISO: string, toISO: string) {
  return useQuery({
    queryKey: timelogQueryKey(fromISO, toISO),
    queryFn: () => listTimelogInRange(fromISO, toISO),
  })
}
