import type { PuzzleEntry } from './puzzle';

export function scriptBadgeLabel(entry: Pick<PuzzleEntry, 'script'>): string {
  return entry.script === 'en' ? '영어 정답' : '한글 정답';
}

export function categoryBadgeLabel(entry: Pick<PuzzleEntry, 'category'>): string {
  return entry.category === 'ai' ? 'AI 용어' : 'IT 기초';
}

export function originBadgeLabel(entry: Pick<PuzzleEntry, 'origin'>): string {
  return entry.origin === 'loanword' ? '외래어 (영어)' : '한국어 용어';
}

/** Mask answer word in prose (e.g. example) when the puzzle is not yet solved. */
export function maskAnswerInText(text: string, word: string): string {
  const trimmed = text.trim();
  if (!trimmed || !word) return trimmed;
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return trimmed.replace(new RegExp(escaped, 'gi'), '○○').replace(/\s+/g, ' ').trim();
}

export function answerExplanationHtml(
  entry: PuzzleEntry,
  options: { revealAnswer?: boolean } = {},
): string {
  const reveal = options.revealAnswer !== false;
  const exampleHtml = reveal ? entry.example : maskAnswerInText(entry.example, entry.word);
  const en =
    entry.origin === 'loanword' && entry.englishSource
      ? `<p class="origin-en">영어: <strong>${entry.englishSource}</strong></p>`
      : '';
  return `<div class="definition">
    <p class="def-line"><span class="def-label">의미</span> ${entry.definition}</p>
    <p class="def-line"><span class="def-label">쓰임</span> ${entry.usage}</p>
    <p class="def-example">${exampleHtml}</p>
    <p class="def-line def-etymology"><span class="def-label">어원</span> ${entry.etymology}</p>
    ${en}
  </div>`;
}

export function successDefinitionHtml(entry: PuzzleEntry): string {
  return answerExplanationHtml(entry, { revealAnswer: true });
}
