import type { RecordModel } from 'pocketbase'
import { pb } from '@/core/api/pocketbase'
import { hoursBetween } from '@/core/lib/time'
import type { TimeEntry, TimeEntryFormInput } from '../types/timelog'

function toTimeEntry(r: RecordModel): TimeEntry {
  return {
    id: r.id,
    employee: r.employee,
    date: r.date,
    von: r.von ?? '',
    bis: r.bis ?? '',
    hours: r.hours ?? 0,
    travelVon: r.travelVon ?? '',
    travelBis: r.travelBis ?? '',
    travel: r.travel ?? 0,
    order: r.order ?? '',
    note: r.note ?? '',
  }
}

function parseHours(raw?: string): number {
  const n = parseFloat((raw ?? '').replace(',', '.'))
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0
}

function toPayload(input: TimeEntryFormInput) {
  const hours =
    input.von && input.bis ? hoursBetween(input.von, input.bis) : parseHours(input.hours)
  const travel =
    input.travelVon && input.travelBis
      ? hoursBetween(input.travelVon, input.travelBis)
      : parseHours(input.travel)
  return {
    employee: input.employee,
    date: input.date,
    von: input.von || '',
    bis: input.bis || '',
    hours,
    travelVon: input.travelVon || '',
    travelBis: input.travelBis || '',
    travel,
    order: input.order || '',
    note: input.note ?? '',
  }
}

export async function listTimelogInRange(fromISO: string, toISO: string): Promise<TimeEntry[]> {
  const records = await pb.collection('timelog').getFullList({
    filter: pb.filter('date >= {:from} && date <= {:to}', { from: fromISO, to: toISO }),
    sort: '-date',
  })
  return records.map(toTimeEntry)
}

export async function createTimeEntry(input: TimeEntryFormInput): Promise<TimeEntry> {
  const payload = toPayload(input)
  if (!(payload.hours > 0) && !(payload.travel > 0)) {
    throw new Error('Bitte Arbeitszeit oder Fahrzeit eingeben.')
  }
  return toTimeEntry(await pb.collection('timelog').create(payload))
}

export async function updateTimeEntry(id: string, input: TimeEntryFormInput): Promise<TimeEntry> {
  const payload = toPayload(input)
  if (!(payload.hours > 0) && !(payload.travel > 0)) {
    throw new Error('Bitte Arbeitszeit oder Fahrzeit eingeben.')
  }
  return toTimeEntry(await pb.collection('timelog').update(id, payload))
}

export async function deleteTimeEntry(id: string): Promise<void> {
  await pb.collection('timelog').delete(id)
}
