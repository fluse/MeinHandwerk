export function surname(name?: string): string {
  return name ? name.trim() : ''
}

/** Baut "Straße, PLZ Ort" aus den getrennten Adressfeldern (Order/Customer/Site). */
export function formatAddress(street?: string, zip?: string, city?: string): string {
  return [street, [zip, city].filter(Boolean).join(' ')].filter(Boolean).join(', ')
}

interface OrderMessageInput {
  title: string
  date: string
  from?: string
  to?: string
  client?: string
  street?: string
  zip?: string
  city?: string
  phone?: string
  desc?: string
}

/** Baut den Benachrichtigungstext für WhatsApp/SMS/E-Mail-Links zu einem Auftrag. */
export function orderMsg(o: OrderMessageInput): string {
  const lines: string[] = []
  lines.push(`Neuer Auftrag: ${o.title}`)
  const day = new Date(`${o.date}T00:00:00`).toLocaleDateString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  lines.push(o.from ? `${day}, ${o.from}${o.to ? `–${o.to}` : ''} Uhr` : day)
  if (o.client) lines.push(`Kunde: ${o.client}`)
  const address = formatAddress(o.street, o.zip, o.city)
  if (address) lines.push(`Adresse: ${address}`)
  if (o.phone) lines.push(`Tel: ${o.phone}`)
  if (o.desc) lines.push(`Aufgabe: ${o.desc}`)
  lines.push('— Hahn Energie & Bau')
  return lines.join('\n')
}

/** Normalisiert eine Telefonnummer auf das E.164-Zahlenformat für wa.me-Links (DE-Default). */
export function waNum(phone?: string): string {
  let n = (phone || '').replace(/[^0-9]/g, '')
  if (n.startsWith('00')) n = n.slice(2)
  else if (n.startsWith('0')) n = `49${n.slice(1)}`
  return n
}
