import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Trash2 } from 'lucide-react'
import { ErrorNotice, Spinner } from './Feedback'

export default function ConfirmDeleteDialog({ title, children, error, busy, onCancel, onConfirm, confirmLabel = 'Delete', cancelLabel = 'Cancel' }) {
  const ref = useRef(null)
  const cancelRef = useRef(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = ref.current
    const previousFocus = document.activeElement
    dialog.showModal()
    cancelRef.current.focus()
    return () => {
      dialog.close()
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
    }
  }, [])

  return createPortal(
    <dialog ref={ref} className="confirm-dialog" role="alertdialog" aria-labelledby={titleId} aria-describedby={descriptionId} aria-busy={busy}
      onCancel={(event) => { event.preventDefault(); event.stopPropagation(); if (!busy) onCancel() }}
      onClick={(event) => event.stopPropagation()}>
      <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-rose-50 text-rose-600"><Trash2 size={21} /></div>
      <h2 id={titleId} className="break-words text-xl font-semibold tracking-tight">{title}</h2>
      <div id={descriptionId} className="mb-5 mt-3 space-y-2 break-words text-sm leading-6 text-stone-500">{children}</div>
      <ErrorNotice>{error}</ErrorNotice>
      <div className="flex gap-3">
        <button ref={cancelRef} type="button" className="btn-secondary min-w-0 flex-1" disabled={busy} onClick={onCancel}>{cancelLabel}</button>
        <button type="button" className="btn-danger min-w-0 flex-1" disabled={busy} onClick={onConfirm}>{busy ? <><Spinner /><span>Deleting…</span></> : confirmLabel}</button>
      </div>
    </dialog>, document.body,
  )
}
