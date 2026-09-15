import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'
import socket from '../services/socket'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  // true exactly once per logged-out -> logged-in transition (token restore,
  // login, or register) — Layout uses it to redirect to Home synchronously,
  // during render. It must NOT flip on unrelated user updates (e.g. toggling
  // read receipts), so only the three auth actions below ever set it.
  const [justLoggedIn, setJustLoggedIn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get('/users/me')
      .then(({ data }) => {
        setUser(data)
        setJustLoggedIn(true)
      })
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  async function login({ identifier, password }) {
    try {
      const { data } = await api.post('/auth/login', { identifier, password })
      localStorage.setItem('token', data.token)
      setUser(data.user)
      setJustLoggedIn(true)
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Credenziali non valide')
    }
  }

  async function register({ nome, cognome, username, email, password }) {
    try {
      const { data } = await api.post('/auth/register', { nome, cognome, username, email, password })
      localStorage.setItem('token', data.token)
      setUser(data.user)
      setJustLoggedIn(true)
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Errore in fase di registrazione')
    }
  }

  function logout() {
    // without this, the STOMP session stays open until the idle timeout or the
    // tab closes — the server correctly keeps reporting you online, since the
    // connection genuinely is still alive
    socket.deactivate()
    localStorage.removeItem('token')
    setUser(null)
  }

  async function toggleReadReceipts() {
    const { data } = await api.patch('/users/me/read-receipts')
    setUser(data)
  }

  function clearJustLoggedIn() {
    setJustLoggedIn(false)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, toggleReadReceipts, justLoggedIn, clearJustLoggedIn }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
