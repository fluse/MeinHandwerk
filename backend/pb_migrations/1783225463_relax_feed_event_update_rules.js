/// <reference path="../pb_data/types.d.ts" />

// Phase 5 "Pinnwand & Events" (siehe MIGRATIONSPLAN.md): feed_posts.likes und events.rsvp müssen
// von JEDEM authentifizierten Nutzer togglebar sein (nicht nur vom Autor/Ersteller oder Chef/Büro),
// da Liken/Zusagen keine Stammdaten-Änderung ist. PocketBase-API-Rules können nicht auf einzelne
// Felder beschränkt werden – dieselbe Einschränkung gilt bereits für orders.updateRule (siehe
// Kommentar dort); vollständige Feld-Reglementierung würde einen pb_hook erfordern (Plan Abschnitt 8).
const AUTH = "@request.auth.id != ''"

migrate(
  (app) => {
    const feedPosts = app.findCollectionByNameOrId('feed_posts')
    feedPosts.updateRule = AUTH
    app.save(feedPosts)

    const events = app.findCollectionByNameOrId('events')
    events.updateRule = AUTH
    app.save(events)
  },
  (app) => {
    const CHEF_OR_BUERO = '@request.auth.role = "chef" || @request.auth.role = "buero"'

    const feedPosts = app.findCollectionByNameOrId('feed_posts')
    feedPosts.updateRule = `author = @request.auth.id || (${CHEF_OR_BUERO})`
    app.save(feedPosts)

    const events = app.findCollectionByNameOrId('events')
    events.updateRule = CHEF_OR_BUERO
    app.save(events)
  }
)
