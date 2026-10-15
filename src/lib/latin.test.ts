import { describe, expect, it } from 'vitest';
import { evaluateLatinGuess, lettersForGuess } from './latin';

describe('latin guess', () => {
  it('evaluates case-insensitive Wordle feedback', () => {
    const states = evaluateLatinGuess('GPU', 'gpu');
    expect(states).toEqual(['correct', 'correct', 'correct']);
  });

  it('handles duplicate letters', () => {
    const states = evaluateLatinGuess('LLM', 'LML');
    expect(states.filter((s) => s === 'correct').length).toBe(1);
    expect(states.filter((s) => s === 'present').length).toBeGreaterThan(0);
  });

  it('normalizes guess letters', () => {
    expect(lettersForGuess('gpU')).toEqual(['G', 'P', 'U']);
  });
});
