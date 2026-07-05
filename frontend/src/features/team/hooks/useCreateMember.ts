import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createMember } from '../api/team'
import { teamQueryKey } from './useTeam'

export function useCreateMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamQueryKey })
    },
  })
}
