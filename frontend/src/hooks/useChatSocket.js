import socket from '../services/socket'

// pure senders only — the BE delivers replies to the broker's per-user
// destination (/user/queue/*, see ChatService), never a per-chat topic, so the
// inbound subscription is global and lives once in ChatsContext, not per chatId
export function useChatSocket() {
  function sendMessage(chatId, text) {
    if (!socket.connected) return false
    socket.publish({
      destination: `/app/chat/${chatId}/send`,
      body: JSON.stringify({ chatId, text }),
    })
    return true
  }

  function sendTyping(chatId) {
    if (!socket.connected) return
    socket.publish({ destination: `/app/chat/${chatId}/typing`, body: '{}' })
  }

  return { sendMessage, sendTyping }
}
