import { describe, expect, it } from 'vitest';
import { evaluateGuess, isWin, wordToJamos } from './jamo';

describe('jamo', () => {
  it('decomposes hangul to jamo units', () => {
    expect(wordToJamos('퍼널')).toEqual(['ㅍ', 'ㅓ', 'ㄴ', 'ㅓ', 'ㄹ']);
  });

  it('scores correct/present/absent like wordle', () => {
    const states = evaluateGuess('퍼널', '터널');
    expect(states.filter((s) => s === 'correct').length).toBeGreaterThan(0);
    expect(states.some((s) => s === 'present' || s === 'absent')).toBe(true);
  });

  it('detects win', () => {
    const states = evaluateGuess('프롬프트', '프롬프트');
    expect(isWin(states)).toBe(true);
  });
});
