/**
 * components/Lobby/LobbyScreen.jsx
 *
 * Improved: richer home screen, better mobile layout, animated room-code card,
 *           polished waiting-room player list.
 * All state / prop / event names unchanged.
 */
import React, { useState } from 'react'
import { useGame } from '../../context/GameContext'

export default function LobbyScreen({ onCreateRoom, onJoinRoom, onStartGame }) {
  const { state } = useGame()
  const [mode, setMode]             = useState('home')
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode]     = useState('')
  const [buyIn, setBuyIn]           = useState(1000)
  const [smallBlind, setSmallBlind] = useState(10)
  const [error, setError]           = useState('')

  const inRoom   = !!state.roomCode
  const players  = state.lobbyState?.players ?? []
  const canStart = state.isHost && players.length >= 2

  // ── Waiting room ─────────────────────────────────────────────────────────
  if (inRoom) {
    return (
      <Screen>
        <Card maxWidth={440}>
          {/* Room code hero */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: 10 }}>
              ROOM CODE
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              background: 'rgba(201,168,76,0.08)',
              border: '1.5px solid rgba(201,168,76,0.4)',
              borderRadius: 12,
              padding: '10px 22px',
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 30, fontWeight: 700,
                letterSpacing: '0.22em',
                background: 'linear-gradient(135deg, var(--gold-dark), var(--gold-light))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                {state.roomCode}
              </span>
              <button
                onClick={() => navigator.clipboard?.writeText(state.roomCode)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 18, opacity: 0.6, padding: 2,
                  transition: 'opacity 0.15s',
                }}
                title="Copy code"
                onMouseEnter={e => e.target.style.opacity = '1'}
                onMouseLeave={e => e.target.style.opacity = '0.6'}
              >📋</button>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>
              Share this code with your friends
            </div>
          </div>

          {/* Player list */}
          <div style={{ marginBottom: 18 }}>
            <Label>PLAYERS ({players.length}/9)</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {players.map((p, i) => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 9,
                  background: p.id === state.playerId
                    ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.03)',
                  border: p.id === state.playerId
                    ? '1px solid rgba(201,168,76,0.25)' : '1px solid rgba(255,255,255,0.05)',
                  animation: `fadeIn 0.3s ${i * 50}ms both`,
                }}>
                  {/* Connection dot */}
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                    background: p.isConnected ? '#1e8449' : '#922b21',
                    boxShadow: p.isConnected ? '0 0 5px #1e8449' : 'none',
                  }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, flex: 1 }}>
                    {p.name}
                  </span>
                  {p.isHost && (
                    <span style={{
                      fontSize: 9, color: 'var(--gold)',
                      background: 'rgba(201,168,76,0.12)',
                      border: '1px solid rgba(201,168,76,0.25)',
                      padding: '1px 7px', borderRadius: 3,
                      fontFamily: 'var(--font-body)', fontWeight: 700,
                      letterSpacing: '0.06em',
                    }}>HOST</span>
                  )}
                  {p.id === state.playerId && (
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>You</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Game options summary */}
          {state.lobbyState?.options && (
            <div style={{
              display: 'flex', gap: 0,
              borderRadius: 8,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.06)',
              marginBottom: 18,
            }}>
              {[
                ['Starting chips', state.lobbyState.options.startingChips?.toLocaleString()],
                ['Small blind',    state.lobbyState.options.smallBlind],
                ['Max players',    state.lobbyState.options.maxPlayers],
              ].map(([k, v], i, arr) => (
                <div key={k} style={{
                  flex: 1, padding: '8px 0', textAlign: 'center',
                  background: 'rgba(255,255,255,0.02)',
                  borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2, letterSpacing: '0.06em' }}>{k.toUpperCase()}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--gold)' }}>{v}</div>
                </div>
              ))}
            </div>
          )}

          {state.isHost ? (
            <PrimaryBtn disabled={!canStart} onClick={onStartGame}>
              {canStart ? '🃏  Start Game' : `Need ${2 - players.length} more player${players.length < 1 ? 's' : ''}`}
            </PrimaryBtn>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Waiting for the host to start…
              <div style={{ marginTop: 8, animation: 'dotPulse 1.4s ease-in-out infinite' }}>●</div>
            </div>
          )}
        </Card>
      </Screen>
    )
  }

  // ── Home ─────────────────────────────────────────────────────────────────
  if (mode === 'home') {
    return (
      <Screen>
        <div style={{ textAlign: 'center', marginBottom: 44, animation: 'fadeIn 0.5s ease' }}>
          <div style={{ fontSize: 56, marginBottom: 10, filter: 'drop-shadow(0 0 20px rgba(201,168,76,0.3))' }}>🃏</div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,8vw,46px)', fontWeight: 700,
            letterSpacing: '0.02em', marginBottom: 6,
            background: 'linear-gradient(135deg, var(--gold-dark) 0%, var(--gold-pale) 50%, var(--gold) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Royal Flush
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, letterSpacing: '0.05em' }}>
            Private Texas Hold'em for friends
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
          <PrimaryBtn onClick={() => setMode('create')}>Create Private Room</PrimaryBtn>
          <SecondaryBtn onClick={() => setMode('join')}>Join with Code</SecondaryBtn>
        </div>
      </Screen>
    )
  }

  // ── Create room ───────────────────────────────────────────────────────────
  if (mode === 'create') {
    const handleCreate = () => {
      const name = playerName.trim()
      if (!name)           return setError('Enter your name')
      if (name.length > 20) return setError('Name too long (max 20 chars)')
      setError('')
      onCreateRoom({ playerName: name, options: { startingChips: buyIn, smallBlind } })
    }
    return (
      <Screen>
        <Card>
          <BackBtn onClick={() => setMode('home')} />
          <h2 style={titleStyle}>Create Room</h2>

          <Field label="Your Name">
            <TextInput
              value={playerName} onChange={e => setPlayerName(e.target.value)}
              placeholder="e.g. Vegas Mike" maxLength={20}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
          </Field>

          <Field label={`Starting Chips: ${buyIn.toLocaleString()}`}>
            <RangeInput min={100} max={10000} step={100} value={buyIn} onChange={e => setBuyIn(Number(e.target.value))} />
            <RangeLabels left="100" right="10,000" />
          </Field>

          <Field label={`Small Blind: ${smallBlind}`}>
            <RangeInput min={1} max={200} step={1} value={smallBlind} onChange={e => setSmallBlind(Number(e.target.value))} />
            <RangeLabels left="1" right="200" />
          </Field>

          {(error || state.error) && <ErrBox msg={error || state.error} />}
          <PrimaryBtn onClick={handleCreate}>Create Room</PrimaryBtn>
        </Card>
      </Screen>
    )
  }

  // ── Join room ─────────────────────────────────────────────────────────────
  if (mode === 'join') {
    const handleJoin = () => {
      const name = playerName.trim()
      const code = roomCode.trim().toUpperCase()
      if (!name)          return setError('Enter your name')
      if (code.length !== 4) return setError('Room code must be 4 letters')
      setError('')
      onJoinRoom({ playerName: name, roomCode: code })
    }
    return (
      <Screen>
        <Card>
          <BackBtn onClick={() => setMode('home')} />
          <h2 style={titleStyle}>Join Room</h2>

          <Field label="Room Code">
            <TextInput
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ABCD" maxLength={4}
              style={{ letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: 22, textAlign: 'center' }}
            />
          </Field>

          <Field label="Your Name">
            <TextInput
              value={playerName} onChange={e => setPlayerName(e.target.value)}
              placeholder="e.g. Lucky Linda" maxLength={20}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
            />
          </Field>

          {(error || state.error) && <ErrBox msg={error || state.error} />}
          <PrimaryBtn onClick={handleJoin}>Join Room</PrimaryBtn>
        </Card>
      </Screen>
    )
  }

  return null
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Screen({ children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: `
        radial-gradient(ellipse 60% 50% at 25% 30%, rgba(15,35,15,0.6) 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 75% 70%, rgba(30,12,4,0.6) 0%, transparent 60%),
        #080503
      `,
      padding: '20px 16px',
      zIndex: 80,
    }}>
      {children}
    </div>
  )
}

