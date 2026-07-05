import { z } from 'zod'
import { ROLE_VALUES } from '@/core/lib/roles'

export interface TeamMember {
  id: string
  name: string
  email: string
  role: (typeof ROLE_VALUES)[number]
  phone: string
}

export const createMemberSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich.'),
  email: z.email('Bitte eine gültige E-Mail-Adresse eingeben.'),
  password: z.string().min(8, 'Das Passwort muss mindestens 8 Zeichen lang sein.'),
  role: z.enum(ROLE_VALUES),
  phone: z.string().optional(),
})
export type CreateMemberInput = z.infer<typeof createMemberSchema>

export const editMemberSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich.'),
  role: z.enum(ROLE_VALUES),
  phone: z.string().optional(),
})
export type EditMemberInput = z.infer<typeof editMemberSchema>
