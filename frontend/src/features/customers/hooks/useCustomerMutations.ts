import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCustomer, deleteCustomer, updateCustomer } from '../api/customers'
import type { CustomerFormInput } from '../types/customer'
import { customersQueryKey } from './useCustomers'

function useInvalidateCustomers() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: customersQueryKey })
}

export function useCreateCustomer() {
  const invalidate = useInvalidateCustomers()
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: invalidate,
  })
}

export function useUpdateCustomer() {
  const invalidate = useInvalidateCustomers()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CustomerFormInput }) =>
      updateCustomer(id, input),
    onSuccess: invalidate,
  })
}

export function useDeleteCustomer() {
  const invalidate = useInvalidateCustomers()
  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: invalidate,
  })
}
