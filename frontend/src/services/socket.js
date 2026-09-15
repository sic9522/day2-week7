import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const socket = new Client({
  webSocketFactory: () => new SockJS(`${import.meta.env.VITE_API_URL}/ws`),
})

export default socket
