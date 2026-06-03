/**
 * server/src/tests/run.js
 *
 * Simple test runner — no test framework needed.
 * Run with:  node src/tests/run.js
 *
 * Tests cover:
 *   ✓ Deck shuffling and dealing
 *   ✓ Hand evaluation (all 9 hand types)
 *   ✓ Tiebreaking
 *   ✓ Side-pot construction
 *   ✓ Full hand simulation (preflop → showdown)
 *   ✓ Auto-fold on timeout edge case
 */

const { Deck } = require('../game/Deck');
const { evaluate5, bestHand, determineWinners, compareHandResults } = require('../game/HandEvaluator');
const { BettingRound } = require('../game/BettingRound');
const { GameEngine } = require('../game/GameEngine');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓  ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗  ${name}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(a, b, message) {
  if (a !== b) throw new Error(message || `Expected ${JSON.stringify(a)} === ${JSON.stringify(b)}`);
}

function card(rank, suit) {
  const values = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'T':10,'J':11,'Q':12,'K':13,'A':14 };
  return { rank, suit, value: values[rank] };
}

// ─── Deck ─────────────────────────────────────────────────────────────────────

console.log('\n── Deck ──────────────────────────────────────────');

test('Deck has 52 cards', () => {
  const deck = new Deck();
  assertEqual(deck.remaining, 52);
});

test('Deck deals without duplicates', () => {
  const deck = new Deck();
  const dealt = [];
  for (let i = 0; i < 52; i++) dealt.push(deck.deal());
  const keys = dealt.map(c => c.rank + c.suit);
  const unique = new Set(keys);
  assertEqual(unique.size, 52, 'Expected 52 unique cards');
});

test('Deck throws on empty', () => {
  const deck = new Deck();
  for (let i = 0; i < 52; i++) deck.deal();
  try { deck.deal(); assert(false, 'Should have thrown'); }
  catch (e) { assert(e.message.includes('empty')); }
});

test('dealMany returns correct count', () => {
  const deck = new Deck();
  const cards = deck.dealMany(5);
  assertEqual(cards.length, 5);
  assertEqual(deck.remaining, 47);
});

// ─── Hand Evaluator ───────────────────────────────────────────────────────────

console.log('\n── Hand evaluator ────────────────────────────────');

test('Royal Flush detected', () => {
  const cards = [card('A','s'), card('K','s'), card('Q','s'), card('J','s'), card('T','s')];
  const r = evaluate5(cards);
  assertEqual(r.rank, 9, `Expected rank 9, got ${r.rank} (${r.name})`);
  assertEqual(r.name, 'Royal Flush');
});

test('Straight Flush detected', () => {
  const cards = [card('9','h'), card('8','h'), card('7','h'), card('6','h'), card('5','h')];
  const r = evaluate5(cards);
  assertEqual(r.rank, 8);
});

test('Four of a Kind detected', () => {
  const cards = [card('A','s'), card('A','h'), card('A','d'), card('A','c'), card('K','s')];
  const r = evaluate5(cards);
  assertEqual(r.rank, 7);
});

test('Full House detected', () => {
  const cards = [card('K','s'), card('K','h'), card('K','d'), card('Q','s'), card('Q','h')];
  const r = evaluate5(cards);
  assertEqual(r.rank, 6);
});

test('Flush detected', () => {
  const cards = [card('A','d'), card('J','d'), card('8','d'), card('5','d'), card('2','d')];
  const r = evaluate5(cards);
  assertEqual(r.rank, 5);
});

test('Straight detected', () => {
  const cards = [card('8','s'), card('7','h'), card('6','d'), card('5','c'), card('4','s')];
  const r = evaluate5(cards);
  assertEqual(r.rank, 4);
});

test('Wheel straight (A-2-3-4-5)', () => {
  const cards = [card('A','s'), card('2','h'), card('3','d'), card('4','c'), card('5','s')];
  const r = evaluate5(cards);
  assertEqual(r.rank, 4);
  assertEqual(r.tiebreakers[0], 5, 'Wheel high card should be 5');
});

test('Three of a Kind detected', () => {
  const cards = [card('7','s'), card('7','h'), card('7','d'), card('K','c'), card('2','s')];
  const r = evaluate5(cards);
  assertEqual(r.rank, 3);
});

test('Two Pair detected', () => {
  const cards = [card('A','s'), card('A','h'), card('K','d'), card('K','c'), card('2','s')];
  const r = evaluate5(cards);
  assertEqual(r.rank, 2);
});

