import { useQuery } from '@tanstack/react-query'
import { getCustomer } from '../api/customers'

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: ['customers', 'one', id],
    queryFn: () => getCustomer(id!),
    enabled: !!id,
  })
}
