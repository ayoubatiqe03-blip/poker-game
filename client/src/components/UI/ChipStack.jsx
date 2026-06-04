/**
 * components/UI/ChipStack.jsx
 *
 * Realistic circular poker chips viewed from a 3/4 angle.
 *
 * Each chip is a circle (not a flat pill) with:
 *   - Solid colour fill + lighter edge highlight ring
 *   - Edge notch stripe pattern (clay chip look)
 *   - Top-face label with denomination
 *   - Subtle drop shadow beneath the stack
 *
 * Stacks are rendered as overlapping circles (each chip offset 4px down
 * from the previous) so it looks like a real casino stack.
 */
import React, { memo } from 'react'
import { formatChips } from '../../utils/cardHelpers'

// ── Denomination → chip style ───────────────────────────────────────────────
const CHIP_DEFS = [
  { min: 500, bg: '#7a2d9a', ring: '#ac55d4', text: '#f0d0ff', label: '500' },
  { min: 100, bg: '#1c1c2e', ring: '#3a3a5c', text: '#b0b0d8', label: '100' },
  { min: 25,  bg: '#1560a0', ring: '#2a88d8', text: '#b8deff', label: '25'  },
  { min: 10,  bg: '#157040', ring: '#22a05a', text: '#9affc4', label: '10'  },
  { min: 5,   bg: '#be2e20', ring: '#e84030', text: '#ffc8c0', label: '5'   },
  { min: 1,   bg: '#cdc7b0', ring: '#e0d8bc', text: '#444',    label: '1'   },
]

function getChipDef(value) {
  return CHIP_DEFS.find(d => value >= d.min) ?? CHIP_DEFS[CHIP_DEFS.length - 1]
}

function denomBreakdown(amount) {
  if (!amount || amount <= 0) return []
  const denoms = [500, 100, 25, 10, 5, 1]
  const result = []
  let rem = amount
  for (const d of denoms) {
    const n = Math.floor(rem / d)
    if (n > 0) {
      result.push({ denom: d, count: Math.min(n, 7), def: getChipDef(d) })
      rem -= n * d
    }
    if (result.length >= 4) break   // max 4 columns
  }
  return result
}

// ── Single circular chip ────────────────────────────────────────────────────
function Chip({ def, diameter, stackIndex }) {
  const { bg, ring, text, label } = def
  const r = diameter / 2

  // Number of edge-stripe segments
  const stripes = 8
  const stripeArc = 360 / stripes     // degrees per segment
  const stripeWidth = 12             // degrees wide (gap is stripeArc - stripeWidth)

  return (
    <div style={{
      width:    diameter,
      height:   diameter,
      borderRadius: '50%',
      position: 'relative',
      flexShrink: 0,
      // Main chip face
      background: `radial-gradient(circle at 38% 35%, ${ring} 0%, ${bg} 45%, color-mix(in srgb,${bg} 70%,#000) 100%)`,
      // Ring border
      boxShadow: [
        `0 0 0 ${Math.max(2, diameter * 0.06)}px ${ring}`,
        `0 0 0 ${Math.max(3, diameter * 0.09)}px ${bg}`,
        `0 0 0 ${Math.max(4, diameter * 0.12)}px ${ring}55`,
        `0 ${stackIndex > 0 ? 2 : 3}px ${stackIndex > 0 ? 3 : 6}px rgba(0,0,0,0.55)`,
      ].join(', '),
      overflow: 'hidden',
    }}>
      {/* Edge stripe notches — rendered as SVG conic wedges */}
      <svg
        width={diameter} height={diameter}
        style={{ position: 'absolute', inset: 0 }}
        viewBox={`0 0 ${diameter} ${diameter}`}
      >
        {Array.from({ length: stripes }).map((_, i) => {
          const startDeg = i * stripeArc
          const endDeg   = startDeg + stripeWidth
          const toRad    = d => (d - 90) * Math.PI / 180
          const x1 = r + r * Math.cos(toRad(startDeg))
          const y1 = r + r * Math.sin(toRad(startDeg))
          const x2 = r + r * Math.cos(toRad(endDeg))
          const y2 = r + r * Math.sin(toRad(endDeg))
          return (
            <path
              key={i}
              d={`M${r},${r} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`}
              fill="rgba(255,255,255,0.11)"
            />
          )
        })}
      </svg>

      {/* Top-face shine */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'radial-gradient(ellipse 60% 45% at 38% 32%, rgba(255,255,255,0.28) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Denomination label */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: Math.max(7, Math.round(diameter * 0.24)),
        fontFamily: 'var(--font-mono)',
        fontWeight: 600,
        color: text,
        textShadow: '0 1px 2px rgba(0,0,0,0.6)',
        letterSpacing: '-0.02em',
        userSelect: 'none',
      }}>
        {label}
      </div>
    </div>
  )
}

// ── Stacked column of chips ─────────────────────────────────────────────────
function ChipColumn({ denom, count, def, diameter }) {
  const OVERLAP = Math.round(diameter * 0.45)   // px each chip peeks above the previous
  const totalH  = diameter + (count - 1) * OVERLAP

  return (
    <div style={{
      position: 'relative',
      width:  diameter,
      height: totalH,
      flexShrink: 0,
    }}>
      {/* Bottom shadow */}
      <div style={{
        position: 'absolute',
        bottom: -4, left: '10%', right: '10%',
        height: 6, borderRadius: '50%',
        background: 'rgba(0,0,0,0.35)',
        filter: 'blur(3px)',
      }} />

      {/* Stack from bottom to top — bottom chip renders first, sits lowest */}
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          // bottom chip at bottom, top chip at top
          top: (count - 1 - i) * OVERLAP,
          left: 0,
          zIndex: i,
        }}>
          <Chip def={def} diameter={diameter} stackIndex={i} />
        </div>
      ))}
    </div>
  )
}

// ── Public component ─────────────────────────────────────────────────────────
const ChipStack = memo(function ChipStack({
  amount,
  size     = 'md',
  showLabel = true,
  animate  = false,
}) {
  const stacks  = denomBreakdown(amount)
  const diam    = size === 'sm' ? 24 : size === 'lg' ? 36 : 28

  if (!amount || amount <= 0) return null

  // Max height across all columns (for the row container)
  const maxH = stacks.reduce((m, s) => Math.max(m, diam + (s.count - 1) * Math.round(diam * 0.45)), diam)

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', gap: 4,
      animation: animate ? 'chipSlide 0.3s cubic-bezier(0.22,1.1,0.58,1) both' : 'none',
    }}>
      {/* Chip columns */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: maxH }}>
        {stacks.map((s, i) => (
          <ChipColumn
            key={i}
            denom={s.denom}
            count={s.count}
            def={s.def}
            diameter={diam}
          />
        ))}
      </div>

      {/* Amount label */}
      {showLabel && (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: size === 'sm' ? 11 : size === 'lg' ? 15 : 13,
          color: 'var(--gold-light)',
          fontWeight: 600,
          letterSpacing: '0.03em',
          lineHeight: 1,
          paddingBottom: 2,
        }}>
          {formatChips(amount)}
        </span>
      )}
    </div>
  )
})

export default ChipStack
