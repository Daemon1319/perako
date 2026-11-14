import { useEffect, useState } from 'react'

export function useUnsavedChanges(dirty) {
  const [pending, setPending] = useState(null)
  useEffect(() => {
    if (!dirty) return
    function beforeUnload(event) { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [dirty])
  return {
    open: Boolean(pending),
    request(action) { if (dirty) setPending(() => action); else action() },
    cancel() { setPending(null) },
    discard() { const action = pending; setPending(null); action?.() },
  }
}
