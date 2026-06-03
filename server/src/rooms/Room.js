/**
 * server/src/rooms/Room.js
 *
 * Represents a single private poker room.
 * Owns one GameEngine instance and the list of connected sockets.
 *
 * A room goes through these states:
 *   'lobby'    → players joining, host can start game
 *   'playing'  → game in progress
 *   'finished' → everyone busted or left
 */

const { GameEngine } = require('../game/GameEngine');

const DEFAULT_OPTIONS = {
  smallBlind: 10,
  startingChips: 1000,
  maxPlayers: 9,
  minPlayers: 2,
};

class Room {
  /**
   * @param {string} roomCode  - 4-letter unique code
   * @param {string} hostId    - socket.id of the host
   * @param {object} options   - override DEFAULT_OPTIONS
   */
  constructor(roomCode, hostId, options = {}) {
    this.code = roomCode;
    this.hostId = hostId;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.status = 'lobby';
    this.createdAt = Date.now();

    // Map of playerId → { id, name, socketId, isConnected }
    this.players = new Map();
    this.game = null;
  }

  // ─── Player management ────────────────────────────────────────────────────

  /**
   * Add a player to the room.
   * Returns { success, error? }
   */
  addPlayer(socketId, playerName) {
    if (this.players.size >= this.options.maxPlayers) {
      return { success: false, error: 'Room is full' };
    }
    if (this.status !== 'lobby') {
      // Allow reconnect only
      const existing = this._findByName(playerName);
      if (!existing) return { success: false, error: 'Game already started' };
      existing.socketId = socketId;
      existing.isConnected = true;
      return { success: true, playerId: existing.id, reconnected: true };
    }

    const playerId = socketId; // Use socketId as playerId for simplicity
    this.players.set(playerId, {
      id: playerId,
      name: playerName,
      socketId,
      isConnected: true,
    });

    return { success: true, playerId };
  }

  removePlayer(playerId) {
    if (this.status === 'lobby') {
      this.players.delete(playerId);
    } else {
      const p = this.players.get(playerId);
      if (p) p.isConnected = false;
      // Tell game engine to sit them out
      this.game?.removePlayer(playerId);
    }
  }

  // ─── Game lifecycle ───────────────────────────────────────────────────────

  /**
   * Start the game. Only the host can do this.
   * Returns { success, error? }
   */
  startGame(requesterId) {
    if (requesterId !== this.hostId) {
      return { success: false, error: 'Only the host can start the game' };
    }
    if (this.status !== 'lobby') {
      return { success: false, error: 'Game already started' };
    }
    if (this.players.size < this.options.minPlayers) {
      return { success: false, error: `Need at least ${this.options.minPlayers} players` };
    }

    const gamePlayers = Array.from(this.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      chips: this.options.startingChips,
    }));

    this.game = new GameEngine(gamePlayers, { smallBlind: this.options.smallBlind });
    this.status = 'playing';
    this.game.startHand();

    return { success: true };
  }

  /** Start the next hand (called automatically by GameEngine after delay). */
  startNextHand() {
    if (!this.game) return;
    try {
      this.game.startHand();
    } catch (err) {
      this.status = 'finished';
    }
  }

  // ─── Forwarding to game engine ────────────────────────────────────────────

  applyAction(playerId, action, amount) {
    if (!this.game) return { success: false, error: 'No active game' };
    return this.game.applyAction(playerId, action, amount);
  }

  // ─── State helpers ────────────────────────────────────────────────────────

  getLobbyState() {
    return {
      code: this.code,
      hostId: this.hostId,
      status: this.status,
      options: this.options,
      players: Array.from(this.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        isConnected: p.isConnected,
        isHost: p.id === this.hostId,
      })),
    };
  }

  getSocketIds() {
    return Array.from(this.players.values())
      .filter(p => p.isConnected)
      .map(p => p.socketId);
  }

  getSocketIdForPlayer(playerId) {
    return this.players.get(playerId)?.socketId;
  }

  isEmpty() {
    return this.players.size === 0 ||
      Array.from(this.players.values()).every(p => !p.isConnected);
  }

  _findByName(name) {
    return Array.from(this.players.values()).find(
      p => p.name.toLowerCase() === name.toLowerCase()
    );
  }
}

module.exports = { Room };
