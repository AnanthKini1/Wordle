# Definitely Not Wordle

A fullstack Wordle clone built for the GoLinks 2026 Fullstack Intern project.

**Live demo:** https://wordle-frontend-production.up.railway.app/
**Backend API:** https://wordle-backend-production-e546.up.railway.app/

## Stack

- React + TypeScript + Vite (frontend)
- Node.js + Express (backend)
- Deployed to Railway as two separate services
- Word lists are bundled as plain text files: original Wordle answer list (~2,300 words) and the accepted-guess list (~13,000 words)

## Run locally

Backend:
```bash
cd backend
npm install
npm run dev   # port 3001
```

Frontend:
```bash
cd frontend
npm install
npm run dev   # port 5173
```

The frontend defaults to `http://localhost:3001` for the API. Override with `VITE_API_URL` in `frontend/.env`.

## API

| Method | Path | Purpose |
|--------|------|---------|
| POST   | `/api/game` | Start a new game, returns `gameId` |
| POST   | `/api/game/:id/guess` | Submit a guess, returns colors and game state |
| GET    | `/api/game/:id/answer` | Reveal the answer (required by the spec) |
| GET    | `/api/game/:id` | Get current game state |
| GET    | `/health` | Health check |

## Decisions worth calling out

**Stateful backend with sessions.** Each game gets a UUID and the server tracks guesses, tries used, and status. I considered going stateless (frontend tracks everything, backend just colors guesses) but sessions make the backend more interesting and make the `/answer` endpoint feel coherent.

**Sessions stored in memory.** A `Map` keyed by `gameId`. Doesn't survive restarts. Fine for this project; production would use Redis or something similar. 

**Daily word via deterministic indexing.** `answers[Math.floor(Date.now() / 86_400_000) % answers.length]`. Same word for everyone, no cron, no DB. Pure function of the date. Rotation happens at UTC midnight (~5 PM Pacific) — a globally-synchronized cutoff, not a per-user-local one. A timezone-aware rotation would need either user input or geo-IP lookup, which I didn't think was worth the complexity for this project.

**Word list as a `Set`.** Validating guesses against ~15,000 words on every request — `Set.has()` is O(1) and the most efficient option. I also unioned the answer list into the guess list at startup, which prevents the edge case where today's answer isn't in the guess list (would make the game unwinnable).

**Two-pass coloring.** The classic Wordle gotcha is duplicate letters. Single-pass logic gets `GEESE` vs `SPEED` wrong. My implementation does:
1. First pass: mark greens, decrement a frequency-map "remaining letters" pool
2. Second pass: walk left-to-right, claim yellows from whatever's left in the pool

Tested against `GEESE`/`SPEED`, `BANAL`/`ALLOY`, `LLAMA`/`ALLOY`, `BOOTH`/`BROTH`.

**TypeScript on the frontend, plain JS on the backend.** TS earns its keep where data shapes matter (component props, API response types). The backend is small enough that adding a build step would cost more than it'd save.

**CORS locked to the frontend origin.** Configurable via `FRONTEND_URL` env var. No wildcards.

## Features

- 5-letter, 6-try gameplay
- Dictionary validation
- Tile flip animation on reveal (staggered left-to-right)
- Shake on invalid guesses
- On-screen keyboard with letter states (green > yellow > gray)
- Win/loss modal with play-again
- Mobile responsive
- Daily word rotation

## What I'd add with more time

- **Leaderboard.** I was debating whether this was worth adding but felt it was outside the scope of this project, as a real leaderboard requires auth and a database.
- **Hard mode.** Yellow letters in past guesses must appear in future guesses.
- **Share-results string** ("DNW 142 4/6 ⬛🟨🟩🟩🟩").
- **Persistent sessions** via Redis so restarts don't drop in-flight games.
- **Streak tracking** in localStorage.

## Repo structure

```
.
├── backend/
│   ├── data/        Word list text files
│   ├── words.js     Loads and exports answer + valid-guess lists
│   ├── game.js      Two-pass coloring algorithm
│   └── server.js    Routes, session map, CORS
└── frontend/
    └── src/
        ├── api.ts    Fetch client
        ├── Game.tsx  Game state, board, keyboard, modal
        └── App.tsx
```
