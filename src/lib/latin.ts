import type { JamoState } from './jamo';

export function normalizeLatinWord(raw: string): string {
  return raw.replace(/[^A-Za-z]/g, '');
}

export function wordToLetters(word: string): string[] {
  return [...normalizeLatinWord(word)];
}

export function lettersForGuess(raw: string): string[] {
  return wordToLetters(raw).map((c) => c.toUpperCase());
}

export function displayGuessLetters(raw: string): string {
  return lettersForGuess(raw).join('');
}

export function latinLengthsMatch(answer: string, guess: string): boolean {
  return wordToLetters(answer).length === wordToLetters(guess).length;
}

export function evaluateLatinGuess(answer: string, guess: string): JamoState[] {
  const target = wordToLetters(answer).map((c) => c.toUpperCase());
  const attempt = lettersForGuess(guess);

  if (attempt.length !== target.length) {
    throw new Error('LETTER_LENGTH_MISMATCH');
  }

  const result: JamoState[] = Array.from({ length: target.length }, () => 'absent');
  const remaining = target.reduce<Record<string, number>>((acc, j) => {
    acc[j] = (acc[j] ?? 0) + 1;
    return acc;
  }, {});

  attempt.forEach((j, i) => {
    if (j === target[i]) {
      result[i] = 'correct';
      remaining[j] = (remaining[j] ?? 0) - 1;
    }
  });

  attempt.forEach((j, i) => {
    if (result[i] === 'correct') return;
    if ((remaining[j] ?? 0) > 0) {
      result[i] = 'present';
      remaining[j]! -= 1;
    }
  });

  return result;
}

export function aggregateLatinKeyStates(
  attempts: string[],
  statuses: JamoState[][],
): Record<string, JamoState> {
  const keyStates: Record<string, JamoState> = {};
  const rank: Record<JamoState, number> = {
    empty: 0,
    absent: 1,
    present: 2,
    correct: 3,
  };

  attempts.forEach((guess, rowIdx) => {
    const letters = lettersForGuess(guess);
    const rowStates = statuses[rowIdx] ?? [];
    letters.forEach((letter, colIdx) => {
      const st = rowStates[colIdx] ?? 'absent';
      const prev = keyStates[letter] ?? 'empty';
      if (rank[st] > rank[prev]) keyStates[letter] = st;
    });
  });

  return keyStates;
}

const HANGUL = /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7A3]/;

export function containsHangul(text: string): boolean {
  return HANGUL.test(text);
}
