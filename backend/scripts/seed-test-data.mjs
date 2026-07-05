// Füllt die lokale PocketBase-Instanz mit Testdaten für alle Bereiche der App
// (Team, Kunden, Projekte, Aufträge, Fahrzeuge, Events, Pinnwand).
//
// Nutzung:
//   node backend/scripts/seed-test-data.mjs
//
// Erwartet eine laufende PocketBase-Instanz unter PB_URL (Default: http://127.0.0.1:8090).
// Legt bei Bedarf einen Superuser an (PB_ADMIN_EMAIL/PB_ADMIN_PASSWORD), der alle
// Collection-Regeln umgeht – so lassen sich Aufträge/Kunden/etc. unabhängig davon anlegen,
// welche Rollen die echten Nutzer haben. Bereits vorhandene echte Daten werden nicht verändert;
// das Skript ist idempotent (per Filter geprüft) und kann gefahrlos mehrfach laufen.

const PB_URL = process.env.PB_URL ?? 'http://127.0.0.1:8090'
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL ?? 'seed-admin@local.test'
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD ?? 'SeedAdmin123!'
const TEST_PASSWORD = 'Test1234!'

let token = ''

async function pb(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${PB_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(data)}`)
  }
  return data
}

async function ensureOne(collection, filter, data) {
  const found = await pb(
    `/api/collections/${collection}/records?perPage=1&filter=${encodeURIComponent(filter)}`,
  )
  if (found.items?.length) return found.items[0]
  const created = await pb(`/api/collections/${collection}/records`, { method: 'POST', body: data })
  console.log(`+ ${collection}: ${data.title ?? data.name ?? data.text ?? created.id}`)
  return created
}

function pad(n) {
  return String(n).padStart(2, '0')
}
function iso(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function addDays(base, n) {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d
}

async function main() {
  // 1) Superuser sicherstellen (idempotent) und einloggen.
  const authRes = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  if (!authRes.ok) {
    throw new Error(
      `Superuser-Login fehlgeschlagen. Bitte vorher anlegen:\n` +
        `  docker exec <pocketbase-container> /pb/pocketbase superuser upsert ${ADMIN_EMAIL} ${ADMIN_PASSWORD}`,
    )
  }
  token = (await authRes.json()).token
  console.log('Angemeldet als Superuser.')

  const today = new Date()

  // 2) Team – bestehende Nutzer wiederverwenden, fehlende Rollen ergänzen.
  const existingUsers = await pb('/api/collections/users/records?perPage=200')
  const byEmail = Object.fromEntries(existingUsers.items.map((u) => [u.email, u]))
  const chef = existingUsers.items.find((u) => u.role === 'chef')
  const monteure = existingUsers.items.filter((u) => u.role === 'monteur')

  const buero =
    byEmail['sabine.lehmann@test.local'] ??
    (await ensureOne('users', 'email = "sabine.lehmann@test.local"', {
      name: 'Sabine Lehmann',
      email: 'sabine.lehmann@test.local',
      password: TEST_PASSWORD,
      passwordConfirm: TEST_PASSWORD,
      role: 'buero',
      phone: '0171 1234567',
      emailVisibility: true,
    }))
  const helfer =
    byEmail['kevin.fischer@test.local'] ??
    (await ensureOne('users', 'email = "kevin.fischer@test.local"', {
      name: 'Kevin Fischer',
      email: 'kevin.fischer@test.local',
      password: TEST_PASSWORD,
      passwordConfirm: TEST_PASSWORD,
      role: 'helfer',
      phone: '0171 7654321',
      emailVisibility: true,
    }))

  const m1 = monteure[0]
  const m2 = monteure[1] ?? m1

  // 3) Kunden
  const customers = {}
  for (const c of [
    {
      name: 'Müller Bau GmbH',
      contact: 'Frank Müller',
      street: 'Hauptstraße 12',
      zip: '40210',
      city: 'Düsseldorf',
      phone: '0211 1234567',
      email: 'kontakt@mueller-bau.test',
    },
    {
      name: 'Schmidt Immobilien',
      contact: 'Anna Schmidt',
      street: 'Kaiserallee 5',
      zip: '76133',
      city: 'Karlsruhe',
      phone: '0721 9876543',
      email: 'info@schmidt-immo.test',
    },
    {
      name: '',
      contact: 'Fam. Weber',
      street: 'Feldweg 3',
      zip: '50667',
      city: 'Köln',
      phone: '0221 4455667',
      email: '',
    },
    {
      name: 'Gasthaus Sonne',
      contact: 'Peter Groß',
      street: 'Marktplatz 1',
      zip: '70173',
      city: 'Stuttgart',
      phone: '0711 1122334',
      email: 'info@gasthaus-sonne.test',
    },
  ]) {
    const key = c.name || c.contact
    const filterName = (c.name || c.contact).replace(/"/g, '\\"')
    customers[key] = await ensureOne('customers', `name = "${filterName}" || contact = "${filterName}"`, c)
  }

  // 4) Fahrzeuge – bestehende bleiben unangetastet, zwei weitere ergänzen.
  await ensureOne('vehicles', 'name = "Mercedes Sprinter"', {
    name: 'Mercedes Sprinter',
    plate: 'XX-YY 123',
    assignedTo: m1?.id ?? '',
    notes: 'Testdaten',
  })
  await ensureOne('vehicles', 'name = "Ford Transit"', {
    name: 'Ford Transit',
    plate: 'XX-ZZ 456',
    assignedTo: m2?.id ?? '',
    notes: 'Testdaten',
  })

  // 5) Projekte
  await ensureOne('projects', 'title = "Sanierung Mehrfamilienhaus"', {
    projnr: 'P-1001',
    title: 'Sanierung Mehrfamilienhaus',
    client: 'Müller Bau GmbH',
    street: 'Hauptstraße 12',
    zip: '40210',
    city: 'Düsseldorf',
    phone: '0211 1234567',
    value: 45000,
    date: iso(addDays(today, 30)),
    desc: 'Komplettsanierung Heizung & Sanitär, 12 Wohneinheiten.',
    status: 'eingeplant',
  })
  await ensureOne('projects', 'title = "Neubau Einfamilienhaus Weber"', {
    projnr: 'P-1002',
    title: 'Neubau Einfamilienhaus Weber',
    client: 'Fam. Weber',
    street: 'Feldweg 3',
    zip: '50667',
    city: 'Köln',
    phone: '0221 4455667',
    value: 120000,
    date: iso(addDays(today, 60)),
    desc: 'Komplette Haustechnik im Neubau.',
    status: 'offen',
  })
  await ensureOne('projects', 'title = "Badsanierung Gasthaus Sonne"', {
    projnr: 'P-1003',
    title: 'Badsanierung Gasthaus Sonne',
    client: 'Gasthaus Sonne',
    street: 'Marktplatz 1',
    zip: '70173',
    city: 'Stuttgart',
    phone: '0711 1122334',
    value: 8000,
    date: iso(addDays(today, -20)),
    desc: 'Gäste-WCs und Küche saniert.',
    status: 'erledigt',
  })

  // 6) Aufträge – Vergangenheit (erledigt), heute (verschiedene Uhrzeiten/Gewerke,
  // inkl. Überlappung für die Zeitstrahl-Spuren) und Zukunft (inkl. ohne feste Zeit).
  const ORD = (o) => ({ status: 'offen', assigned: [], from: '', to: '', ...o })

  await ensureOne('orders', 'title = "Heizungswartung Müller Bau"', ORD({
    title: 'Heizungswartung Müller Bau',
    trade: 'heizung',
    date: iso(today),
    from: '08:00',
    to: '11:00',
    client: 'Müller Bau GmbH',
    phone: '0211 1234567',
    address: 'Hauptstraße 12, 40210 Düsseldorf',
    desc: 'Jährliche Wartung der Heizungsanlage.',
    assigned: [m1?.id].filter(Boolean),
  }))
  await ensureOne('orders', 'title = "Wasserhahn tauschen Weber"', ORD({
    title: 'Wasserhahn tauschen Weber',
    trade: 'sanitaer',
    date: iso(today),
    from: '09:00',
    to: '10:30',
    client: 'Fam. Weber',
    phone: '0221 4455667',
    address: 'Feldweg 3, 50667 Köln',
    assigned: [m2?.id].filter(Boolean),
  }))
  await ensureOne('orders', 'title = "Elektrocheck Gasthaus Sonne"', ORD({
    title: 'Elektrocheck Gasthaus Sonne',
    trade: 'elektro',
    date: iso(today),
    from: '10:00',
    to: '12:00',
    client: 'Gasthaus Sonne',
    phone: '0711 1122334',
    address: 'Marktplatz 1, 70173 Stuttgart',
    desc: 'Überlappt bewusst mit der Heizungswartung, um die Spuren-Darstellung zu testen.',
    assigned: [m1?.id].filter(Boolean),
  }))
  await ensureOne('orders', 'title = "Klimaanlage prüfen Schmidt"', ORD({
    title: 'Klimaanlage prüfen Schmidt',
    trade: 'klima',
    date: iso(today),
    client: 'Schmidt Immobilien',
    phone: '0721 9876543',
    address: 'Kaiserallee 5, 76133 Karlsruhe',
    note: 'Ohne feste Uhrzeit – Testfall für "ohne Zeit".',
    assigned: [helfer.id],
  }))
  await ensureOne('orders', 'title = "Trockenbauwand einziehen"', ORD({
    title: 'Trockenbauwand einziehen',
    trade: 'innenausbau',
    date: iso(today),
    from: '13:00',
    to: '15:00',
    client: 'Müller Bau GmbH',
    address: 'Hauptstraße 12, 40210 Düsseldorf',
    assigned: [m2?.id].filter(Boolean),
  }))
  if (chef) {
    await ensureOne('orders', 'title = "Baustellenbesichtigung Weber"', ORD({
      title: 'Baustellenbesichtigung Weber',
      trade: 'besichtigung',
      date: iso(today),
      from: '09:00',
      to: '12:00',
      client: 'Fam. Weber',
      address: 'Feldweg 3, 50667 Köln',
      note: 'Chef-Termin – Testfall für eingeschränkte Sicht (Monteur/Helfer).',
      assigned: [chef.id],
    }))
  }
  await ensureOne('orders', 'title = "Großauftrag Heizungstausch"', ORD({
    title: 'Großauftrag Heizungstausch',
    trade: 'heizung',
    date: iso(addDays(today, 1)),
    from: '08:00',
    to: '16:00',
    client: 'Müller Bau GmbH',
    address: 'Hauptstraße 12, 40210 Düsseldorf',
    assigned: [m1?.id, m2?.id].filter(Boolean),
  }))
  await ensureOne('orders', 'title = "Wartung Klimaanlage Sonne"', ORD({
    title: 'Wartung Klimaanlage Sonne',
    trade: 'klima',
    date: iso(addDays(today, 1)),
    from: '09:00',
    to: '10:00',
    client: 'Gasthaus Sonne',
    address: 'Marktplatz 1, 70173 Stuttgart',
    assigned: [helfer.id],
  }))
  await ensureOne('orders', 'title = "Elektroinstallation prüfen"', ORD({
    title: 'Elektroinstallation prüfen',
    trade: 'elektro',
    date: iso(addDays(today, 2)),
    client: 'Schmidt Immobilien',
    address: 'Kaiserallee 5, 76133 Karlsruhe',
    note: 'Ohne feste Uhrzeit.',
    assigned: [m1?.id].filter(Boolean),
  }))
  await ensureOne('orders', 'title = "Heizung Frühjahrscheck"', ORD({
    title: 'Heizung Frühjahrscheck',
    trade: 'heizung',
    date: iso(addDays(today, -1)),
    from: '08:00',
    to: '12:00',
    client: 'Müller Bau GmbH',
    address: 'Hauptstraße 12, 40210 Düsseldorf',
    assigned: [m1?.id].filter(Boolean),
    status: 'erledigt',
    closedBy: m1?.id ?? '',
    closedAt: new Date().toISOString(),
    rapportSigned: true,
  }))
  await ensureOne('orders', 'title = "Rohrbruch Notdienst"', ORD({
    title: 'Rohrbruch Notdienst',
    trade: 'sanitaer',
    date: iso(addDays(today, -1)),
    from: '13:00',
    to: '17:00',
    client: 'Fam. Weber',
    address: 'Feldweg 3, 50667 Köln',
    assigned: [m2?.id].filter(Boolean),
    status: 'erledigt',
    closedBy: m2?.id ?? '',
    closedAt: new Date().toISOString(),
    rapportSigned: false,
    rapportReason: 'Kunde bei Abholung nicht anwesend.',
  }))
  await ensureOne('orders', 'title = "Klimaanlage Endreinigung"', ORD({
    title: 'Klimaanlage Endreinigung',
    trade: 'klima',
    date: iso(addDays(today, -2)),
    from: '08:00',
    to: '10:00',
    client: 'Gasthaus Sonne',
    address: 'Marktplatz 1, 70173 Stuttgart',
    assigned: [helfer.id],
    status: 'erledigt',
    closedBy: helfer.id,
    closedAt: new Date().toISOString(),
    rapportSigned: true,
  }))

  // 7) Events
  if (chef) {
    await ensureOne('events', 'title = "Teambesprechung"', {
      title: 'Teambesprechung',
      type: 'info',
      date: iso(today),
      time: '16:00',
      location: 'Büro',
      desc: 'Wochenrückblick und Planung der kommenden Woche.',
      by: chef.id,
      rsvp: [m1?.id, m2?.id].filter(Boolean),
    })
    await ensureOne('events', 'title = "Sommerfest"', {
      title: 'Sommerfest',
      type: 'fest',
      date: iso(addDays(today, 10)),
      time: '15:00',
      location: 'Firmenhof',
      desc: 'Grillen mit der ganzen Familie.',
      by: chef.id,
      rsvp: [m1?.id].filter(Boolean),
    })
    await ensureOne('events', 'title = "Schulung Arbeitssicherheit"', {
      title: 'Schulung Arbeitssicherheit',
      type: 'schulung',
      date: iso(addDays(today, 5)),
      time: '09:00',
      location: 'Schulungsraum',
      by: chef.id,
      rsvp: [],
    })
    await ensureOne('events', 'title = "Grillfeier Team"', {
      title: 'Grillfeier Team',
      type: 'feier',
      date: iso(addDays(today, -5)),
      time: '18:00',
      location: 'Firmenhof',
      by: chef.id,
      rsvp: [m1?.id, m2?.id, helfer.id].filter(Boolean),
    })
  }

  // 8) Pinnwand
  const author1 = m1?.id ?? chef?.id
  const author2 = m2?.id ?? chef?.id
  await ensureOne('feed_posts', 'text ~ "Akkuschrauber aus dem Sprinter"', {
    author: author1,
    text: 'Wer hat den Akkuschrauber aus dem Sprinter? Brauche ihn morgen früh.',
    category: 'werkzeug',
    pinned: false,
    resolved: false,
  })
  await ensureOne('feed_posts', 'text ~ "Transporter nach Gebrauch"', {
    author: chef?.id ?? author1,
    text: 'Bitte den Transporter nach Gebrauch immer wieder auftanken!',
    category: 'fahrzeug',
    pinned: true,
    resolved: false,
  })
  await ensureOne('feed_posts', 'text ~ "Arbeitsschutzverordnung"', {
    author: chef?.id ?? author1,
    text: 'Neue Arbeitsschutzverordnung ab nächstem Monat – bitte Merkblatt im Büro beachten.',
    category: 'info',
    pinned: true,
    resolved: false,
  })
  await ensureOne('feed_posts', 'text ~ "sehr zufrieden"', {
    author: author2,
    text: 'Super Arbeit beim Projekt Müller Bau – der Kunde war sehr zufrieden!',
    category: 'lob',
    pinned: false,
    resolved: false,
  })
  await ensureOne('feed_posts', 'text ~ "Lager bitte wieder aufräumen"', {
    author: chef?.id ?? author1,
    text: 'Lager bitte wieder aufräumen nach Feierabend – danke!',
    category: 'sauberkeit',
    pinned: false,
    resolved: true,
  })
  await ensureOne('feed_posts', 'text ~ "neuen Wärmepumpe"', {
    author: author1,
    text: 'Hat jemand Erfahrung mit der neuen Wärmepumpe von Modell XYZ?',
    category: 'frage',
    pinned: false,
    resolved: false,
  })

  console.log('\nFertig. Test-Logins (Passwort für alle: ' + TEST_PASSWORD + '):')
  console.log('  Büro:   sabine.lehmann@test.local')
  console.log('  Helfer: kevin.fischer@test.local')
  console.log(`\nPocketBase-Adminoberfläche: ${PB_URL}/_/  (Superuser: ${ADMIN_EMAIL})`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
