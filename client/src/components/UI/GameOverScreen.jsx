/**
 * components/UI/GameOverScreen.jsx
 *
 * Shown when gamePhase === 'gameover' (everyone but one player is eliminated,
 * or the server ended the game). Previously the app had no route for this
 * state and would leave the player stuck on a blank table.
 */
import React from 'react'
import { useGame } from '../../context/GameContext'
import { formatChips } from '../../utils/cardHelpers'

export default function GameOverScreen({ onPlayAgain }) {
  const { state } = useGame()
  const players = state.publicState?.players ?? []
  const winner = players.find(p => !p.isEliminated) ?? players[0]

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: `
        radial-gradient(ellipse at 30% 20%, rgba(22,30,10,0.8) 0%, transparent 60%),
        radial-gradient(ellipse at 70% 80%, rgba(30,14,4,0.8) 0%, transparent 60%),
        #0a0602
      `,
      zIndex: 90,
      animation: 'fadeIn 0.5s ease',
    }}>
      <div style={{
        background: 'linear-gradient(160deg, rgba(18,10,4,0.98) 0%, rgba(10,6,2,0.98) 100%)',
        border: '1px solid rgba(201,168,76,0.3)',
        borderRadius: 16,
        padding: '40px 48px',
        textAlign: 'center',
        maxWidth: 440,
        width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 32,
          fontWeight: 700,
          background: 'linear-gradient(135deg, var(--gold-dark), var(--gold-light))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 8,
        }}>
          Game Over
        </h1>

        {winner && (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
              Winner of the table
            </p>
            <div style={{
              background: 'rgba(201,168,76,0.1)',
              border: '1px solid rgba(201,168,76,0.3)',
              borderRadius: 10,
              padding: '16px 24px',
              marginBottom: 28,
            }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                color: 'var(--gold-light)',
                marginBottom: 6,
              }}>
                {winner.name}
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 16,
                color: 'var(--gold)',
              }}>
                🪙 {formatChips(winner.chips)} chips
              </div>
            </div>
          </>
        )}

        {/* Final standings */}
        {players.length > 1 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{
              fontSize: 11, color: 'var(--text-muted)',
              letterSpacing: '0.1em', marginBottom: 10,
            }}>
              FINAL STANDINGS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[...players]
                .sort((a, b) => b.chips - a.chips)
                .map((p, i) => (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 12px', borderRadius: 6,
                    background: p.id === state.playerId
                      ? 'rgba(201,168,76,0.1)'
                      : 'rgba(255,255,255,0.03)',
                    border: p.id === state.playerId
                      ? '1px solid rgba(201,168,76,0.25)'
                      : '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12, minWidth: 20 }}>
                      #{i + 1}
                    </span>
                    <span style={{
                      flex: 1, textAlign: 'left',
                      fontFamily: 'var(--font-body)', fontSize: 13,
                      color: p.id === state.playerId ? 'var(--gold-light)' : 'var(--text-primary)',
                      paddingLeft: 8,
                    }}>
                      {p.name}{p.id === state.playerId ? ' (you)' : ''}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 12,
                      color: 'var(--gold)',
                    }}>
                      {formatChips(p.chips)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        <button
          onClick={onPlayAgain}
          style={{
            width: '100%', padding: '13px 20px',
            borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(201,168,76,0.25) 0%, rgba(201,168,76,0.15) 100%)',
            border: '1px solid var(--gold)',
            color: 'var(--gold-light)',
            fontFamily: 'var(--font-body)',
            fontSize: 14, fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: '0.04em',
          }}
        >
          Back to Lobby
        </button>
      </div>
    </div>
  )
}
