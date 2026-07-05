/// <reference path="../pb_data/types.d.ts" />

// "Projekt → Kalender einplanen" (siehe MIGRATIONSPLAN.md Abschnitt 4): wenn ein Auftrag mit
// project-Relation angelegt wird, das Projekt serverseitig als "eingeplant" markieren und die
// scheduledOrder-Relation setzen, statt das dem Client über zwei Requests zu überlassen.
onRecordAfterCreateSuccess((e) => {
  const projectId = e.record.get('project')
  if (projectId) {
    const project = e.app.findRecordById('projects', projectId)
    project.set('status', 'eingeplant')
    project.set('scheduledOrder', e.record.id)
    e.app.save(project)
  }
  e.next()
}, 'orders')
