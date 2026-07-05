import { z } from 'zod'

export const PROJECT_STATUS_VALUES = ['offen', 'eingeplant', 'erledigt'] as const
export type ProjectStatus = (typeof PROJECT_STATUS_VALUES)[number]

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  offen: 'Einzuplanen',
  eingeplant: 'Eingeplant',
  erledigt: 'Erledigt',
}

export interface Project {
  id: string
  projnr: string
  title: string
  client: string
  street: string
  zip: string
  city: string
  phone: string
  value: number | null
  date: string
  desc: string
  status: ProjectStatus
  scheduledOrder: string
}

export const projectFormSchema = z.object({
  projnr: z.string().optional(),
  title: z.string().min(1, 'Bezeichnung ist erforderlich.'),
  client: z.string().optional(),
  street: z.string().optional(),
  zip: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  value: z.string().optional(),
  date: z.string().optional(),
  desc: z.string().optional(),
  status: z.enum(PROJECT_STATUS_VALUES),
})
export type ProjectFormInput = z.infer<typeof projectFormSchema>
