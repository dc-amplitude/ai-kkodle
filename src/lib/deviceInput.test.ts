import { describe, expect, it } from 'vitest';
import { shouldUseOnScreenKeyboardPrimary } from './deviceInput';

describe('deviceInput', () => {
  it('exports touch keyboard helper', () => {
    expect(typeof shouldUseOnScreenKeyboardPrimary()).toBe('boolean');
  });
});
