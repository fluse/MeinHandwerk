import type { RecordModel } from 'pocketbase'
import { pb } from '@/core/api/pocketbase'
import type { RapportMaterial } from '../types/rapport'

function toMaterial(r: RecordModel): RapportMaterial {
  return {
    id: r.id,
    rapport: r.rapport,
    qty: r.qty != null ? String(r.qty) : '',
    unit: r.unit ?? '',
    desc: r.desc ?? '',
  }
}

export async function listRapportMaterials(rapportId: string): Promise<RapportMaterial[]> {
  const records = await pb.collection('rapport_materials').getFullList({
    filter: pb.filter('rapport = {:rapport}', { rapport: rapportId }),
  })
  return records.map(toMaterial)
}

interface MaterialPayload {
  qty: string
  unit: string
  desc: string
}

function toPayload(input: MaterialPayload) {
  const qty = parseFloat(input.qty.replace(',', '.'))
  return { qty: Number.isFinite(qty) ? qty : null, unit: input.unit, desc: input.desc }
}

export async function createRapportMaterial(
  rapportId: string,
  input: MaterialPayload,
): Promise<RapportMaterial> {
  const record = await pb
    .collection('rapport_materials')
    .create({ rapport: rapportId, ...toPayload(input) })
  return toMaterial(record)
}

export async function updateRapportMaterial(
  id: string,
  input: MaterialPayload,
): Promise<RapportMaterial> {
  const record = await pb.collection('rapport_materials').update(id, toPayload(input))
  return toMaterial(record)
}

export async function deleteRapportMaterial(id: string): Promise<void> {
  await pb.collection('rapport_materials').delete(id)
}
