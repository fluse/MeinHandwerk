import { useMutation, useQueryClient } from '@tanstack/react-query'
import { closeOrder, createOrder, deleteOrder, reopenOrder, updateOrder } from '../api/orders'
import type { OrderFormInput } from '../types/order'

function useInvalidateOrders() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['orders'] })
}

// Aufträge können eine customer-Relation setzen/ändern/verlieren – die Rückschau auf der
// Kundenkarte (core/hooks/useCustomerActivity.ts) muss das mitbekommen.
function useInvalidateOrdersAndCustomerActivity() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] })
    queryClient.invalidateQueries({ queryKey: ['customerActivity'] })
  }
}

export function useCreateOrder() {
  const invalidate = useInvalidateOrdersAndCustomerActivity()
  return useMutation({
    mutationFn: createOrder,
    onSuccess: invalidate,
  })
}

export function useUpdateOrder() {
  const invalidate = useInvalidateOrdersAndCustomerActivity()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: OrderFormInput }) => updateOrder(id, input),
    onSuccess: invalidate,
  })
}

export function useDeleteOrder() {
  const invalidate = useInvalidateOrdersAndCustomerActivity()
  return useMutation({
    mutationFn: deleteOrder,
    onSuccess: invalidate,
  })
}

export function useCloseOrder() {
  const invalidate = useInvalidateOrders()
  return useMutation({
    mutationFn: ({
      id,
      closedBy,
      rapportSigned,
      rapportReason,
    }: {
      id: string
      closedBy: string
      rapportSigned: boolean
      rapportReason: string
    }) => closeOrder(id, { closedBy, rapportSigned, rapportReason }),
    onSuccess: invalidate,
  })
}

export function useReopenOrder() {
  const invalidate = useInvalidateOrders()
  return useMutation({
    mutationFn: reopenOrder,
    onSuccess: invalidate,
  })
}
