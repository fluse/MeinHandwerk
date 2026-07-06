/// <reference path="../pb_data/types.d.ts" />

// Mehrtägige Aufträge mit mehreren Zeitblöcken (siehe feature-order-flow-vehicle-position.md,
// Abschnitt "Erweiterung: Mehrtägige Aufträge mit mehreren Zeitblöcken"): `orders.date`/`from`/
// `to`/`assigned` werden durch die neue Relation-Collection `order_blocks` ersetzt (mehrere
// Termine pro Auftrag, jeweils mit eigenem Datum/Zeitfenster/Team). Bestehende Aufträge werden
// 1:1 in genau einen Block überführt, danach werden die vier Felder von `orders` entfernt.

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
    const orders = app.findCollectionByNameOrId('orders')
    const users = app.findCollectionByNameOrId('users')

    // --- order_blocks -----------------------------------------------------------------------
    const orderBlocks = new Collection({ type: 'base', name: 'order_blocks' })
    addFields(orderBlocks, [
      new RelationField({
        name: 'order',
        required: true,
        collectionId: orders.id,
        maxSelect: 1,
        cascadeDelete: true,
      }),
      new TextField({ name: 'date', required: true, pattern: '^\\d{4}-\\d{2}-\\d{2}$' }),
      new TextField({ name: 'from', pattern: '^\\d{2}:\\d{2}$' }),
      new TextField({ name: 'to', pattern: '^\\d{2}:\\d{2}$' }),
      new RelationField({ name: 'assigned', collectionId: users.id, maxSelect: 999 }),
    ])
    withTimestamps(orderBlocks)
    orderBlocks.listRule = AUTH
    orderBlocks.viewRule = AUTH
    orderBlocks.createRule = CHEF_OR_BUERO
    orderBlocks.updateRule = CHEF_OR_BUERO
    orderBlocks.deleteRule = CHEF_OR_BUERO
    // Nur ein Block pro Auftrag/Tag (siehe Feature-Doc, Offene Frage 1) + Index für die
    // Datums-Range-Filter, mit denen der Kalender künftig arbeitet.
    orderBlocks.indexes = [
      'CREATE INDEX idx_order_blocks_date ON order_blocks (date)',
      'CREATE UNIQUE INDEX idx_order_blocks_order_date ON order_blocks (order, date)',
    ]
    app.save(orderBlocks)

    // --- Backfill: jeder bestehende Auftrag bekommt genau einen Block -----------------------
    app.findRecordsByFilter('orders', '', '', 0, 0).forEach((order) => {
      const block = new Record(orderBlocks)
      block.set('order', order.id)
      block.set('date', order.get('date'))
      block.set('from', order.get('from'))
      block.set('to', order.get('to'))
      block.set('assigned', order.get('assigned') || [])
      app.save(block)
    })

    // --- orders: Zeit-/Zuweisungsfelder entfernen --------------------------------------------
    orders.fields.removeByName('date')
    orders.fields.removeByName('from')
    orders.fields.removeByName('to')
    orders.fields.removeByName('assigned')
    // Grobkörnig "irgendeinem Block je zugewiesen" statt "heute zugewiesen" (siehe Feature-Doc,
    // Entschiedene Architektur Punkt 6) – Tages-Genauigkeit für Checkins bleibt Aufgabe des
    // bestehenden order_checkins-Request-Hooks.
    orders.updateRule = `(${CHEF_OR_BUERO}) || order_blocks_via_order.assigned.id ?= @request.auth.id`
    app.save(orders)

    const orderPhotos = app.findCollectionByNameOrId('order_photos')
    orderPhotos.createRule = `@request.body.uploadedBy = @request.auth.id && (order.order_blocks_via_order.assigned.id ?= @request.auth.id || (${CHEF_OR_BUERO}))`
    app.save(orderPhotos)

    const rapports = app.findCollectionByNameOrId('rapports')
    rapports.createRule = `@request.body.author = @request.auth.id && (order.order_blocks_via_order.assigned.id ?= @request.auth.id || (${CHEF_OR_BUERO}))`
    app.save(rapports)

    const orderCheckins = app.findCollectionByNameOrId('order_checkins')
    orderCheckins.createRule = `@request.body.employee = @request.auth.id && (order.order_blocks_via_order.assigned.id ?= @request.auth.id || (${CHEF_OR_BUERO}))`
    app.save(orderCheckins)
  },
  (app) => {
    const orderCheckins = app.findCollectionByNameOrId('order_checkins')
    orderCheckins.createRule = `@request.body.employee = @request.auth.id && (order.assigned.id ?= @request.auth.id || (${CHEF_OR_BUERO}))`
    app.save(orderCheckins)

    const rapports = app.findCollectionByNameOrId('rapports')
    rapports.createRule = `@request.body.author = @request.auth.id && (order.assigned.id ?= @request.auth.id || (${CHEF_OR_BUERO}))`
    app.save(rapports)

    const orderPhotos = app.findCollectionByNameOrId('order_photos')
    orderPhotos.createRule = `@request.body.uploadedBy = @request.auth.id && (order.assigned.id ?= @request.auth.id || (${CHEF_OR_BUERO}))`
    app.save(orderPhotos)

    const orders = app.findCollectionByNameOrId('orders')
    orders.updateRule = `(${CHEF_OR_BUERO}) || assigned.id ?= @request.auth.id`
    addFields(orders, [
      new TextField({ name: 'date', required: true, pattern: '^\\d{4}-\\d{2}-\\d{2}$' }),
      new TextField({ name: 'from', pattern: '^\\d{2}:\\d{2}$' }),
      new TextField({ name: 'to', pattern: '^\\d{2}:\\d{2}$' }),
      new RelationField({
        name: 'assigned',
        collectionId: app.findCollectionByNameOrId('users').id,
        maxSelect: 999,
      }),
    ])
    app.save(orders)

    const orderBlocks = app.findCollectionByNameOrId('order_blocks')
    app.findRecordsByFilter('orders', '', '', 0, 0).forEach((order) => {
      const block = app
        .findRecordsByFilter('order_blocks', 'order = {:orderId}', 'created', 1, 0, {
          orderId: order.id,
        })
        .at(0)
      if (!block) return
      order.set('date', block.get('date'))
      order.set('from', block.get('from'))
      order.set('to', block.get('to'))
      order.set('assigned', block.get('assigned') || [])
      app.save(order)
    })

    app.delete(orderBlocks)
  }
)
