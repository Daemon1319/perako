import { Wallet } from 'lucide-react'
import { useResource } from '../hooks/useResource'
import { money, monthLabel, today } from '../lib/format'
import { cents } from '../lib/balancePreview'
import AnimatedAmount from '../components/AnimatedAmount'
import SummaryCards from '../components/SummaryCards'
import CategoryBreakdown from '../components/CategoryBreakdown'
import { ErrorState } from '../components/Feedback'

export default function HomePage({ revision, onRetry, wallets, onWallets }) {
  const month = today().slice(0, 7)
  const summary = useResource(`/summary?month=${month}`, revision)
  const available = (wallets.data || []).reduce((total, wallet) => total + (cents(wallet.balance) || 0), 0) / 100

  return (
    <section className="page-enter home-overview">
      {wallets.error ? <div><h1 className="mb-3 text-lg font-semibold">Available balance</h1><ErrorState error={wallets.error} onRetry={onRetry} /></div> : <section className="net-card available-card" aria-labelledby="available-balance-title" aria-busy={wallets.loading}>
        <h1 id="available-balance-title" className="flex items-center gap-2 text-sm font-medium text-teal-100"><Wallet size={17} /> Available balance</h1>
        {wallets.loading && !wallets.data ? <div className="mt-4 h-12 w-3/4 animate-pulse rounded-lg bg-white/10" /> : <p className={`net-amount ${available < 0 ? 'text-rose-200' : 'text-white'}`}><AnimatedAmount value={available} /></p>}
        <p className="mt-3 text-xs text-teal-100/80">Current total across all wallets</p>
      </section>}

      <section className="home-section" aria-labelledby="home-wallets-title">
        <div className="section-heading"><h2 id="home-wallets-title">Wallets</h2><button type="button" className="text-action" onClick={onWallets}>Manage wallets</button></div>
        {wallets.error ? <p className="text-sm text-stone-500">Wallet balances are currently unavailable.</p> : wallets.loading && !wallets.data ? <div className="skeleton h-24 rounded-2xl" aria-label="Loading wallets" /> : wallets.data?.length ? <dl className="wallet-balances" aria-busy={wallets.loading}>{wallets.data.map((wallet) => <div key={wallet.id}><dt>{wallet.name}</dt><dd className={Number(wallet.balance) < 0 ? 'text-rose-600' : 'text-teal-800'}>{money(wallet.balance)}</dd></div>)}</dl> : <button type="button" className="btn-secondary w-full" onClick={onWallets}>Create your first wallet</button>}
      </section>

      <section className="home-section" aria-labelledby="month-overview-title">
        <div className="section-heading"><h2 id="month-overview-title">{monthLabel(month)} overview</h2><span className="this-month-badge">This month</span></div>
        {summary.error ? <ErrorState error={summary.error} onRetry={onRetry} /> : <SummaryCards summary={summary.data} loading={summary.loading} />}
      </section>
      {!summary.error && <CategoryBreakdown summary={summary.data} loading={summary.loading} month={monthLabel(month)} />}
    </section>
  )
}
