/**
 * components/Player/PlayerSeat.jsx
 *
 * Improved: multi-ring active glow, winner gold shimmer, action badge pop,
 *           responsive sizing via CSS classes, better card positioning.
 */
import React from 'react'
import PlayingCard from '../UI/PlayingCard'
import ActionTimer from '../UI/ActionTimer'
import { formatChips } from '../../utils/cardHelpers'

const ACTION_META = {
  fold:  { label: 'FOLD',    bg: '#7d2319', glow: '#c0392b' },
  call:  { label: 'CALL',    bg: '#14426a', glow: '#2471a3' },
  check: { label: 'CHECK',   bg: '#175e36', glow: '#1e8449' },
  raise: { label: 'RAISE',   bg: '#6b5507', glow: '#c9a84c' },
  allin: { label: 'ALL IN',  bg: '#5a2572', glow: '#9b59b6' },
}

export default function PlayerSeat({
  player, seatNumber, isMe, isActive, isDealer,
  myCards = [], actionInfo = null, lastAction = null,
  style = {},
}) {
  const isHero   = seatNumber === 1  // local player always seat 1

  if (!player) {
    return (
      <div style={{ ...seatBase, ...style, opacity: 0.2 }}>
        <div style={emptySlot} />
      </div>
    )
  }

  const { isFolded, isAllIn, isEliminated } = player
  const dimmed = isFolded || isEliminated

  // Cards — hero sees real cards, others see backs
  const cards = isMe ? myCards : Array(player.cardCount || 2).fill(null)

  return (
    <div style={{ ...seatBase, ...style, filter: dimmed ? 'grayscale(0.75) opacity(0.45)' : 'none', transition: 'filter 0.4s' }}>

      {/* ── Active glow layers ─────────────────────────────────────────────── */}
      {isActive && (
        <>
          {/* Outer diffuse halo */}
          <div style={{
            position: 'absolute',
            inset: -16,
            borderRadius: 20,
            background: 'radial-gradient(ellipse at 50% 50%, rgba(201,168,76,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 0,
            animation: 'activePulse 1.4s ease-in-out infinite',
          }} />
          {/* Inner ring */}
          <div style={{
            position: 'absolute',
            inset: -5,
            borderRadius: 14,
            border: '2px solid rgba(201,168,76,0.7)',
            boxShadow: '0 0 12px rgba(201,168,76,0.4), inset 0 0 8px rgba(201,168,76,0.1)',
            pointerEvents: 'none',
            zIndex: 10,
            animation: 'seatGlow 1.4s ease-in-out infinite',
          }} />
        </>
      )}

      {/* ── Dealer button ─────────────────────────────────────────────────── */}
      {isDealer && (
        <div style={{
          position: 'absolute', top: -11, right: -11,
          width: 24, height: 24, borderRadius: '50%',
          background: 'linear-gradient(145deg, #e8cb7a 0%, #c9a84c 50%, #8a6d28 100%)',
          border: '1.5px solid rgba(255,255,255,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 8, fontWeight: 800, color: '#1a0e06',
          fontFamily: 'var(--font-body)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.6), 0 0 6px rgba(201,168,76,0.4)',
          zIndex: 25, letterSpacing: '0.04em',
        }}>D</div>
      )}

      {/* ── Hole cards ────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 3, justifyContent: 'center',
        order: isHero ? -1 : 1,
        marginBottom: isHero ? 5 : 0,
        marginTop:    isHero ? 0 : 5,
        // Slight fan for hero cards
        ...(isHero && myCards.length === 2 ? {
          position: 'relative',
        } : {}),
      }}>
        {cards.map((card, i) => (
          <div key={i} style={isHero && cards.length === 2 ? {
            transform: i === 0 ? 'rotate(-4deg) translateX(2px)' : 'rotate(4deg) translateX(-2px)',
            transformOrigin: 'bottom center',
            zIndex: i === 0 ? 1 : 2,
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

      {/* ── Seat info panel ───────────────────────────────────────────────── */}
      <div
        className="seat-panel"
        style={{
          background: isMe
            ? 'linear-gradient(160deg, rgba(15,10,5,0.97) 0%, rgba(22,14,7,0.97) 100%)'
            : 'linear-gradient(160deg, rgba(10,6,3,0.92) 0%, rgba(16,10,4,0.92) 100%)',
          border: isActive
            ? '1px solid rgba(201,168,76,0.65)'
            : isMe
              ? '1px solid rgba(201,168,76,0.35)'
              : '1px solid rgba(201,168,76,0.1)',
          borderRadius: 10,
          padding: '8px 11px',
          minWidth: 96,
          position: 'relative',
          zIndex: 5,
          boxShadow: isMe
            ? '0 4px 24px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)'
            : '0 2px 14px rgba(0,0,0,0.5)',
          transition: 'border-color 0.3s, box-shadow 0.3s',
        }}
      >
        {/* Name */}
        <div
          className="seat-name"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 12,
            fontWeight: 600,
            color: isMe ? 'var(--gold-light)' : 'var(--text-primary)',
            marginBottom: 2,
            letterSpacing: '0.03em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 86,
          }}
        >
          {isMe ? `★ ${player.name}` : player.name}
        </div>

        {/* Chip count */}
        <div
          className="seat-chips"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--gold)',
            letterSpacing: '0.04em',
            marginBottom: 3,
          }}
        >
          {formatChips(player.chips)}
        </div>

        {/* Status badges */}
        {isAllIn    && <ActionBadge bg="#5a2572" glow="#9b59b6">ALL IN</ActionBadge>}
        {isFolded   && <ActionBadge bg="#7d2319" glow="#c0392b">FOLDED</ActionBadge>}
        {isEliminated && <ActionBadge bg="#333" glow="#555">OUT</ActionBadge>}
        {lastAction && ACTION_META[lastAction] && (
          <ActionBadge bg={ACTION_META[lastAction].bg} glow={ACTION_META[lastAction].glow} pop>
            {ACTION_META[lastAction].label}
          </ActionBadge>
        )}
      </div>

      {/* ── Turn timer ────────────────────────────────────────────────────── */}
      {isActive && actionInfo && (
        <div style={{ position: 'absolute', top: -54, left: '50%', transform: 'translateX(-50%)', zIndex: 30 }}>
          <ActionTimer timeoutMs={actionInfo.timeoutMs ?? 30000} startedAt={actionInfo.startedAt} />
        </div>
      )}
    </div>
  )
}

function ActionBadge({ bg, glow, children, pop }) {
  return (
    <div style={{
      display: 'inline-block',
      padding: '2px 7px',
      borderRadius: 4,
      background: `linear-gradient(135deg, ${bg} 0%, ${bg}cc 100%)`,
      border: `1px solid ${glow}55`,
      color: 'rgba(255,255,255,0.95)',
      fontSize: 9,
      fontFamily: 'var(--font-body)',
      fontWeight: 700,
      letterSpacing: '0.09em',
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
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  zIndex: 20,
  transform: 'translate(-50%, -50%)',
}

const emptySlot = {
  width: 82, height: 46,
  border: '1px dashed rgba(255,255,255,0.07)',
  borderRadius: 9,
  background: 'rgba(0,0,0,0.1)',
}
