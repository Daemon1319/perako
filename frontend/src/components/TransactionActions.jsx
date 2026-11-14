import { useEffect, useRef, useState } from 'react'
import { Ellipsis, Trash2 } from 'lucide-react'

export default function TransactionActions({ onDelete, disabled }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const trigger = useRef(null)
  useEffect(() => {
    if (!open) return
    function outside(event) { if (!ref.current.contains(event.target)) setOpen(false) }
    function escape(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        setOpen(false)
        trigger.current.focus()
      }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape, true)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape, true)
    }
  }, [open])
  return <div className="relative" ref={ref}>
    <button ref={trigger} type="button" className="icon-button" aria-label="Transaction actions" aria-expanded={open} disabled={disabled} onClick={() => setOpen(!open)}><Ellipsis size={21} /></button>
    {open && <div className="account-menu"><button type="button" className="text-rose-600" onClick={() => { trigger.current.focus(); setOpen(false); onDelete() }}><Trash2 size={17} /> Delete transaction</button></div>}
  </div>
}
