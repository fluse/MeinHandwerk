import { useQuery } from '@tanstack/react-query'
import { listOrdersInRange } from '../api/orders'

export function ordersQueryKey(fromISO: string, toISO: string) {
  return ['orders', fromISO, toISO] as const
}

export function useOrders(fromISO: string, toISO: string) {
  return useQuery({
    queryKey: ordersQueryKey(fromISO, toISO),
    queryFn: () => listOrdersInRange(fromISO, toISO),
  })
}
