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
  // Es gibt bewusst keinen In-App-Signup (users.createRule verlangt bereits chef/büro) –
  // auf einer frischen Datenbank existiert daher noch kein "chef". Das Skript legt genau wie
  // Büro/Helfer per Superuser-Token auch Chef und Monteure an, damit es allein lauffähig ist.
  const existingUsers = await pb('/api/collections/users/records?perPage=200')
  const byEmail = Object.fromEntries(existingUsers.items.map((u) => [u.email, u]))

  const chef =
    existingUsers.items.find((u) => u.role === 'chef') ??
    (await ensureOne('users', 'email = "hans.hahn@test.local"', {
      name: 'Hans Hahn',
      email: 'hans.hahn@test.local',
      password: TEST_PASSWORD,
      passwordConfirm: TEST_PASSWORD,
      role: 'chef',
      phone: '0171 1112223',
      emailVisibility: true,
    }))

  let monteure = existingUsers.items.filter((u) => u.role === 'monteur')
  if (monteure.length === 0) {
    const monteur1 = await ensureOne('users', 'email = "stefan.wolf@test.local"', {
      name: 'Stefan Wolf',
      email: 'stefan.wolf@test.local',
      password: TEST_PASSWORD,
      passwordConfirm: TEST_PASSWORD,
      role: 'monteur',
      phone: '0171 3334445',
      emailVisibility: true,
    })
    const monteur2 = await ensureOne('users', 'email = "thomas.becker@test.local"', {
      name: 'Thomas Becker',
      email: 'thomas.becker@test.local',
      password: TEST_PASSWORD,
      passwordConfirm: TEST_PASSWORD,
      role: 'monteur',
      phone: '0171 5556667',
      emailVisibility: true,
    })
    monteure = [monteur1, monteur2]
  }

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
    {
      name: 'Bäckerei Klein',
      contact: 'Michael Klein',
      street: 'Bahnhofstraße 22',
      zip: '50667',
      city: 'Köln',
      phone: '0221 7788990',
      email: 'info@baeckerei-klein.test',
    },
    {
      name: 'Zahnarztpraxis Dr. König',
      contact: 'Dr. Julia König',
      street: 'Lindenallee 9',
      zip: '40210',
      city: 'Düsseldorf',
      phone: '0211 5544332',
      email: 'praxis@dr-koenig.test',
    },
    {
      name: 'Hotel Rheinblick',
      contact: 'Sandra Vogel',
      street: 'Rheinuferweg 8',
      zip: '76133',
      city: 'Karlsruhe',
      phone: '0721 3344556',
      email: 'technik@hotel-rheinblick.test',
    },
  ]) {
    const key = c.name || c.contact
    const filterName = (c.name || c.contact).replace(/"/g, '\\"')
    customers[key] = await ensureOne('customers', `name = "${filterName}" || contact = "${filterName}"`, c)
  }

  // 4) Fahrzeuge – bestehende bleiben unangetastet, weitere ergänzen.
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
  await ensureOne('vehicles', 'name = "VW Caddy"', {
    name: 'VW Caddy',
    plate: 'XX-AB 789',
    assignedTo: helfer?.id ?? '',
    notes: 'Kleintransporter für kurze Wege, Testdaten.',
  })
  await ensureOne('vehicles', 'name = "Iveco Daily"', {
    name: 'Iveco Daily',
    plate: 'XX-CD 321',
    assignedTo: '',
    notes: 'Aktuell keinem Mitarbeiter zugeordnet – Testfall für freies Fahrzeug.',
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
  // Aufträge selbst tragen kein date/from/to/assigned mehr (siehe order_blocks-Migration) – ORD()
  // beschreibt weiterhin genau ein Zeitfenster pro Auftrag, ensureOrder() legt Auftrag + genau
  // einen order_blocks-Eintrag dafür an.
  const ORD = (o) => ({ status: 'offen', assigned: [], from: '', to: '', ...o })

  async function ensureOrder(filter, o) {
    const { date, from, to, assigned, ...orderFields } = o
    const order = await ensureOne('orders', filter, orderFields)
    await ensureOne('order_blocks', `order = "${order.id}" && date = "${date}"`, {
      order: order.id,
      date,
      from: from || '',
      to: to || '',
      assigned,
    })
    // Bequemlichkeit für ensureRapport() unten, das order.date für rapports.date braucht –
    // orders selbst hat das Feld nicht mehr, wird hier nicht persistiert.
    order.date = date
    return order
  }

  await ensureOrder('title = "Heizungswartung Müller Bau"', ORD({
    title: 'Heizungswartung Müller Bau',
    trade: 'heizung',
    date: iso(today),
    from: '08:00',
    to: '11:00',
    client: 'Müller Bau GmbH',
    phone: '0211 1234567',
    street: 'Hauptstraße 12',
    zip: '40210',
    city: 'Düsseldorf',
    desc: 'Jährliche Wartung der Heizungsanlage.',
    assigned: [m1?.id].filter(Boolean),
  }))
  await ensureOrder('title = "Wasserhahn tauschen Weber"', ORD({
    title: 'Wasserhahn tauschen Weber',
    trade: 'sanitaer',
    date: iso(today),
    from: '09:00',
    to: '10:30',
    client: 'Fam. Weber',
    phone: '0221 4455667',
    street: 'Feldweg 3',
    zip: '50667',
    city: 'Köln',
    assigned: [m2?.id].filter(Boolean),
  }))
  await ensureOrder('title = "Elektrocheck Gasthaus Sonne"', ORD({
    title: 'Elektrocheck Gasthaus Sonne',
    trade: 'elektro',
    date: iso(today),
    from: '10:00',
    to: '12:00',
    client: 'Gasthaus Sonne',
    phone: '0711 1122334',
    street: 'Marktplatz 1',
    zip: '70173',
    city: 'Stuttgart',
    desc: 'Überlappt bewusst mit der Heizungswartung, um die Spuren-Darstellung zu testen.',
    assigned: [m1?.id].filter(Boolean),
  }))
  await ensureOrder('title = "Klimaanlage prüfen Schmidt"', ORD({
    title: 'Klimaanlage prüfen Schmidt',
    trade: 'klima',
    date: iso(today),
    client: 'Schmidt Immobilien',
    phone: '0721 9876543',
    street: 'Kaiserallee 5',
    zip: '76133',
    city: 'Karlsruhe',
    note: 'Ohne feste Uhrzeit – Testfall für "ohne Zeit".',
    assigned: [helfer.id],
  }))
  await ensureOrder('title = "Trockenbauwand einziehen"', ORD({
    title: 'Trockenbauwand einziehen',
    trade: 'innenausbau',
    date: iso(today),
    from: '13:00',
    to: '15:00',
    client: 'Müller Bau GmbH',
    street: 'Hauptstraße 12',
    zip: '40210',
    city: 'Düsseldorf',
    assigned: [m2?.id].filter(Boolean),
  }))
  if (chef) {
    await ensureOrder('title = "Baustellenbesichtigung Weber"', ORD({
      title: 'Baustellenbesichtigung Weber',
      trade: 'besichtigung',
      date: iso(today),
      from: '09:00',
      to: '12:00',
      client: 'Fam. Weber',
      street: 'Feldweg 3',
      zip: '50667',
      city: 'Köln',
      note: 'Chef-Termin – Testfall für eingeschränkte Sicht (Monteur/Helfer).',
      assigned: [chef.id],
    }))
  }
  await ensureOrder('title = "Großauftrag Heizungstausch"', ORD({
    title: 'Großauftrag Heizungstausch',
    trade: 'heizung',
    date: iso(addDays(today, 1)),
    from: '08:00',
    to: '16:00',
    client: 'Müller Bau GmbH',
    street: 'Hauptstraße 12',
    zip: '40210',
    city: 'Düsseldorf',
    assigned: [m1?.id, m2?.id].filter(Boolean),
  }))
  await ensureOrder('title = "Wartung Klimaanlage Sonne"', ORD({
    title: 'Wartung Klimaanlage Sonne',
    trade: 'klima',
    date: iso(addDays(today, 1)),
    from: '09:00',
    to: '10:00',
    client: 'Gasthaus Sonne',
    street: 'Marktplatz 1',
    zip: '70173',
    city: 'Stuttgart',
    assigned: [helfer.id],
  }))
  await ensureOrder('title = "Elektroinstallation prüfen"', ORD({
    title: 'Elektroinstallation prüfen',
    trade: 'elektro',
    date: iso(addDays(today, 2)),
    client: 'Schmidt Immobilien',
    street: 'Kaiserallee 5',
    zip: '76133',
    city: 'Karlsruhe',
    note: 'Ohne feste Uhrzeit.',
    assigned: [m1?.id].filter(Boolean),
  }))
  const heizungFruehjahrscheck = await ensureOrder('title = "Heizung Frühjahrscheck"', ORD({
    title: 'Heizung Frühjahrscheck',
    trade: 'heizung',
    date: iso(addDays(today, -1)),
    from: '08:00',
    to: '12:00',
    client: 'Müller Bau GmbH',
    street: 'Hauptstraße 12',
    zip: '40210',
    city: 'Düsseldorf',
    assigned: [m1?.id].filter(Boolean),
    status: 'erledigt',
    closedBy: m1?.id ?? '',
    closedAt: new Date().toISOString(),
    rapportSigned: true,
  }))
  const rohrbruchNotdienst = await ensureOrder('title = "Rohrbruch Notdienst"', ORD({
    title: 'Rohrbruch Notdienst',
    trade: 'sanitaer',
    date: iso(addDays(today, -1)),
    from: '13:00',
    to: '17:00',
    client: 'Fam. Weber',
    street: 'Feldweg 3',
    zip: '50667',
    city: 'Köln',
    assigned: [m2?.id].filter(Boolean),
    status: 'erledigt',
    closedBy: m2?.id ?? '',
    closedAt: new Date().toISOString(),
    rapportSigned: false,
    rapportReason: 'Kunde bei Abholung nicht anwesend.',
  }))
  const klimaanlageEndreinigung = await ensureOrder('title = "Klimaanlage Endreinigung"', ORD({
    title: 'Klimaanlage Endreinigung',
    trade: 'klima',
    date: iso(addDays(today, -2)),
    from: '08:00',
    to: '10:00',
    client: 'Gasthaus Sonne',
    street: 'Marktplatz 1',
    zip: '70173',
    city: 'Stuttgart',
    assigned: [helfer.id],
    status: 'erledigt',
    closedBy: helfer.id,
    closedAt: new Date().toISOString(),
    rapportSigned: true,
  }))

  // Weitere Aufträge: mehr Kunden/Gewerke abgedeckt (u. a. "urlaub"/"krank" als Ganztagestermine),
  // mehr abgeschlossene Aufträge mit Rapport für die Rapport-Übersicht.
  await ensureOrder('title = "Backofen-Wartung Bäckerei Klein"', ORD({
    title: 'Backofen-Wartung Bäckerei Klein',
    trade: 'elektro',
    date: iso(addDays(today, 3)),
    from: '06:00',
    to: '08:00',
    client: 'Bäckerei Klein',
    phone: '0221 7788990',
    street: 'Bahnhofstraße 22',
    zip: '50667',
    city: 'Köln',
    desc: 'Jährliche E-Check-Wartung der Backöfen.',
    assigned: [m2?.id].filter(Boolean),
  }))
  await ensureOrder('title = "Druckluftinstallation Zahnarztpraxis König"', ORD({
    title: 'Druckluftinstallation Zahnarztpraxis König',
    trade: 'innenausbau',
    date: iso(addDays(today, 4)),
    from: '14:00',
    to: '17:00',
    client: 'Zahnarztpraxis Dr. König',
    phone: '0211 5544332',
    street: 'Lindenallee 9',
    zip: '40210',
    city: 'Düsseldorf',
    assigned: [m1?.id, helfer?.id].filter(Boolean),
  }))
  await ensureOrder('title = "Klimaanlage Hotel Rheinblick"', ORD({
    title: 'Klimaanlage Hotel Rheinblick',
    trade: 'klima',
    date: iso(addDays(today, 6)),
    client: 'Hotel Rheinblick',
    phone: '0721 3344556',
    street: 'Rheinuferweg 8',
    zip: '76133',
    city: 'Karlsruhe',
    note: 'Ohne feste Uhrzeit – nach Absprache mit der Rezeption.',
    assigned: [m2?.id].filter(Boolean),
  }))
  if (m1) {
    await ensureOrder(`title = "Urlaub ${m1.name}"`, ORD({
      title: `Urlaub ${m1.name}`,
      trade: 'urlaub',
      date: iso(addDays(today, 7)),
      assigned: [m1.id],
      note: 'Ganztägig, keine Einsatzadresse.',
    }))
  }
  if (m2) {
    await ensureOrder(`title = "Krank ${m2.name}"`, ORD({
      title: `Krank ${m2.name}`,
      trade: 'krank',
      date: iso(today),
      assigned: [m2.id],
    }))
  }
  await ensureOrder('title = "Wartung Sanitäranlagen Hotel Rheinblick"', ORD({
    title: 'Wartung Sanitäranlagen Hotel Rheinblick',
    trade: 'sanitaer',
    date: iso(addDays(today, -3)),
    from: '07:00',
    to: '11:00',
    client: 'Hotel Rheinblick',
    street: 'Rheinuferweg 8',
    zip: '76133',
    city: 'Karlsruhe',
    assigned: [m2?.id].filter(Boolean),
    status: 'erledigt',
    closedBy: m2?.id ?? '',
    closedAt: new Date().toISOString(),
    rapportSigned: true,
  }))
  const backofenReparaturKlein = await ensureOrder('title = "Backofen-Reparatur Bäckerei Klein"', ORD({
    title: 'Backofen-Reparatur Bäckerei Klein',
    trade: 'elektro',
    date: iso(addDays(today, -4)),
    from: '05:00',
    to: '07:30',
    client: 'Bäckerei Klein',
    street: 'Bahnhofstraße 22',
    zip: '50667',
    city: 'Köln',
    desc: 'Defekte Heizspirale im Hauptofen ausgetauscht.',
    assigned: [m1?.id].filter(Boolean),
    status: 'erledigt',
    closedBy: m1?.id ?? '',
    closedAt: new Date().toISOString(),
    rapportSigned: true,
  }))

  // 6b) Rapporte – für abgeschlossene Aufträge mit rapportSigned=true, inkl. Materialliste.
  async function ensureRapport(order, author, data) {
    if (!order || !author) return null
    const rapport = await ensureOne('rapports', `order = "${order.id}"`, {
      order: order.id,
      author,
      date: order.date,
      ...data,
    })
    return rapport
  }

  const rapportFruehjahrscheck = await ensureRapport(heizungFruehjahrscheck, m1?.id, {
    text: 'Heizungsanlage gewartet, Brenner gereinigt, Ablufttest bestanden. Keine Auffälligkeiten.',
    signedName: 'Frank Müller',
  })
  if (rapportFruehjahrscheck) {
    await ensureOne('rapport_materials', `rapport = "${rapportFruehjahrscheck.id}" && desc = "Filter"`, {
      rapport: rapportFruehjahrscheck.id,
      qty: 2,
      unit: 'Stk',
      desc: 'Filter',
    })
    await ensureOne('rapport_materials', `rapport = "${rapportFruehjahrscheck.id}" && desc = "Dichtungssatz"`, {
      rapport: rapportFruehjahrscheck.id,
      qty: 1,
      unit: 'Stk',
      desc: 'Dichtungssatz',
    })
  }

  const rapportKlimaEndreinigung = await ensureRapport(klimaanlageEndreinigung, helfer?.id, {
    text: 'Klimaanlage komplett gereinigt und Filter getauscht, Kunde vor Ort eingewiesen.',
    signedName: 'Peter Groß',
  })
  if (rapportKlimaEndreinigung) {
    await ensureOne('rapport_materials', `rapport = "${rapportKlimaEndreinigung.id}" && desc = "Klimafilter"`, {
      rapport: rapportKlimaEndreinigung.id,
      qty: 4,
      unit: 'Stk',
      desc: 'Klimafilter',
    })
  }

  const rapportBackofen = await ensureRapport(backofenReparaturKlein, m1?.id, {
    text: 'Heizspirale im Hauptofen ausgetauscht und Funktion geprüft. Ofen läuft wieder einwandfrei.',
    signedName: 'Michael Klein',
  })
  if (rapportBackofen) {
    await ensureOne('rapport_materials', `rapport = "${rapportBackofen.id}" && desc = "Heizspirale 3kW"`, {
      rapport: rapportBackofen.id,
      qty: 1,
      unit: 'Stk',
      desc: 'Heizspirale 3kW',
    })
  }

  // Rohrbruch Notdienst (rohrbruchNotdienst) hat bewusst KEIN Rapport (rapportSigned: false,
  // rapportReason gesetzt) – Testfall für "Rapport fehlt trotz erledigtem Auftrag".

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
  console.log(`  Chef:    ${chef.email}`)
  console.log('  Büro:    sabine.lehmann@test.local')
  console.log(`  Monteur: ${monteure[0]?.email}`)
  if (monteure[1] && monteure[1].id !== monteure[0]?.id) {
    console.log(`  Monteur: ${monteure[1].email}`)
  }
  console.log('  Helfer:  kevin.fischer@test.local')
  console.log(`\nPocketBase-Adminoberfläche: ${PB_URL}/_/  (Superuser: ${ADMIN_EMAIL})`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
