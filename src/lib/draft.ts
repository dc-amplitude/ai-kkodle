import { extractHangulSyllables, jamosToHangul, wordToJamos } from './jamo';

/** Append jamo key units up to max jamo slots. */
export function appendKeyboardJamos(
  jamos: string[],
  units: string[],
  maxJamos: number,
): string[] {
  const next = [...jamos];
  for (const unit of units) {
    if (next.length >= maxJamos) break;
    next.push(unit);
  }
  return next;
}

/** Live-assemble keyboard jamos to Hangul and cap by syllable count. */
export function keyboardJamosToHangul(jamos: string[], maxSyllables: number): string {
  if (jamos.length === 0) return '';
  const assembled = jamosToHangul(jamos);
  return extractHangulSyllables(assembled, maxSyllables);
}

export function hangulToKeyboardJamos(hangul: string): string[] {
  return wordToJamos(hangul);
}

export function setInputAtEnd(input: HTMLInputElement, value: string): void {
  if (input.value !== value) {
    input.value = value;
  }
  const end = value.length;
  try {
    input.setSelectionRange(end, end);
  } catch {
    /* ignore */
  }
}
