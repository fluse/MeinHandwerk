import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '../types/schema'
import { useLogin } from '../hooks/useLogin'
import { Button } from '@/core/components/Button'

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          E-Mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
          {...register('email')}
        />
        {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Passwort
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
          {...register('password')}
        />
        {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
      </div>

      {error && (
        <p className="text-sm text-red-600">
          Anmeldung fehlgeschlagen. Bitte prüfen Sie Ihre Daten.
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Anmelden…' : 'Anmelden'}
      </Button>
    </form>
  )
}
