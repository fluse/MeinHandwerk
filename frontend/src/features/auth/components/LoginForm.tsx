import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import { loginSchema, type LoginInput } from '../types/schema'
import { useLogin } from '../hooks/useLogin'
import { Button } from '@/core/components/Button'

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })
  const { mutate, isPending, error } = useLogin()

  const onSubmit = (data: LoginInput) => {
    mutate(data, { onSuccess })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-ink">
          E-Mail
        </label>
        <div className="relative">
          <Mail size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="name@firma.de"
            className="w-full rounded-lg border border-border bg-page/40 py-2.5 pr-3 pl-9 text-sm text-ink placeholder:text-muted focus:border-sage focus:bg-card focus:ring-4 focus:ring-sage/15 focus:outline-none"
            {...register('email')}
          />
        </div>
        {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-ink">
          Passwort
        </label>
        <div className="relative">
          <Lock size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full rounded-lg border border-border bg-page/40 py-2.5 pr-10 pl-9 text-sm text-ink placeholder:text-muted focus:border-sage focus:bg-card focus:ring-4 focus:ring-sage/15 focus:outline-none"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            title={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
            aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
            className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted hover:text-sage-deep"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
          <AlertCircle size={16} className="mt-0.5 flex-none" />
          <span>Anmeldung fehlgeschlagen. Bitte prüfen Sie Ihre Daten.</span>
        </div>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="mt-1 flex w-full items-center justify-center gap-2 py-2.5"
      >
        {isPending && <Loader2 size={16} className="animate-spin" />}
        {isPending ? 'Anmelden…' : 'Anmelden'}
      </Button>
    </form>
  )
}
