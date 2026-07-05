import { useQuery } from '@tanstack/react-query'
import { listCustomerLookup } from '../api/customerLookup'

export function useCustomerLookup() {
  return useQuery({
    queryKey: ['customer-lookup'],
    queryFn: listCustomerLookup,
  })
}