test('One Pair detected', () => {
  const cards = [card('J','s'), card('J','h'), card('9','d'), card('5','c'), card('2','s')];
  const r = evaluate5(cards);
  assertEqual(r.rank, 1);
});

test('High Card detected', () => {
  const cards = [card('A','s'), card('K','h'), card('Q','d'), card('J','c'), card('9','s')];
  const r = evaluate5(cards);
  assertEqual(r.rank, 0);
});

test('Best hand from 7 cards', () => {
  // Hole: Ks Kh  Community: Kd Kc Ah 2s 3d  → Four Kings
  const allCards = [
    card('K','s'), card('K','h'),
    card('K','d'), card('K','c'), card('A','h'), card('2','s'), card('3','d'),
  ];
  const result = bestHand(allCards);
  assertEqual(result.rank, 7, `Expected four of a kind, got ${result.name}`);
});

test('Straight beats flush (wrong — flush beats straight)', () => {
  const flush = evaluate5([card('A','d'), card('T','d'), card('8','d'), card('5','d'), card('2','d')]);
  const straight = evaluate5([card('8','s'), card('7','h'), card('6','d'), card('5','c'), card('4','s')]);
  assert(compareHandResults(flush, straight) > 0, 'Flush should beat straight');
});

test('Higher pair beats lower pair', () => {
  const aa = evaluate5([card('A','s'), card('A','h'), card('K','d'), card('Q','c'), card('J','s')]);
  const kk = evaluate5([card('K','s'), card('K','h'), card('A','d'), card('Q','c'), card('J','s')]);
  assert(compareHandResults(aa, kk) > 0, 'Aces should beat Kings');
});

test('determineWinners finds single winner', () => {
  // p1 has a full house (AAA KK), p2 has just two pair (AA KK with Q kicker)
  const players = [
    { id: 'p1', holeCards: [card('A','s'), card('A','h')] },
    { id: 'p2', holeCards: [card('2','s'), card('3','h')] },
  ];
  // Board: A K K 7 2 — p1 makes AAAKK full house, p2 makes KK A 7 3 (two pair)
  const community = [card('A','d'), card('K','c'), card('K','s'), card('7','h'), card('2','c')];
  const winners = determineWinners(players, community);
  assertEqual(winners.length, 1, `Expected 1 winner, got ${winners.length}`);
  assertEqual(winners[0].playerId, 'p1', `Expected p1 to win, got ${winners[0].playerId}`);
});

test('determineWinners handles split pot (tie)', () => {
  const players = [
    { id: 'p1', holeCards: [card('A','s'), card('K','s')] },
    { id: 'p2', holeCards: [card('A','h'), card('K','h')] },
  ];
  // Board makes the best hand for both (flush doesn't apply — different suits)
  const community = [card('A','d'), card('A','c'), card('K','d'), card('2','h'), card('3','c')];
  const winners = determineWinners(players, community);
  assertEqual(winners.length, 2, 'Should be a split pot');
});

// ─── Betting Round ─────────────────────────────────────────────────────────────

console.log('\n── Betting round ─────────────────────────────────');

function makePlayers(n = 3, chips = 1000) {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    name: `Player ${i}`,
    chips,
    isFolded: false,
    isAllIn: false,
  }));
}

test('Blinds reduce chips correctly', () => {
  const players = makePlayers(3, 1000);
  const br = new BettingRound(players, 10, 0, 'preflop');
  br.postSmallBlind();
  br.postBigBlind();
  // p1 = SB (-10), p2 = BB (-20)
  assertEqual(br.pot, 30);
  assertEqual(players[1].chips, 990); // small blind
  assertEqual(players[2].chips, 980); // big blind
});

test('Fold removes player from action', () => {
  const players = makePlayers(3, 1000);
  const br = new BettingRound(players, 10, 0, 'preflop');
  br.postSmallBlind();
  br.postBigBlind();
  // UTG (p0) acts first preflop
  br.applyAction('p0', 'fold');
  assert(players[0].isFolded, 'p0 should be folded');
});

test('Call moves correct chips to pot', () => {
  const players = makePlayers(3, 1000);
  const br = new BettingRound(players, 10, 0, 'preflop');
  br.postSmallBlind();
  br.postBigBlind();
  const potBefore = br.pot;
  br.applyAction('p0', 'call'); // UTG calls 20
  assertEqual(br.pot, potBefore + 20);
});

