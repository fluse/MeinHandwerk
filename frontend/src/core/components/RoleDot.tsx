import type { Role } from '@/core/lib/roles'

const dotClass: Record<Role, string> = {
  chef: 'bg-role-chef',
  buero: 'bg-role-buero',
  monteur: 'bg-role-monteur',
  helfer: 'bg-role-helfer',
}

export function RoleDot({ role, className = '' }: { role: Role; className?: string }) {
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${dotClass[role]} ${className}`} />
}
