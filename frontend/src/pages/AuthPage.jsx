import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import Brand from '../components/Brand'
import { ErrorNotice, Spinner } from '../components/Feedback'

export default function AuthPage() {
  const { user, login } = useAuth()
  const [mode, setMode] = useState('login')
  const [fields, setFields] = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const signup = mode === 'signup'

  if (user) return <Navigate to="/" replace />

  function change(event) {
    setFields({ ...fields, [event.target.name]: event.target.value })
  }

  function switchMode(next) {
    setMode(next)
    setError('')
    setMessage('')
    setFields({ ...fields, password: '', password_confirmation: '' })
  }

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      if (signup) {
        if (fields.password !== fields.password_confirmation) {
          setFields((previous) => ({ ...previous, password: '', password_confirmation: '' }))
          throw new Error('Your passwords do not match. Please enter them again.')
        }
        await api('/users', { method: 'POST', body: { user: { ...fields, name: fields.name.trim(), email: fields.email.trim() } } })
        setMode('login')
        setFields({ ...fields, password: '', password_confirmation: '' })
        setMessage('Your account is ready. Sign in to start tracking.')
      } else {
        await login(fields.email.trim(), fields.password)
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-shell">
      <div className="px-7 pb-10 pt-10 sm:pt-14">
        <Brand large />
        <div className="auth-art" aria-hidden="true">
          <span className="auth-art-line" />
          <span className="auth-art-circle">₱</span>
          <span className="auth-art-note">a little clarity goes a long way.</span>
          <span className="auth-art-dot" />
        </div>

        <div className="mb-7">
          <p className="eyebrow mb-3">YOUR MONEY. YOUR PACE.</p>
          <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.045em]">{signup ? 'Make yourself at home.' : 'Good to see you.'}</h1>
          <p className="mt-2 text-sm leading-6 text-stone-500">{signup ? 'A simple place for your income and expenses.' : 'Sign in for a clearer picture of your money.'}</p>
        </div>

        <div className="auth-tabs mb-6">
          <button type="button" className={!signup ? 'active' : ''} onClick={() => switchMode('login')} disabled={busy}>Sign in</button>
          <button type="button" className={signup ? 'active' : ''} onClick={() => switchMode('signup')} disabled={busy}>Create account</button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <ErrorNotice>{error}</ErrorNotice>
          {message && <p className="rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800" role="status">{message}</p>}
          {signup && <label className="field-label">Your name<input className="field mt-2" name="name" placeholder="What should we call you?" autoComplete="name" maxLength={100} required value={fields.name} onChange={change} disabled={busy} /></label>}
          <label className="field-label">Email address<input className="field mt-2" name="email" type="email" placeholder="you@example.com" autoComplete="email" maxLength={255} required value={fields.email} onChange={change} disabled={busy} /></label>
          <label className="field-label">Password
            <div className="relative mt-2">
              <input className="field pr-12" name="password" type={visible ? 'text' : 'password'} placeholder={signup ? 'At least 8 characters' : 'Enter your password'} autoComplete={signup ? 'new-password' : 'current-password'} minLength={signup ? 8 : undefined} required value={fields.password} onChange={change} disabled={busy} />
              <button type="button" className="absolute inset-y-0 right-1 flex w-11 items-center justify-center text-stone-400" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </label>
          {signup && <label className="field-label">Confirm password<input className="field mt-2" name="password_confirmation" type={visible ? 'text' : 'password'} placeholder="Enter your password again" autoComplete="new-password" required value={fields.password_confirmation} onChange={change} disabled={busy} /></label>}
          <button className="btn-primary mt-2 w-full" disabled={busy} type="submit">{busy ? <Spinner /> : <>{signup ? 'Create account' : 'Sign in'}<ArrowRight size={18} /></>}</button>
        </form>

        <p className="mt-7 flex items-center justify-center gap-2 text-[11px] text-stone-400"><LockKeyhole size={13} />Your account. Your private transactions.</p>
      </div>
    </main>
  )
}
