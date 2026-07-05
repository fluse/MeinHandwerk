import { useQuery } from '@tanstack/react-query'
import { listCustomers } from '../api/customers'

export const customersQueryKey = ['customers'] as const

export function useCustomers() {
  return useQuery({
    queryKey: customersQueryKey,
    queryFn: listCustomers,
  })
}
