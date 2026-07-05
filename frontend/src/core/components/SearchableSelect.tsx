import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'

export interface SearchableSelectItem {
  id: string
  label: string
  subtitle?: string
}

interface SearchableSelectProps {
  id?: string
  value: string
  onChange: (id: string) => void
  items: SearchableSelectItem[]
  emptyOptionLabel: string
  searchPlaceholder?: string
}

export function SearchableSelect({
  id,
  value,
  onChange,
  items,
  emptyOptionLabel,
  searchPlaceholder = 'Suchen…',
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const selected = items.find((i) => i.id === value)
  const q = search.trim().toLowerCase()
  const filtered = q
    ? items.filter((i) => `${i.label} ${i.subtitle ?? ''}`.toLowerCase().includes(q))
    : items

  const select = (itemId: string) => {
    onChange(itemId)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-md border border-border px-3 py-2 text-left text-sm focus:border-sage focus:outline-none"
      >
        <div className="min-w-0 flex-1">
          {selected ? (
            <>
              <div className="truncate font-medium text-ink">{selected.label}</div>
              {selected.subtitle && (
                <div className="truncate text-xs text-muted">{selected.subtitle}</div>
              )}
            </>
          ) : (
            <div className="text-muted">{emptyOptionLabel}</div>
          )}
        </div>
        <ChevronDown size={16} className="flex-none text-muted" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-72 overflow-hidden rounded-md border border-border bg-card shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search size={14} className="flex-none text-muted" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full text-sm outline-none"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => select('')}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-page ${
                value === '' ? 'text-sage-deep' : 'text-muted'
              }`}
            >
              <span className="w-4 flex-none">{value === '' && <Check size={14} />}</span>
              {emptyOptionLabel}
            </button>
            {filtered.map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => select(i.id)}
                className={`flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-page ${
                  value === i.id ? 'bg-page' : ''
                }`}
              >
                <span className="w-4 flex-none pt-0.5">
                  {value === i.id && <Check size={14} className="text-sage-deep" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">{i.label}</div>
                  {i.subtitle && <div className="truncate text-xs text-muted">{i.subtitle}</div>}
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted">Keine Treffer.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
