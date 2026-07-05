import { useState } from 'react'
import { useAuth } from '@/core/auth/AuthProvider'
import { RoleIcon } from '@/core/components/RoleIcon'
import { ConfirmDialog } from '@/core/components/ConfirmDialog'
import { ROLES, ROLE_VALUES } from '@/core/lib/roles'
import { useTeam } from '../hooks/useTeam'
import { useDeleteMember } from '../hooks/useDeleteMember'
import { MemberCard } from '../components/MemberCard'
import { AddMemberForm } from '../components/AddMemberForm'
import { EditMemberDialog } from '../components/EditMemberDialog'
import type { TeamMember } from '../types/member'

export function TeamPage() {
  const { user } = useAuth()
  const { data: team, isLoading, isError } = useTeam()
  const deleteMember = useDeleteMember()
  const [editing, setEditing] = useState<TeamMember | null>(null)
  const [removing, setRemoving] = useState<TeamMember | null>(null)

  if (isLoading) {
    return <p className="text-sm text-muted">Team wird geladen…</p>
  }

  if (isError || !team) {
    return <p className="text-sm text-danger">Team konnte nicht geladen werden.</p>
  }

  const grouped = ROLE_VALUES.map((role) => ({
    role,
    members: team.filter((m) => m.role === role),
  }))

  return (
    <div className="mx-auto max-w-lg pb-10">
      <h1 className="mb-4 text-lg font-bold text-ink">Team & Einstellungen</h1>

      {grouped.map((group) => (
        <div key={group.role} className="mb-4">
          <div className="mb-2 flex items-center gap-1.5 text-sm font-extrabold text-sage-deep">
            <RoleIcon role={group.role} size={20} />
            {ROLES[group.role].label}
          </div>
          {group.members.length === 0 && <div className="mb-1.5 text-sm text-muted">—</div>}
          {group.members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              isSelf={member.id === user?.id}
              onEdit={() => setEditing(member)}
              onDelete={() => setRemoving(member)}
            />
          ))}
        </div>
      ))}

      <AddMemberForm />

      <div className="mt-5 rounded-xl bg-[#EEF2EA] p-3.5 text-sm leading-relaxed text-sage-text">
        <b>App verteilen:</b> Neue Kolleg:innen bekommen hier einen echten Zugang (E-Mail +
        Passwort) und können sich direkt anmelden.
      </div>

      {editing && <EditMemberDialog member={editing} onClose={() => setEditing(null)} />}

      <ConfirmDialog
        open={removing != null}
        title={`${removing?.name} entfernen?`}
        description="Der Zugang wird gelöscht und kann nicht rückgängig gemacht werden."
        confirmLabel="Entfernen"
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) deleteMember.mutate(removing.id)
          setRemoving(null)
        }}
      />
    </div>
  )
}
