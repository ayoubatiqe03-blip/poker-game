/**
 * components/Table/PokerTable.jsx
 *
 * Performance fixes:
 *   - Static decoration layers (wood, felt, watermark) extracted into a
 *     memo'd component — they never re-render on socket updates
 *   - will-change: transform on the container so the compositor can
 *     promote it to its own GPU layer
 *   - Reduced number of stacked radial gradients in the background
 */
import React, { useRef, memo } from 'react'
import PlayerSeat from '../Player/PlayerSeat'
import CommunityCards from './CommunityCards'

const SEAT_POSITIONS = [
  null,
  [50,  91],   // 1  hero (bottom-centre)
  [18,  80],   // 2
  [4,   52],   // 3
  [14,  22],   // 4
  [35,   8],   // 5
  [65,   8],   // 6
  [86,  22],   // 7
  [96,  52],   // 8
  [82,  80],   // 9
]

// ── Static table decoration — memo'd so it never re-renders ─────────────────
const TableDecor = memo(function TableDecor() {
  return (
    <>
      {/* Outer shadow */}
      <div style={{
        position: 'absolute', left: '6%', top: '4%', width: '88%', height: '88%',
        borderRadius: '50%',
        boxShadow: '0 24px 80px rgba(0,0,0,0.85), 0 8px 24px rgba(0,0,0,0.6)',
        pointerEvents: 'none',
      }} />

      {/* Wood rail */}
      <div style={{
        position: 'absolute', left: '7%', top: '5%', width: '86%', height: '86%',
        borderRadius: '50%',
        background: [
          'radial-gradient(ellipse at 35% 25%, #7a3e14 0%, transparent 50%)',
          'radial-gradient(ellipse at 65% 75%, #6a3010 0%, transparent 50%)',
          'linear-gradient(160deg, #5a2d0c 0%, #3b1c07 35%, #1e0d03 70%, #140900 100%)',
        ].join(', '),
        boxShadow: [
          'inset 0 3px 6px rgba(255,255,255,0.07)',
          'inset 0 -4px 8px rgba(0,0,0,0.5)',
          '0 0 0 5px #0e0600',
        ].join(', '),
      }} />

      {/* Rail inner highlight ring */}
      <div style={{
        position: 'absolute', left: '8.5%', top: '6.5%', width: '83%', height: '83%',
        borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.055)',
        pointerEvents: 'none',
      }} />

      {/* Felt surface */}
      <div
        className="felt-surface"
        style={{
          position: 'absolute', left: '11%', top: '10%', width: '78%', height: '76%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 35%, #196835 0%, #0f4d24 45%, #0a3018 100%)',
          boxShadow: [
            'inset 0 6px 40px rgba(0,0,0,0.45)',
            'inset 0 -4px 20px rgba(0,0,0,0.3)',
            '0 0 0 2px rgba(0,0,0,0.4)',
          ].join(', '),
          overflow: 'hidden',
        }}
      >
        {/* Stitching rings */}
        <div style={{ position:'absolute', inset:14, borderRadius:'50%', border:'1.5px dashed rgba(255,255,255,0.055)', pointerEvents:'none', zIndex:3 }} />
        <div style={{ position:'absolute', inset:8,  borderRadius:'50%', border:'1px solid rgba(255,255,255,0.03)',     pointerEvents:'none', zIndex:3 }} />
        {/* Centre spotlight */}
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 60% 40% at 50% 45%, rgba(255,255,255,0.04) 0%, transparent 70%)', pointerEvents:'none', zIndex:3 }} />
        {/* Watermark */}
        <div style={{
          position:'absolute', inset:0,
          display:'flex', alignItems:'center', justifyContent:'center',
          zIndex:2, pointerEvents:'none',
        }}>
          <div style={{
            fontFamily:'var(--font-display)',
            fontSize:'clamp(10px,2vw,18px)',
            letterSpacing:'0.25em',
            color:'rgba(255,255,255,0.035)',
            textTransform:'uppercase',
            userSelect:'none',
            marginTop:'6%',
          }}>ROYAL FLUSH</div>
        </div>
      </div>
    </>
  )
})

// ── Main component ────────────────────────────────────────────────────────────
export default function PokerTable({
  players = [], myPlayerId, dealerIndex = 0,
  communityCards = [], pot = 0, sidePots = [], phase,
  activePlayerId, actionInfo, myCards = [], lastActions = {},
}) {
  const containerRef  = useRef(null)
  const dealerPlayer  = players[dealerIndex] ?? null
  const myIndex       = players.findIndex(p => p.id === myPlayerId)
  const startIndex    = myIndex >= 0 ? myIndex : 0

  const orderedPlayers = Array.from({ length: 9 }, (_, i) =>
    i < players.length ? players[(startIndex + i) % players.length] : null
  )

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative', width: '100%', height: '100%',
        userSelect: 'none',
        // Promote to GPU layer — compositor handles re-paints without main-thread work
        willChange: 'transform',
      }}
    >
      {/* Static decoration (never re-renders) */}
      <TableDecor />

      {/* Community cards (centre of felt) */}
      <div style={{
        position: 'absolute', left: '50%', top: '45%',
        transform: 'translate(-50%, -50%)', zIndex: 15,
      }}>
        <CommunityCards
          communityCards={communityCards}
          pot={pot} sidePots={sidePots} phase={phase}
        />
      </div>

      {/* Player seats */}
      {orderedPlayers.map((player, i) => {
        const seatNum = i + 1
        const pos     = SEAT_POSITIONS[seatNum]
        if (!pos) return null
        return (
          <PlayerSeat
            key={player?.id ?? `empty-${seatNum}`}
            player={player}
            seatNumber={seatNum}
            isMe={player?.id === myPlayerId}
            isActive={player?.id === activePlayerId}
            isDealer={dealerPlayer !== null && player?.id === dealerPlayer.id}
            myCards={player?.id === myPlayerId ? myCards : []}
            actionInfo={player?.id === activePlayerId ? actionInfo : null}
            lastAction={player ? lastActions[player.id] : null}
            style={{ left: `${pos[0]}%`, top: `${pos[1]}%` }}
          />
        )
      })}
    </div>
  )
}
