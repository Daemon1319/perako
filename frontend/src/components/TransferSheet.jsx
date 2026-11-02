import { useState } from 'react'
import { api } from '../lib/api'
import { money, today } from '../lib/format'
import Sheet from './Sheet'
import { ErrorNotice, Spinner } from './Feedback'

export default function TransferSheet({ transfer, wallets, loading, loadError, closing, onClose, onRequestClose, onSaved }) {
  const [fields, setFields] = useState({ source_wallet_id: '', destination_wallet_id: '', amount: '', fee: '', date: today(), description: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(false)
  const source = wallets.find((wallet) => String(wallet.id) === String(transfer?.source_wallet_id || fields.source_wallet_id))
  const destination = wallets.find((wallet) => String(wallet.id) === String(transfer?.destination_wallet_id || fields.destination_wallet_id))
  function change(event) {
    const { name, value } = event.target
    setFields((previous) => ({ ...previous, [name]: value, ...(name === 'source_wallet_id' && previous.destination_wallet_id === value ? { destination_wallet_id: '' } : {}) }))
  }
  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api(transfer ? `/transfers/${transfer.id}` : '/transfers', transfer ? { method: 'DELETE' } : { method: 'POST', body: { transfer: { ...fields, fee: fields.fee || '0', description: fields.description.trim() || null } } })
      onSaved(transfer ? 'Transfer reversed and fee removed' : 'Transfer recorded')
    } catch (error) { setError(error.message); setBusy(false) }
  }
  return <Sheet title={transfer ? 'Transfer details' : 'Transfer money'} subtitle="Move money between your wallets." closing={closing} onClose={onClose} onRequestClose={onRequestClose} busy={busy}>
    <form onSubmit={submit} className="space-y-4">
      <ErrorNotice>{error || loadError}</ErrorNotice>
      {transfer ? <>
        <p className="text-lg font-semibold">{source?.name || 'Source wallet'} → {destination?.name || 'Destination wallet'}</p>
        <p className="text-2xl font-semibold">{money(transfer.amount)}</p>
        <p className="text-sm text-stone-500">Fee: {money(transfer.fee)} · {transfer.date}</p>
        {transfer.description && <p className="break-words text-sm">{transfer.description}</p>}
        <p className="text-sm leading-6 text-stone-500">Corrections use delete and recreate. Deleting returns the amount and fee to the source wallet and removes the linked fee expense.</p>
        {confirm ? <div className="space-y-3 rounded-2xl bg-rose-50 p-4"><p className="text-sm">Reverse this transfer? The receiving wallet must still have enough funds.</p><button type="submit" className="btn-danger w-full" disabled={busy}>{busy ? <Spinner /> : 'Delete and reverse transfer'}</button><button type="button" className="btn-secondary w-full" disabled={busy} onClick={() => setConfirm(false)}>Keep transfer</button></div> : <button type="button" className="btn-danger w-full" onClick={() => setConfirm(true)}>Delete transfer</button>}
      </> : <fieldset disabled={busy || loading || Boolean(loadError)} className="space-y-4">
        {wallets.length < 2 && <p className="text-sm text-stone-500">Create at least two wallets using Manage wallets first.</p>}
        <label className="field-label">From<select className="field mt-2" name="source_wallet_id" required value={fields.source_wallet_id} onChange={change}><option value="">Choose source wallet</option>{wallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name} · {money(wallet.balance)}</option>)}</select></label>
        <label className="field-label">To<select className="field mt-2" name="destination_wallet_id" required value={fields.destination_wallet_id} onChange={change}><option value="">Choose destination wallet</option>{wallets.filter((wallet) => String(wallet.id) !== fields.source_wallet_id).map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name} · {money(wallet.balance)}</option>)}</select></label>
        <label className="field-label">Amount<input className="field mt-2" type="number" inputMode="decimal" name="amount" min="0.01" max="9999999999.99" step="0.01" required value={fields.amount} onChange={change} /></label>
        <label className="field-label">Transfer fee (optional)<input className="field mt-2" type="number" inputMode="decimal" name="fee" min="0" max="9999999999.99" step="0.01" placeholder="0.00" value={fields.fee} onChange={change} /></label>
        <p className="text-xs leading-5 text-stone-500">The fee is recorded as an expense. Only the transferred amount reaches the destination.</p>
        <label className="field-label">Date<input className="field mt-2" type="date" name="date" max={today()} required value={fields.date} onChange={change} /></label>
        <label className="field-label">Description (optional)<textarea className="field mt-2" name="description" value={fields.description} onChange={change} /></label>
        <button type="submit" className="btn-primary w-full" disabled={wallets.length < 2}>{busy ? <Spinner /> : 'Save transfer'}</button>
      </fieldset>}
    </form>
  </Sheet>
}
