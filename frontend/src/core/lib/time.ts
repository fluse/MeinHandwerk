export const WD = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

/** Zeitstrahl-Grenzen für die Tagesansichten: 06:00–20:00, 46px pro Stunde. */
export const DAY_START_HOUR = 6
export const DAY_END_HOUR = 20
export const PIXELS_PER_HOUR = 46

/** Formatiert eine Stunden-Fließkommazahl (z. B. 8.5) als "HH:MM", begrenzt auf [h0, h1]. */
export function formatHour(value: number, h0 = DAY_START_HOUR, h1 = DAY_END_HOUR): string {
  const clamped = Math.max(h0, Math.min(h1, value))
  let h = Math.floor(clamped)
  let m = Math.round((clamped - h) * 60)
  if (m === 60) {
    h++
    m = 0
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Stunden zwischen zwei "HH:MM"-Zeiten, mit Wrap über Mitternacht. */
export function hoursBetween(von?: string, bis?: string): number {
  if (!von || !bis) return 0
  const [ah, am] = von.split(':').map(Number)
  const [bh, bm] = bis.split(':').map(Number)
  let diff = bh * 60 + bm - (ah * 60 + am)
  if (diff < 0) diff += 24 * 60
  return Math.round((diff / 60) * 100) / 100
}

/** Index des 2h-Blocks (06-08, 08-10, ...) für eine "HH:MM"-Startzeit, -1 wenn außerhalb. */
export function blockOf(from?: string): number {
  if (!from) return -1
  const h = parseInt(from.slice(0, 2), 10)
  if (h < 6 || h >= 20) return -1
  return Math.min(6, Math.floor((h - 6) / 2))
}
