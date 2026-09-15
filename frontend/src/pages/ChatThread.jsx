import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useChats } from '../context/ChatsContext'
import { useChatSocket } from '../hooks/useChatSocket'
import api from '../services/api'
import DeleteChatModal from '../components/DeleteChatModal'

const TYPING_DISPLAY_MS = 3000
const TYPING_SEND_THROTTLE_MS = 2000
const MESSAGES_PAGE_SIZE = 10

// status is a real, server-tracked field now (Message.status on the BE) —
// SENT until the recipient's client actually acks receiving it (DELIVERED),
// READ once they open the chat. readReceiptsOn gates only the READ tick: if
// I've turned mine off, I don't get to see others' either (same reciprocity
// as the BE withholding the read-receipt push when the reader disabled it)
function tickState(message, readReceiptsOn) {
  if (message.status === 'READ' && readReceiptsOn) return 'read'
  if (message.status === 'DELIVERED' || message.status === 'READ') return 'delivered'
  return 'sent'
}

function ChatThread() {
  const { id } = useParams()
  const chatId = Number(id)
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    chats,
    updateChatSummary,
    markRead,
    deleteChat,
    incomingMessage,
    incomingTyping,
    incomingRead,
    incomingDelivered,
  } = useChats()
  const chat = chats.find((c) => c.id === chatId)
  const [text, setText] = useState('')
  const [theirTyping, setTheirTyping] = useState(false)
  const [messages, setMessages] = useState([])
  const [hasMore, setHasMore] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const typingHideTimer = useRef(null)
  const lastTypingSentAt = useRef(0)
  const messagesRef = useRef(null)
  const prevScrollHeight = useRef(0)
  const loadingOlderRef = useRef(false)

  const { sendMessage: sendOverSocket, sendTyping } = useChatSocket()

  useEffect(() => {
    let cancelled = false
    setMessages([])
    setHasMore(false)

    api.get(`/chats/${chatId}/messages`, { params: { size: MESSAGES_PAGE_SIZE } }).then(({ data }) => {
      if (cancelled) return
      setMessages(data)
      setHasMore(data.length === MESSAGES_PAGE_SIZE)
    })
    markRead(chatId)

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId])

  // ChatsContext holds one global subscription (BE delivers to /user/queue/*,
  // not a per-chat topic) — pick up messages meant for the thread that's open
  // and mark them read immediately since the user is actively looking at it
  useEffect(() => {
    if (!incomingMessage || incomingMessage.chatId !== chatId) return
    setMessages((prev) => [...prev, { ...incomingMessage, mine: false }])
    markRead(chatId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingMessage])

  // the other side just marked our sent messages as read — flip their ticks blue
  useEffect(() => {
    if (!incomingRead || incomingRead.chatId !== chatId) return
    setMessages((prev) => prev.map((m) => (m.mine ? { ...m, status: 'READ' } : m)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingRead])

  // the recipient's client just acked receiving one of our messages — flips
  // that specific message from one tick to two. Matched by POSITION (oldest
  // still-SENT "mine" message), not by id: an optimistically-appended message
  // (handleSend) only has a client-generated crypto.randomUUID() until a full
  // refetch replaces it — it never equals the server-assigned numeric id the
  // ack actually carries, so matching by id silently never fires. A single
  // STOMP connection delivers frames in order, so delivery acks arrive in the
  // same order the messages were sent — FIFO is a safe match here.
  useEffect(() => {
    if (!incomingDelivered || incomingDelivered.chatId !== chatId) return
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.mine && m.status === 'SENT')
      if (idx === -1) return prev
      const next = [...prev]
      next[idx] = { ...next[idx], status: 'DELIVERED' }
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingDelivered])

  useEffect(() => {
    if (!incomingTyping || incomingTyping.chatId !== chatId) return
    setTheirTyping(true)
    clearTimeout(typingHideTimer.current)
    typingHideTimer.current = setTimeout(() => setTheirTyping(false), TYPING_DISPLAY_MS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingTyping])

  useEffect(() => () => clearTimeout(typingHideTimer.current), [])

  // scrolls to the newest message on open/new message; when triggered by
  // handleScroll (loading older messages) it instead keeps the same messages
  // in view so the list doesn't jump under the user's thumb
  useLayoutEffect(() => {
    const el = messagesRef.current
    if (!el) return
    if (prevScrollHeight.current) {
      el.scrollTop += el.scrollHeight - prevScrollHeight.current
      prevScrollHeight.current = 0
    } else {
      el.scrollTop = el.scrollHeight
    }
  }, [chatId, messages.length])

  if (!chat) {
    return <Navigate to="/chat" replace />
  }

  function handleSend(e) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return

    sendOverSocket(chatId, trimmed)
    const time = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), mine: true, text: trimmed, time, status: 'SENT' }])
    updateChatSummary(chatId, { lastMessage: trimmed, time })
    setText('')
  }

  async function handleDelete() {
    setConfirmingDelete(false)
    await deleteChat(chatId)
    navigate('/chat')
  }

  function handleTextChange(e) {
    setText(e.target.value)
    const now = Date.now()
    if (now - lastTypingSentAt.current > TYPING_SEND_THROTTLE_MS) {
      sendTyping(chatId)
      lastTypingSentAt.current = now
    }
  }

  function handleScroll(e) {
    const el = e.currentTarget
    if (el.scrollTop < 60 && hasMore && !loadingOlderRef.current && messages.length) {
      loadingOlderRef.current = true
      prevScrollHeight.current = el.scrollHeight
      const beforeId = messages[0].id

      api
        .get(`/chats/${chatId}/messages`, { params: { beforeId, size: MESSAGES_PAGE_SIZE } })
        .then(({ data }) => {
          setMessages((prev) => [...data, ...prev])
          setHasMore(data.length === MESSAGES_PAGE_SIZE)
        })
        .finally(() => {
          loadingOlderRef.current = false
        })
    }
  }

  return (
    <div className="page thread-page">
      <header className="thread-header">
        <Link to="/chat" className="back-link" aria-label="Torna alle chat">
          ←
        </Link>
        <span className="avatar avatar-sm">
          {chat.name.slice(0, 1).toUpperCase()}
          <span className={`status-dot ${chat.online ? 'status-online' : 'status-offline'}`} />
        </span>
        <span className="thread-title">
          <span className="thread-name">{chat.name}</span>
          {theirTyping && <span className="typing-indicator">sta scrivendo…</span>}
        </span>
        <button
          type="button"
          className="thread-delete-btn"
          aria-label="Elimina chat"
          onClick={() => setConfirmingDelete(true)}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
          </svg>
        </button>
      </header>

      <DeleteChatModal
        show={confirmingDelete}
        name={chat.name}
        onConfirm={handleDelete}
        onClose={() => setConfirmingDelete(false)}
      />

      <div className="thread-messages" ref={messagesRef} onScroll={handleScroll}>
        {hasMore && <div className="thread-loading-hint">Scorri per caricare altri messaggi</div>}
        {messages.map((m) => {
          const state = m.mine ? tickState(m, !!user?.settings.readReceipts) : null
          return (
            <div key={m.id} className={`bubble ${m.mine ? 'bubble-mine' : 'bubble-theirs'}`}>
              <span>{m.text}</span>
              <span className="bubble-meta">
                {m.time}
                {state === 'sent' && <span className="ticks">✓</span>}
                {state === 'delivered' && <span className="ticks">✓✓</span>}
                {state === 'read' && <span className="ticks ticks-read">✓✓</span>}
              </span>
            </div>
          )
        })}
      </div>

      <form className="thread-input" onSubmit={handleSend}>
        <input
          value={text}
          onChange={handleTextChange}
          placeholder="Scrivi un messaggio"
        />
        <button type="submit" aria-label="Invia">➤</button>
      </form>
    </div>
  )
}

export default ChatThread
