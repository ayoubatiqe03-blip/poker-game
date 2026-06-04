/**
 * components/Table/CommunityCards.jsx
 *
 * Uses ChipStack for pot display instead of tiny dots.
 * Empty card slots have subtle inner glow.
 */
import React, { memo } from 'react'
import PlayingCard from '../UI/PlayingCard'
import ChipStack from '../UI/ChipStack'
import { formatChips } from '../../utils/cardHelpers'

const PHASE_LABELS = {
  preflop:  'Pre-Flop',
  flop:     'The Flop',
  turn:     'The Turn',
  river:    'The River',
  showdown: 'Showdown',
}

const CommunityCards = memo(function CommunityCards({
  communityCards = [], pot = 0, sidePots = [], phase,
}) {
  const totalPot = sidePots.length > 0
    ? sidePots.reduce((s, p) => s + p.amount, 0)
    : pot

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 10, zIndex: 15, position: 'relative',
    }}>
      {/* Phase label */}
      {phase && PHASE_LABELS[phase] && (
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(9px,1.4vw,11px)',
          letterSpacing: '0.18em',
          color: 'rgba(255,255,255,0.28)',
          textTransform: 'uppercase',
        }}>
          {PHASE_LABELS[phase]}
        </div>
      )}

      {/* Community card slots */}
      <div style={{ display: 'flex', gap: 'clamp(4px,0.8vw,8px)', alignItems: 'flex-end' }}>
        {Array.from({ length: 5 }).map((_, i) => {
          const card = communityCards[i]
          return card ? (
            <PlayingCard key={i} card={card} size="lg" delay={i * 110} />
          ) : (
            <div key={i} style={{
              width: 72, height: 100, borderRadius: 7,
              border: '1.5px dashed rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.2)',
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.25)',
            }} />
          )
        })}
      </div>

      {/* Pot with real chip stack */}
      {totalPot > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          {/* Chip stack + label */}
          <div style={{
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(201,168,76,0.28)',
            borderRadius: 28,
            padding: '7px 18px 7px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
            animation: 'potPop 0.35s cubic-bezier(0.22,1.1,0.58,1)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}>
            <ChipStack amount={totalPot} size="sm" showLabel={false} />
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(13px,1.9vw,16px)',
              color: 'var(--gold-light)',
              fontWeight: 600,
              letterSpacing: '0.06em',
            }}>
              {formatChips(totalPot)}
            </span>
          </div>

          {/* Side pot breakdown */}
          {sidePots.length > 1 && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center' }}>
              {sidePots.map((sp, i) => (
                <div key={i} style={{
                  fontSize: 10, color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  background: 'rgba(0,0,0,0.45)',
                  padding: '2px 9px', borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.07)',
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
})

export default CommunityCards