function Card({ children, maxWidth = 400 }) {
  return (
    <div style={{
      background: 'linear-gradient(160deg, rgba(16,10,4,0.97) 0%, rgba(10,6,2,0.97) 100%)',
      border: '1px solid rgba(201,168,76,0.18)',
      borderRadius: 16,
      padding: 'clamp(20px,4vw,34px) clamp(20px,5vw,36px)',
      width: '100%', maxWidth,
      boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.02)',
      animation: 'fadeIn 0.35s ease',
      position: 'relative',
    }}>
      {children}
    </div>
  )
}

function Label({ children }) {
  return <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 8 }}>{children}</div>
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 7 }}>
        {label.toUpperCase()}
      </label>
      {children}
    </div>
  )
}

function TextInput({ style, ...props }) {
  return (
    <input
      {...props}
      style={{
        width: '100%', padding: '10px 13px',
        borderRadius: 9,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-body)', fontSize: 14,
        outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        ...style,
      }}
      onFocus={e => {
        e.target.style.borderColor = 'rgba(201,168,76,0.4)'
        e.target.style.boxShadow   = '0 0 0 3px rgba(201,168,76,0.1)'
      }}
      onBlur={e => {
        e.target.style.borderColor = 'rgba(255,255,255,0.1)'
        e.target.style.boxShadow   = 'none'
      }}
    />
  )
}

