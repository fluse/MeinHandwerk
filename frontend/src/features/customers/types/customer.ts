import { z } from 'zod'

export interface Customer {
  id: string
  kdnr: string
  name: string
  contact: string
  street: string
  zip: string
  city: string
  phone: string
  email: string
  notes: string
}

export const customerFormSchema = z
  .object({
    kdnr: z.string().optional(),
    name: z.string().optional(),
    contact: z.string().optional(),
    street: z.string().optional(),
    zip: z.string().optional(),
    city: z.string().optional(),
    phone: z.string().optional(),
    email: z.union([z.literal(''), z.email('Bitte eine gültige E-Mail-Adresse eingeben.')]),
    notes: z.string().optional(),
  })
  .refine((v) => (v.name ?? '').trim() || (v.contact ?? '').trim(), {
    message: 'Bitte Name/Firma oder Ansprechpartner angeben.',
    path: ['name'],
  })
export type CustomerFormInput = z.infer<typeof customerFormSchema>
