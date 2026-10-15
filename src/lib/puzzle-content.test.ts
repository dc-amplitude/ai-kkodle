import { describe, expect, it } from 'vitest';
import { contentValidationErrors, GAME_BANNED_PHRASES } from '../../scripts/content-rules.mjs';
import puzzles from '../../data/puzzles.json';
import type { PuzzleEntry } from './puzzle';
import { syllableCount } from './jamo';
import { wordToLetters } from './latin';
import { getPracticePuzzle } from './puzzle';

describe('puzzle content quality', () => {
  const list = puzzles as PuzzleEntry[];

  it('every entry passes shared content rules', () => {
    for (const p of list) {
      const errors = contentValidationErrors(p);
      expect(errors, errors.join('\n')).toEqual([]);
    }
  });

  it('every entry has sources (1–3 https URLs)', () => {
    for (const p of list) {
      expect(Array.isArray(p.sources)).toBe(true);
      expect(p.sources.length).toBeGreaterThanOrEqual(1);
      expect(p.sources.length).toBeLessThanOrEqual(3);
      for (const url of p.sources) {
        expect(url).toMatch(/^https:\/\//);
      }
    }
  });

  it('no definition or hint references the game itself', () => {
    for (const p of list) {
      for (const field of ['definition', 'usage', 'example', 'startingHint', 'etymology'] as const) {
        const text = p[field];
        for (const banned of GAME_BANNED_PHRASES) {
          expect(text.includes(banned), `${p.word}.${field} contains "${banned}"`).toBe(false);
        }
      }
    }
  });

  it('starting hints do not contain the answer word', () => {
    for (const p of list) {
      expect(p.startingHint.includes(p.word), p.word).toBe(false);
      expect(p.startingHint.toUpperCase().includes(p.word.toUpperCase()), p.word).toBe(false);
    }
  });

  it('ko examples use Korean; en examples use 예: prefix', () => {
    for (const p of list) {
      expect(p.example.startsWith('예:')).toBe(true);
      if (p.script === 'ko') {
        expect(/\p{Script=Hangul}/u.test(p.example)).toBe(true);
      }
    }
  });

  it('practice pool matches normal-tier length rules', () => {
    for (let seed = 0; seed < 40; seed++) {
      const p = getPracticePuzzle(seed, 'normal');
      if (p.script === 'en') {
        const n = wordToLetters(p.word).length;
        expect(n).toBeGreaterThanOrEqual(2);
        expect(n).toBeLessThanOrEqual(6);
      } else {
        expect(syllableCount(p.word)).toBeGreaterThanOrEqual(2);
        expect(syllableCount(p.word)).toBeLessThanOrEqual(3);
      }
    }
  });
});
