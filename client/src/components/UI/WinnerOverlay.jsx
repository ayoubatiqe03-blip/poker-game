/**
 * components/UI/WinnerOverlay.jsx
 *
 * Improved: CSS confetti particles, card fan reveal, gold shimmer.
 */
import React, { useEffect, useMemo } from 'react'
import PlayingCard from './PlayingCard'
import { formatChips } from '../../utils/cardHelpers'

const CONFETTI_COLORS = ['#c9a84c','#e8cb7a','#f5e9c0','#1a8449','#1a6ea8','#c0392b','#fff']

function ConfettiPiece({ color, left, delay, duration, size }) {
  return (
    <div style={{
      position: 'absolute',
      top: -20,
      left: `${left}%`,
      width: size,
      height: size * 0.5,
      background: color,
      borderRadius: 2,
      animation: `confettiFall ${duration}ms ${delay}ms ease-in both`,
      zIndex: 110,
      pointerEvents: 'none',
    }} />
  )
}

export default function WinnerOverlay({ winners = [], players = [], onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 7000)
    return () => clearTimeout(t)
  }, [onClose])

  const confetti = useMemo(() => Array.from({ length: 28 }, (_, i) => ({
    id:       i,
    color:    CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left:     Math.random() * 90 + 5,
    delay:    Math.random() * 600,
    duration: 1400 + Math.random() * 1000,
    size:     6 + Math.random() * 6,
  })), [])

  const getName = (id) => players.find(p => p.id === id)?.name ?? 'Player'
  const isSplit = winners.length > 1

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.78)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.35s ease',
      }}
    >
      {/* Confetti */}
      {confetti.map(c => <ConfettiPiece key={c.id} {...c} />)}

      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg, #1c0f06 0%, #0e0804 100%)',
          border: '1px solid rgba(201,168,76,0.6)',
          borderRadius: 18,
          padding: 'clamp(20px,4vw,36px) clamp(24px,5vw,48px)',
          textAlign: 'center',
          maxWidth: 520,
          width: '92%',
          animation: 'winnerPop 0.5s cubic-bezier(0.22,1.1,0.58,1) both, winGlow 2.5s ease-in-out 0.5s infinite',
          boxShadow: '0 0 80px rgba(201,168,76,0.2), 0 20px 60px rgba(0,0,0,0.7)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Inner gold glow blob */}
        <div style={{
          position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
          width: 200, height: 200,
          background: 'radial-gradient(ellipse, rgba(201,168,76,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ fontSize: 44, marginBottom: 6, filter: 'drop-shadow(0 0 12px rgba(201,168,76,0.5))' }}>
          {isSplit ? '🤝' : '🏆'}
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(22px,5vw,32px)',
          fontWeight: 700,
          marginBottom: 6,
          background: 'linear-gradient(135deg, var(--gold-dark) 0%, var(--gold-pale) 50%, var(--gold) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {isSplit ? 'Split Pot!' : 'Winner!'}
        </h2>

        {winners.map((w, i) => (
          <div key={i} style={{
            marginBottom: 18,
            animation: `fadeIn 0.4s ${i * 150}ms ease both`,
          }}>
            <div style={{
              fontSize: 'clamp(16px,3vw,22px)',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              color: 'var(--gold-light)',
              marginBottom: 4,
            }}>
              {getName(w.playerId)}
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.45)',
              fontSize: 12,
              marginBottom: 10,
              fontFamily: 'var(--font-body)',
              letterSpacing: '0.05em',
            }}>
              {w.handName} &nbsp;·&nbsp; won&nbsp;
              <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>
                {formatChips(w.potAmount)}
              </span>
              &nbsp;chips
            </div>

            {/* Winning cards fanned */}
            {w.bestCards?.length > 0 && (
              <div style={{
                display: 'flex', gap: 'clamp(3px,1vw,7px)',
                justifyContent: 'center', flexWrap: 'wrap',
              }}>
                {w.bestCards.map((card, j) => (
                  <div key={j} style={{
                    animation: `winnerCardReveal 0.4s ${j * 70}ms cubic-bezier(0.22,1.1,0.58,1) both`,
                  }}>
                    <PlayingCard card={card} size="md" highlight animate={false} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <div style={{
          marginTop: 14,
          color: 'rgba(255,255,255,0.2)',
          fontSize: 11,
          fontFamily: 'var(--font-body)',
          letterSpacing: '0.08em',
        }}>
          CLICK TO CONTINUE
        </div>
      </div>
    </div>
  )
}
