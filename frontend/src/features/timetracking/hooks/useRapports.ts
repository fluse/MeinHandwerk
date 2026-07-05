import { useQuery } from '@tanstack/react-query'
import { listRapportsForOrder } from '../api/rapports'

export function rapportsQueryKey(orderId: string) {
  return ['rapports', orderId] as const
}

export function useRapportsForOrder(orderId: string) {
  return useQuery({
    queryKey: rapportsQueryKey(orderId),
    queryFn: () => listRapportsForOrder(orderId),
  })
}
