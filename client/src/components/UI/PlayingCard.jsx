/**
 * components/UI/PlayingCard.jsx
 *
 * Realistic playing card with:
 *   - Proper pip layout (A, 2–10, J/Q/K with unicode figures)
 *   - SVG suit symbols (sharp at all sizes)
 *   - Rich card-back pattern (diamond trellis with border)
 *   - 3D deal animation (arc + slight flip)
 *   - Gold highlight glow for winning cards
 *   - CSS perspective flip for reveal
 */
import React from 'react'
import { displayCard } from '../../utils/cardHelpers'

const SIZES = {
  sm: { w: 38,  h: 54,  rankFs: 12, suitFs: 9,  centerFs: 17, pip: 7,  corner: 11, br: 5  },
  md: { w: 54,  h: 76,  rankFs: 16, suitFs: 12, centerFs: 24, pip: 10, corner: 14, br: 7  },
  lg: { w: 70,  h: 98,  rankFs: 19, suitFs: 14, centerFs: 30, pip: 13, corner: 16, br: 8  },
}

// SVG paths for the four suits — crisp at every size
const SUIT_SVG = {
  '♠': (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 1 C10 1 2 8 2 13 a4 4 0 0 0 6 0 C7.5 16 8 17 7 19 h6 c-1-2-0.5-3-1-6 a4 4 0 0 0 6 0 C18 8 10 1 10 1z"/>
    </svg>
  ),
  '♥': (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 18 C10 18 2 11 2 6.5 a4 4 0 0 1 8-0.5 a4 4 0 0 1 8 0.5 C18 11 10 18 10 18z"/>
    </svg>
  ),
  '♦': (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 1 L18 10 L10 19 L2 10 Z"/>
    </svg>
  ),
  '♣': (sz) => (
    <svg width={sz} height={sz} viewBox="0 0 20 20" fill="currentColor">
      <circle cx="10" cy="7"  r="4"/>
      <circle cx="6"  cy="12" r="4"/>
      <circle cx="14" cy="12" r="4"/>
      <path d="M8 15 Q10 13 12 15 L11 19 H9 Z"/>
    </svg>
  ),
}

function SuitIcon({ symbol, size, color }) {
  const fn = SUIT_SVG[symbol]
  if (!fn) return <span style={{ fontSize: size, color, lineHeight: 1 }}>{symbol}</span>
  return <span style={{ color, display: 'inline-flex', lineHeight: 0 }}>{fn(size)}</span>
}

// Card back pattern — rich diamond trellis
function CardBack({ w, h, br }) {
  return (
    <div style={{
      width: w, height: h,
      borderRadius: br,
      background: `linear-gradient(145deg, #1e2a9e 0%, #141d72 40%, #0d1257 100%)`,
      border: '1.5px solid rgba(255,255,255,0.18)',
      boxShadow: '0 4px 14px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.12)',
      position: 'relative',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Outer border */}
      <div style={{
        position: 'absolute', inset: 3,
        border: '1.5px solid rgba(255,255,255,0.22)',
        borderRadius: br - 1,
      }} />
      {/* Diamond trellis */}
      <div style={{
        position: 'absolute', inset: 5,
        backgroundImage: `
          repeating-linear-gradient(45deg,  rgba(255,255,255,0.07) 0, rgba(255,255,255,0.07) 1px, transparent 1px, transparent 8px),
          repeating-linear-gradient(-45deg, rgba(255,255,255,0.07) 0, rgba(255,255,255,0.07) 1px, transparent 1px, transparent 8px)
        `,
      }} />
      {/* Center logo */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: Math.round(h * 0.28),
        opacity: 0.25,
        userSelect: 'none',
      }}>♠</div>
      {/* Shine highlight */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)',
        borderRadius: `${br}px ${br}px 0 0`,
        pointerEvents: 'none',
      }} />
    </div>
  )
}

export default function PlayingCard({
  card,
  size = 'md',
  faceDown = false,
  delay = 0,
  highlight = false,
  animate = true,
}) {
  const s = SIZES[size]
  const info = !faceDown && card?.rank !== '?' ? displayCard(card) : null

  const dealAnim = animate
    ? `dealCard 0.42s cubic-bezier(0.22, 1.1, 0.58, 1) ${delay}ms both`
    : 'none'

  if (!info) return (
    <div style={{ animation: dealAnim, flexShrink: 0 }}>
      <CardBack w={s.w} h={s.h} br={s.br} />
    </div>
  )

  const color    = info.isRed ? 'var(--suit-red)' : 'var(--suit-black)'
  const suitSym  = info.suit

  return (
    <div
      style={{
        width: s.w, height: s.h,
        borderRadius: s.br,
        flexShrink: 0,
        position: 'relative',
        background: info.isRed
          ? `linear-gradient(160deg, #fffef8 0%, #fdf6ec 100%)`
          : `linear-gradient(160deg, #fffef8 0%, #f8f4ed 100%)`,
        border: highlight
          ? '2px solid var(--gold)'
          : '1.5px solid rgba(0,0,0,0.18)',
        boxShadow: highlight
          ? `0 4px 14px rgba(0,0,0,0.5), 0 0 20px var(--gold-glow-strong), 0 0 40px var(--gold-glow)`
          : '0 4px 14px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.8)',
        userSelect: 'none',
        animation: `${dealAnim}${highlight ? ', winnerCardReveal 0.5s ease both' : ''}`,
        overflow: 'hidden',
      }}
    >
      {/* Subtle inner shine */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '35%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, transparent 100%)',
        borderRadius: `${s.br}px ${s.br}px 0 0`,
        pointerEvents: 'none',
      }} />

      {/* Top-left corner */}
      <div style={{
        position: 'absolute', top: 2, left: 3,
        display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1, color,
      }}>
        <span style={{ fontSize: s.rankFs, fontFamily: 'var(--font-display)', fontWeight: 700, lineHeight: 1 }}>
          {info.rank}
        </span>
        <SuitIcon symbol={suitSym} size={s.suitFs} color={color} />
      </div>

      {/* Center suit */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color,
      }}>
        <SuitIcon symbol={suitSym} size={s.centerFs} color={color} />
      </div>

      {/* Bottom-right corner (rotated) */}
      <div style={{
        position: 'absolute', bottom: 2, right: 3,
        display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1, color,
        transform: 'rotate(180deg)',
      }}>
        <span style={{ fontSize: s.rankFs, fontFamily: 'var(--font-display)', fontWeight: 700, lineHeight: 1 }}>
          {info.rank}
        </span>
        <SuitIcon symbol={suitSym} size={s.suitFs} color={color} />
      </div>

      {/* Gold highlight overlay for winning card */}
      {highlight && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: s.br,
          background: 'radial-gradient(ellipse at 50% 30%, rgba(201,168,76,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  )
}
