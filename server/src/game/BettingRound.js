/**
 * server/src/game/BettingRound.js
 *
 * Manages a single betting round (preflop, flop, turn, river).
 *
 * Fixed bugs (cumulative):
 *   - _advance: closes round correctly when only all-in/folded players remain
 *   - _allIn: correctly updates currentBet so subsequent callers owe right amount
 *   - _raise: rejects NaN/Infinity/negative amounts
 *   - Heads-up blind order: dealer = SB, acts first preflop
 *   - buildSidePots: accurate per-level slicing, folded players excluded
 *   - _nextActiveIndex: now skips both folded AND all-in players so first-to-act
 *     calculation never lands on a player who cannot voluntarily act (livelock fix)
 *   - _getFirstToActIndex: uses the all-in-aware _nextCanActIndex helper
 */
class BettingRound {
  constructor(players, smallBlindAmt, dealerIndex, phase, existingPot = 0) {
    this.players      = players;
    this.smallBlind   = smallBlindAmt;
    this.bigBlind     = smallBlindAmt * 2;
    this.dealerIndex  = dealerIndex;
    this.phase        = phase;
    this.pot          = existingPot;

    this.roundContributions = {};
    this.totalContributions = {};
    for (const p of players) {
      this.roundContributions[p.id] = 0;
      this.totalContributions[p.id] = 0;
    }

    this.currentBet  = 0;
    this.minRaise    = this.bigBlind;
    this.lastRaiser  = null;
    this._actedSinceLastRaise = new Set();
    this.isComplete  = false;

    this.activePlayerIndex = this._getFirstToActIndex();
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  postSmallBlind() {
    const isHeadsUp = this.players.length === 2;
    const sbIdx = isHeadsUp
      ? this.dealerIndex % this.players.length
      : this._nextFoldedAwareIndex(this.dealerIndex);
    const sb = this.players[sbIdx];
    if (!sb) return;
    const amount = Math.min(this.smallBlind, sb.chips);
    this._forceContribute(sb, amount);
    this.currentBet = amount;
  }

  postBigBlind() {
    const isHeadsUp = this.players.length === 2;
    const sbIdx = isHeadsUp
      ? this.dealerIndex % this.players.length
      : this._nextFoldedAwareIndex(this.dealerIndex);
    const bbIdx = this._nextFoldedAwareIndex(sbIdx);
    const bb = this.players[bbIdx];
    if (!bb) return;
    const amount = Math.min(this.bigBlind, bb.chips);
    this._forceContribute(bb, amount);
    this.currentBet = this.bigBlind;
    this.minRaise   = this.bigBlind;
    // BB keeps the option (they have not yet voluntarily acted)
  }

  getCurrentPlayer() {
    if (this.isComplete) return null;
    return this.players[this.activePlayerIndex] ?? null;
  }

  getCurrentPlayerId() {
    return this.getCurrentPlayer()?.id ?? null;
  }

  applyAction(playerId, action, amount = 0) {
    const player = this.players.find(p => p.id === playerId);
    if (!player)                        return { success: false, error: 'Player not found' };
    if (this.getCurrentPlayerId() !== playerId)
                                        return { success: false, error: 'Not your turn' };
    if (player.isFolded || player.isAllIn)
                                        return { success: false, error: 'Cannot act: already folded or all-in' };

    switch (action) {
      case 'fold':  this._fold(player);  break;
      case 'check': { const e = this._check(player);  if (e) return { success: false, error: e }; break; }
      case 'call':  this._call(player);  break;
      case 'raise': { const e = this._raise(player, amount); if (e) return { success: false, error: e }; break; }
      case 'allin': this._allIn(player); break;
      default:      return { success: false, error: `Unknown action: ${action}` };
    }

    this._actedSinceLastRaise.add(playerId);
    this._advance();
    return { success: true };
  }

  /**
   * Build side pots from per-street total contributions.
   * Sum of all returned pot amounts === total money in this round.
   */
  buildSidePots() {
    const allInLevels = this.players
      .filter(p => p.isAllIn)
      .map(p => this.totalContributions[p.id] ?? 0)
      .filter(v => v > 0);

    const levels = [...new Set(allInLevels)].sort((a, b) => a - b);

    const maxContrib = Math.max(0, ...Object.values(this.totalContributions));
    if (maxContrib > 0 && !levels.includes(maxContrib)) levels.push(maxContrib);
    if (levels.length === 0) return [];

    const pots = [];
    let prev = 0;

    for (const cap of levels) {
      let amount = 0;
      const eligible = [];

      for (const p of this.players) {
        const contrib = this.totalContributions[p.id] ?? 0;
        const slice   = Math.min(contrib, cap) - prev;
        if (slice > 0) amount += slice;
        if (!p.isFolded && contrib >= cap) eligible.push(p.id);
      }

      if (amount > 0) pots.push({ amount, eligiblePlayerIds: eligible });
      prev = cap;
    }

    return pots;
  }

  getState() {
    return {
      pot:                this.pot,
      currentBet:         this.currentBet,
      minRaise:           this.minRaise,
      phase:              this.phase,
      currentPlayerId:    this.getCurrentPlayerId(),
      roundContributions: { ...this.roundContributions },
      isComplete:         this.isComplete,
    };
  }

  // ─── Actions ───────────────────────────────────────────────────────────────

  _fold(player)  { player.isFolded = true; }

  _check(player) {
    const owed = this.currentBet - (this.roundContributions[player.id] ?? 0);
    if (owed > 0) return 'Cannot check — there is a bet to call';
    return null;
  }

  _call(player) {
    const owed   = this.currentBet - (this.roundContributions[player.id] ?? 0);
    const amount = Math.min(owed, player.chips);
    this._contribute(player, amount);
    if (player.chips === 0) player.isAllIn = true;
  }

  _raise(player, raiseToAmount) {
    if (!Number.isFinite(raiseToAmount) || raiseToAmount <= 0) return 'Invalid raise amount';
    raiseToAmount = Math.floor(raiseToAmount);

    const alreadyIn = this.roundContributions[player.id] ?? 0;
    const toAdd     = raiseToAmount - alreadyIn;

    if (raiseToAmount < this.currentBet + this.minRaise)
      return `Minimum raise is to ${this.currentBet + this.minRaise}`;
    if (toAdd > player.chips) return 'Not enough chips';
    if (toAdd <= 0)            return 'Invalid raise amount';

    const prevBet = this.currentBet;
    this._contribute(player, toAdd);
    this.minRaise   = raiseToAmount - prevBet;
    this.currentBet = raiseToAmount;
    this.lastRaiser = player.id;
    this._actedSinceLastRaise.clear();
    this._actedSinceLastRaise.add(player.id);
    if (player.chips === 0) player.isAllIn = true;
    return null;
  }

  _allIn(player) {
    const chips = player.chips;
    if (chips <= 0) { player.isAllIn = true; return; }

    const totalAfter = (this.roundContributions[player.id] ?? 0) + chips;
    this._contribute(player, chips);
    player.isAllIn = true;

    if (totalAfter > this.currentBet) {
      this.minRaise   = Math.max(this.minRaise, totalAfter - this.currentBet);
      this.currentBet = totalAfter;
      this.lastRaiser = player.id;
      this._actedSinceLastRaise.clear();
      this._actedSinceLastRaise.add(player.id);
    }
  }

  _contribute(player, amount) {
    if (amount <= 0) return;
    player.chips -= amount;
    this.pot     += amount;
    this.roundContributions[player.id] = (this.roundContributions[player.id] ?? 0) + amount;
    this.totalContributions[player.id] = (this.totalContributions[player.id] ?? 0) + amount;
  }

  _forceContribute(player, amount) { this._contribute(player, amount); }

  // ─── Round advancement ─────────────────────────────────────────────────────

  _advance() {
    // Players who can still voluntarily act
    const canAct = this.players.filter(p => !p.isFolded && !p.isAllIn);
    if (canAct.length === 0) { this.isComplete = true; return; }

    let next    = this._nextCanActIndex(this.activePlayerIndex);
    let checked = 0;

    while (checked < this.players.length) {
      const p = this.players[next];

      if (!p.isFolded && !p.isAllIn) {
        const owed     = this.currentBet - (this.roundContributions[p.id] ?? 0);
        const hasActed = this._actedSinceLastRaise.has(p.id);
        if (owed > 0 || !hasActed) {
          this.activePlayerIndex = next;
          return;
        }
      }

      next = this._nextCanActIndex(next);
      checked++;
    }

    this.isComplete = true;
  }

  _getFirstToActIndex() {
    const isHeadsUp = this.players.length === 2;

    if (this.phase === 'preflop') {
      if (isHeadsUp) return this.dealerIndex % this.players.length;
      const sb = this._nextFoldedAwareIndex(this.dealerIndex);
      const bb = this._nextFoldedAwareIndex(sb);
      return this._nextCanActIndex(bb);
    }

    return this._nextCanActIndex(this.dealerIndex);
  }

  /**
   * Next index skipping only folded players.
   * Used for blind posting (all-in players can still post blinds).
   */
  _nextFoldedAwareIndex(fromIndex) {
    let i = (fromIndex + 1) % this.players.length;
    for (let s = 0; s < this.players.length; s++) {
      if (!this.players[i].isFolded) return i;
      i = (i + 1) % this.players.length;
    }
    return fromIndex;
  }

  /**
   * Next index skipping folded AND all-in players.
   * Used for determining who acts next (only voluntary actors).
   */
  _nextCanActIndex(fromIndex) {
    let i = (fromIndex + 1) % this.players.length;
    for (let s = 0; s < this.players.length; s++) {
      if (!this.players[i].isFolded && !this.players[i].isAllIn) return i;
      i = (i + 1) % this.players.length;
    }
    // Fallback: everyone is folded or all-in — caller handles isComplete
    return fromIndex;
  }
}

module.exports = { BettingRound };
