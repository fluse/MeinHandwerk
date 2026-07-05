import { GraduationCap, type LucideIcon, Megaphone, PartyPopper, TreePine } from 'lucide-react'
import { z } from 'zod'

export const EVENT_TYPE_VALUES = ['fest', 'feier', 'schulung', 'info'] as const
export type EventType = (typeof EVENT_TYPE_VALUES)[number]

export const EVENT_TYPES: Record<EventType, { label: string; icon: LucideIcon }> = {
  fest: { label: 'Fest', icon: PartyPopper },
  feier: { label: 'Feier', icon: TreePine },
  schulung: { label: 'Schulung', icon: GraduationCap },
  info: { label: 'Info', icon: Megaphone },
}

export interface EventItem {
  id: string
  title: string
  type: EventType
  date: string
  time: string
  location: string
  desc: string
  by: string
  rsvp: string[]
  created: string
}

export const eventFormSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich.'),
  type: z.enum(EVENT_TYPE_VALUES),
  date: z.string().optional(),
  time: z.string().optional(),
  location: z.string().optional(),
  desc: z.string().optional(),
})
export type EventFormInput = z.infer<typeof eventFormSchema>
