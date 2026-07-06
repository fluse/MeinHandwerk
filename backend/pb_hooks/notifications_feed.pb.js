/// <reference path="../pb_data/types.d.ts" />

// Meldungen rund um die Pinnwand: neuer Eintrag, Antwort/Kommentar, "als gelöst markiert",
// angepinnt (siehe feature-meldungen.md).

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

  const authorId = e.record.get('author')
  const category = e.record.get('category')
  const link = '/pinboard'
  let authorName = 'Jemand'
  try {
    authorName = e.app.findRecordById('users', authorId).get('name')
  } catch (err) {
    // Autor nicht auffindbar - Standardtext beibehalten.
  }

  e.app.findAllRecords('users').forEach((u) => {
    if (u.id !== authorId) {
      notify(u.id, 'feed_post', `${authorName} hat einen Pinnwand-Eintrag erstellt (${category}).`, link)
    }
  })
  e.next()
}, 'feed_posts')

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
    existing = e.app.findRecordById('feed_posts', e.record.id)
  } catch (err) {
    e.next()
    return
  }

  const authorId = e.record.get('author')
  const link = '/pinboard'

  if (!existing.get('resolved') && e.record.get('resolved')) {
    notify(authorId, 'feed_resolved', 'Dein Pinnwand-Beitrag wurde als gelöst markiert.', link)
  }

  if (!existing.get('pinned') && e.record.get('pinned')) {
    const text = e.record.get('text') || ''
    const preview = text.length > 80 ? `${text.slice(0, 80)}…` : text
    e.app.findAllRecords('users').forEach((u) => {
      if (u.id !== authorId) {
        notify(u.id, 'feed_pinned', `Ein Pinnwand-Beitrag wurde angepinnt: "${preview}"`, link)
      }
    })
  }

  e.next()
}, 'feed_posts')

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

  const postId = e.record.get('post')
  const commenterId = e.record.get('author')
  let post
  try {
    post = e.app.findRecordById('feed_posts', postId)
  } catch (err) {
    e.next()
    return
  }
  const link = '/pinboard'
  let commenterName = 'Jemand'
  try {
    commenterName = e.app.findRecordById('users', commenterId).get('name')
  } catch (err) {
    // Kommentator nicht auffindbar - Standardtext beibehalten.
  }

  const postAuthorId = post.get('author')
  if (postAuthorId !== commenterId) {
    notify(postAuthorId, 'feed_comment', `${commenterName} hat auf deinen Pinnwand-Beitrag geantwortet.`, link)
  }

  const notified = { [commenterId]: true, [postAuthorId]: true }
  e.app
    .findRecordsByFilter('feed_comments', 'post = {:postId}', '', 0, 0, { postId })
    .forEach((c) => {
      const id = c.get('author')
      if (!notified[id]) {
        notified[id] = true
        notify(
          id,
          'feed_comment',
          `${commenterName} hat ebenfalls auf einen Pinnwand-Beitrag geantwortet, den du kommentiert hast.`,
          link
        )
      }
    })

  e.next()
}, 'feed_comments')
