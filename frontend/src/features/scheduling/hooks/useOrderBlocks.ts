import { useQuery } from '@tanstack/react-query'
import { listOrderBlocks } from '../api/orderBlocks'

export function orderBlocksQueryKey(orderId: string) {
  return ['order-blocks', orderId] as const
}

export function useOrderBlocks(orderId: string, enabled = true) {
  return useQuery({
    queryKey: orderBlocksQueryKey(orderId),
    queryFn: () => listOrderBlocks(orderId),
    enabled: enabled && Boolean(orderId),
  })
}
