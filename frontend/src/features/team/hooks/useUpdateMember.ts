import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateMember } from '../api/team'
import type { EditMemberInput } from '../types/member'
import { teamQueryKey } from './useTeam'

export function useUpdateMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EditMemberInput }) => updateMember(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamQueryKey })
    },
  })
}
