import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  closeOrder,
  createOrder,
  deleteOrder,
  reopenOrder,
  setOrderTime,
  updateOrder,
} from '../api/orders'
import type { OrderFormInput } from '../types/order'

function useInvalidateOrders() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['orders'] })
}

export function useCreateOrder() {
  const invalidate = useInvalidateOrders()
  return useMutation({
    mutationFn: createOrder,
    onSuccess: invalidate,
  })
}

export function useUpdateOrder() {
  const invalidate = useInvalidateOrders()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: OrderFormInput }) => updateOrder(id, input),
    onSuccess: invalidate,
  })
}

export function useDeleteOrder() {
  const invalidate = useInvalidateOrders()
  return useMutation({
    mutationFn: deleteOrder,
    onSuccess: invalidate,
  })
}

export function useSetOrderTime() {
  const invalidate = useInvalidateOrders()
  return useMutation({
    mutationFn: ({ id, from, to }: { id: string; from: string; to: string }) =>
      setOrderTime(id, from, to),
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
