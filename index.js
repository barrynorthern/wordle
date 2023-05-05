const CORRECT_POSITION = 0;
const WRONG_POSITION = 1;
const NOT_IN_STRING = 2;

// You can modify state inside makeGuess, changes will be
// persisted across all the attempts made for a given word
let state = {};
const pt = (p) =>
  p.found ? p.found : p.bad.size ? `[^${[...p.bad].join("")}]` : ".";
const g = () => ({ found: null, bad: new Set() });
function makeGuess(possibleWords, feedback) {
  const previousGuess = state.guess;
  if (!previousGuess) {
    state.guess = "salet";
    return state.guess;
  }
  state.place = state.place ?? new Array(5).fill().map(g);
  state.good = state.good ?? new Set();
  const misplaced = previousGuess
    .split("")
    .filter((_, i) => feedback[i] === WRONG_POSITION);
  for (const m of misplaced) state.good.add(m);
  for (let i = 0; i < 5; i++) {
    if (state.place[i].found) continue;
    const c = previousGuess[i];
    if (feedback[i] === CORRECT_POSITION) {
      state.place[i].found = c;
      state.good.add(c);
    } else if (feedback[i] === WRONG_POSITION) {
      state.place[i].bad.add(c);
    } else if (feedback[i] === NOT_IN_STRING) {
      for (let j = 0; j < 5; j++) {
        if (!state.place[j].found && (!misplaced.includes(c) || i === j))
          state.place[j].bad.add(c);
      }
    }
  }
  const regex = new RegExp(
    `^${[...state.good].map((c) => `(?=.*${c})`).join("")}${state.place
      .map((p) => pt(p))
      .join("")}$`
  );
  const filteredWords = possibleWords.filter((word) => regex.test(word));
  state.guess = filteredWords[0];
  //console.log(previousGuess, r, feedback);
  return state.guess;
}

function getFeedbackAtIndex(word, guess, index) {
  // correct (matched) index letter
  if (guess[index] === word[index]) {
    return CORRECT_POSITION;
  }

  let wrongWord = (wrongGuess = 0);
  for (let i = 0; i < word.length; i++) {
    // count the wrong (unmatched) letters
    if (word[i] === guess[index] && guess[i] !== guess[index]) {
      wrongWord++;
    }
    if (i <= index) {
      if (guess[i] === guess[index] && word[i] !== guess[index]) {
        wrongGuess++;
      }
    }

    // an unmatched guess letter is wrong if it pairs with
    // an unmatched word letter
    if (i >= index) {
      if (wrongGuess === 0) {
        break;
      }
      if (wrongGuess <= wrongWord) {
        return WRONG_POSITION;
      }
    }
  }

  // otherwise not any
  return NOT_IN_STRING;
}

function getFeedback(word, guess) {
  return word.split("").map((_, i) => getFeedbackAtIndex(word, guess, i));
}

function testMakeGuess(
  possibleWords,
  start = 0,
  abortLimit = 25,
  successLimit = 6,
  testLimit = Number.MAX_SAFE_INTEGER
) {
  const statistics = [];
  const numWords = possibleWords.length;
  for (let i = start; i < numWords; i++) {
    if (i - start > testLimit) break;
    const word = possibleWords[i];
    state = {};
    const guessStats = [i, word];
    ++i;
    let feedback = Array(5).fill(NOT_IN_STRING);
    let found = false;
    let attempts = 0;
    for (; attempts < abortLimit; attempts++) {
      const guess = makeGuess(possibleWords, feedback);
      feedback = getFeedback(word, guess);

      if (guess === word) {
        guessStats.push(attempts);
        statistics.push(guessStats);
        console.log(guessStats);
        found = true;
        break;
      }
    }

    if (!found) {
      console.log(
        `Failed to find the correct word '${word}' after ${attempts} attempts. ABORT`
      );
      return 1;
    }
  }
  const failed = statistics.filter(
    ([index, word, attempts]) => attempts > successLimit
  );
  if (failed.length > 0) {
    console.log(`All words found, but ${failed.length} took too many attempts`);
    const maxAttempts = statistics.reduce(
      (max, [index, word, attempts]) => Math.max(max, attempts),
      0
    );
    for (let i = successLimit + 1; i < maxAttempts; ++i) {
      const count = statistics.reduce(
        (count, [index, word, attempts]) => count + Number(attempts === i),
        0
      );
      if (count > 0) {
        const first = statistics.find(
          ([index, word, attempts]) => attempts === i
        );
        console.log(
          `${count} took ${i} attempts, including #${first[0]} '${first[1]}'`
        );
      }
    }
  } else {
    console.log("All words found with allowed attempts.");
  }
  return 0;
}

async function main() {
  const response = await fetch(
    "https://raw.githubusercontent.com/barrynorthern/wordles/main/words.txt"
  );
  const text = await response.text();
  const words = text.split("\n");
  console.log("There are ", words.length, "words.");
  //testMakeGuess(words, 340, 25, 6, 1);
  testMakeGuess(words);
}

main();
