import type { PuzzleEntry } from './puzzle';

export function originBadgeLabel(entry: Pick<PuzzleEntry, 'origin'>): string {
  return entry.origin === 'loanword' ? '외래어 (영어)' : '한국어 용어';
}

export function successDefinitionHtml(entry: PuzzleEntry): string {
  const en =
    entry.origin === 'loanword' && entry.englishSource
      ? `<p class="origin-en">영어: <strong>${entry.englishSource}</strong></p>`
      : '';
  return `<div class="definition">${entry.definition}${en}</div>`;
}
