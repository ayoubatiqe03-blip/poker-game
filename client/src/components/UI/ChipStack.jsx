/**
 * components/UI/ChipStack.jsx
 * Visual chip stack with denomination coloring.
 */
import React from 'react'
import { chipsToStack, formatChips } from '../../utils/cardHelpers'

export default function ChipStack({ amount, size = 'md', showLabel = true, animate = false }) {
  const stack = chipsToStack(amount)
  const chipSize = size === 'sm' ? 18 : size === 'lg' ? 28 : 22

  if (!amount || amount <= 0) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {/* Visual stack */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
        {stack.map((tier, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            {Array.from({ length: Math.min(tier.count, 5) }).map((_, j) => (
              <div
                key={j}
                style={{
                  width: chipSize,
                  height: chipSize * 0.22,
                  borderRadius: chipSize / 2,
                  background: tier.color,
                  border: `1.5px solid rgba(255,255,255,0.2)`,
                  boxShadow: `0 1px 3px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)`,
                  animation: animate ? `chipSlide 0.3s ${j * 40}ms both` : 'none',
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Label */}
      {showLabel && (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: size === 'sm' ? 11 : size === 'lg' ? 15 : 13,
          color: 'var(--gold-light)',
          fontWeight: 500,
          letterSpacing: '0.02em',
        }}>
          {formatChips(amount)}
        </span>
      )}
    </div>
  )
}
