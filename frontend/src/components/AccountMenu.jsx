import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import socket from '../services/socket'

// account avatar in the header (every page), opens a small dropdown with
// quick access to the profile page and the same close-sessions/logout
// actions Profile.jsx exposes on its own page
function AccountMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(e) {
      if (menuRef.current?.contains(e.target)) return
      setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  async function handleCloseSessions() {
    setOpen(false)
    await socket.deactivate()
  }

  function handleLogout() {
    setOpen(false)
    logout()
  }

  if (!user) return null

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        type="button"
        className="avatar avatar-sm account-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account"
      >
        {user.nome[0]}
        {user.cognome[0]}
      </button>

      {open && (
        <div className="account-dropdown">
          <Link to="/profile" className="account-dropdown-item" onClick={() => setOpen(false)}>
            Profilo
          </Link>
          <button type="button" className="account-dropdown-item account-item-warning" onClick={handleCloseSessions}>
            Chiudi sessioni
          </button>
          <button type="button" className="account-dropdown-item account-item-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

export default AccountMenu
