import { useQuery } from '@tanstack/react-query'
import { listTeam } from '../api/team'

export const teamQueryKey = ['team'] as const

export function useTeam() {
  return useQuery({
    queryKey: teamQueryKey,
    queryFn: listTeam,
  })
}
