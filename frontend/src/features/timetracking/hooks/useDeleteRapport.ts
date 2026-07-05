import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteRapport } from '../api/rapports'

export function useDeleteRapport(orderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteRapport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rapports', orderId] }),
  })
}
