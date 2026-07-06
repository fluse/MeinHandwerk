/// <reference path="../pb_data/types.d.ts" />

// Meldungen-Feature (Glocke im Header, siehe feature-meldungen.md): eine generische
// `notifications`-Collection, in die pb_hooks bei relevanten Ereignissen Einträge schreiben,
// plus `order_checkins` als Grundlage für den Mikro-Status-Ablauf am Auftrag
// ("Mache mich jetzt auf den Weg" / "Bin jetzt beim Kunden angekommen").

const CHEF_OR_BUERO = '@request.auth.role = "chef" || @request.auth.role = "buero"'
const AUTH = "@request.auth.id != ''"

function addFields(collection, fields) {
  for (const field of fields) {
    collection.fields.add(field)
  }
}

function withTimestamps(collection) {
  collection.fields.add(new AutodateField({ name: 'created', onCreate: true, onUpdate: false }))
  collection.fields.add(new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }))
}

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    const orders = app.findCollectionByNameOrId('orders')

    // --- notifications ---------------------------------------------------------------------
    // Wird ausschließlich von pb_hooks befüllt (createRule: niemand über die API), daher gibt es
    // keinen "author" – nur der Empfänger sieht seine eigenen Meldungen.
    const notifications = new Collection({ type: 'base', name: 'notifications' })
    addFields(notifications, [
      new RelationField({
        name: 'recipient',
        required: true,
        collectionId: users.id,
        maxSelect: 1,
        cascadeDelete: true,
      }),
      new SelectField({
        name: 'type',
        required: true,
        maxSelect: 1,
        values: [
          'order_assigned',
          'order_unassigned',
          'order_completed',
          'order_rescheduled',
          'order_leave',
          'order_unstaffed',
          'order_photo',
          'order_rapport_signed',
          'order_rapport_unsigned',
          'order_enroute',
          'order_arrived',
          'feed_post',
          'feed_comment',
          'feed_resolved',
          'feed_pinned',
          'event_created',
          'event_today',
          'event_rsvp',
          'vehicle_taken',
          'vehicle_returned',
          'team_new_member',
          'project_status',
          'timelog_missing',
        ],
      }),
      new TextField({ name: 'message', required: true, max: 500 }),
      // Relativer Frontend-Pfad, auf den beim Antippen der Meldung navigiert wird (z. B. Deep-Link
      // zum betroffenen Auftrag). Bewusst als einfacher Text statt Relation, da Meldungen auf ganz
      // unterschiedliche Collections verweisen (orders, feed_posts, events, ...).
      new TextField({ name: 'link', max: 300 }),
      new BoolField({ name: 'read' }),
    ])
    withTimestamps(notifications)
    notifications.listRule = 'recipient = @request.auth.id'
    notifications.viewRule = 'recipient = @request.auth.id'
    // Wird nur serverseitig per app.save() in pb_hooks erzeugt (umgeht API-Rules) – daher kein
    // Weg für Clients, direkt eigene Meldungen anzulegen.
    notifications.createRule = null
    // Erlaubt dem Empfänger, seine Meldung als gelesen zu markieren.
    notifications.updateRule = 'recipient = @request.auth.id'
    // Chef/Büro dürfen zusätzlich fremde Meldungen löschen (Aufräumen-Aktion in den Einstellungen).
    notifications.deleteRule = `recipient = @request.auth.id || (${CHEF_OR_BUERO})`
    app.save(notifications)

    // --- order_checkins ----------------------------------------------------------------------
    // Ein Eintrag pro Antippen von "Mache mich jetzt auf den Weg" / "Bin jetzt beim Kunden
    // angekommen" – ein Auftrag kann mehrere zugewiesene Mitarbeiter haben, die zu
    // unterschiedlichen Zeiten losfahren, daher pro Mitarbeiter statt als Feld auf `orders`
    // (siehe Begründung in feature-meldungen.md). `created` dient als Zeitstempel des Taps.
    const orderCheckins = new Collection({ type: 'base', name: 'order_checkins' })
    addFields(orderCheckins, [
      new RelationField({
        name: 'order',
        required: true,
        collectionId: orders.id,
        maxSelect: 1,
        cascadeDelete: true,
      }),
      new RelationField({
        name: 'employee',
        required: true,
        collectionId: users.id,
        maxSelect: 1,
      }),
      new SelectField({
        name: 'type',
        required: true,
        maxSelect: 1,
        values: ['unterwegs', 'angekommen'],
      }),
    ])
    withTimestamps(orderCheckins)
    orderCheckins.listRule = AUTH
    orderCheckins.viewRule = AUTH
    orderCheckins.createRule = `@request.body.employee = @request.auth.id && (order.assigned.id ?= @request.auth.id || (${CHEF_OR_BUERO}))`
    // Unveränderlich – jeder Tap ist ein neuer Eintrag statt eines Updates.
    orderCheckins.updateRule = null
    orderCheckins.deleteRule = `employee = @request.auth.id || (${CHEF_OR_BUERO})`
    app.save(orderCheckins)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('order_checkins'))
    app.delete(app.findCollectionByNameOrId('notifications'))
  }
)
