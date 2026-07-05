import type { RecordModel } from 'pocketbase'
import { pb } from '@/core/api/pocketbase'
import { compressImage, dataUrlToBlob } from '@/core/lib/image'
import type { OrderPhoto } from '../types/order'

function toPhoto(r: RecordModel): OrderPhoto {
  return {
    id: r.id,
    order: r.order,
    uploadedBy: r.uploadedBy,
    url: pb.files.getURL(r, r.file),
  }
}

export async function listOrderPhotos(orderId: string): Promise<OrderPhoto[]> {
  const records = await pb.collection('order_photos').getFullList({
    filter: pb.filter('order = {:order}', { order: orderId }),
    sort: '-created',
  })
  return records.map(toPhoto)
}

export async function uploadOrderPhoto(
  orderId: string,
  file: File,
  uploadedBy: string,
): Promise<OrderPhoto> {
  const compressed = await compressImage(file)
  const blob = await dataUrlToBlob(compressed)
  const formData = new FormData()
  formData.append('order', orderId)
  formData.append('uploadedBy', uploadedBy)
  formData.append('file', blob, file.name)
  const record = await pb.collection('order_photos').create(formData)
  return toPhoto(record)
}

export async function deleteOrderPhoto(photoId: string): Promise<void> {
  await pb.collection('order_photos').delete(photoId)
}
