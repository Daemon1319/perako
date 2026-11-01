import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react'
import AnimatedAmount from './AnimatedAmount'

export default function SummaryCards({ summary, loading = false, compact = false }) {
  if (compact) {
    return (
      <div className="summary-compact" aria-busy={loading}>
        {[
          ['Income', summary?.income, 'text-teal-700'],
          ['Expenses', summary?.expenses, 'text-stone-900'],
          ['Net income', summary?.net_income, Number(summary?.net_income) < 0 ? 'text-rose-600' : 'text-teal-800'],
        ].map(([label, amount, color]) => (
          <div key={label} className="min-w-0">
            <p className="text-[11px] font-medium text-stone-500">{label}</p>
            {loading && !summary ? <div className="skeleton mt-2 h-5 w-20 max-w-full" /> : <p className={`mt-1.5 break-words text-[15px] font-semibold tracking-tight tabular-nums ${color}`}><AnimatedAmount value={amount} /></p>}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4" aria-busy={loading}>
      <div className="net-card">
        <div className="flex items-center gap-2 text-sm text-teal-100/75">
          <Wallet size={17} strokeWidth={1.7} /> Net income
        </div>
        {loading && !summary ? <div className="mt-5 h-14 w-3/4 animate-pulse rounded-lg bg-white/10" /> : (
          <p className={`net-amount ${Number(summary?.net_income) < 0 ? 'text-rose-200' : 'text-white'}`}><AnimatedAmount value={summary?.net_income} /></p>
        )}
        <div className="mt-6 border-t border-white/10 pt-4 text-xs text-teal-100/60">Income minus expenses, this month</div>
        <div className="net-orbit" aria-hidden="true" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total income', amount: summary?.income, Icon: ArrowDownLeft, style: 'bg-teal-50 text-teal-700' },
          { label: 'Total expenses', amount: summary?.expenses, Icon: ArrowUpRight, style: 'bg-orange-50 text-orange-700' },
        ].map(({ label, amount, Icon, style }) => (
          <div className="stat-card" key={label}>
            <div className={`mb-5 flex size-10 items-center justify-center rounded-full ${style}`}><Icon size={21} /></div>
            <p className="text-xs text-stone-500">{label}</p>
            {loading && !summary ? <div className="skeleton mt-2 h-7 w-full" /> : <p className="mt-1.5 break-words text-xl font-semibold tracking-tight tabular-nums"><AnimatedAmount value={amount} /></p>}
          </div>
        ))}
      </div>
    </div>
  )
}
