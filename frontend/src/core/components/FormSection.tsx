import type { ReactNode } from 'react'

export const formFieldClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20'
export const formLabelClass = 'text-xs font-semibold text-ink'

export function FormSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  return (
    <section className="mb-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3.5 flex items-center gap-2 border-b border-border pb-3">
        <span className="text-sage-deep">{icon}</span>
        <h2 className="text-sm font-bold text-ink">{title}</h2>
      </div>
      {children}
    </section>
  )
}
