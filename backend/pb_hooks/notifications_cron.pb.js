/// <reference path="../pb_data/types.d.ts" />

// Tägliche Meldungen, die nicht durch ein Insert/Update ausgelöst werden, sondern durch einen
// Blick auf "heute"/"morgen": Event heute, Auftrag morgen noch unbesetzt, Zeiterfassung für
// heute fehlt (siehe feature-meldungen.md). Läuft werktags früh morgens bzw. abends; jeder Job
// bekommt seine eigene kleine `notify`/`isoDate`-Hilfsfunktion (siehe Begründung in
// notifications_orders.pb.js).

cronAdd('notifications-event-today', '0 5 * * *', () => {
  function isoDate(d) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  function notify(recipientId, type, message, link) {
    if (!recipientId) return
    const collection = $app.findCollectionByNameOrId('notifications')
    const record = new Record(collection)
    record.set('recipient', recipientId)
    record.set('type', type)
    record.set('message', message)
    record.set('link', link || '')
    record.set('read', false)
    $app.save(record)
  }

  const today = isoDate(new Date())
  const users = $app.findAllRecords('users')
  $app
    .findRecordsByFilter('events', 'date = {:today}', '', 0, 0, { today })
    .forEach((event) => {
      const title = event.get('title')
      users.forEach((u) => notify(u.id, 'event_today', `Heute findet das Event "${title}" statt.`, '/events'))
    })
})

cronAdd('notifications-order-unstaffed', '0 5 * * *', () => {
  function isoDate(d) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  function notify(recipientId, type, message, link) {
    if (!recipientId) return
    const collection = $app.findCollectionByNameOrId('notifications')
    const record = new Record(collection)
    record.set('recipient', recipientId)
    record.set('type', type)
    record.set('message', message)
    record.set('link', link || '')
    record.set('read', false)
    $app.save(record)
  }

  const tomorrow = isoDate(new Date(Date.now() + 24 * 60 * 60 * 1000))
  const admins = $app.findRecordsByFilter('users', "role = 'chef' || role = 'buero'", '', 0, 0)
  // `date`/`assigned` liegen jetzt auf order_blocks statt auf orders – Block abfragen und den
  // Auftrag darüber auflösen (statt eines Backreference-Filters über zwei Collections).
  $app
    .findRecordsByFilter('order_blocks', 'date = {:tomorrow} && assigned = ""', '', 0, 0, { tomorrow })
    .forEach((block) => {
      let order
      try {
        order = $app.findRecordById('orders', block.get('order'))
      } catch (err) {
        return
      }
      if (order.get('status') !== 'offen') return
      const title = order.get('title')
      admins.forEach((a) =>
        notify(a.id, 'order_unstaffed', `Auftrag "${title}" am ${tomorrow} ist noch niemandem zugewiesen.`, '/auftraege')
      )
    })
})

// Läuft abends statt am Folgetag, damit die Erinnerung noch am selben Tag etwas nützt (statt
// "gestern hättest du eintragen sollen"). Wochenenden werden übersprungen.
cronAdd('notifications-timelog-missing', '0 20 * * *', () => {
  function isoDate(d) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  function notify(recipientId, type, message, link) {
    if (!recipientId) return
    const collection = $app.findCollectionByNameOrId('notifications')
    const record = new Record(collection)
    record.set('recipient', recipientId)
    record.set('type', type)
    record.set('message', message)
    record.set('link', link || '')
    record.set('read', false)
    $app.save(record)
  }

  const now = new Date()
  const weekday = now.getDay() // 0 = Sonntag, 6 = Samstag
  if (weekday === 0 || weekday === 6) return

  const today = isoDate(now)
  $app
    .findRecordsByFilter('users', "role = 'monteur' || role = 'helfer'", '', 0, 0)
    .forEach((employee) => {
      const entries = $app.findRecordsByFilter(
        'timelog',
        'employee = {:employeeId} && date = {:today}',
        '',
        1,
        0,
        { employeeId: employee.id, today }
      )
      if (entries.length === 0) {
        notify(employee.id, 'timelog_missing', `Du hast für ${today} noch keine Zeiterfassung eingetragen.`, '/timetracking')
      }
    })
})
