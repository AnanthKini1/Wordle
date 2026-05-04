const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { answers, validGuesses } = require('./words');
const { evaluateGuess } = require('./game');

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));
app.use(express.json());

const sessions = new Map();
const MAX_TRIES = 5;

function getDailyWord() {
  const dayIndex = Math.floor(Date.now() / 86400000);
  return answers[dayIndex % answers.length];
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// starts a new game
app.post('/api/game', (req, res) => {
  const gameId = crypto.randomUUID();
  const session = {
    id: gameId,
    answer: getDailyWord(),
    guesses: [],         // array of { word, colors }
    triesUsed: 0,
    status: 'active',    // 'active' | 'won' | 'lost'
    createdAt: Date.now(),
  };
  sessions.set(gameId, session);
  res.json({
    gameId,
    triesRemaining: MAX_TRIES,
    status: session.status,
  });
});

// submit a guess
app.post('/api/game/:id/guess', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Game not found' });
  if (session.status !== 'active') {
    return res.status(400).json({ error: 'Game already over', status: session.status });
  }

  const guess = (req.body.guess || '').toLowerCase().trim();

  if (guess.length !== 5) {
    return res.status(400).json({ error: 'Guess must be 5 letters' });
  }
  if (!/^[a-z]{5}$/.test(guess)) {
    return res.status(400).json({ error: 'Guess must be letters only' });
  }
  if (!validGuesses.has(guess)) {
    return res.status(400).json({ error: 'Not a valid word' });
  }

  const colors = evaluateGuess(guess, session.answer);
  session.guesses.push({ word: guess, colors });
  session.triesUsed++;

  if (guess === session.answer) {
    session.status = 'won';
  } else if (session.triesUsed >= MAX_TRIES) {
    session.status = 'lost';
  }

  res.json({
    colors,
    guess,
    triesRemaining: MAX_TRIES - session.triesUsed,
    status: session.status,
    guesses: session.guesses,
  });
});

// reveals the answer 
app.get('/api/game/:id/answer', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Game not found' });
  res.json({ answer: session.answer });
});

// gets the current game state
app.get('/api/game/:id', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Game not found' });
  res.json({
    gameId: session.id,
    guesses: session.guesses,
    triesRemaining: MAX_TRIES - session.triesUsed,
    status: session.status,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});