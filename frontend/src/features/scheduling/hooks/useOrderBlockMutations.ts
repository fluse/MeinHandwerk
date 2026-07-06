import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createOrderBlock,
  deleteOrderBlock,
  updateOrderBlock,
  updateOrderBlockTime,
} from '../api/orderBlocks'
import type { OrderBlockFormInput } from '../types/order'
import { orderBlocksQueryKey } from './useOrderBlocks'

function useInvalidateOrders() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['orders'] })
}

export function useOrderBlockMutations(orderId: string) {
  const queryClient = useQueryClient()
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: orderBlocksQueryKey(orderId) })
    queryClient.invalidateQueries({ queryKey: ['orders'] })
  }

  const create = useMutation({
    mutationFn: (input: OrderBlockFormInput) => createOrderBlock(orderId, input),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: OrderBlockFormInput }) =>
      updateOrderBlock(id, input),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: deleteOrderBlock,
    onSuccess: invalidate,
  })

  return { create, update, remove }
}

/** Für das Verschieben/Größenändern eines Termins im Tagesboard (Drag statt Formular). */
export function useUpdateOrderBlockTime() {
  const invalidate = useInvalidateOrders()
  return useMutation({
    mutationFn: ({ id, from, to }: { id: string; from: string; to: string }) =>
      updateOrderBlockTime(id, from, to),
    onSuccess: invalidate,
  })
}
