/**
 * components/UI/PlayingCard.jsx
 *
 * Renders a single playing card.
 * Props:
 *   card      - { rank, suit } or null for face-down
 *   size      - 'sm' | 'md' | 'lg'
 *   faceDown  - force face-down rendering
 *   delay     - animation delay in ms (for staggered dealing)
 *   highlight - glows gold (winning card)
 */
import React from 'react'
import { displayCard } from '../../utils/cardHelpers'

const SIZES = {
  sm: { width: 36, height: 52, rank: 13, suit: 10 },
  md: { width: 52, height: 74, rank: 18, suit: 14 },
  lg: { width: 68, height: 96, rank: 22, suit: 18 },
}

export default function PlayingCard({ card, size = 'md', faceDown = false, delay = 0, highlight = false }) {
  const s = SIZES[size]
  const info = !faceDown && card?.rank !== '?' ? displayCard(card) : null

  const base = {
    width: s.width,
    height: s.height,
    borderRadius: 6,
    flexShrink: 0,
    position: 'relative',
    animation: `dealCard 0.35s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms both`,
  }

  if (!info) {
    // Face-down card
    return (
      <div style={{
        ...base,
        background: 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #1a237e 100%)',
        border: '1.5px solid rgba(255,255,255,0.15)',
        boxShadow: '2px 3px 8px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}>
        {/* Card back pattern */}
        <div style={{
          position: 'absolute', inset: 3,
          border: '1.5px solid rgba(255,255,255,0.2)',
          borderRadius: 4,
          backgroundImage: `repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 8px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 8px)`,
        }} />
      </div>
    )
  }

  const color = info.isRed ? 'var(--suit-red)' : 'var(--suit-black)'

  return (
    <div style={{
      ...base,
      background: 'var(--card-face)',
      border: highlight ? '2px solid var(--gold)' : '1.5px solid rgba(0,0,0,0.15)',
      boxShadow: highlight
        ? `2px 3px 8px rgba(0,0,0,0.6), 0 0 16px var(--gold-glow)`
        : '2px 3px 8px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '2px 3px',
      userSelect: 'none',
    }}>
      {/* Top-left corner */}
      <div style={{ lineHeight: 1, color }}>
        <div style={{ fontSize: s.rank, fontFamily: 'var(--font-display)', fontWeight: 700, lineHeight: 1 }}>
          {info.rank}
        </div>
        <div style={{ fontSize: s.suit, lineHeight: 1, marginTop: -2 }}>{info.suit}</div>
      </div>

      {/* Center suit */}
      <div style={{
        fontSize: s.height * 0.32,
        color,
        textAlign: 'center',
        lineHeight: 1,
        opacity: 0.9,
      }}>
        {info.suit}
      </div>

      {/* Bottom-right corner (rotated) */}
      <div style={{ lineHeight: 1, color, alignSelf: 'flex-end', transform: 'rotate(180deg)' }}>
        <div style={{ fontSize: s.rank, fontFamily: 'var(--font-display)', fontWeight: 700, lineHeight: 1 }}>
          {info.rank}
        </div>
        <div style={{ fontSize: s.suit, lineHeight: 1, marginTop: -2 }}>{info.suit}</div>
      </div>
    </div>
  )
}
