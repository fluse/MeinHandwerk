import type { CSSProperties, FormEvent, MouseEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useBodyScrollLock } from '@/core/hooks/useBodyScrollLock'

interface OverlayProps {
  /** @default true — für Dialoge, die nur bedingt gemountet werden. */
  open?: boolean
  /** 'center' für kompakte Dialoge, 'sheet' für ein Bottom-Sheet. */
  variant?: 'center' | 'sheet'
  /** Bei 'sheet': ab dem sm-Breakpoint mittig statt am unteren Rand anzeigen. */
  responsive?: boolean
  /** Verzichtet auf die Standard-Panel-Klassen (Größe/Rundung/Padding) für Sonderfälle. */
  bare?: boolean
  /** @default true bei variant 'sheet', sonst false */
  showHandle?: boolean
  /** Rendert das Panel als <form>, statt als <div>. */
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void
  /** Schließt den Dialog bei Klick auf das Backdrop (Klicks im Panel schließen nicht). */
  onBackdropClick?: () => void
  panelClassName?: string
  panelStyle?: CSSProperties
  children: ReactNode
}

/** Gemeinsamer Overlay-Rahmen für alle Dialog-/Sheet-Komponenten.
 * Sperrt das Hintergrund-Scrollen, solange er offen ist. */
export function Overlay({
  open = true,
  variant = 'center',
  responsive = false,
  bare = false,
  showHandle = variant === 'sheet',
  onSubmit,
  onBackdropClick,
  panelClassName = '',
  panelStyle,
  children,
}: OverlayProps) {
  useBodyScrollLock(open)

  if (!open) return null

  const alignClass =
    variant === 'sheet'
      ? responsive
        ? 'items-end sm:items-center'
        : 'items-end'
      : 'items-center px-4'
  const panelBaseClass = bare
    ? ''
    : variant === 'sheet'
      ? 'max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card p-5'
      : 'w-full max-w-sm rounded-lg bg-card p-5 shadow-xl'
  const panelClass = [panelBaseClass, panelClassName].filter(Boolean).join(' ')
  const handle = showHandle && !bare && (
    <div className="mx-auto mb-3.5 h-1 w-10 rounded-full bg-border" />
  )
  const stopPropagation = onBackdropClick
    ? (e: MouseEvent<HTMLElement>) => e.stopPropagation()
    : undefined

  // Per Portal direkt an <body> gerendert: sonst würde ein Overlay, das innerhalb des sticky
  // Headers ausgelöst wird (z. B. die Meldungen-Glocke), im lokalen Stacking-Context des Headers
  // gefangen bleiben und trotz z-50 hinter der ebenfalls sticky positionierten BottomNav liegen.
  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex justify-center bg-black/40 ${alignClass}`}
      onClick={onBackdropClick}
    >
      {onSubmit ? (
        <form
          onSubmit={onSubmit}
          className={panelClass}
          style={panelStyle}
          onClick={stopPropagation}
        >
          {handle}
          {children}
        </form>
      ) : (
        <div className={panelClass} style={panelStyle} onClick={stopPropagation}>
          {handle}
          {children}
        </div>
      )}
    </div>,
    document.body,
  )
}
