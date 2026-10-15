import { assemble, disassemble, disassembleToGroups } from 'es-hangul';

/**
 * Jamo counting rules (answer + guesses must use the same path):
 * - Each Hangul syllable is split with `es-hangul` `disassemble()` into **individual jamo slots**.
 * - Compound vowels in Unicode jamo form stay one slot (e.g. syllable `애` → ㅇ·ㅐ).
 * - Compound vowels that decompose in `disassemble` use multiple slots (e.g. `회` → ㅎ·ㅗ·ㅣ, not ㅎ·ㅚ).
 * - Complex finals (e.g. `값` → ㄱ·ㅏ·ㅂ·ㅅ) match `disassemble`, not choseong-only counts.
 */
export function normalizeGuess(raw: string): string {
  return raw.replace(/\s/g, '').trim();
}

const HANGUL_SYLLABLE = /[\uAC00-\uD7A3]/;

/** Keeps complete Hangul syllables only (strips Latin/ digits), optional syllable cap. */
export function extractHangulSyllables(raw: string, maxSyllables?: number): string {
  const syllables = [...normalizeGuess(raw)].filter((ch) => HANGUL_SYLLABLE.test(ch));
  if (maxSyllables == null) return syllables.join('');
  return syllables.slice(0, maxSyllables).join('');
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

/** Rebuild Hangul from a flat jamo list (keyboard input or round-trip checks). */
export function jamosToHangul(jamos: string[]): string {
  if (jamos.length === 0) return '';
  return assemble(jamos);
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

const STATE_RANK: Record<JamoState, number> = {
  empty: 0,
  absent: 1,
  present: 2,
  correct: 3,
};

/** Best Wordle-style hint per jamo key from submitted rows. */
/** Maps each jamo column index → syllable index for a word's board layout. */
export function jamoSyllableIndexMap(word: string): number[] {
  const groups = disassembleToGroups(normalizeGuess(word));
  const map: number[] = [];
  groups.forEach((group, sylIdx) => {
    group.forEach(() => map.push(sylIdx));
  });
  return map;
}

/** True when every jamo in this syllable slot is `correct` (submitted rows). */
export function isSyllableFullyCorrect(
  states: JamoState[] | undefined,
  map: number[],
  syllableIdx: number,
): boolean {
  if (!states?.length) return false;
  let hasTile = false;
  for (let i = 0; i < map.length; i++) {
    if (map[i] !== syllableIdx) continue;
    hasTile = true;
    if (states[i] !== 'correct') return false;
  }
  return hasTile;
}

export function aggregateKeyStates(
  attempts: string[],
  statuses: JamoState[][],
): Record<string, JamoState> {
  const keyStates: Record<string, JamoState> = {};

  attempts.forEach((guess, rowIdx) => {
    const jamos = wordToJamos(guess);
    const rowStates = statuses[rowIdx] ?? [];
    jamos.forEach((jamo, colIdx) => {
      const st = rowStates[colIdx] ?? 'absent';
      const prev = keyStates[jamo] ?? 'empty';
      if (STATE_RANK[st] > STATE_RANK[prev]) {
        keyStates[jamo] = st;
      }
    });
  });

  return keyStates;
}
