/**
 * components/Player/PlayerSeat.jsx
 *
 * Fix: ActionTimer receives startedAt from actionInfo (from server's
 * game:actionRequired event) so the countdown is accurate even when
 * the page was loaded mid-hand.
 */
import React from 'react'
import PlayingCard from '../UI/PlayingCard'
import ActionTimer from '../UI/ActionTimer'
import { formatChips } from '../../utils/cardHelpers'

const ACTION_LABELS = {
  fold:  { label: 'FOLD',    color: '#922b21' },
  call:  { label: 'CALL',    color: '#1a5276' },
  check: { label: 'CHECK',   color: '#1e8449' },
  raise: { label: 'RAISE',   color: '#7d6608' },
  allin: { label: 'ALL IN',  color: '#6c3483' },
}

export default function PlayerSeat({
  player, seatNumber, isMe, isActive, isDealer,
  myCards = [], actionInfo = null, lastAction = null,
  style = {},
}) {
  if (!player) {
    return (
      <div style={{ ...seatWrap, ...style, opacity: 0.25 }}>
        <div style={emptyStyle}>
          <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>Empty</span>
        </div>
      </div>
    )
  }

  const { isFolded, isAllIn, isEliminated } = player
  const cards = isMe ? myCards : Array(player.cardCount || 2).fill(null)

  return (
    <div style={{
      ...seatWrap, ...style,
      filter: (isFolded || isEliminated) ? 'grayscale(0.7) opacity(0.5)' : 'none',
      transition: 'filter 0.4s ease',
    }}>
      {/* Active pulse ring */}
      {isActive && (
        <div style={{
          position: 'absolute', inset: -6, borderRadius: 14,
          border: '2px solid var(--gold)',
          animation: 'pulse 1.2s ease-in-out infinite',
          pointerEvents: 'none', zIndex: 10,
        }} />
      )}

      {/* Dealer button */}
      {isDealer && (
        <div style={{
          position: 'absolute', top: -10, right: -10,
          width: 22, height: 22, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))',
          border: '1.5px solid var(--gold-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 8, fontWeight: 700, color: '#1a0e06',
          boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
          zIndex: 20, letterSpacing: '0.05em',
        }}>
          D
        </div>
      )}

      {/* Cards (above seat for hero, below for others) */}
      <div style={{
        display: 'flex', gap: 4, justifyContent: 'center',
        order: seatNumber === 1 ? -1 : 1,
        marginBottom: seatNumber === 1 ? 6 : 0,
        marginTop: seatNumber === 1 ? 0 : 6,
      }}>
        {cards.map((card, i) => (
          <PlayingCard
            key={i}
            card={isMe ? card : null}
            faceDown={!isMe || !card || card?.rank === '?'}
            size="sm"
            delay={i * 150}
          />
        ))}
      </div>

      {/* Seat panel */}
      <div style={{
        background: isMe
          ? 'linear-gradient(160deg, rgba(12,8,4,0.96) 0%, rgba(20,12,6,0.96) 100%)'
          : 'linear-gradient(160deg, rgba(8,5,2,0.9) 0%, rgba(15,9,4,0.9) 100%)',
        border: isMe
          ? '1px solid rgba(201,168,76,0.4)'
          : isActive
            ? '1px solid rgba(201,168,76,0.55)'
            : '1px solid rgba(201,168,76,0.12)',
        borderRadius: 10,
        padding: '8px 10px',
        minWidth: 96,
        position: 'relative',
        boxShadow: isMe
          ? '0 4px 20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)'
          : '0 2px 12px rgba(0,0,0,0.4)',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600,
          color: isMe ? 'var(--gold-light)' : 'var(--text-primary)',
          marginBottom: 2, letterSpacing: '0.03em',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          maxWidth: 84,
        }}>
          {isMe ? `★ ${player.name}` : player.name}
        </div>

        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--gold)', marginBottom: 4, letterSpacing: '0.04em',
        }}>
          {formatChips(player.chips)}
        </div>

        {isAllIn   && <Badge color="#6c3483">ALL IN</Badge>}
        {isFolded  && <Badge color="#922b21">FOLDED</Badge>}
        {isEliminated && <Badge color="#555">OUT</Badge>}
        {lastAction && ACTION_LABELS[lastAction] && (
          <Badge color={ACTION_LABELS[lastAction].color} animate>
            {ACTION_LABELS[lastAction].label}
          </Badge>
        )}
      </div>

      {/* Turn timer */}
      {isActive && actionInfo && (
        <div style={{ position: 'absolute', top: -52, left: '50%', transform: 'translateX(-50%)' }}>
          <ActionTimer
            timeoutMs={actionInfo.timeoutMs ?? 30000}
            startedAt={actionInfo.startedAt}
          />
        </div>
      )}
    </div>
  )
}

function Badge({ color, children, animate }) {
  return (
    <div style={{
      display: 'inline-block',
      padding: '1px 6px', borderRadius: 3,
      background: color,
      color: 'rgba(255,255,255,0.9)',
      fontSize: 9, fontFamily: 'var(--font-body)',
      fontWeight: 600, letterSpacing: '0.08em',
      marginTop: 2,
      animation: animate ? 'fadeIn 0.2s ease' : 'none',
    }}>
      {children}
    </div>
  )
}

const seatWrap = {
  position: 'absolute',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  zIndex: 20,
  transform: 'translate(-50%, -50%)',
}

const emptyStyle = {
  width: 80, height: 48,
  border: '1px dashed rgba(255,255,255,0.08)',
  borderRadius: 8,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}
