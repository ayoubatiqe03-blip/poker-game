/**
 * context/GameContext.jsx
 *
 * Fixed:
 *   - ROOM_UPDATED now re-derives isHost from the updated lobby state,
 *     so if the host leaves and a new host is assigned, the new host's
 *     client immediately gets the Start button without needing to refresh.
 *   - NEW_HAND_STARTED clears myCards and resets actionRequired.
 *   - HAND_COMPLETE keeps myCards visible through the winner overlay.
 *   - ACTION_REQUIRED stores startedAt for synced countdown timer.
 */
import React, { createContext, useContext, useReducer, useCallback } from 'react'

const GameContext = createContext(null)

const initialState = {
  connected:       false,
  playerId:        null,
  playerName:      null,
  roomCode:        null,
  isHost:          false,
  lobbyState:      null,
  gamePhase:       'idle',
  publicState:     null,
  myCards:         [],
  actionRequired:  null,   // { playerId, timeoutMs, startedAt }
  error:           null,
  chat:            [],
  lastWinners:     [],
  showWinner:      false,
}

function reducer(state, action) {
  switch (action.type) {

    case 'SET_CONNECTED':
      return { ...state, connected: action.payload }

    case 'ROOM_CREATED':
    case 'ROOM_JOINED':
      return {
        ...state,
        roomCode:    action.payload.roomCode,
        playerId:    action.payload.playerId,
        lobbyState:  action.payload.lobbyState,
        gamePhase:   'lobby',
        error:       null,
      }

    case 'ROOM_UPDATED': {
      // Re-derive isHost from the fresh lobby state so host reassignment is instant
      const me = action.payload.lobbyState?.players?.find(p => p.id === state.playerId)
      return {
        ...state,
        lobbyState: action.payload.lobbyState,
        isHost:     me?.isHost ?? state.isHost,
      }
    }

    case 'SET_HOST':
      return { ...state, isHost: action.payload }

    case 'GAME_STARTED':
      return { ...state, gamePhase: 'preflop', lobbyState: action.payload.lobbyState }

    case 'GAME_STATE':
      return {
        ...state,
        publicState: action.payload,
        gamePhase:   action.payload.phase || state.gamePhase,
      }

    case 'PRIVATE_STATE':
      return {
        ...state,
        publicState: action.payload,
        gamePhase:   action.payload.phase || state.gamePhase,
        // Only update cards if we received real (non-hidden) cards
        myCards: action.payload.players
          ?.find(p => p.id === state.playerId)
          ?.holeCards
          ?.filter(c => c.rank !== '?')
          ?? state.myCards,
      }

    case 'YOUR_CARDS':
      return { ...state, myCards: action.payload.cards }

    case 'ACTION_REQUIRED':
      return { ...state, actionRequired: action.payload }

    case 'SHOWDOWN':
      return {
        ...state,
        showWinner:  true,
        lastWinners: action.payload.winners ?? [],
      }

    case 'HAND_COMPLETE':
      return {
        ...state,
        showWinner:  true,
        lastWinners: action.payload.winners ?? [],
        // Keep myCards visible during the winner overlay
      }

    case 'NEW_HAND_STARTED':
      return { ...state, myCards: [], showWinner: false, actionRequired: null }

    case 'HIDE_WINNER':
      return { ...state, showWinner: false }

    case 'GAME_OVER':
      return { ...state, gamePhase: 'gameover' }

    case 'ROOM_LEFT':
      return { ...initialState, connected: state.connected }

    case 'ADD_CHAT':
      return { ...state, chat: [...state.chat.slice(-99), action.payload] }

    case 'SET_ERROR':
      return { ...state, error: action.payload }

    case 'CLEAR_ERROR':
      return { ...state, error: null }

    case 'SET_PLAYER_NAME':
      return { ...state, playerName: action.payload }

    default:
      return state
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const addChat = useCallback((sender, text, type = 'chat') => {
    dispatch({
      type:    'ADD_CHAT',
      payload: {
        id:     `${Date.now()}-${Math.random()}`,
        sender,
        text,
        type,
        ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    })
  }, [])

  return (
    <GameContext.Provider value={{ state, dispatch, addChat }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside GameProvider')
  return ctx
}
