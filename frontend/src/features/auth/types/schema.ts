import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Bitte eine gültige E-Mail-Adresse eingeben.'),
  password: z.string().min(8, 'Das Passwort muss mindestens 8 Zeichen lang sein.'),
})

export type LoginInput = z.infer<typeof loginSchema>
