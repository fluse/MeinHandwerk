import { z } from 'zod'

export interface Rapport {
  id: string
  order: string
  author: string
  text: string
  signatureUrl: string
  signedName: string
  date: string
}

export interface RapportMaterial {
  id: string
  rapport: string
  qty: string
  unit: string
  desc: string
}

export const rapportFormSchema = z.object({
  date: z.string().min(1, 'Datum ist erforderlich.'),
  text: z.string().min(1, 'Bitte die ausgeführten Arbeiten beschreiben.'),
  signedName: z.string().optional(),
})
export type RapportFormInput = z.infer<typeof rapportFormSchema>

/** Materialzeile im Formular – "isNew" unterscheidet neue (noch nicht in PocketBase existente)
 *  Zeilen von bestehenden `rapport_materials`-Records, da die Collection keine Array-Spalte ist. */
export interface MaterialLine {
  id: string
  isNew: boolean
  qty: string
  unit: string
  desc: string
}
