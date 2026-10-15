import type { JamoState } from '../lib/jamo';

const QWERTY_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

export function renderQwertyKeyboardHtml(keyStates: Record<string, JamoState>): string {
  const rows = QWERTY_ROWS.map(
    (row) => `
    <div class="kb-row">
      ${row
        .map((key) => {
          const st = keyStates[key] ?? 'empty';
          return `<button type="button" class="kb-key kb-latin ${st}" data-latin-key="${key}" aria-label="Letter ${key}">${key}</button>`;
        })
        .join('')}
    </div>`,
  ).join('');

  return `
    <section class="keyboard keyboard-qwerty" aria-label="영문 QWERTY 키보드">
      ${rows}
      <div class="kb-row kb-row-actions">
        <button type="button" class="kb-key kb-wide" data-action="backspace" aria-label="지우기">⌫</button>
        <button type="button" class="kb-key kb-enter" data-action="enter" aria-label="제출">입력</button>
      </div>
    </section>`;
}
