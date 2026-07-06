/// <reference path="../pb_data/types.d.ts" />

// Meldungen rund um Aufträge (siehe feature-meldungen.md): zugewiesen/entzogen, abgeschlossen,
// verschoben, Urlaub/Krank, Foto hochgeladen, Rapport mit/ohne Unterschrift, sowie die
// Mikro-Status-Taps aus `order_checkins` (unterwegs/angekommen).
//
// Jede Callback-Funktion bekommt ihre eigene kleine `notify`-Helper-Funktion statt eine
// gemeinsame Top-Level-Funktion zu nutzen: PocketBase führt onRecord*-Callbacks isoliert aus,
// Top-Level-Hilfsfunktionen derselben Datei sind darin nicht zuverlässig sichtbar (siehe
// geocode_customer.pb.js für den gleichen bereits beobachteten Effekt).
//
// Zuweisung/Termin-Meldungen (order_assigned/order_unassigned/order_rescheduled/order_leave)
// hängen jetzt an `order_blocks` statt an `orders` (siehe feature-order-flow-vehicle-position.md,
// order_blocks-Migration): `orders` selbst trägt kein `date`/`assigned` mehr, ein Auftrag wird
// zuerst leer angelegt und bekommt seine Termine erst über separate order_blocks-Datensätze.

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
  const assigned = e.record.get('assigned') || []
  const date = e.record.get('date')
  const from = e.record.get('from')
  const to = e.record.get('to')
  const link = '/auftraege'

  let order
  try {
    order = e.app.findRecordById('orders', orderId)
  } catch (err) {
    e.next()
    return
  }
  const title = order.get('title')
  const timeLabel = from && to ? ` ${from}–${to} Uhr` : ''

  assigned.forEach((userId) => {
    notify(
      userId,
      'order_assigned',
      `Dir wurde ein Termin für Auftrag "${title}" am ${date}${timeLabel} zugewiesen.`,
      link
    )
  })

  const trade = order.get('trade')
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
      notify(admin.id, 'order_leave', `${label} eingetragen${names ? ' für ' + names : ''} am ${date}.`, link)
    })
  }

  e.next()
}, 'order_blocks')

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

  let existing
  try {
    existing = e.app.findRecordById('order_blocks', e.record.id)
  } catch (err) {
    e.next()
    return
  }

  const orderId = e.record.get('order')
  let order
  try {
    order = e.app.findRecordById('orders', orderId)
  } catch (err) {
    e.next()
    return
  }
  const title = order.get('title')
  const link = '/auftraege'

  const oldAssigned = existing.get('assigned') || []
  const newAssigned = e.record.get('assigned') || []
  const newDate = e.record.get('date')
  const newFrom = e.record.get('from')
  const newTo = e.record.get('to')
  const timeLabel = newFrom && newTo ? ` ${newFrom}–${newTo} Uhr` : ''

  newAssigned
    .filter((id) => oldAssigned.indexOf(id) === -1)
    .forEach((id) =>
      notify(
        id,
        'order_assigned',
        `Dir wurde ein Termin für Auftrag "${title}" am ${newDate}${timeLabel} zugewiesen.`,
        link
      )
    )

  oldAssigned
    .filter((id) => newAssigned.indexOf(id) === -1)
    .forEach((id) =>
      notify(
        id,
        'order_unassigned',
        `Du wurdest von einem Termin für Auftrag "${title}" am ${newDate} entfernt.`,
        link
      )
    )

  const oldDate = existing.get('date')
  const oldFrom = existing.get('from')
  const oldTo = existing.get('to')
  if (order.get('status') === 'offen' && (oldDate !== newDate || oldFrom !== newFrom || oldTo !== newTo)) {
    newAssigned.forEach((id) =>
      notify(
        id,
        'order_rescheduled',
        `Der Termin für Auftrag "${title}" wurde geändert: ${newDate}${timeLabel}.`,
        link
      )
    )
  }

  e.next()
}, 'order_blocks')

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

  const oldStatus = existing.get('status')
  const newStatus = e.record.get('status')
  if (oldStatus === 'offen' && newStatus === 'erledigt') {
    const closedBy = e.record.get('closedBy')
    const closerName = closedBy ? userName(closedBy) : 'Jemand'
    // "Abgeschlossen" betrifft den ganzen Auftrag, nicht nur einen Tag – daher alle, die je in
    // irgendeinem order_blocks-Eintrag zugewiesen waren, statt nur des aktuellen Blocks.
    const recipients = {}
    e.app
      .findRecordsByFilter('order_blocks', 'order = {:orderId}', '', 0, 0, { orderId: e.record.id })
      .forEach((block) => (block.get('assigned') || []).forEach((id) => (recipients[id] = true)))
    admins().forEach((a) => (recipients[a.id] = true))
    Object.keys(recipients).forEach((id) =>
      notify(id, 'order_completed', `${closerName} hat den Auftrag "${title}" abgeschlossen.`, link)
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
  // "Foto hochgeladen" betrifft den ganzen Auftrag, daher alle je zugewiesenen Mitarbeiter über
  // alle order_blocks hinweg, nicht nur den heutigen Block.
  e.app
    .findRecordsByFilter('order_blocks', 'order = {:orderId}', '', 0, 0, { orderId })
    .forEach((block) => (block.get('assigned') || []).forEach((id) => (recipients[id] = true)))
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

// Validiert arbeit_begonnen/verlassen serverseitig, bevor der Checkin überhaupt angelegt wird
// (siehe feature-order-flow-vehicle-position.md): first-come-first-served pro Auftrag/Tag, nur
// möglich, wenn der Auftrag heute einen order_block hat UND der einreichende Mitarbeiter genau
// in diesem Block als assigned steht, und nur in der Reihenfolge angekommen -> arbeit_begonnen ->
// verlassen. unterwegs/angekommen sind von dieser zusätzlichen Prüfung unberührt (deren Verhalten
// bleibt wie bisher rein über die createRule geregelt).
onRecordCreateRequest((e) => {
  function isoDate(d) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const checkinType = e.record.get('type')
  if (checkinType !== 'arbeit_begonnen' && checkinType !== 'verlassen') {
    e.next()
    return
  }

  const orderId = e.record.get('order')
  const employeeId = e.record.get('employee')
  const today = isoDate(new Date())
  const todayBlock = e.app.findRecordsByFilter(
    'order_blocks',
    'order = {:orderId} && date = {:today}',
    '',
    1,
    0,
    { orderId, today }
  )[0]

  if (!todayBlock) {
    throw e.badRequestError('Für diesen Auftrag ist heute kein Termin geplant.', null)
  }
  if (!(todayBlock.get('assigned') || []).includes(employeeId)) {
    throw e.badRequestError('Du bist dem heutigen Termin für diesen Auftrag nicht zugewiesen.', null)
  }

  const lastWork = e.app.findRecordsByFilter(
    'order_checkins',
    "order = {:orderId} && (type = 'arbeit_begonnen' || type = 'verlassen')",
    '-created',
    1,
    0,
    { orderId }
  )[0]

  if (checkinType === 'arbeit_begonnen') {
    if (lastWork && lastWork.get('type') === 'arbeit_begonnen') {
      throw e.badRequestError('Die Arbeit wurde für diesen Auftrag bereits begonnen.', null)
    }
    const myLastArrived = e.app.findRecordsByFilter(
      'order_checkins',
      "order = {:orderId} && employee = {:employeeId} && type = 'angekommen'",
      '-created',
      1,
      0,
      { orderId, employeeId }
    )[0]
    if (!myLastArrived || (lastWork && lastWork.get('created') > myLastArrived.get('created'))) {
      throw e.badRequestError('Du musst zuerst als "angekommen" eingecheckt haben.', null)
    }
  } else if (checkinType === 'verlassen') {
    if (!lastWork || lastWork.get('type') !== 'arbeit_begonnen') {
      throw e.badRequestError('Die Arbeit wurde für diesen Auftrag noch nicht begonnen.', null)
    }
  }

  e.next()
}, 'order_checkins')

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

  function notifyAdmins(type, message) {
    e.app
      .findRecordsByFilter('users', "role = 'chef' || role = 'buero'", '', 0, 0)
      .forEach((a) => {
        if (a.id !== employeeId) notify(a.id, type, message, link)
      })
  }

  if (checkinType === 'unterwegs') {
    e.app.findAllRecords('users').forEach((u) => {
      if (u.id !== employeeId) {
        notify(u.id, 'order_enroute', `${employeeName} ist auf dem Weg zu Auftrag "${title}".`, link)
      }
    })
  } else if (checkinType === 'angekommen') {
    // Bewusst nur für Chef/Büro sichtbar, nicht für alle Kolleg:innen (siehe feature-meldungen.md).
    notifyAdmins('order_arrived', `${employeeName} ist beim Kunden angekommen (Auftrag "${title}").`)
  } else if (checkinType === 'arbeit_begonnen') {
    // Nur beim ersten arbeit_begonnen des gesamten Auftrags melden, nicht bei jedem Tap.
    const earlier = e.app.findRecordsByFilter(
      'order_checkins',
      "order = {:orderId} && type = 'arbeit_begonnen' && id != {:id}",
      '',
      1,
      0,
      { orderId, id: e.record.id }
    )
    if (earlier.length === 0) {
      notifyAdmins('order_work_started', `${employeeName} hat die Arbeit bei Auftrag "${title}" begonnen.`)
    }
  } else if (checkinType === 'verlassen') {
    // Nur beim ersten verlassen des gesamten Auftrags melden, nicht bei jedem Tap.
    const earlier = e.app.findRecordsByFilter(
      'order_checkins',
      "order = {:orderId} && type = 'verlassen' && id != {:id}",
      '',
      1,
      0,
      { orderId, id: e.record.id }
    )
    if (earlier.length === 0) {
      notifyAdmins('order_left', `${employeeName} hat den Auftragsort von "${title}" verlassen.`)
    }
  }
  e.next()
}, 'order_checkins')
