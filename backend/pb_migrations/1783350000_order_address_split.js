/// <reference path="../pb_data/types.d.ts" />

// Trennt `orders.address` (ein Freitext-Feld "Straße, PLZ Ort") in `street`/`zip`/`city` auf,
// analog zu `customers` und `sites`, die diese Trennung bereits haben. Bestehende Aufträge
// werden per einfachem Split (erstes Komma trennt Straße von "PLZ Ort") migriert – bei
// unüblich formatierten Altdaten kann das Ergebnis unvollständig sein und muss ggf. per Hand
// nachgezogen werden.

function splitAddress(address) {
  if (!address) return { street: '', zip: '', city: '' }
  const [streetPart, ...rest] = address.split(',')
  const cityPart = rest.join(',').trim()
  const match = cityPart.match(/^(\d{4,5})\s+(.*)$/)
  return {
    street: streetPart.trim(),
    zip: match ? match[1] : '',
    city: match ? match[2].trim() : cityPart,
  }
}

migrate(
  (app) => {
    const orders = app.findCollectionByNameOrId('orders')
    orders.fields.add(new TextField({ name: 'street' }))
    orders.fields.add(new TextField({ name: 'zip' }))
    orders.fields.add(new TextField({ name: 'city' }))
    app.save(orders)

    app.findRecordsByFilter('orders', '', '', 0, 0).forEach((order) => {
      const { street, zip, city } = splitAddress(order.get('address'))
      order.set('street', street)
      order.set('zip', zip)
      order.set('city', city)
      app.save(order)
    })

    orders.fields.removeByName('address')
    app.save(orders)
  },
  (app) => {
    const orders = app.findCollectionByNameOrId('orders')
    orders.fields.add(new TextField({ name: 'address' }))
    app.save(orders)

    app.findRecordsByFilter('orders', '', '', 0, 0).forEach((order) => {
      const address = [order.get('street'), [order.get('zip'), order.get('city')]
        .filter(Boolean)
        .join(' ')]
        .filter(Boolean)
        .join(', ')
      order.set('address', address)
      app.save(order)
    })

    orders.fields.removeByName('street')
    orders.fields.removeByName('zip')
    orders.fields.removeByName('city')
    app.save(orders)
  }
)
