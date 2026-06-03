/**
 * server/src/index.js
 *
 * Entry point — Express + Socket.IO server.
 *
 * Loads .env (if present) so PORT and CLIENT_URL can be set without
 * editing code. Falls back to sensible defaults for local development.
 */

// Load .env file when present (no-op if missing — never throws)
try { require('dotenv').config(); } catch (_) { /* dotenv optional */ }

const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const { registerSocketHandlers } = require('./socket/socketHandlers');

const PORT       = process.env.PORT       || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', uptime: process.uptime() })
);

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin:  CLIENT_URL,
    methods: ['GET', 'POST'],
  },
  pingTimeout:  20000,
  pingInterval: 10000,
});

io.on('connection', socket => registerSocketHandlers(socket, io));

httpServer.listen(PORT, () => {
  console.log(`\n🃏  Poker server running on http://localhost:${PORT}`);
  console.log(`   Accepting connections from: ${CLIENT_URL}\n`);
});

module.exports = { app, io };
