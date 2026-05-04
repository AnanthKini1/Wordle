import { useState, useEffect, useCallback } from 'react';
import { startGame, submitGuess, getAnswer, type Guess, type Status } from './api';
import './Game.css';

const MAX_TRIES = 5;
const WORD_LENGTH = 5;

export default function Game() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [status, setStatus] = useState<Status>('active');
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);

  // starts game
  useEffect(() => {
    startGame()
      .then(state => setGameId(state.gameId))
      .catch(err => setError(err.message));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!gameId || status !== 'active') return;
    if (currentGuess.length !== WORD_LENGTH) {
      setError(`Guess must be ${WORD_LENGTH} letters`);
      return;
    }

    try {
      const res = await submitGuess(gameId, currentGuess);
      setGuesses(res.guesses);
      setStatus(res.status);
      setCurrentGuess('');
      setError(null);

      if (res.status === 'lost') {
        const a = await getAnswer(gameId);
        setAnswer(a);
      } else if (res.status === 'won') {
        setAnswer(currentGuess.toLowerCase());
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, [gameId, currentGuess, status]);

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
          <div key={rowIdx} className="row">
            {Array.from(row.word).map((letter, colIdx) => {
              const color = row.colors[colIdx];
              const filled = letter.trim() !== '';
              const className = `tile ${color || ''} ${filled && row.isCurrent ? 'filled' : ''}`;
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

      {status === 'won' && (
        <div className="result win">You got it! The word was {answer?.toUpperCase()}.</div>
      )}
      {status === 'lost' && (
        <div className="result loss">Out of tries. The word was {answer?.toUpperCase()}.</div>
      )}
    </div>
  );
}