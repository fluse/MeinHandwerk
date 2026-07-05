import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createRapport, updateRapport } from '../api/rapports'
import { rapportsQueryKey } from './useRapports'

export function useCreateRapport(orderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createRapport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rapportsQueryKey(orderId) }),
  })
}

export function useUpdateRapport(orderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateRapport>[1] }) =>
      updateRapport(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rapportsQueryKey(orderId) }),
  })
}
