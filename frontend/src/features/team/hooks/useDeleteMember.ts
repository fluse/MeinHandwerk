import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteMember } from '../api/team'
import { teamQueryKey } from './useTeam'

export function useDeleteMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamQueryKey })
    },
  })
}
