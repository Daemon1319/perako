import { money } from '../lib/format'

export default function CategoryBreakdown({ summary, loading, month }) {
  const categories = [...(summary?.expense_categories || [])].sort((first, second) => Number(second.amount) - Number(first.amount))
  const total = Number(summary?.expenses || 0)
  return <section className="category-breakdown home-section" aria-busy={loading} aria-label="Monthly expense categories">
    <div className="mb-4"><h2 className="text-sm font-semibold">Spending by category</h2><p className="mt-1 text-xs text-stone-500">{month} · Expenses by category</p></div>
    {loading ? <div className="space-y-4" aria-label="Loading category breakdown">{[1, 2, 3].map((item) => <div key={item} className="skeleton h-9" />)}</div> : categories.length ? <>
      <ul className="space-y-4">{categories.map((category) => {
        const percentage = total > 0 ? Math.min(100, Number(category.amount) / total * 100) : 0
        return <li key={category.category_id ?? 'uncategorized'}>
          <div className="mb-2 flex items-start justify-between gap-3"><span className="min-w-0 break-words text-sm">{category.name}</span><span className="shrink-0 text-right"><span className="block text-sm font-semibold tabular-nums">{money(category.amount)}</span><span className="mt-0.5 block text-[11px] tabular-nums text-stone-400">{percentage.toFixed(1)}%</span></span></div>
          <div className="category-track" aria-hidden="true"><div style={{ width: `${percentage}%` }} /></div>
        </li>
      })}</ul>
      <p className="mt-5 text-[11px] leading-5 text-stone-400">Includes transfer fees. Expenses without a category appear as Uncategorized.</p>
    </> : <p className="py-3 text-sm leading-6 text-stone-500">No expenses this month. Your category breakdown will appear here after you add one.</p>}
  </section>
}
