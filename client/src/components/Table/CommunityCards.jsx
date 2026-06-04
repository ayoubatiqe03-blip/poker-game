/**
 * components/Table/CommunityCards.jsx
 * Board cards with glowing empty slots and chip-stack pot display.
 */
import React from 'react'
import PlayingCard from '../UI/PlayingCard'
import { formatChips } from '../../utils/cardHelpers'

const PHASE_LABELS = {
  preflop:  'Pre-Flop',
  flop:     'The Flop',
  turn:     'The Turn',
  river:    'The River',
  showdown: 'Showdown',
}

export default function CommunityCards({ communityCards = [], pot = 0, sidePots = [], phase }) {
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
          color: 'rgba(255,255,255,0.3)',
          textTransform: 'uppercase',
        }}>
          {PHASE_LABELS[phase]}
        </div>
      )}

      {/* Community cards row */}
      <div style={{ display: 'flex', gap: 'clamp(4px, 0.8vw, 9px)', alignItems: 'center' }}>
        {Array.from({ length: 5 }).map((_, i) => {
          const card = communityCards[i]
          return card ? (
            <PlayingCard key={i} card={card} size="lg" delay={i * 110} />
          ) : (
            <div key={i} style={{
              width: 70, height: 98,
              borderRadius: 8,
              border: '1.5px dashed rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.18)',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)',
            }} />
          )
        })}
      </div>

      {/* Pot display */}
      {totalPot > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          {/* Main pot pill */}
          <div style={{
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(201,168,76,0.3)',
            borderRadius: 24,
            padding: '5px 18px',
            display: 'flex', alignItems: 'center', gap: 8,
            animation: 'potPop 0.35s cubic-bezier(0.22,1.1,0.58,1)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}>
            {/* Mini chip stack visual */}
            <div style={{ display: 'flex', gap: 1 }}>
              {[['#c0392b','#6c2f8a','#1a6ea8'].slice(0, Math.min(3, Math.ceil(totalPot/200)+1))].flat().map((c, i) => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: c,
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                }} />
              ))}
            </div>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(12px,1.8vw,15px)',
              color: 'var(--gold-light)',
              fontWeight: 500,
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
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  background: 'rgba(0,0,0,0.45)',
                  padding: '2px 9px',
                  borderRadius: 12,
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
}
