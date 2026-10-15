import {
  isSyllableFullyCorrect,
  jamoSyllableIndexMap,
  wordToJamos,
  type JamoState,
} from '../lib/jamo';

export function renderBoardRowHtml(
  answerWord: string,
  rowJamos: string[],
  states: JamoState[] | undefined,
  emptyState: JamoState | 'tbd' = 'empty',
): string {
  const jamos = wordToJamos(answerWord);
  const sylMap = jamoSyllableIndexMap(answerWord);
  let html = '';
  let openSyl = -1;

  const closeGroup = () => {
    if (openSyl >= 0) html += '</div>';
    openSyl = -1;
  };

  jamos.forEach((_, colIdx) => {
    const sylIdx = sylMap[colIdx] ?? 0;
    if (sylIdx !== openSyl) {
      closeGroup();
      openSyl = sylIdx;
      const sylClass =
        states && isSyllableFullyCorrect(states, sylMap, sylIdx) ? ' syl-correct' : '';
      html += `<div class="syl-group${sylClass}" data-syllable="${sylIdx + 1}">`;
    }
    const letter = rowJamos[colIdx] ?? '';
    const st = states?.[colIdx] ?? (letter ? emptyState : 'empty');
    html += `<div class="tile ${st}" data-state="${st}">${letter}</div>`;
  });
  closeGroup();
  return html;
}
