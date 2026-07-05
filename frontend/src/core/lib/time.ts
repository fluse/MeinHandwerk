export const BLOCKS: Array<[string, string]> = [
  ['06', '08'],
  ['08', '10'],
  ['10', '12'],
  ['12', '14'],
  ['14', '16'],
  ['16', '18'],
  ['18', '20'],
]

export const WD = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

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
