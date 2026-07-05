import { useQuery } from '@tanstack/react-query'
import { listOrders } from '../api/orders'

export const ordersListQueryKey = ['orders', 'all'] as const

export function useOrdersList() {
  return useQuery({
    queryKey: ordersListQueryKey,
    queryFn: listOrders,
  })
}
