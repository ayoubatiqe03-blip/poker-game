/**
 * components/Lobby/LobbyScreen.jsx
 * Pre-game: create room, join with code, waiting room.
 */
import React, { useState } from 'react'
import { useGame } from '../../context/GameContext'

export default function LobbyScreen({ onCreateRoom, onJoinRoom, onStartGame }) {
  const { state } = useGame()
  const [mode, setMode] = useState('home') // 'home' | 'create' | 'join'
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [buyIn, setBuyIn] = useState(1000)
  const [smallBlind, setSmallBlind] = useState(10)
  const [error, setError] = useState('')

  const inRoom = !!state.roomCode

  // ── Waiting room (after joining) ──────────────────────────────────────────
  if (inRoom) {
    const lobby = state.lobbyState
    const players = lobby?.players ?? []
    const canStart = state.isHost && players.length >= 2

    return (
      <div style={screenStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h1 style={titleStyle}>Waiting Room</h1>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Room Code:</span>
              <div style={{
                background: 'rgba(201,168,76,0.12)',
                border: '1px solid var(--gold)',
                borderRadius: 8, padding: '6px 16px',
                fontFamily: 'var(--font-mono)',
                fontSize: 22, fontWeight: 600,
                color: 'var(--gold-light)',
                letterSpacing: '0.15em',
              }}>
                {state.roomCode}
              </div>
              <button
                onClick={() => navigator.clipboard?.writeText(state.roomCode)}
                style={smallBtnStyle}
                title="Copy room code"
              >
                📋
              </button>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>
              Share this code with your friends
            </div>
          </div>

          {/* Player list */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 10 }}>
              PLAYERS ({players.length}/9)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {players.map((p, i) => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 8,
                  background: p.id === state.playerId
                    ? 'rgba(201,168,76,0.1)'
                    : 'rgba(255,255,255,0.04)',
                  border: p.id === state.playerId
                    ? '1px solid rgba(201,168,76,0.3)'
                    : '1px solid rgba(255,255,255,0.06)',
                  animation: `fadeIn 0.3s ${i * 60}ms both`,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: p.isConnected ? '#1e8449' : '#922b21',
                  }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, flex: 1 }}>
                    {p.name}
                  </span>
                  {p.isHost && (
                    <span style={{
                      fontSize: 10, color: 'var(--gold)',
                      background: 'rgba(201,168,76,0.15)',
                      padding: '2px 7px', borderRadius: 3,
                      fontFamily: 'var(--font-body)', letterSpacing: '0.06em',
                    }}>
                      HOST
                    </span>
                  )}
                  {p.id === state.playerId && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>You</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Game options summary */}
          {lobby?.options && (
            <div style={{
              padding: '10px 14px', borderRadius: 8,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              marginBottom: 20,
              display: 'flex', gap: 20,
            }}>
              <Stat label="Starting chips" value={lobby.options.startingChips?.toLocaleString()} />
              <Stat label="Small blind" value={lobby.options.smallBlind} />
              <Stat label="Max players" value={lobby.options.maxPlayers} />
            </div>
          )}

          {/* Actions */}
          {state.isHost ? (
            <button
              onClick={onStartGame}
              disabled={!canStart}
              style={primaryBtnStyle(!canStart)}
            >
              {canStart ? '🃏  Start Game' : `Waiting for players (${players.length}/2 min)`}
            </button>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Waiting for host to start the game…
              <div style={{ marginTop: 6, animation: 'activePulse 1.5s infinite' }}>●</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Home screen ──────────────────────────────────────────────────────────
  if (mode === 'home') {
    return (
      <div style={screenStyle}>
        <div style={{ textAlign: 'center', marginBottom: 40, animation: 'fadeIn 0.5s ease' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🃏</div>
          <h1 style={{ ...titleStyle, fontSize: 42, marginBottom: 6 }}>Royal Flush</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Private Texas Hold'em for friends
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 320 }}>
          <button style={primaryBtnStyle()} onClick={() => setMode('create')}>
            Create Private Room
          </button>
          <button style={secondaryBtnStyle} onClick={() => setMode('join')}>
            Join with Code
          </button>
        </div>
      </div>
    )
  }

  // ── Create room ───────────────────────────────────────────────────────────
  if (mode === 'create') {
    const handleCreate = () => {
      const name = playerName.trim()
      if (!name) return setError('Enter your name')
      if (name.length > 16) return setError('Name too long (max 16 chars)')
      setError('')
      onCreateRoom({ playerName: name, options: { startingChips: buyIn, smallBlind } })
    }

    return (
      <div style={screenStyle}>
        <div style={cardStyle}>
          <button onClick={() => setMode('home')} style={backBtnStyle}>← Back</button>
          <h2 style={{ ...titleStyle, marginBottom: 24 }}>Create Room</h2>

          <FormField label="Your Name">
            <input style={inputStyle} value={playerName} onChange={e => setPlayerName(e.target.value)}
              placeholder="e.g. Vegas Mike" maxLength={16} onKeyDown={e => e.key === 'Enter' && handleCreate()} />
          </FormField>

          <FormField label={`Starting Chips: ${buyIn.toLocaleString()}`}>
            <input type="range" min={100} max={10000} step={100} value={buyIn}
              onChange={e => setBuyIn(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--gold)' }} />
            <div style={rangeLabels}>
              <span>100</span><span>10,000</span>
            </div>
          </FormField>

          <FormField label={`Small Blind: ${smallBlind}`}>
            <input type="range" min={1} max={100} step={1} value={smallBlind}
              onChange={e => setSmallBlind(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--gold)' }} />
            <div style={rangeLabels}>
              <span>1</span><span>100</span>
            </div>
          </FormField>

          {error && <div style={errorStyle}>{error}</div>}
          {state.error && <div style={errorStyle}>{state.error}</div>}

          <button style={primaryBtnStyle()} onClick={handleCreate}>
            Create Room
          </button>
        </div>
      </div>
    )
  }

  // ── Join room ─────────────────────────────────────────────────────────────
  if (mode === 'join') {
    const handleJoin = () => {
      const name = playerName.trim()
      const code = roomCode.trim().toUpperCase()
      if (!name) return setError('Enter your name')
      if (code.length !== 4) return setError('Room code must be 4 letters')
      setError('')
      onJoinRoom({ playerName: name, roomCode: code })
    }

    return (
      <div style={screenStyle}>
        <div style={cardStyle}>
          <button onClick={() => setMode('home')} style={backBtnStyle}>← Back</button>
          <h2 style={{ ...titleStyle, marginBottom: 24 }}>Join Room</h2>

          <FormField label="Room Code">
            <input
              style={{ ...inputStyle, letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: 20, textAlign: 'center' }}
              value={roomCode} onChange={e => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ABCD" maxLength={4} />
          </FormField>

          <FormField label="Your Name">
            <input style={inputStyle} value={playerName} onChange={e => setPlayerName(e.target.value)}
              placeholder="e.g. Lucky Linda" maxLength={16} onKeyDown={e => e.key === 'Enter' && handleJoin()} />
          </FormField>

          {error && <div style={errorStyle}>{error}</div>}
          {state.error && <div style={errorStyle}>{state.error}</div>}

          <button style={primaryBtnStyle()} onClick={handleJoin}>
            Join Room
          </button>
        </div>
      </div>
    )
  }

  return null
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Stat({ label, value }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--gold)' }}>{value}</div>
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 6 }}>
        {label.toUpperCase()}
      </label>
      {children}
    </div>
  )
}

// ── Styles ──────────────────────────────────────────────────────────────────

const screenStyle = {
  position: 'fixed', inset: 0,
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  background: `
    radial-gradient(ellipse at 30% 20%, rgba(22,30,10,0.8) 0%, transparent 60%),
    radial-gradient(ellipse at 70% 80%, rgba(30,14,4,0.8) 0%, transparent 60%),
    #0a0602
  `,
  padding: 20,
  zIndex: 80,
}

const cardStyle = {
  background: 'linear-gradient(160deg, rgba(18,10,4,0.96) 0%, rgba(12,7,2,0.96) 100%)',
  border: '1px solid rgba(201,168,76,0.2)',
  borderRadius: 16,
  padding: '32px 36px',
  width: '100%',
  maxWidth: 400,
  boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
  animation: 'fadeIn 0.4s ease',
  position: 'relative',
}

const titleStyle = {
  fontFamily: 'var(--font-display)',
  fontSize: 28,
  fontWeight: 700,
  background: 'linear-gradient(135deg, var(--gold-dark), var(--gold-light))',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  letterSpacing: '0.02em',
}

function primaryBtnStyle(disabled = false) {
  return {
    width: '100%', padding: '13px 20px',
    borderRadius: 8,
    background: disabled
      ? 'rgba(255,255,255,0.05)'
      : 'linear-gradient(135deg, rgba(201,168,76,0.25) 0%, rgba(201,168,76,0.15) 100%)',
    border: disabled ? '1px solid rgba(255,255,255,0.08)' : '1px solid var(--gold)',
    color: disabled ? 'var(--text-muted)' : 'var(--gold-light)',
    fontFamily: 'var(--font-body)',
    fontSize: 14, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    letterSpacing: '0.04em',
    transition: 'all 0.2s',
  }
}

const secondaryBtnStyle = {
  width: '100%', padding: '13px 20px',
  borderRadius: 8,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: 14, fontWeight: 500,
  cursor: 'pointer',
  letterSpacing: '0.04em',
}

const inputStyle = {
  width: '100%', padding: '10px 12px',
  borderRadius: 8,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)', fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.2s',
}

const backBtnStyle = {
  position: 'absolute', top: 16, left: 20,
  background: 'none', border: 'none',
  color: 'var(--text-muted)', fontSize: 13,
  cursor: 'pointer', fontFamily: 'var(--font-body)',
}

const errorStyle = {
  padding: '8px 12px', borderRadius: 6,
  background: 'rgba(146,43,33,0.2)',
  border: '1px solid rgba(146,43,33,0.4)',
  color: '#e74c3c', fontSize: 12,
  marginBottom: 14,
  fontFamily: 'var(--font-body)',
}

const smallBtnStyle = {
  background: 'none', border: 'none',
  cursor: 'pointer', fontSize: 16, padding: 4,
}

const rangeLabels = {
  display: 'flex', justifyContent: 'space-between',
  fontSize: 10, color: 'var(--text-muted)',
  fontFamily: 'var(--font-mono)', marginTop: 2,
}
