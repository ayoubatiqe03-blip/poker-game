/**
 * components/Table/PokerTable.jsx
 *
 * Fixes:
 *   1. Dealer resolution: `dealerIndex` is an index into the server's players
 *      array, not into the client's reordered `orderedPlayers` display array.
 *      We resolve the actual dealer player by id before checking isDealer.
 *   2. orderedPlayers: when myPlayerId is not found (spectator / reconnecting),
 *      falls back to server order rather than crashing.
 *   3. Empty seats: always render all 9 slots so the table doesn't reflow.
 */
import React, { useRef } from 'react'
import PlayerSeat from '../Player/PlayerSeat'
import CommunityCards from './CommunityCards'

// [left%, top%] within the outer container for each of the 9 seat slots
const SEAT_POSITIONS = [
  null,           // index 0 unused
  [50,   91],     // 1  bottom-center (hero)
  [18,   80],     // 2  bottom-left
  [4,    52],     // 3  left
  [14,   22],     // 4  top-left
  [35,   8],      // 5  top-center-left
  [65,   8],      // 6  top-center-right
  [86,   22],     // 7  top-right
  [96,   52],     // 8  right
  [82,   80],     // 9  bottom-right
]

export default function PokerTable({
  players = [],
  myPlayerId,
  dealerIndex = 0,
  communityCards = [],
  pot = 0,
  sidePots = [],
  phase,
  activePlayerId,
  actionInfo,
  myCards = [],
  lastActions = {},
}) {
  const containerRef = useRef(null)

  // Resolve who is the dealer by id — dealerIndex is into the server's players array
  const dealerPlayer = players[dealerIndex] ?? null

  // Rotate so the local player always appears in seat 1 (bottom)
  const myIndex = players.findIndex(p => p.id === myPlayerId)
  const startIndex = myIndex >= 0 ? myIndex : 0

  // Build 9-slot display array; unfilled slots are null
  const orderedPlayers = Array.from({ length: 9 }, (_, i) => {
    if (i < players.length) {
      return players[(startIndex + i) % players.length]
    }
    return null
  })

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', userSelect: 'none' }}>
      {/* ── Wood rim ─────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', left: '8%', top: '6%',
        width: '84%', height: '82%',
        borderRadius: '50%',
        background: `
          radial-gradient(ellipse at 30% 20%, #5c2e0a 0%, transparent 60%),
          radial-gradient(ellipse at 70% 80%, #3d1f06 0%, transparent 60%),
          linear-gradient(160deg, #4a2209 0%, #2a1305 40%, #1e0c04 100%)
        `,
        boxShadow: `
          0 0 0 6px #150800,
          0 20px 60px rgba(0,0,0,0.8),
          inset 0 2px 4px rgba(255,255,255,0.06),
          inset 0 -4px 8px rgba(0,0,0,0.5)
        `,
      }} />

      {/* ── Felt ─────────────────────────────────────────────────────────── */}
      <div className="felt-texture" style={{
        position: 'absolute', left: '11%', top: '10%',
        width: '78%', height: '74%', borderRadius: '50%',
        background: `radial-gradient(ellipse at 50% 40%, var(--felt-highlight) 0%, var(--felt-mid) 40%, var(--felt-dark) 100%)`,
        boxShadow: `
          inset 0 4px 30px rgba(0,0,0,0.4),
          inset 0 -4px 20px rgba(0,0,0,0.3),
          0 0 0 2px rgba(0,0,0,0.3)
        `,
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 20, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 28, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
      </div>

      {/* ── Community cards ───────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', left: '50%', top: '46%',
        transform: 'translate(-50%, -50%)', zIndex: 15,
      }}>
        <CommunityCards
          communityCards={communityCards}
          pot={pot}
          sidePots={sidePots}
          phase={phase}
        />
      </div>

      {/* ── Player seats ─────────────────────────────────────────────────── */}
      {orderedPlayers.map((player, i) => {
        const seatNum = i + 1
        const pos = SEAT_POSITIONS[seatNum]
        if (!pos) return null

        const isMe     = player?.id === myPlayerId
        const isActive = player?.id === activePlayerId
        // FIX: compare by player id, not by array index
        const isDealer = dealerPlayer !== null && player?.id === dealerPlayer.id

        return (
          <PlayerSeat
            key={player?.id ?? `empty-${seatNum}`}
            player={player}
            seatNumber={seatNum}
            isMe={isMe}
            isActive={isActive}
            isDealer={isDealer}
            myCards={isMe ? myCards : []}
            actionInfo={isActive ? actionInfo : null}
            lastAction={player ? lastActions[player.id] : null}
            style={{ left: `${pos[0]}%`, top: `${pos[1]}%` }}
          />
        )
      })}
    </div>
  )
}