function RangeInput(props) {
  return (
    <input
      type="range"
      {...props}
      style={{ width: '100%', accentColor: 'var(--gold)', cursor: 'pointer', height: 4 }}
    />
  )
}

function RangeLabels({ left, right }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>
      <span>{left}</span><span>{right}</span>
    </div>
  )
}

function PrimaryBtn({ children, onClick, disabled }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', padding: '13px 20px',
        borderRadius: 10,
        background: disabled
          ? 'rgba(255,255,255,0.04)'
          : hov
            ? 'linear-gradient(135deg, rgba(201,168,76,0.32) 0%, rgba(201,168,76,0.2) 100%)'
            : 'linear-gradient(135deg, rgba(201,168,76,0.22) 0%, rgba(201,168,76,0.12) 100%)',
        border: disabled ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(201,168,76,0.55)',
        color: disabled ? 'var(--text-muted)' : 'var(--gold-light)',
        fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        letterSpacing: '0.04em',
        transition: 'all 0.18s',
        boxShadow: disabled ? 'none' : hov ? '0 0 20px rgba(201,168,76,0.2)' : 'none',
      }}
    >
      {children}
    </button>
  )
}

function SecondaryBtn({ children, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', padding: '13px 20px',
        borderRadius: 10,
        background: hov ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
        cursor: 'pointer', letterSpacing: '0.04em',
        transition: 'all 0.18s',
      }}
    >
      {children}
    </button>
  )
}

function BackBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute', top: 14, left: 16,
        background: 'none', border: 'none',
        color: 'var(--text-muted)', fontSize: 12,
        cursor: 'pointer', fontFamily: 'var(--font-body)',
        transition: 'color 0.15s',
      }}
      onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
      onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
    >
      ← Back
    </button>
  )
}

function ErrBox({ msg }) {
  return (
    <div style={{
      padding: '8px 12px', borderRadius: 7,
      background: 'rgba(127,36,27,0.2)',
      border: '1px solid rgba(192,57,43,0.35)',
      color: '#e55a4a', fontSize: 12,
      fontFamily: 'var(--font-body)', marginBottom: 14,
      animation: 'fadeIn 0.2s ease',
    }}>
      ⚠ {msg}
    </div>
  )
}

const titleStyle = {
  fontFamily: 'var(--font-display)',
  fontSize: 24, fontWeight: 700,
  background: 'linear-gradient(135deg, var(--gold-dark), var(--gold-light))',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  marginBottom: 22, marginTop: 16,
}
