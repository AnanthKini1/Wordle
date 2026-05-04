const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export type Color = 'gray' | 'yellow' | 'green';
export type Status = 'active' | 'won' | 'lost';

export interface Guess {
  word: string;
  colors: Color[];
}

export interface GameState {
  gameId: string;
  guesses: Guess[];
  triesRemaining: number;
  status: Status;
}

export interface GuessResponse {
  colors: Color[];
  guess: string;
  triesRemaining: number;
  status: Status;
  guesses: Guess[];
}

export async function startGame(): Promise<GameState> {
  const res = await fetch(`${BASE_URL}/api/game`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to start game');
  const data = await res.json();
  return { gameId: data.gameId, guesses: [], triesRemaining: data.triesRemaining, status: data.status };
}

export async function submitGuess(gameId: string, guess: string): Promise<GuessResponse> {
  const res = await fetch(`${BASE_URL}/api/game/${gameId}/guess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guess }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Guess failed');
  return data;
}

export async function getAnswer(gameId: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/game/${gameId}/answer`);
  if (!res.ok) throw new Error('Failed to get answer');
  const data = await res.json();
  return data.answer;
}