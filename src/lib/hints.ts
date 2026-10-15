import { wordToJamos } from './jamo';
import type { Puzzle } from './puzzle';

/** Tier 1 (definition) is free at game start; tiers 2–3 are progressive button hints. */
export const HINT_TIER_COUNT = 3;
export const PAID_HINT_COUNT = 2;
export const FREE_HINT_TIER = 0 as const;

export type HintTier = 1 | 2 | 3;

/** Strip answer word if it ever appears in the definition text. */
export function definitionClue(definition: string, word: string): string {
  const trimmed = definition.trim();
  if (!trimmed) return 'AI·제품 용어입니다.';
  if (!trimmed.includes(word)) return trimmed;
  return trimmed.replaceAll(word, '○○').replace(/\s+/g, ' ').trim();
}

export function jamoPositionClue(word: string, position = 0): { position: number; jamo: string } {
  const jamos = wordToJamos(word);
  const idx = Math.min(Math.max(0, position), jamos.length - 1);
  return { position: idx + 1, jamo: jamos[idx] ?? '' };
}

export function firstSyllableClue(word: string): string {
  const syllables = [...word.replace(/\s/g, '')];
  return syllables[0] ?? '';
}

export function hintMessage(tier: HintTier, puzzle: Puzzle): string {
  switch (tier) {
    case 1:
      return definitionClue(puzzle.definition, puzzle.word);
    case 2: {
      const { position, jamo } = jamoPositionClue(puzzle.word, 0);
      return `${position}번째 자모는 「${jamo}」입니다.`;
    }
    case 3: {
      const syl = firstSyllableClue(puzzle.word);
      return `첫 음절은 「${syl}」로 시작합니다.`;
    }
    default:
      return '';
  }
}

/** Remaining button hints (excludes free tier-1 definition). */
export function hintsRemaining(paidHintsRevealed: number): number {
  return Math.max(0, PAID_HINT_COUNT - paidHintsRevealed);
}

export function paidHintTier(paidHintsRevealed: number): HintTier {
  return (paidHintsRevealed + 1) as HintTier;
}
