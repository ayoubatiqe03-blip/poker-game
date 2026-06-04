/**
 * components/UI/PlayingCard.jsx
 *
 * Realistic playing card with proper pip layout.
 *
 * Key improvements:
 *   - All 13 rank pip arrangements rendered as positioned suit icons
 *   - Face cards (J/Q/K) show a letter + large suit, matching real card style
 *   - SVG suit symbols — crisp at every size, no emoji blur
 *   - Corner rank + suit in top-left and bottom-right (rotated)
 *   - Card face has a subtle cream gradient + inner shadow border
 *   - Card back: deep navy with diamond-trellis and gold border
 *   - Deal animation: arc + settle, but only plays once per card mount
 *   - No winnerCardReveal on non-highlighted cards (reduces animation count)
 */
import React, { memo } from 'react'
import { displayCard } from '../../utils/cardHelpers'

// ─── Sizes ─────────────────────────────────────────────────────────────────
const SIZES = {
  sm: { w: 40,  h: 56,  corner: 11, cornerSuit: 9,  centerSuit: 18, br: 5  },
  md: { w: 56,  h: 78,  corner: 14, cornerSuit: 11, centerSuit: 26, br: 6  },
  lg: { w: 72,  h: 100, corner: 17, cornerSuit: 13, centerSuit: 32, br: 7  },
}

// ─── SVG suit paths (viewBox 0 0 24 24) ────────────────────────────────────
function SuitSVG({ suit, size, color }) {
  const paths = {
    '♠': 'M12 2C12 2 3 10 3 15.5a5 5 0 0 0 7.5 1C9.8 18.5 9 20 8 22h8c-1-2-1.8-3.5-2.5-5.5a5 5 0 0 0 7.5-1C21 10 12 2 12 2z',
    '♥': 'M12 21C12 21 3 13.5 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-9 13-9 13z',
    '♦': 'M12 2L22 12 12 22 2 12Z',
    '♣': 'M12 2a4 4 0 0 1 3.5 6A4 4 0 1 1 12 14a4 4 0 1 1-3.5-6A4 4 0 0 1 12 2zM10 14l-1.5 6h7l-1.5-6H10z',
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ display: 'block', flexShrink: 0 }}>
      <path d={paths[suit]} />
    </svg>
  )
}

// ─── Pip position grids ─────────────────────────────────────────────────────
// Each entry is an array of [col, row] on a 3-col × 7-row grid (0-indexed)
// col: 0=left, 1=centre, 2=right
// row: 0=top … 6=bottom
const PIP_GRIDS = {
  'A':  [[1,3]],
  '2':  [[1,1],[1,5]],
  '3':  [[1,1],[1,3],[1,5]],
  '4':  [[0,1],[2,1],[0,5],[2,5]],
  '5':  [[0,1],[2,1],[1,3],[0,5],[2,5]],
  '6':  [[0,1],[2,1],[0,3],[2,3],[0,5],[2,5]],
  '7':  [[0,1],[2,1],[1,2],[0,3],[2,3],[0,5],[2,5]],
  '8':  [[0,1],[2,1],[1,2],[0,3],[2,3],[1,4],[0,5],[2,5]],
  '9':  [[0,1],[2,1],[0,2],[2,2],[1,3],[0,4],[2,4],[0,5],[2,5]],
  '10': [[0,1],[2,1],[1,2],[0,3],[2,3],[0,3.8],[2,3.8],[1,4.5],[0,5],[2,5]],
  'J':  null, 'Q': null, 'K': null,
}

function Pips({ rank, suit, color, cardW, cardH }) {
  const grid = PIP_GRIDS[rank]
  if (!grid) {
    // Face card: large centred letter + suit below
    const letterSize = Math.round(cardH * 0.3)
    const suitSize   = Math.round(cardH * 0.18)
    return (
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 2,
      }}>
        <span style={{
          fontSize: letterSize,
          fontFamily: 'var(--font-display)',
          fontWeight: 700, color, lineHeight: 1,
        }}>{rank}</span>
        <SuitSVG suit={suit} size={suitSize} color={color} />
      </div>
    )
  }

  // Padding inside card for pip area
  const padX = Math.round(cardW * 0.14)
  const padY = Math.round(cardH * 0.1)
  const areaW = cardW - padX * 2
  const areaH = cardH - padY * 2
  const cols  = [0, 0.5, 1]       // fraction of areaW
  const rows  = [0, 1/6, 2/6, 3/6, 4/6, 5/6, 1] // fraction of areaH

  // For Ace: use bigger pip
  const pipSize = rank === 'A'
    ? Math.round(cardH * 0.28)
    : Math.round(Math.min(areaW, areaH) * 0.22)

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {grid.map(([c, r], i) => {
        const rowFrac = typeof r === 'number' && r <= 6 ? (r <= 6 ? r / 6 : r / 6) : r / 6
        const x = padX + cols[c] * areaW - pipSize / 2
        const y = padY + rowFrac * areaH - pipSize / 2
        // Pips in the bottom half are rotated 180°
        const rotate = r > 3.1 ? 'rotate(180deg)' : 'none'
        return (
          <div key={i} style={{
            position: 'absolute',
            left: x, top: y,
            transform: rotate,
            transformOrigin: 'center',
          }}>
            <SuitSVG suit={suit} size={pipSize} color={color} />
          </div>
        )
      })}
    </div>
  )
}

