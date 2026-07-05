import { useNavigate } from 'react-router-dom'
import { LoginForm } from '../components/LoginForm'

export function LoginPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-50 px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <h1 className="text-xl font-semibold text-slate-800">Handwerkerkalender</h1>
        <LoginForm onSuccess={() => navigate('/', { replace: true })} />
      </div>
    </div>
  )
}
