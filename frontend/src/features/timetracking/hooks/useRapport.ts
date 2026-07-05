import { useQuery } from '@tanstack/react-query'
import { getRapport } from '../api/rapports'

export function useRapport(id: string | undefined) {
  return useQuery({
    queryKey: ['rapports', 'one', id],
    queryFn: () => getRapport(id!),
    enabled: !!id,
  })
}
