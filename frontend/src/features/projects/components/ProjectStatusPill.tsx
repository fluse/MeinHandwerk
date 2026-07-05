import { colorVar } from '@/core/lib/cssVar'
import { PROJECT_STATUS_LABELS, type ProjectStatus } from '../types/project'

export function ProjectStatusPill({ status }: { status: ProjectStatus }) {
  return (
    <span
      className="whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold"
      style={{
        background: colorVar(`pstatus-${status}-bg`),
        color: colorVar(`pstatus-${status}-fg`),
      }}
    >
      {PROJECT_STATUS_LABELS[status]}
    </span>
  )
}
