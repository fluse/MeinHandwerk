/// <reference path="../pb_data/types.d.ts" />

// Phase 1 "Fundament" des Migrationsplans (siehe MIGRATIONSPLAN.md, Abschnitt 1):
// legt das komplette Datenmodell für die Handwerkerkalender-App an.

const CHEF_OR_BUERO = '@request.auth.role = "chef" || @request.auth.role = "buero"'
const AUTH = "@request.auth.id != ''"

// Felder müssen per FieldsList.add() angehängt werden statt über die "fields"-Option des
// Collection-Konstruktors – sonst kennt der Rule-Parser beim anschließenden app.save() die
// Feldnamen noch nicht ("unknown field ...").
function addFields(collection, fields) {
  for (const field of fields) {
    collection.fields.add(field)
  }
}

migrate(
  (app) => {
    const usersCollection = app.findCollectionByNameOrId('users')
    usersCollection.fields.add(
      new SelectField({
        name: 'role',
        required: true,
        values: ['chef', 'buero', 'monteur', 'helfer'],
        maxSelect: 1,
      })
    )
    usersCollection.fields.add(new TextField({ name: 'phone' }))
    usersCollection.listRule = AUTH
    usersCollection.viewRule = AUTH
    usersCollection.createRule = CHEF_OR_BUERO
    usersCollection.updateRule = `id = @request.auth.id || (${CHEF_OR_BUERO})`
    usersCollection.deleteRule = CHEF_OR_BUERO
    app.save(usersCollection)

    const customers = new Collection({ type: 'base', name: 'customers' })
    addFields(customers, [
      new TextField({ name: 'kdnr' }),
      new TextField({ name: 'name', required: true }),
      new TextField({ name: 'contact' }),
      new TextField({ name: 'street' }),
      new TextField({ name: 'zip' }),
      new TextField({ name: 'city' }),
      new TextField({ name: 'phone' }),
      new TextField({ name: 'email' }),
      new TextField({ name: 'notes', max: 5000 }),
      new TextField({ name: 'source' }),
    ])
    customers.listRule = AUTH
    customers.viewRule = AUTH
    customers.createRule = CHEF_OR_BUERO
    customers.updateRule = CHEF_OR_BUERO
    customers.deleteRule = CHEF_OR_BUERO
    app.save(customers)

    // orders wird ohne die "project"-Relation angelegt, weil projects.scheduledOrder
    // im Gegenzug auf orders zeigt; das Feld wird unten nachträglich ergänzt.
    const orders = new Collection({ type: 'base', name: 'orders' })
    addFields(orders, [
      new TextField({ name: 'title', required: true }),
      new SelectField({
        name: 'trade',
        required: true,
        maxSelect: 1,
        values: [
          'heizung',
          'sanitaer',
          'elektro',
          'klima',
          'innenausbau',
          'besichtigung',
          'urlaub',
          'krank',
        ],
      }),
      new TextField({ name: 'date', required: true, pattern: '^\\d{4}-\\d{2}-\\d{2}$' }),
      new TextField({ name: 'from', pattern: '^\\d{2}:\\d{2}$' }),
      new TextField({ name: 'to', pattern: '^\\d{2}:\\d{2}$' }),
      new TextField({ name: 'client' }),
      new TextField({ name: 'phone' }),
      new TextField({ name: 'address' }),
      new TextField({ name: 'material', max: 5000 }),
      new TextField({ name: 'desc', max: 5000 }),
      new TextField({ name: 'note', max: 5000 }),
      new RelationField({
        name: 'assigned',
        collectionId: app.findCollectionByNameOrId('users').id,
        maxSelect: 999,
      }),
      new SelectField({
        name: 'status',
        required: true,
        maxSelect: 1,
        values: ['offen', 'erledigt'],
      }),
      new RelationField({
        name: 'closedBy',
        collectionId: app.findCollectionByNameOrId('users').id,
        maxSelect: 1,
      }),
      new DateField({ name: 'closedAt' }),
      new BoolField({ name: 'rapportSigned' }),
      new TextField({ name: 'rapportReason', max: 2000 }),
    ])
    orders.listRule = AUTH
    orders.viewRule = AUTH
    orders.createRule = CHEF_OR_BUERO
    // Monteure dürfen zugewiesene Aufträge ebenfalls schreiben (Status/Foto/Zeit/Rapport-Zusatz).
    // Eine Beschränkung auf einzelne Felder ist über API-Rules allein nicht möglich; das
    // Verhindern von Stammdaten-Änderungen durch Monteure erfordert einen pb_hook (siehe Plan Abschnitt 8).
    orders.updateRule = `(${CHEF_OR_BUERO}) || assigned.id ?= @request.auth.id`
    orders.deleteRule = CHEF_OR_BUERO
    app.save(orders)

    const projects = new Collection({ type: 'base', name: 'projects' })
    addFields(projects, [
      new TextField({ name: 'projnr' }),
      new TextField({ name: 'title' }),
      new TextField({ name: 'client' }),
      new TextField({ name: 'street' }),
      new TextField({ name: 'zip' }),
      new TextField({ name: 'city' }),
      new TextField({ name: 'phone' }),
      new NumberField({ name: 'value' }),
      new TextField({ name: 'date' }),
      new TextField({ name: 'desc', max: 5000 }),
      new SelectField({
        name: 'status',
        required: true,
        maxSelect: 1,
        values: ['offen', 'eingeplant', 'erledigt'],
      }),
      new RelationField({
        name: 'scheduledOrder',
        collectionId: orders.id,
        maxSelect: 1,
      }),
    ])
    projects.listRule = AUTH
    projects.viewRule = AUTH
    projects.createRule = CHEF_OR_BUERO
    projects.updateRule = CHEF_OR_BUERO
    projects.deleteRule = CHEF_OR_BUERO
    app.save(projects)

    addFields(orders, [
      new RelationField({
        name: 'project',
        collectionId: projects.id,
        maxSelect: 1,
      }),
    ])
    app.save(orders)

    const orderReads = new Collection({
      type: 'base',
      name: 'order_reads',
    })
    orderReads.fields.add(
      new RelationField({ name: 'order', required: true, collectionId: orders.id, maxSelect: 1 })
    )
    orderReads.fields.add(
      new RelationField({
        // "user" ist als Rule-Feldname bei PocketBase reserviert (Filter-Resolver-Konflikt),
        // daher hier "reader" statt der wörtlichen Vorlagen-Bezeichnung.
        name: 'reader',
        required: true,
        collectionId: app.findCollectionByNameOrId('users').id,
        maxSelect: 1,
      })
    )
    orderReads.fields.add(new AutodateField({ name: 'readAt', onCreate: true, onUpdate: false }))
    orderReads.listRule = AUTH
    orderReads.viewRule = AUTH
    orderReads.createRule = 'reader = @request.auth.id'
    orderReads.deleteRule = `reader = @request.auth.id || (${CHEF_OR_BUERO})`
    app.save(orderReads)

    const orderPhotos = new Collection({ type: 'base', name: 'order_photos' })
    addFields(orderPhotos, [
      new RelationField({ name: 'order', required: true, collectionId: orders.id, maxSelect: 1 }),
      new FileField({
        name: 'file',
        required: true,
        maxSelect: 1,
        maxSize: 8388608,
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      }),
      new RelationField({
        name: 'uploadedBy',
        required: true,
        collectionId: app.findCollectionByNameOrId('users').id,
        maxSelect: 1,
      }),
    ])
    orderPhotos.listRule = AUTH
    orderPhotos.viewRule = AUTH
    orderPhotos.createRule = `@request.body.uploadedBy = @request.auth.id && (order.assigned.id ?= @request.auth.id || (${CHEF_OR_BUERO}))`
    orderPhotos.deleteRule = `uploadedBy = @request.auth.id || (${CHEF_OR_BUERO})`
    app.save(orderPhotos)

    const rapports = new Collection({ type: 'base', name: 'rapports' })
    addFields(rapports, [
      new RelationField({ name: 'order', required: true, collectionId: orders.id, maxSelect: 1 }),
      new RelationField({
        name: 'author',
        required: true,
        collectionId: app.findCollectionByNameOrId('users').id,
        maxSelect: 1,
      }),
      new TextField({ name: 'text', max: 5000 }),
      new FileField({
        name: 'signature',
        maxSelect: 1,
        maxSize: 2097152,
        mimeTypes: ['image/png', 'image/jpeg'],
      }),
      new TextField({ name: 'signedName' }),
      new TextField({ name: 'date', required: true, pattern: '^\\d{4}-\\d{2}-\\d{2}$' }),
    ])
    rapports.listRule = AUTH
    rapports.viewRule = AUTH
    rapports.createRule = `@request.body.author = @request.auth.id && (order.assigned.id ?= @request.auth.id || (${CHEF_OR_BUERO}))`
    rapports.updateRule = `author = @request.auth.id || (${CHEF_OR_BUERO})`
    rapports.deleteRule = `author = @request.auth.id || (${CHEF_OR_BUERO})`
    app.save(rapports)

    const rapportMaterials = new Collection({ type: 'base', name: 'rapport_materials' })
    addFields(rapportMaterials, [
      new RelationField({
        name: 'rapport',
        required: true,
        collectionId: rapports.id,
        maxSelect: 1,
      }),
      new NumberField({ name: 'qty' }),
      new TextField({ name: 'unit' }),
      new TextField({ name: 'desc' }),
    ])
    rapportMaterials.listRule = AUTH
    rapportMaterials.viewRule = AUTH
    rapportMaterials.createRule = `rapport.author = @request.auth.id || (${CHEF_OR_BUERO})`
    rapportMaterials.updateRule = `rapport.author = @request.auth.id || (${CHEF_OR_BUERO})`
    rapportMaterials.deleteRule = `rapport.author = @request.auth.id || (${CHEF_OR_BUERO})`
    app.save(rapportMaterials)

    const timelog = new Collection({ type: 'base', name: 'timelog' })
    addFields(timelog, [
      new RelationField({
        name: 'employee',
        required: true,
        collectionId: app.findCollectionByNameOrId('users').id,
        maxSelect: 1,
      }),
      new TextField({ name: 'date', required: true, pattern: '^\\d{4}-\\d{2}-\\d{2}$' }),
      new TextField({ name: 'von', pattern: '^\\d{2}:\\d{2}$' }),
      new TextField({ name: 'bis', pattern: '^\\d{2}:\\d{2}$' }),
      new NumberField({ name: 'hours' }),
      new TextField({ name: 'travelVon', pattern: '^\\d{2}:\\d{2}$' }),
      new TextField({ name: 'travelBis', pattern: '^\\d{2}:\\d{2}$' }),
      new NumberField({ name: 'travel' }),
      new RelationField({ name: 'order', collectionId: orders.id, maxSelect: 1 }),
      new TextField({ name: 'note', max: 2000 }),
    ])
    timelog.listRule = AUTH
    timelog.viewRule = AUTH
    timelog.createRule = `employee = @request.auth.id || (${CHEF_OR_BUERO})`
    timelog.updateRule = `employee = @request.auth.id || (${CHEF_OR_BUERO})`
    timelog.deleteRule = `employee = @request.auth.id || (${CHEF_OR_BUERO})`
    app.save(timelog)

    const feedPosts = new Collection({ type: 'base', name: 'feed_posts' })
    addFields(feedPosts, [
      new RelationField({
        name: 'author',
        required: true,
        collectionId: app.findCollectionByNameOrId('users').id,
        maxSelect: 1,
      }),
      new TextField({ name: 'text', required: true, max: 5000 }),
      new SelectField({
        name: 'category',
        required: true,
        maxSelect: 1,
        values: ['werkzeug', 'sauberkeit', 'frage', 'info', 'lob', 'fahrzeug'],
      }),
      new FileField({
        name: 'image',
        maxSelect: 1,
        maxSize: 8388608,
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      }),
      new BoolField({ name: 'pinned' }),
      new BoolField({ name: 'resolved' }),
      new RelationField({
        name: 'likes',
        collectionId: app.findCollectionByNameOrId('users').id,
        maxSelect: 999,
      }),
    ])
    feedPosts.listRule = AUTH
    feedPosts.viewRule = AUTH
    feedPosts.createRule = '@request.body.author = @request.auth.id'
    feedPosts.updateRule = `author = @request.auth.id || (${CHEF_OR_BUERO})`
    feedPosts.deleteRule = `author = @request.auth.id || (${CHEF_OR_BUERO})`
    app.save(feedPosts)

    const feedComments = new Collection({ type: 'base', name: 'feed_comments' })
    addFields(feedComments, [
      new RelationField({
        name: 'post',
        required: true,
        collectionId: feedPosts.id,
        maxSelect: 1,
      }),
      new RelationField({
        name: 'author',
        required: true,
        collectionId: app.findCollectionByNameOrId('users').id,
        maxSelect: 1,
      }),
      new TextField({ name: 'text', required: true, max: 2000 }),
    ])
    feedComments.listRule = AUTH
    feedComments.viewRule = AUTH
    feedComments.createRule = '@request.body.author = @request.auth.id'
    feedComments.updateRule = `author = @request.auth.id || (${CHEF_OR_BUERO})`
    feedComments.deleteRule = `author = @request.auth.id || (${CHEF_OR_BUERO})`
    app.save(feedComments)

    const events = new Collection({ type: 'base', name: 'events' })
    addFields(events, [
      new TextField({ name: 'title', required: true }),
      new SelectField({
        name: 'type',
        required: true,
        maxSelect: 1,
        values: ['fest', 'feier', 'schulung', 'info'],
      }),
      new TextField({ name: 'date', pattern: '^\\d{4}-\\d{2}-\\d{2}$' }),
      new TextField({ name: 'time', pattern: '^\\d{2}:\\d{2}$' }),
      new TextField({ name: 'location' }),
      new TextField({ name: 'desc', max: 5000 }),
      new RelationField({
        name: 'by',
        required: true,
        collectionId: app.findCollectionByNameOrId('users').id,
        maxSelect: 1,
      }),
      new RelationField({
        name: 'rsvp',
        collectionId: app.findCollectionByNameOrId('users').id,
        maxSelect: 999,
      }),
    ])
    events.listRule = AUTH
    events.viewRule = AUTH
    events.createRule = CHEF_OR_BUERO
    events.updateRule = CHEF_OR_BUERO
    events.deleteRule = CHEF_OR_BUERO
    app.save(events)
  },
  (app) => {
    const names = [
      'events',
      'feed_comments',
      'feed_posts',
      'timelog',
      'rapport_materials',
      'rapports',
      'order_photos',
      'order_reads',
    ]
    for (const name of names) {
      app.delete(app.findCollectionByNameOrId(name))
    }

    const orders = app.findCollectionByNameOrId('orders')
    orders.fields.removeByName('project')
    app.save(orders)

    app.delete(app.findCollectionByNameOrId('projects'))
    app.delete(app.findCollectionByNameOrId('orders'))
    app.delete(app.findCollectionByNameOrId('customers'))

    const usersCollection = app.findCollectionByNameOrId('users')
    usersCollection.fields.removeByName('role')
    usersCollection.fields.removeByName('phone')
    usersCollection.listRule = null
    usersCollection.viewRule = null
    usersCollection.createRule = null
    usersCollection.updateRule = null
    usersCollection.deleteRule = null
    app.save(usersCollection)
  }
)
