import { useEffect } from 'react'

let lockCount = 0

/** Sperrt das Scrollen von `<body>`, solange `active` true ist. Zählt Aufrufe,
 * damit verschachtelte Dialoge (z. B. ein ConfirmDialog innerhalb eines anderen
 * Dialogs) sich nicht gegenseitig vorzeitig entsperren. */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return

    lockCount += 1
    if (lockCount === 1) {
      document.body.style.overflow = 'hidden'
    }

    return () => {
      lockCount -= 1
      if (lockCount === 0) {
        document.body.style.overflow = ''
      }
    }
  }, [active])
}
