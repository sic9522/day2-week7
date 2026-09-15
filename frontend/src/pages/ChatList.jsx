import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useChats } from '../context/ChatsContext'
import NewChatModal from '../components/NewChatModal'

function initials(name) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function ChatList() {
  const { chats } = useChats()
  const [showNewChat, setShowNewChat] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = chats.filter((c) =>
    c.name.toLowerCase().includes(search.trim().toLowerCase()),
  )

  return (
    <div className="page">
      <header className="page-header page-header-row">
        <input
          type="search"
          className="chat-search"
          placeholder="Cerca una chat"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          type="button"
          className="new-chat-btn"
          aria-label="Nuova chat"
          onClick={() => setShowNewChat(true)}
        >
          +
        </button>
      </header>

      <ul className="chat-list">
        {filtered.map((chat) => (
          <li key={chat.id}>
            <Link to={`/chat/${chat.id}`} className="chat-row">
              <span className="avatar">
                {initials(chat.name)}
                <span className={`status-dot ${chat.online ? 'status-online' : 'status-offline'}`} />
              </span>
              <span className="chat-row-body">
                <span className="chat-row-top">
                  <span className="chat-row-name">{chat.name}</span>
                  <span className="chat-row-time">{chat.time}</span>
                </span>
                <span className="chat-row-bottom">
                  <span className="chat-row-preview">{chat.lastMessage || 'Nessun messaggio'}</span>
                  {chat.unread > 0 && <span className="unread-badge">{chat.unread}</span>}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <NewChatModal show={showNewChat} onClose={() => setShowNewChat(false)} />
    </div>
  )
}

export default ChatList
