import { disassembleToGroups } from 'es-hangul';
import {
  extractHangulSyllables,
  isSyllableFullyCorrect,
  jamoSyllableIndexMap,
  normalizeGuess,
  wordToJamos,
  type JamoState,
} from '../lib/jamo';

function syllableGroups(answerWord: string): string[][] {
  return disassembleToGroups(normalizeGuess(answerWord));
}

/** One Hangul character per answer syllable slot (empty string if not typed yet). */
export function hangulSyllableSlots(text: string, slotCount: number): string[] {
  const joined = extractHangulSyllables(text, slotCount);
  const chars = [...joined.replace(/\s/g, '')];
  return Array.from({ length: slotCount }, (_, i) => chars[i] ?? '');
}

export function renderSyllablePreviewHtml(
  answerWord: string,
  syllableChars: string[],
  jamoStates: JamoState[] | undefined,
  mode: 'live' | 'submitted' | 'idle',
): string {
  const slotCount = syllableGroups(answerWord).length;
  const map = jamoSyllableIndexMap(answerWord);

  return Array.from({ length: slotCount }, (_, sylIdx) => {
    const ch = syllableChars[sylIdx] ?? '';
    const sylCorrect =
      mode === 'submitted' &&
      jamoStates &&
      isSyllableFullyCorrect(jamoStates, map, sylIdx)
        ? ' syl-correct'
        : '';
    const bigState = mode === 'live' && ch ? 'tbd' : 'empty';
    return `<div class="syllable-preview-slot${sylCorrect}" data-syllable="${sylIdx + 1}">
      <div class="tile tile-syllable tile-preview ${bigState}" data-state="${bigState}">${ch}</div>
    </div>`;
  }).join('');
}

function jamoTileHtml(letter: string, st: JamoState | 'tbd' | 'empty', colIdx: number): string {
  return `<div class="tile tile-jamo ${st}" data-state="${st}" data-jamo-idx="${colIdx}">${letter}</div>`;
}

/** Compact jamo-only guess row with syllable groups separated by gap. */
export function renderBoardRowHtml(
  answerWord: string,
  rowJamos: string[],
  states: JamoState[] | undefined,
  emptyState: JamoState | 'tbd' = 'empty',
): string {
  const map = jamoSyllableIndexMap(answerWord);
  const totalJamos = wordToJamos(answerWord).length;
  let html = '';
  let openSyl = -1;

  const closeGroup = () => {
    if (openSyl >= 0) html += '</div>';
    openSyl = -1;
  };

  for (let colIdx = 0; colIdx < totalJamos; colIdx++) {
    const sylIdx = map[colIdx] ?? 0;
    if (sylIdx !== openSyl) {
      closeGroup();
      openSyl = sylIdx;
      const sylClass =
        states && isSyllableFullyCorrect(states, map, sylIdx) ? ' syl-correct' : '';
      html += `<div class="syl-group${sylClass}" data-syllable="${sylIdx + 1}">`;
    }
    const letter = rowJamos[colIdx] ?? '';
    const st = states?.[colIdx] ?? (letter ? emptyState : 'empty');
    html += jamoTileHtml(letter, st, colIdx);
  }
  closeGroup();
  return html;
}
