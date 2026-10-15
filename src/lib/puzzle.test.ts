import { describe, expect, it } from 'vitest';
import { jamosToHangul, syllableCount, wordToJamos } from './jamo';
import { getAllPuzzles, getDailyPuzzle, getPracticePuzzle, getSeoulDateString } from './puzzle';

describe('daily puzzle', () => {
  it('returns the same puzzle for the same Seoul date', () => {
    const a = getDailyPuzzle('2026-03-01');
    const b = getDailyPuzzle('2026-03-01');
    expect(a.word).toBe(b.word);
    expect(a.id).toBe(b.id);
  });

  it('uses explicit date entry when present', () => {
    const today = getSeoulDateString(new Date('2026-10-15T01:00:00Z'));
    expect(today).toBe('2026-10-15');
    const p = getDailyPuzzle('2026-10-15');
    expect(p.word).toBe('데일리');
  });
});

describe('puzzle seed words', () => {
  it('every puzzle has consistent jamoCount and is jamo-guessable', () => {
    for (const p of getAllPuzzles()) {
      const jamos = wordToJamos(p.word);
      expect(p.jamoCount).toBe(jamos.length);
      expect(jamosToHangul(jamos)).toBe(p.word);
    }
  });
});

describe('practice pool', () => {
  it('defaults to 2-3 syllable words for easy/normal tiers', () => {
    for (let seed = 0; seed < 20; seed++) {
      const p = getPracticePuzzle(seed, 'normal');
      expect(syllableCount(p.word)).toBeGreaterThanOrEqual(2);
      expect(syllableCount(p.word)).toBeLessThanOrEqual(3);
    }
  });

  it('hard tier can pick longer words', () => {
    const words = new Set(
      Array.from({ length: 120 }, (_, i) => getPracticePuzzle(i, 'hard').word),
    );
    const hasLong = [...words].some((w) => syllableCount(w) >= 4);
    expect(hasLong).toBe(true);
  });
});
