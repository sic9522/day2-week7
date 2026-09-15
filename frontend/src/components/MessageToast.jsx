import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useChats } from '../context/ChatsContext'

const AUTO_DISMISS_MS = 4000

function MessageToast() {
  const { notification, dismissNotification } = useChats()
  const location = useLocation()
  const chatOpen = notification && location.pathname === `/chat/${notification.chatId}`

  useEffect(() => {
    if (!notification) return
    const timer = setTimeout(dismissNotification, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [notification, dismissNotification])

  if (!notification || chatOpen) return null

  return (
    <div className="message-toast" role="status">
      <strong>{notification.username}</strong>
      <span>ti ha mandato un messaggio{notification.unread > 1 ? ` (${notification.unread})` : ''}</span>
    </div>
  )
}

export default MessageToast
