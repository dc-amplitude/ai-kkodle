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
  definition: '모델에게 역할·지시·예시를 전달하는 입력 텍스트다.',
  usage: '챗봇·코파일럿에서 답 품질을 좌우한다.',
  example: '예: 지시문을 세 번 고쳤다.',
  startingHint: '모델에게 무엇을 어떻게 해 달라고 적어 넣는 문장',
  etymology: '영어 prompt(앞세우다)에서.',
  category: 'ai',
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
    expect(hintMessage(1, sample)).toContain('모델');
    expect(hintMessage(2, sample)).toContain('번째 자모');
    expect(hintMessage(3, sample)).toContain('첫 음절');
  });

  it('counts remaining paid hints (tier 1 is free)', () => {
    expect(hintsRemaining(0)).toBe(2);
    expect(hintsRemaining(1)).toBe(1);
    expect(hintsRemaining(2)).toBe(0);
  });
});
