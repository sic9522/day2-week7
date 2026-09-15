import { NavLink } from 'react-router-dom'
import { useChats } from '../context/ChatsContext'

const items = [
  {
    to: '/',
    label: 'Home',
    icon: (
      <path d="M3 10.5 12 3l9 7.5M5.5 9.5V20a1 1 0 0 0 1 1H9.5a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1H18.5a1 1 0 0 0 1-1V9.5" />
    ),
  },
  {
    to: '/chat',
    label: 'Chat',
    icon: (
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
    ),
  },
  {
    to: '/profile',
    label: 'Profilo',
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
      </>
    ),
  },
]

function BottomNav() {
  const { chats } = useChats()
  const unreadChats = chats.filter((c) => c.unread > 0).length

  return (
    <nav className="bottom-nav">
      {items.map(({ to, label, icon }) => (
        <NavLink key={to} to={to} end={to === '/'} className="bottom-nav-item">
          <span className="bottom-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {icon}
            </svg>
            {to === '/chat' && unreadChats > 0 && <span className="nav-badge">{unreadChats}</span>}
          </span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default BottomNav
