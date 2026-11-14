import { useId, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, ChevronDown } from 'lucide-react'
import { api } from '../lib/api'
import { money, today } from '../lib/format'
import Sheet from './Sheet'
import BalancePreview from './BalancePreview'
import { transactionPreview } from '../lib/balancePreview'
import DiscardChangesDialog from './DiscardChangesDialog'
import { useUnsavedChanges } from '../hooks/useUnsavedChanges'
import ConfirmDeleteDialog from './ConfirmDeleteDialog'
import TransactionActions from './TransactionActions'
import { ErrorNotice, Spinner } from './Feedback'

export default function TransactionSheet({ wallets, walletsLoading, walletsError, type, transaction, categories, categoriesLoading, categoriesError, onClose, onRequestClose, closing, onSaved }) {
  const editing = Boolean(transaction)
  const income = type === 'income'
  const [initialFields] = useState(() => ({
    amount: transaction?.amount || '',
    wallet_id: transaction?.wallet_id ? String(transaction.wallet_id) : wallets.length === 1 ? String(wallets[0].id) : '',
    date: transaction?.date || today(),
    category_id: transaction?.category_id ? String(transaction.category_id) : '',
    description: transaction?.description || '',
  }))
  const [fields, setFields] = useState(initialFields)
  const formId = useId()
  const guard = useUnsavedChanges(Object.keys(fields).some((key) => String(fields[key]) !== String(initialFields[key])))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const options = categories.filter((category) => category.transaction_type === type)
  const Icon = income ? ArrowDownLeft : ArrowUpRight
  const balanceChanges = walletsLoading || walletsError ? [] : transactionPreview(wallets, fields, type, transaction)

  function change(event) {
    setFields({ ...fields, [event.target.name]: event.target.value })
  }

  async function save(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api(editing ? `/transactions/${transaction.id}` : '/transactions', {
        method: editing ? 'PATCH' : 'POST',
        body: {
          transaction: {
            ...fields,
            transaction_type: type,
            category_id: fields.category_id ? Number(fields.category_id) : null,
            description: fields.description.trim() || null,
          },
        },
      })
      onSaved(editing ? 'Transaction updated' : `${income ? 'Income' : 'Expense'} added`)
    } catch (error) {
      setError(error.message)
      setBusy(false)
    }
  }

  async function remove() {
    setBusy(true)
    setError('')
    try {
      await api(`/transactions/${transaction.id}`, { method: 'DELETE' })
      setConfirmDelete(false)
      onSaved('Transaction deleted')
    } catch (error) {
      setError(error.message)
      setBusy(false)
    }
  }

  return (
    <Sheet footer={<div className="flex gap-3"><button type="button" className="btn-secondary flex-1" disabled={busy} onClick={() => guard.request(onRequestClose)}>Cancel</button><button className="btn-primary flex-[2]" form={formId} type="submit" disabled={busy || walletsLoading || Boolean(walletsError) || !wallets.length}>{busy ? <Spinner /> : editing ? 'Save changes' : `Save ${type}`}</button></div>} title={`${editing ? 'Edit' : 'Add'} ${type}`} subtitle={income ? 'A little more coming your way.' : 'Keep the little things accounted for.'} onClose={onClose} onRequestClose={() => guard.request(onRequestClose)} closing={closing} busy={busy} actions={editing ? <TransactionActions disabled={busy} onDelete={() => { setError(''); setConfirmDelete(true) }} /> : null}>
      <form id={formId} onSubmit={save}>
        <fieldset disabled={busy}>
          <ErrorNotice>{error}</ErrorNotice>
          <div className="amount-entry">
            <span className={`type-pill ${income ? 'bg-teal-50 text-teal-700' : 'bg-orange-50 text-orange-700'}`}><Icon size={14} />{income ? 'Income' : 'Expense'}</span>
            <label className="mt-5 block text-xs font-medium text-stone-500" htmlFor="transaction-amount">Amount in Philippine pesos</label>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-medium text-stone-300" aria-hidden="true">₱</span>
              <input id="transaction-amount" className="amount-input" name="amount" type="number" inputMode="decimal" min="0.01" max="9999999999.99" step="0.01" placeholder="0.00" required autoFocus value={fields.amount} onChange={change} />
            </div>
          </div>

          <div className="space-y-5 pb-3">
            <label className="field-label">Wallet
              <select className="field mt-2" name="wallet_id" required value={fields.wallet_id} onChange={change} disabled={walletsLoading || Boolean(walletsError)}>
                <option value="">Choose a wallet</option>
                {wallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name} · {money(wallet.balance)}</option>)}
              </select>
              {walletsLoading && <span className="mt-2 block text-xs text-stone-500">Loading wallets…</span>}
              {walletsError && <span className="mt-2 block text-xs text-rose-600">{walletsError}</span>}
              {!walletsLoading && !walletsError && !wallets.length && <span className="mt-2 block text-xs text-stone-500">Create a wallet from the menu first.</span>}
            </label>
            <BalancePreview changes={balanceChanges} />
            <label className="field-label">Date<input className="field mt-2" name="date" type="date" max={today()} required value={fields.date} onChange={change} /></label>
            <label className="field-label">Category <span className="font-normal text-stone-400">· optional</span>
              <div className="relative mt-2">
                <select className="field appearance-none pr-10" name="category_id" value={fields.category_id} onChange={change} disabled={categoriesLoading || Boolean(categoriesError)}>
                  <option value="">No category</option>
                  {options.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-4 top-4 text-stone-400" />
              </div>
              {categoriesLoading && <span className="mt-1.5 block text-xs font-normal text-stone-400">Loading your categories…</span>}
              {categoriesError && <span className="mt-1.5 block text-xs font-normal text-amber-700">Categories are unavailable. Try again after reopening this panel.</span>}
            </label>
            <label className="field-label">Description <span className="font-normal text-stone-400">· optional</span><textarea className="field mt-2 min-h-24 resize-y" name="description" placeholder={income ? 'Where did it come from?' : 'What was it for?'} rows={3} value={fields.description} onChange={change} /></label>
          </div>


        </fieldset>
      </form>
      {confirmDelete && <ConfirmDeleteDialog title={`Delete this ${type}?`} error={error} busy={busy} onCancel={() => { setConfirmDelete(false); setError('') }} onConfirm={remove}>
        <p className="font-semibold text-stone-800">{money(transaction.amount)}{transaction.description ? ` · ${transaction.description}` : ''}</p>
        <p>This permanently removes the transaction and updates its wallet balance.</p>
      </ConfirmDeleteDialog>}
      <DiscardChangesDialog guard={guard} />
    </Sheet>
  )
}