// ─── Card back ──────────────────────────────────────────────────────────────
function CardBack({ w, h, br }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: br, flexShrink: 0, position: 'relative',
      background: 'linear-gradient(145deg, #1e2b9e 0%, #141e72 50%, #0d1357 100%)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(0,0,0,0.5)',
      overflow: 'hidden',
    }}>
      {/* Gold border */}
      <div style={{
        position: 'absolute', inset: 3,
        border: '1.5px solid rgba(201,168,76,0.5)',
        borderRadius: br - 2,
      }} />
      {/* Inner border */}
      <div style={{
        position: 'absolute', inset: 5,
        border: '1px solid rgba(201,168,76,0.2)',
        borderRadius: br - 3,
      }} />
      {/* Diamond trellis */}
      <div style={{
        position: 'absolute', inset: 7,
        backgroundImage: `
          repeating-linear-gradient( 45deg, rgba(201,168,76,0.08) 0, rgba(201,168,76,0.08) 1px, transparent 1px, transparent 9px),
          repeating-linear-gradient(-45deg, rgba(201,168,76,0.08) 0, rgba(201,168,76,0.08) 1px, transparent 1px, transparent 9px)
        `,
      }} />
      {/* Centre spade */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: 0.12, fontSize: Math.round(h * 0.3),
        color: '#c9a84c', userSelect: 'none',
      }}>♠</div>
      {/* Top shine */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '38%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%)',
        borderRadius: `${br}px ${br}px 0 0`, pointerEvents: 'none',
      }} />
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────
const PlayingCard = memo(function PlayingCard({
  card,
  size = 'md',
  faceDown = false,
  delay = 0,
  highlight = false,
  animate = true,
}) {
  const s    = SIZES[size]
  const info = !faceDown && card?.rank !== '?' ? displayCard(card) : null
  const anim = animate
    ? `dealCard 0.38s cubic-bezier(0.22, 1.1, 0.58, 1) ${delay}ms both`
    : 'none'

  if (!info) {
    return (
      <div style={{ animation: anim, flexShrink: 0, display: 'inline-block' }}>
        <CardBack w={s.w} h={s.h} br={s.br} />
      </div>
    )
  }

  const color = info.isRed ? '#c82200' : '#111111'
  const suit  = info.suit

  return (
    <div style={{
      width: s.w, height: s.h, borderRadius: s.br,
      flexShrink: 0, position: 'relative', display: 'inline-block',
      // Warm cream face
      background: 'linear-gradient(160deg, #fffef9 0%, #fdf8ef 100%)',
      border: highlight
        ? '2px solid #c9a84c'
        : '1.5px solid rgba(0,0,0,0.2)',
      boxShadow: highlight
        ? '0 4px 16px rgba(0,0,0,0.5), 0 0 18px rgba(201,168,76,0.5), 0 0 40px rgba(201,168,76,0.25)'
        : '0 4px 14px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.7), 0 0 0 0.5px rgba(0,0,0,0.1)',
      userSelect: 'none',
      animation: anim,
      overflow: 'hidden',
    }}>
      {/* Top shine */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '32%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)',
        borderRadius: `${s.br}px ${s.br}px 0 0`, pointerEvents: 'none', zIndex: 3,
      }} />

      {/* Top-left corner */}
      <div style={{
        position: 'absolute', top: 2, left: 3, zIndex: 4,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
      }}>
        <span style={{ fontSize: s.corner, fontFamily: 'var(--font-display)', fontWeight: 700, color, lineHeight: 1 }}>
          {info.rank}
        </span>
        <SuitSVG suit={suit} size={s.cornerSuit} color={color} />
      </div>

      {/* Pips / face letter */}
      <Pips rank={info.rank} suit={suit} color={color} cardW={s.w} cardH={s.h} />

      {/* Bottom-right corner (rotated 180°) */}
      <div style={{
        position: 'absolute', bottom: 2, right: 3, zIndex: 4,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
        transform: 'rotate(180deg)',
      }}>
        <span style={{ fontSize: s.corner, fontFamily: 'var(--font-display)', fontWeight: 700, color, lineHeight: 1 }}>
          {info.rank}
        </span>
        <SuitSVG suit={suit} size={s.cornerSuit} color={color} />
      </div>

      {/* Winner gold overlay */}
      {highlight && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: s.br, zIndex: 5,
          background: 'radial-gradient(ellipse at 50% 25%, rgba(201,168,76,0.2) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  )
})

export default PlayingCard
