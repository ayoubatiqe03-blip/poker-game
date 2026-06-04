/**
 * components/UI/SoundManager.jsx
 *
 * Generates poker sound effects entirely via the Web Audio API —
 * no external files needed, works offline.
 *
 * Provides:
 *   useSounds()  → { play, muted, toggleMute }
 *   MuteButton   → floating button, top-right of screen
 *
 * Sounds: deal, chip, check, fold, raise, win
 */
import React, { useCallback, useEffect, useRef, useState } from 'react'

function createAudioContext() {
  try {
    return new (window.AudioContext || window.webkitAudioContext)()
  } catch { return null }
}

// Simple synthesized sounds using WebAudio
function makeCardDeal(ctx) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    const t = i / ctx.sampleRate
    // Crisp shuffling noise burst
    data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 55) * 0.55
  }
  return buf
}

function makeChipClick(ctx) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    const t = i / ctx.sampleRate
    // Ceramic click + tiny ring
    data[i] = Math.sin(2 * Math.PI * 820 * t) * Math.exp(-t * 60) * 0.4
            + (Math.random() * 2 - 1) * Math.exp(-t * 120) * 0.25
  }
  return buf
}

function makeCheck(ctx) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.18, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    const t = i / ctx.sampleRate
    data[i] = Math.sin(2 * Math.PI * 440 * t) * Math.exp(-t * 28) * 0.3
            + Math.sin(2 * Math.PI * 220 * t) * Math.exp(-t * 22) * 0.2
  }
  return buf
}

function makeFold(ctx) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.22, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    const t = i / ctx.sampleRate
    // Soft thud
    data[i] = Math.sin(2 * Math.PI * (180 - t * 80) * t) * Math.exp(-t * 20) * 0.4
            + (Math.random() * 2 - 1) * Math.exp(-t * 40) * 0.12
  }
  return buf
}

function makeWin(ctx) {
  // Rising arpeggio
  const dur = 0.7
  const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate)
  const data = buf.getChannelData(0)
  const notes = [261, 329, 392, 523] // C E G C
  for (let i = 0; i < data.length; i++) {
    const t = i / ctx.sampleRate
    let s = 0
    notes.forEach((freq, ni) => {
      const noteStart = ni * 0.13
      if (t >= noteStart) {
        const nt = t - noteStart
        s += Math.sin(2 * Math.PI * freq * nt) * Math.exp(-nt * 6) * 0.2
           + Math.sin(2 * Math.PI * freq * 2 * nt) * Math.exp(-nt * 10) * 0.08
      }
    })
    data[i] = s
  }
  return buf
}

const BUFFERS = {}

function playBuffer(ctx, buf, gain = 1.0) {
  if (!ctx || !buf) return
  const src  = ctx.createBufferSource()
  const vol  = ctx.createGain()
  src.buffer = buf
  vol.gain.value = gain
  src.connect(vol)
  vol.connect(ctx.destination)
  src.start()
}

export function useSounds() {
  const ctxRef   = useRef(null)
  const bufsRef  = useRef({})
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem('pokerMuted') === '1' } catch { return false }
  })

  // Build AudioContext + buffers on first interaction
  const ensureCtx = useCallback(() => {
    if (ctxRef.current) return ctxRef.current
    const ctx = createAudioContext()
    if (!ctx) return null
    ctxRef.current = ctx
    bufsRef.current.deal  = makeCardDeal(ctx)
    bufsRef.current.chip  = makeChipClick(ctx)
    bufsRef.current.check = makeCheck(ctx)
    bufsRef.current.fold  = makeFold(ctx)
    bufsRef.current.win   = makeWin(ctx)
    return ctx
  }, [])

  const play = useCallback((name) => {
    if (muted) return
    const ctx = ensureCtx()
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume()
    playBuffer(ctx, bufsRef.current[name])
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

export function MuteButton({ muted, onToggle }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={muted ? 'Unmute sounds' : 'Mute sounds'}
      style={{
        width: 34, height: 34,
        borderRadius: '50%',
        border: `1px solid ${hovered ? 'rgba(201,168,76,0.5)' : 'rgba(201,168,76,0.2)'}`,
        background: hovered ? 'rgba(201,168,76,0.12)' : 'rgba(8,5,2,0.7)',
        color: muted ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)',
        fontSize: 14,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
        backdropFilter: 'blur(4px)',
        boxShadow: hovered ? '0 0 8px rgba(201,168,76,0.2)' : 'none',
        flexShrink: 0,
      }}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}
