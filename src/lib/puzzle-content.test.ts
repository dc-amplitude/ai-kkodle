import { describe, expect, it } from 'vitest';
import puzzles from '../../data/puzzles.json';
import type { PuzzleEntry } from './puzzle';
import { syllableCount } from './jamo';
import { getPracticePuzzle } from './puzzle';

const GAME_BANNED = ['이 게임', '퍼즐', '챌린지 모드', '꼬들', 'wordle', 'Wordle'];

const REQUIRED: (keyof PuzzleEntry)[] = [
  'word',
  'script',
  'definition',
  'usage',
  'example',
  'startingHint',
  'etymology',
  'category',
  'origin',
];

describe('puzzle content quality', () => {
  const list = puzzles as PuzzleEntry[];

  it('every entry has required fields', () => {
    for (const p of list) {
      for (const key of REQUIRED) {
        expect(p[key], `${p.word}.${key}`).toBeTruthy();
      }
      expect(['ai', 'it-foundation']).toContain(p.category);
      expect(['ko', 'en']).toContain(p.script);
      if (p.script === 'en') {
        expect(p.word).toMatch(/^[A-Za-z]+$/);
      }
    }
  });

  it('no definition or hint references the game itself', () => {
    for (const p of list) {
      for (const field of ['definition', 'usage', 'example', 'startingHint', 'etymology'] as const) {
        const text = p[field];
        for (const banned of GAME_BANNED) {
          expect(text.includes(banned), `${p.word}.${field} contains "${banned}"`).toBe(false);
        }
      }
    }
  });

  it('starting hints do not contain the answer word', () => {
    for (const p of list) {
      expect(p.startingHint.includes(p.word), p.word).toBe(false);
    }
  });

  it('practice pool has 2–3 syllable words for normal tier', () => {
    for (let seed = 0; seed < 30; seed++) {
      const p = getPracticePuzzle(seed, 'normal');
      expect(syllableCount(p.word)).toBeGreaterThanOrEqual(2);
      expect(syllableCount(p.word)).toBeLessThanOrEqual(3);
    }
  });
});
