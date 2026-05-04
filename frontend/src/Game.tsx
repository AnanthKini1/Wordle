import { useState, useEffect, useCallback } from 'react';
import { startGame, submitGuess, getAnswer, type Guess, type Status } from './api';
import './Game.css';

const MAX_TRIES = 6;
const WORD_LENGTH = 5;

const KEYBOARD_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Enter','Z','X','C','V','B','N','M','Backspace'],
];

export default function Game() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [status, setStatus] = useState<Status>('active');
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [revealingRow, setRevealingRow] = useState<number | null>(null);
  const [revealedCount, setRevealedCount] = useState(0);

  // starts game
  useEffect(() => {
    startGame()
      .then(state => setGameId(state.gameId))
      .catch(err => setError(err.message));
  }, []);

  const handlePlayAgain = useCallback(async () => {
    try {
      const state = await startGame();
      setGameId(state.gameId);
      setGuesses([]);
      setCurrentGuess('');
      setStatus('active');
      setError(null);
      setAnswer(null);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!gameId || status !== 'active') return;
    if (currentGuess.length !== WORD_LENGTH) {
      setError(`Guess must be ${WORD_LENGTH} letters`);
      setShakeKey(k => k + 1);
      return;
    }

    try {
      const rowIndex = guesses.length;
      const res = await submitGuess(gameId, currentGuess);
      setGuesses(res.guesses);
      setStatus(res.status);
      setCurrentGuess('');
      setError(null);
      setRevealingRow(rowIndex);
      setRevealedCount(0);
      for (let col = 0; col < WORD_LENGTH; col++) {
        const count = col + 1;
        setTimeout(() => setRevealedCount(count), col * 200 + 50);
      }
      setTimeout(() => {
        setRevealingRow(null);
        setRevealedCount(0);
      }, (WORD_LENGTH - 1) * 200 + 600);

      if (res.status === 'lost') {
        const a = await getAnswer(gameId);
        setAnswer(a);
      } else if (res.status === 'won') {
        setAnswer(currentGuess.toLowerCase());
      }
    } catch (err: any) {
      setError(err.message);
      setShakeKey(k => k + 1);
    }
  }, [gameId, currentGuess, status, guesses]);

  // user input
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (status !== 'active') return;

      if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Backspace') {
        setCurrentGuess(g => g.slice(0, -1));
        setError(null);
      } else if (/^[a-zA-Z]$/.test(e.key) && currentGuess.length < WORD_LENGTH) {
        setCurrentGuess(g => (g + e.key).toLowerCase());
        setError(null);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentGuess, status, handleSubmit]);

  // compute best-known color per letter (green > yellow > gray)
  const colorPriority = { green: 3, yellow: 2, gray: 1 } as const;
  const letterColors: Record<string, 'green' | 'yellow' | 'gray'> = {};
  for (const guess of guesses) {
    Array.from(guess.word).forEach((letter, i) => {
      const color = guess.colors[i];
      const current = letterColors[letter];
      if (!current || colorPriority[color] > colorPriority[current]) {
        letterColors[letter] = color;
      }
    });
  }

  // builds the wordle grid
  const rows = [];
  for (let i = 0; i < MAX_TRIES; i++) {
    if (i < guesses.length) {
      rows.push({ word: guesses[i].word, colors: guesses[i].colors, isCurrent: false });
    } else if (i === guesses.length && status === 'active') {
      rows.push({ word: currentGuess.padEnd(WORD_LENGTH), colors: [], isCurrent: true });
    } else {
      rows.push({ word: ''.padEnd(WORD_LENGTH), colors: [], isCurrent: false });
    }
  }

  return (
    <div className="game">
      <h1>Definitely Not Wordle</h1>

      <div className="board">
        {rows.map((row, rowIdx) => (
          <div key={row.isCurrent ? `cur-${shakeKey}` : rowIdx} className={`row${row.isCurrent && error ? ' shake' : ''}`}>
            {Array.from(row.word).map((letter, colIdx) => {
              const color = row.colors[colIdx];
              const filled = letter.trim() !== '';
              const isRevealing = rowIdx === revealingRow;
              const colorClass = !isRevealing || colIdx < revealedCount ? (color || '') : '';
              const className = [
                'tile',
                colorClass,
                isRevealing ? `revealed delay-${colIdx}` : '',
                filled && row.isCurrent ? 'filled' : '',
              ].filter(Boolean).join(' ');
              return (
                <div key={colIdx} className={className}>
                  {letter.trim().toUpperCase()}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {error && <div className="error">{error}</div>}

      <div className="keyboard">
        {KEYBOARD_ROWS.map((row, ri) => (
          <div key={ri} className="keyboard-row">
            {row.map(key => {
              const isWide = key === 'Enter' || key === 'Backspace';
              const colorClass = !isWide ? (letterColors[key.toLowerCase()] || '') : '';
              return (
                <button
                  key={key}
                  className={['key', colorClass, isWide ? 'key-wide' : ''].filter(Boolean).join(' ')}
                  onClick={() => {
                    if (status !== 'active') return;
                    if (key === 'Enter') {
                      handleSubmit();
                    } else if (key === 'Backspace') {
                      setCurrentGuess(g => g.slice(0, -1));
                      setError(null);
                    } else if (currentGuess.length < WORD_LENGTH) {
                      setCurrentGuess(g => g + key.toLowerCase());
                      setError(null);
                    }
                  }}
                >
                  {key === 'Backspace' ? '⌫' : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {status !== 'active' && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2 className="modal-headline">
              {status === 'won' ? 'You won!' : 'Out of tries'}
            </h2>
            <div className="modal-answer">{answer?.toUpperCase()}</div>
            {status === 'won' && (
              <div className="modal-tries">Solved in {guesses.length}/{MAX_TRIES}</div>
            )}
            <button className="modal-play-again" onClick={handlePlayAgain}>
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
