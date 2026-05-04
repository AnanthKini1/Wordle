const { evaluateGuess } = require('./game');

const cases = [
  { guess: 'geese', answer: 'speed', expected: ['gray', 'yellow', 'green', 'yellow', 'gray'] },
  { guess: 'banal', answer: 'alloy', expected: ['gray', 'yellow', 'gray', 'gray', 'yellow'] },
  { guess: 'llama', answer: 'alloy', expected: ['yellow', 'green', 'yellow', 'gray', 'gray'] },
  { guess: 'level', answer: 'lemon', expected: ['green', 'green', 'gray', 'gray', 'gray'] },
  { guess: 'hello', answer: 'hello', expected: ['green', 'green', 'green', 'green', 'green'] },
  { guess: 'world', answer: 'hello', expected: ['gray', 'yellow', 'gray', 'green', 'gray'] },
];

for (const { guess, answer, expected } of cases) {
  const actual = evaluateGuess(guess, answer);
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${pass ? '✓' : '✗'} ${guess} vs ${answer}`);
  if (!pass) {
    console.log(`  expected: ${expected.join(', ')}`);
    console.log(`  actual:   ${actual.join(', ')}`);
  }
}