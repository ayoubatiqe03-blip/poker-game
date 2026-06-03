/**
 * components/UI/ActionTimer.jsx
 *
 * Circular countdown ring that syncs to the server's real deadline.
 *
 * Fix: accepts `startedAt` (server timestamp) so the timer begins
 * from the correct elapsed point rather than always from full 30s.
 */
import React, { useState, useEffect, useRef } from 'react'

export default function ActionTimer({ timeoutMs = 30000, startedAt, onExpire }) {
  const [remaining, setRemaining] = useState(timeoutMs)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useEffect(() => {
    // If the server told us when the timer started, offset from that.
    // Otherwise start from now (best-effort).
    const origin = startedAt ?? Date.now()

    function tick() {
      const elapsed = Date.now() - origin
      const left = Math.max(0, timeoutMs - elapsed)
      setRemaining(left)
      if (left === 0) onExpireRef.current?.()
    }

    tick() // immediate first paint
    const interval = setInterval(tick, 100)
    return () => clearInterval(interval)
  }, [timeoutMs, startedAt])

  const seconds = Math.ceil(remaining / 1000)
  const pct = remaining / timeoutMs
  const r = 16
  const circumference = 2 * Math.PI * r
  const dash = circumference * pct
  const color = pct > 0.5 ? '#1e8449' : pct > 0.25 ? '#f39c12' : '#c0392b'

  return (
    <div style={{ position: 'relative', width: 40, height: 40 }}>
      <svg width="40" height="40" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="20" cy="20" r={r} fill="none"
          stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
        <circle
          cx="20" cy="20" r={r}
          fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.1s linear, stroke 0.3s' }}
        />
      </svg>
      <span style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500,
        color,
      }}>
        {seconds}
      </span>
    </div>
  )
}
