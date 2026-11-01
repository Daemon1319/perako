import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, ChevronRight, FolderOpen, Plus, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import Sheet from './Sheet'
import { ErrorNotice, ErrorState, Spinner } from './Feedback'

export default function CategoriesSheet({ categories, loading, error: loadError, onClose, onRequestClose, closing, onChanged, onRetry }) {
  const [type, setType] = useState('expense')
  const [editor, setEditor] = useState(null)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const options = categories.filter((category) => category.transaction_type === type)

  function openEditor(category = null) {
    setEditor(category || { id: null })
    setName(category?.name || '')
    setConfirmDelete(false)
    setError('')
  }

  function selectType(next) {
    setType(next)
    setEditor(null)
    setError('')
    setConfirmDelete(false)
  }

  async function save(event) {
    event.preventDefault()
    if (!name.trim()) { setError('Give your category a name.'); return }
    setBusy(true)
    setError('')
    try {
      await api(editor.id ? `/categories/${editor.id}` : '/categories', {
        method: editor.id ? 'PATCH' : 'POST',
        body: { category: { name: name.trim(), ...(editor.id ? {} : { transaction_type: type }) } },
      })
      onChanged(editor.id ? 'Category renamed' : 'Category added')
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
      await api(`/categories/${editor.id}`, { method: 'DELETE' })
      onChanged('Category deleted. Your transactions are kept.')
      setEditor(null)
      setConfirmDelete(false)
    } catch (error) {
      setError(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet title="Your categories" subtitle="A place for every kind of money." onClose={onClose} onRequestClose={onRequestClose} closing={closing} busy={busy}>
      <div className="segmented mb-5" aria-label="Category type">
        <button type="button" disabled={busy} onClick={() => selectType('expense')} aria-pressed={type === 'expense'} className={type === 'expense' ? 'active' : ''}><ArrowUpRight size={15} /> Expenses</button>
        <button type="button" disabled={busy} onClick={() => selectType('income')} aria-pressed={type === 'income'} className={type === 'income' ? 'active' : ''}><ArrowDownLeft size={15} /> Income</button>
      </div>

      {editor ? (
        <form onSubmit={save} className="space-y-4">
          <p className="eyebrow">{editor.id ? 'EDIT' : 'NEW'} {type.toUpperCase()} CATEGORY</p>
          <ErrorNotice>{error}</ErrorNotice>
          <label className="field-label">Category name<input className="field mt-2" required autoFocus placeholder={type === 'expense' ? 'e.g. Food & drinks' : 'e.g. Salary'} value={name} onChange={(event) => setName(event.target.value)} disabled={busy} /></label>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" type="button" disabled={busy} onClick={() => { setEditor(null); setError('') }}>Cancel</button>
            <button className="btn-primary flex-1" type="submit" disabled={busy}>{busy ? <Spinner /> : 'Save category'}</button>
          </div>
          {editor.id && !confirmDelete && <button type="button" className="mx-auto flex items-center gap-2 py-3 text-sm text-rose-600" disabled={busy} onClick={() => setConfirmDelete(true)}><Trash2 size={15} /> Delete category</button>}
          {confirmDelete && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
              <p className="text-sm font-medium text-rose-900">Delete “{editor.name}”?</p>
              <p className="mt-1 text-xs leading-5 text-rose-800/75">Your transactions will stay. They’ll appear as Uncategorized.</p>
              <div className="mt-3 flex gap-3">
                <button className="btn-danger flex-1" type="button" disabled={busy} onClick={remove}>Delete category</button>
                <button className="btn-secondary flex-1" type="button" disabled={busy} onClick={() => setConfirmDelete(false)}>Keep it</button>
              </div>
            </div>
          )}
        </form>
      ) : (
        <>
          {loadError ? <ErrorState error={loadError} onRetry={onRetry} /> : loading ? (
            <div className="space-y-3" aria-label="Loading categories">{[1, 2, 3].map((item) => <div className="skeleton h-14 w-full" key={item} />)}</div>
          ) : options.length ? (
            <div className="category-list">
              {options.map((category) => <button key={category.id} type="button" onClick={() => openEditor(category)}><span className={`category-dot ${type === 'income' ? 'bg-teal-50 text-teal-700' : 'bg-orange-50 text-orange-700'}`}><FolderOpen size={17} /></span><span className="min-w-0 flex-1 truncate text-left text-sm font-medium">{category.name}</span><ChevronRight size={17} className="text-stone-400" /></button>)}
            </div>
          ) : (
            <div className="empty-state py-9"><FolderOpen size={27} className="mb-3 text-stone-300" /><h3>No {type} categories yet</h3><p>Create a category to make your transactions easier to find.</p></div>
          )}
          <button type="button" className="btn-primary mt-5 w-full" onClick={() => openEditor()}><Plus size={18} /> Add category</button>
          <p className="mt-4 text-center text-xs text-stone-400">Tap a category to rename or delete it.</p>
        </>
      )}
    </Sheet>
  )
}
