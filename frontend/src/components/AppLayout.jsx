import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, Check, ChevronRight, FolderOpen, Home, ListFilter, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import Brand from './Brand'

export default function AppLayout({ children, onAdd, onCategories, onWallets, toast }) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    function outside(event) {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false)
    }
    function escape(event) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [menuOpen])

  async function handleLogout() {
    setLoggingOut(true)
    try { await logout() } catch { /* The local session is cleared even if the server is unavailable. */ }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="app-header">
        <div className="flex items-center justify-between px-6 pb-5 pt-6">
          <Brand />
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-stone-500">Hi, {user.name.trim().split(/\s+/)[0]}</span>
            <span className="flex size-8 items-center justify-center rounded-full bg-[#eeeae2] text-xs font-semibold text-stone-600" aria-hidden="true">{user.name.trim().slice(0, 1).toUpperCase()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-6 pb-4">
          <nav className="nav-tabs" aria-label="Main navigation">
            <NavLink end to="/" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}><Home size={16} /> Home</NavLink>
            <NavLink to="/transactions" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}><ListFilter size={16} /> Transactions</NavLink>
          </nav>
          <div className="relative" ref={menuRef}>
            <button className={`menu-toggle ${menuOpen ? 'bg-stone-100' : ''}`} type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="account-menu" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            {menuOpen && (
              <div className="account-menu" id="account-menu">
                <p className="truncate border-b border-stone-100 px-4 py-3 text-xs text-stone-500">{user.email}</p>
                <button type="button" onClick={() => { setMenuOpen(false); onCategories() }}><FolderOpen size={17} /> Categories <ChevronRight size={15} className="ml-auto text-stone-400" /></button>
                <button type="button" onClick={() => { setMenuOpen(false); onWallets() }}><FolderOpen size={17} /> Manage wallets <ChevronRight size={15} className="ml-auto text-stone-400" /></button>
                <button type="button" disabled={loggingOut} onClick={handleLogout}><LogOut size={17} /> {loggingOut ? 'Signing out…' : 'Log out'}</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1 px-6 pb-32 pt-7">{children}</main>

      <div className="action-dock">
        <button className="add-expense" type="button" onClick={() => onAdd('expense')}><ArrowUpRight size={19} /> Add expense</button>
        <button className="add-income" type="button" onClick={() => onAdd('income')}><ArrowDownLeft size={19} /> Add income</button>
      </div>

      {toast && <div className="toast" role="status"><Check size={17} />{toast}</div>}
    </div>
  )
}
