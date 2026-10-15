import {
  aggregateKeyStates,
  evaluateGuess,
  extractHangulSyllables,
  isWin,
  jamosToHangul,
  syllableCount,
  wordToJamos,
  type JamoState,
} from './jamo';
import {
  aggregateLatinKeyStates,
  displayGuessLetters,
  evaluateLatinGuess,
  lettersForGuess,
  wordToLetters,
} from './latin';
import type { Puzzle, PuzzleEntry } from './puzzle';

export function isEnglishPuzzle(puzzle: Pick<PuzzleEntry, 'script'>): boolean {
  return puzzle.script === 'en';
}

export function unitCount(puzzle: Pick<PuzzleEntry, 'script' | 'word'>): number {
  return isEnglishPuzzle(puzzle) ? wordToLetters(puzzle.word).length : wordToJamos(puzzle.word).length;
}

export function unitsFromGuess(puzzle: Puzzle, guess: string): string[] {
  return isEnglishPuzzle(puzzle) ? lettersForGuess(guess) : wordToJamos(guess);
}

export function evaluatePuzzleGuess(puzzle: Puzzle, guess: string): JamoState[] {
  return isEnglishPuzzle(puzzle)
    ? evaluateLatinGuess(puzzle.word, guess)
    : evaluateGuess(puzzle.word, guess);
}

export function aggregatePuzzleKeyStates(
  puzzle: Puzzle,
  attempts: string[],
  statuses: JamoState[][],
): Record<string, JamoState> {
  return isEnglishPuzzle(puzzle)
    ? aggregateLatinKeyStates(attempts, statuses)
    : aggregateKeyStates(attempts, statuses);
}

export function draftUnitsToDisplay(puzzle: Puzzle, units: string[]): string {
  if (isEnglishPuzzle(puzzle)) {
    return units.join('');
  }
  return units.length ? jamosToHangul(units) : '';
}

export function extractDraftForPuzzle(puzzle: Puzzle, raw: string, maxSyllables?: number): string {
  if (isEnglishPuzzle(puzzle)) {
    return displayGuessLetters(raw);
  }
  return extractHangulSyllables(raw, maxSyllables);
}

export function syllablesOrLengthLabel(puzzle: Puzzle): number {
  return isEnglishPuzzle(puzzle) ? wordToLetters(puzzle.word).length : syllableCount(puzzle.word);
}

export { isWin };
