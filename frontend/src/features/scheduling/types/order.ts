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
  client: string
  phone: string
  street: string
  zip: string
  city: string
  material: string
  desc: string
  note: string
  status: OrderStatus
  project: string
  customer: string
  customerName: string
  site: string
  closedBy: string
  closedAt: string
  rapportSigned: boolean
  rapportReason: string
  created: string
}

/** Ein Termin (Tag + Zeitfenster + Team) eines Auftrags – ein Auftrag kann mehrere haben (siehe
 * feature-order-flow-vehicle-position.md, "Mehrtägige Aufträge mit mehreren Zeitblöcken"). */
export interface OrderBlock {
  id: string
  order: string
  date: string
  from: string
  to: string
  assigned: string[]
  created: string
}

/** Ein Auftrag, wie er an einem bestimmten Kalendertag "auftritt": Order-Felder plus genau einen
 * seiner Blöcke. `listOrdersInRange`/`listOrders` liefern eine Zeile pro Block – ein Auftrag mit
 * mehreren Terminen im Zeitraum erscheint entsprechend mehrfach (gewollt für die Kalenderanzeige,
 * jeweils mit eigener `blockId`). */
export interface ScheduledOrder extends Order {
  blockId: string
  date: string
  from: string
  to: string
  assigned: string[]
}

const timePattern = /^\d{2}:\d{2}$/

export const orderBlockFormSchema = z.object({
  date: z.string().min(1, 'Datum ist erforderlich.'),
  from: z.union([z.literal(''), z.string().regex(timePattern)]).optional(),
  to: z.union([z.literal(''), z.string().regex(timePattern)]).optional(),
  assigned: z.array(z.string()),
})
export type OrderBlockFormInput = z.infer<typeof orderBlockFormSchema>

export const orderFormSchema = z
  .object({
    title: z.string().min(1, 'Titel ist erforderlich.'),
    trade: z.enum(TRADE_VALUES),
    client: z.string().optional(),
    phone: z.string().optional(),
    street: z.string().optional(),
    zip: z.string().optional(),
    city: z.string().optional(),
    material: z.string().optional(),
    desc: z.string().optional(),
    note: z.string().optional(),
    blocks: z.array(orderBlockFormSchema).min(1, 'Mindestens ein Termin ist erforderlich.'),
    /** Gesetzt, wenn der Auftrag über "Projekt → Kalender einplanen" angelegt wird. */
    project: z.string().optional(),
    customer: z.string().optional(),
    site: z.string().optional(),
  })
  .superRefine((input, ctx) => {
    const seen = new Set<string>()
    input.blocks.forEach((block, index) => {
      if (!block.date || !seen.has(block.date)) {
        seen.add(block.date)
        return
      }
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Für dieses Datum gibt es bereits einen Termin.',
        path: ['blocks', index, 'date'],
      })
    })
  })
export type OrderFormInput = z.infer<typeof orderFormSchema>

export interface OrderPhoto {
  id: string
  order: string
  uploadedBy: string
  url: string
}
