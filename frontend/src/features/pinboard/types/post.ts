import { HelpCircle, type LucideIcon, Megaphone, Sparkles, ThumbsUp, Truck, Wrench } from 'lucide-react'
import { z } from 'zod'

export const CATEGORY_VALUES = [
  'werkzeug',
  'sauberkeit',
  'frage',
  'info',
  'lob',
  'fahrzeug',
] as const
export type Category = (typeof CATEGORY_VALUES)[number]

export const CATEGORIES: Record<Category, { label: string; icon: LucideIcon }> = {
  werkzeug: { label: 'Werkzeug', icon: Wrench },
  sauberkeit: { label: 'Sauberkeit', icon: Sparkles },
  frage: { label: 'Frage', icon: HelpCircle },
  info: { label: 'Info', icon: Megaphone },
  lob: { label: 'Lob & Danke', icon: ThumbsUp },
  fahrzeug: { label: 'Fahrzeug/Material', icon: Truck },
}

/** Kategorien, die ein Beitrag als "geklärt" markiert werden können. */
export const RESOLVABLE: Category[] = ['werkzeug', 'frage', 'fahrzeug', 'sauberkeit']

export interface Post {
  id: string
  author: string
  text: string
  category: Category
  imageUrl: string
  pinned: boolean
  resolved: boolean
  likes: string[]
  created: string
}

export const postFormSchema = z.object({
  text: z.string().optional(),
  category: z.enum(CATEGORY_VALUES),
})
export type PostFormInput = z.infer<typeof postFormSchema>

export interface Comment {
  id: string
  post: string
  author: string
  text: string
  created: string
}
