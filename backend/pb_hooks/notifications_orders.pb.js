/// <reference path="../pb_data/types.d.ts" />

// Meldungen rund um Aufträge (siehe feature-meldungen.md): zugewiesen/entzogen, abgeschlossen,
// verschoben, Urlaub/Krank, Foto hochgeladen, Rapport mit/ohne Unterschrift, sowie die
// Mikro-Status-Taps aus `order_checkins` (unterwegs/angekommen).
//
// Jede Callback-Funktion bekommt ihre eigene kleine `notify`-Helper-Funktion statt eine
// gemeinsame Top-Level-Funktion zu nutzen: PocketBase führt onRecord*-Callbacks isoliert aus,
// Top-Level-Hilfsfunktionen derselben Datei sind darin nicht zuverlässig sichtbar (siehe
// geocode_customer.pb.js für den gleichen bereits beobachteten Effekt).

onRecordCreate((e) => {
  function notify(recipientId, type, message, link) {
    if (!recipientId) return
    const collection = e.app.findCollectionByNameOrId('notifications')
    const record = new Record(collection)
    record.set('recipient', recipientId)
    record.set('type', type)
    record.set('message', message)
    record.set('link', link || '')
    record.set('read', false)
    e.app.save(record)
  }

  const title = e.record.get('title')
  const assigned = e.record.get('assigned') || []
  const link = '/auftraege'

  assigned.forEach((userId) => {
    notify(userId, 'order_assigned', `Dir wurde der Auftrag "${title}" zugewiesen.`, link)
  })

  const trade = e.record.get('trade')
  if (trade === 'urlaub' || trade === 'krank') {
    const names = assigned
      .map((id) => {
        try {
          return e.app.findRecordById('users', id).get('name')
        } catch (err) {
          return null
        }
      })
      .filter(Boolean)
      .join(', ')
    const label = trade === 'urlaub' ? 'Urlaub' : 'Krankmeldung'
    const admins = e.app.findRecordsByFilter('users', "role = 'chef' || role = 'buero'", '', 0, 0)
    admins.forEach((admin) => {
      notify(
        admin.id,
        'order_leave',
        `${label} eingetragen${names ? ' für ' + names : ''} am ${e.record.get('date')}.`,
        link
      )
    })
  }

  e.next()
}, 'orders')

onRecordUpdate((e) => {
  function notify(recipientId, type, message, link) {
    if (!recipientId) return
    const collection = e.app.findCollectionByNameOrId('notifications')
    const record = new Record(collection)
    record.set('recipient', recipientId)
    record.set('type', type)
    record.set('message', message)
    record.set('link', link || '')
    record.set('read', false)
    e.app.save(record)
  }
  function userName(id) {
    try {
      return e.app.findRecordById('users', id).get('name')
    } catch (err) {
      return 'Jemand'
    }
  }
  function admins() {
    return e.app.findRecordsByFilter('users', "role = 'chef' || role = 'buero'", '', 0, 0)
  }

  let existing
  try {
    existing = e.app.findRecordById('orders', e.record.id)
  } catch (err) {
    e.next()
    return
  }

  const title = e.record.get('title')
  const link = '/auftraege'
  const oldAssigned = existing.get('assigned') || []
  const newAssigned = e.record.get('assigned') || []

  newAssigned
    .filter((id) => oldAssigned.indexOf(id) === -1)
    .forEach((id) => notify(id, 'order_assigned', `Dir wurde der Auftrag "${title}" zugewiesen.`, link))

  oldAssigned
    .filter((id) => newAssigned.indexOf(id) === -1)
    .forEach((id) => notify(id, 'order_unassigned', `Du wurdest vom Auftrag "${title}" entfernt.`, link))

  const oldStatus = existing.get('status')
  const newStatus = e.record.get('status')
  if (oldStatus === 'offen' && newStatus === 'erledigt') {
    const closedBy = e.record.get('closedBy')
    const closerName = closedBy ? userName(closedBy) : 'Jemand'
    const recipients = {}
    newAssigned.forEach((id) => (recipients[id] = true))
    admins().forEach((a) => (recipients[a.id] = true))
    Object.keys(recipients).forEach((id) =>
      notify(id, 'order_completed', `${closerName} hat den Auftrag "${title}" abgeschlossen.`, link)
    )
  }

  const oldDate = existing.get('date')
  const newDate = e.record.get('date')
  const oldFrom = existing.get('from')
  const newFrom = e.record.get('from')
  const oldTo = existing.get('to')
  const newTo = e.record.get('to')
  if (newStatus === 'offen' && (oldDate !== newDate || oldFrom !== newFrom || oldTo !== newTo)) {
    const timeLabel = newFrom && newTo ? ` ${newFrom}–${newTo} Uhr` : ''
    newAssigned.forEach((id) =>
      notify(
        id,
        'order_rescheduled',
        `Der Termin für Auftrag "${title}" wurde geändert: ${newDate}${timeLabel}.`,
        link
      )
    )
  }

  const oldSigned = existing.get('rapportSigned')
  const newSigned = e.record.get('rapportSigned')
  if (!oldSigned && newSigned) {
    admins().forEach((a) =>
      notify(a.id, 'order_rapport_signed', `Rapport für Auftrag "${title}" wurde unterschrieben.`, link)
    )
  }

  const oldReason = existing.get('rapportReason')
  const newReason = e.record.get('rapportReason')
  if (!oldReason && newReason) {
    admins().forEach((a) =>
      notify(
        a.id,
        'order_rapport_unsigned',
        `Rapport für Auftrag "${title}" wurde OHNE Unterschrift abgeschlossen: ${newReason}`,
        link
      )
    )
  }

  e.next()
}, 'orders')

