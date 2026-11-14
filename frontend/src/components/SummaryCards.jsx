import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import AnimatedAmount from './AnimatedAmount'

export default function SummaryCards({ summary, loading = false, compact = false, transfers = false }) {
  if (compact) {
    return (
      <div className="summary-compact" style={transfers ? { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' } : undefined} aria-busy={loading}>
        {(transfers ? [
          ['Transferred', summary?.amount, 'text-teal-700'],
          ['Fees', summary?.fees, 'text-stone-900'],
        ] : [
          ['Income', summary?.income, 'text-teal-700'],
          ['Expenses', summary?.expenses, 'text-stone-900'],
          ['Net income', summary?.net_income, Number(summary?.net_income) < 0 ? 'text-rose-600' : 'text-teal-800'],
        ]).map(([label, amount, color]) => (
          <div key={label} className="min-w-0">
            <p className="text-[11px] font-medium text-stone-500">{label}</p>
            {loading && !summary ? <div className="skeleton mt-2 h-5 w-20 max-w-full" /> : <p className={`mt-1.5 break-words text-[15px] font-semibold tracking-tight tabular-nums ${color}`}><AnimatedAmount value={amount} /></p>}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="monthly-overview" aria-busy={loading}>
      <div className="monthly-flow">
        {[
          { label: 'Income', amount: summary?.income, Icon: ArrowDownLeft, style: 'text-teal-700' },
          { label: 'Expenses', amount: summary?.expenses, Icon: ArrowUpRight, style: 'text-orange-700' },
        ].map(({ label, amount, Icon, style }) => (
          <div className="monthly-stat" key={label}>
            <p className="flex items-center gap-1.5 text-xs text-stone-500"><Icon size={15} className={style} />{label}</p>
            {loading && !summary ? <div className="skeleton mt-2 h-6 w-4/5" /> : <p className="mt-2 break-words text-lg font-semibold tracking-tight tabular-nums"><AnimatedAmount value={amount} /></p>}
          </div>
        ))}
      </div>
      <div className="monthly-net">
        <div><p className="text-xs font-semibold text-stone-700">Net income</p><p className="mt-1 text-[11px] text-stone-400">Income minus expenses</p></div>
        {loading && !summary ? <div className="skeleton h-6 w-24" /> : <p className={`min-w-0 break-words text-right text-lg font-semibold tracking-tight tabular-nums ${Number(summary?.net_income) < 0 ? 'text-rose-600' : 'text-teal-800'}`}><AnimatedAmount value={summary?.net_income} /></p>}
      </div>
    </div>
  )
}
