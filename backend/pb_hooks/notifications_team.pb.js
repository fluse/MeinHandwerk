/// <reference path="../pb_data/types.d.ts" />

// Meldungen für Chef/Büro: neuer Mitarbeiter, Projekt-Status geändert (siehe feature-meldungen.md).

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

  const role = e.record.get('role')
  if (!role) {
    e.next()
    return
  }
  const name = e.record.get('name')
  const link = '/settings/team'
  e.app
    .findRecordsByFilter('users', "role = 'chef' || role = 'buero'", '', 0, 0)
    .forEach((a) => {
      if (a.id !== e.record.id) {
        notify(a.id, 'team_new_member', `Neuer Mitarbeiter: ${name} (${role}).`, link)
      }
    })
  e.next()
}, 'users')

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
    existing = e.app.findRecordById('projects', e.record.id)
  } catch (err) {
    e.next()
    return
  }

  const oldStatus = existing.get('status')
  const newStatus = e.record.get('status')
  if (oldStatus === newStatus) {
    e.next()
    return
  }

  const title = e.record.get('title') || e.record.get('projnr') || 'Projekt'
  const link = '/projects'
  e.app
    .findRecordsByFilter('users', "role = 'chef' || role = 'buero'", '', 0, 0)
    .forEach((a) => notify(a.id, 'project_status', `Projekt "${title}": Status geändert zu "${newStatus}".`, link))

  e.next()
}, 'projects')
