import { pb } from '@/core/api/pocketbase'
import type { Role } from '@/core/lib/roles'

export interface RosterMember {
  id: string
  name: string
  role: Role
  phone: string
  email: string
}

/** Team-Übersicht direkt aus der `users`-Collection – von mehreren Features geteilt
 *  (Scheduling, Pinnwand, Events), daher hier statt in einem einzelnen Feature. */
export async function listRoster(): Promise<RosterMember[]> {
  const records = await pb.collection('users').getFullList({ sort: 'name' })
  return records.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    phone: r.phone ?? '',
    email: r.email ?? '',
  }))
}
