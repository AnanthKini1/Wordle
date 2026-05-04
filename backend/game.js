function evaluateGuess(guess, answer) {
    guess = guess.toLowerCase();
    answer = answer.toLowerCase();

    const result = new Array(5).fill('gray');
    const remaining = {};

    for (let i = 0; i < 5; i++) {
        if (guess[i] === answer[i]) {
            result[i] = 'green';
        }
        else {
            remaining[answer[i]] = (remaining[answer[i]] || 0) + 1;
        }
    }
    for (let i = 0; i < 5; i++) {
        if (result[i] === 'green') continue;
        if (remaining[guess[i]] > 0) {
            result[i] = 'yellow';
            remaining[guess[i]]--;
        }
    }
    return result;
}

module.exports = { evaluateGuess };