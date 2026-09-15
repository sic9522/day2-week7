import { useEffect } from 'react'
import socket from '../services/socket'

const IDLE_MS = 5 * 60 * 1000
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click']

// ponytail: one global idle timer deactivates the shared STOMP client after
// 5 min without user activity, or immediately when the tab/window closes.
// Server-side session expiry is a separate concern for the BE.
export function useIdleDisconnect() {
  useEffect(() => {
    let timer = setTimeout(() => socket.deactivate(), IDLE_MS)

    function resetTimer() {
      clearTimeout(timer)
      timer = setTimeout(() => socket.deactivate(), IDLE_MS)
      // ChatsContext only activates the socket once, on login — reconnect here
      // if activity resumes after an idle-deactivate (login itself re-triggers
      // ChatsContext's own activation, so this only needs to handle idle wake-up)
      if (!socket.active && localStorage.getItem('token')) socket.activate()
    }

    function disconnectNow() {
      socket.deactivate()
    }

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, resetTimer))
    window.addEventListener('pagehide', disconnectNow)

    return () => {
      clearTimeout(timer)
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, resetTimer))
      window.removeEventListener('pagehide', disconnectNow)
    }
  }, [])
}
