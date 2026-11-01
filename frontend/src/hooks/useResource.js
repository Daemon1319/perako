import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export function useResource(path, revision = 0) {
  const key = `${revision}:${path}`
  const [result, setResult] = useState({ key: null, data: null, error: null })

  useEffect(() => {
    if (!path) return
    const controller = new AbortController()
    api(path, { signal: controller.signal })
      .then((data) => setResult({ key, path, data, error: null }))
      .catch((error) => {
        if (error.name !== 'AbortError') setResult({ key, path, data: null, error: error.message })
      })
    return () => controller.abort()
  }, [path, key])

  return {
    data: result.path === path ? result.data : null,
    error: result.key === key ? result.error : null,
    loading: Boolean(path) && result.key !== key,
  }
}
