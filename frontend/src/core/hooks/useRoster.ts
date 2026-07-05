import { useQuery } from '@tanstack/react-query'
import { listRoster } from '@/core/api/roster'

export function useRoster() {
  return useQuery({
    queryKey: ['roster'],
    queryFn: listRoster,
  })
}
