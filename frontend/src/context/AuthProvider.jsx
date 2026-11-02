import { useEffect, useState } from 'react'
import { api, clearToken, getToken, setToken } from '../lib/api'
import { AuthContext } from './AuthContext'

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(() => ({
    user: null, loading: Boolean(getToken()), error: null,
  }))
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    function unauthorized() {
      clearToken()
      setSession({ user: null, loading: false, error: null })
    }
    window.addEventListener('perako:unauthorized', unauthorized)
    return () => window.removeEventListener('perako:unauthorized', unauthorized)
  }, [])

  useEffect(() => {
    if (!getToken()) return
    const controller = new AbortController()
    api('/me', { signal: controller.signal })
      .then((user) => setSession({ user, loading: false, error: null }))
      .catch((error) => {
        if (error.name === 'AbortError') return
        if (error.status === 401) clearToken()
        setSession({ user: null, loading: false, error: error.status === 401 ? null : error.message })
      })
    return () => controller.abort()
  }, [attempt])

  async function login(email, password, rememberMe = false) {
    const data = await api('/login', { method: 'POST', body: { session: { email, password, remember_me: rememberMe } } })
    setToken(data.token, rememberMe)
    setSession({ user: data.user, loading: false, error: null })
  }

  async function logout() {
    try {
      await api('/logout', { method: 'DELETE' })
    } finally {
      clearToken()
      setSession({ user: null, loading: false, error: null })
    }
  }

  function retry() {
    setSession((previous) => ({ ...previous, loading: true, error: null }))
    setAttempt((previous) => previous + 1)
  }

  function forgetSession() {
    clearToken()
    setSession({ user: null, loading: false, error: null })
  }

  return (
    <AuthContext.Provider value={{ ...session, login, logout, retry, forgetSession }}>
      {children}
    </AuthContext.Provider>
  )
}
