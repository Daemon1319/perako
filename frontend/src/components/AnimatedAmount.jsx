import { useLayoutEffect, useRef } from 'react'
import { money } from '../lib/format'

export default function AnimatedAmount({ value = 0 }) {
  const target = Number(value || 0)
  const element = useRef(null)
  const displayed = useRef(0)

  useLayoutEffect(() => {
    const node = element.current
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const from = displayed.current
    let frame = 0
    let startedAt = null

    function finish() {
      cancelAnimationFrame(frame)
      displayed.current = target
      node.textContent = money(target)
    }

    function animate(timestamp) {
      startedAt ??= timestamp
      const progress = Math.min((timestamp - startedAt) / 580, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      displayed.current = from + (target - from) * eased
      node.textContent = money(displayed.current)
      if (progress < 1) frame = requestAnimationFrame(animate)
      else finish()
    }

    function preferenceChanged(event) {
      if (event.matches) finish()
    }

    if (preference.matches || from === target) finish()
    else {
      node.textContent = money(from)
      frame = requestAnimationFrame(animate)
    }

    preference.addEventListener('change', preferenceChanged)
    return () => {
      cancelAnimationFrame(frame)
      preference.removeEventListener('change', preferenceChanged)
    }
  }, [target])

  return (
    <span>
      <span className="sr-only">{money(target)}</span>
      <span ref={element} aria-hidden="true">{money(target)}</span>
    </span>
  )
}
