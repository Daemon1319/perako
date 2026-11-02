import { CalendarDays } from 'lucide-react'
import { useResource } from '../hooks/useResource'
import { money, monthLabel, today } from '../lib/format'
import SummaryCards from '../components/SummaryCards'
import { ErrorState } from '../components/Feedback'

export default function HomePage({ revision, onRetry, wallets, onWallets }) {
  const month = today().slice(0, 7)
  const summary = useResource(`/summary?month=${month}`, revision)

  return (
    <section className="page-enter">
      <div className="mb-7">
        <div className="eyebrow mb-3"><span className="size-1.5 rounded-full bg-teal-600" /> YOUR MONTH, AT A GLANCE</div>
        <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.045em]">A clearer picture.</h1>
        <p className="mt-2 text-sm leading-6 text-stone-500">A little more clarity for your everyday money.</p>
        <div className="month-badge mt-5"><CalendarDays size={14} />{monthLabel(month)}</div>
      </div>

      {summary.error ? <ErrorState error={summary.error} onRetry={onRetry} /> : <SummaryCards summary={summary.data} loading={summary.loading} />}

      <div className="mt-7">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Your wallets</h2><button type="button" className="text-xs text-teal-700 underline" onClick={onWallets}>Manage wallets</button></div>
        {wallets.error ? <ErrorState error={wallets.error} onRetry={onRetry} /> : wallets.loading ? <div className="skeleton h-20 rounded-2xl" /> : wallets.data?.length ? <div className="space-y-3">{wallets.data.map((wallet) => <div key={wallet.id} className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4"><span className="min-w-0 truncate text-sm">{wallet.name}</span><span className="text-sm font-semibold tabular-nums text-teal-700">{money(wallet.balance)}</span></div>)}</div> : <button type="button" className="btn-secondary w-full" onClick={onWallets}>Create your first wallet</button>}
        <p className="mt-2 text-xs text-stone-400">Current balances across all recorded dates.</p>
      </div>
    </section>
  )
}
