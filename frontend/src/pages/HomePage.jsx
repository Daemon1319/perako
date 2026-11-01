import { CalendarDays } from 'lucide-react'
import { useResource } from '../hooks/useResource'
import { monthLabel, today } from '../lib/format'
import SummaryCards from '../components/SummaryCards'
import { ErrorState } from '../components/Feedback'

export default function HomePage({ revision, onRetry }) {
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

    </section>
  )
}
