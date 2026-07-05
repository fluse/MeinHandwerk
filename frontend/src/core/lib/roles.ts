import chefIcon from '@/assets/roles/chef.png'
import bueroIcon from '@/assets/roles/buero.png'
import monteurIcon from '@/assets/roles/monteur.png'
import helferIcon from '@/assets/roles/helfer.png'

export const ROLE_VALUES = ['chef', 'buero', 'monteur', 'helfer'] as const
export type Role = (typeof ROLE_VALUES)[number]

export const ROLES: Record<Role, { label: string; icon: string }> = {
  chef: { label: 'Chef', icon: chefIcon },
  buero: { label: 'Büro', icon: bueroIcon },
  monteur: { label: 'Monteur', icon: monteurIcon },
  helfer: { label: 'Helfer/Azubi', icon: helferIcon },
}

export function canPlanRole(role: Role | null | undefined): boolean {
  return role === 'chef' || role === 'buero'
}

export function isRestrictedRole(role: Role | null | undefined): boolean {
  return role === 'monteur' || role === 'helfer'
}
