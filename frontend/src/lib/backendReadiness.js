// No polling while idle: only a real API request starts a wake-up check.
export function createBackendReadiness(baseUrl) {
  const idleMs = 30_000
  const wakeTimeoutMs = 60_000
  let lastActive = 0
  let pending = null

  async function probeUntilReady() {
    const deadline = Date.now() + wakeTimeoutMs
    while (Date.now() < deadline) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), Math.min(10_000, deadline - Date.now()))
      try {
        const response = await fetch(`${baseUrl}/up`, {
          signal: controller.signal,
          cache: 'no-store',
          credentials: 'omit',
        })
        await response.body?.cancel()
        if (response.ok) {
          lastActive = Date.now()
          return
        }
        if (![502, 503, 504].includes(response.status)) {
          throw new Error(`Health check failed (${response.status})`)
        }
      } catch (error) {
        if (error.message?.startsWith('Health check failed')) throw error
        // Network failures can include a gateway response hidden by CORS.
      } finally {
        clearTimeout(timeout)
      }
      const remaining = deadline - Date.now()
      if (remaining <= 0) break
      await new Promise((resolve) => setTimeout(resolve, Math.min(1500, remaining)))
    }
    throw new Error('Backend readiness timed out')
  }

  return {
    markActive() { lastActive = Date.now() },
    invalidate() { lastActive = 0 },
    async wait(signal) {
      signal?.throwIfAborted()
      if (lastActive && Date.now() - lastActive < idleMs) return
      if (!pending) {
        pending = probeUntilReady().finally(() => { pending = null })
      }
      // One cancelled screen must not abort the shared check for other requests.
      if (!signal) return pending
      await new Promise((resolve, reject) => {
        const abort = () => reject(signal.reason)
        signal.addEventListener('abort', abort, { once: true })
        pending.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort))
      })
    },
  }
}
