import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useIdleDisconnect } from '../hooks/useIdleDisconnect'
import AccountMenu from '../components/AccountMenu'
import AuthModal from '../components/AuthModal'
import BottomNav from '../components/BottomNav'
import MessageToast from '../components/MessageToast'

function Layout() {
  const { user, loading, justLoggedIn, clearJustLoggedIn } = useAuth()
  useIdleDisconnect()
  const location = useLocation()
  // a slot in the shared header that only Home populates (via portal), so the
  // "Utenti registrati" toggle shows up only on that page without Layout
  // needing to know anything Home-specific
  const [headerSlot, setHeaderSlot] = useState(null)

  // consumed once the redirect below has actually been committed to the DOM —
  // safe to do in an effect here, unlike the redirect itself (see below)
  useEffect(() => {
    if (justLoggedIn) clearJustLoggedIn()
  }, [justLoggedIn, clearJustLoggedIn])

  if (loading) return null
  if (!user) return <AuthModal />

  // Returning <Navigate> here, synchronously during render, is required —
  // a useEffect + navigate() here is too late. While logged out this
  // component never renders <Outlet> at all (see above). The very first
  // render after logging back in is therefore also the first render where
  // the *child* route (e.g. a stale /chat/:id left over from before logout)
  // would mount — and React runs child effects before parent effects, so a
  // parent-level useEffect redirect would fire only *after* that child's own
  // mount effect already ran (e.g. ChatThread's markRead marking messages as
  // read on a chat you never actually opened). Returning <Navigate> instead
  // of <Outlet> on this render means that child never mounts in the first place.
  if (justLoggedIn && location.pathname !== '/') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-slot" ref={setHeaderSlot} />
        <h1 className="app-title">Chattiamo</h1>
        <AccountMenu />
      </header>
      <main className="app-content">
        <Outlet context={{ headerSlot }} />
      </main>
      <MessageToast />
      <BottomNav />
    </div>
  )
}

export default Layout
