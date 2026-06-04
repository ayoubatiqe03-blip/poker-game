/**
 * components/Controls/BettingControls.jsx
 *
 * Improved: tactile press effect, gradient action buttons, labeled presets,
 *           mobile full-width layout, custom range slider track.
 * All raise math and double-click guard preserved exactly.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { formatChips } from '../../utils/cardHelpers'

const ACTIONS = {
  fold:  { bg: '#7d2319', border: '#c0392b', hoverBg: '#a33028', label: 'Fold' },
  check: { bg: '#175e36', border: '#1e8449', hoverBg: '#1e7a47', label: 'Check' },
  call:  { bg: '#14426a', border: '#2471a3', hoverBg: '#1a5a8f', label: 'Call' },
  raise: { bg: '#6b5507', border: '#c9a84c', hoverBg: '#8a6e0a', label: 'Raise' },
  allin: { bg: '#5a2572', border: '#9b59b6', hoverBg: '#7a35a0', label: 'All-In' },
}

export default function BettingControls({ bettingRound, myPlayer, onAction, visible }) {
  const [raiseAmount, setRaiseAmount] = useState(0)
  const [submitted, setSubmitted]     = useState(false)
  const submittedRef = useRef(false)

  const myId       = myPlayer?.id
  const myChips    = myPlayer?.chips ?? 0
  const currentBet = bettingRound?.currentBet ?? 0
  const myContrib  = bettingRound?.roundContributions?.[myId] ?? 0
  const callAmount = Math.min(Math.max(0, currentBet - myContrib), myChips)
  const minRaise   = bettingRound?.minRaise ?? Math.max(currentBet, 20)
  const minRaiseTo = currentBet + minRaise
  const maxRaise   = myChips + myContrib
  const canCheck   = callAmount <= 0
  const canRaise   = myChips > callAmount && maxRaise >= minRaiseTo
  const canAllIn   = myChips > 0
  const pot        = bettingRound?.pot ?? 0

  useEffect(() => {
    if (visible) {
      const initial = Math.min(Math.max(minRaiseTo, 0), maxRaise)
      setRaiseAmount(Number.isFinite(initial) ? initial : 0)
      setSubmitted(false)
      submittedRef.current = false
    }
  }, [visible, minRaiseTo, maxRaise])

  const handleAction = useCallback((action, amount) => {
    if (submittedRef.current) return
    submittedRef.current = true
    setSubmitted(true)
    onAction?.(action, amount)
  }, [onAction])

  const sliderMin = Number.isFinite(minRaiseTo) ? minRaiseTo : 0
  const sliderMax = Number.isFinite(maxRaise) && maxRaise >= sliderMin ? maxRaise : sliderMin
  const sliderVal = Math.min(Math.max(raiseAmount, sliderMin), sliderMax)
  const sliderPct = sliderMax > sliderMin ? ((sliderVal - sliderMin) / (sliderMax - sliderMin)) * 100 : 0

  const presets = [
    { label: '¼P', value: Math.round(currentBet + pot * 0.25) },
    { label: '½P', value: Math.round(currentBet + pot * 0.5) },
    { label: 'Pot', value: currentBet + pot },
    { label: '2×',  value: currentBet * 2 },
  ]
    .map(p => ({ ...p, value: Math.min(Math.max(p.value, sliderMin), sliderMax) }))
    .filter((p, i, arr) => p.value >= sliderMin && p.value <= sliderMax && arr.findIndex(q => q.value === p.value) === i)

  if (!visible) return null

  return (
    <>
      {/* Slider area */}
      {canRaise && sliderMax > sliderMin && (
        <div style={{
          position: 'fixed', bottom: 76, left: 0, right: 0,
          background: 'linear-gradient(0deg, rgba(4,2,1,0.98) 0%, rgba(8,5,2,0.92) 100%)',
          borderTop: '1px solid rgba(201,168,76,0.12)',
          padding: '10px 16px 8px',
          zIndex: 50,
          animation: submitted ? 'none' : 'slideUp 0.28s cubic-bezier(0.22,1.1,0.58,1)',
          opacity: submitted ? 0.4 : 1,
          pointerEvents: submitted ? 'none' : 'auto',
        }}>
          {/* Presets + amount */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-body)', letterSpacing: '0.06em', minWidth: 28 }}>
              RAISE
            </span>
            <div style={{ display: 'flex', gap: 4, flex: 1, flexWrap: 'wrap' }}>
              {presets.map(p => (
                <button
                  key={p.label}
                  onClick={() => setRaiseAmount(p.value)}
                  style={presetStyle(raiseAmount === p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 14, fontWeight: 600,
              color: 'var(--gold-light)',
              minWidth: 56, textAlign: 'right',
            }}>
              {formatChips(sliderVal)}
            </span>
          </div>

          {/* Custom slider */}
          <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
            {/* Track background */}
            <div style={{
              position: 'absolute', left: 0, right: 0, height: 5, borderRadius: 3,
              background: 'rgba(255,255,255,0.08)',
              overflow: 'hidden',
            }}>
              {/* Fill */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${sliderPct}%`,
                background: 'linear-gradient(90deg, var(--gold-dark), var(--gold))',
                borderRadius: 3,
                transition: 'width 0.05s',
              }} />
            </div>
            <input
              type="range"
              min={sliderMin} max={sliderMax} step={1} value={sliderVal}
              onChange={e => setRaiseAmount(Number(e.target.value))}
              style={{
                position: 'absolute', left: 0, right: 0,
                width: '100%', opacity: 0, cursor: 'pointer', height: 20, margin: 0,
              }}
            />
            {/* Thumb */}
            <div style={{
              position: 'absolute',
              left: `calc(${sliderPct}% - 8px)`,
              width: 16, height: 16, borderRadius: '50%',
              background: 'linear-gradient(145deg, var(--gold-light), var(--gold))',
              border: '2px solid rgba(255,255,255,0.3)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.5), 0 0 6px rgba(201,168,76,0.4)',
              pointerEvents: 'none',
              transition: 'left 0.05s',
            }} />
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 3,
          }}>
            <span>Min {formatChips(sliderMin)}</span>
            <span>Max {formatChips(sliderMax)}</span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: 76,
        background: 'linear-gradient(0deg, rgba(2,1,0,1) 0%, rgba(6,4,2,0.98) 100%)',
        borderTop: '1px solid rgba(201,168,76,0.15)',
        display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px',
        zIndex: 51,
        opacity: submitted ? 0.4 : 1,
        pointerEvents: submitted ? 'none' : 'auto',
        transition: 'opacity 0.2s',
      }}>
        <ActionBtn meta={ACTIONS.fold}  onClick={() => handleAction('fold')}  flex={1} />

        {canCheck
          ? <ActionBtn meta={ACTIONS.check} onClick={() => handleAction('check')} flex={1.5} />
          : <ActionBtn
              meta={{ ...ACTIONS.call, label: `Call ${formatChips(callAmount)}` }}
              onClick={() => handleAction('call')}
              flex={1.5}
            />
        }

        {canRaise && sliderVal >= sliderMin && sliderVal < maxRaise && (
          <ActionBtn
            meta={{ ...ACTIONS.raise, label: `Raise ${formatChips(sliderVal)}` }}
            onClick={() => handleAction('raise', sliderVal)}
            flex={2}
          />
        )}

        {canAllIn && (
          <ActionBtn
            meta={{ ...ACTIONS.allin, label: `All-In ${formatChips(myChips)}` }}
            onClick={() => handleAction('allin')}
            flex={1.4}
            bold
          />
        )}
      </div>
    </>
  )
}

function ActionBtn({ meta, onClick, flex = 1, bold = false }) {
  const [pressed, setPressed] = useState(false)
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false) }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => { setPressed(false); onClick() }}
      onClick={onClick}
      style={{
        flex,
        height: 52,
        borderRadius: 10,
        border: `1.5px solid ${meta.border}`,
        background: pressed
          ? `linear-gradient(160deg, ${meta.border} 0%, ${meta.bg} 100%)`
          : hovered
            ? `linear-gradient(160deg, ${meta.hoverBg} 0%, ${meta.bg} 100%)`
            : `linear-gradient(160deg, ${meta.bg}dd 0%, ${meta.bg}99 100%)`,
        color: '#fff',
        fontFamily: 'var(--font-body)',
        fontSize: 'clamp(11px, 2vw, 13px)',
        fontWeight: bold ? 700 : 600,
        cursor: 'pointer',
        letterSpacing: '0.04em',
        transform: pressed ? 'scale(0.96) translateY(1px)' : 'scale(1)',
        transition: 'transform 0.08s, background 0.12s, box-shadow 0.12s',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        boxShadow: pressed
          ? `0 1px 4px ${meta.border}44`
          : `0 3px 12px ${meta.border}44, inset 0 1px 0 rgba(255,255,255,0.1)`,
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {meta.label}
    </button>
  )
}

function presetStyle(active) {
  return {
    padding: '3px 9px', borderRadius: 5,
    border: active ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
    background: active
      ? 'linear-gradient(135deg, rgba(201,168,76,0.25) 0%, rgba(201,168,76,0.15) 100%)'
      : 'rgba(255,255,255,0.04)',
    color: active ? 'var(--gold-light)' : 'var(--text-muted)',
    fontSize: 11, fontFamily: 'var(--font-body)', fontWeight: active ? 600 : 400,
    cursor: 'pointer', transition: 'all 0.15s',
    whiteSpace: 'nowrap',
    boxShadow: active ? '0 0 8px rgba(201,168,76,0.2)' : 'none',
  }
}
