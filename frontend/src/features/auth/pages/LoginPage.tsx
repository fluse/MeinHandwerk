import { useNavigate } from 'react-router-dom'
import { HardHat } from 'lucide-react'
import { LoginForm } from '../components/LoginForm'

export function LoginPage() {
  const navigate = useNavigate()

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-page px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-24 h-72 w-72 rounded-full bg-sage/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -bottom-32 h-80 w-80 rounded-full bg-sage-deep/20 blur-3xl"
      />

      <div className="relative flex w-full max-w-sm flex-col items-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-deep text-white shadow-sm">
          <HardHat size={26} />
        </div>
        <h1 className="text-xl font-bold text-ink">Hahn Energie & Bau</h1>
        <p className="mt-1 text-sm text-muted">Handwerkerkalender</p>

        <div className="mt-7 w-full rounded-2xl border border-border bg-card p-6 shadow-lg shadow-black/[0.03] sm:p-7">
          <LoginForm onSuccess={() => navigate('/', { replace: true })} />
        </div>
      </div>
    </div>
  )
}
