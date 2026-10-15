import { describe, expect, it } from 'vitest';
import {
  definitionClue,
  firstSyllableClue,
  hintMessage,
  hintsRemaining,
  jamoPositionClue,
} from './hints';
import type { Puzzle } from './puzzle';

const sample: Puzzle = {
  id: 't',
  word: '프롬프트',
  definition: 'AI에게 지시·맥락을 전달하는 입력 문장이에요.',
  jamoCount: 9,
  origin: 'loanword',
  englishSource: 'prompt',
};

describe('hints', () => {
  it('uses definition as tier-1 clue without the answer word', () => {
    expect(definitionClue(sample.definition, sample.word)).toBe(sample.definition);
    expect(definitionClue('프롬프트는 문장이에요.', '프롬프트')).not.toContain('프롬프트');
  });

  it('reveals jamo position and first syllable', () => {
    expect(jamoPositionClue('데일리', 0)).toEqual({ position: 1, jamo: 'ㄷ' });
    expect(firstSyllableClue('데일리')).toBe('데');
  });

  it('builds tier messages', () => {
    expect(hintMessage(1, sample)).toContain('AI');
    expect(hintMessage(2, sample)).toContain('번째 자모');
    expect(hintMessage(3, sample)).toContain('첫 음절');
  });

  it('counts remaining paid hints (tier 1 is free)', () => {
    expect(hintsRemaining(0)).toBe(2);
    expect(hintsRemaining(1)).toBe(1);
    expect(hintsRemaining(2)).toBe(0);
  });
});
