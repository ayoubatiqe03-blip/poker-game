/**
 * server/src/game/HandEvaluator.js
 *
 * Evaluates the best 5-card poker hand from up to 7 cards (2 hole + 5 community).
 *
 * Hand rankings (highest → lowest):
 *   9  Royal Flush
 *   8  Straight Flush
 *   7  Four of a Kind
 *   6  Full House
 *   5  Flush
 *   4  Straight
 *   3  Three of a Kind
 *   2  Two Pair
 *   1  One Pair
 *   0  High Card
 */

/** Return all combinations of size k from array arr. */
function combinations(arr, k) {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  const withFirst = combinations(rest, k - 1).map(c => [first, ...c]);
  const withoutFirst = combinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

/** Sort cards descending by value. */
function sortDesc(cards) {
  return [...cards].sort((a, b) => b.value - a.value);
}

/**
 * Evaluate exactly 5 cards.
 * Returns { rank, tiebreakers, name }
 *   rank        : 0–9 integer
 *   tiebreakers : array of values used to break ties within the same rank
 *   name        : human-readable string
 */
function evaluate5(cards) {
  const sorted = sortDesc(cards);
  const values = sorted.map(c => c.value);
  const suits = sorted.map(c => c.suit);

  const isFlush = suits.every(s => s === suits[0]);

  // Check for straight (including A-2-3-4-5 wheel)
  let isStraight = false;
  let straightHigh = values[0];
  if (
    values[0] - values[4] === 4 &&
    new Set(values).size === 5
  ) {
    isStraight = true;
    straightHigh = values[0];
  }
  // Wheel: A-2-3-4-5
  if (
    values[0] === 14 &&
    values[1] === 5 &&
    values[2] === 4 &&
    values[3] === 3 &&
    values[4] === 2
  ) {
    isStraight = true;
    straightHigh = 5;
  }

  // Count occurrences of each value
  const counts = {};
  for (const v of values) counts[v] = (counts[v] || 0) + 1;
  const countArr = Object.entries(counts)
    .map(([v, c]) => ({ v: Number(v), c }))
    .sort((a, b) => b.c - a.c || b.v - a.v); // sort by count desc, then value desc

  const groups = countArr.map(x => x.c); // e.g. [4,1] or [3,2] or [2,2,1] etc.
  const groupVals = countArr.map(x => x.v);

  // --- Determine hand rank ---

  if (isFlush && isStraight) {
    if (straightHigh === 14) return { rank: 9, tiebreakers: [14], name: 'Royal Flush' };
    return { rank: 8, tiebreakers: [straightHigh], name: 'Straight Flush' };
  }
  if (groups[0] === 4) {
    return { rank: 7, tiebreakers: groupVals, name: 'Four of a Kind' };
  }
  if (groups[0] === 3 && groups[1] === 2) {
    return { rank: 6, tiebreakers: groupVals, name: 'Full House' };
  }
  if (isFlush) {
    return { rank: 5, tiebreakers: values, name: 'Flush' };
  }
  if (isStraight) {
    return { rank: 4, tiebreakers: [straightHigh], name: 'Straight' };
  }
  if (groups[0] === 3) {
    return { rank: 3, tiebreakers: groupVals, name: 'Three of a Kind' };
  }
  if (groups[0] === 2 && groups[1] === 2) {
    return { rank: 2, tiebreakers: groupVals, name: 'Two Pair' };
  }
  if (groups[0] === 2) {
    return { rank: 1, tiebreakers: groupVals, name: 'One Pair' };
  }
  return { rank: 0, tiebreakers: values, name: 'High Card' };
}

/**
 * Find the best 5-card hand from an array of 5–7 cards.
 * Returns the result of evaluate5 for the best combination,
 * plus `bestCards` (the 5 cards that make it).
 */
function bestHand(cards) {
  if (cards.length < 5) throw new Error('Need at least 5 cards');
  const combos = combinations(cards, 5);
  let best = null;
  let bestCards = null;

  for (const combo of combos) {
    const result = evaluate5(combo);
    if (!best || compareHandResults(result, best) > 0) {
      best = result;
      bestCards = combo;
    }
  }
  return { ...best, bestCards };
}

/**
 * Compare two hand results.
 * Returns positive if a wins, negative if b wins, 0 if tie.
 */
function compareHandResults(a, b) {
  if (a.rank !== b.rank) return a.rank - b.rank;
  for (let i = 0; i < Math.max(a.tiebreakers.length, b.tiebreakers.length); i++) {
    const av = a.tiebreakers[i] ?? 0;
    const bv = b.tiebreakers[i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return 0; // true tie
}

/**
 * Determine winners from an array of active players, each with `holeCards`,
 * given the 5 `communityCards`.
 *
 * Returns an array of winner objects:
 *   { playerId, handName, bestCards, tiebreakers }
 *
 * Multiple winners means a split pot.
 */
function determineWinners(players, communityCards) {
  const evaluated = players.map(player => {
    const allCards = [...player.holeCards, ...communityCards];
    const result = bestHand(allCards);
    return { playerId: player.id, ...result };
  });

  // Sort best → worst
  evaluated.sort((a, b) => compareHandResults(b, a));

  const best = evaluated[0];
  const winners = evaluated.filter(e => compareHandResults(e, best) === 0);

  return winners.map(w => ({
    playerId: w.playerId,
    handName: w.name,
    bestCards: w.bestCards,
    tiebreakers: w.tiebreakers,
  }));
}

module.exports = { bestHand, evaluate5, determineWinners, compareHandResults, combinations };
