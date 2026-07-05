import { z } from 'zod'

export const TRADE_VALUES = [
  'heizung',
  'sanitaer',
  'elektro',
  'klima',
  'innenausbau',
  'besichtigung',
  'urlaub',
  'krank',
] as const
export type Trade = (typeof TRADE_VALUES)[number]

export const TRADES: Record<Trade, string> = {
  heizung: 'Heizung',
  sanitaer: 'Sanitär',
  elektro: 'Elektro',
  klima: 'Klima',
  innenausbau: 'Innenausbau',
  besichtigung: 'Besichtigung',
  urlaub: 'Urlaub',
  krank: 'Krank',
}

export const ORDER_STATUS_VALUES = ['offen', 'erledigt'] as const
export type OrderStatus = (typeof ORDER_STATUS_VALUES)[number]

export interface Order {
  id: string
  title: string
  trade: Trade
  date: string
  from: string
  to: string
  client: string
  phone: string
  address: string
  material: string
  desc: string
  note: string
  assigned: string[]
  status: OrderStatus
  project: string
  closedBy: string
  closedAt: string
  rapportSigned: boolean
  rapportReason: string
  created: string
}

const timePattern = /^\d{2}:\d{2}$/

export const orderFormSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich.'),
  trade: z.enum(TRADE_VALUES),
  date: z.string().min(1, 'Datum ist erforderlich.'),
  from: z.union([z.literal(''), z.string().regex(timePattern)]).optional(),
  to: z.union([z.literal(''), z.string().regex(timePattern)]).optional(),
  client: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  material: z.string().optional(),
  desc: z.string().optional(),
  note: z.string().optional(),
  assigned: z.array(z.string()),
  /** Gesetzt, wenn der Auftrag über "Projekt → Kalender einplanen" angelegt wird. */
  project: z.string().optional(),
})
export type OrderFormInput = z.infer<typeof orderFormSchema>

export interface OrderPhoto {
  id: string
  order: string
  uploadedBy: string
  url: string
}
