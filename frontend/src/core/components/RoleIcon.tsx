import { ROLES, type Role } from '@/core/lib/roles'

const borderClass: Record<Role, string> = {
  chef: 'border-role-chef/35',
  buero: 'border-role-buero/35',
  monteur: 'border-role-monteur/35',
  helfer: 'border-role-helfer/35',
}

export function RoleIcon({ role, size = 20 }: { role: Role; size?: number }) {
  const inner = Math.round(size * 0.82)
  return (
    <span
      className={`inline-flex flex-none items-center justify-center rounded-[30%] border bg-card shadow-sm ${borderClass[role]}`}
      style={{ width: size, height: size }}
    >
      <img
        src={ROLES[role].icon}
        alt={ROLES[role].label}
        width={inner}
        height={inner}
        className="object-contain"
      />
    </span>
  )
}
