import { wordToLetters } from '../lib/latin';
import type { JamoState as CellState } from '../lib/jamo';

export function renderLatinPreviewHtml(
  answerWord: string,
  rowLetters: string[],
  states: CellState[] | undefined,
  mode: 'live' | 'submitted' | 'idle',
): string {
  const letters = wordToLetters(answerWord);
  return letters
    .map((_, colIdx) => {
      const letter = rowLetters[colIdx] ?? '';
      const st = states?.[colIdx];
      const allCorrect = st === 'correct';
      const slotClass = mode === 'submitted' && allCorrect ? ' syl-correct' : '';
      const bigState = mode === 'live' && letter ? 'tbd' : 'empty';
      const display = letter ? letter.toUpperCase() : '';
      return `<div class="syllable-preview-slot${slotClass}" data-letter="${colIdx + 1}">
        <div class="tile tile-syllable tile-preview ${bigState}">${display}</div>
      </div>`;
    })
    .join('');
}

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
