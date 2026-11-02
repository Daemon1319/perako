import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, ChevronDown, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { money, today } from '../lib/format'
import Sheet from './Sheet'
import { ErrorNotice, Spinner } from './Feedback'

export default function TransactionSheet({ wallets, walletsLoading, walletsError, type, transaction, categories, categoriesLoading, categoriesError, onClose, onRequestClose, closing, onSaved }) {
  const editing = Boolean(transaction)
  const income = type === 'income'
  const [fields, setFields] = useState(() => ({
    amount: transaction?.amount || '',
    wallet_id: transaction?.wallet_id ? String(transaction.wallet_id) : wallets.length === 1 ? String(wallets[0].id) : '',
    date: transaction?.date || today(),
    category_id: transaction?.category_id ? String(transaction.category_id) : '',
    description: transaction?.description || '',
  }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const options = categories.filter((category) => category.transaction_type === type)
  const Icon = income ? ArrowDownLeft : ArrowUpRight

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
      onSaved('Transaction deleted')
    } catch (error) {
      setError(error.message)
      setBusy(false)
    }
  }

  return (
    <Sheet title={`${editing ? 'Edit' : 'Add'} ${type}`} subtitle={income ? 'A little more coming your way.' : 'Keep the little things accounted for.'} onClose={onClose} onRequestClose={onRequestClose} closing={closing} busy={busy}>
      <form onSubmit={save}>
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

          <button className="btn-primary mt-4 w-full" type="submit" disabled={walletsLoading || Boolean(walletsError) || !wallets.length}>{busy ? <Spinner /> : editing ? 'Save changes' : `Save ${type}`}</button>
          {editing && !confirmDelete && <button type="button" className="mx-auto mt-4 flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-600" onClick={() => setConfirmDelete(true)}><Trash2 size={15} /> Delete transaction</button>}
          {confirmDelete && (
            <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 p-4">
              <p className="text-sm font-medium text-rose-900">Delete this transaction?</p>
              <p className="mt-1 text-xs leading-5 text-rose-800/75">This cannot be undone.</p>
              <div className="mt-3 flex gap-3">
                <button className="btn-danger flex-1" type="button" onClick={remove}>Delete</button>
                <button className="btn-secondary flex-1" type="button" onClick={() => setConfirmDelete(false)}>Keep it</button>
              </div>
            </div>
          )}
        </fieldset>
      </form>
    </Sheet>
  )
}
