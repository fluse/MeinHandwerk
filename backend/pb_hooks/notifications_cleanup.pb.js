/// <reference path="../pb_data/types.d.ts" />

// Manuelles Aufräumen der Meldungshistorie (Einstellungen > Meldungen): bewusst kein
// Cron/Automatik – Chef/Büro entscheiden selbst, wann aufgeräumt wird (siehe
// feature-meldungen.md). Löscht alle Meldungen aller Nutzer, nicht nur die eigenen, da
// `notifications.listRule` jeden Nutzer auf seine eigenen Meldungen beschränkt und ein
// Custom-Route hier einfacher ist als die Rules dafür aufzuweichen.
routerAdd(
  'POST',
  '/api/notifications-cleanup',
  (e) => {
    const role = e.auth ? e.auth.get('role') : ''
    if (role !== 'chef' && role !== 'buero') {
      throw e.forbiddenError('Nur Chef/Büro dürfen Meldungen aufräumen.', null)
    }

    const records = e.app.findRecordsByFilter('notifications', '', '', 0, 0)
    records.forEach((record) => e.app.delete(record))

    return e.json(200, { deleted: records.length })
  },
  $apis.requireAuth()
)
