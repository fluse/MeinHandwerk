import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createOrderCheckin, listOrderCheckins, type CheckinType } from '../api/orderCheckins'

function checkinsQueryKey(orderId: string) {
  return ['order-checkins', orderId] as const
}

export function useOrderCheckins(orderId: string, enabled = true) {
  return useQuery({
    queryKey: checkinsQueryKey(orderId),
    queryFn: () => listOrderCheckins(orderId),
    enabled: enabled && Boolean(orderId),
  })
}

export function useCreateOrderCheckin(orderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ employeeId, type }: { employeeId: string; type: CheckinType }) =>
      createOrderCheckin(orderId, employeeId, type),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: checkinsQueryKey(orderId) }),
  })
}
