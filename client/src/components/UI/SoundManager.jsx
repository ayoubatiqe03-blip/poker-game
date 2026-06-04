/**
 * components/UI/SoundManager.jsx
 *
 * Web Audio sound effects synthesized lazily — buffers are built
 * on the first play() call (not on import or mount), so they do NOT
 * block the initial render or cause lag when the game screen first appears.
 *
 * useSounds() → { play, muted, toggleMute }
 * MuteButton  → standalone button component
 */
import React, { useCallback, useRef, useState, memo } from 'react'

// ── Audio buffer factories ──────────────────────────────────────────────────
// Each returns a Float32Array of samples, then we copy into an AudioBuffer.

function buildDeal(ctx) {
  // Short noise burst — card slap sound
  const len  = Math.floor(ctx.sampleRate * 0.07)
  const data = new Float32Array(len)
  for (let i = 0; i < len; i++) {
    const t = i / ctx.sampleRate
    data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 60) * 0.5
  }
  return data
}

function buildChip(ctx) {
  // Clay chip click
  const len  = Math.floor(ctx.sampleRate * 0.1)
  const data = new Float32Array(len)
  for (let i = 0; i < len; i++) {
    const t = i / ctx.sampleRate
    data[i] = Math.sin(2 * Math.PI * 900 * t) * Math.exp(-t * 55) * 0.4
            + (Math.random() * 2 - 1) * Math.exp(-t * 110) * 0.18
  }
  return data
}

function buildCheck(ctx) {
  // Soft tap
  const len  = Math.floor(ctx.sampleRate * 0.15)
  const data = new Float32Array(len)
  for (let i = 0; i < len; i++) {
    const t = i / ctx.sampleRate
    data[i] = Math.sin(2 * Math.PI * 460 * t) * Math.exp(-t * 30) * 0.28
            + Math.sin(2 * Math.PI * 230 * t) * Math.exp(-t * 24) * 0.16
  }
  return data
}

function buildFold(ctx) {
  // Card slide / slap
  const len  = Math.floor(ctx.sampleRate * 0.18)
  const data = new Float32Array(len)
  for (let i = 0; i < len; i++) {
    const t = i / ctx.sampleRate
    data[i] = Math.sin(2 * Math.PI * (190 - t * 60) * t) * Math.exp(-t * 22) * 0.38
            + (Math.random() * 2 - 1) * Math.exp(-t * 35) * 0.1
  }
  return data
}

function buildWin(ctx) {
  // Rising 4-note arpeggio — but only ~0.5s total (was 0.7s)
  // Using fixed sample count to avoid sampleRate * 0.5 overhead spike
  const len   = Math.floor(ctx.sampleRate * 0.5)
  const data  = new Float32Array(len)
  const notes = [261, 329, 392, 523]     // C4 E4 G4 C5
  const step  = len / notes.length

  for (let i = 0; i < len; i++) {
    const t   = i / ctx.sampleRate
    const ni  = Math.min(Math.floor(i / step), notes.length - 1)
    const nt  = (i % step) / ctx.sampleRate
    const f   = notes[ni]
    data[i] = Math.sin(2 * Math.PI * f * nt) * Math.exp(-nt * 7) * 0.22
            + Math.sin(2 * Math.PI * f * 2 * nt) * Math.exp(-nt * 12) * 0.08
  }
  return data
}

const BUILDERS = { deal: buildDeal, chip: buildChip, check: buildCheck, fold: buildFold, win: buildWin }

function makeBuffer(ctx, samples) {
  const buf = ctx.createBuffer(1, samples.length, ctx.sampleRate)
  buf.copyToChannel(samples, 0)
  return buf
}

function playBuf(ctx, buf, gain = 1) {
  if (!buf) return
  const src = ctx.createBufferSource()
  const vol = ctx.createGain()
  vol.gain.value = gain
  src.buffer = buf
  src.connect(vol)
  vol.connect(ctx.destination)
  src.start()
}

// ── Hook ────────────────────────────────────────────────────────────────────
export function useSounds() {
  const ctxRef  = useRef(null)
  const bufsRef = useRef({})   // built lazily on first play()
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem('pokerMuted') === '1' } catch { return false }
  })

  const ensureCtx = useCallback(() => {
    if (ctxRef.current) return ctxRef.current
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      ctxRef.current = ctx
      return ctx
    } catch { return null }
  }, [])

  const play = useCallback((name) => {
    if (muted) return
    const ctx = ensureCtx()
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume()

    // Build buffer lazily — only when first played
    if (!bufsRef.current[name]) {
      const builder = BUILDERS[name]
      if (!builder) return
      try {
        bufsRef.current[name] = makeBuffer(ctx, builder(ctx))
      } catch { return }
    }

    playBuf(ctx, bufsRef.current[name])
  }, [muted, ensureCtx])

  const toggleMute = useCallback(() => {
    setMuted(m => {
      const next = !m
      try { localStorage.setItem('pokerMuted', next ? '1' : '0') } catch {}
      return next
    })
  }, [])

  return { play, muted, toggleMute }
}

// ── Mute button ──────────────────────────────────────────────────────────────
export const MuteButton = memo(function MuteButton({ muted, onToggle }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={muted ? 'Unmute sounds' : 'Mute sounds'}
      style={{
        width: 34, height: 34, borderRadius: '50%',
        border: `1px solid ${hov ? 'rgba(201,168,76,0.5)' : 'rgba(201,168,76,0.18)'}`,
        background: hov ? 'rgba(201,168,76,0.12)' : 'rgba(8,5,2,0.7)',
        color: muted ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.65)',
        fontSize: 14, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.18s',
        flexShrink: 0,
      }}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
})
