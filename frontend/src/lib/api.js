const TOKEN_KEY = 'perako.session'
const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY)
}

export async function api(path, { method = 'GET', body, signal } = {}) {
  const token = getToken()
  let response

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      signal,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
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
