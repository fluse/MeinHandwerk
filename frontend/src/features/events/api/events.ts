import type { RecordModel } from 'pocketbase'
import { pb } from '@/core/api/pocketbase'
import type { EventFormInput, EventItem } from '../types/event'

function toEvent(r: RecordModel): EventItem {
  return {
    id: r.id,
    title: r.title,
    type: r.type,
    date: r.date ?? '',
    time: r.time ?? '',
    location: r.location ?? '',
    desc: r.desc ?? '',
    by: r.by,
    rsvp: r.rsvp ?? [],
    created: r.created,
  }
}

export async function listEvents(): Promise<EventItem[]> {
  const records = await pb.collection('events').getFullList({ sort: 'date' })
  return records.map(toEvent)
}

export async function createEvent(input: EventFormInput, byId: string): Promise<EventItem> {
  const record = await pb.collection('events').create({
    title: input.title,
    type: input.type,
    date: input.date ?? '',
    time: input.time ?? '',
    location: input.location ?? '',
    desc: input.desc ?? '',
    by: byId,
    rsvp: [],
  })
  return toEvent(record)
}

export async function deleteEvent(id: string): Promise<void> {
  await pb.collection('events').delete(id)
}

export async function setRsvp(id: string, rsvp: string[]): Promise<EventItem> {
  const record = await pb.collection('events').update(id, { rsvp })
  return toEvent(record)
}
