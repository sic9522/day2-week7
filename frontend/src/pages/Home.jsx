import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useOutletContext } from 'react-router-dom'
import { mockPosts } from '../data/mockPosts'
import { useChats } from '../context/ChatsContext'
import UsersSidebar from '../components/UsersSidebar'

function initials(name) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function Home() {
  const { chats } = useChats()
  const { headerSlot } = useOutletContext()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatsOpen, setChatsOpen] = useState(false)
  const sidebarRef = useRef(null)
  const toggleRef = useRef(null)

  // opening the "Nuovi utenti" sidebar always collapses the accordion below it
  // (closed stays closed either way); the reverse isn't requested, so opening
  // the accordion leaves the sidebar alone
  function toggleSidebar() {
    setSidebarOpen((open) => {
      const next = !open
      if (next) setChatsOpen(false)
      return next
    })
  }

  useEffect(() => {
    if (!sidebarOpen) return

    function handlePointerDown(e) {
      if (sidebarRef.current?.contains(e.target)) return
      if (toggleRef.current?.contains(e.target)) return
      // StartChatModal (react-bootstrap) portals to document.body, outside
      // .users-sidebar's own DOM subtree — without this, clicking its Sì/No
      // buttons reads as an "outside click" and unmounts the sidebar (and the
      // modal with it) before the button's own onClick ever gets to run
      if (e.target.closest?.('.modal')) return
      setSidebarOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [sidebarOpen])

  return (
    <div className="page home-page">
      {headerSlot &&
        createPortal(
          <button
            ref={toggleRef}
            type="button"
            className="header-users-toggle"
            onClick={toggleSidebar}
          >
            Nuovi
            <br />
            utenti
          </button>,
          headerSlot,
        )}

      {/* overlays on top of the content below without affecting its layout */}
      {sidebarOpen && <UsersSidebar ref={sidebarRef} />}

      <div className="home-scroll">
        <button
          type="button"
          className="section-title section-title-toggle"
          onClick={() => setChatsOpen((v) => !v)}
          aria-expanded={chatsOpen}
        >
          <span>Chat frequenti</span>
          <svg
            className={`accordion-chevron ${chatsOpen ? 'accordion-chevron-open' : ''}`}
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
        <div className={`accordion-panel ${chatsOpen ? 'accordion-open' : ''}`}>
          <div className="accordion-panel-inner">
            {chats.length === 0 ? (
              <p className="chat-shortcuts-empty">Nessuna chat frequente, inizia una nuova chat</p>
            ) : (
              <div className="chat-shortcuts">
                {chats.map((chat) => (
                  <Link key={chat.id} to={`/chat/${chat.id}`} className="chat-shortcut">
                    <span className="avatar">
                      {initials(chat.name)}
                      <span className={`status-dot ${chat.online ? 'status-online' : 'status-offline'}`} />
                      {chat.unread > 0 && <span className="shortcut-unread-badge">{chat.unread}</span>}
                    </span>
                    <span className="chat-shortcut-name">{chat.name.split(' ')[0]}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <h2 className="section-title">Post</h2>
        <div className="post-feed">
          {mockPosts.map((post) => (
            <article key={post.id} className="post-card">
              <div className="post-header">
                <span className="avatar avatar-sm">{initials(post.author)}</span>
                <div>
                  <div className="post-author">{post.author}</div>
                  <div className="profile-muted">{post.time}</div>
                </div>
              </div>
              <p className="post-text">{post.text}</p>
              {post.image && <img src={post.image} alt="" className="post-image" />}
              <div className="post-actions">
                <span>♡ {post.likes}</span>
                <span>💬 {post.comments}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home
