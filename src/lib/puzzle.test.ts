import { describe, expect, it } from 'vitest';
import { jamosToHangul, wordToJamos } from './jamo';
import { getAllPuzzles, getDailyPuzzle, getSeoulDateString } from './puzzle';

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
