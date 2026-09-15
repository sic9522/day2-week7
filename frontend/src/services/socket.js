import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const socket = new Client({
  webSocketFactory: () => new SockJS(`${import.meta.env.VITE_API_URL}/ws`),
  reconnectDelay: 5000,
  // without heartbeats an abrupt disconnect (network loss, tab killed) is only
  // noticed once the underlying TCP connection times out, which can take a
  // long time — this bounds it to a few seconds so presence updates quickly
  heartbeatIncoming: 8000,
  heartbeatOutgoing: 8000,
  // re-read the token on every (re)connect attempt, not just at module load,
  // so a fresh login after a logout/expiry still authenticates the socket
  beforeConnect: () => {
    const token = localStorage.getItem('token')
    socket.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {}
  },
})

export default socket
