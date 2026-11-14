import { useId, useState } from 'react'
import { api } from '../lib/api'
import { money, today } from '../lib/format'
import Sheet from './Sheet'
import BalancePreview from './BalancePreview'
import { transferPreview } from '../lib/balancePreview'
import DiscardChangesDialog from './DiscardChangesDialog'
import { useUnsavedChanges } from '../hooks/useUnsavedChanges'
import ConfirmDeleteDialog from './ConfirmDeleteDialog'
import { ErrorNotice, Spinner } from './Feedback'

export default function TransferSheet({ transfer, wallets, loading, loadError, closing, onClose, onRequestClose, onSaved }) {
  const [initialFields] = useState({ source_wallet_id: '', destination_wallet_id: '', amount: '', fee: '', date: today(), description: '' })
  const [fields, setFields] = useState(initialFields)
  const formId = useId()
  const guard = useUnsavedChanges(!transfer && Object.keys(fields).some((key) => fields[key] !== initialFields[key]))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(false)
  const source = wallets.find((wallet) => String(wallet.id) === String(transfer?.source_wallet_id || fields.source_wallet_id))
  const destination = wallets.find((wallet) => String(wallet.id) === String(transfer?.destination_wallet_id || fields.destination_wallet_id))
  const balanceChanges = loading || loadError ? [] : transferPreview(wallets, fields)
  function change(event) {
    const { name, value } = event.target
    setFields((previous) => ({ ...previous, [name]: value, ...(name === 'source_wallet_id' && previous.destination_wallet_id === value ? { destination_wallet_id: '' } : {}) }))
  }
  async function submit(event) {
    event?.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api(transfer ? `/transfers/${transfer.id}` : '/transfers', transfer ? { method: 'DELETE' } : { method: 'POST', body: { transfer: { ...fields, fee: fields.fee || '0', description: fields.description.trim() || null } } })
      setConfirm(false)
      onSaved(transfer ? 'Transfer reversed and fee removed' : 'Transfer recorded')
    } catch (error) { setError(error.message); setBusy(false) }
  }
  return <Sheet footer={!transfer && <div className="flex gap-3"><button type="button" className="btn-secondary flex-1" disabled={busy} onClick={() => guard.request(onRequestClose)}>Cancel</button><button className="btn-primary flex-[2]" type="submit" form={formId} disabled={busy || loading || Boolean(loadError) || wallets.length < 2}>{busy ? <Spinner /> : 'Save transfer'}</button></div>} title={transfer ? 'Transfer details' : 'Transfer money'} subtitle="Move money between your wallets." closing={closing} onClose={onClose} onRequestClose={() => guard.request(onRequestClose)} busy={busy}>
    <form id={formId} onSubmit={submit} className="space-y-4">
      <ErrorNotice>{error || loadError}</ErrorNotice>
      {transfer ? <>
        <p className="text-lg font-semibold">{source?.name || 'Source wallet'} → {destination?.name || 'Destination wallet'}</p>
        <p className="text-2xl font-semibold">{money(transfer.amount)}</p>
        <p className="text-sm text-stone-500">Fee: {money(transfer.fee)} · {transfer.date}</p>
        {transfer.description && <p className="break-words text-sm">{transfer.description}</p>}
        <p className="text-sm leading-6 text-stone-500">Corrections use delete and recreate. Deleting returns the amount and fee to the source wallet and removes the linked fee expense.</p>
        <button type="button" className="btn-danger w-full" disabled={busy} onClick={() => { setError(''); setConfirm(true) }}>Delete transfer</button>
      </> : <fieldset disabled={busy || loading || Boolean(loadError)} className="space-y-4">
        {wallets.length < 2 && <p className="text-sm text-stone-500">Create at least two wallets using Manage wallets first.</p>}
        <label className="field-label">From<select className="field mt-2" name="source_wallet_id" required value={fields.source_wallet_id} onChange={change}><option value="">Choose source wallet</option>{wallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name} · {money(wallet.balance)}</option>)}</select></label>
        <label className="field-label">To<select className="field mt-2" name="destination_wallet_id" required value={fields.destination_wallet_id} onChange={change}><option value="">Choose destination wallet</option>{wallets.filter((wallet) => String(wallet.id) !== fields.source_wallet_id).map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name} · {money(wallet.balance)}</option>)}</select></label>
        <label className="field-label">Amount<input className="field mt-2" type="number" inputMode="decimal" name="amount" min="0.01" max="9999999999.99" step="0.01" required value={fields.amount} onChange={change} /></label>
        <label className="field-label">Transfer fee (optional)<input className="field mt-2" type="number" inputMode="decimal" name="fee" min="0" max="9999999999.99" step="0.01" placeholder="0.00" value={fields.fee} onChange={change} /></label>
        <p className="text-xs leading-5 text-stone-500">The fee is recorded as an expense. Only the transferred amount reaches the destination.</p>
        <BalancePreview changes={balanceChanges} />
        <label className="field-label">Date<input className="field mt-2" type="date" name="date" max={today()} required value={fields.date} onChange={change} /></label>
        <label className="field-label">Description (optional)<textarea className="field mt-2" name="description" value={fields.description} onChange={change} /></label>

      </fieldset>}
    </form>
    {confirm && transfer && <ConfirmDeleteDialog title="Delete this transfer?" error={error} busy={busy} onCancel={() => { setConfirm(false); setError('') }} onConfirm={() => submit()} confirmLabel="Delete transfer">
      <p className="font-semibold text-stone-800">{source?.name || 'Source wallet'} → {destination?.name || 'Destination wallet'} · {money(transfer.amount)}</p>
      <p>The amount and fee ({money(transfer.fee)}) return to the source wallet. The linked fee expense is removed.</p>
      <p>The receiving wallet must still have enough funds to reverse this transfer.</p>
    </ConfirmDeleteDialog>}
    <DiscardChangesDialog guard={guard} />
  </Sheet>
}
