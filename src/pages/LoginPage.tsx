import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Lock, Mail } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { isSupabaseConfigured, missingSupabaseMessage } from '../lib/supabase'
import { AppLogo } from '../components/ui/AppLogo'
import { CuteButton } from '../components/ui/CuteButton'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { loading, signIn, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/'

  useEffect(() => {
    if (!isSupabaseConfigured) setError(missingSupabaseMessage)
  }, [])

  if (!loading && user) return <Navigate to="/" replace />

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    const result = await signIn(email, password)
    setSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    navigate(from, { replace: true })
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">
      <div className="absolute left-[-5rem] top-12 size-64 rounded-full bg-rosemilk-100/70 blur-3xl" />
      <div className="absolute bottom-[-4rem] right-[-4rem] size-72 rounded-full bg-caramel-100/80 blur-3xl" />

      <section className="soft-card relative w-[calc(100vw-2rem)] max-w-[22rem] animate-float-in overflow-hidden p-6 sm:max-w-md sm:p-8">
        <div className="mx-auto w-full max-w-64 rounded-[1.75rem] bg-cream-50/80 px-4 py-2 shadow-sm">
          <AppLogo className="h-auto w-full" />
        </div>
        <div className="mt-6">
          <h1 className="sr-only">per.pung</h1>
          <p className="mt-2 text-sm leading-6 text-cocoa-500/80">
            บันทึกรายรับ รายจ่าย และต้นทุนร้านแบบง่าย ๆ
          </p>
        </div>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="field-label">Email</span>
            <span className="relative mt-2 block">
              <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cocoa-500/45" size={18} />
              <input
                className="field-input pl-11"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </span>
          </label>

          <label className="block">
            <span className="field-label">Password</span>
            <span className="relative mt-2 block">
              <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cocoa-500/45" size={18} />
              <input
                className="field-input pl-11"
                autoComplete="current-password"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </span>
          </label>

          {error ? (
            <div className="break-words rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
              {error}
            </div>
          ) : null}

          <CuteButton className="w-full" loading={submitting} size="lg" type="submit">
            Login
          </CuteButton>
        </form>

        <p className="mt-6 hidden break-words text-center text-xs leading-5 text-cocoa-500/60 sm:block">
          ใช้บัญชีที่สร้างไว้ใน Supabase Authentication สำหรับร้านส่วนตัวของคุณ
        </p>
      </section>
    </main>
  )
}
