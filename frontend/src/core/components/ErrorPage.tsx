import { AlertTriangle } from 'lucide-react'
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom'
import { Button } from './Button'

export function ErrorPage() {
  const error = useRouteError()
  const navigate = useNavigate()
  // Kein error-Objekt heißt: die Komponente wurde direkt als "*"-Catch-all-Route gerendert,
  // nicht über eine echte Router-Fehlergrenze – das ist ebenfalls ein "Seite nicht gefunden".
  const is404 = !error || (isRouteErrorResponse(error) && error.status === 404)

  const title = is404 ? 'Seite nicht gefunden' : 'Etwas ist schiefgelaufen'
  const description = is404
    ? 'Die aufgerufene Seite existiert nicht oder wurde verschoben.'
    : 'Es ist ein unerwarteter Fehler aufgetreten. Bitte versuche es erneut.'

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-page px-4 text-center">
      <AlertTriangle size={40} className="text-sage-deep" />
      <h1 className="text-lg font-bold text-ink">{title}</h1>
      <p className="max-w-sm text-sm text-muted">{description}</p>
      <div className="mt-3 flex gap-2">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Zurück
        </Button>
        <Button onClick={() => navigate('/', { replace: true })}>Zur Startseite</Button>
      </div>
    </div>
  )
}
