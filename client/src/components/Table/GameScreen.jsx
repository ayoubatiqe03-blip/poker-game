/**
 * components/Table/GameScreen.jsx
 *
 * Main in-game view.
 *
 * Fixes:
 *   - Chat uses onSendChat prop (which calls emit) instead of local-only addChat
 *   - ActionTimer receives startedAt from actionRequired state so the countdown
 *     is synced to the server's real deadline
 *   - lastActions tracks ALL players' last action (not just local player)
 */
import React, { useState, useCallback } from 'react'
import PokerTable from './PokerTable'
import BettingControls from '../Controls/BettingControls'
import ChatPanel from '../Chat/ChatPanel'
import WinnerOverlay from '../UI/WinnerOverlay'
import { useGame } from '../../context/GameContext'
import { formatChips } from '../../utils/cardHelpers'

export default function GameScreen({ onAction, onSendChat, onLeave }) {
  const { state, dispatch } = useGame()
  const [lastActions, setLastActions] = useState({})

  const { publicState, myCards, playerId, lastWinners, showWinner, playerName, actionRequired } = state
  const players = publicState?.players ?? []
  const myPlayer = players.find(p => p.id === playerId)
  const bettingRound = publicState?.bettingRound ?? null
  const isMyTurn = bettingRound?.currentPlayerId === playerId

  // actionRequired comes from the server event and carries startedAt
  const myTurnInfo = isMyTurn ? actionRequired : null

  const handleAction = useCallback((action, amount) => {
    setLastActions(prev => ({ ...prev, [playerId]: action }))
    setTimeout(() => {
      setLastActions(prev => {
        const n = { ...prev }
        delete n[playerId]
        return n
      })
    }, 2000)
    onAction?.(action, amount)
  }, [onAction, playerId])

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: `
        radial-gradient(ellipse at 20% 50%, rgba(14,8,2,0.9) 0%, transparent 70%),
        radial-gradient(ellipse at 80% 50%, rgba(8,4,1,0.9) 0%, transparent 70%),
        linear-gradient(180deg, #0a0602 0%, #080401 100%)
      `,
    }}>
      {/* ── Top HUD ───────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 44,
        background: 'rgba(5,3,1,0.88)',
        borderBottom: '1px solid rgba(201,168,76,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', zIndex: 40,
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
            background: 'linear-gradient(135deg, var(--gold-dark), var(--gold-light))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            🃏 Royal Flush
          </span>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--gold)', letterSpacing: '0.15em',
          }}>
            {state.roomCode}
          </span>
          <PhaseTag phase={publicState?.phase} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
            Hand #{publicState?.handNumber ?? 0}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {myPlayer && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gold)' }}>
              🪙 {formatChips(myPlayer.chips)}
            </div>
          )}
          <button onClick={onLeave} style={{
            padding: '4px 12px', borderRadius: 5,
            background: 'rgba(146,43,33,0.2)',
            border: '1px solid rgba(146,43,33,0.4)',
            color: '#e74c3c', fontSize: 11,
            cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}>
            Leave
          </button>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        top: 44, left: 0, right: 0,
        bottom: isMyTurn ? 164 : 0,
        transition: 'bottom 0.3s ease',
      }}>
        <PokerTable
          players={players}
          myPlayerId={playerId}
          dealerIndex={publicState?.dealerIndex ?? 0}
          communityCards={publicState?.communityCards ?? []}
          pot={publicState?.pot ?? 0}
          sidePots={publicState?.sidePots ?? []}
          phase={publicState?.phase}
          activePlayerId={bettingRound?.currentPlayerId}
          actionInfo={myTurnInfo}
          myCards={myCards}
          lastActions={lastActions}
        />
      </div>

      {/* ── Betting controls ─────────────────────────────────────────────── */}
      <BettingControls
        bettingRound={bettingRound}
        myPlayer={myPlayer}
        onAction={handleAction}
        visible={isMyTurn}
      />

      {/* ── Chat ──────────────────────────────────────────────────────────── */}
      <ChatPanel
        onSendMessage={onSendChat}
        playerName={playerName}
      />

      {/* ── Winner overlay ────────────────────────────────────────────────── */}
      {showWinner && lastWinners.length > 0 && (
        <WinnerOverlay
          winners={lastWinners}
          players={players}
          onClose={() => dispatch({ type: 'HIDE_WINNER' })}
        />
      )}
    </div>
  )
}

function PhaseTag({ phase }) {
  const colors = {
    preflop: '#1a5276', flop: '#1e5631',
    turn: '#7d6608', river: '#6c3483', showdown: '#922b21',
  }
  if (!phase || phase === 'waiting' || phase === 'idle') return null
  return (
    <div style={{
      padding: '2px 8px', borderRadius: 4,
      background: `${colors[phase] ?? 'rgba(255,255,255,0.08)'}44`,
      border: `1px solid ${colors[phase] ?? 'rgba(255,255,255,0.1)'}`,
      color: '#fff', fontSize: 10,
      fontFamily: 'var(--font-body)', fontWeight: 600,
      letterSpacing: '0.06em', textTransform: 'uppercase',
    }}>
      {phase}
    </div>
  )
}
