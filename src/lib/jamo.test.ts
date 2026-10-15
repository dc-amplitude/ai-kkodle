import { describe, expect, it } from 'vitest';
import {
  aggregateKeyStates,
  evaluateGuess,
  extractHangulSyllables,
  isSyllableFullyCorrect,
  isWin,
  jamoSyllableIndexMap,
  jamosToHangul,
  wordToJamos,
} from './jamo';
import { jamosForKey } from '../ui/keyboard';

describe('jamo', () => {
  it('decomposes hangul to jamo units', () => {
    expect(wordToJamos('퍼널')).toEqual(['ㅍ', 'ㅓ', 'ㄴ', 'ㅓ', 'ㄹ']);
  });

  it('splits compound vowels in disassemble the same for answer and guess', () => {
    const target = wordToJamos('회의록');
    expect(target).toEqual(['ㅎ', 'ㅗ', 'ㅣ', 'ㅇ', 'ㅡ', 'ㅣ', 'ㄹ', 'ㅗ', 'ㄱ']);
    expect(target.length).toBe(9);
    const states = evaluateGuess('회의록', '회의록');
    expect(states).toHaveLength(9);
    expect(isWin(states)).toBe(true);
  });

  it('handles complex final jamo (겹받침)', () => {
    expect(wordToJamos('값')).toEqual(['ㄱ', 'ㅏ', 'ㅂ', 'ㅅ']);
    expect(evaluateGuess('값', '값')).toHaveLength(4);
  });

  it('round-trips jamos to hangul via assemble', () => {
    for (const word of ['회의록', '데일리', '프롬프트', '퍼널']) {
      const jamos = wordToJamos(word);
      expect(jamosToHangul(jamos)).toBe(word);
    }
  });

  it('extracts hangul syllables without truncating to latin length', () => {
    expect(extractHangulSyllables('rks회의록xyz', 3)).toBe('회의록');
    expect(extractHangulSyllables('abc', 3)).toBe('');
  });

  it('scores correct/present/absent like wordle', () => {
    const states = evaluateGuess('퍼널', '터널');
    expect(states.filter((s) => s === 'correct').length).toBeGreaterThan(0);
    expect(states.some((s) => s === 'present' || s === 'absent')).toBe(true);
  });

  it('marks syllable groups fully correct', () => {
    const map = jamoSyllableIndexMap('데일');
    const states = evaluateGuess('데일', '데일');
    expect(isSyllableFullyCorrect(states, map, 0)).toBe(true);
    expect(isSyllableFullyCorrect(states, map, 1)).toBe(true);
  });

  it('detects win', () => {
    const states = evaluateGuess('프롬프트', '프롬프트');
    expect(isWin(states)).toBe(true);
  });

  it('aggregates keyboard key colors from guesses', () => {
    const states = aggregateKeyStates(['퍼널'], [evaluateGuess('퍼널', '퍼널')]);
    expect(states['ㅍ']).toBe('correct');
    expect(states['ㄹ']).toBe('correct');
  });
});

describe('keyboard jamo units', () => {
  it('maps compound vowel keys to disassemble-compatible jamos', () => {
    expect(jamosForKey('ㅚ')).toEqual(['ㅗ', 'ㅣ']);
    expect(jamosForKey('ㅢ')).toEqual(['ㅡ', 'ㅣ']);
    expect(jamosForKey('ㄱ')).toEqual(['ㄱ']);
  });
});
