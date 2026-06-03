/**
 * server/src/game/Deck.js
 *
 * Manages a standard 52-card deck.
 * Each card is an object: { rank, suit, value }
 *   rank  : '2'–'9', 'T', 'J', 'Q', 'K', 'A'
 *   suit  : 's' (spades) | 'h' (hearts) | 'd' (diamonds) | 'c' (clubs)
 *   value : numeric 2–14  (Ace = 14)
 */

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const SUITS = ['s', 'h', 'd', 'c'];
const RANK_VALUES = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  '8': 8, '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

class Deck {
  constructor() {
    this.cards = [];
    this.reset();
  }

  /** Rebuild and shuffle a fresh 52-card deck. */
  reset() {
    this.cards = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        this.cards.push({ rank, suit, value: RANK_VALUES[rank] });
      }
    }
    this.shuffle();
  }

  /**
   * Fisher-Yates shuffle — O(n), unbiased.
   */
  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  /** Deal one card off the top. Throws if the deck is empty. */
  deal() {
    if (this.cards.length === 0) throw new Error('Deck is empty');
    return this.cards.pop();
  }

  /** Deal `n` cards at once. Returns an array. */
  dealMany(n) {
    const hand = [];
    for (let i = 0; i < n; i++) hand.push(this.deal());
    return hand;
  }

  /** Cards remaining in the deck. */
  get remaining() {
    return this.cards.length;
  }
}

module.exports = { Deck, RANKS, SUITS, RANK_VALUES };
