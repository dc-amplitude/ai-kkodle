import { disassemble, disassembleToGroups } from 'es-hangul';

/** Non-Hangul characters are stripped; spaces ignored. */
export function normalizeGuess(raw: string): string {
  return raw.replace(/\s/g, '').trim();
}

/** Jamo sequence for the full answer word (variable length per puzzle). */
export function wordToJamos(word: string): string[] {
  const cleaned = normalizeGuess(word);
  if (!cleaned) return [];
  return disassemble(cleaned).split('');
}

export function syllableCount(word: string): number {
  const groups = disassembleToGroups(normalizeGuess(word));
  return groups.length;
}

export type JamoState = 'correct' | 'present' | 'absent' | 'empty';

export function evaluateGuess(answer: string, guess: string): JamoState[] {
  const target = wordToJamos(answer);
  const attempt = wordToJamos(guess);

  if (attempt.length !== target.length) {
    throw new Error('JAMO_LENGTH_MISMATCH');
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

export function isWin(states: JamoState[]): boolean {
  return states.length > 0 && states.every((s) => s === 'correct');
}

export function statesToEmoji(states: JamoState[]): string {
  return states
    .map((s) => {
      if (s === 'correct') return '🟩';
      if (s === 'present') return '🟨';
      return '⬜';
    })
    .join('');
}
