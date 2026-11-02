import { useState } from 'react'
import { useResource } from '../hooks/useResource'
import { money, monthRange } from '../lib/format'
import { ErrorState } from './Feedback'

export default function TransfersList({ month, allTime, walletId, revision, wallets, onOpen, onRetry }) {
  const [page, setPage] = useState(1)
  const params = new URLSearchParams({ page })
  if (!allTime) Object.entries(monthRange(month)).forEach(([key, value]) => params.set(key, value))
  if (walletId) params.set('wallet_id', walletId)
  const resource = useResource(`/transfers?${params}`, revision)
  if (resource.error) return <ErrorState error={resource.error} onRetry={onRetry} />
  if (resource.loading) return <div className="skeleton h-24 rounded-2xl" aria-label="Loading transfers" />
  const transfers = resource.data?.transfers || []
  const walletName = (id) => wallets.find((wallet) => wallet.id === id)?.name || 'Wallet'
  return <div>
    <p className="mb-4 text-xs leading-5 text-stone-500">Transfers do not count as income or expenses. Their fees count as expenses.</p>
    {transfers.length ? transfers.map((transfer) => <button className="transaction-row" type="button" key={transfer.id} onClick={() => onOpen(transfer)}><span className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-medium">{walletName(transfer.source_wallet_id)} → {walletName(transfer.destination_wallet_id)}</span><span className="mt-1 block text-xs text-stone-500">{transfer.date} · Fee {money(transfer.fee)}</span></span><span className="text-sm font-semibold">{money(transfer.amount)}</span></button>) : <p className="py-8 text-center text-sm text-stone-500">No transfers for this period.</p>}
    {resource.data?.pagination.total_pages > 1 && <div className="mt-5 flex items-center justify-between"><button type="button" className="btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span className="text-xs">{page} / {resource.data.pagination.total_pages}</span><button type="button" className="btn-secondary" disabled={page >= resource.data.pagination.total_pages} onClick={() => setPage(page + 1)}>Next</button></div>}
  </div>
}
