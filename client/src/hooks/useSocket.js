/**
 * hooks/useSocket.js
 *
 * Manages the Socket.IO connection lifecycle.
 *
 * Fixes:
 *   - Handler cleanup uses the same entries snapshot that was registered,
 *     so off() correctly removes the right listeners even if the handlers
 *     object shape changes between renders.
 *   - Socket is initialised lazily on first call, not at module load,
 *     so Vite HMR doesn't duplicate connections during development.
 */
import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'

let socketInstance = null

function getSocket() {
  if (!socketInstance) {
    socketInstance = io(SERVER_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })
  }
  return socketInstance
}

export function useSocket(handlers = {}) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    const socket = getSocket()

    // Snapshot the event names at mount time so cleanup removes exactly
    // the same set of listeners, even if the handlers object changes later.
    const eventNames = Object.keys(handlersRef.current)

    // Wrap each handler so it always calls the LATEST version (via ref),
    // but is a stable function reference we can pass to socket.off().
    const wrappers = {}
    eventNames.forEach(event => {
      wrappers[event] = (...args) => handlersRef.current[event]?.(...args)
      socket.on(event, wrappers[event])
    })

    return () => {
      eventNames.forEach(event => {
        socket.off(event, wrappers[event])
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const emit = useCallback((event, data) => {
    getSocket().emit(event, data)
  }, [])

  return { emit, socket: getSocket() }
}
