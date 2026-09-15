import { forwardRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useChats } from '../context/ChatsContext'
import StartChatModal from './StartChatModal'

function initials(name) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

// left rail overlay on Home (toggled from the header), listing the 5 most
// recently registered users (GET /users already returns newest-first, capped
// server-side); tapping one either jumps straight into the existing chat or
// offers to start one. Forwards its root node so Home can detect clicks
// outside it and close it.
const UsersSidebar = forwardRef(function UsersSidebar(_props, ref) {
  const { chats, startChat, incomingPresence } = useChats()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [pending, setPending] = useState(null)

  useEffect(() => {
    api.get('/users').then(({ data }) => setUsers(data))
  }, [])

  // ChatsContext holds the one global subscription to /topic/presence — react
  // to it here instead of subscribing again (the socket client's onConnect
  // slot can only hold one handler, already claimed there)
  useEffect(() => {
    if (!incomingPresence) return
    setUsers((prev) =>
      prev.map((u) => (u.username === incomingPresence.username ? { ...u, online: incomingPresence.online } : u)),
    )
  }, [incomingPresence])

  function handleClick(target) {
    const existing = chats.find((c) => c.withUsername === target.username)
    if (existing) {
      navigate(`/chat/${existing.id}`)
      return
    }
    setPending(target)
  }

  async function confirmStart() {
    const chatId = await startChat(pending.username)
    setPending(null)
    navigate(`/chat/${chatId}`)
  }

  return (
    <aside ref={ref} className="users-sidebar">
      {users.map((u) => (
        <button
          key={u.id}
          type="button"
          className="users-sidebar-item"
          onClick={() => handleClick(u)}
        >
          <span className="avatar avatar-sm">
            {initials(`${u.nome} ${u.cognome}`)}
            <span className={`status-dot ${u.online ? 'status-online' : 'status-offline'}`} />
          </span>
          <span className="users-sidebar-name">{u.nome}</span>
        </button>
      ))}

      <StartChatModal
        show={!!pending}
        name={pending ? `${pending.nome} ${pending.cognome}` : ''}
        onConfirm={confirmStart}
        onClose={() => setPending(null)}
      />
    </aside>
  )
})

export default UsersSidebar
