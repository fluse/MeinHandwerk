import { useQuery } from '@tanstack/react-query'
import { getOrder } from '../api/orders'

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['orders', 'one', id],
    queryFn: () => getOrder(id!),
    enabled: !!id,
  })
}
