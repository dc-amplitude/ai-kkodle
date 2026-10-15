import { describe, expect, it } from 'vitest';
import { processInputText } from './inputLatin';

describe('inputLatin', () => {
  it('converts qwerty romanization to hangul', () => {
    const r = processInputText('rlghlrtj', 5);
    expect(r.hangul).toBe('기획서');
    expect(r.convertedFromQwerty).toBe(true);
  });

  it('rejects non-hangul input with no syllables', () => {
    const r = processInputText('12345', 5);
    expect(r.rejectedNonHangul).toBe(true);
    expect(r.inlineMessage).toContain('한글로');
  });

  it('keeps hangul-only input', () => {
    expect(processInputText('퍼널', 2).hangul).toBe('퍼널');
  });
});
