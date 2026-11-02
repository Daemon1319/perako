import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AuthProvider from './context/AuthProvider'
import { useAuth } from './hooks/useAuth'
import { useResource } from './hooks/useResource'
import AppLayout from './components/AppLayout'
import Brand from './components/Brand'
import CategoriesSheet from './components/CategoriesSheet'
import TransactionSheet from './components/TransactionSheet'
import WalletsSheet from './components/WalletsSheet'
import TransferSheet from './components/TransferSheet'
import { api } from './lib/api'
import { ErrorState, Spinner } from './components/Feedback'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import TransactionsPage from './pages/TransactionsPage'

function Workspace() {
  const [revision, setRevision] = useState(0)
  const [panel, setPanel] = useState(null)
  const [toast, setToast] = useState(null)
  const categories = useResource('/categories', revision)
  const wallets = useResource('/wallets', revision)
  const closePanel = useCallback(() => setPanel(null), [])

  function requestPanelClose() {
    setPanel((previous) => previous ? { ...previous, closing: true } : null)
  }

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  function refresh(message) {
    setRevision((previous) => previous + 1)
    if (message) setToast(message)
  }

  function add(type) {
    if (!wallets.loading && !wallets.error && !wallets.data?.length) {
      setToast('Create a wallet first, then add income to fund it.')
      setPanel({ kind: 'wallets' })
      return
    }
    setPanel({ kind: 'transaction', type })
  }

  async function edit(transaction, afterSave) {
    if (transaction.transfer_id) {
      try {
        const transfer = await api(`/transfers/${transaction.transfer_id}`)
        setPanel({ kind: 'transfer', transfer })
      } catch (error) { setToast(error.message) }
      return
    }
    setPanel({ kind: 'transaction', type: transaction.transaction_type, transaction, afterSave })
  }

  return (
    <AppLayout onTransfer={() => setPanel({ kind: 'transfer' })} onWallets={() => setPanel({ kind: 'wallets' })} onAdd={add} onCategories={() => setPanel({ kind: 'categories' })} toast={toast}>
      <Routes>
        <Route path="/" element={<HomePage wallets={wallets} onWallets={() => setPanel({ kind: 'wallets' })} revision={revision} onRetry={() => refresh()} />} />
        <Route path="/transactions" element={<TransactionsPage onTransfer={(transfer) => setPanel({ kind: 'transfer', transfer })} wallets={wallets.data || []} categories={categories.data || []} categoriesLoading={categories.loading} revision={revision} onEdit={edit} onRetry={() => refresh()} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {panel?.kind === 'transfer' && <TransferSheet transfer={panel.transfer} wallets={wallets.data || []} loading={wallets.loading} loadError={wallets.error} closing={Boolean(panel.closing)} onClose={closePanel} onRequestClose={requestPanelClose} onSaved={(message) => { requestPanelClose(); refresh(message) }} />}
      {panel?.kind === 'transaction' && <TransactionSheet wallets={wallets.data || []} walletsLoading={wallets.loading} walletsError={wallets.error} type={panel.type} transaction={panel.transaction} categories={categories.data || []} categoriesLoading={categories.loading} categoriesError={categories.error} closing={Boolean(panel.closing)} onClose={closePanel} onRequestClose={requestPanelClose} onSaved={(message) => { panel.afterSave?.(); requestPanelClose(); refresh(message) }} />}
      {panel?.kind === 'wallets' && <WalletsSheet wallets={wallets.data || []} loading={wallets.loading} error={wallets.error} closing={Boolean(panel.closing)} onClose={closePanel} onRequestClose={requestPanelClose} onChanged={refresh} onRetry={() => refresh()} />}
      {panel?.kind === 'categories' && <CategoriesSheet categories={categories.data || []} loading={categories.loading} error={categories.error} closing={Boolean(panel.closing)} onClose={closePanel} onRequestClose={requestPanelClose} onChanged={refresh} onRetry={() => refresh()} />}
    </AppLayout>
  )
}

function AppRoutes() {
  const { user, loading, error, retry, forgetSession } = useAuth()
  const location = useLocation()

  if (loading || error) {
    return <main className="auth-shell flex items-center justify-center px-7"><div className="w-full py-20 text-center"><Brand large />{loading ? <div className="mt-8 flex justify-center text-teal-700" role="status"><Spinner /><span className="sr-only">Loading your account</span></div> : <div className="mt-8"><ErrorState error={error} onRetry={retry} /><button className="mt-5 text-sm text-stone-500 underline underline-offset-4" onClick={forgetSession}>Return to sign in</button></div>}</div></main>
  }

  if (!user && location.pathname !== '/login') return <Navigate to="/login" replace />

  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="*" element={<Workspace />} />
    </Routes>
  )
}

export default function App() {
  return <AuthProvider><BrowserRouter><AppRoutes /></BrowserRouter></AuthProvider>
}
