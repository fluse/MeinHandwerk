import { z } from 'zod'

export interface TimeEntry {
  id: string
  employee: string
  date: string
  von: string
  bis: string
  hours: number
  travelVon: string
  travelBis: string
  travel: number
  order: string
  note: string
}

export const timeEntryFormSchema = z.object({
  employee: z.string().min(1, 'Bitte Mitarbeiter wählen.'),
  date: z.string().min(1, 'Datum ist erforderlich.'),
  von: z.string().optional(),
  bis: z.string().optional(),
  hours: z.string().optional(),
  travelVon: z.string().optional(),
  travelBis: z.string().optional(),
  travel: z.string().optional(),
  order: z.string().optional(),
  note: z.string().optional(),
})
export type TimeEntryFormInput = z.infer<typeof timeEntryFormSchema>
