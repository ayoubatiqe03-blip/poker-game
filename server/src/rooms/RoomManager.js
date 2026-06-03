/**
 * server/src/rooms/RoomManager.js
 *
 * Singleton-style manager for all active rooms.
 * Handles room creation, lookup, cleanup, and code generation.
 */

const { Room } = require('./Room');

// Room codes are 4 uppercase letters, e.g. "WXQZ"
const CODE_LENGTH = 4;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // No I or O (confusing with 1/0)
const MAX_IDLE_MS = 2 * 60 * 60 * 1000; // 2 hours — auto-purge idle rooms

class RoomManager {
  constructor() {
    /** @type {Map<string, Room>} */
    this.rooms = new Map();
    this._startCleanupTimer();
  }

  // ─── Room CRUD ────────────────────────────────────────────────────────────

  /**
   * Create a new room.
   * @returns {{ success: boolean, room?: Room, error?: string }}
   */
  createRoom(hostSocketId, playerName, options = {}) {
    const code = this._generateCode();
    const room = new Room(code, hostSocketId, options);
    this.rooms.set(code, room);

    const result = room.addPlayer(hostSocketId, playerName);
    if (!result.success) {
      this.rooms.delete(code);
      return { success: false, error: result.error };
    }

    return { success: true, room, playerId: result.playerId };
  }

  /**
   * Join an existing room.
   * @returns {{ success: boolean, room?: Room, playerId?: string, error?: string }}
   */
  joinRoom(socketId, roomCode, playerName) {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return { success: false, error: 'Room not found' };

    const result = room.addPlayer(socketId, playerName);
    if (!result.success) return { success: false, error: result.error };

    return { success: true, room, playerId: result.playerId, reconnected: result.reconnected };
  }

  /**
   * Remove a player from whichever room they're in.
   * Deletes the room if it becomes empty.
   */
  leaveRoom(socketId) {
    for (const [code, room] of this.rooms) {
      if (room.players.has(socketId)) {
        room.removePlayer(socketId);
        if (room.isEmpty()) {
          this.rooms.delete(code);
        } else if (room.hostId === socketId) {
          // Pass host to next connected player
          this._reassignHost(room);
        }
        return { success: true, roomCode: code };
      }
    }
    return { success: false };
  }

  /** Find room by any player's socket ID. */
  getRoomBySocketId(socketId) {
    for (const room of this.rooms.values()) {
      if (room.players.has(socketId)) return room;
    }
    return null;
  }

  getRoom(code) {
    return this.rooms.get(code?.toUpperCase()) ?? null;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  _generateCode() {
    let code;
    let attempts = 0;
    do {
      code = Array.from({ length: CODE_LENGTH }, () =>
        CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
      ).join('');
      attempts++;
      if (attempts > 1000) throw new Error('Could not generate unique room code');
    } while (this.rooms.has(code));
    return code;
  }

  _reassignHost(room) {
    const connected = Array.from(room.players.values()).find(p => p.isConnected);
    if (connected) room.hostId = connected.id;
  }

  _startCleanupTimer() {
    setInterval(() => {
      const now = Date.now();
      for (const [code, room] of this.rooms) {
        if (room.isEmpty() || now - room.createdAt > MAX_IDLE_MS) {
          this.rooms.delete(code);
        }
      }
    }, 10 * 60 * 1000); // Check every 10 minutes
  }
}

// Export a single shared instance
module.exports = new RoomManager();
