import type { LucideIcon } from 'lucide-react'

interface DetailRowProps {
  icon: LucideIcon
  label: string
  value?: string
  href?: string
}

export function DetailRow({ icon: Icon, label, value, href }: DetailRowProps) {
  if (!value) return null
  return (
    <div className="flex gap-2.5 border-b border-border py-2 last:border-b-0">
      <div className="flex w-5 flex-none items-start justify-center pt-0.5 text-muted">
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold text-muted">{label}</div>
        {href ? (
          <a href={href} className="text-sm font-semibold text-sage-deep no-underline">
            {value}
          </a>
        ) : (
          <div className="whitespace-pre-wrap text-sm">{value}</div>
        )}
      </div>
    </div>
  )
}
