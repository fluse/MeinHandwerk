const BOM = '\uFEFF'

/** Minimaler CSV-Parser mit Anführungszeichen-Escaping und Delimiter-Erkennung (";" oder ","). */
export function parseCSV(text: string): string[][] {
  const content = text.startsWith(BOM) ? text.slice(1) : text
  const firstLineEnd = content.indexOf('\n')
  const firstLine = firstLineEnd < 0 ? content : content.slice(0, firstLineEnd)
  const delimiter = firstLine.split(';').length > firstLine.split(',').length ? ';' : ','

  const rows: string[][] = []
  let row: string[] = []
  let cur = ''
  let inQuotes = false

  for (let i = 0; i < content.length; i++) {
    const ch = content[i]
    if (inQuotes) {
      if (ch === '"') {
        if (content[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cur += ch
      }
      continue
    }

    if (ch === '"') inQuotes = true
    else if (ch === delimiter) {
      row.push(cur)
      cur = ''
    } else if (ch === '\n') {
      row.push(cur)
      rows.push(row)
      row = []
      cur = ''
    } else if (ch === '\r') {
      // ignorieren
    } else {
      cur += ch
    }
  }
  if (cur !== '' || row.length) {
    row.push(cur)
    rows.push(row)
  }
  return rows
}

/** Löst einen CSV-Download im Browser aus (Excel-kompatibel: Semikolon, BOM, CRLF). */
export function downloadCSV(
  filename: string,
  rows: Array<Array<string | number | null | undefined>>,
): void {
  const csv = rows
    .map((row) =>
      (row || [])
        .map((cell) => {
          const s = String(cell == null ? '' : cell)
          return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
        })
        .join(';'),
    )
    .join('\r\n')

  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}
