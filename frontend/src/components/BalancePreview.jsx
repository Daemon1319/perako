import { ArrowRight } from 'lucide-react'
import { money } from '../lib/format'

export default function BalancePreview({ changes }) {
  if (!changes.length) return null
  const insufficient = changes.some((change) => change.after < 0)
  return <section className={`balance-preview ${insufficient ? 'insufficient' : ''}`} aria-label="Wallet balance preview" aria-live="polite" aria-atomic="true">
    <h3 className="mb-3 text-xs font-semibold">Balance after saving</h3>
    <div className="space-y-3">{changes.map((change) => <div key={change.id}>
      <p className="mb-1 truncate text-xs text-stone-500">{change.name}</p>
      <p className="flex flex-wrap items-center gap-2 text-sm tabular-nums"><span className="text-stone-500">{money(change.before / 100)}</span><ArrowRight size={14} aria-hidden="true" /><span className={`font-semibold ${change.after < 0 ? 'text-rose-700' : 'text-teal-800'}`}>{money(change.after / 100)}</span></p>
    </div>)}</div>
    {insufficient && <p className="mt-3 text-xs leading-5 text-rose-700">Insufficient funds. Choose another wallet or adjust the amount.</p>}
    <p className="mt-3 text-[11px] leading-5 text-stone-400">Based on your latest loaded balances. Checked again when you save.</p>
  </section>
}
