/**
 * components/UI/ChipStack.jsx
 *
 * 3-D stacked poker chips with:
 *   - Edge notch stripes (like real clay chips)
 *   - Per-denomination colors
 *   - Stacking shadow depth
 *   - Entry animation per chip
 */
import React from 'react'
import { formatChips } from '../../utils/cardHelpers'

// Map chip value → visual style
const CHIP_STYLES = {
  500:  { bg: '#6c2f8a', edge: '#8b44aa', label: '500', textColor: '#f0d0ff' },
  100:  { bg: '#1c1c24', edge: '#333344', label: '100', textColor: '#c8c8e0' },
  25:   { bg: '#1a6ea8', edge: '#2488c8', label: '25',  textColor: '#c0e4ff' },
  10:   { bg: '#1a7a3e', edge: '#22994e', label: '10',  textColor: '#b0ffcc' },
  5:    { bg: '#c0392b', edge: '#e04030', label: '5',   textColor: '#ffd0cc' },
  1:    { bg: '#d4cdb8', edge: '#b8b09a', label: '1',   textColor: '#444' },
}

function getChipStyle(value) {
  const keys = [500, 100, 25, 10, 5, 1]
  for (const k of keys) if (value >= k) return CHIP_STYLES[k]
  return CHIP_STYLES[1]
}

function chipsToStack(amount) {
  if (!amount || amount <= 0) return []
  const denoms = [500, 100, 25, 10, 5, 1]
  const stacks = []
  let remaining = amount
  for (const d of denoms) {
    const count = Math.floor(remaining / d)
    if (count > 0) {
      stacks.push({ denom: d, count: Math.min(count, 6), style: getChipStyle(d) })
      remaining -= count * d
    }
    if (stacks.length >= 4) break
  }
  return stacks
}

function SingleChip({ style, diameter, index, animate }) {
  const { bg, edge, label, textColor } = style
  return (
    <div
      style={{
        width: diameter,
        height: Math.round(diameter * 0.24),
        borderRadius: diameter / 2,
        background: `linear-gradient(180deg, ${edge} 0%, ${bg} 40%, ${bg} 60%, ${edge} 100%)`,
        border: `1px solid rgba(0,0,0,0.35)`,
        boxShadow: [
          `0 2px 4px rgba(0,0,0,0.5)`,
          `inset 0 1px 0 rgba(255,255,255,0.2)`,
          `inset 0 -1px 0 rgba(0,0,0,0.25)`,
        ].join(', '),
        position: 'relative',
        overflow: 'hidden',
        animation: animate ? `chipSlide 0.28s ${index * 35}ms cubic-bezier(0.22,1.1,0.58,1) both` : 'none',
        flexShrink: 0,
      }}
    >
      {/* Edge notch stripes */}
      {[0.18, 0.36, 0.54, 0.72, 0.90].map((pos, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${pos * 100}%`,
          top: 0, bottom: 0,
          width: '5%',
          background: 'rgba(255,255,255,0.14)',
        }} />
      ))}
      {/* Shine */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, transparent 100%)',
      }} />
    </div>
  )
}

export default function ChipStack({ amount, size = 'md', showLabel = true, animate = false }) {
  const stacks = chipsToStack(amount)
  const diam = size === 'sm' ? 20 : size === 'lg' ? 30 : 24

  if (!amount || amount <= 0) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      {/* Chip columns */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3 }}>
        {stacks.map((stack, si) => (
          <div key={si} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            {Array.from({ length: stack.count }).map((_, ci) => (
              <SingleChip
                key={ci}
                style={stack.style}
                diameter={diam}
                index={si * 6 + ci}
                animate={animate}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Amount label */}
      {showLabel && (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: size === 'sm' ? 11 : size === 'lg' ? 15 : 13,
          color: 'var(--gold-light)',
          fontWeight: 500,
          letterSpacing: '0.03em',
        }}>
          {formatChips(amount)}
        </span>
      )}
    </div>
  )
}
