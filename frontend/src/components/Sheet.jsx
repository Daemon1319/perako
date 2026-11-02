import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

export default function Sheet({ title, subtitle, children, onClose, onRequestClose, closing = false, busy = false }) {
  const ref = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    const previousOverflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    const dialog = ref.current
    const viewport = window.visualViewport
    if (!viewport) return
    let frame
    function update() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        // Preserve normal pinch zoom. At normal scale, fit above the keyboard.
        if (Math.abs(viewport.scale - 1) > 0.05) return
        dialog.style.setProperty('--sheet-height', `${viewport.height * 0.9}px`)
        dialog.style.setProperty('--sheet-bottom', `${Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)}px`)
        const focused = document.activeElement
        const body = dialog.querySelector('.sheet-body')
        if (!body?.contains(focused) || !focused.matches('input, select, textarea')) return
        const fieldRect = focused.getBoundingClientRect()
        const bodyRect = body.getBoundingClientRect()
        if (fieldRect.bottom > bodyRect.bottom - 24) {
          body.scrollTop += fieldRect.bottom - bodyRect.bottom + 24
        } else if (fieldRect.top < bodyRect.top + 24) {
          body.scrollTop -= bodyRect.top + 24 - fieldRect.top
        }
      })
    }
    update()
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    dialog.addEventListener('focusin', update)
    return () => {
      cancelAnimationFrame(frame)
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
      dialog.removeEventListener('focusin', update)
    }
  }, [])

  useEffect(() => {
    if (!closing) return
    // Fallback if the browser does not emit an animation event.
    const timer = setTimeout(onClose, 260)
    return () => clearTimeout(timer)
  }, [closing, onClose])

  function requestClose() {
    if (!busy && !closing) onRequestClose()
  }

  return (
    <dialog
      ref={ref}
      className={`sheet${closing ? ' is-closing' : ''}`}
      aria-labelledby={titleId}
      inert={closing}
      onAnimationEnd={(event) => {
        if (closing && event.target === event.currentTarget) onClose()
      }}
      onCancel={(event) => {
        event.preventDefault()
        requestClose()
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget || busy || closing) return
        const rect = event.currentTarget.getBoundingClientRect()
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) requestClose()
      }}
    >
      <div className="sheet-handle" aria-hidden="true" />
      <header className="flex items-start justify-between gap-4 px-6 pb-5 pt-2">
        <div>
          <h2 id={titleId} className="text-xl font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
        </div>
        <button type="button" className="icon-button -mr-2" onClick={requestClose} disabled={busy || closing} aria-label="Close panel">
          <X size={21} />
        </button>
      </header>
      <div className="sheet-body">{children}</div>
    </dialog>
  )
}
