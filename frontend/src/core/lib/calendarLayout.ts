export interface TimelineEntry<T> {
  item: T
  /** Startzeit in Stunden (z. B. 8.5 = 08:30). */
  start: number
  /** Endzeit in Stunden. */
  end: number
  /** Spalten-Index innerhalb einer sich überschneidenden Gruppe. */
  lane: number
  /** Gesamtzahl der Spalten der Gruppe, der dieser Eintrag angehört. */
  lanes: number
}

function toHour(value?: string): number | null {
  if (!value) return null
  const [h, m] = value.split(':')
  return Number(h) + (Number(m) || 0) / 60
}

/**
 * Ordnet zeitlich überlappende Termine nebeneinanderliegenden Spalten ("Lanes") zu, damit sie
 * sich in der Tagesansicht nicht überdecken. Termine ohne (gültige) Startzeit werden ausgelassen.
 */
export function layoutTimeline<T>(
  items: T[],
  getTimes: (item: T) => { from?: string; to?: string },
): Array<TimelineEntry<T>> {
  const timed = items
    .map((item) => {
      const { from, to } = getTimes(item)
      return { item, from, to }
    })
    .filter((it) => toHour(it.from) != null)
    .map((it) => {
      const start = toHour(it.from)!
      const rawEnd = toHour(it.to)
      const end = rawEnd == null || rawEnd <= start ? start + 1 : rawEnd
      return { item: it.item, start, end, lane: 0, lanes: 1 }
    })
    .sort((a, b) => a.start - b.start || a.end - b.end)

  const laneEnds: number[] = []
  for (const entry of timed) {
    let lane = laneEnds.findIndex((end) => end <= entry.start + 1e-9)
    if (lane < 0) {
      lane = laneEnds.length
      laneEnds.push(entry.end)
    } else {
      laneEnds[lane] = entry.end
    }
    entry.lane = lane
  }

  let cluster: { entries: Array<TimelineEntry<T>>; maxEnd: number } | null = null
  const clusters: Array<{ entries: Array<TimelineEntry<T>>; maxEnd: number }> = []
  for (const entry of timed) {
    if (!cluster || entry.start >= cluster.maxEnd - 1e-9) {
      cluster = { entries: [], maxEnd: entry.end }
      clusters.push(cluster)
    }
    cluster.entries.push(entry)
    cluster.maxEnd = Math.max(cluster.maxEnd, entry.end)
  }
  for (const c of clusters) {
    const lanes = Math.max(...c.entries.map((e) => e.lane)) + 1
    for (const entry of c.entries) entry.lanes = lanes
  }

  return timed
}
