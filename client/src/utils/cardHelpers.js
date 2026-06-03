/**
 * utils/cardHelpers.js
 */

export const SUIT_SYMBOLS = { s: '♠', h: '♥', d: '♦', c: '♣' }
export const SUIT_COLORS  = { s: 'black', h: 'red', d: 'red', c: 'black' }

export const RANK_DISPLAY = {
  T: '10', J: 'J', Q: 'Q', K: 'K', A: 'A',
}

export function displayRank(rank) {
  return RANK_DISPLAY[rank] ?? rank
}

export function displayCard(card) {
  if (!card || card.rank === '?') return null
  return {
    rank: displayRank(card.rank),
    suit: SUIT_SYMBOLS[card.suit],
    color: SUIT_COLORS[card.suit],
    isRed: card.suit === 'h' || card.suit === 'd',
  }
}

/** Format chip amounts — 1500 → "1,500"  |  1500000 → "1.5M" */
export function formatChips(n) {
  if (n === undefined || n === null) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 10_000)    return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return n.toLocaleString()
}

/** Pick chip denomination color for visual stack representation */
export function chipColor(value) {
  if (value >= 500)  return '#7d3c98'   // purple
  if (value >= 100)  return '#1c2833'   // black
  if (value >= 25)   return '#2471a3'   // blue
  if (value >= 10)   return '#1e8449'   // green
  if (value >= 5)    return '#c0392b'   // red
  return '#f5f5f0'                      // white
}

/** Generate a small stack of chip visuals from a chip count */
export function chipsToStack(amount) {
  if (!amount) return []
  const denoms = [500, 100, 25, 10, 5, 1]
  const stack = []
  let remaining = amount
  for (const d of denoms) {
    const count = Math.floor(remaining / d)
    if (count > 0) {
      stack.push({ denom: d, count: Math.min(count, 8), color: chipColor(d) })
      remaining -= count * d
    }
  }
  return stack.slice(0, 4) // max 4 denominations shown
}

/** Seat positions around an elliptical table (9 seats, 0 = bottom-center) */
export function getSeatPosition(seatIndex, totalSeats, containerW, containerH) {
  // Positions are percentages of container dimensions
  const positions = {
    1: [50, 88],   // bottom center (hero)
    2: [16, 75],   // bottom left
    3: [6,  48],   // left
    4: [16, 22],   // top left
    5: [38, 8],    // top center-left
    6: [62, 8],    // top center-right
    7: [84, 22],   // top right
    8: [94, 48],   // right
    9: [84, 75],   // bottom right
  }
  return positions[seatIndex] ?? [50, 50]
}
