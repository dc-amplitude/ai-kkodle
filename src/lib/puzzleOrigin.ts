import type { PuzzleEntry } from './puzzle';

export function categoryBadgeLabel(entry: Pick<PuzzleEntry, 'category'>): string {
  return entry.category === 'ai' ? 'AI 용어' : 'IT 기초';
}

export function originBadgeLabel(entry: Pick<PuzzleEntry, 'origin'>): string {
  return entry.origin === 'loanword' ? '외래어 (영어)' : '한국어 용어';
}

export function answerExplanationHtml(entry: PuzzleEntry): string {
  const en =
    entry.origin === 'loanword' && entry.englishSource
      ? `<p class="origin-en">영어: <strong>${entry.englishSource}</strong></p>`
      : '';
  return `<div class="definition">
    <p class="def-line"><span class="def-label">의미</span> ${entry.definition}</p>
    <p class="def-line"><span class="def-label">쓰임</span> ${entry.usage}</p>
    <p class="def-example">${entry.example}</p>
    <p class="def-line def-etymology"><span class="def-label">어원</span> ${entry.etymology}</p>
    ${en}
  </div>`;
}

export function successDefinitionHtml(entry: PuzzleEntry): string {
  return answerExplanationHtml(entry);
}
