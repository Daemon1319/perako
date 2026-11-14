import { useId, useState } from 'react'
import { ChevronRight, FolderOpen, Plus, Trash2 } from 'lucide-react'
import { money } from '../lib/format'
import { api } from '../lib/api'
import Sheet from './Sheet'
import DiscardChangesDialog from './DiscardChangesDialog'
import { useUnsavedChanges } from '../hooks/useUnsavedChanges'
import ConfirmDeleteDialog from './ConfirmDeleteDialog'
import { ErrorNotice, ErrorState, Spinner } from './Feedback'

export default function WalletsSheet({ wallets, loading, error: loadError, onClose, onRequestClose, closing, onChanged, onRetry }) {
  const [editor, setEditor] = useState(null)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const formId = useId()
  const guard = useUnsavedChanges(Boolean(editor) && name !== (editor?.name || ''))
  const options = wallets

  function openEditor(wallet = null) {
    setEditor(wallet || { id: null })
    setName(wallet?.name || '')
    setConfirmDelete(false)
    setError('')
  }

  async function save(event) {
    event.preventDefault()
    if (!name.trim()) { setError('Give your wallet a name.'); return }
    setBusy(true)
    setError('')
    try {
      await api(editor.id ? `/wallets/${editor.id}` : '/wallets', {
        method: editor.id ? 'PATCH' : 'POST',
        body: { wallet: { name: name.trim() } },
      })
      onChanged(editor.id ? 'Wallet renamed' : 'Wallet added')
      setEditor(null)
    } catch (error) {
      setError(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    setBusy(true)
    setError('')
    try {
      await api(`/wallets/${editor.id}`, { method: 'DELETE' })
      onChanged('Wallet deleted')
      setEditor(null)
      setConfirmDelete(false)
    } catch (error) {
      setError(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet footer={editor && <div className="flex gap-3"><button className="btn-secondary flex-1" type="button" disabled={busy} onClick={() => guard.request(() => { setEditor(null); setError('') })}>Cancel</button><button className="btn-primary flex-[2]" form={formId} type="submit" disabled={busy}>{busy ? <Spinner /> : 'Save wallet'}</button></div>} title="Your wallets" subtitle="Choose where your money is held." onClose={onClose} onRequestClose={() => guard.request(onRequestClose)} closing={closing} busy={busy}>
      {editor ? (
        <form id={formId} onSubmit={save} className="space-y-4">
          <p className="eyebrow">{editor.id ? 'EDIT' : 'NEW'} WALLET</p>
          <ErrorNotice>{error}</ErrorNotice>
          <label className="field-label">Wallet name<input className="field mt-2" required autoFocus placeholder="e.g. Cash or GCash" maxLength={100} value={name} onChange={(event) => setName(event.target.value)} disabled={busy} /></label>
          {editor.id && <button type="button" className="mx-auto flex items-center gap-2 py-3 text-sm text-rose-600" disabled={busy} onClick={() => { setError(''); setConfirmDelete(true) }}><Trash2 size={15} /> Delete wallet</button>}
        </form>
      ) : (
        <>
          {loadError ? <ErrorState error={loadError} onRetry={onRetry} /> : loading ? (
            <div className="space-y-3" aria-label="Loading wallets">{[1, 2, 3].map((item) => <div className="skeleton h-14 w-full" key={item} />)}</div>
          ) : options.length ? (
            <div className="category-list">
              {options.map((wallet) => <button key={wallet.id} type="button" onClick={() => openEditor(wallet)}><span className={`category-dot bg-teal-50 text-teal-700`}><FolderOpen size={17} /></span><span className="min-w-0 flex-1 truncate text-left text-sm font-medium">{wallet.name}<span className="mt-1 block text-xs text-stone-500">{money(wallet.balance)}</span></span><ChevronRight size={17} className="text-stone-400" /></button>)}
            </div>
          ) : (
            <div className="empty-state py-9"><FolderOpen size={27} className="mb-3 text-stone-300" /><h3>No wallets yet</h3><p>Create a wallet, then add income before recording expenses.</p></div>
          )}
          <button type="button" className="btn-primary mt-5 w-full" onClick={() => openEditor()}><Plus size={18} /> Add wallet</button>
          <p className="mt-4 text-center text-xs text-stone-400">Tap a wallet to rename or delete it.</p>
        </>
      )}
      {confirmDelete && editor && <ConfirmDeleteDialog title={`Delete “${editor.name}”?`} error={error} busy={busy} onCancel={() => { setConfirmDelete(false); setError('') }} onConfirm={remove} confirmLabel="Delete wallet">
        <p>Only wallets without transactions or transfers can be deleted.</p>
      </ConfirmDeleteDialog>}
      <DiscardChangesDialog guard={guard} />
    </Sheet>
  )
}
