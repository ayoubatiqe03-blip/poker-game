/**
 * components/Player/PlayerSeat.jsx
 *
 * Now renders a visible ChipStack for each player's chip count,
 * displayed below/above their seat panel.
 * Active glow, dealer button, action badges all preserved.
 */
import React, { memo } from 'react'
import PlayingCard from '../UI/PlayingCard'
import ChipStack from '../UI/ChipStack'
import ActionTimer from '../UI/ActionTimer'
import { formatChips } from '../../utils/cardHelpers'

const ACTION_META = {
  fold:  { label: 'FOLD',    bg: '#7d2319', glow: '#c0392b' },
  call:  { label: 'CALL',    bg: '#14426a', glow: '#2471a3' },
  check: { label: 'CHECK',   bg: '#175e36', glow: '#1e8449' },
  raise: { label: 'RAISE',   bg: '#6b5507', glow: '#c9a84c' },
  allin: { label: 'ALL IN',  bg: '#5a2572', glow: '#9b59b6' },
}

const PlayerSeat = memo(function PlayerSeat({
  player, seatNumber, isMe, isActive, isDealer,
  myCards = [], actionInfo = null, lastAction = null,
  style = {},
}) {
  const isHero = seatNumber === 1

  // Empty seat
  if (!player) {
    return (
      <div style={{ ...seatBase, ...style, opacity: 0.18 }}>
        <div style={emptySlot} />
      </div>
    )
  }

  const { isFolded, isAllIn, isEliminated, chips } = player
  const dimmed = isFolded || isEliminated
  const cards  = isMe ? myCards : Array(player.cardCount || 2).fill(null)

  return (
    <div style={{
      ...seatBase, ...style,
      filter:     dimmed ? 'grayscale(0.75) opacity(0.45)' : 'none',
      transition: 'filter 0.4s',
    }}>
      {/* ── Active glow ────────────────────────────────────────────────── */}
      {isActive && (
        <>
          <div style={{
            position: 'absolute', inset: -18, borderRadius: 22,
            background: 'radial-gradient(ellipse at 50% 50%, rgba(201,168,76,0.2) 0%, transparent 68%)',
            animation: 'activePulse 1.4s ease-in-out infinite',
            pointerEvents: 'none', zIndex: 0,
          }} />
          <div style={{
            position: 'absolute', inset: -5, borderRadius: 14,
            border: '2px solid rgba(201,168,76,0.75)',
            boxShadow: '0 0 14px rgba(201,168,76,0.45), inset 0 0 8px rgba(201,168,76,0.1)',
            animation: 'seatGlow 1.4s ease-in-out infinite',
            pointerEvents: 'none', zIndex: 10,
          }} />
        </>
      )}

      {/* ── Dealer button ──────────────────────────────────────────────── */}
      {isDealer && (
        <div style={{
          position: 'absolute', top: -12, right: -12,
          width: 24, height: 24, borderRadius: '50%',
          background: 'linear-gradient(145deg, #eacf7e 0%, #c9a84c 55%, #8a6d28 100%)',
          border: '1.5px solid rgba(255,255,255,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 8, fontWeight: 800, color: '#1a0e06',
          fontFamily: 'var(--font-body)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.65), 0 0 6px rgba(201,168,76,0.4)',
          zIndex: 25, letterSpacing: '0.04em',
        }}>D</div>
      )}

      {/* ── Hole cards ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: isHero ? 4 : 3,
        justifyContent: 'center',
        order:       isHero ? -1 : 1,
        marginBottom: isHero ? 6 : 0,
        marginTop:    isHero ? 0 : 6,
      }}>
        {cards.map((card, i) => (
          <div key={i} style={isHero && cards.length === 2 ? {
            transform: i === 0
              ? 'rotate(-4deg) translateX(2px)'
              : 'rotate(4deg)  translateX(-2px)',
            transformOrigin: 'bottom center',
            zIndex: i,
            position: 'relative',
          } : {}}>
            <PlayingCard
              card={isMe ? card : null}
              faceDown={!isMe || !card || card?.rank === '?'}
              size={isHero ? 'md' : 'sm'}
              delay={i * 160}
            />
          </div>
        ))}
      </div>

      {/* ── Seat info panel ────────────────────────────────────────────── */}
      <div
        className="seat-panel"
        style={{
          background: isMe
            ? 'linear-gradient(160deg, rgba(16,10,5,0.97) 0%, rgba(22,14,7,0.97) 100%)'
            : 'linear-gradient(160deg, rgba(10,6,3,0.93) 0%, rgba(16,10,4,0.93) 100%)',
          border: isActive
            ? '1px solid rgba(201,168,76,0.7)'
            : isMe
              ? '1px solid rgba(201,168,76,0.35)'
              : '1px solid rgba(201,168,76,0.1)',
          borderRadius: 10,
          padding: '7px 10px 8px',
          minWidth: 96,
          position: 'relative', zIndex: 5,
          boxShadow: isMe
            ? '0 4px 20px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.06)'
            : '0 2px 12px rgba(0,0,0,0.5)',
          transition: 'border-color 0.3s, box-shadow 0.3s',
        }}
      >
        {/* Name */}
        <div
          className="seat-name"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 12, fontWeight: 700,
            color: isMe ? 'var(--gold-light)' : 'var(--text-primary)',
            marginBottom: 5,
            letterSpacing: '0.03em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            maxWidth: 86,
          }}
        >
          {isMe ? `★ ${player.name}` : player.name}
        </div>

        {/* ── Chip stack visual ─────────────────────────────────────── */}
        <div style={{ marginBottom: 3 }}>
          <ChipStack amount={chips} size="sm" showLabel={true} />
        </div>

        {/* Status badges */}
        {isAllIn     && <ActionBadge bg="#5a2572" glow="#9b59b6">ALL IN</ActionBadge>}
        {isFolded    && <ActionBadge bg="#7d2319" glow="#c0392b">FOLDED</ActionBadge>}
        {isEliminated && <ActionBadge bg="#333"   glow="#555">OUT</ActionBadge>}
        {lastAction && ACTION_META[lastAction] && (
          <ActionBadge bg={ACTION_META[lastAction].bg} glow={ACTION_META[lastAction].glow} pop>
            {ACTION_META[lastAction].label}
          </ActionBadge>
        )}
      </div>

      {/* ── Turn timer ─────────────────────────────────────────────────── */}
      {isActive && actionInfo && (
        <div style={{
          position: 'absolute', top: -56, left: '50%',
          transform: 'translateX(-50%)', zIndex: 30,
        }}>
          <ActionTimer
            timeoutMs={actionInfo.timeoutMs ?? 30000}
            startedAt={actionInfo.startedAt}
          />
        </div>
      )}
    </div>
  )
})

export default PlayerSeat

// ── Helpers ──────────────────────────────────────────────────────────────────

function ActionBadge({ bg, glow, children, pop }) {
  return (
    <div style={{
      display: 'inline-block',
      padding: '2px 7px', borderRadius: 4,
      background: `linear-gradient(135deg, ${bg} 0%, ${bg}cc 100%)`,
      border: `1px solid ${glow}55`,
      color: 'rgba(255,255,255,0.95)',
      fontSize: 9, fontFamily: 'var(--font-body)',
      fontWeight: 700, letterSpacing: '0.09em',
      marginTop: 2,
      boxShadow: `0 1px 6px ${glow}44`,
      animation: pop ? 'badgePop 0.3s cubic-bezier(0.22,1.1,0.58,1) both' : 'none',
    }}>
      {children}
    </div>
  )
}

const seatBase = {
  position: 'absolute',
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  zIndex: 20,
  transform: 'translate(-50%, -50%)',
}

const emptySlot = {
  width: 82, height: 46,
  border: '1px dashed rgba(255,255,255,0.07)',
  borderRadius: 9,
  background: 'rgba(0,0,0,0.1)',
}
