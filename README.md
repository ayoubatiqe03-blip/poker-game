# Royal Flush — Texas Hold'em Poker

Private multiplayer Texas Hold'em for 2–9 players. Real-time via Socket.IO.

---

## Project structure

```
poker-game/
├── .gitignore
├── README.md
│
├── client/                        ← React frontend (Vite)
│   ├── public/                    ← Static assets (empty, Vite default)
│   ├── src/
│   │   ├── App.jsx                ← Root: socket wiring + screen routing
│   │   ├── main.jsx               ← ReactDOM entry point
│   │   ├── index.css              ← Design tokens, animations, felt texture
│   │   ├── context/
│   │   │   └── GameContext.jsx    ← Global state (useReducer)
│   │   ├── hooks/
│   │   │   └── useSocket.js       ← Socket.IO connection singleton
│   │   ├── utils/
│   │   │   └── cardHelpers.js     ← Card display, chip formatting, seat positions
│   │   └── components/
│   │       ├── Chat/
│   │       │   └── ChatPanel.jsx
│   │       ├── Controls/
│   │       │   └── BettingControls.jsx
│   │       ├── Lobby/
│   │       │   └── LobbyScreen.jsx
│   │       ├── Player/
│   │       │   └── PlayerSeat.jsx
│   │       ├── Table/
│   │       │   ├── CommunityCards.jsx
│   │       │   ├── GameScreen.jsx
│   │       │   └── PokerTable.jsx
│   │       └── UI/
│   │           ├── ActionTimer.jsx
│   │           ├── ChipStack.jsx
│   │           ├── GameOverScreen.jsx
│   │           ├── PlayingCard.jsx
│   │           └── WinnerOverlay.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── vercel.json                ← Vercel SPA rewrite rule
│   └── .env.example               ← Copy to .env and fill in
│
└── server/                        ← Node.js backend (Express + Socket.IO)
    ├── src/
    │   ├── index.js               ← Entry point
    │   ├── game/
    │   │   ├── BettingRound.js    ← One street of betting
    │   │   ├── Deck.js            ← 52-card deck, shuffle, deal
    │   │   ├── GameEngine.js      ← Full hand state machine
    │   │   └── HandEvaluator.js   ← Hand ranking + winner detection
    │   ├── rooms/
    │   │   ├── Room.js            ← Single room with GameEngine instance
    │   │   └── RoomManager.js     ← Creates/looks up rooms by code
    │   ├── socket/
    │   │   └── socketHandlers.js  ← All Socket.IO events
    │   └── tests/
    │       └── run.js             ← 29 tests (no framework needed)
    ├── package.json
    ├── railway.json               ← Railway deploy config
    └── .env.example               ← Copy to .env and fill in
```

---

## Deploy to the internet (10 minutes, free)

### 1 — Push to GitHub

Create a new repo at github.com, then:

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/poker-game.git
git push -u origin main
```

### 2 — Deploy backend to Railway

1. Go to **railway.app** → New Project → Deploy from GitHub repo
2. Select your repo → choose the **`server`** folder as the root
3. Add environment variables:
   - `NODE_ENV` = `production`
   - `CLIENT_URL` = *(fill in after step 3 — your Vercel URL)*
4. Railway auto-detects Node.js and runs `npm start`
5. Copy your Railway URL, e.g. `https://poker-server.up.railway.app`

### 3 — Deploy frontend to Vercel

1. Go to **vercel.com** → New Project → Import from GitHub
2. Set **Root Directory** to `client`
3. Add environment variable:
   - `VITE_SERVER_URL` = your Railway URL from step 2
4. Deploy → copy your Vercel URL, e.g. `https://poker-game.vercel.app`

### 4 — Wire them together

Back in Railway → your server → Variables:
- Set `CLIENT_URL` = your Vercel URL from step 3
- Railway redeploys automatically (~30 seconds)

**Share `https://poker-game.vercel.app` with your friends. Done.**

---

## Run locally

```bash
# Terminal 1
cd server
npm install
npm run dev        # runs on http://localhost:3001

# Terminal 2
cd client
npm install
npm run dev        # runs on http://localhost:5173
```

Open http://localhost:5173. Create a room in one tab, join it in another.

Run tests: `cd server && npm test`
