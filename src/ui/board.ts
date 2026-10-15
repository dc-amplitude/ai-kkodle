import { disassembleToGroups } from 'es-hangul';
import {
  isSyllableFullyCorrect,
  jamoSyllableIndexMap,
  jamosToHangul,
  normalizeGuess,
  wordToJamos,
  type JamoState,
} from '../lib/jamo';

function syllableGroups(answerWord: string): string[][] {
  return disassembleToGroups(normalizeGuess(answerWord));
}

/** Compose display syllable from jamos aligned to one syllable slot (may be partial while typing). */
export function syllableDisplayFromJamos(jamosInSyllable: string[]): string {
  const filled = jamosInSyllable.filter((j) => j);
  if (filled.length === 0) return '';
  try {
    return jamosToHangul(filled);
  } catch {
    return filled.join('');
  }
}

function jamoTileHtml(letter: string, st: JamoState | 'tbd' | 'empty', colIdx: number): string {
  return `<div class="tile tile-jamo ${st}" data-state="${st}" data-jamo-idx="${colIdx}">${letter}</div>`;
}

export function renderBoardRowHtml(
  answerWord: string,
  rowJamos: string[],
  states: JamoState[] | undefined,
  emptyState: JamoState | 'tbd' = 'empty',
): string {
  const groups = syllableGroups(answerWord);
  const map = jamoSyllableIndexMap(answerWord);
  const totalJamos = wordToJamos(answerWord).length;

  return groups
    .map((_, sylIdx) => {
      const colIndices: number[] = [];
      for (let i = 0; i < totalJamos; i++) {
        if (map[i] === sylIdx) colIndices.push(i);
      }

      const jamosForSyl = colIndices.map((i) => rowJamos[i] ?? '');
      const sylChar = syllableDisplayFromJamos(jamosForSyl);

      const sylCorrect =
        states && isSyllableFullyCorrect(states, map, sylIdx) ? ' syl-correct' : '';

      const jamoStrip = colIndices
        .map((colIdx) => {
          const letter = rowJamos[colIdx] ?? '';
          const st = states?.[colIdx] ?? (letter ? emptyState : 'empty');
          return jamoTileHtml(letter, st, colIdx);
        })
        .join('');

      const bigState =
        states && colIndices.every((i) => states[i] === 'correct')
          ? 'correct'
          : jamosForSyl.some((j) => j)
            ? emptyState === 'tbd'
              ? 'tbd'
              : 'empty'
            : 'empty';

      return `<div class="syllable-unit${sylCorrect}" data-syllable="${sylIdx + 1}">
        <div class="tile tile-syllable ${bigState}" data-state="${bigState}" aria-label="${sylIdx + 1}번째 음절">${sylChar}</div>
        <div class="jamo-strip" aria-hidden="true">${jamoStrip}</div>
      </div>`;
    })
    .join('');
}
