import { createBackendReadiness } from './backendReadiness.js'

const TOKEN_KEY = 'perako.session'
const API_URL = (import.meta.env?.VITE_API_URL || '/api').replace(/\/$/, '')

const readiness = createBackendReadiness(API_URL)

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY)
}

export function setToken(token, rememberMe = false) {
  clearToken()
  const storage = rememberMe ? localStorage : sessionStorage
  storage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}

export async function api(path, { method = 'GET', body, signal } = {}) {
  const token = getToken()
  method = method.toUpperCase()
  let response

  try {
    await readiness.wait(signal)
    const request = () => fetch(`${API_URL}${path}`, {
      method,
      signal,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    // Only reads may be retried. A failed write may already have reached Rails.
    for (let attempt = 0; ; attempt += 1) {
      try {
        response = await request()
        if (![502, 503, 504].includes(response.status)) {
          readiness.markActive()
          break
        }
        readiness.invalidate()
        if (method !== 'GET' || attempt >= 1) break
        await response.body?.cancel()
      } catch (error) {
        if (signal?.aborted || error.name === 'AbortError') throw error
        readiness.invalidate()
        if (method !== 'GET' || attempt >= 1) throw error
      }
      await readiness.wait(signal)
    }
  } catch (error) {
    if (signal?.aborted || error.name === 'AbortError') throw error
    throw new Error('Unable to connect to Perako. Please try again.', { cause: error })
  }

  if (response.status === 204) return null

  const data = response.headers.get('content-type')?.includes('application/json')
    ? await response.json()
    : null

  if (!response.ok) {
    if (response.status === 401 && token) {
      window.dispatchEvent(new Event('perako:unauthorized'))
    }
    const message = data?.errors?.join('. ') || data?.error
      || (response.status === 404 ? 'This item could not be found.' : 'Something went wrong. Please try again.')
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  if (data === null) throw new Error('Perako returned an unexpected response. Please try again.')
  return data
}
