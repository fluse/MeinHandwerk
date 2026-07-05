import type { TeamMember } from '../types/member'

interface MemberCardProps {
  member: TeamMember
  isSelf: boolean
  onEdit: () => void
  onDelete: () => void
}

export function MemberCard({ member, isSelf, onEdit, onDelete }: MemberCardProps) {
  const contact = [member.phone, member.email].filter(Boolean).join(' · ')

  return (
    <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-ink">
          {member.name}
          {isSelf ? ' (du)' : ''}
        </div>
        <div className="truncate text-xs text-muted">{contact || 'kein Kontakt hinterlegt'}</div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="text-xs font-bold cursor-pointer text-sage-deep hover:underline"
      >
        Bearbeiten
      </button>
      {!isSelf && (
        <button
          type="button"
          onClick={onDelete}
          className="text-xs cursor-pointer font-semibold text-danger hover:underline"
        >
          Entfernen
        </button>
      )}
    </div>
  )
}
