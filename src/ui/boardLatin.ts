import { wordToLetters } from '../lib/latin';
import type { JamoState as CellState } from '../lib/jamo';

export function renderLatinBoardRowHtml(
  answerWord: string,
  rowLetters: string[],
  states: CellState[] | undefined,
  emptyState: CellState | 'tbd' = 'empty',
): string {
  const letters = wordToLetters(answerWord);
  return letters
    .map((_, colIdx) => {
      const letter = rowLetters[colIdx] ?? '';
      const st = states?.[colIdx] ?? (letter ? emptyState : 'empty');
      const display = letter ? letter.toUpperCase() : '';
      return `<div class="tile ${st}" data-state="${st}">${display}</div>`;
    })
    .join('');
}
