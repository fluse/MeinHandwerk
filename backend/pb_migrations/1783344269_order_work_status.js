/// <reference path="../pb_data/types.d.ts" />

// Erweiterung des Auftrags-Mikro-Status-Ablaufs (siehe
// feature-order-flow-vehicle-position.md) um "Arbeit begonnen" / "Auftragsort verlassen":
// zwei weitere `order_checkins.type`-Werte, first-come-first-served pro Auftrag, plus die
// zugehörigen Chef/Büro-Meldungstypen.

const NEW_CHECKIN_TYPES = ['arbeit_begonnen', 'verlassen']
const NEW_NOTIFICATION_TYPES = ['order_work_started', 'order_left']

migrate(
  (app) => {
    const checkins = app.findCollectionByNameOrId('order_checkins')
    const checkinType = checkins.fields.getByName('type')
    checkinType.values = [...checkinType.values, ...NEW_CHECKIN_TYPES]
    app.save(checkins)

    const notifications = app.findCollectionByNameOrId('notifications')
    const notificationType = notifications.fields.getByName('type')
    notificationType.values = [...notificationType.values, ...NEW_NOTIFICATION_TYPES]
    app.save(notifications)
  },
  (app) => {
    const notifications = app.findCollectionByNameOrId('notifications')
    const notificationType = notifications.fields.getByName('type')
    notificationType.values = notificationType.values.filter(
      (v) => !NEW_NOTIFICATION_TYPES.includes(v)
    )
    app.save(notifications)

    const checkins = app.findCollectionByNameOrId('order_checkins')
    const checkinType = checkins.fields.getByName('type')
    checkinType.values = checkinType.values.filter((v) => !NEW_CHECKIN_TYPES.includes(v))
    app.save(checkins)
  }
)
