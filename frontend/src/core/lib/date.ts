const pad = (n: number) => String(n).padStart(2, '0')

export function iso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function mondayOf(d: Date): Date {
  const x = new Date(d)
  const weekday = (x.getDay() + 6) % 7
  x.setDate(x.getDate() - weekday)
  x.setHours(0, 0, 0, 0)
  return x
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function todayISO(): string {
  return iso(new Date())
}

/** ISO-8601 Kalenderwoche (Woche mit dem ersten Donnerstag des Jahres ist KW 1). */
export function kw(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = (t.getUTCDay() + 6) % 7
  t.setUTCDate(t.getUTCDate() - day + 3)
  const firstThursday = new Date(Date.UTC(t.getUTCFullYear(), 0, 4))
  return (
    1 +
    Math.round(
      ((t.getTime() - firstThursday.getTime()) / 86_400_000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7,
    )
  )
}

export function fmtShort(d: Date): string {
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

export function fmtLong(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
