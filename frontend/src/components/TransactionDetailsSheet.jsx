import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Pencil } from 'lucide-react'
import { api } from '../lib/api'
import { dateLabel, money } from '../lib/format'
import Sheet from './Sheet'
import TransactionActions from './TransactionActions'
import ConfirmDeleteDialog from './ConfirmDeleteDialog'

export default function TransactionDetailsSheet({ transaction, wallets, categories, walletsLoading, categoriesLoading, closing, onClose, onRequestClose, onEdit, onSaved }) {
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const income = transaction.transaction_type === 'income'
  const Icon = income ? ArrowDownLeft : ArrowUpRight
  const wallet = wallets.find((item) => item.id === transaction.wallet_id)
  const category = categories.find((item) => item.id === transaction.category_id)
  async function remove() {
    setBusy(true)
    setError('')
    try {
      await api(`/transactions/${transaction.id}`, { method: 'DELETE' })
      setConfirm(false)
      onSaved('Transaction deleted')
    } catch (error) { setError(error.message); setBusy(false) }
  }
  return <Sheet title="Transaction details" onClose={onClose} onRequestClose={onRequestClose} closing={closing} busy={busy}
    actions={<TransactionActions disabled={busy} onDelete={() => { setError(''); setConfirm(true) }} />}
    footer={<button type="button" className="btn-primary w-full" disabled={busy} onClick={onEdit}><Pencil size={17} /> Edit transaction</button>}>
    <div className="transaction-detail-amount">
      <span className={`type-pill ${income ? 'bg-teal-50 text-teal-700' : 'bg-orange-50 text-orange-700'}`}><Icon size={14} />{income ? 'Income' : 'Expense'}</span>
      <p className={`mt-4 break-words text-3xl font-semibold tracking-tight tabular-nums ${income ? 'text-teal-700' : 'text-stone-800'}`}>{income ? '+' : '−'}{money(transaction.amount)}</p>
    </div>
    <dl className="transaction-details">
      <div><dt>Date</dt><dd>{dateLabel(transaction.date)}</dd></div>
      <div><dt>Wallet</dt><dd>{wallet?.name || (walletsLoading ? 'Loading…' : 'Wallet unavailable')}</dd></div>
      <div><dt>Category</dt><dd>{transaction.category_id ? category?.name || (categoriesLoading ? 'Loading…' : 'Category unavailable') : 'Uncategorized'}</dd></div>
      <div className="description"><dt>Description</dt><dd>{transaction.description || 'No description'}</dd></div>
    </dl>
    {confirm && <ConfirmDeleteDialog title={`Delete this ${transaction.transaction_type}?`} busy={busy} error={error} onCancel={() => { setConfirm(false); setError('') }} onConfirm={remove}>
      <p className="font-semibold text-stone-800">{money(transaction.amount)}{transaction.description ? ` · ${transaction.description}` : ''}</p>
      <p>This permanently removes the transaction and updates its wallet balance.</p>
    </ConfirmDeleteDialog>}
  </Sheet>
}