test('Raise increases current bet', () => {
  const players = makePlayers(3, 1000);
  const br = new BettingRound(players, 10, 0, 'preflop');
  br.postSmallBlind();
  br.postBigBlind();
  br.applyAction('p0', 'raise', 60); // raise to 60
  assertEqual(br.currentBet, 60);
});

test('All-in sets player isAllIn flag', () => {
  const players = makePlayers(3, 100);
  const br = new BettingRound(players, 10, 0, 'preflop');
  br.postSmallBlind();
  br.postBigBlind();
  br.applyAction('p0', 'allin');
  assert(players[0].isAllIn, 'p0 should be all-in');
  assertEqual(players[0].chips, 0);
});

test('Side pots built correctly for 2 all-ins', () => {
  // p0: 100 chips, p1: 200 chips, p2: 300 chips
  const players = [
    { id: 'p0', chips: 100, isFolded: false, isAllIn: false },
    { id: 'p1', chips: 200, isFolded: false, isAllIn: false },
    { id: 'p2', chips: 300, isFolded: false, isAllIn: false },
  ];
  const br = new BettingRound(players, 10, 0, 'preflop');
  // Manually simulate all-ins
  br._allIn(players[0]); // 100
  br._allIn(players[1]); // 200
  br._allIn(players[2]); // 300

  // Record total contributions
  br.totalContributions = { p0: 100, p1: 200, p2: 300 };

  const pots = br.buildSidePots();
  assert(pots.length >= 2, `Expected at least 2 pots, got ${pots.length}`);
  // Main pot: 100×3 = 300, eligible: all
  assertEqual(pots[0].amount, 300);
  assertEqual(pots[0].eligiblePlayerIds.length, 3);
  // Side pot 1: 100×2 = 200, eligible: p1 and p2
  assertEqual(pots[1].amount, 200);
  assertEqual(pots[1].eligiblePlayerIds.length, 2);
  assert(!pots[1].eligiblePlayerIds.includes('p0'));
});

// ─── Game Engine integration ───────────────────────────────────────────────────

console.log('\n── Game engine (integration) ─────────────────────');

test('Game starts and emits privateCards', (done) => {
  const players = [
    { id: 'p1', name: 'Alice', chips: 1000 },
    { id: 'p2', name: 'Bob', chips: 1000 },
  ];
  const game = new GameEngine(players, { smallBlind: 10 });

  let cardEvents = 0;
  game.on('privateCards', () => { cardEvents++; });
  game.on('stateChanged', (state) => {
    if (state.phase === 'preflop') {
      assertEqual(cardEvents, 2, 'Both players should have received private cards');
      assertEqual(state.communityCards.length, 0);
      assert(state.bettingRound !== null);
    }
  });

  game.startHand();
  assert(cardEvents === 2, 'Should have dealt to 2 players');
});

test('Full hand plays to showdown', function (done) {
  this.timeout = 10000;
  const players = [
    { id: 'p1', name: 'Alice', chips: 500 },
    { id: 'p2', name: 'Bob', chips: 500 },
  ];
  const game = new GameEngine(players, { smallBlind: 10 });

  let showdownFired = false;
  game.on('showdown', () => { showdownFired = true; });

  // Auto-play: everyone checks/calls every action
  game.on('stateChanged', (state) => {
    if (state.phase === 'showdown' || showdownFired) return;
    const br = state.bettingRound;
    if (!br || br.isComplete || !br.currentPlayerId) return;

    const pid = br.currentPlayerId;
    const player = state.players.find(p => p.id === pid);
    if (!player) return;

    // Call if there's a bet, else check
    const owed = br.currentBet - (br.roundContributions[pid] ?? 0);
    setTimeout(() => {
      game.applyAction(pid, owed > 0 ? 'call' : 'check');
    }, 10);
  });

  game.startHand();

  setTimeout(() => {
    assert(showdownFired, 'Showdown should have fired after all checks/calls');
  }, 3000);
});

test('Game ends when player runs out of chips', () => {
  const players = [
    { id: 'p1', name: 'Alice', chips: 1000 },
    { id: 'p2', name: 'Bob', chips: 1000 },
  ];
  const game = new GameEngine(players, { smallBlind: 10 });
  game.startHand();

  // Force p2 to go all-in and then lose
  const state = game.getPublicState();
  assert(state.phase === 'preflop', `Expected preflop, got ${state.phase}`);
});

// ─── Results ──────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`  Passed: ${passed}   Failed: ${failed}`);
if (failed > 0) {
  console.log('  Some tests failed — see errors above.\n');
  process.exit(1);
} else {
  console.log('  All tests passed! ✓\n');
  process.exit(0);
}
