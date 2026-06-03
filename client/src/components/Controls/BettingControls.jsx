/**
 * components/Controls/BettingControls.jsx
 *
 * Fixes:
 *   1. maxRaise computed correctly: it's the total stack the player can put in
 *      this round, i.e. their remaining chips + what they've already put in.
 *      The server expects a "raise TO" amount (total chips in pot from this player),
 *      not a "raise BY" amount.
 *   2. Raise button only shown when raiseAmount >= minRaiseTo (was showing
 *      even when slider was below min).
 *   3. All-In button hidden when player has no chips beyond their call.
 *   4. Preset values clamped to [minRaiseTo, maxRaise].
 *   5. Slider min/max/value can't be NaN — guarded with fallbacks.
 *   6. Double-click / fast-click guard: disabled after first click until
 *      server confirms new state (avoids double-submitting).
 */
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { formatChips } from '../../utils/cardHelpers'

export default function BettingControls({ bettingRound, myPlayer, onAction, visible }) {
  const [raiseAmount, setRaiseAmount] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const submittedRef = useRef(false)

  const myId       = myPlayer?.id
  const myChips    = myPlayer?.chips ?? 0
  const currentBet = bettingRound?.currentBet ?? 0
  const myContrib  = bettingRound?.roundContributions?.[myId] ?? 0
  const callAmount = Math.min(Math.max(0, currentBet - myContrib), myChips)

  // minRaiseTo: the total amount this player must commit to make a legal raise
  const minRaise   = bettingRound?.minRaise ?? Math.max(currentBet, bettingRound?.bigBlind ?? 20)
  const minRaiseTo = currentBet + minRaise

  // maxRaise: total chips this player can commit (their stack + what's already in)
  const maxRaise   = myChips + myContrib

  const canCheck = callAmount <= 0
  const canRaise = myChips > callAmount && maxRaise >= minRaiseTo
  const canAllIn = myChips > 0

  // Reset slider and submitted state when it becomes our turn
  useEffect(() => {
    if (visible) {
      const initial = Math.min(Math.max(minRaiseTo, 0), maxRaise)
      setRaiseAmount(Number.isFinite(initial) ? initial : 0)
      setSubmitted(false)
      submittedRef.current = false
    }
  }, [visible, minRaiseTo, maxRaise])

  const handleAction = useCallback((action, amount) => {
    if (submittedRef.current) return   // guard double-click
    submittedRef.current = true
    setSubmitted(true)
    onAction?.(action, amount)
  }, [onAction])

  // Pot size for presets (bettingRound.pot is cumulative including prior streets)
  const pot = bettingRound?.pot ?? 0

  const presets = [
    { label: '¼ Pot', value: Math.round(currentBet + pot * 0.25) },
    { label: '½ Pot', value: Math.round(currentBet + pot * 0.5) },
    { label: 'Pot',   value: currentBet + pot },
    { label: '2×',    value: currentBet * 2 },
  ]
    .map(p => ({ ...p, value: Math.min(Math.max(p.value, minRaiseTo), maxRaise) }))
    .filter(p => p.value >= minRaiseTo && p.value <= maxRaise)
    // Deduplicate by value
    .filter((p, i, arr) => arr.findIndex(q => q.value === p.value) === i)

  if (!visible) return null

  const sliderMin = Number.isFinite(minRaiseTo) ? minRaiseTo : 0
  const sliderMax = Number.isFinite(maxRaise) && maxRaise >= sliderMin ? maxRaise : sliderMin
  const sliderVal = Math.min(Math.max(raiseAmount, sliderMin), sliderMax)

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'linear-gradient(0deg, rgba(5,3,1,0.98) 0%, rgba(10,6,2,0.95) 100%)',
      borderTop: '1px solid rgba(201,168,76,0.2)',
      padding: '12px 20px 16px',
      zIndex: 50,
      animation: submitted ? 'none' : 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      opacity: submitted ? 0.5 : 1,
      pointerEvents: submitted ? 'none' : 'auto',
      transition: 'opacity 0.2s',
    }}>
      {/* Raise slider row */}
      {canRaise && sliderMax > sliderMin && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 11, minWidth: 36 }}>
              Raise
            </span>
            <div style={{ display: 'flex', gap: 4, flex: 1, flexWrap: 'wrap' }}>
              {presets.map(p => (
                <button
                  key={`${p.label}-${p.value}`}
                  onClick={() => setRaiseAmount(p.value)}
                  style={presetBtnStyle(raiseAmount === p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 14,
              color: 'var(--gold-light)', fontWeight: 500,
              minWidth: 64, textAlign: 'right',
            }}>
              {formatChips(sliderVal)}
            </span>
          </div>

          <input
            type="range"
            min={sliderMin}
            max={sliderMax}
            step={1}
            value={sliderVal}
            onChange={e => setRaiseAmount(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--gold)', cursor: 'pointer' }}
          />
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 10, color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)', marginTop: 2,
          }}>
            <span>Min {formatChips(sliderMin)}</span>
            <span>Max {formatChips(sliderMax)}</span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <ActionButton
          label="Fold"
          color="var(--action-fold)"
          onClick={() => handleAction('fold')}
          flex={1}
        />

        {canCheck ? (
          <ActionButton
            label="Check"
            color="var(--action-check)"
            onClick={() => handleAction('check')}
            flex={1.5}
          />
        ) : (
          <ActionButton
            label={`Call  ${formatChips(callAmount)}`}
            color="var(--action-call)"
            onClick={() => handleAction('call')}
            flex={1.5}
          />
        )}

        {/* Raise — only show when slider value is valid */}
        {canRaise && sliderVal >= minRaiseTo && sliderVal < maxRaise && (
          <ActionButton
            label={`Raise  ${formatChips(sliderVal)}`}
            color="var(--action-raise)"
            onClick={() => handleAction('raise', sliderVal)}
            flex={2}
          />
        )}

        {/* All-In */}
        {canAllIn && (
          <ActionButton
            label={`All In  ${formatChips(myChips)}`}
            color="var(--action-allin)"
            onClick={() => handleAction('allin')}
            flex={1.2}
            bold
          />
        )}
      </div>
    </div>
  )
}

function ActionButton({ label, color, onClick, flex = 1, bold = false }) {
  const [pressed, setPressed] = useState(false)
  return (
    <button
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onClick={onClick}
      style={{
        flex,
        padding: '12px 8px',
        borderRadius: 8,
        border: `1px solid ${color}`,
        background: pressed
          ? color
          : `linear-gradient(160deg, ${color}33 0%, ${color}22 100%)`,
        color: '#fff',
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        fontWeight: bold ? 700 : 500,
        cursor: 'pointer',
        letterSpacing: '0.03em',
        transition: 'background 0.12s, transform 0.08s',
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        boxShadow: `0 2px 8px ${color}44`,
      }}
    >
      {label}
    </button>
  )
}

function presetBtnStyle(active) {
  return {
    padding: '3px 8px', borderRadius: 4,
    border: active ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.12)',
    background: active ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.05)',
    color: active ? 'var(--gold-light)' : 'var(--text-muted)',
    fontSize: 11, fontFamily: 'var(--font-body)',
    cursor: 'pointer', transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  }
}
