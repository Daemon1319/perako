import { Fragment, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ReceiptText } from 'lucide-react'
import { useResource } from '../hooks/useResource'
import { dateLabel, money, monthLabel, monthRange, shiftMonth, today } from '../lib/format'
import SummaryCards from '../components/SummaryCards'
import { ErrorState } from '../components/Feedback'

export default function TransactionsPage({ wallets, categories, categoriesLoading, revision, onEdit, onRetry }) {
  const currentMonth = today().slice(0, 7)
  const [selectedMonth, setMonth] = useState(currentMonth)
  const month = selectedMonth > currentMonth ? currentMonth : selectedMonth
  const [allTime, setAllTime] = useState(false)
  const [type, setType] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [walletId, setWalletId] = useState('')
  const [page, setPage] = useState(1)
  const categoryOptions = categories.filter((category) => !type || category.transaction_type === type)
  const selectedCategory = categoryOptions.some((category) => String(category.id) === categoryId) ? categoryId : ''
  const params = new URLSearchParams({ page })
  if (!allTime) Object.entries(monthRange(month)).forEach(([key, value]) => params.set(key, value))
  if (walletId) params.set('wallet_id', walletId)
  if (type) params.set('transaction_type', type)
  if (selectedCategory) params.set('category_id', selectedCategory)

  const resource = useResource(`/transactions?${params}`, revision)
  const summary = useResource(allTime ? '/summary?period=all' : `/summary?month=${month}`, revision)
  const transactions = resource.data?.transactions || []
  const pagination = resource.data?.pagination

  function selectMonth(next) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(next) || next > currentMonth) return
    setMonth(next)
    setAllTime(false)
    setPage(1)
  }

  return (
    <section className="page-enter">
      <div className="mb-6">
        <p className="eyebrow mb-3">THE LITTLE THINGS ADD UP</p>
        <h1 className="text-[30px] font-semibold tracking-[-0.045em]">Your transactions.</h1>
        <p className="mt-1.5 text-sm text-stone-500">Every little in. Every little out.</p>
      </div>

      <div className="period-toolbar">
        <div className="flex min-w-0 items-center gap-1">
          <button className="icon-button" type="button" aria-label="Previous month" disabled={allTime} onClick={() => selectMonth(shiftMonth(month, -1))}><ChevronLeft size={18} /></button>
          <label className="period-picker"><CalendarDays size={14} /><span>{allTime ? 'All time' : monthLabel(month, true)}</span>{!allTime && <input type="month" aria-label="Choose transaction month" max={currentMonth} value={month} onChange={(event) => selectMonth(event.target.value)} />}</label>
          <button className="icon-button" type="button" aria-label="Next month" disabled={allTime || month >= currentMonth} onClick={() => selectMonth(shiftMonth(month, 1))}><ChevronRight size={18} /></button>
        </div>
        <button type="button" className={`all-time-button ${allTime ? 'active' : ''}`} onClick={() => { setAllTime(!allTime); setPage(1) }}>{allTime ? 'Monthly' : 'All time'}</button>
      </div>

      {summary.error ? <ErrorState error={summary.error} onRetry={onRetry} /> : <SummaryCards summary={summary.data} loading={summary.loading} compact />}
      <p className="mb-6 mt-2 text-[10px] text-stone-400">Totals for {allTime ? 'all time' : monthLabel(month)} · before list filters</p>

      <div className="segmented mb-3" aria-label="Transaction type">
        {[['', 'All'], ['income', 'Income'], ['expense', 'Expenses']].map(([value, label]) => <button key={value} type="button" aria-pressed={type === value} className={type === value ? 'active' : ''} onClick={() => { setType(value); setCategoryId(''); setPage(1) }}>{label}</button>)}
      </div>

      <label className="mb-3 block"><span className="sr-only">Filter by wallet</span><select className="filter-select" value={walletId} onChange={(event) => { setWalletId(event.target.value); setPage(1) }}><option value="">All wallets</option>{wallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}</select></label>
      <div className="relative mb-6">
        <select className="filter-select" aria-label="Filter by category" value={selectedCategory} onChange={(event) => { setCategoryId(event.target.value); setPage(1) }}>
          <option value="">All categories</option>
          {categoryOptions.map((category) => <option key={category.id} value={category.id}>{category.name}{!type ? ` · ${category.transaction_type}` : ''}</option>)}
        </select>
        <ChevronDown size={15} className="pointer-events-none absolute right-3 top-3 text-stone-400" />
      </div>

      {resource.error ? <ErrorState error={resource.error} onRetry={onRetry} /> : resource.loading ? (
        <div className="space-y-5" aria-label="Loading transactions" aria-busy="true">{[1, 2, 3, 4].map((item) => <div className="flex items-center gap-3" key={item}><div className="skeleton size-11 rounded-2xl" /><div className="flex-1 space-y-2"><div className="skeleton h-3 w-3/5" /><div className="skeleton h-2.5 w-1/3" /></div></div>)}</div>
      ) : transactions.length ? (
        <div className="transaction-list">
          {transactions.map((transaction, index) => {
            const category = categories.find((item) => item.id === transaction.category_id)
            const income = transaction.transaction_type === 'income'
            const Icon = income ? ArrowDownLeft : ArrowUpRight
            return (
              <Fragment key={transaction.id}>
                {(index === 0 || transactions[index - 1].date !== transaction.date) && <h2 className="transaction-date">{dateLabel(transaction.date)}</h2>}
                <button type="button" className="transaction-row" style={{ '--row-index': index }} onClick={() => onEdit(transaction, () => setPage(1))}>
                  <span className={`transaction-icon ${income ? 'bg-teal-50 text-teal-700' : 'bg-orange-50 text-orange-700'}`}><Icon size={20} /></span>
                  <span className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-medium text-stone-800">{transaction.description || category?.name || (income ? 'Income' : 'Expense')}</span><span className="mt-1 block truncate text-xs text-stone-400">{transaction.category_id ? category?.name || (categoriesLoading ? 'Loading category…' : 'Category unavailable') : 'Uncategorized'} · {wallets.find((wallet) => wallet.id === transaction.wallet_id)?.name || 'Wallet'}</span></span>
                  <span className={`shrink-0 text-right text-[13px] font-semibold tabular-nums ${income ? 'text-teal-700' : 'text-stone-800'}`}>{income ? '+' : '−'}{money(transaction.amount)}</span>
                  <ChevronRight size={14} className="shrink-0 text-stone-300" />
                </button>
              </Fragment>
            )
          })}
        </div>
      ) : (
        <div className="empty-state rounded-2xl border border-dashed border-stone-200 bg-white/50 px-5 py-10"><ReceiptText size={30} className="mb-4 text-stone-300" /><h2>No transactions here yet</h2><p>{type || selectedCategory ? 'Try another filter or record a new transaction.' : 'Record an income or expense using the buttons below.'}</p></div>
      )}

      {pagination?.total_count > 0 && (
        <div className="pagination">
          <p className="text-xs text-stone-400">{transactions.length ? `${(page - 1) * 10 + 1} to ${Math.min(page * 10, pagination.total_count)}` : '0'} of {pagination.total_count}</p>
          <div className="flex items-center gap-2">
            <button type="button" className="page-button" disabled={page <= 1 || resource.loading} aria-label="Previous page" onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></button>
            <span className="text-xs text-stone-500">{page} / {Math.max(1, pagination.total_pages)}</span>
            <button type="button" className="page-button" disabled={page >= pagination.total_pages || resource.loading} aria-label="Next page" onClick={() => setPage(page + 1)}><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </section>
  )
}
