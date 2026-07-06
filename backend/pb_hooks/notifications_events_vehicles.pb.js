/// <reference path="../pb_data/types.d.ts" />

// Meldungen rund um Events (neu angelegt, Zusage) und Fahrzeuge (genommen/zurückgegeben) –
// siehe feature-meldungen.md. "Heute findet Event X statt" ist eine Cron-Meldung, siehe
// notifications_cron.pb.js.

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

  const byId = e.record.get('by')
  const title = e.record.get('title')
  const date = e.record.get('date')
  const link = '/events'
  e.app.findAllRecords('users').forEach((u) => {
    if (u.id !== byId) {
      notify(u.id, 'event_created', `Neues Event: "${title}"${date ? ' am ' + date : ''}.`, link)
    }
  })
  e.next()
}, 'events')

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
    existing = e.app.findRecordById('events', e.record.id)
  } catch (err) {
    e.next()
    return
  }

  const oldRsvp = existing.get('rsvp') || []
  const newRsvp = e.record.get('rsvp') || []
  const byId = e.record.get('by')
  const title = e.record.get('title')
  const link = '/events'

  newRsvp
    .filter((id) => oldRsvp.indexOf(id) === -1 && id !== byId)
    .forEach((id) => {
      let name = 'Jemand'
      try {
        name = e.app.findRecordById('users', id).get('name')
      } catch (err) {
        // Nutzer nicht auffindbar - Standardtext beibehalten.
      }
      notify(byId, 'event_rsvp', `${name} hat für Event "${title}" zugesagt.`, link)
    })

  e.next()
}, 'events')

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
    existing = e.app.findRecordById('vehicles', e.record.id)
  } catch (err) {
    e.next()
    return
  }

  const oldAssigned = existing.get('assignedTo')
  const newAssigned = e.record.get('assignedTo')
  const name = e.record.get('name')
  const link = '/vehicles'

  if (!oldAssigned && newAssigned) {
    let takerName = 'Jemand'
    try {
      takerName = e.app.findRecordById('users', newAssigned).get('name')
    } catch (err) {
      // Nutzer nicht auffindbar - Standardtext beibehalten.
    }
    e.app.findAllRecords('users').forEach((u) => {
      if (u.id !== newAssigned) {
        notify(u.id, 'vehicle_taken', `${takerName} hat sich das Fahrzeug "${name}" genommen.`, link)
      }
    })
  } else if (oldAssigned && !newAssigned) {
    e.app.findAllRecords('users').forEach((u) => {
      notify(u.id, 'vehicle_returned', `Das Fahrzeug "${name}" wurde zurückgegeben.`, link)
    })
  }

  e.next()
}, 'vehicles')
