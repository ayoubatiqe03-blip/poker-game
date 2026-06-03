/**
 * App.jsx
 *
 * Root component. Wires all Socket.IO events to GameContext and
 * routes between Lobby, Game, and GameOver screens.
 *
 * Fixes:
 *   - game:actionRequired → ACTION_REQUIRED dispatch (syncs timer startedAt)
 *   - chat:message → incoming messages from other players rendered in chat
 *   - game:handComplete → NEW_HAND_STARTED dispatch clears cards/overlay
 *   - 'gameover' phase → shows GameOverScreen instead of blank table
 */
import React, { useCallback, useRef } from 'react'
import { GameProvider, useGame } from './context/GameContext'
import { useSocket } from './hooks/useSocket'
import LobbyScreen from './components/Lobby/LobbyScreen'
import GameScreen from './components/Table/GameScreen'
import GameOverScreen from './components/UI/GameOverScreen'

function AppInner() {
  const { state, dispatch, addChat } = useGame()
  const errorTimerRef = useRef(null)

  const showError = useCallback((message) => {
    dispatch({ type: 'SET_ERROR', payload: message })
    clearTimeout(errorTimerRef.current)
    errorTimerRef.current = setTimeout(
      () => dispatch({ type: 'CLEAR_ERROR' }),
      4000,
    )
  }, [dispatch])

  const { emit } = useSocket({
    // ── Connection ──────────────────────────────────────────────────────────
    connect: () => dispatch({ type: 'SET_CONNECTED', payload: true }),
    disconnect: () => dispatch({ type: 'SET_CONNECTED', payload: false }),

    // ── Room ────────────────────────────────────────────────────────────────
    'room:created': (data) => {
      dispatch({ type: 'ROOM_CREATED', payload: data })
      dispatch({ type: 'SET_HOST', payload: true })
      const name = data.lobbyState?.players?.find(p => p.id === data.playerId)?.name
      if (name) dispatch({ type: 'SET_PLAYER_NAME', payload: name })
      addChat('System', `Room ${data.roomCode} created — share the code!`, 'system')
    },

    'room:joined': (data) => {
      dispatch({ type: 'ROOM_JOINED', payload: data })
      const me = data.lobbyState?.players?.find(p => p.id === data.playerId)
      if (me?.isHost) dispatch({ type: 'SET_HOST', payload: true })
      if (me?.name)   dispatch({ type: 'SET_PLAYER_NAME', payload: me.name })
      addChat('System', `Joined room ${data.roomCode}`, 'system')
    },

    'room:updated': (data) => {
      dispatch({ type: 'ROOM_UPDATED', payload: data })
    },

    'room:left': () => {
      dispatch({ type: 'ROOM_LEFT' })
    },

    // ── Game ────────────────────────────────────────────────────────────────
    'game:started': (data) => {
      dispatch({ type: 'GAME_STARTED', payload: data })
      addChat('System', 'Game started — good luck! 🃏', 'system')
    },

    'game:state': (data) => {
      dispatch({ type: 'GAME_STATE', payload: data })
    },

    'game:privateState': (data) => {
      dispatch({ type: 'PRIVATE_STATE', payload: data })
    },

    'game:yourCards': (data) => {
      dispatch({ type: 'YOUR_CARDS', payload: data })
    },

    // FIX: Store startedAt so ActionTimer can display an accurate countdown
    'game:actionRequired': (data) => {
      dispatch({ type: 'ACTION_REQUIRED', payload: data })
    },

    'game:showdown': (data) => {
      dispatch({ type: 'SHOWDOWN', payload: data })
      if (data.winners?.length) {
        // Build winner names from the players array sent with showdown data
        const names = data.winners.map(w => {
          const p = data.players?.find(pl => pl.id === w.playerId)
          return `${p?.name ?? 'Unknown'} (${w.handName})`
        }).join(' & ')
        addChat('System', `🏆 ${names}`, 'win')
      }
    },

    'game:handComplete': (data) => {
      dispatch({ type: 'HAND_COMPLETE', payload: data })
      // After the overlay auto-dismisses, signal a new hand is starting
      setTimeout(() => dispatch({ type: 'NEW_HAND_STARTED' }), 5500)
    },

    'game:over': (data) => {
      dispatch({ type: 'GAME_OVER' })
      addChat('System', `Game over — ${data.message ?? 'no more players'}`, 'system')
    },

    // FIX: Incoming chat messages from other players
    'chat:message': (data) => {
      dispatch({ type: 'ADD_CHAT', payload: data })
    },

    // ── Errors ──────────────────────────────────────────────────────────────
    'error': (data) => showError(data.message),
    'game:error': (data) => showError(data.message),
  })

  // ── Action handlers passed down to screens ─────────────────────────────────

  const handleCreateRoom = useCallback(({ playerName, options }) => {
    dispatch({ type: 'CLEAR_ERROR' })
    emit('room:create', { playerName, options })
  }, [emit, dispatch])

  const handleJoinRoom = useCallback(({ playerName, roomCode }) => {
    dispatch({ type: 'CLEAR_ERROR' })
    emit('room:join', { playerName, roomCode })
  }, [emit, dispatch])

  const handleStartGame = useCallback(() => {
    emit('game:start')
  }, [emit])

  const handleAction = useCallback((action, amount) => {
    emit('game:action', { action, amount })
  }, [emit])

  const handleSendChat = useCallback((text) => {
    emit('chat:message', { text })
  }, [emit])

  const handleLeave = useCallback(() => {
    emit('room:leave')
    dispatch({ type: 'ROOM_LEFT' })
  }, [emit, dispatch])

  const handlePlayAgain = useCallback(() => {
    dispatch({ type: 'ROOM_LEFT' })
  }, [dispatch])

  // ── Screen routing ─────────────────────────────────────────────────────────

  const { gamePhase } = state
  const inGame = ['preflop', 'flop', 'turn', 'river', 'showdown'].includes(gamePhase)
  const isGameOver = gamePhase === 'gameover'

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Connection banner */}
      {!state.connected && (
        <div style={bannerStyle('#922b21', '#e74c3c')}>
          ⚠ Connecting to server…
        </div>
      )}

      {/* Error toast */}
      {state.error && (
        <div style={{ ...bannerStyle('#922b21', '#e74c3c'), top: 52, fontSize: 13 }}>
          ⚠ {state.error}
        </div>
      )}

      {/* Screens */}
      {!inGame && !isGameOver && (
        <LobbyScreen
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onStartGame={handleStartGame}
        />
      )}

      {inGame && (
        <GameScreen
          onAction={handleAction}
          onSendChat={handleSendChat}
          onLeave={handleLeave}
        />
      )}

      {isGameOver && (
        <GameOverScreen onPlayAgain={handlePlayAgain} />
      )}
    </div>
  )
}

export default function App() {
  return (
    <GameProvider>
      <AppInner />
    </GameProvider>
  )
}

function bannerStyle(bg, border) {
  return {
    position: 'fixed', top: 8, left: '50%', transform: 'translateX(-50%)',
    background: bg, border: `1px solid ${border}`,
    borderRadius: 6, padding: '6px 20px',
    fontSize: 12, color: '#fff',
    fontFamily: 'var(--font-body)',
    zIndex: 200,
    animation: 'fadeIn 0.3s ease',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  }
}
