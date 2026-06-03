/**
 * components/UI/WinnerOverlay.jsx
 */
import React, { useEffect } from 'react'
import PlayingCard from './PlayingCard'
import { formatChips } from '../../utils/cardHelpers'

export default function WinnerOverlay({ winners = [], players = [], onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000)
    return () => clearTimeout(t)
  }, [onClose])

  const getName = (id) => players.find(p => p.id === id)?.name ?? 'Player'

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg, #1a0e06 0%, #0d0804 100%)',
          border: '1px solid var(--gold)',
          borderRadius: 16,
          padding: '32px 40px',
          textAlign: 'center',
          maxWidth: 480,
          width: '90%',
          animation: 'winGlow 2s ease-in-out infinite',
          boxShadow: '0 0 60px rgba(201,168,76,0.3)',
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 8 }}>🏆</div>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28,
          marginBottom: 4,
          background: 'linear-gradient(135deg, var(--gold-dark), var(--gold-light))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {winners.length > 1 ? 'Split Pot!' : 'Winner!'}
        </h2>

        {winners.map((w, i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--gold-light)', marginBottom: 4 }}>
              {getName(w.playerId)}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>
              {w.handName} · Won {formatChips(w.potAmount)} chips
            </div>
            {w.bestCards?.length > 0 && (
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                {w.bestCards.map((card, j) => (
                  <PlayingCard key={j} card={card} size="md" highlight delay={j * 80} />
                ))}
              </div>
            )}
          </div>
        ))}

        <div style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: 12 }}>
          Click anywhere to continue
        </div>
      </div>
    </div>
  )
}
