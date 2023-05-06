const CORRECT_POSITION = 0;
const WRONG_POSITION = 1;
const NOT_IN_STRING = 2;

// You can modify state inside makeGuess, changes will be
// persisted across all the attempts made for a given word
let state = {};
const makeGuess=(a,f)=>(s=>!s.g?(s.g="salet"):((m,h)=>(
    s.s=s.s??h.map(()=>({b:new Set()})),s.r=s.r??new Set(),
    h.map((c,i)=>f[i]===1&&s.r.add(c)&&m.push(c)),
    h.map((c,i)=>!s.s[i].f&&(
        f[i]==0&&(s.s[i].f=c,s.r.add(c)),
        f[i]==1&&s.s[i].b.add(c),
        f[i]==2&&h.map((_,j)=>(!s.s[j].f&&(!m.includes(c)||i===j))&&s.s[j].b.add(c)))),
    (r=>s.g=a.find(x=>r.test(x)))
        (new RegExp(`^${[...s.r].map(c=>`(?=.*${c})`).join("")}${s.s.map(p=>p.f?p.f:p.b.size?`[^${[...p.b].join("")}]`:".").join("")}$`))))
    ([],[...s.g]))(state);

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
  return [...word].map((_, i) => getFeedbackAtIndex(word, guess, i));
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
  const words = text.split("\n").filter(Boolean);
  console.log("There are ", words.length, "words.");
  //testMakeGuess(words, 340, 25, 6, 1);
  testMakeGuess(words);
}

main();
