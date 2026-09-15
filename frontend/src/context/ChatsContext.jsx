import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import api from '../services/api'
import socket from '../services/socket'
import { useAuth } from './AuthContext'

const ChatsContext = createContext(null)

export function ChatsProvider({ children }) {
  const { user } = useAuth()
  const [chats, setChats] = useState([])
  const [notification, setNotification] = useState(null)
  const [incomingMessage, setIncomingMessage] = useState(null)
  const [incomingTyping, setIncomingTyping] = useState(null)
  const [incomingRead, setIncomingRead] = useState(null)
  const [incomingDelivered, setIncomingDelivered] = useState(null)
  const [incomingPresence, setIncomingPresence] = useState(null)
  const chatsRef = useRef(chats)

  useEffect(() => {
    chatsRef.current = chats
  }, [chats])

  const refreshChats = useCallback(async () => {
    if (!user) {
      setChats([])
      return
    }
    const { data } = await api.get('/chats')
    setChats(data)
  }, [user])

  useEffect(() => {
    refreshChats()
  }, [refreshChats])

  // one subscription per session, not per open chat: the BE delivers each
  // message only to its recipient via the broker's user destination
  // (/user/queue/messages — see ChatService), never broadcasting to a shared
  // topic, so this has to listen globally regardless of which thread is open
  useEffect(() => {
    if (!user) return

    let messagesSub
    let typingSub
    let readSub
    let deliveredSub
    let presenceSub

    function subscribe() {
      messagesSub = socket.subscribe('/user/queue/messages', (frame) => {
        const message = JSON.parse(frame.body)
        const existingChat = chatsRef.current.find((c) => c.id === message.chatId)
        const unread = (existingChat?.unread ?? 0) + 1

        if (existingChat) {
          setChats((prev) =>
            prev.map((c) =>
              c.id === message.chatId ? { ...c, lastMessage: message.text, time: message.time, unread } : c,
            ),
          )
        } else {
          // a chat we don't know about yet (someone just started one with us) —
          // pull the full list instead of patching a summary we don't have
          refreshChats()
        }
        // username only, no message preview — the content stays private,
        // not leaked into a toast. unread count folds in every message from
        // this same sender that piled up while we weren't looking
        setNotification({ id: crypto.randomUUID(), username: message.senderUsername, unread })
        setIncomingMessage(message)

        // a real delivery ack, sent the instant the message actually reaches
        // this client — not inferred from "are they currently connected"
        socket.publish({
          destination: `/app/chat/${message.chatId}/delivered`,
          body: JSON.stringify({ messageId: message.id }),
        })
      })

      typingSub = socket.subscribe('/user/queue/typing', (frame) => {
        setIncomingTyping(JSON.parse(frame.body))
      })

      // pushed when the other side marks our messages as read — drives the
      // sender's ticks turning blue live, without waiting for a re-fetch
      readSub = socket.subscribe('/user/queue/read', (frame) => {
        setIncomingRead(JSON.parse(frame.body))
      })

      // pushed when the recipient's client actually receives one of our
      // messages — flips that specific message's ticks from one to two
      deliveredSub = socket.subscribe('/user/queue/delivered', (frame) => {
        setIncomingDelivered(JSON.parse(frame.body))
      })

      // presence is broadcast on a shared topic (not per-user): unlike chat
      // content it isn't private, and any user with this person in their chat
      // list or "nuovi utenti" rail needs to see it live, not just the recipient
      presenceSub = socket.subscribe('/topic/presence', (frame) => {
        const event = JSON.parse(frame.body)
        setChats((prev) =>
          prev.map((c) => (c.withUsername === event.username ? { ...c, online: event.online } : c)),
        )
        setIncomingPresence(event)
      })
    }

    socket.onConnect = subscribe
    if (socket.connected) subscribe()
    else if (!socket.active) socket.activate()

    return () => {
      messagesSub?.unsubscribe()
      typingSub?.unsubscribe()
      readSub?.unsubscribe()
      deliveredSub?.unsubscribe()
      presenceSub?.unsubscribe()
    }
  }, [user])

  async function startChat(username) {
    const trimmed = username.trim()
    if (!trimmed) throw new Error('Inserisci uno username')
    if (trimmed === user?.username) throw new Error('Non puoi scrivere a te stesso')

    try {
      const { data } = await api.post('/chats', { username: trimmed })
      setChats((prev) => (prev.some((c) => c.id === data.id) ? prev : [data, ...prev]))
      return data.id
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Username non trovato')
    }
  }

  function updateChatSummary(chatId, patch) {
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, ...patch } : c)))
  }

  function dismissNotification() {
    setNotification(null)
  }

  async function markRead(chatId) {
    updateChatSummary(chatId, { unread: 0 })
    await api.patch(`/chats/${chatId}/read`)
  }

  // deletes the whole conversation server-side, for both participants — no
  // per-user "hide" concept in this app's data model
  async function deleteChat(chatId) {
    await api.delete(`/chats/${chatId}`)
    setChats((prev) => prev.filter((c) => c.id !== chatId))
  }

  return (
    <ChatsContext.Provider
      value={{
        chats,
        startChat,
        updateChatSummary,
        markRead,
        deleteChat,
        notification,
        dismissNotification,
        incomingMessage,
        incomingTyping,
        incomingRead,
        incomingDelivered,
        incomingPresence,
      }}
    >
      {children}
    </ChatsContext.Provider>
  )
}

export function useChats() {
  return useContext(ChatsContext)
}
