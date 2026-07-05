/// <reference path="../pb_data/types.d.ts" />

// Bugfix: die in der Fundament-Migration angelegten Collections (anders als die eingebaute
// "users"-Auth-Collection) hatten keine "created"/"updated"-Systemfelder. Jede Query mit
// sort=created/-created (z. B. Pinnwand-Feed, Kommentare, Auftragsfotos) schlug dadurch mit
// 400 Bad Request fehl, weil PocketBase das Sortierfeld nicht kennt.
const COLLECTIONS = [
  'customers',
  'orders',
  'projects',
  'order_reads',
  'order_photos',
  'rapports',
  'rapport_materials',
  'timelog',
  'feed_posts',
  'feed_comments',
  'events',
]

migrate(
  (app) => {
    for (const name of COLLECTIONS) {
      const collection = app.findCollectionByNameOrId(name)
      collection.fields.add(new AutodateField({ name: 'created', onCreate: true, onUpdate: false }))
      collection.fields.add(new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }))
      app.save(collection)
    }
  },
  (app) => {
    for (const name of COLLECTIONS) {
      const collection = app.findCollectionByNameOrId(name)
      collection.fields.removeByName('created')
      collection.fields.removeByName('updated')
      app.save(collection)
    }
  }
)
