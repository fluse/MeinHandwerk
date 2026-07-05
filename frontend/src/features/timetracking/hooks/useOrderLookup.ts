import { useQuery } from '@tanstack/react-query'
import { listOrderLookup } from '../api/orderLookup'

export function useOrderLookup() {
  return useQuery({
    queryKey: ['order-lookup'],
    queryFn: listOrderLookup,
  })
}
