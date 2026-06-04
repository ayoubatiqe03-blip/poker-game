/**
 * components/Table/GameScreen.jsx
 *
 * Improved:
 *   - Sound effects on every player action
 *   - Mute button in HUD
 *   - Mobile-responsive HUD (collapses non-essential items)
 *   - Better phase tag styling
 *   - Chips conserved in HUD display
 */
import React, { useState, useCallback, useEffect, useRef } from 'react'
import PokerTable from './PokerTable'
import BettingControls from '../Controls/BettingControls'
import ChatPanel from '../Chat/ChatPanel'
import WinnerOverlay from '../UI/WinnerOverlay'
import { MuteButton, useSounds } from '../UI/SoundManager'
import { useGame } from '../../context/GameContext'
import { formatChips } from '../../utils/cardHelpers'

const PHASE_COLORS = {
  preflop: '#14426a',
  flop:    '#175e36',
  turn:    '#6b5507',
  river:   '#5a2572',
  showdown:'#7d2319',
}

export default function GameScreen({ onAction, onSendChat, onLeave }) {
  const { state, dispatch } = useGame()
  const [lastActions, setLastActions] = useState({})
  const { play, muted, toggleMute }   = useSounds()
  const prevPhaseRef = useRef(null)
  const prevActiveRef = useRef(null)

  const { publicState, myCards, playerId, lastWinners, showWinner, playerName, actionRequired } = state
  const players      = publicState?.players ?? []
  const myPlayer     = players.find(p => p.id === playerId)
  const bettingRound = publicState?.bettingRound ?? null
  const isMyTurn     = bettingRound?.currentPlayerId === playerId
  const phase        = publicState?.phase
  const myTurnInfo   = isMyTurn ? actionRequired : null

  // Sound: new community card dealt
  useEffect(() => {
    if (phase && phase !== prevPhaseRef.current && ['flop','turn','river'].includes(phase)) {
      play('deal')
    }
    prevPhaseRef.current = phase
  }, [phase, play])

  // Sound: my turn starts
  useEffect(() => {
    const cur = bettingRound?.currentPlayerId
    if (cur && cur !== prevActiveRef.current && cur === playerId) {
      play('chip')
    }
    prevActiveRef.current = cur
  }, [bettingRound?.currentPlayerId, playerId, play])

  // Sound: winner announced
  useEffect(() => {
    if (showWinner) play('win')
  }, [showWinner, play])

  const handleAction = useCallback((action, amount) => {
    // Action sounds
    if (action === 'fold')  play('fold')
    else if (action === 'check') play('check')
    else play('chip')

    setLastActions(prev => ({ ...prev, [playerId]: action }))
    setTimeout(() => setLastActions(prev => {
      const n = { ...prev }; delete n[playerId]; return n
    }), 2200)
    onAction?.(action, amount)
  }, [onAction, playerId, play])

  const controlsHeight = isMyTurn ? (bettingRound && 168) : 0

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: `
        radial-gradient(ellipse 80% 60% at 50% 50%, rgba(10,28,14,0.6) 0%, transparent 70%),
        radial-gradient(ellipse 40% 40% at 15% 85%, rgba(60,20,5,0.4) 0%, transparent 60%),
        radial-gradient(ellipse 40% 40% at 85% 15%, rgba(60,20,5,0.3) 0%, transparent 60%),
        #080503
      `,
    }}>
      {/* ── HUD bar ───────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 46,
        background: 'rgba(3,2,1,0.92)',
        borderBottom: '1px solid rgba(201,168,76,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 10px 0 14px',
        zIndex: 40,
        backdropFilter: 'blur(10px)',
        gap: 8,
      }}>
        {/* Left: branding + room + phase */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
            background: 'linear-gradient(135deg, var(--gold-dark), var(--gold-light))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            🃏 Royal Flush
          </span>

          <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--gold)', letterSpacing: '0.15em', flexShrink: 0,
          }}>
            {state.roomCode}
          </span>

          {/* Phase tag */}
          {phase && PHASE_COLORS[phase] && (
            <div style={{
              padding: '2px 8px', borderRadius: 4, flexShrink: 0,
              background: `${PHASE_COLORS[phase]}55`,
              border: `1px solid ${PHASE_COLORS[phase]}`,
              color: '#fff', fontSize: 10,
              fontFamily: 'var(--font-body)', fontWeight: 700,
              letterSpacing: '0.07em', textTransform: 'uppercase',
            }}>
              {phase}
            </div>
          )}

          {/* Hand counter — hidden on very small screens via overflow */}
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.2)',
            overflow: 'hidden', whiteSpace: 'nowrap',
          }}>
            #{publicState?.handNumber ?? 0}
          </span>
        </div>

        {/* Right: chips + mute + leave */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {myPlayer && (
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gold)',
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.2)',
              borderRadius: 6, padding: '2px 10px',
              whiteSpace: 'nowrap',
            }}>
              🪙 {formatChips(myPlayer.chips)}
            </div>
          )}

          <MuteButton muted={muted} onToggle={toggleMute} />

          <button
            onClick={onLeave}
            style={{
              padding: '4px 11px', borderRadius: 6,
              background: 'rgba(120,35,25,0.25)',
              border: '1px solid rgba(192,57,43,0.45)',
              color: '#e55a4a', fontSize: 11,
              cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 500,
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.target.style.background = 'rgba(120,35,25,0.5)' }}
            onMouseLeave={e => { e.target.style.background = 'rgba(120,35,25,0.25)' }}
          >
            Leave
          </button>
        </div>
      </div>

      {/* ── Table area ────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        top: 46, left: 0, right: 0,
        bottom: controlsHeight,
        transition: 'bottom 0.3s cubic-bezier(0.22,1.1,0.58,1)',
      }}>
        <PokerTable
          players={players}
          myPlayerId={playerId}
          dealerIndex={publicState?.dealerIndex ?? 0}
          communityCards={publicState?.communityCards ?? []}
          pot={publicState?.pot ?? 0}
          sidePots={publicState?.sidePots ?? []}
          phase={phase}
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
      <ChatPanel onSendMessage={onSendChat} playerName={playerName} />

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
