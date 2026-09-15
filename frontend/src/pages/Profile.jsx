import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import socket from '../services/socket'

function Profile() {
  const { user, logout, toggleReadReceipts } = useAuth()
  const [sessionsClosed, setSessionsClosed] = useState(false)

  async function handleCloseSessions() {
    await socket.deactivate()
    setSessionsClosed(true)
  }

  return (
    <div className="page">
      <div className="profile-top">
        <div className="avatar avatar-lg avatar-placeholder" title="Caricamento foto non ancora disponibile">
          {user.nome[0]}
          {user.cognome[0]}
        </div>
        <div className="profile-fields">
          <div><strong>{user.nome} {user.cognome}</strong></div>
          <div className="profile-muted">@{user.username}</div>
          <div className="profile-muted">{user.email}</div>
        </div>
      </div>

      <div className="profile-setting-row">
        <div>
          <div className="profile-setting-label">Conferma di lettura</div>
          <div className="profile-muted">Mostra le doppie spunte blu quando un messaggio è letto</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={user.settings.readReceipts}
          className={`toggle ${user.settings.readReceipts ? 'toggle-on' : ''}`}
          onClick={toggleReadReceipts}
        >
          <span className="toggle-knob" />
        </button>
      </div>

      <button type="button" className="close-sessions-btn" onClick={handleCloseSessions}>
        Chiudi sessioni
      </button>
      {sessionsClosed && <div className="profile-muted profile-hint">Sessioni chiuse</div>}

      <button type="button" className="logout-btn" onClick={logout}>
        Esci
      </button>
    </div>
  )
}

export default Profile
