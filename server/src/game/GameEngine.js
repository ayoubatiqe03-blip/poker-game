/**
 * server/src/game/GameEngine.js
 *
 * Full Texas Hold'em game state machine.
 *
 * All fixes applied across all sessions:
 *  1. dealerIndex translated to activePlayers array index before BettingRound
 *  2. _handTotalContributions accumulated per-street, not duplicated
 *  3. _buildFinalSidePots: correct multi-level side-pot construction
 *  4. potLabel: uses pot-loop index, not winner-loop index (split-pot label bug)
 *  5. Phase → 'waiting' BEFORE emitting handComplete (prevents startHand race)
 *  6. _rotateDealerButton: skips eliminated + zero-chip players
 *  7. _startBettingRound: skips round only when no one owes chips
 *  8. Showdown event includes player names for WinnerOverlay
 *  9. Input sanitization on player names and chip counts
 */

const EventEmitter  = require('events');
const { Deck }      = require('./Deck');
const { BettingRound } = require('./BettingRound');
const { determineWinners } = require('./HandEvaluator');

const ACTION_TIMEOUT_MS = 30_000;

class GameEngine extends EventEmitter {
  constructor(players, options = {}) {
    super();
    this.options = { smallBlind: 10, ...options };
    this.deck    = new Deck();
    this.phase   = 'waiting';

    this.players = players.map(p => ({
      id:           p.id,
      name:         String(p.name ?? 'Player').trim().slice(0, 20),
      chips:        Math.max(0, Math.floor(Number(p.chips) || 0)),
      holeCards:    [],
      isFolded:     false,
      isAllIn:      false,
      isSittingOut: false,
      isEliminated: false,
    }));

    this.dealerIndex             = 0;
    this.communityCards          = [];
    this.pot                     = 0;
    this.sidePots                = [];
    this.currentBettingRound     = null;
    this.lastWinners             = [];
    this.handNumber              = 0;
    this._actionTimer            = null;
    this._handTotalContributions = {};
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  startHand() {
    if (this.phase !== 'waiting') throw new Error('Hand already in progress');
    const eligible = this.players.filter(p => !p.isEliminated && p.chips > 0);
    if (eligible.length < 2) throw new Error('Need at least 2 players to start');

    this.handNumber++;
    this._resetForNewHand();
    this._rotateDealerButton();
    this._dealHoleCards();
    this._startBettingRound('preflop');
    this._emitState();
  }

  applyAction(playerId, action, amount = 0) {
    if (!this.currentBettingRound)
      return { success: false, error: 'No active betting round' };
    const safeAmount = Number.isFinite(amount) ? Math.floor(Math.max(0, amount)) : 0;
    const result     = this.currentBettingRound.applyAction(playerId, action, safeAmount);
    if (!result.success) return result;
    this._clearActionTimer();
    this._checkRoundProgress();
    return { success: true };
  }

  addPlayer(player) {
    if (this.phase !== 'waiting') throw new Error('Cannot add player mid-hand');
    if (this.players.find(p => p.id === player.id)) return;
    this.players.push({
      id:           player.id,
      name:         String(player.name ?? 'Player').trim().slice(0, 20),
      chips:        Math.max(0, Math.floor(Number(player.chips) || 0)),
      holeCards:    [],
      isFolded:     false,
      isAllIn:      false,
      isSittingOut: false,
      isEliminated: false,
    });
  }

  removePlayer(playerId) {
    if (this.phase === 'waiting') {
      this.players = this.players.filter(p => p.id !== playerId);
    } else {
      const p = this.players.find(p => p.id === playerId);
      if (p) p.isSittingOut = true;
    }
  }

  getPublicState() {
    return {
      phase:          this.phase,
      handNumber:     this.handNumber,
      dealerIndex:    this.dealerIndex,
      communityCards: this.communityCards,
      pot:            this.pot,
      sidePots:       this.sidePots,
      lastWinners:    this.lastWinners,
      bettingRound:   this.currentBettingRound?.getState() ?? null,
      players: this.players.map(p => ({
        id:           p.id,
        name:         p.name,
        chips:        p.chips,
        isFolded:     p.isFolded,
        isAllIn:      p.isAllIn,
        isEliminated: p.isEliminated,
        cardCount:    p.holeCards.length,
        holeCards:    p.holeCards.map(() => ({ rank: '?', suit: '?' })),
      })),
    };
  }

  getPrivateState(playerId) {
    const state = this.getPublicState();
    const pub   = state.players.find(p => p.id === playerId);
    const real  = this.players.find(p => p.id === playerId);
    if (pub && real) pub.holeCards = real.holeCards;
    return state;
  }

  // ─── State machine ───────────────────────────────────────────────────────────

  _checkRoundProgress() {
    const active = this.players.filter(p => !p.isFolded && !p.isEliminated);

    if (active.length === 1) {
      this._awardPotToLastPlayer(active[0]);
      return;
    }

    if (this.currentBettingRound?.isComplete) {
      // Accumulate this street's contributions into the hand total
      for (const [id, amt] of Object.entries(this.currentBettingRound.totalContributions)) {
        this._handTotalContributions[id] = (this._handTotalContributions[id] ?? 0) + amt;
      }
      this._advancePhase();
    } else {
      this._startActionTimer();
      this._emitState();
    }
  }

  _advancePhase() {
    if (this.currentBettingRound) this.pot = this.currentBettingRound.pot;
    switch (this.phase) {
      case 'preflop': return this._startFlop();
      case 'flop':    return this._startTurn();
      case 'turn':    return this._startRiver();
      case 'river':   return this._startShowdown();
    }
  }

  _startFlop()  { this.communityCards.push(...this.deck.dealMany(3)); this._startBettingRound('flop');  this._emitState(); }
  _startTurn()  { this.communityCards.push(this.deck.deal());         this._startBettingRound('turn');  this._emitState(); }
  _startRiver() { this.communityCards.push(this.deck.deal());         this._startBettingRound('river'); this._emitState(); }

  _startShowdown() {
    this.phase = 'showdown';
    this._clearActionTimer();

    // _handTotalContributions already has all streets merged by _checkRoundProgress
    this.sidePots = this._buildFinalSidePots();

    const active      = this.players.filter(p => !p.isFolded && !p.isEliminated);
    this.lastWinners  = [];

    // FIX: use potIdx (pot index) not idx (winner-within-pot index) for potLabel
    for (let potIdx = 0; potIdx < this.sidePots.length; potIdx++) {
      const pot      = this.sidePots[potIdx];
      const eligible = active.filter(p => pot.eligiblePlayerIds.includes(p.id));
      if (eligible.length === 0) continue;

      const winners   = determineWinners(eligible, this.communityCards);
      const share     = Math.floor(pot.amount / winners.length);
      const remainder = pot.amount - share * winners.length;

      // potLabel: 'Main pot' for pot 0, 'Side pot 1', 'Side pot 2', … for pots 1+
      const potLabel = this.sidePots.length > 1
        ? (potIdx === 0 ? 'Main pot' : `Side pot ${potIdx}`)
        : 'Main pot';

      winners.forEach((w, winnerIdx) => {
        const player = this.players.find(p => p.id === w.playerId);
        const won    = share + (winnerIdx === 0 ? remainder : 0);
        if (player) player.chips += won;
        this.lastWinners.push({ ...w, potAmount: won, potLabel });
      });
    }

    // Emit full hole cards to all active players at showdown
    this.emit('showdown', {
      players:        active.map(p => ({ id: p.id, name: p.name, holeCards: p.holeCards })),
      communityCards: this.communityCards,
      winners:        this.lastWinners,
    });

    this.players.forEach(p => { if (p.chips === 0) p.isEliminated = true; });
    this._emitState();

    // Reset phase FIRST so startHand() never races with 'Hand already in progress'
    setTimeout(() => {
      this.phase   = 'waiting';
      this.players = this.players.filter(p => !p.isSittingOut && !p.isEliminated);
      this.emit('handComplete', { winners: this.lastWinners });
    }, 5000);
  }

  _awardPotToLastPlayer(player) {
    this._clearActionTimer();
    this.phase = 'showdown';
    if (this.currentBettingRound) this.pot = this.currentBettingRound.pot;
    player.chips += this.pot;

    this.lastWinners = [{
      playerId:  player.id,
      handName:  'Last player standing',
      bestCards: [],
      potAmount: this.pot,
      potLabel:  'Main pot',
    }];

    this._emitState();

    setTimeout(() => {
      this.phase   = 'waiting';
      this.players = this.players.filter(p => !p.isSittingOut && !p.isEliminated);
      this.emit('handComplete', { winners: this.lastWinners });
    }, 3000);
  }

  // ─── Side pot construction ─────────────────────────────────────────────────

  _buildFinalSidePots() {
    const contributions = this._handTotalContributions;

    const allInLevels = this.players
      .filter(p => p.isAllIn)
      .map(p => contributions[p.id] ?? 0)
      .filter(v => v > 0);

    const levels = [...new Set(allInLevels)].sort((a, b) => a - b);

    const maxContrib = Math.max(0, ...Object.values(contributions));
    if (maxContrib > 0 && !levels.includes(maxContrib)) levels.push(maxContrib);

    if (levels.length === 0) {
      const eligible = this.players
        .filter(p => !p.isFolded && !p.isEliminated)
        .map(p => p.id);
      return [{ amount: this.pot, eligiblePlayerIds: eligible }];
    }

    const pots = [];
    let prev   = 0;

    for (const cap of levels) {
      let amount     = 0;
      const eligible = [];

      for (const p of this.players) {
        const contrib = contributions[p.id] ?? 0;
        const slice   = Math.min(contrib, cap) - prev;
        if (slice > 0) amount += slice;
        if (!p.isFolded && contrib >= cap) eligible.push(p.id);
      }

      if (amount > 0) pots.push({ amount, eligiblePlayerIds: eligible });
      prev = cap;
    }

    return pots;
  }

  // ─── Betting round setup ───────────────────────────────────────────────────

  _startBettingRound(phase) {
    this.phase = phase;

    const activePlayers = this.players.filter(
      p => !p.isFolded && !p.isEliminated && !p.isSittingOut
    );

    // Translate this.dealerIndex (full-array index) to activePlayers-array index
    const dealerPlayer      = this.players[this.dealerIndex];
    let   activeDealerIndex = activePlayers.findIndex(p => p.id === dealerPlayer?.id);

    if (activeDealerIndex === -1) {
      for (let i = 1; i <= this.players.length; i++) {
        const idx       = (this.dealerIndex - i + this.players.length) % this.players.length;
        const activeIdx = activePlayers.findIndex(p => p.id === this.players[idx]?.id);
        if (activeIdx !== -1) { activeDealerIndex = activeIdx; break; }
      }
    }
    if (activeDealerIndex === -1) activeDealerIndex = 0;

    this.currentBettingRound = new BettingRound(
      activePlayers,
      this.options.smallBlind,
      activeDealerIndex,
      phase,
      this.pot,
    );

    if (phase === 'preflop') {
      this.currentBettingRound.postSmallBlind();
      this.currentBettingRound.postBigBlind();
    }

    // Auto-skip only when no one can voluntarily act AND the sole remaining
    // actor (if any) owes nothing
    const canAct  = activePlayers.filter(p => !p.isAllIn);
    const betOwed = canAct[0]
      ? this.currentBettingRound.currentBet -
        (this.currentBettingRound.roundContributions[canAct[0].id] ?? 0)
      : 0;

    if (canAct.length === 0 || (canAct.length === 1 && betOwed <= 0)) {
      this.currentBettingRound.isComplete = true;
      this._advancePhase();
      return;
    }

    this._startActionTimer();
  }

  // ─── Turn timer ───────────────────────────────────────────────────────────

  _startActionTimer() {
    this._clearActionTimer();
    const currentId = this.currentBettingRound?.getCurrentPlayerId();
    if (!currentId) return;

    this.emit('actionRequired', {
      playerId:  currentId,
      timeoutMs: ACTION_TIMEOUT_MS,
      startedAt: Date.now(),
    });

    this._actionTimer = setTimeout(() => {
      this.applyAction(currentId, 'fold');
    }, ACTION_TIMEOUT_MS);
  }

  _clearActionTimer() {
    if (this._actionTimer) { clearTimeout(this._actionTimer); this._actionTimer = null; }
  }

  // ─── Hand setup ───────────────────────────────────────────────────────────

  _resetForNewHand() {
    this.deck.reset();
    this.communityCards          = [];
    this.pot                     = 0;
    this.sidePots                = [];
    this.currentBettingRound     = null;
    this.lastWinners             = [];
    this._handTotalContributions = {};
    for (const p of this.players) {
      p.holeCards = [];
      p.isFolded  = false;
      p.isAllIn   = false;
    }
  }

  _rotateDealerButton() {
    const len  = this.players.length;
    let   next = (this.dealerIndex + 1) % len;
    for (let steps = 0; steps < len; steps++) {
      if (!this.players[next].isEliminated && this.players[next].chips > 0) {
        this.dealerIndex = next;
        return;
      }
      next = (next + 1) % len;
    }
  }

  _dealHoleCards() {
    const eligible = this.players.filter(p => !p.isEliminated && !p.isSittingOut && p.chips > 0);
    for (let round = 0; round < 2; round++) {
      for (const p of eligible) p.holeCards.push(this.deck.deal());
    }
    for (const p of eligible) {
      this.emit('privateCards', { playerId: p.id, cards: p.holeCards });
    }
  }

  _emitState() { this.emit('stateChanged', this.getPublicState()); }
}

module.exports = { GameEngine };