onRecordCreate((e) => {
  function notify(recipientId, type, message, link) {
    if (!recipientId) return
    const collection = e.app.findCollectionByNameOrId('notifications')
    const record = new Record(collection)
    record.set('recipient', recipientId)
    record.set('type', type)
    record.set('message', message)
    record.set('link', link || '')
    record.set('read', false)
    e.app.save(record)
  }

  const orderId = e.record.get('order')
  const uploadedBy = e.record.get('uploadedBy')
  let order
  try {
    order = e.app.findRecordById('orders', orderId)
  } catch (err) {
    e.next()
    return
  }
  const title = order.get('title')
  const link = '/auftraege'
  const recipients = {}
  ;(order.get('assigned') || []).forEach((id) => (recipients[id] = true))
  e.app
    .findRecordsByFilter('users', "role = 'chef' || role = 'buero'", '', 0, 0)
    .forEach((a) => (recipients[a.id] = true))
  delete recipients[uploadedBy]

  let uploaderName = 'Jemand'
  try {
    uploaderName = e.app.findRecordById('users', uploadedBy).get('name')
  } catch (err) {
    // Uploader nicht auffindbar - Standardtext beibehalten.
  }

  Object.keys(recipients).forEach((id) =>
    notify(id, 'order_photo', `${uploaderName} hat ein Foto zu Auftrag "${title}" hochgeladen.`, link)
  )
  e.next()
}, 'order_photos')

onRecordCreate((e) => {
  function notify(recipientId, type, message, link) {
    if (!recipientId) return
    const collection = e.app.findCollectionByNameOrId('notifications')
    const record = new Record(collection)
    record.set('recipient', recipientId)
    record.set('type', type)
    record.set('message', message)
    record.set('link', link || '')
    record.set('read', false)
    e.app.save(record)
  }

  const orderId = e.record.get('order')
  const employeeId = e.record.get('employee')
  const checkinType = e.record.get('type')
  let order
  try {
    order = e.app.findRecordById('orders', orderId)
  } catch (err) {
    e.next()
    return
  }
  const title = order.get('title')
  const link = '/auftraege'
  let employeeName = 'Jemand'
  try {
    employeeName = e.app.findRecordById('users', employeeId).get('name')
  } catch (err) {
    // Mitarbeiter nicht auffindbar - Standardtext beibehalten.
  }

  if (checkinType === 'unterwegs') {
    e.app.findAllRecords('users').forEach((u) => {
      if (u.id !== employeeId) {
        notify(u.id, 'order_enroute', `${employeeName} ist auf dem Weg zu Auftrag "${title}".`, link)
      }
    })
  } else if (checkinType === 'angekommen') {
    // Bewusst nur für Chef/Büro sichtbar, nicht für alle Kolleg:innen (siehe feature-meldungen.md).
    e.app
      .findRecordsByFilter('users', "role = 'chef' || role = 'buero'", '', 0, 0)
      .forEach((a) => {
        if (a.id !== employeeId) {
          notify(a.id, 'order_arrived', `${employeeName} ist beim Kunden angekommen (Auftrag "${title}").`, link)
        }
      })
  }
  e.next()
}, 'order_checkins')
