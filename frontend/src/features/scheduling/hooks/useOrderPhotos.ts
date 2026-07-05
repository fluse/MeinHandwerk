import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteOrderPhoto, listOrderPhotos, uploadOrderPhoto } from '../api/orderPhotos'

function photosQueryKey(orderId: string) {
  return ['order-photos', orderId] as const
}

export function useOrderPhotos(orderId: string, enabled = true) {
  return useQuery({
    queryKey: photosQueryKey(orderId),
    queryFn: () => listOrderPhotos(orderId),
    enabled,
  })
}

export function useUploadOrderPhoto(orderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, uploadedBy }: { file: File; uploadedBy: string }) =>
      uploadOrderPhoto(orderId, file, uploadedBy),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: photosQueryKey(orderId) }),
  })
}

export function useDeleteOrderPhoto(orderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteOrderPhoto,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: photosQueryKey(orderId) }),
  })
}
