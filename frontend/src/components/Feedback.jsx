import { AlertCircle, LoaderCircle, RefreshCw } from 'lucide-react'

export function Spinner({ className = '' }) {
  return <LoaderCircle className={`animate-spin ${className}`} size={19} aria-hidden="true" />
}

export function ErrorNotice({ children }) {
  if (!children) return null
  return (
    <div role="alert" className="error-notice">
      <AlertCircle size={17} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-5 text-center">
      <p className="text-sm text-rose-900" role="alert">{error}</p>
      <button className="btn-secondary mx-auto mt-4" onClick={onRetry} type="button">
        <RefreshCw size={15} /> Try again
      </button>
    </div>
  )
}
