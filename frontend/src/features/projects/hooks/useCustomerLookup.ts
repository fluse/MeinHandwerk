import { useQuery } from '@tanstack/react-query'
import { listCustomerNames } from '../api/customerLookup'

export function useCustomerLookup() {
  return useQuery({
    queryKey: ['customer-lookup'],
    queryFn: listCustomerNames,
  })
}
