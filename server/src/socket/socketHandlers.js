/**
 * server/src/socket/socketHandlers.js
 *
 * Security fixes:
 *   1. Player name sanitized: strip tags, enforce 1-20 char limit.
 *   2. Room code validated: exactly 4 uppercase letters A-Z.
 *   3. Action amount sanitized at entry point (Number() + isFinite + floor).
 *   4. Rate limiting: players cannot spam actions (50ms debounce).
 *   5. Chat text sanitized: strip tags, enforce 1-200 char limit.
 *   6. No action accepted if room not found or player not in room.
 *   7. game:start validated: requester must be the host.
 *
 * Wiring fix:
 *   - _attachGameEngineListeners called at room-create time, before startGame,
 *     so the first stateChanged broadcast is never missed.
 */

const roomManager = require('../rooms/RoomManager');

// Simple per-socket action debounce to prevent spam
const _lastActionTime = new Map();
const ACTION_DEBOUNCE_MS = 50;

function sanitizeName(raw) {
  if (typeof raw !== 'string') return null;
  const s = raw.trim().replace(/[<>"'&]/g, '').slice(0, 20);
  return s.length >= 1 ? s : null;
}

function sanitizeText(raw) {
  if (typeof raw !== 'string') return null;
  const s = raw.trim().replace(/[<>"'&]/g, match => ({
    '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;',
  }[match])).slice(0, 200);
  return s.length >= 1 ? s : null;
}

function sanitizeAmount(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function isValidRoomCode(code) {
  return typeof code === 'string' && /^[A-Z]{4}$/.test(code);
}

function registerSocketHandlers(socket, io) {
  console.log(`[socket] connected: ${socket.id}`);

  // ─── Lobby ────────────────────────────────────────────────────────────────

  socket.on('room:create', ({ playerName, options } = {}) => {
    const name = sanitizeName(playerName);
    if (!name) {
      return socket.emit('error', { message: 'Player name must be 1–20 characters' });
    }

    // Sanitize options
    const safeOptions = {};
    if (options?.startingChips) {
      safeOptions.startingChips = Math.min(100000, Math.max(100, Math.floor(Number(options.startingChips) || 1000)));
    }
    if (options?.smallBlind) {
      safeOptions.smallBlind = Math.min(1000, Math.max(1, Math.floor(Number(options.smallBlind) || 10)));
    }

    const result = roomManager.createRoom(socket.id, name, safeOptions);
    if (!result.success) {
      return socket.emit('error', { message: result.error });
    }

    const { room, playerId } = result;
    socket.join(room.code);

    // Attach engine listeners NOW, before any startGame call
    _attachGameEngineListeners(room, io);

    socket.emit('room:created', {
      roomCode: room.code,
      playerId,
      lobbyState: room.getLobbyState(),
    });

    console.log(`[room] created ${room.code} by ${name}`);
  });

  socket.on('room:join', ({ roomCode, playerName } = {}) => {
    const name = sanitizeName(playerName);
    if (!name) {
      return socket.emit('error', { message: 'Player name must be 1–20 characters' });
    }

    const code = typeof roomCode === 'string' ? roomCode.trim().toUpperCase() : '';
    if (!isValidRoomCode(code)) {
      return socket.emit('error', { message: 'Room code must be 4 letters (A–Z)' });
    }

    const result = roomManager.joinRoom(socket.id, code, name);
    if (!result.success) {
      return socket.emit('error', { message: result.error });
    }

    const { room, playerId, reconnected } = result;
    socket.join(room.code);

    socket.emit('room:joined', {
      roomCode: room.code,
      playerId,
      reconnected: !!reconnected,
      lobbyState: room.getLobbyState(),
    });

    socket.to(room.code).emit('room:updated', { lobbyState: room.getLobbyState() });

    if (reconnected && room.game) {
      socket.emit('game:privateState', room.game.getPrivateState(playerId));
    }

    console.log(`[room] ${name} ${reconnected ? 're' : ''}joined ${room.code}`);
  });

  socket.on('room:leave', () => _handleLeave(socket, io));

  // ─── Game lifecycle ────────────────────────────────────────────────────────

  socket.on('game:start', () => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return socket.emit('error', { message: 'You are not in a room' });

    // Security: only host can start
    if (room.hostId !== socket.id) {
      return socket.emit('error', { message: 'Only the host can start the game' });
    }

    const result = room.startGame(socket.id);
    if (!result.success) {
      return socket.emit('error', { message: result.error });
    }

    io.to(room.code).emit('game:started', { lobbyState: room.getLobbyState() });
  });

  // ─── Player actions ────────────────────────────────────────────────────────

  socket.on('game:action', ({ action, amount } = {}) => {
    // Rate limiting
    const now = Date.now();
    const last = _lastActionTime.get(socket.id) ?? 0;
    if (now - last < ACTION_DEBOUNCE_MS) return;
    _lastActionTime.set(socket.id, now);

    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    // Validate action string
    const validActions = ['fold', 'check', 'call', 'raise', 'allin'];
    if (!validActions.includes(action)) {
      return socket.emit('game:error', { message: 'Invalid action' });
    }

    const safeAmount = sanitizeAmount(amount);
    const result = room.applyAction(socket.id, action, safeAmount);
    if (!result.success) {
      socket.emit('game:error', { message: result.error });
    }
  });

  // ─── Chat ──────────────────────────────────────────────────────────────────

  socket.on('chat:message', ({ text } = {}) => {
    const safeText = sanitizeText(text);
    if (!safeText) return;

    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    io.to(room.code).emit('chat:message', {
      id: `${socket.id}-${Date.now()}`,
      sender: player.name,
      text: safeText,
      ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'chat',
    });
  });

  // ─── Disconnect ────────────────────────────────────────────────────────────

  socket.on('disconnect', () => {
    console.log(`[socket] disconnected: ${socket.id}`);
    _lastActionTime.delete(socket.id);
    _handleLeave(socket, io);
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _handleLeave(socket, io) {
  const result = roomManager.leaveRoom(socket.id);
  if (result.success) {
    const room = roomManager.getRoom(result.roomCode);
    socket.leave(result.roomCode);
    socket.emit('room:left', {});
    if (room) {
      io.to(result.roomCode).emit('room:updated', { lobbyState: room.getLobbyState() });
    }
  }
}

/**
 * Wire GameEngine events to Socket.IO broadcasts.
 * Called at room-create time so listeners are attached before startGame.
 */
function _attachGameEngineListeners(room, io) {
  if (room._listenersAttached) return;
  room._listenersAttached = true;

  const originalStartGame = room.startGame.bind(room);

  room.startGame = (requesterId) => {
    const result = originalStartGame(requesterId);

    if (result.success && room.game) {
      const game = room.game;

      game.on('stateChanged', (publicState) => {
        io.to(room.code).emit('game:state', publicState);

        // Send private state (with hole cards) to each connected player
        for (const playerData of room.players.values()) {
          if (!playerData.isConnected) continue;
          const sock = io.sockets.sockets.get(playerData.socketId);
          if (sock) {
            sock.emit('game:privateState', game.getPrivateState(playerData.id));
          }
        }
      });

      game.on('privateCards', ({ playerId, cards }) => {
        const playerData = room.players.get(playerId);
        if (!playerData?.isConnected) return;
        const sock = io.sockets.sockets.get(playerData.socketId);
        if (sock) sock.emit('game:yourCards', { cards });
      });

      game.on('actionRequired', (data) => {
        io.to(room.code).emit('game:actionRequired', data);
      });

      game.on('showdown', (data) => {
        io.to(room.code).emit('game:showdown', data);
      });

      game.on('handComplete', ({ winners }) => {
        io.to(room.code).emit('game:handComplete', { winners });

        // Start next hand after the winner display window
        setTimeout(() => {
          if (room.status !== 'playing') return;
          try {
            room.game.startHand();
          } catch (err) {
            console.log(`[game] ${room.code} ended: ${err.message}`);
            room.status = 'finished';
            io.to(room.code).emit('game:over', { message: err.message });
          }
        }, 5500);
      });
    }

    return result;
  };
}

module.exports = { registerSocketHandlers };
