import { describe, expect, it } from 'vitest';
import { appendKeyboardJamos, keyboardJamosToHangul } from './draft';

describe('keyboard draft assembly', () => {
  it('assembles jamos into syllables live (ㄱㅏㄴ -> 간)', () => {
    let jamos = appendKeyboardJamos([], ['ㄱ', 'ㅏ'], 10);
    expect(keyboardJamosToHangul(jamos, 3)).toBe('가');
    jamos = appendKeyboardJamos(jamos, ['ㄴ'], 10);
    expect(keyboardJamosToHangul(jamos, 3)).toBe('간');
  });
});
