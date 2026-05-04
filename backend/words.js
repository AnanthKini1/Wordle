const fs = require('fs');
const path = require('path');

// parses wordle official answer list into an array
const answers = fs
  .readFileSync(path.join(__dirname, 'data/answers.txt'), 'utf-8')
  .split('\n')
  .map(w => w.trim().toLowerCase())
  .filter(w => w.length === 5);

// parses world official additional accepted guesses last into an array
const rawGuesses = fs
  .readFileSync(path.join(__dirname, 'data/valid_guesses.txt'), 'utf-8')
  .split('\n')
  .map(w => w.trim().toLowerCase())
  .filter(w => w.length === 5);

// converts to a set for fast lookups for guesses
const validGuesses = new Set([...answers, ...rawGuesses]);

console.log(`Loaded ${answers.length} answers, ${validGuesses.size} valid guesses`);

module.exports = { answers, validGuesses };