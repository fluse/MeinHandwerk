import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listOrderReads, markOrderRead } from '../api/orderReads'

function readsQueryKey(orderId: string) {
  return ['order-reads', orderId] as const
}

export function useOrderReads(orderId: string, enabled = true) {
  return useQuery({
    queryKey: readsQueryKey(orderId),
    queryFn: () => listOrderReads(orderId),
    enabled,
  })
}

export function useMarkOrderRead(orderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (readerId: string) => markOrderRead(orderId, readerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: readsQueryKey(orderId) }),
  })
}
