import { useEffect } from 'react'

let lockCount = 0

/** Sperrt das Scrollen des Haupt-Scroll-Containers (`#app-scroll-area` in AppLayout, das
 * eigentlich scrollende Element im Grid-App-Gerüst – nicht `<body>`), solange `active` true
 * ist. Zählt Aufrufe, damit verschachtelte Dialoge (z. B. ein ConfirmDialog innerhalb eines
 * anderen Dialogs) sich nicht gegenseitig vorzeitig entsperren. */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return

    const scrollArea = document.getElementById('app-scroll-area')

    lockCount += 1
    if (lockCount === 1) {
      document.body.style.overflow = 'hidden'
      if (scrollArea) scrollArea.style.overflow = 'hidden'
    }

    return () => {
      lockCount -= 1
      if (lockCount === 0) {
        document.body.style.overflow = ''
        if (scrollArea) scrollArea.style.overflow = ''
      }
    }
  }, [active])
}
