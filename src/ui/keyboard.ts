import type { JamoState } from '../lib/jamo';

/** On-screen keys → jamo slots (matches `disassemble` for compound vowels). */
export const JAMO_KEY_UNITS: Record<string, string[]> = {
  'ㅘ': ['ㅗ', 'ㅏ'],
  'ㅙ': ['ㅗ', 'ㅐ'],
  'ㅚ': ['ㅗ', 'ㅣ'],
  'ㅝ': ['ㅜ', 'ㅓ'],
  'ㅞ': ['ㅜ', 'ㅔ'],
  'ㅟ': ['ㅜ', 'ㅣ'],
  'ㅢ': ['ㅡ', 'ㅣ'],
};

export const JAMO_KEYBOARD_ROWS: string[][] = [
  ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'],
  ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'],
  ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ', 'ㅚ', 'ㅢ'],
];

export function jamosForKey(key: string): string[] {
  return JAMO_KEY_UNITS[key] ?? [key];
}

export function renderKeyboardHtml(keyStates: Record<string, JamoState>): string {
  const rows = JAMO_KEYBOARD_ROWS.map(
    (row) => `
    <div class="kb-row">
      ${row
        .map((key) => {
          const st = keyStates[key] ?? 'empty';
          return `<button type="button" class="kb-key ${st}" data-jamo-key="${key}" aria-label="자모 ${key}">${key}</button>`;
        })
        .join('')}
    </div>`,
  ).join('');

  return `
    <section class="keyboard" aria-label="자모 입력 키보드">
      ${rows}
      <div class="kb-row kb-row-actions">
        <button type="button" class="kb-key kb-wide" data-action="backspace" aria-label="지우기">⌫</button>
        <button type="button" class="kb-key kb-enter" data-action="enter" aria-label="제출">입력</button>
      </div>
    </section>`;
}
