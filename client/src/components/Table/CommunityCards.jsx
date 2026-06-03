/**
 * components/Table/CommunityCards.jsx
 * The board — flop/turn/river + pot display.
 */
import React from 'react'
import PlayingCard from '../UI/PlayingCard'
import { formatChips } from '../../utils/cardHelpers'

const PHASE_LABELS = {
  preflop: 'Pre-Flop',
  flop: 'The Flop',
  turn: 'The Turn',
  river: 'The River',
  showdown: 'Showdown',
}

export default function CommunityCards({ communityCards = [], pot = 0, sidePots = [], phase }) {
  const totalPot = sidePots.length > 0
    ? sidePots.reduce((s, p) => s + p.amount, 0)
    : pot

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
      zIndex: 15,
      position: 'relative',
    }}>
      {/* Phase label */}
      {phase && PHASE_LABELS[phase] && (
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 11,
          letterSpacing: '0.15em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
        }}>
          {PHASE_LABELS[phase]}
        </div>
      )}

      {/* Community cards */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {Array.from({ length: 5 }).map((_, i) => {
          const card = communityCards[i]
          return card
            ? <PlayingCard key={i} card={card} size="lg" delay={i * 120} />
            : (
              <div key={i} style={{
                width: 68, height: 96,
                borderRadius: 6,
                border: '1.5px dashed rgba(255,255,255,0.08)',
                background: 'rgba(0,0,0,0.15)',
              }} />
            )
        })}
      </div>

      {/* Pot */}
      {totalPot > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(201,168,76,0.25)',
            borderRadius: 20,
            padding: '4px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            animation: 'potPop 0.3s ease',
          }}>
            <span style={{ fontSize: 14 }}>🪙</span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              color: 'var(--gold-light)',
              fontWeight: 500,
              letterSpacing: '0.05em',
            }}>
              {formatChips(totalPot)}
            </span>
          </div>

          {/* Side pots breakdown */}
          {sidePots.length > 1 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              {sidePots.map((sp, i) => (
                <div key={i} style={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  background: 'rgba(0,0,0,0.4)',
                  padding: '2px 8px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  {i === 0 ? 'Main' : `Side ${i}`}: {formatChips(sp.amount)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
