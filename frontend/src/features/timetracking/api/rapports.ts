import type { RecordModel } from 'pocketbase'
import { pb } from '@/core/api/pocketbase'
import { dataUrlToBlob } from '@/core/lib/image'
import type { Rapport, RapportFormInput } from '../types/rapport'

function toRapport(r: RecordModel): Rapport {
  return {
    id: r.id,
    order: r.order,
    author: r.author,
    text: r.text ?? '',
    signatureUrl: r.signature ? pb.files.getURL(r, r.signature) : '',
    signedName: r.signedName ?? '',
    date: r.date,
  }
}

export async function listRapportsForOrder(orderId: string): Promise<Rapport[]> {
  const records = await pb.collection('rapports').getFullList({
    filter: pb.filter('order = {:order}', { order: orderId }),
    sort: '-date',
  })
  return records.map(toRapport)
}

export async function getRapport(id: string): Promise<Rapport> {
  return toRapport(await pb.collection('rapports').getOne(id))
}

interface SaveRapportInput extends RapportFormInput {
  orderId: string
  authorId: string
  /** Data-URL aus dem SignaturePad; leer = keine (neue) Unterschrift mitschicken. */
  signatureDataUrl?: string
}

export async function createRapport(input: SaveRapportInput): Promise<Rapport> {
  const formData = new FormData()
  formData.append('order', input.orderId)
  formData.append('author', input.authorId)
  formData.append('text', input.text)
  formData.append('date', input.date)
  formData.append('signedName', input.signedName ?? '')
  if (input.signatureDataUrl) {
    const blob = await dataUrlToBlob(input.signatureDataUrl)
    formData.append('signature', blob, 'signature.png')
  }
  const record = await pb.collection('rapports').create(formData)
  return toRapport(record)
}

export async function updateRapport(id: string, input: SaveRapportInput): Promise<Rapport> {
  const formData = new FormData()
  formData.append('text', input.text)
  formData.append('date', input.date)
  formData.append('signedName', input.signedName ?? '')
  if (input.signatureDataUrl) {
    const blob = await dataUrlToBlob(input.signatureDataUrl)
    formData.append('signature', blob, 'signature.png')
  }
  const record = await pb.collection('rapports').update(id, formData)
  return toRapport(record)
}

export async function deleteRapport(id: string): Promise<void> {
  await pb.collection('rapports').delete(id)
}
